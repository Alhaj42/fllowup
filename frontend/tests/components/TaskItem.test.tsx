import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskItem, { Task } from '../../src/components/TaskItem';

const mockTask: Task = {
  id: '1',
  code: 'T001',
  description: 'Test Task Description',
  duration:5,
  status: 'PLANNED',
};

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe('TaskItem Component', () => {
  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders task details correctly', () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.getByText('T001')).toBeInTheDocument();
    expect(screen.getByText('Test Task Description')).toBeInTheDocument();
    expect(screen.getByText(/Duration: 5 days/)).toBeInTheDocument();
    expect(screen.getByText('PLANNED')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    const editBtn = screen.getByLabelText('Edit task');
    await userEvent.click(editBtn);
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', async () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    const deleteBtn = screen.getByLabelText('Delete task');
    await userEvent.click(deleteBtn);
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask);
  });

  it('should NOT display edit/delete buttons for Team Member', () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_MEMBER" />);

    expect(screen.queryByLabelText('Edit task')).toBeNull();
    expect(screen.queryByLabelText('Delete task')).toBeNull();
  });

  it('should display edit/delete buttons for Team Leader', () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.queryByLabelText('Edit task')).toBeInTheDocument();
    expect(screen.queryByLabelText('Delete task')).toBeInTheDocument();
  });

  it('should display assigned team member if exists', () => {
    const taskWithAssignment: Task = {
      ...mockTask,
      assignedTeamMember: { name: 'John Doe', email: 'john@example.com' },
    };

    render(<TaskItem task={taskWithAssignment} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display "Unassigned" if no team member', () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.getByText(/Unassigned/)).toBeInTheDocument();
  });

  it('should display start and end dates if provided', () => {
    const taskWithDates: Task = {
      ...mockTask,
      startDate: '2024-01-20',
      endDate: '2024-01-25',
    };

    render(<TaskItem task={taskWithDates} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.getByText(/2024-01-20/)).toBeInTheDocument();
    expect(screen.getByText(/2024-01-25/)).toBeInTheDocument();
  });

  it('should display status badge with correct color', () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    const statusBadge = screen.getByText('PLANNED');
    expect(statusBadge).toHaveClass('status-badge');
  });

  it('should handle different task statuses', () => {
    const statuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

    statuses.forEach((status) => {
      const taskWithStatus: Task = { ...mockTask, status: status as any };

      render(<TaskItem task={taskWithStatus} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

      expect(screen.getByText(status)).toBeInTheDocument();
      render(<div></div>); // Clean up between renders
    });
  });

  it('should display checkbox for status toggle', () => {
    render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should call onStatusChange when checkbox is clicked', async () => {
    const mockOnStatusChange = jest.fn();

    render(
      <TaskItem
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
        userRole="TEAM_LEADER"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(mockOnStatusChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }));
  });

  it('should validate duration before rendering', () => {
    const taskWithDuration: Task = { ...mockTask, duration: 0.5 };

    render(<TaskItem task={taskWithDuration} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.getByText(/0\.5 days/)).toBeInTheDocument();
  });

  it('should truncate long descriptions', () => {
    const longDescription = 'A'.repeat(600);
    const taskWithLongDesc: Task = { ...mockTask, description: longDescription };

    render(<TaskItem task={taskWithLongDesc} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.queryByText(longDescription)).toBeNull();
    expect(screen.getByText(/A{50}\.\.\./)).toBeInTheDocument();
  });

  it('should handle empty state gracefully', () => {
    const emptyTask: Task = {
      ...mockTask,
      description: '',
      code: '',
    };

    render(<TaskItem task={emptyTask} onEdit={mockOnEdit} onDelete={mockOnDelete} userRole="TEAM_LEADER" />);

    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});

    it('calls onEdit when edit button is clicked', () => {
        // Mock user role store if needed, or assume permissions logic allows edit
        // Ideally we wrap with a provider or mock the store hook
        // jest.mock(...) 

        render(<TaskItem task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

        // Assuming buttons are visible (mock permission as true)
        // For simplicity, checking if button exists and clicking
        const editBtn = screen.getByLabelText('Edit task');
        fireEvent.click(editBtn);
        expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });
});
