import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '../../src/components/TaskForm';

const mockPhase = {
  id: 'phase-1',
  name: 'Studies',
  projectId: 'project-1',
};

const mockTeamMembers = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com' },
];

const mockOnSubmit = vi.fn();
const mockOnClose = vi.fn();

describe('TaskForm Component', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnClose.mockClear();
  });

  it('renders correctly', () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Create Task')).toBeInTheDocument();
    expect(screen.getByLabelText(/Task Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/Task Code/i), { target: { value: 'T001' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New Test Task' } });

    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        code: 'T001',
        description: 'New Test Task'
      }));
    });
  });

  it('should render duration field', () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
  });

  it('should render status dropdown', () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
  });

  it('should render team member selector', () => {
    render(
      <TaskForm
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        teamMembers={mockTeamMembers}
      />
    );

    expect(screen.getByLabelText(/Assign to/i)).toBeInTheDocument();
  });

  it('should render optional date fields', () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should validate duration range (0.5 - 365 days)', async () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const durationInput = screen.getByLabelText(/Duration/i);
    fireEvent.change(durationInput, { target: { value: 0 } });

    const submitButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Duration must be between 0\.5 and 365 days/i)).toBeInTheDocument();
    });
  });

  it('should validate description length (10 - 500 characters)', async () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const descInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descInput, { target: { value: 'Short' } });

    const submitButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Description must be between 10 and 500 characters/i)).toBeInTheDocument();
    });
  });

  it('should populate form with initial values for editing', () => {
    const initialTask = {
      id: 'task-1',
      code: 'TASK-001',
      description: 'Existing task',
      duration: 7,
      status: 'IN_PROGRESS',
      assignedTeamMemberId: 'user-1',
    };

    render(
      <TaskForm
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        task={initialTask}
        teamMembers={mockTeamMembers}
      />
    );

    const codeInput = screen.getByLabelText(/Task Code/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
    const durationInput = screen.getByLabelText(/Duration/i) as HTMLInputElement;

    expect(codeInput.value).toBe('TASK-001');
    expect(descInput.value).toBe('Existing task');
    expect(durationInput.value).toBe('7');
    expect(screen.getByText('Update Task')).toBeInTheDocument();
  });

  it('should pre-select assigned team member', () => {
    const initialTask = {
      id: 'task-1',
      code: 'TASK-001',
      description: 'Assigned task',
      duration: 5,
      status: 'PLANNED',
      assignedTeamMemberId: 'user-2',
    };

    render(
      <TaskForm
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        task={initialTask}
        teamMembers={mockTeamMembers}
      />
    );

    const teamMemberSelect = screen.getByLabelText(/Assign to/i) as HTMLSelectElement;
    expect(teamMemberSelect.value).toBe('user-2');
  });

  it('should call onClose when cancel button is clicked', async () => {
    render(<TaskForm open={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should display loading state', () => {
    render(
      <TaskForm
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        loading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Save/i });
    expect(submitButton).toBeDisabled();
  });

  it('should display error message', () => {
    render(
      <TaskForm
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        error="Failed to save task"
      />
    );

    expect(screen.getByText(/Failed to save task/)).toBeInTheDocument();
  });
});
