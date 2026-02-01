import { UserRole } from '@prisma/client';
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
declare class TimelineService {
    private prisma;
    constructor();
    /**
     * Get timeline data for projects, phases, tasks, and team assignments
     * @param filters Optional filters for date range, project, or team member
     * @returns Timeline data with conflicts detected
     */
    getTimeline(filters: GetTimelineFilter): Promise<TimelineData[]>;
    /**
     * Detect conflicts in project timeline (phase overlaps and resource overallocation)
     * @param timelineData Timeline data for projects
     * @param startDate Optional start date filter
     * @param endDate Optional end date filter
     * @returns Array of conflicts detected
     */
    private detectConflicts;
    /**
     * Get calendar events for a given month
     * @param year Year to get events for
     * @param month Month to get events for (1-12)
     * @returns Array of calendar events
     */
    getCalendarEvents(year: number, month: number): Promise<Array<{
        id: string;
        title: string;
        start: Date;
        end: Date;
        allDay?: boolean;
        resourceId: string;
        resourceType: 'PROJECT' | 'PHASE' | 'TASK';
    }>>;
    /**
     * Log timeline access for audit purposes
     * @param userId User ID accessing timeline
     * @param action Action performed (view, filter, export)
     * @param details Additional details about the access
     */
    logTimelineAccess(userId: string, action: string, details: string): Promise<void>;
}
declare const _default: TimelineService;
export default _default;
//# sourceMappingURL=timelineService.d.ts.map