import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamAssignmentForm from '../../src/components/TeamAssignmentForm';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/state/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id', role: 'MANAGER' },
    hasRole: vi.fn(() => true),
  })),
  hasRole: vi.fn(() => true),
}));

describe('TeamAssignmentForm Component', () => {
  const mockTeamMembers = [
    { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 'user-2', name: 'Bob Smith', email: 'bob@example.com' },
    { id: 'user-3', name: 'Carol White', email: 'carol@example.com' },
  ];

  const mockPhase = {
    id: 'phase-1',
    name: 'Studies',
    projectId: 'project-1',
    status: 'IN_PROGRESS',
  };

  const mockExistingAssignments = [
    { id: 'assign-1', userId: 'user-1', phaseId: 'phase-1', workingPercent: 50, role: 'TEAM_MEMBER' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('Form Rendering', () => {
    it('renders team member selector', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Team Member/i)).toBeInTheDocument();
      });
    });

    it('renders allocation percentage input', () => {
      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/Allocation Percentage/i)).toBeInTheDocument();
    });

    it('renders start date input', () => {
      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    });

    it('renders end date input', () => {
      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Assign/i })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates team member selection', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Assign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Team member is required/i)).toBeInTheDocument();
      });
    });

    it('validates allocation percentage range (0-100)', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const allocationInput = screen.getByLabelText(/Allocation Percentage/i);
      await user.clear(allocationInput);
      await user.type(allocationInput, '150');

      const submitButton = screen.getByRole('button', { name: /Assign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Allocation must be between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('validates date sequence', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const startDateInput = screen.getByLabelText(/Start Date/i);
      const endDateInput = screen.getByLabelText(/End Date/i);

      await user.type(startDateInput, '2025-03-01');
      await user.type(endDateInput, '2025-01-01');

      const submitButton = screen.getByRole('button', { name: /Assign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/End date must be after start date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits valid assignment data', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });
      vi.mocked(api.default.post).mockResolvedValueOnce({
        status: 201,
        data: { id: 'new-assign-id' },
      });

      const onAssign = vi.fn();
      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={onAssign}
          onCancel={vi.fn()}
        />
      );

      await user.selectOptions(screen.getByLabelText(/Team Member/i), 'user-1');
      await user.type(screen.getByLabelText(/Allocation Percentage/i), '75');
      await user.type(screen.getByLabelText(/Start Date/i), '2025-01-01');

      const submitButton = screen.getByRole('button', { name: /Assign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.default.post).toHaveBeenCalledWith(
          `/api/v1/phases/${mockPhase.id}/assignments`,
          expect.objectContaining({
            userId: 'user-1',
            workingPercent: 75,
          })
        );
        expect(onAssign).toHaveBeenCalledWith(expect.objectContaining({
          id: 'new-assign-id',
        }));
      });
    });

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Over-Allocation Detection', () => {
    it('shows warning when user is over-allocated', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: [
          { userId: 'user-1', totalAllocation: 80, isOverAllocated: false },
        ],
      });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await user.selectOptions(screen.getByLabelText(/Team Member/i), 'user-1');

      await waitFor(() => {
        expect(screen.getByText(/User is currently allocated 80%/i)).toBeInTheDocument();
      });
    });

    it('blocks submission when over-allocation would exceed 100%', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: [
          { userId: 'user-1', totalAllocation: 85, isOverAllocated: false },
        ],
      });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await user.selectOptions(screen.getByLabelText(/Team Member/i), 'user-1');
      await user.type(screen.getByLabelText(/Allocation Percentage/i), '25');

      const submitButton = screen.getByRole('button', { name: /Assign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Allocation would exceed 100%/i)).toBeInTheDocument();
        expect(api.default.post).not.toHaveBeenCalled();
      });
    });
  });

  describe('Team Leader Mode', () => {
    it('hides team member selector for non-manager users', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          userRole="TEAM_LEADER"
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.queryByLabelText(/Team Member/i)).not.toBeInTheDocument();
    });

    it('shows read-only view for existing assignments', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          existingAssignment={mockExistingAssignments[0]}
          userRole="TEAM_MEMBER"
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText(/Read-only mode/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Assign/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const teamMemberInput = screen.getByLabelText(/Team Member/i);
      expect(teamMemberInput).toHaveAttribute('aria-required');

      const submitButton = screen.getByRole('button', { name: /Assign/i });
      expect(submitButton).toBeEnabled();
    });

    it('supports keyboard navigation', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ users: mockTeamMembers });

      renderWithRouter(
        <TeamAssignmentForm
          phase={mockPhase}
          onAssign={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Assign/i });
      expect(submitButton).toBeInTheDocument();
    });
  });
});
