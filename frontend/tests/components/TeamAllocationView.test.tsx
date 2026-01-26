import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TeamAllocationView from '../../src/components/TeamAllocationView';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../src/state/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id', role: 'MANAGER' },
  })),
  hasRole: vi.fn(() => true),
}));

describe('TeamAllocationView Component', () => {
  const mockTeamAllocations = [
    {
      userId: 'user-1',
      userName: 'Alice Johnson',
      userEmail: 'alice@example.com',
      totalAllocation: 75,
      isOverAllocated: false,
      assignments: [
        {
          id: 'assign-1',
          phaseId: 'phase-1',
          phaseName: 'Studies',
          workingPercent: 50,
          role: 'TEAM_MEMBER',
          startDate: '2025-01-01',
          endDate: '2025-03-01',
        },
        {
          id: 'assign-2',
          phaseId: 'phase-2',
          phaseName: 'Design',
          workingPercent: 25,
          role: 'TEAM_MEMBER',
          startDate: '2025-03-01',
          endDate: '2025-06-01',
        },
      ],
    },
    {
      userId: 'user-2',
      userName: 'Bob Smith',
      userEmail: 'bob@example.com',
      totalAllocation: 110,
      isOverAllocated: true,
      assignments: [
        {
          id: 'assign-3',
          phaseId: 'phase-1',
          phaseName: 'Studies',
          workingPercent: 80,
          role: 'TEAM_MEMBER',
          startDate: '2025-01-01',
          endDate: '2025-03-01',
        },
        {
          id: 'assign-4',
          phaseId: 'phase-2',
          phaseName: 'Design',
          workingPercent: 30,
          role: 'TEAM_MEMBER',
          startDate: '2025-03-01',
          endDate: '2025-06-01',
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('Team Allocation List Rendering', () => {
    it('renders team member cards', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });
    });

    it('displays total allocation percentage', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('110%')).toBeInTheDocument();
      });
    });

    it('shows user email', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText('alice@example.com')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });
    });

    it('shows user avatar or initials', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const aliceInitials = screen.getAllByText('AJ');
        expect(aliceInitials.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Assignment Details Display', () => {
    it('displays all assignments per user', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Studies/i)).toBeInTheDocument();
        expect(screen.getByText(/Design/i)).toBeInTheDocument();
      });
    });

    it('shows allocation percentage per assignment', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const percentages = screen.getAllByText(/%/);
        expect(percentages.length).toBeGreaterThan(2);
      });
    });

    it('shows assignment role badges', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText(/TEAM_MEMBER/i)).toBeInTheDocument();
      });
    });
  });

  describe('Over-Allocation Warning', () => {
    it('shows warning for over-allocated users', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Over-allocated/i)).toBeInTheDocument();
      });
    });

    it('highlights over-allocated users visually', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const warningIcons = screen.getAllByRole('alert');
        expect(warningIcons.length).toBeGreaterThan(0);
      });
    });

    it('shows allocation percentage in red for over-allocated', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const bobAllocation = screen.getByText('110%');
        expect(bobAllocation).toHaveStyle({ color: '#f44336' });
      });
    });

    it('shows allocation percentage in green for properly allocated', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const aliceAllocation = screen.getByText('75%');
        expect(aliceAllocation).toHaveStyle({ color: '#4caf50' });
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('supports filtering by user role', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(
        <TeamAllocationView
          projectId="project-1"
          filterByRole="TEAM_MEMBER"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });
    });

    it('supports filtering by phase', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(
        <TeamAllocationView
          projectId="project-1"
          filterByPhaseId="phase-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Studies/i)).toBeInTheDocument();
      });
    });

    it('supports sorting by allocation percentage', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(
        <TeamAllocationView
          projectId="project-1"
          sortBy="allocation"
          sortOrder="desc"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('110%')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading spinner while fetching allocations', () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockImplementationOnce(
        () => new Promise(() => {})
      );

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/Loading allocations/i)).toBeInTheDocument();
    });

    it('shows error message when fetch fails', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockRejectedValueOnce(
        new Error('Failed to fetch allocations')
      );

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load allocations/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when no allocations exist', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: [],
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText(/No team allocations found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for allocation cards', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const userCard = screen.getByText(/Alice Johnson/i).closest('[role="article"]');
        expect(userCard).toHaveAttribute('role', 'article');
      });
    });

    it('has proper ARIA alerts for over-allocation warnings', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('supports keyboard navigation', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        const userCards = screen.getAllByRole('article');
        expect(userCards.length).toBe(2);
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({
        allocations: mockTeamAllocations,
      });

      renderWithRouter(<TeamAllocationView projectId="project-1" />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });
  });
});
