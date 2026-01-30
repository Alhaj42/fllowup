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
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        ⚠️ Overallocated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Well-Allocated
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
