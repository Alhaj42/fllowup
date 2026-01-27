import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamAssignmentForm from '../../../src/components/TeamAssignmentForm';

// Mock API
vi.mock('../../../src/services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('TeamAssignmentForm Component', () => {
  const mockTeamMember = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'TEAM_MEMBER',
  };

  const mockPhases = [
    {
      id: 'phase-1',
      name: 'STUDIES',
      startDate: '2025-01-01',
      duration: 90,
      status: 'IN_PROGRESS',
    },
    {
      id: 'phase-2',
      name: 'DESIGN',
      startDate: '2025-04-01',
      duration: 90,
      status: 'PLANNED',
    },
  ];

  const mockCurrentAllocation = 50;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all required fields', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      expect(screen.getByLabelText('Phase')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Allocation (%)')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('should display team member name', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display team member email', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should display current allocation percentage', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      expect(screen.getByText(/Current allocation.*50%/)).toBeInTheDocument();
    });

    it('should render phase options', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      mockPhases.forEach((phase: any) => {
        expect(screen.getByText(phase.name)).toBeInTheDocument();
      });
    });

    it('should render role options', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      expect(screen.getByText('Team Member')).toBeInTheDocument();
      expect(screen.getByText('Team Leader')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty phase selection', async () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/phase is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for allocation < 0', async () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '-10' } });

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/allocation must be between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('should show error for allocation > 100', async () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '150' } });

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/allocation must be between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('should show error for end date before start date', async () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const startDateInput = screen.getByLabelText('Start Date');
      const endDateInput = screen.getByLabelText('End Date');

      fireEvent.change(startDateInput, { target: { value: '2025-06-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-05-01' } });

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty start date', async () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const startDateInput = screen.getByLabelText('Start Date');
      fireEvent.change(startDateInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Over-Allocation Warning', () => {
    it('should show warning when current allocation + new allocation > 100%', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={80}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '30' } });

      expect(screen.getByText(/warning.*over-allocation/i)).toBeInTheDocument();
      expect(screen.getByText(/would be 110%/i)).toBeInTheDocument();
    });

    it('should not show warning when allocation is within limits', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={50}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '20' } });

      expect(screen.queryByText(/warning.*over-allocation/i)).not.toBeInTheDocument();
    });

    it('should display warning in red color', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={85}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '20' } });

      const warning = screen.getByText(/warning/i);
      expect(warning).toHaveClass('text-red-500');
    });
  });

  describe('Form Submission', () => {
    it('should call API with correct data on submit', async () => {
      const { api } = require('../../../src/services/api');
      api.post.mockResolvedValue({ data: { id: 'new-assignment-id' } });

      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const phaseSelect = screen.getByLabelText('Phase');
      const roleSelect = screen.getByLabelText('Role');
      const allocationInput = screen.getByLabelText('Allocation (%)');
      const startDateInput = screen.getByLabelText('Start Date');
      const endDateInput = screen.getByLabelText('End Date');

      fireEvent.change(phaseSelect, { target: { value: mockPhases[1].id } });
      fireEvent.change(roleSelect, { target: { value: 'TEAM_LEADER' } });
      fireEvent.change(allocationInput, { target: { value: '60' } });
      fireEvent.change(startDateInput, { target: { value: '2025-04-01' } });
      fireEvent.change(endDateInput, { target: { value: '2025-06-30' } });

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/assignments', {
          phaseId: mockPhases[1].id,
          teamMemberId: mockTeamMember.id,
          role: 'TEAM_LEADER',
          workingPercentage: 60,
          startDate: '2025-04-01',
          endDate: '2025-06-30',
        });
      });
    });

    it('should show loading state during submission', async () => {
      const { api } = require('../../../src/services/api');
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { id: 'new-id' } }), 100)));

      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
    });

    it('should show success message on successful creation', async () => {
      const { api } = require('../../../src/services/api');
      api.post.mockResolvedValue({ data: { id: 'new-assignment-id' } });

      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/assignment created successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message on failed creation', async () => {
      const { api } = require('../../../src/services/api');
      api.post.mockRejectedValue({ response: { data: { error: 'Allocation exceeds 100%' } } });

      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const submitButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/allocation exceeds 100%/i)).toBeInTheDocument();
      });
    });

    it('should navigate back on cancel', async () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={mockCurrentAllocation}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Override Over-Allocation', () => {
    it('should show override checkbox when over-allocation detected', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={90}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '20' } });

      expect(screen.getByLabelText(/override allocation limit/i)).toBeInTheDocument();
    });

    it('should disable submit button when over-allocation without override', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={85}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '20' } });

      const submitButton = screen.getByRole('button', { name: /assign/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when override checkbox is checked', () => {
      render(
        <TeamAssignmentForm
          projectId="proj-1"
          teamMember={mockTeamMember}
          phases={mockPhases}
          currentAllocation={85}
        />
      );

      const allocationInput = screen.getByLabelText('Allocation (%)');
      fireEvent.change(allocationInput, { target: { value: '20' } });

      const overrideCheckbox = screen.getByLabelText(/override allocation limit/i);
      fireEvent.click(overrideCheckbox);

      const submitButton = screen.getByRole('button', { name: /assign/i });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
