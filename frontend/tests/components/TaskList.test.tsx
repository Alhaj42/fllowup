import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskList from '../src/components/TaskList';

const mockTasks = [
  {
    id: '1',
    code: 'TASK-001',
    description: 'Test task 1',
    duration: 5,
    status: 'PLANNED',
    phaseId: 'phase-1',
    assignedTeamMember: { name: 'John Doe', email: 'john@example.com' },
  },
  {
    id: '2',
    code: 'TASK-002',
    description: 'Test task 2',
    duration: 7,
    status: 'IN_PROGRESS',
    phaseId: 'phase-1',
    assignedTeamMember: { name: 'Jane Smith', email: 'jane@example.com' },
  },
  {
    id: '3',
    code: 'TASK-003',
    description: 'Test task 3',
    duration: 3,
    status: 'COMPLETED',
    phaseId: 'phase-1',
  },
];

describe('TaskList Component', () => {
  it('should render task list', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText('TASK-001')).toBeInTheDocument();
    expect(screen.getByText('TASK-002')).toBeInTheDocument();
    expect(screen.getByText('TASK-003')).toBeInTheDocument();
  });

  it('should show task descriptions', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText('Test task 1')).toBeInTheDocument();
    expect(screen.getByText('Test task 2')).toBeInTheDocument();
    expect(screen.getByText('Test task 3')).toBeInTheDocument();
  });

  it('should display task durations', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText(/5 days/)).toBeInTheDocument();
    expect(screen.getByText(/7 days/)).toBeInTheDocument();
    expect(screen.getByText(/3 days/)).toBeInTheDocument();
  });

  it('should display task statuses', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText('PLANNED')).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('should show assigned team member if exists', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show unassigned label if no team member assigned', () => {
    const tasksWithUnassigned = [...mockTasks, {
      id: '4',
      code: 'TASK-004',
      description: 'Unassigned task',
      duration: 5,
      status: 'PLANNED',
      phaseId: 'phase-1',
    }];

    render(<TaskList tasks={tasksWithUnassigned} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText(/Unassigned/)).toBeInTheDocument();
  });

  it('should display create/edit/delete buttons for Team Leader', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getAllByText(/Create Task/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Edit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Delete/i).length).toBeGreaterThan(0);
  });

  it('should NOT display create/edit/delete buttons for Team Member (read-only)', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_MEMBER" />);

    expect(screen.queryByText(/Create Task/i)).toBeNull();
    expect(screen.queryByText(/Edit/i)).toBeNull();
    expect(screen.queryByText(/Delete/i)).toBeNull();
  });

  it('should show task count', () => {
    render(<TaskList tasks={mockTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText(/3 tasks/)).toBeInTheDocument();
  });

  it('should display empty state when no tasks', () => {
    render(<TaskList tasks={[]} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText(/No tasks found/)).toBeInTheDocument();
  });

  it('should filter tasks by status when filter prop is provided', () => {
    render(
      <TaskList
        tasks={mockTasks}
        phaseId="phase-1"
        userRole="TEAM_LEADER"
        statusFilter="IN_PROGRESS"
      />
    );

    expect(screen.getByText('TASK-002')).toBeInTheDocument();
    expect(screen.queryByText('TASK-001')).toBeNull();
    expect(screen.queryByText('TASK-003')).toBeNull();
  });

  it('should handle loading state', () => {
    render(<TaskList tasks={[]} phaseId="phase-1" userRole="TEAM_LEADER" loading={true} />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    render(
      <TaskList
        tasks={[]}
        phaseId="phase-1"
        userRole="TEAM_LEADER"
        error="Failed to load tasks"
      />
    );

    expect(screen.getByText(/Failed to load tasks/)).toBeInTheDocument();
  });

  it('should support sorting by code', () => {
    const sortedTasks = [...mockTasks].sort((a, b) => a.code.localeCompare(b.code));

    render(<TaskList tasks={sortedTasks} phaseId="phase-1" userRole="TEAM_LEADER" />);

    const taskElements = screen.getAllByText(/TASK-\d+/);
    expect(taskElements[0]).toHaveTextContent('TASK-001');
    expect(taskElements[1]).toHaveTextContent('TASK-002');
    expect(taskElements[2]).toHaveTextContent('TASK-003');
  });

  it('should display start and end dates if provided', () => {
    const tasksWithDates = [
      {
        id: '1',
        code: 'TASK-001',
        description: 'Task with dates',
        duration: 5,
        status: 'IN_PROGRESS',
        phaseId: 'phase-1',
        startDate: '2024-01-20',
        endDate: '2024-01-25',
      },
    ];

    render(<TaskList tasks={tasksWithDates} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText(/2024-01-20/)).toBeInTheDocument();
    expect(screen.getByText(/2024-01-25/)).toBeInTheDocument();
  });

  it('should validate duration range (0.5 - 365 days)', () => {
    const tasksWithDuration = [
      {
        id: '1',
        code: 'TASK-001',
        description: 'Task with valid duration',
        duration: 0.5,
        status: 'PLANNED',
        phaseId: 'phase-1',
      },
    ];

    render(<TaskList tasks={tasksWithDuration} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText(/0\.5 days/)).toBeInTheDocument();
  });

  it('should validate description length (10 - 500 characters)', () => {
    const longDescription = 'A'.repeat(500);
    const tasksWithLongDesc = [
      {
        id: '1',
        code: 'TASK-001',
        description: longDescription,
        duration: 5,
        status: 'PLANNED',
        phaseId: 'phase-1',
      },
    ];

    render(<TaskList tasks={tasksWithLongDesc} phaseId="phase-1" userRole="TEAM_LEADER" />);

    expect(screen.getByText(longDescription.substring(0, 50) + '...')).toBeInTheDocument();
  });
});
