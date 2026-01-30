import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Report {
  id: string;
  projectName: string;
  clientName: string;
  generatedAt: string;
  data: any;
}

interface ReportViewerProps {
  reportId: string;
  reportType: 'project' | 'employee' | 'kpi';
  employeeId?: string;
  projectId?: string;
}

export default function ReportViewer({ reportId, reportType, employeeId, projectId }: ReportViewerProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  useEffect(() => {
    loadReport();
  }, [reportId, reportType]);

  const loadReport = async () => {
    setLoading(true);
    setError('');

    try {
      let endpoint: string;
      if (reportType === 'project') {
        if (!projectId) {
          throw new Error('Project ID is required for project reports');
        }
        endpoint = `/reports/project/${projectId}`;
      } else if (reportType === 'employee') {
        if (!employeeId) {
          throw new Error('Employee ID is required for employee reports');
        }
        endpoint = `/reports/employee/${employeeId}`;
      } else if (reportType === 'kpi') {
        if (!employeeId) {
          throw new Error('Employee ID is required for KPI reports');
        }
        endpoint = `/reports/kpi/employee/${employeeId}`;
      } else {
        throw new Error('Invalid report type');
      }

      const response = await api.get(endpoint);
      setReport(response.data);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load report. Please try again.');
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) {
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await api.get(`/reports/${reportId}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloading(false);
    } catch (err: any) {
      setError('Failed to download PDF report. Please try again.');
      setDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!report) {
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await api.get(`/reports/${reportId}/excel`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${reportId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloading(false);
    } catch (err: any) {
      setError('Failed to download Excel report. Please try again.');
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!report) {
      return;
    }

    window.print();
  };

  const handleSendEmail = async () => {
    if (!report) {
      return;
    }

    try {
      await api.post(`/reports/${reportId}/email`, {
        to: 'manager@example.com', // In production, get from user profile
        subject: `Report: ${reportType === 'project' ? report.data.projectName : 'Employee Summary'}`,
        body: 'Please find the attached report.'
      });

      alert('Report sent successfully!');
    } catch (err: any) {
      setError('Failed to send report email. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="ml-4 text-lg text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Report</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={loadReport}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Report Data</h3>
          <p className="mt-2 text-gray-600">Report not found or failed to load.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {reportType === 'project' ? 'Project Report' : reportType === 'employee' ? 'Employee Report' : 'KPI Report'}
          </h2>
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Report Metadata */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Generated: </span>
            <span className="font-medium text-gray-900">{report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Report ID: </span>
            <span className="font-medium text-gray-900">{reportId}</span>
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Download Report</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* PDF Download */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading || !report}
            className="flex flex-col items-center px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-8 w-8 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Download as PDF</span>
            <span className="text-xs text-gray-500 mb-1">{reportType === 'project' ? 'Includes full project details, phases, assignments, costs, and tasks' : 'Includes employee summary, projects, and performance metrics'}</span>
            {downloading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${downloadProgress}%` }}></div>
                </div>
                <span className="text-xs text-gray-600">Generating PDF...</span>
              </div>
            )}
          </button>

          {/* Excel Download */}
          <button
            onClick={handleDownloadExcel}
            disabled={downloading || !report}
            className="flex flex-col items-center px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Download as Excel</span>
            <span className="text-xs text-gray-500 mb-1">{reportType === 'project' ? 'Spreadsheet format with all data tables' : 'Spreadsheet format with employee summaries and KPI metrics'}</span>
            {downloading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${downloadProgress}%` }}></div>
                </div>
                <span className="text-xs text-gray-600">Generating Excel...</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Print Button */}
      <div className="mb-6">
        <button
          onClick={handlePrint}
          disabled={!report}
          className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5 text-gray-600 mr-2 inline" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Send Email Button */}
      <div className="mb-6">
        <button
          onClick={handleSendEmail}
          disabled={!report}
          className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5 text-blue-600 mr-2 inline" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Send Report via Email
        </button>
      </div>

      {/* Report Content Display */}
      {reportType === 'project' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Details</h3>
          </div>

          {/* Project Information */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-sm text-gray-600">Project Name</span>
              <span className="text-sm font-medium text-gray-900">{report?.data?.projectName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-sm text-gray-600">Client</span>
              <span className="text-sm font-medium text-gray-900">{report?.data?.clientName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-sm text-gray-600">Contract Code</span>
              <span className="text-sm font-medium text-gray-900">{report?.data?.contractCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-gray-900">{report?.data?.status || 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-sm text-gray-600">Start Date</span>
              <span className="text-sm font-medium text-gray-900">{report?.data?.startDate ? new Date(report.data.startDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-sm text-gray-600">Estimated End Date</span>
              <span className="text-sm font-medium text-gray-900">{report?.data?.estimatedEndDate ? new Date(report.data.estimatedEndDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Phases */}
          <div className="px-6 py-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Project Phases</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report?.data?.phases?.map((phase: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {phase.phaseName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {phase.status}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {phase.progress || '0'}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {phase.taskCount || 0}/{phase.completedTasks || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="px-6 py-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Cost Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${report?.data?.costSummary?.totalCost ? report.data.costSummary.totalCost.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Employee Costs</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${report?.data?.costSummary?.employeeCostTotal ? report.data.costSummary.employeeCostTotal.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Material Costs</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${report?.data?.costSummary?.materialCostTotal ? report.data.costSummary.materialCostTotal.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600">Total Entries</div>
                <div className="text-2xl font-bold text-gray-900">
                  {report?.data?.costSummary?.totalEntries || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(reportType === 'employee' || reportType === 'kpi') && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {reportType === 'employee' ? 'Employee Summary Report' : 'KPI Report'} - {report?.data?.employeeName}
            </h3>
          </div>

          {/* Employee/Performance Metrics */}
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{report?.data?.totalProjects || 0}</div>
                <div className="text-sm text-gray-600">Projects Assigned</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{report?.data?.totalAllocationPercentage ? `${report.data.totalAllocationPercentage.toFixed(0)}%` : '0%'}</div>
                <div className="text-sm text-gray-600">Avg Allocation</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">${report?.data?.totalCost ? report.data.totalCost.toFixed(2) : '0.00'}</div>
                <div className="text-sm text-gray-600">Total Costs</div>
              </div>
            </div>
          </div>

          {/* Project Summaries Table */}
          {reportType === 'employee' && report?.data?.projectSummaries && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Project Assignments</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Allocation</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phases</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report?.data?.projectSummaries?.map((summary: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {summary.projectName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {summary.role}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {summary.totalAllocatedPercentage}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {summary.phases?.length || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KPI Table */}
          {reportType === 'kpi' && report?.data && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Performance Metrics</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">Delayed Tasks</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report?.data?.delayedTasksCount || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {report?.data?.performanceScore ? `${report.data.performanceScore.toFixed(0)}%` : 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">Client Modifications</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report?.data?.clientModificationsCount || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {report?.data?.total && report?.data.total > 0 ? ((report.data.clientModificationsCount / report.data.total) * 100).toFixed(0) : 'N/A'}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">Technical Mistakes</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{report?.data?.technicalMistakesCount || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {report?.data?.total && report?.data.total > 0 ? ((report.data.technicalMistakesCount / report.data.total) * 100).toFixed(0) : 'N/A'}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
