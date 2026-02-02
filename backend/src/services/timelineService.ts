// @ts-nocheck
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';
import AuditLogService from './auditLogService';
import { prisma } from './prismaClient';

export interface TimelineData {
  projectId: string;
  projectName: string;
  startDate: Date;
  estimatedEndDate: Date;
  phases: Array<{
    phaseId: string;
    phaseName: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    duration: number;
    tasks: Array<{
      taskId: string;
      description: string;
      startDate: Date;
      endDate: Date | null;
      status: string;
      assignedTo: string;
    }>;
  }>;
  teamAssignments: Array<{
    teamMemberId: string;
    teamMemberName: string;
    role: UserRole;
    allocation: number;
    phaseId: string;
  }>;
  conflicts: Array<{
    conflictType: 'PHASE_OVERLAP' | 'RESOURCE_OVERALLOC';
    projectId1: string;
    projectName1: string;
    projectId2?: string;
    projectName2?: string;
    description: string;
  }>;
}

export interface GetTimelineFilter {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  teamMemberId?: string;
}

class TimelineService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Get timeline data for projects, phases, tasks, and team assignments
   * @param filters Optional filters for date range, project, or team member
   * @returns Timeline data with conflicts detected
   */
  async getTimeline(filters: GetTimelineFilter): Promise<TimelineData[]> {
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
      const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

      // Build where clause
      const whereClause: any = {};

      if (filters.projectId) {
        whereClause.id = filters.projectId;
      }

      if (filters.teamMemberId) {
        whereClause.assignments = {
          some: {
            teamMemberId: filters.teamMemberId
          }
        };
      }

      if (filters.startDate || filters.endDate) {
        whereClause.OR = [
          {
            AND: [
              { startDate: { gte: startDate } },
              { startDate: { lte: endDate } }
            ]
          },
          {
            AND: [
              { estimatedEndDate: { gte: startDate } },
              { estimatedEndDate: { lte: endDate } }
            ]
          },
          {
            phases: {
              some: {
                AND: [
                  { startDate: { gte: startDate } },
                  { startDate: { lte: endDate } }
                ]
              }
            }
          }
        ];
      }

      // Fetch projects with related data
      const projects = await this.prisma.project.findMany({
        where: whereClause,
        include: {
          client: true,
          phases: {
            include: {
              assignments: {
                include: {
                  teamMember: true
                }
              },
              tasks: {
                include: {
                  assignedTeamMember: true
                }
              }
            },
            orderBy: {
              startDate: 'asc'
            }
          }
        }
      });

      // Build timeline data for each project
      const timelineData: TimelineData[] = await Promise.all(projects.map(async (project) => {
        const phasesData = await Promise.all(project.phases.map(async (phase) => {
          const tasksData = await Promise.all(phase.tasks.map(async (task) => ({
            taskId: task.id,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            status: task.status,
            assignedTo: task.assignedTeamMember?.name || 'Unassigned'
          })));

          const assignmentsData = phase.assignments.map(assignment => ({
            teamMemberId: assignment.teamMemberId,
            teamMemberName: assignment.teamMember?.name || 'Unassigned',
            role: assignment.teamMember?.role || 'TEAM_MEMBER',
            allocation: Number(assignment.workingPercentage),
            phaseId: phase.id
          }));

          return {
            phaseId: phase.id,
            phaseName: phase.phaseName,
            startDate: phase.startDate,
            endDate: phase.endDate,
            status: phase.status,
            duration: phase.duration,
            tasks: tasksData,
            teamAssignments: assignmentsData
          };
        }));

        const teamAssignments = [];
        const teamAssignmentMap = new Map<string, Set<string>>();

        phasesData.forEach(phase => {
          phase.teamAssignments.forEach(assignment => {
            const existingAssignments = teamAssignmentMap.get(assignment.teamMemberId) || new Set();
            existingAssignments.add(phase.phaseName);
            teamAssignmentMap.set(assignment.teamMemberId, existingAssignments);

            const totalAllocation = Array.from(existingAssignments).reduce((sum, phaseName) => {
              const phaseData = phasesData.find(p => p.phaseName === phaseName);
              return sum + (phaseData?.teamAssignments.find(a => a.teamMemberId === assignment.teamMemberId)?.allocation || 0);
            }, 0);

          teamAssignments.push({
            teamMemberId: assignment.teamMemberId,
            teamMemberName: assignment.teamMemberName,
            role: assignment.role,
            allocation: totalAllocation,
            phaseId: phase.id
          });
          });
        });

        return {
          projectId: project.id,
          projectName: project.name,
          startDate: project.startDate,
          estimatedEndDate: project.estimatedEndDate,
          phases: phasesData,
          teamAssignments
        };
      }));

      // Detect conflicts
      const conflicts = this.detectConflicts(timelineData, startDate, endDate);

      logger.info('Timeline data retrieved successfully', { projectCount: timelineData.length, conflictCount: conflicts.length });

      return timelineData;
    } catch (error) {
      logger.error('Failed to retrieve timeline data', { error, filters });
      throw error;
    }
  }

  /**
   * Detect conflicts in project timeline (phase overlaps and resource overallocation)
   * @param timelineData Timeline data for projects
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @returns Array of conflicts detected
   */
  private detectConflicts(timelineData: TimelineData[], startDate: Date | undefined, endDate: Date | undefined): TimelineData['conflicts'] {
    const conflicts: TimelineData['conflicts'] = [];

    // Detect phase overlaps within the same project
    const projectPhaseRanges = new Map<string, Array<{ start: Date; end: Date }>>();

    timelineData.forEach(project => {
      const ranges = project.phases.map(phase => ({
        start: new Date(phase.startDate),
        end: phase.endDate || new Date(new Date(project.estimatedEndDate).getTime() + phase.duration * 24 * 60 * 60 * 1000)
      }));

      projectPhaseRanges.set(project.projectId, ranges);
    });

    projectPhaseRanges.forEach((ranges, projectId) => {
      for (let i = 0; i < ranges.length; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
          const phase1 = ranges[i];
          const phase2 = ranges[j];

          // Check if phases overlap
          if (phase1.start < phase2.end && phase1.end > phase2.start) {
            conflicts.push({
              conflictType: 'PHASE_OVERLAP',
              projectId1: projectId,
              projectName1: timelineData.find(t => t.projectId === projectId)?.projectName || 'Unknown',
              projectId2: projectId,
              projectName2: timelineData.find(t => t.projectId === projectId)?.projectName || 'Unknown',
              description: `Phases overlap between ${new Date(phase1.start).toLocaleDateString()} - ${new Date(phase1.end).toLocaleDateString()} and ${new Date(phase2.start).toLocaleDateString()} - ${new Date(phase2.end).toLocaleDateString()}`
            });
          }
        }
      }
    });

    // Detect resource overallocation across projects
    const teamMemberAllocations = new Map<string, { projects: string[]; totalAllocation: number }>();

    timelineData.forEach(project => {
      project.teamAssignments.forEach(assignment => {
        const current = teamMemberAllocations.get(assignment.teamMemberId) || { projects: [], totalAllocation: 0 };

        current.projects.push(project.projectId);
        current.totalAllocation += assignment.allocation;

        teamMemberAllocations.set(assignment.teamMemberId, current);

        // Check if overallocated (total > 100%)
        if (current.totalAllocation > 100) {
          conflicts.push({
            conflictType: 'RESOURCE_OVERALLOC',
            projectId1: project.projectId,
            projectName1: project.projectName,
            description: `Team member ${assignment.teamMemberName} is over-allocated (${current.totalAllocation}%) across ${current.projects.length} projects`
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Get calendar events for a given month
   * @param year Year to get events for
   * @param month Month to get events for (1-12)
   * @returns Array of calendar events
   */
  async getCalendarEvents(year: number, month: number): Promise<Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resourceId: string;
    resourceType: 'PROJECT' | 'PHASE' | 'TASK';
  }>> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Fetch projects active in the month
      const projects = await this.prisma.project.findMany({
        where: {
          OR: [
            {
              startDate: { lte: endDate },
              estimatedEndDate: { gte: startDate }
            },
            {
              startDate: { gte: startDate },
              estimatedEndDate: { gte: startDate }
            }
          ]
        },
        include: {
          phases: {
            include: {
              tasks: true
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      });

      // Build calendar events
      const events = [];

      projects.forEach(project => {
        events.push({
          id: `proj-${project.id}`,
          title: project.name,
          start: new Date(project.startDate),
          end: new Date(project.estimatedEndDate),
          resourceId: project.id,
          resourceType: 'PROJECT'
        });
      });

      // Add phase events
      projects.forEach(project => {
        project.phases.forEach(phase => {
          const phaseEnd = phase.endDate ? new Date(phase.endDate) : new Date(new Date(project.estimatedEndDate).getTime() + phase.duration * 24 * 60 * 60 * 1000);

          events.push({
            id: `phase-${phase.id}`,
            title: `${phase.phaseName} Phase`,
            start: new Date(phase.startDate),
            end: phaseEnd,
            resourceId: phase.id,
            resourceType: 'PHASE'
          });
        });
      });

      // Add task events
      projects.forEach(project => {
        project.phases.forEach(phase => {
          phase.tasks.forEach(task => {
            if (task.startDate && task.startDate >= startDate && task.startDate <= endDate) {
              const taskEnd = task.endDate || new Date(task.startDate);

              events.push({
                id: `task-${task.id}`,
                title: task.description.substring(0, 50) + (task.description.length > 50 ? '...' : ''),
                start: new Date(task.startDate),
                end: taskEnd,
                resourceId: task.id,
                resourceType: 'TASK'
              });
            }
          });
        });
      });

      logger.info('Calendar events retrieved successfully', { year, month, eventCount: events.length });

      return events;
    } catch (error) {
      logger.error('Failed to retrieve calendar events', { error, year, month });
      throw error;
    }
  }

  /**
   * Log timeline access for audit purposes
   * @param userId User ID accessing timeline
   * @param action Action performed (view, filter, export)
   * @param details Additional details about the access
   */
  async logTimelineAccess(userId: string, action: string, details: string): Promise<void> {
    try {
      await AuditLogService.logCreate(
        'TimelineAccess',
        `access-${Date.now()}`,
        userId,
        'MANAGER', // Assuming managers can access timeline
        {
          action,
          details,
          timestamp: new Date()
        }
      );

      logger.info('Timeline access logged', { userId, action });
    } catch (error) {
      logger.error('Failed to log timeline access', { error, userId });
    }
  }
}

export default new TimelineService();
