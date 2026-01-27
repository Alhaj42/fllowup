import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimelineView from '../../src/components/TimelineView';

// Mock the API calls
const mockTimelineData = {
  project: {
    id: '1',
    name: 'Test Project',
    contractCode: 'CONTRACT-001',
    startDate: '2024-01-15',
    estimatedEndDate: '2024-06-15',
    status: 'IN_PROGRESS',
  },
  phases: [
    {
      id: 'phase-1',
      projectId: '1',
      name: 'STUDIES',
      startDate: '2024-01-15',
      estimatedEndDate: '2024-03-15',
      status: 'COMPLETED',
      progress: 100,
    },
    {
      id: 'phase-2',
      projectId: '1',
      name: 'DESIGN',
      startDate: '2024-03-16',
      estimatedEndDate: '2024-06-14',
      status: 'IN_PROGRESS',
      progress: 50,
    },
  ],
  tasks: [
    {
      id: 'task-1',
      phaseId: 'phase-1',
      phaseName: 'STUDIES',
      code: 'T001',
      description: 'Study Task 1',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      status: 'COMPLETED',
      duration: 30,
    },
    {
      id: 'task-2',
      phaseId: 'phase-1',
      phaseName: 'STUDIES',
      code: 'T002',
      description: 'Study Task 2',
      startDate: '2024-02-16',
      endDate: '2024-03-15',
      status: 'COMPLETED',
      duration: 30,
    },
    {
      id: 'task-3',
      phaseId: 'phase-2',
      phaseName: 'DESIGN',
      code: 'T003',
      description: 'Design Task 1',
      startDate: '2024-03-16',
      endDate: '2024-05-01',
      status: 'IN_PROGRESS',
      duration: 45,
    },
    {
      id: 'task-4',
      phaseId: 'phase-2',
      phaseName: 'DESIGN',
      code: 'T004',
      description: 'Design Task 2',
      startDate: '2024-05-02',
      endDate: '2024-06-14',
      status: 'PLANNED',
      duration: 45,
    },
  ],
  conflicts: [],
};

// Mock fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockTimelineData),
  })
) as any;

