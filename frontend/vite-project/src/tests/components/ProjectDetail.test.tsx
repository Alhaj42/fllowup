import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectDetail from '../../../src/components/ProjectDetail';
import { useAuthStore } from '../state/authStore';

const mockProject = {
  id: '1',
  name: 'Test Project',
  contractCode: 'CONTRACT-001',
  clientId: 'client-1',
  clientName: 'Test Client',
  currentPhase: 'STUDIES',
  status: 'IN_PROGRESS',
  startDate: '2024-01-15',
  estimatedEndDate: '2024-03-15',
  actualEndDate: undefined,
  builtUpArea: 1000,
  totalCost: 50000,
  progress: 45,
  version: 1,
  modificationAllowedTimes: 3,
  modificationDaysPerTime: 5,
  phases: [
    {
      id: 'phase-1',
      projectId: '1',
      name: 'STUDIES',
      startDate: '2024-01-15',
      duration: 30,
      status: 'IN_PROGRESS',
      progress: 60,
    },
    {
      id: 'phase-2',
      projectId: '1',
      name: 'DESIGN',
      startDate: '2024-03-15',
      duration: 60,
      status: 'PLANNED',
      progress: 0,
    },
  ],
  projectRequirements: [
    {
      id: 'req-1',
      projectId: '1',
      description: 'First requirement',
      isCompleted: true,
      completedAt: '2024-01-20',
      sortOrder: 1,
    },
    {
      id: 'req-2',
      projectId: '1',
      description: 'Second requirement',
      isCompleted: false,
      completedAt: null,
      sortOrder: 2,
    },
  ],
};

const mockDashboardData = {
  project: mockProject,
  phases: mockProject.phases,
  tasks: [
    {
      id: 'task-1',
      phaseId: 'phase-1',
      code: 'TASK-001',
      description: 'Initial design',
      duration: 15,
      status: 'COMPLETED',
    },
    {
      id: 'task-2',
      phaseId: 'phase-1',
      code: 'TASK-002',
      description: 'Design review',
      duration: 10,
      status: 'IN_PROGRESS',
    },
  ],
  summary: {
    totalPhases: 2,
    totalTasks: 2,
    completedTasks: 1,
    totalTeamMembers: 2,
    overallProgress: 30,
  },
};

describe('ProjectDetail Component', () => {
  it('should render project information', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('CONTRACT-001')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });

  it('should render project dates', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Mar 15, 2024/i)).toBeInTheDocument();
  });

  it('should render project status and phase', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('STUDIES')).toBeInTheDocument();
  });

  it('should render built-up area', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText(/1,000 m²/i)).toBeInTheDocument();
  });

  it('should render total cost', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText(/\$50,000/i)).toBeInTheDocument();
  });

  it('should render progress', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should render modification tracking info', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('3 modifications allowed')).toBeInTheDocument();
    expect(screen.getByText('5 days per modification')).toBeInTheDocument();
  });

  it('should render phases list', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('STUDIES')).toBeInTheDocument();
    expect(screen.getByText('DESIGN')).toBeInTheDocument();
  });

  it('should render phase progress', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should render tasks', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('TASK-001')).toBeInTheDocument();
    expect(screen.getByText('TASK-002')).toBeInTheDocument();
  });

  it('should render task status', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('should render project requirements', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('First requirement')).toBeInTheDocument();
    expect(screen.getByText('Second requirement')).toBeInTheDocument();
  });

  it('should render requirement completion status', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    const completedReq = screen.getByText('First requirement');
    expect(completedReq).toBeInTheDocument();
    expect(completedReq).toHaveClass('completed');

    const incompleteReq = screen.getByText('Second requirement');
    expect(incompleteReq).toBeInTheDocument();
    expect(incompleteReq).toHaveClass('incomplete');
  });

  it('should render project summary', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    expect(screen.getByText('Total Phases: 2')).toBeInTheDocument();
    expect(screen.getByText('Total Tasks: 2')).toBeInTheDocument();
    expect(screen.getByText('Completed: 1')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress: 30%')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" loading={true} />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error state', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" error="Failed to load project" />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to load project')).toBeInTheDocument();
  });

  it('should render edit button', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    const editButton = screen.getByRole('button', { name: /edit project/i });
    expect(editButton).toBeInTheDocument();
  });

  it('should render delete button', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /delete project/i });
    expect(deleteButton).toBeInTheDocument();
  });

  it('should render back button', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(
      <BrowserRouter>
        <ProjectDetail projectId="1" />
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
