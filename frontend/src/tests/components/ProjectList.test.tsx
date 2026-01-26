import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProjectList from '../../../src/components/ProjectList';

const mockProjects = [
  {
    id: '1',
    name: 'Project 1',
    contractCode: 'CONTRACT-001',
    clientId: 'client-1',
    clientName: 'Test Client',
    currentPhase: 'STUDIES',
    status: 'IN_PROGRESS',
    startDate: '2024-01-15',
    estimatedEndDate: '2024-03-15',
    progress: 45,
    totalCost: 50000,
    builtUpArea: 1000,
    licenseType: 'Residential',
    projectType: 'New Construction',
  },
  {
    id: '2',
    name: 'Project 2',
    contractCode: 'CONTRACT-002',
    clientId: 'client-1',
    clientName: 'Test Client',
    currentPhase: 'DESIGN',
    status: 'PLANNED',
    startDate: '2024-02-01',
    estimatedEndDate: '2024-04-01',
    progress: 0,
    totalCost: 75000,
    builtUpArea: 1500,
    licenseType: 'Commercial',
    projectType: 'Renovation',
  },
  {
    id: '3',
    name: 'Project 3',
    contractCode: 'CONTRACT-003',
    clientId: 'client-2',
    clientName: 'Another Client',
    currentPhase: 'STUDIES',
    status: 'COMPLETED',
    startDate: '2023-11-01',
    estimatedEndDate: '2024-01-01',
    progress: 100,
    totalCost: 100000,
    builtUpArea: 2000,
    licenseType: 'Industrial',
    projectType: 'Expansion',
  },
];

describe('ProjectList Component', () => {
  it('should render loading state initially', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={[]}
          loading={true}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error message when error exists', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={[]}
          loading={false}
          error="Failed to load projects"
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
  });

  it('should render empty state when no projects', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={[]}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('should render project list', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Project 3')).toBeInTheDocument();
  });

  it('should display project cards', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    const projectCards = screen.getAllByRole('article');
    expect(projectCards).toHaveLength(3);
  });

  it('should show project status indicators', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should display project contract codes', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('CONTRACT-001')).toBeInTheDocument();
    expect(screen.getByText('CONTRACT-002')).toBeInTheDocument();
    expect(screen.getByText('CONTRACT-003')).toBeInTheDocument();
  });

  it('should show progress bars', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(3);
  });

  it('should display client names', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Another Client')).toBeInTheDocument();
  });

  it('should navigate to project detail on card click', async () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    const firstCard = screen.getByRole('article');
    fireEvent.click(firstCard);

    await waitFor(() => {
      expect(window.location.pathname).toContain('/projects/1');
    });
  });

  it('should display project dates', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Mar 15, 2024/i)).toBeInTheDocument();
  });

  it('should handle filter changes', async () => {
    const onFilterChange = vi.fn();

    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
          onFilterChange={onFilterChange}
        />
      </BrowserRouter>
    );

    const statusFilter = screen.getByLabelText('Filter by status');
    fireEvent.change(statusFilter, { target: { value: 'IN_PROGRESS' } });

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith({ status: 'IN_PROGRESS' });
    });
  });

  it('should show project count', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/3 projects/i)).toBeInTheDocument();
  });

  it('should handle pagination controls', () => {
    const onPageChange = vi.fn();

    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
          pagination={{ page: 1, totalPages: 5 }}
          onPageChange={onPageChange}
        />
      </BrowserRouter>
    );

    const nextPageButton = screen.getByLabelText('Next page');
    fireEvent.click(nextPageButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should be accessible', () => {
    render(
      <BrowserRouter>
        <ProjectList
          projects={mockProjects}
          loading={false}
          error={null}
        />
      </BrowserRouter>
    );

    const cards = screen.getAllByRole('article');
    cards.forEach(card => {
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('role', 'article');
    });
  });
});
