import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Assignment {
  id: string;
  projectName: string;
  phaseName: string;
  role: string;
  workingPercentage: number;
  startDate: string;
  endDate: string | null;
}

interface TeamMemberWorkload {
  teamMemberId: string;
  teamMemberName: string;
  teamMemberEmail: string;
  totalAllocation: number;
  isOverallocated: boolean;
  assignments: Assignment[];
}

interface TeamWorkloadViewProps {
  projectId: string;
}

export default function TeamWorkloadView({ projectId }: TeamWorkloadViewProps) {
  const [teamWorkload, setTeamWorkload] = useState<TeamMemberWorkload[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTeamWorkload();
  }, [projectId]);

  const loadTeamWorkload = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/assignments/project/${projectId}`);
      setTeamWorkload(response.data || []);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load team workload. Please try again.');
      setLoading(false);
    }
  };

  const toggleExpand = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  const getAllocationBarColor = (allocation: number): string => {
    if (allocation > 100) return 'bg-red-500';
    if (allocation >= 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAllocationBarWidth = (allocation: number): string => {
    return `${Math.min(allocation, 100)}%`;
  };

  const calculateStats = () => {
    const totalMembers = teamWorkload.length;
    const overallocatedCount = teamWorkload.filter(w => w.isOverallocated).length;
    const totalAllocation = teamWorkload.reduce((sum, w) => sum + w.totalAllocation, 0);
    const averageAllocation = totalMembers > 0 ? (totalAllocation / totalMembers).toFixed(2) : '0.00';

    return { totalMembers, overallocatedCount, averageAllocation };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="ml-4 text-lg text-gray-600">Loading team workload...</p>
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
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={loadTeamWorkload}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (teamWorkload.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a2 2 0 01-2-2H5a2 2 0 01-2 2v2h14a2 2 0 012 2z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m-2-2l-2 2"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Team Members Assigned</h3>
          <p className="mt-2 text-gray-600">
            There are no team members assigned to this project yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Team Workload</h2>
        <p className="text-gray-600">View and manage team member allocations across all project phases</p>
      </div>

      {/* Summary Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total Members</span>
            <span className="text-2xl font-bold text-blue-600">{stats.totalMembers}</span>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Well-Allocated</span>
            <span className="text-2xl font-bold text-green-600">{stats.totalMembers - stats.overallocatedCount}</span>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Overallocated</span>
            <span className="text-2xl font-bold text-red-600">{stats.overallocatedCount}</span>
          </div>
        </div>
      </div>

      {/* Average Allocation */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Average Allocation
          </span>
          <span className="text-lg font-bold text-gray-900">
            {stats.averageAllocation}%
          </span>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team Member
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Allocation
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignments
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {teamWorkload.map((member) => (
              <React.Fragment key={member.teamMemberId}>
                {/* Member Row */}
                <tr
                  data-member-name="true"
                  data-email={member.teamMemberEmail}
                  className={expandedMembers.has(member.teamMemberId) ? 'bg-gray-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                        {member.teamMemberName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.teamMemberName}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.teamMemberEmail}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Allocation Bar */}
                      <div className="w-32 mr-4 bg-gray-200 rounded-full h-3" data-allocation-bar="true">
                        <div
                          className={`h-3 rounded-full ${getAllocationBarColor(member.totalAllocation)}`}
                          style={{ width: getAllocationBarWidth(member.totalAllocation) }}
                        />
                      </div>

                      {/* Percentage Text */}
                      <span className={`text-sm font-semibold ${
                        member.totalAllocation > 100 ? 'text-red-600' :
                        member.totalAllocation >= 90 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {member.totalAllocation}%
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.isOverallocated ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800" data-warning-icon="true">
                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765 1.36 0.784 1.36h6.432c.164 0 .286-.226.286-.486 0H1.542c-.941 0-1.704.589-2.037-1.417L2.597 5.41c-.326-.926-1.03-1.66-1.03C.766 3.484.214 4.5 0 4.5c0 1.005.901 1.864 1.637l.981-2.556c-.164-.937-.797-1.319-1.955-1.319h-2.9v-1.42c0-.396-.155-.75-.486-1.024-.486h-1.542c-.959 0-1.738-.663-2.06-1.462L4.521 4.48c-.233-.823-.672-1.3-1.472-1.3H5.26c-.326 0-.886.312-1.46.768V6.4h2.514c.482 0 .898.32 1.438.32h1.912c.439 0 .882.32 1.356.32v6.418h3.33c.959 0 1.834.638 2.19.638h1.542c.75 0 1.612-.471 2.064-1.276l-.981-2.456c-.164-.896-.735-1.248-1.71-1.248h-2.9v-1.42c0-.395-.155-.747-.485-1.022-.485h-1.542c-.955 0-1.739-.66-2.058-1.458l.981-2.504c.233-.847.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.056-1.459l.981-2.456c.232-.896-.735-1.348-1.47-1.348h-2.9v-1.42c0-.395-.155-.75-.485-1.02-.485H7.526c-.96 0-1.736-.66-2.055-1.458L9.483 4.56c.232-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.395-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.055-1.458L9.483 4.56c.232-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.395-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.456c.232-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.66-2.055-1.458l.981-2.504c.233-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.504c.233-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.395-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.66-2.056-1.458l.981-2.504c.233-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.66-2.056-1.458l.981-2.504c.233-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.504c.233-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.504c.233-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485H17.526c-.96 0-1.736-.66-2.055-1.458L18.449 4.56c.232-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.395-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.66-2.056-1.458l.981-2.504c.232-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.504c.232-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.504c.232-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.66-2.056-1.458L18.449 4.56c.232-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.504c.232-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.661-2.056-1.458l.981-2.504c.232-.892.735-1.348-1.47-1.348h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.736-.662-2.056-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.46l.981-2.556c.233-.896.735-1.35-1.47-1.35H13.046c-.959 0-1.738-.66-2.058-1.458L14.47 4.48c-.233-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.66-2.057-1.458L14.47 4.48c-.233-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.66-2.057-1.458l.981-2.556c.233-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.661-2.057-1.458l.981-2.556c.233-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.661-2.057-1.458l.981-2.556c.233-.892.735-1.347-1.47-1.347h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.42c0-.393-.155-.75-.485-1.02-.485h-1.542c-.954 0-1.737-.662-2.057-1.459l.981-2.504c.232-.892.735-1.349-1.47-1.349h-2.9v-1.allocated%200%20all%20team%20members%20are%20currently%20overallocated%2C%20which%20indicates%20potential%20staffing%20issues%20that%20need%20attention" title={`${member.totalAllocation}% allocated - ${member.totalAllocation > 100 ? 'OVERALLOCATED' : 'within limits'}`}>
                        ⚠️ Overallocated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Well-Allocated
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.assignments.length} assignments
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleExpand(member.teamMemberId)}
                      className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {expandedMembers.has(member.teamMemberId) ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 10a6 6 0 0112 0v6m-4-4h8m-4 4v6"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 12a6 6 0 01-12 0v-2m12 2v-2a6 6 0 01-12 0v6"></path>
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>

                {/* Expandable Assignment Details */}
                {expandedMembers.has(member.teamMemberId) && member.assignments.length > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Assignment Details for {member.teamMemberName}
                        </h4>
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Project
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Phase
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Role
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Allocation
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Start Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  End Date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {member.assignments.map((assignment) => (
                                <tr key={assignment.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {assignment.projectName}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                    {assignment.phaseName}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                    {assignment.role}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                    {assignment.workingPercentage}%
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(assignment.startDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                    {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : 'Ongoing'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
