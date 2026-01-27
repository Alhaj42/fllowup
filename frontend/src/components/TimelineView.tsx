import React, { useState, useEffect } from 'react';
import TimelineService from '../services/timelineService';
import { api } from '../services/api';

interface PhaseData {
  phaseId: string;
  phaseName: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  tasks: Array<{
    taskId: string;
    description: string;
    startDate: Date;
    endDate: Date | null;
    status: string;
    assignedTo: string;
  }>;
}

interface AssignmentData {
  teamMemberId: string;
  teamMemberName: string;
  role: string;
  allocation: number;
  phaseId: string;
}

interface ProjectData {
  projectId: string;
  projectName: string;
  startDate: Date;
  estimatedEndDate: Date;
  phases: PhaseData[];
  assignments: AssignmentData[];
  conflicts: Array<{
    conflictType: string;
    description: string;
  }>;
}

interface TimelineViewProps {
  projectId?: string;
  teamMemberId?: string;
  startDate?: string;
  endDate?: string;
}

export default function TimelineView({
  projectId,
  teamMemberId,
  startDate,
  endDate,
}: TimelineViewProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);

  useEffect(() => {
    loadTimelineData();
  }, [projectId, teamMemberId, startDate, endDate]);

  const loadTimelineData = async () => {
    setLoading(true);
    setError('');

    try {
      const filters: any = {};
      if (projectId) filters.projectId = projectId;
      if (teamMemberId) filters.teamMemberId = teamMemberId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await api.get('/timeline', { params: filters });
      const timelineData = response.data || [];

      // Build project data structure
      const projectMap = new Map<string, ProjectData>();

      timelineData.forEach((item: any) => {
        let project = projectMap.get(item.projectId);

        if (!project) {
          project = {
            projectId: item.projectId,
            projectName: item.projectName,
            startDate: new Date(item.startDate),
            estimatedEndDate: new Date(item.estimatedEndDate),
            phases: [],
            assignments: [],
            conflicts: [],
          };
          projectMap.set(item.projectId, project);
        }

        // Add phase data
        if (item.phases) {
          item.phases.forEach((phase: any) => {
            const phaseData: {
              phaseId: phase.phaseId,
              phaseName: phase.phaseName,
              startDate: new Date(phase.startDate),
              endDate: phase.endDate ? new Date(phase.endDate) : null,
              status: phase.status,
              tasks: phase.tasks || [],
            };
            project.phases.push(phaseData);
          });
        }

        // Add assignment data
        if (item.teamAssignments) {
          item.teamAssignments.forEach((assignment: any) => {
            const assignmentData: {
              teamMemberId: assignment.teamMemberId,
              teamMemberName: assignment.teamMemberName,
              role: assignment.teamMember?.role || 'TEAM_MEMBER',
              allocation: assignment.totalAllocation,
              phaseId: assignment.phaseId,
            };
            project.assignments.push(assignmentData);
          });
        }

        // Add conflict data
        if (item.conflicts && item.conflicts.length > 0) {
          item.conflicts.forEach((conflict: any) => {
            project.conflicts.push({
              conflictType: conflict.conflictType,
              description: conflict.description,
            });
          });
        }
      });

      setProjects(Array.from(projectMap.values()));
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load timeline data. Please try again.');
      setLoading(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getPhaseColor = (status: string): string => {
    switch (status) {
      case 'PLANNED':
        return 'bg-gray-200';
      case 'IN_PROGRESS':
        return 'bg-blue-200';
      case 'COMPLETED':
        return 'bg-green-200';
      case 'DELAYED':
        return 'bg-yellow-200';
      case 'CANCELLED':
        return 'bg-red-200';
      default:
        return 'bg-gray-200';
    }
  };

  const getConflictColor = (conflictType: string): string => {
    switch (conflictType) {
      case 'PHASE_OVERLAP':
        return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'RESOURCE_OVERALLOC':
        return 'bg-red-100 border-red-400 text-red-800';
      default:
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
    }
  };

  const calculateProjectDuration = (startDate: Date, endDate: Date): number => {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.ceil(diffDays);
  };

  const calculatePhaseDuration = (startDate: Date, endDate: Date | null, duration: number): number => {
    if (duration) return duration;
    if (endDate && startDate) {
      const diffTime = endDate.getTime() - startDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const calculatePhaseProgress = (phase: PhaseData): number => {
    if (!phase.tasks || phase.tasks.length === 0) {
      return 0;
    }

    const completedTasks = phase.tasks.filter(t => t.status === 'COMPLETED');
    return Math.round((completedTasks.length / phase.tasks.length) * 100);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="ml-4 text-lg text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h8m-4-4v4m0 4H4m6 16h.01M12 2a2 2 0 110-2 2 0 012 2z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a2 2 0 01-2.003 2.003 2.003 2.003H5a2 2 0 012 2.003 2.003 2.003z"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Timeline</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={loadTimelineData}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17l-7-7 5 5 5 5 5z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a2 2 0 01-2.003 2.003 2.003 2.003H5a2 2 0 012 2.003 2.003 2.003z"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Projects Found</h3>
          <p className="mt-2 text-gray-600">
            No projects match your criteria. Try adjusting the filters.
          </p>
        </div>
      </div>
    );
  }

  const filteredProjects = showConflictsOnly
    ? projects.filter(p => p.conflicts.length > 0)
    : projects;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Timeline & Gantt Chart</h1>
        <p className="text-gray-600 mt-2">
          Visualize project schedules, phases, tasks, and resource allocation across time
        </p>

        {/* Filter Controls */}
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => setShowConflictsOnly(false)}
            className={`px-4 py-2 border rounded-lg text-sm font-medium ${
              !showConflictsOnly
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Show All Projects
          </button>

          <button
            onClick={() => setShowConflictsOnly(true)}
            className={`px-4 py-2 border rounded-lg text-sm font-medium ${
              showConflictsOnly
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Show Conflicts Only
          </button>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-6">
        {filteredProjects.map((project) => (
          <div key={project.projectId} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Project Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{project.projectName}</h2>
                <div className="text-blue-100 text-sm">
                  Duration: {calculateProjectDuration(project.startDate, project.estimatedEndDate)} days
                </div>
              </div>

              {/* Conflict Warnings */}
              {project.conflicts.length > 0 && (
                <div className="mt-3 bg-red-100 bg-opacity-50 px-4 py-2 rounded-lg">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h8m-4-4v4m0 4H4m6 16h.01M12 2a2 2 0 110-2 2 0 012 2z"></path>
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        Conflicts Detected ({project.conflicts.length})
                      </p>
                      <div className="mt-1 space-y-1">
                        {project.conflicts.map((conflict, idx) => (
                          <p key={idx} className="text-xs text-red-700">
                            • {conflict.description}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Gantt Chart */}
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Phases</h3>

              {/* Timeline Bars */}
              <div className="space-y-4">
                {project.phases.map((phase, index) => {
                  const progress = calculatePhaseProgress(phase);
                  const isExpanded = expandedPhases.has(phase.phaseId);
                  const phaseColor = getPhaseColor(phase.status);

                  return (
                    <React.Fragment key={phase.phaseId}>
                      <div
                        className={`border rounded-lg overflow-hidden ${
                          isExpanded ? 'border-gray-300' : 'border-transparent'
                        }`}
                      >
                        {/* Phase Header */}
                        <div
                          onClick={() => togglePhase(phase.phaseId)}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer ${phaseColor} hover:opacity-80 transition-opacity`}
                        >
                          <div className="flex items-center">
                            <svg
                              className={`h-5 w-5 mr-2 transform transition-transform ${
                                isExpanded ? 'rotate-90' : 'rotate-0'
                              }`}
                              fill="none"
                              viewBox="0 0 20 20"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6-6 6a2 2 0 001 2.003 2.003 2.003 2.003 2.003 2.003 2.003H9a2 2 0 002 2.003 2.003 2.003 2.003L6 6 6 6 6a2 2 0 001 2.003 2.003 2.003 2.003z"></path>
                            </svg>
                            <div>
                              <h4 className="font-semibold text-gray-900">{phase.phaseName}</h4>
                              <span className="ml-2 text-sm text-gray-600">
                                {phase.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                              {calculatePhaseDuration(phase.startDate, phase.endDate, 0)} days
                            </span>

                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                Progress: {progress}%
                              </span>
                              <div className="w-32 ml-3">
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      progress >= 75
                                        ? 'bg-green-500'
                                        : progress >= 50
                                        ? 'bg-blue-500'
                                        : 'bg-yellow-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
                            {/* Team Assignments */}
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-gray-900 mb-2">
                                Team Assignments
                              </h5>
                              {project.assignments
                                .filter(a => a.phaseId === phase.phaseId)
                                .map((assignment, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                                  >
                                    <div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {assignment.teamMemberName}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">
                                        {assignment.role}
                                      </span>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {assignment.allocation}%
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {/* Tasks */}
                            <div>
                              <h5 className="text-sm font-semibold text-gray-900 mb-2">
                                Tasks ({phase.tasks.length})
                              </h5>
                              {phase.tasks.map((task, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center py-2 border-b border-gray-200 last:border-0 ${
                                    task.status === 'COMPLETED'
                                      ? 'bg-green-50'
                                      : task.status === 'IN_PROGRESS'
                                      ? 'bg-blue-50'
                                      : 'bg-gray-50'
                                  }`}
                                >
                                  <div className="flex-1">
                                    <span className="text-sm text-gray-900">{task.description}</span>
                                    <span className="text-xs text-gray-500 block mt-1">
                                      {task.assignedTo}
                                    </span>
                                  </div>
                                  <div className="ml-4 text-xs font-medium text-gray-600">
                                    {task.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Projects</div>
            <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Phases Total</div>
            <div className="text-2xl font-bold text-green-600">
              {projects.reduce((sum, p) => sum + p.phases.length, 0)}
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Conflicts Detected</div>
            <div className="text-2xl font-bold text-red-600">
              {projects.reduce((sum, p) => sum + p.conflicts.length, 0)}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>💡 Tip: Click on a phase to expand/collapse details</p>
          <p>💡 Tip: Use "Show Conflicts Only" to focus on scheduling issues</p>
        </div>
      </div>
    </div>
  );
}
