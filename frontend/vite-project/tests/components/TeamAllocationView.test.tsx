import { render, screen } from '@testing-library/react';
import TeamAllocationView from '../../src/components/TeamAllocationView';
import apiClient from '../../src/services/api';

jest.mock('../../src/services/api');

describe('TeamAllocationView Component', () => {
  const mockAllocations = {
    totalTeamMembers: 10,
    allocatedMembers: 8,
    overallocatedMembers: 2,
    allocations: [
      {
        userId: 'user-1',
        userName: 'John Doe',
        totalAllocation: 100,
        isOverallocated: false,
        assignments: [
          {
            id: 'assign-1',
            phaseId: 'phase-1',
            projectName: 'Project Alpha',
            role: 'TEAM_MEMBER',
            workingPercentage: 100,
            startDate: '2024-02-01',
            endDate: '2024-02-28',
          },
        ],
      },
      {
        userId: 'user-2',
        userName: 'Jane Smith',
        totalAllocation: 125,
        isOverallocated: true,
        assignments: [
          {
            id: 'assign-2',
            phaseId: 'phase-1',
            projectName: 'Project Alpha',
            role: 'TEAM_MEMBER',
            workingPercentage: 75,
            startDate: '2024-02-01',
            endDate: '2024-02-15',
          },
          {
            id: 'assign-3',
            phaseId: 'phase-1',
            projectName: 'Project Beta',
            role: 'TEAM_LEADER',
            workingPercentage: 50,
            startDate: '2024-02-16',
            endDate: '2024-02-28',
          },
        ],
      },
      {
        userId: 'user-3',
        userName: 'Bob Johnson',
        totalAllocation: 0,
        isOverallocated: false,
        assignments: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render summary statistics', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      expect(screen.getByText(/Total Team Members/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText(/Allocated/i)).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText(/Over-allocated/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render allocation table with headers', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      expect(screen.getByText('Team Member')).toBeInTheDocument();
      expect(screen.getByText('Total Allocation')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Assignments')).toBeInTheDocument();
    });

    it('should render individual team member allocations', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should render allocation percentages', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('125%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Over-allocation Indicators', () => {
    it('should show warning indicator for over-allocated members', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const johnStatus = screen.getByText('100%');
      expect(johnStatus).toHaveStyle({ color: '' });

      const janeStatus = screen.getByText('125%');
      expect(janeStatus).toHaveStyle({ color: expect.stringContaining('red') });
    });

    it('should show OK indicator for properly allocated members', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const johnRow = screen.getByText('John Doe').closest('tr');
      const statusIndicator = johnRow?.querySelector('[data-testid="allocation-status"]');

      expect(statusIndicator).toHaveStyle({ color: expect.stringContaining('green') });
    });

    it('should show warning indicator for unallocated members', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const bobRow = screen.getByText('Bob Johnson').closest('tr');
      const statusIndicator = bobRow?.querySelector('[data-testid="allocation-status"]');

      expect(statusIndicator).toHaveStyle({ color: expect.stringContaining('gray') });
    });

    it('should highlight over-allocated summary count', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const overallocatedSummary = screen.getByText('2').closest('[data-testid="overallocated-count"]');
      expect(overallocatedSummary).toHaveStyle({ color: expect.stringContaining('red') });
    });
  });

  describe('Assignment Details', () => {
    it('should render expandable assignment details', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const janeRow = screen.getByText('Jane Smith').closest('tr');
      const expandButton = janeRow?.querySelector('[aria-label="Expand assignments"]');

      expect(expandButton).toBeInTheDocument();
    });

    it('should show assignment details on expand', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const expandButton = screen.getByLabelText('Expand assignments');
      screen.getByRole('button', expandButton).click();

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('TEAM_MEMBER')).toBeInTheDocument();
      expect(screen.getByText('TEAM_LEADER')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should render filter controls', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      expect(screen.getByLabelText(/project filter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
    });

    it('should call API with filter parameters on filter change', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const projectFilter = screen.getByLabelText(/project filter/i);
      fireEvent.change(projectFilter, { target: { value: 'project-alpha' } });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/team/allocation', {
          params: { projectId: 'project-alpha' },
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching data', () => {
      (apiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<TeamAllocationView />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading allocations/i)).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should show error message on API failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<TeamAllocationView />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load allocations/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<TeamAllocationView />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry API call on retry button click', async () => {
      (apiClient.get as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: mockAllocations });

      render(<TeamAllocationView />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load allocations/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no allocations exist', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          totalTeamMembers: 10,
          allocatedMembers: 0,
          overallocatedMembers: 0,
          allocations: [],
        },
      });

      render(<TeamAllocationView />);

      expect(screen.getByText(/no team allocations found/i)).toBeInTheDocument();
    });

    it('should show message when no team members exist', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          totalTeamMembers: 0,
          allocatedMembers: 0,
          overallocatedMembers: 0,
          allocations: [],
        },
      });

      render(<TeamAllocationView />);

      expect(screen.getByText(/no team members found/i)).toBeInTheDocument();
    });
  });

  describe('Auto-refresh', () => {
    it('should auto-refresh allocations at specified interval', async () => {
      jest.useFakeTimers();
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView autoRefresh={true} refreshInterval={30000} />);

      expect(apiClient.get).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(30000);

      expect(apiClient.get).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure with headers', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    });

    it('should have proper ARIA labels', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const overallocatedElements = screen.getAllByLabelText(/over-allocated/i);
      overallocatedElements.forEach(el => {
        expect(el).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should be keyboard navigable', () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllocations });

      render(<TeamAllocationView />);

      const expandButton = screen.getByLabelText('Expand assignments');
      expect(expandButton).toHaveAttribute('tabIndex', '0');
    });
  });
});
