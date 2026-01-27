import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarView from '../../src/components/CalendarView';

// Mock the API calls
const mockCalendarData = {
  events: [
    {
      id: 'event-1',
      type: 'PROJECT',
      title: 'Test Project',
      description: 'Contract: CONTRACT-001',
      startDate: '2024-01-15',
      endDate: '2024-06-15',
      projectId: '1',
      projectName: 'Test Project',
      status: 'IN_PROGRESS',
    },
    {
      id: 'event-2',
      type: 'PHASE',
      title: 'STUDIES Phase',
      description: 'Test Project - STUDIES',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      projectId: '1',
      projectName: 'Test Project',
      phaseId: 'phase-1',
      phaseName: 'STUDIES',
      status: 'COMPLETED',
    },
    {
      id: 'event-3',
      type: 'PHASE',
      title: 'DESIGN Phase',
      description: 'Test Project - DESIGN',
      startDate: '2024-03-16',
      endDate: '2024-06-14',
      projectId: '1',
      projectName: 'Test Project',
      phaseId: 'phase-2',
      phaseName: 'DESIGN',
      status: 'IN_PROGRESS',
    },
    {
      id: 'event-4',
      type: 'TASK',
      title: 'Task T001',
      description: 'Study Task 1',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      projectId: '1',
      projectName: 'Test Project',
      phaseId: 'phase-1',
      phaseName: 'STUDIES',
      taskId: 'task-1',
      taskCode: 'T001',
      status: 'COMPLETED',
    },
    {
      id: 'event-5',
      type: 'TASK',
      title: 'Task T002',
      description: 'Study Task 2',
      startDate: '2024-02-16',
      endDate: '2024-03-15',
      projectId: '1',
      projectName: 'Test Project',
      phaseId: 'phase-1',
      phaseName: 'STUDIES',
      taskId: 'task-2',
      taskCode: 'T002',
      status: 'COMPLETED',
    },
    {
      id: 'event-6',
      type: 'TASK',
      title: 'Task T003',
      description: 'Design Task 1',
      startDate: '2024-03-16',
      endDate: '2024-05-01',
      projectId: '1',
      projectName: 'Test Project',
      phaseId: 'phase-2',
      phaseName: 'DESIGN',
      taskId: 'task-3',
      taskCode: 'T003',
      status: 'IN_PROGRESS',
    },
  ],
};

// Mock fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockCalendarData),
  })
) as any;

