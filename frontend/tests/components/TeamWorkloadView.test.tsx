import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamWorkloadView from '../../../src/components/TeamWorkloadView';

// Mock API
vi.mock('../../../src/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('TeamWorkloadView Component', () => {
  const mockTeamWorkload = [
    {
      teamMemberId: 'user-1',
      teamMemberName: 'John Doe',
      teamMemberEmail: 'john@example.com',
      totalAllocation: 80,
      isOverallocated: false,
      assignments: [
        {
          id: 'assignment-1',
          projectName: 'Project Alpha',
          phaseName: 'STUDIES',
          role: 'TEAM_MEMBER',
          workingPercentage: 50,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        },
        {
          id: 'assignment-2',
          projectName: 'Project Alpha',
          phaseName: 'DESIGN',
          role: 'TEAM_MEMBER',
          workingPercentage: 30,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        },
      ],
    },
    {
      teamMemberId: 'user-2',
      teamMemberName: 'Jane Smith',
      teamMemberEmail: 'jane@example.com',
      totalAllocation: 120,
      isOverallocated: true,
      assignments: [
        {
          id: 'assignment-3',
          projectName: 'Project Beta',
          phaseName: 'STUDIES',
          role: 'TEAM_LEADER',
          workingPercentage: 60,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        },
        {
          id: 'assignment-4',
          projectName: 'Project Beta',
          phaseName: 'DESIGN',
          role: 'TEAM_LEADER',
          workingPercentage: 60,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        },
      ],
    },
    {
      teamMemberId: 'user-3',
      teamMemberName: 'Bob Wilson',
      teamMemberEmail: 'bob@example.com',
      totalAllocation: 0,
      isOverallocated: false,
      assignments: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all team members', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should render team member email addresses', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should render allocation percentage for each member', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('120%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should render over-allocation indicator for overallocated members', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // Jane Smith is overallocated (120%)
      const janeWarning = screen.getAllByText('⚠️').filter(el =>
        el.closest('[data-email="jane@example.com"]')
      );
      expect(janeWarning.length).toBeGreaterThan(0);
    });

    it('should not render over-allocation indicator for non-overallocated members', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // John Doe is not overallocated (80%)
      const johnRow = screen.getByText('john@example.com').closest('[data-email="john@example.com"]');
      const johnWarning = johnRow?.querySelector('[data-overallocated="true"]');

      expect(johnWarning).toBeNull();
    });

    it('should render assignments list for each team member', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // John Doe has 2 assignments
      expect(screen.getAllByText('Project Alpha')).toHaveLength(2);
      expect(screen.getByText('STUDIES')).toBeInTheDocument();
      expect(screen.getByText('DESIGN')).toBeInTheDocument();
    });

    it('should display role for each assignment', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText('TEAM_MEMBER')).toBeInTheDocument();
      expect(screen.getByText('TEAM_LEADER')).toBeInTheDocument();
    });

    it('should display dates for each assignment', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText('2025-01-01')).toBeInTheDocument();
      expect(screen.getByText('2025-03-31')).toBeInTheDocument();
    });
  });

  describe('Over-Allocation Indicators', () => {
    it('should show red bar for overallocated members (>100%)', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // Jane Smith has 120%
      const janeRow = screen.getByText('jane@example.com').closest('[data-email="jane@example.com"]');
      const allocationBar = janeRow?.querySelector('[data-allocation-bar="true"]');

      expect(allocationBar).toHaveClass('bg-red-500');
    });

    it('should show green bar for well-allocated members (≤100%)', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // John Doe has 80%
      const johnRow = screen.getByText('john@example.com').closest('[data-email="john@example.com"]');
      const allocationBar = johnRow?.querySelector('[data-allocation-bar="true"]');

      expect(allocationBar).toHaveClass('bg-green-500');
    });

    it('should show yellow bar for warning threshold (90-99%)', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // Jane Smith has 120% (shows red), but let's test with a different mock
      const warningWorkload = [
        {
          ...mockTeamWorkload[0],
          totalAllocation: 95,
          isOverallocated: false,
        },
      ];
      const { api: require('../../../src/services/api') };
      api.get.mockResolvedValue({ data: warningWorkload });

      const { rerender } = render(<TeamWorkloadView projectId="proj-1" />);
      rerender(<TeamWorkloadView projectId="proj-1" teamWorkload={warningWorkload} />);

      const johnRow = screen.getByText('john@example.com').closest('[data-email="john@example.com"]');
      const allocationBar = johnRow?.querySelector('[data-allocation-bar="true"]');

      expect(allocationBar).toHaveClass('bg-yellow-500');
    });

    it('should display warning icon with tooltip for overallocated members', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      const janeRow = screen.getByText('jane@example.com').closest('[data-email="jane@example.com"]');
      const warningIcon = janeRow?.querySelector('[data-warning-icon="true"]');

      expect(warningIcon).toBeInTheDocument();
      expect(warningIcon).toHaveAttribute('title', expect.stringContaining('over-allocated'));
    });
  });

  describe('Empty State', () => {
    it('should render empty message when no team members assigned', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: [] });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText(/no team members assigned/i)).toBeInTheDocument();
    });

    it('should not show assignment tables when empty', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: [] });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.queryByText('Project')).not.toBeInTheDocument();
      expect(screen.queryByText('Phase')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching data', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 1000)));

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading team workload/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when API fails', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockRejectedValue(new Error('Failed to fetch team workload'));

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText(/failed to load team workload/i)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should display team members sorted alphabetically by name', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      const rows = screen.getAllByRole('row');
      const names = rows.map(row => row.querySelector('[data-member-name="true"]')?.textContent);
      const sortedNames = [...names].sort((a: string, b: string) => a.localeCompare(b));

      expect(names).toEqual(sortedNames);
    });
  });

  describe('Summary Statistics', () => {
    it('should display total team members count', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText(/total team members.*3/i)).toBeInTheDocument();
    });

    it('should display overallocated members count', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      expect(screen.getByText(/overallocated.*1/i)).toBeInTheDocument();
    });

    it('should display average allocation', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // (80 + 120 + 0) / 3 = 66.67%
      expect(screen.getByText(/average.*66.67%/i)).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Details', () => {
    it('should show assignments when expanding a team member', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // By default, all assignments might be collapsed
      // Click on a member to expand
      const johnRow = screen.getByText('John Doe').closest('[data-member-name="true"]');
      const expandButton = johnRow?.querySelector('[data-expand="true"]');

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText('Project Alpha')).toBeVisible();
        });
      }
    });

    it('should hide assignments when collapsing a team member', () => {
      const { api } = require('../../../src/services/api');
      api.get.mockResolvedValue({ data: mockTeamWorkload });

      render(<TeamWorkloadView projectId="proj-1" />);

      // Assume John is expanded
      // Click collapse
      const johnRow = screen.getByText('John Doe').closest('[data-member-name="true"]');
      const collapseButton = johnRow?.querySelector('[data-collapse="true"]');

      if (collapseButton) {
        fireEvent.click(collapseButton);
        await waitFor(() => {
          expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
        });
      }
    });
  });
});
