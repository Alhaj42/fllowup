import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProjectCard from '../../../src/components/ProjectCard';

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
  progress: 45,
  totalCost: 50000,
  modificationAllowedTimes: 3,
  modificationDaysPerTime: 5,
  builtUpArea: 1000,
  licenseType: 'Residential',
  projectType: 'New Construction',
  projectRequirements: [
    { id: '1', description: 'Requirement 1', completed: true },
    { id: '2', description: 'Requirement 2', completed: false },
  ],
};

describe('ProjectCard Component', () => {
  it('should render project name', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should display contract code', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('CONTRACT-001')).toBeInTheDocument();
  });

  it('should show client name', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });

  it('should display project status', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should display current phase', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('STUDIES')).toBeInTheDocument();
  });

  it('should show progress bar', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should display progress percentage', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should show project dates', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Mar 15, 2024/i)).toBeInTheDocument();
  });

  it('should display total cost', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText(/50,000/i)).toBeInTheDocument();
    });

  it('should show modification tracking info', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('3 modifications allowed')).toBeInTheDocument();
    expect(screen.getByText('5 days per modification')).toBeInTheDocument();
  });

  it('should navigate to project detail on click', async () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const card = screen.getByRole('article');
    fireEvent.click(card);

    expect(window.location.pathname).toContain('/projects/1');
  });

  it('should display status color indicators', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const statusBadge = screen.getByText('In Progress');
    expect(statusBadge).toBeInTheDocument();
  });

  it('should show different status for completed projects', () => {
    const completedProject = { ...mockProject, status: 'COMPLETED' as const, progress: 100 };

    render(
      <BrowserRouter>
        <ProjectCard project={completedProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should show different status for planned projects', () => {
    const plannedProject = { ...mockProject, status: 'PLANNED' as const, progress: 0 };

    render(
      <BrowserRouter>
        <ProjectCard project={plannedProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show on hold status', () => {
    const onHoldProject = { ...mockProject, status: 'ON_HOLD' as const };

    render(
      <BrowserRouter>
        <ProjectCard project={onHoldProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('On Hold')).toBeInTheDocument();
  });

  it('should display cancelled status', () => {
    const cancelledProject = { ...mockProject, status: 'CANCELLED' as const };

    render(
      <BrowserRouter>
        <ProjectCard project={cancelledProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('should show design phase', () => {
    const designPhaseProject = { ...mockProject, currentPhase: 'DESIGN' as const };

    render(
      <BrowserRouter>
        <ProjectCard project={designPhaseProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('DESIGN')).toBeInTheDocument();
  });

  it('should handle missing dates gracefully', () => {
    const noDateProject = {
      ...mockProject,
      startDate: undefined as unknown as string,
      estimatedEndDate: undefined as unknown as string,
    };

    render(
      <BrowserRouter>
        <ProjectCard project={noDateProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should handle zero cost', () => {
    const noCostProject = { ...mockProject, totalCost: 0 };

    render(
      <BrowserRouter>
        <ProjectCard project={noCostProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should be keyboard navigable', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('should have accessible aria labels', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('progress'));
  });

  it('should display phase icon', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const phaseIcon = screen.getByLabelText('Current phase: STUDIES');
    expect(phaseIcon).toBeInTheDocument();
  });

  it('should show action buttons on hover', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const viewButton = screen.getByRole('button', { name: /view project/i });
    expect(viewButton).toBeInTheDocument();
  });
});