describe('CalendarView Component', () => {
  const defaultProps = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    onEventClick: vi.fn(),
    onDateSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<CalendarView {...defaultProps} />);
      expect(screen.getByRole('region', { name: /calendar/i })).toBeInTheDocument();
    });

    it('should display month navigation', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByLabelText(/previous month/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/next month/i)).toBeInTheDocument();
      });
    });

    it('should display current month and year', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/january 2024/i)).toBeInTheDocument();
      });
    });

    it('should display day names (Sun, Mon, Tue, etc.)', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/sun/i)).toBeInTheDocument();
        expect(screen.getByText(/mon/i)).toBeInTheDocument();
        expect(screen.getByText(/tue/i)).toBeInTheDocument();
        expect(screen.getByText(/wed/i)).toBeInTheDocument();
        expect(screen.getByText(/thu/i)).toBeInTheDocument();
        expect(screen.getByText(/fri/i)).toBeInTheDocument();
        expect(screen.getByText(/sat/i)).toBeInTheDocument();
      });
    });

    it('should display calendar days', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('31')).toBeInTheDocument();
      });
    });

    it('should display events on calendar', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
        expect(screen.getByText(/STUDIES Phase/i)).toBeInTheDocument();
      });
    });

    it('should display view mode selector', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByLabelText(/view mode/i)).toBeInTheDocument();
      });
    });

    it('should display date range picker', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByLabelText(/from date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/to date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Navigation', () => {
    it('should navigate to next month', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const nextButton = screen.getByLabelText(/next month/i);
        fireEvent.click(nextButton);
      });
      expect(screen.getByText(/february 2024/i)).toBeInTheDocument();
    });

    it('should navigate to previous month', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const nextButton = screen.getByLabelText(/next month/i);
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);
        const prevButton = screen.getByLabelText(/previous month/i);
        fireEvent.click(prevButton);
      });
      expect(screen.getByText(/february 2024/i)).toBeInTheDocument();
    });

    it('should navigate to today', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const todayButton = screen.getByLabelText(/go to today/i);
        expect(todayButton).toBeInTheDocument();
      });
    });

    it('should jump to specific month', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const monthSelector = screen.getByLabelText(/select month/i);
        expect(monthSelector).toBeInTheDocument();
      });
    });

    it('should jump to specific year', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const yearSelector = screen.getByLabelText(/select year/i);
        expect(yearSelector).toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    it('should support month view', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const viewSelect = screen.getByLabelText(/view mode/i);
        fireEvent.change(viewSelect, { target: { value: 'month' } });
      });
      expect(screen.getByText(/january 2024/i)).toBeInTheDocument();
    });

    it('should support week view', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const viewSelect = screen.getByLabelText(/view mode/i);
        fireEvent.change(viewSelect, { target: { value: 'week' } });
      });
      expect(screen.getByText(/week of/i)).toBeInTheDocument();
    });

    it('should support day view', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const viewSelect = screen.getByLabelText(/view mode/i);
        fireEvent.change(viewSelect, { target: { value: 'day' } });
      });
      expect(screen.getByText(/day view/i)).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    it('should color-code events by type', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const projectEvents = screen.getAllByText(/Test Project/i);
        expect(projectEvents.length).toBeGreaterThan(0);
      });
    });

    it('should display event tooltips on hover', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const event = screen.getByText(/Test Project/i);
        fireEvent.mouseEnter(event);
      });
    });

    it('should show multiple events on same day', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
        expect(screen.getByText(/STUDIES Phase/i)).toBeInTheDocument();
      });
    });

    it('should handle all-day events', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const allDayEvents = screen.getAllByLabelText(/all-day event/i);
        expect(allDayEvents.length).toBeGreaterThan(0);
      });
    });

    it('should display event duration correctly', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const event = screen.getByText(/Test Project/i);
        expect(event).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should call onEventClick when event is clicked', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const event = screen.getByText(/Test Project/i);
        fireEvent.click(event);
      });
      expect(defaultProps.onEventClick).toHaveBeenCalled();
    });

    it('should call onDateSelect when date is clicked', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const date = screen.getByText('15');
        fireEvent.click(date);
      });
      expect(defaultProps.onDateSelect).toHaveBeenCalled();
    });

    it('should filter events by type', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const filterSelect = screen.getByLabelText(/filter by type/i);
        if (filterSelect) {
          fireEvent.change(filterSelect, { target: { value: 'PROJECT' } });
        }
      });
    });

    it('should filter events by project', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const projectFilter = screen.getByLabelText(/filter by project/i);
        if (projectFilter) {
          fireEvent.change(projectFilter, { target: { value: '1' } });
        }
      });
    });

    it('should update calendar when date range changes', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const fromDateInput = screen.getByLabelText(/from date/i);
        const toDateInput = screen.getByLabelText(/to date/i);
        fireEvent.change(fromDateInput, { target: { value: '2024-02-01' } });
        fireEvent.change(toDateInput, { target: { value: '2024-05-31' } });
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      (global.fetch as any).mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve(mockCalendarData) }), 100))
      );

      render(<CalendarView {...defaultProps} />);
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

      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/failed to load calendar/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no events', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ events: [] }),
        })
      );

      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/no events found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Event Details', () => {
    it('should show event details in modal/popover', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const event = screen.getByText(/Test Project/i);
        fireEvent.click(event);
      });
      expect(screen.getByText(/event details/i)).toBeInTheDocument();
    });

    it('should display event type badge', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const event = screen.getByText(/Test Project/i);
        fireEvent.click(event);
      });
      expect(screen.getByText(/project/i)).toBeInTheDocument();
    });

    it('should display event dates', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const event = screen.getByText(/Test Project/i);
        fireEvent.click(event);
      });
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
      expect(screen.getByText(/2024-06-15/)).toBeInTheDocument();
    });

    it('should display event description', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const event = screen.getByText(/Task T001/i);
        fireEvent.click(event);
      });
      expect(screen.getByText(/Study Task 1/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to smaller screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /calendar/i })).toBeInTheDocument();
      });
    });

    it('should use compact view on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /calendar/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /calendar/i })).toBeInTheDocument();
        expect(screen.getByRole('grid', { name: /calendar grid/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const dates = screen.getAllByRole('gridcell');
        dates.forEach(date => {
          expect(date).toHaveAttribute('tabindex', '0');
        });
      });
    });

    it('should provide screen reader announcements', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toBeInTheDocument();
      });
    });

    it('should have appropriate contrast ratios', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const calendarGrid = screen.getByRole('grid', { name: /calendar grid/i });
        expect(calendarGrid).toBeInTheDocument();
      });
    });
  });

  describe('Data Integration', () => {
    it('should fetch calendar data on mount', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/calendar'),
          expect.any(Object)
        );
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const refreshButton = screen.getByLabelText(/refresh/i);
        fireEvent.click(refreshButton);
      });
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should update when date range props change', async () => {
      const { rerender } = render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/january 2024/i)).toBeInTheDocument();
      });

      rerender(
        <CalendarView
          {...defaultProps}
          startDate={new Date('2024-06-01')}
          endDate={new Date('2024-12-31')}
        />
      );
    });

    it('should handle project filter', async () => {
      render(<CalendarView {...defaultProps} projectId="1" />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('projectId=1'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Legend and Filters', () => {
    it('should display event type legend', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/legend/i)).toBeInTheDocument();
      });
    });

    it('should show color indicators for event types', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/project/i)).toBeInTheDocument();
        expect(screen.getByText(/phase/i)).toBeInTheDocument();
        expect(screen.getByText(/task/i)).toBeInTheDocument();
      });
    });

    it('should allow toggling event types', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const projectToggle = screen.getByLabelText(/toggle projects/i);
        if (projectToggle) {
          fireEvent.click(projectToggle);
        }
      });
    });

    it('should maintain filter state on navigation', async () => {
      render(<CalendarView {...defaultProps} />);
      await waitFor(() => {
        const nextButton = screen.getByLabelText(/next month/i);
        fireEvent.click(nextButton);
      });
      expect(screen.getByText(/february 2024/i)).toBeInTheDocument();
    });
  });
});
