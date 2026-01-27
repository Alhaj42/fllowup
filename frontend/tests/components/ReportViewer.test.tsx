import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportViewer from '../../../src/components/ReportViewer';

// Mock API
vi.mock('../../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    getBlob: vi.fn(),
  },
}));

// Mock Blob for file downloads
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

describe('ReportViewer Component', () => {
  const mockProjectReport = {
    id: 'report-1',
    projectName: 'Test Project',
    clientName: 'Test Client',
    generatedAt: new Date('2025-01-01T10:00:00Z'),
    data: {
      projectName: 'Test Project',
      clientName: 'Test Client',
      contractCode: 'CONT-001',
      startDate: '2025-01-01',
      status: 'IN_PROGRESS',
      phases: [
        {
          phaseName: 'STUDIES',
          status: 'COMPLETED',
          startDate: '2025-01-01',
          endDate: '2025-03-31',
          progress: 100,
          teamAssignments: [
            { teamMemberName: 'John Doe', role: 'TEAM_LEADER', workingPercentage: 100 },
          ],
          taskCount: 5,
          completedTasks: 5
        }
      ],
      costSummary: {
        totalCost: 50000,
        employeeCostTotal: 30000,
        materialCostTotal: 20000,
        totalEntries: 15
      }
    }
  };

  const mockEmployeeReport = {
    id: 'report-2',
    employeeName: 'Jane Smith',
    generatedAt: new Date('2025-01-02T10:00:00Z'),
    data: {
      totalProjects: 3,
      totalAllocationPercentage: 85,
      totalCost: 45000,
      projectSummaries: [
        {
          projectId: 'proj-1',
          projectName: 'Project Alpha',
          contractCode: 'CONT-001',
          role: 'TEAM_LEADER',
          workingPercentage: 100,
          phases: [],
          completedTasks: 0,
        },
        {
          projectId: 'proj-2',
          projectName: 'Project Beta',
          contractCode: 'CONT-002',
          role: 'TEAM_MEMBER',
          workingPercentage: 50,
          phases: [],
          completedTasks: 0,
        },
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should show loading state initially', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: null }), 100)));

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading report/i)).toBeInTheDocument();
    });

    it('should render project report data after loading', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Project Report')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test Client')).toBeInTheDocument();
      expect(screen.getByText('CONT-001')).toBeInTheDocument();
    });

    it('should render employee report data after loading', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockEmployeeReport });

      render(<ReportViewer reportId="report-2" reportType="employee" employeeId="emp-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Employee Summary Report')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Projects Assigned: 3')).toBeInTheDocument();
      expect(screen.getByText('Avg Allocation: 85%')).toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockRejectedValue(new Error('Network error'));

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Error Loading Report')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load report/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should render no data state when report is null', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: null });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('No Report Data')).toBeInTheDocument();
      expect(screen.getByText(/Report not found or failed to load/i)).toBeInTheDocument();
    });
  });

  describe('PDF Download', () => {
    it('should download PDF when button clicked', async () => {
      const mockBlob = new Blob(['%PDF-1.0'], { type: 'application/pdf' });
      const { api } = require('../../../src/services/api');
      api.getBlob.mockResolvedValue(mockBlob);
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download as pdf/i })).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download as pdf/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(api.getBlob).toHaveBeenCalledWith('/reports/report-1/pdf', {
          responseType: 'blob'
        });
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob, { type: 'application/pdf' });
    });

    it('should show download progress while generating PDF', async () => {
      const mockBlob = new Blob(['%PDF'], { type: 'application/pdf' });
      const { api } = require('../../../src/services/api');
      api.getBlob.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockBlob), 500);
      }));

      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download as pdf/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Generating PDF/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/Generating Excel/i)).not.toBeInTheDocument();
    });

    it('should handle PDF download error', async () => {
      const { api } = require('../../../src/services/api');
      api.getBlob.mockRejectedValue(new Error('PDF generation failed'));

      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download as pdf/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to download PDF report/i)).toBeInTheDocument();
      });
    });
  });

  describe('Excel Download', () => {
    it('should download Excel when button clicked', async () => {
      const mockBlob = new Blob(['%XLSX-1.0'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const { api } = require('../../../src/services/api');
      api.getBlob.mockResolvedValue(mockBlob);
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download as excel/i })).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download as excel/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(api.getBlob).toHaveBeenCalledWith('/reports/report-1/excel', {
          responseType: 'blob'
        });
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    });

    it('should show download progress while generating Excel', async () => {
      const mockBlob = new Blob(['%XLSX'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const { api } = require('../../../src/services/api');
      api.getBlob.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockBlob), 500);
      }));

      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download as excel/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Generating Excel/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/Generating PDF/i)).not.toBeInTheDocument();
    });

    it('should handle Excel download error', async () => {
      const { api } = require('../../../src/services/api');
      api.getBlob.mockRejectedValue(new Error('Excel generation failed'));

      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download as excel/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to download Excel report/i)).toBeInTheDocument();
      });
    });
  });

  describe('Report Content Display', () => {
    it('should display project phases table', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Project Phases')).toBeInTheDocument();
      expect(screen.getByText('STUDIES')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('5/5')).toBeInTheDocument();
    });

    it('should display cost summary with breakdown', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Cost Summary')).toBeInTheDocument();
      expect(screen.getByText(/\$50,000\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/\$30,000\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/\$20,000\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/15 Total Entries/i)).toBeInTheDocument();
    });

    it('should display employee project assignments table', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockEmployeeReport });

      render(<ReportViewer reportId="report-2" reportType="employee" employeeId="emp-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Project Assignments')).toBeInTheDocument();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('TEAM_LEADER')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Print Functionality', () => {
    it('should call window.print() when print button clicked', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      window.print = vi.fn();

      const printButton = screen.getByRole('button', { name: /print report/i });
      fireEvent.click(printButton);

      expect(window.print).toHaveBeenCalled();
    });

    it('should disable print button when no report loaded', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: null });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      const printButton = screen.getByRole('button', { name: /print report/i });
      expect(printButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message for missing projectId', () => {
      render(<ReportViewer reportId="report-1" reportType="project" />);

      await waitFor(() => {
        expect(screen.getByText(/No Report Data/i)).toBeInTheDocument();
      });
    });

    it('should show error message for missing employeeId', () => {
      render(<ReportViewer reportId="report-1" reportType="employee" />);

      await waitFor(() => {
        expect(screen.getByText(/No Report Data/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockRejectedValue(new Error('Network error'));

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to load report/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should reload report when retry button clicked', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockRejectedValueOnce(new Error('Network error'));
      api.get.mockResolvedValueOnce({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on download buttons', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      const pdfButton = screen.getByRole('button', { name: /download as pdf/i });
      const excelButton = screen.getByRole('button', { name: /download as excel/i });

      expect(pdfButton).toHaveAttribute('aria-label', expect.stringContaining('download pdf'));
      expect(excelButton).toHaveAttribute('aria-label', expect.stringContaining('download excel'));
    });

    it('should display report metadata in accessible format', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Generated:/i)).toBeInTheDocument();
      expect(screen.getByText(/2025-01-01/i)).toBeInTheDocument();
    });
  });

  describe('Report Type Switching', () => {
    it('should render project report content', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Project Details')).toBeInTheDocument();
      expect(screen.getByText('Cost Summary')).toBeInTheDocument();
    });

    it('should render employee report content', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockEmployeeReport });

      render(<ReportViewer reportId="report-2" reportType="employee" employeeId="emp-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Project Assignments')).toBeInTheDocument();
      expect(screen.getByText('Total Projects: 3')).toBeInTheDocument();
      expect(screen.getByText('Avg Allocation: 85%')).toBeInTheDocument();
    });

    it('should render KPI report content', async () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockEmployeeReport });

      render(<ReportViewer reportId="report-3" reportType="kpi" employeeId="emp-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('KPI Report')).toBeInTheDocument();
      expect(screen.queryByText(/Project Assignments/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should navigate back when back button clicked', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockProjectReport });

      window.history.back = vi.fn();

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(window.history.back).toHaveBeenCalled();
    });

    it('should disable download buttons during download', async () => {
      const { api } = require('../../../src/services/api');
      const mockBlob = new Blob(['%PDF'], { type: 'application/pdf' });
      api.getBlob.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockBlob), 1000);
      }));

      api.get.mockResolvedValue({ data: mockProjectReport });

      render(<ReportViewer reportId="report-1" reportType="project" projectId="proj-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download as pdf/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Generating PDF/i)).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Download')
      );

      downloadButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });
});