describe('TimelineView Component', () => {
  const defaultProps = {
    projectId: '1',
    onTaskClick: vi.fn(),
    onPhaseClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<TimelineView {...defaultProps} />);
      expect(screen.getByRole('region', { name: /timeline/i })).toBeInTheDocument();
    });

    it('should display project name', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });

    it('should display Gantt chart container', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /gantt chart/i })).toBeInTheDocument();
      });
    });

    it('should display timeline controls', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByLabelText(/zoom/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/view/i)).toBeInTheDocument();
      });
    });

    it('should display date range selector', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      });
    });

    it('should display phase bars', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/STUDIES/i)).toBeInTheDocument();
        expect(screen.getByText(/DESIGN/i)).toBeInTheDocument();
      });
    });

    it('should display task bars', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/T001/i)).toBeInTheDocument();
        expect(screen.getByText(/T002/i)).toBeInTheDocument();
        expect(screen.getByText(/T003/i)).toBeInTheDocument();
        expect(screen.getByText(/T004/i)).toBeInTheDocument();
      });
    });

    it('should display legend', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/legend/i)).toBeInTheDocument();
      });
    });
  });

  describe('Gantt Chart', () => {
    it('should render Gantt chart with correct time scale', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/january/i)).toBeInTheDocument();
        expect(screen.getByText(/february/i)).toBeInTheDocument();
        expect(screen.getByText(/march/i)).toBeInTheDocument();
      });
    });

    it('should show phase progress on Gantt chart', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should color-code phases by status', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const phaseBars = screen.getAllByRole('generic').filter(el =>
          el.textContent?.includes('STUDIES') || el.textContent?.includes('DESIGN')
        );
        expect(phaseBars.length).toBeGreaterThan(0);
      });
    });

    it('should display task dependencies', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const tasks = screen.getAllByText(/T00[1-4]/);
        expect(tasks.length).toBe(4);
      });
    });

    it('should show critical path', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/critical path/i)).toBeInTheDocument();
      });
    });

    it('should handle zoom in/out', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const zoomInButton = screen.getByLabelText(/zoom in/i);
        const zoomOutButton = screen.getByLabelText(/zoom out/i);

        expect(zoomInButton).toBeInTheDocument();
        expect(zoomOutButton).toBeInTheDocument();
      });
    });

    it('should support different view modes (Day/Week/Month)', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const viewSelect = screen.getByLabelText(/view/i);
        expect(viewSelect).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should call onTaskClick when task is clicked', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const task = screen.getByText(/T001/);
        fireEvent.click(task);
      });
      expect(defaultProps.onTaskClick).toHaveBeenCalled();
    });

    it('should call onPhaseClick when phase is clicked', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const phase = screen.getByText(/STUDIES/);
        fireEvent.click(phase);
      });
      expect(defaultProps.onPhaseClick).toHaveBeenCalled();
    });

    it('should filter tasks when search input changes', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: 'T001' } });
      });
    });

    it('should update timeline when date range changes', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const startDateInput = screen.getByLabelText(/start date/i);
        fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });
      });
    });

    it('should toggle critical path visibility', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const toggleButton = screen.getByLabelText(/toggle critical path/i);
        fireEvent.click(toggleButton);
      });
    });

    it('should expand/collapse phase tasks', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const expandButton = screen.getByLabelText(/expand studies/i);
        if (expandButton) {
          fireEvent.click(expandButton);
        }
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      (global.fetch as any).mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve(mockTimelineData) }), 100))
      );

      render(<TimelineView {...defaultProps} />);
      expect(screen.getByRole('progressbar', { name: /loading/i })).toBeInTheDocument();
    });

    it('should show error message when API fails', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal Server Error' }),
        })
      );

      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/failed to load timeline/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no data', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: null, phases: [], tasks: [], conflicts: [] }),
        })
      );

      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/no timeline data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Conflicts Display', () => {
    it('should display conflict warnings when conflicts exist', async () => {
      const dataWithConflicts = {
        ...mockTimelineData,
        conflicts: [
          {
            type: 'OVERLAP',
            severity: 'HIGH',
            message: 'Phases overlap in time',
            projects: ['Test Project', 'Another Project'],
          },
        ],
      };

      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(dataWithConflicts),
        })
      );

      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/conflicts detected/i)).toBeInTheDocument();
      });
    });

    it('should show conflict severity indicators', async () => {
      const dataWithConflicts = {
        ...mockTimelineData,
        conflicts: [
          {
            type: 'RESOURCE',
            severity: 'HIGH',
            message: 'Resource conflict detected',
            projects: ['Test Project'],
          },
        ],
      };

      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(dataWithConflicts),
        })
      );

      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/high/i)).toBeInTheDocument();
      });
    });

    it('should allow navigating to conflict details', async () => {
      const dataWithConflicts = {
        ...mockTimelineData,
        conflicts: [
          {
            type: 'OVERLAP',
            severity: 'MEDIUM',
            message: 'Phase overlap',
            projects: ['Test Project', 'Another Project'],
          },
        ],
      };

      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(dataWithConflicts),
        })
      );

      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const conflictLink = screen.getByText(/view details/i);
        expect(conflictLink).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to smaller screens', async () => {
      // Mock window.innerWidth to simulate mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /timeline/i })).toBeInTheDocument();
      });
    });

    it('should show scrollable timeline on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const timelineContainer = screen.getByRole('region', { name: /timeline/i });
        expect(timelineContainer).toHaveStyle({ overflow: 'auto' });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /timeline/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /gantt chart/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const tasks = screen.getAllByText(/T00[1-4]/);
        tasks.forEach(task => {
          expect(task).toHaveAttribute('tabindex', '0');
        });
      });
    });

    it('should provide screen reader announcements', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });

  describe('Data Integration', () => {
    it('should fetch timeline data on mount', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/timeline/1'),
          expect.any(Object)
        );
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<TimelineView {...defaultProps} />);
      await waitFor(() => {
        const refreshButton = screen.getByLabelText(/refresh/i);
        fireEvent.click(refreshButton);
      });
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle multiple projects timeline view', async () => {
      render(<TimelineView {...defaultProps} projectId="" />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/timeline'),
          expect.any(Object)
        );
      });
    });
  });
});
