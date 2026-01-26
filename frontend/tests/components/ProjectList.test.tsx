import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectList from '../src/components/ProjectList';

const mockProjects = [
  {
    id: '1',
    name: 'Test Project 1',
    contractCode: 'CONTRACT-001',
    status: 'IN_PROGRESS',
    clientName: 'Test Client',
    progress: 50,
  },
  {
    id: '2',
    name: 'Test Project 2',
    contractCode: 'CONTRACT-002',
    status: 'PLANNED',
    clientName: 'Test Client',
    progress: 0,
  },
];

describe('ProjectList Component', () => {
  it('should render project list', () => {
    render(<ProjectList projects={mockProjects} />);

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('should show project count', () => {
    render(<ProjectList projects={mockProjects} />);

    expect(screen.getByText(/2 projects/)).toBeInTheDocument();
  });

  it('should display project status', () => {
    render(<ProjectList projects={mockProjects} />);

    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('PLANNED')).toBeInTheDocument();
  });

  it('should show progress bars', () => {
    render(<ProjectList projects={mockProjects} />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2);
  });
});
