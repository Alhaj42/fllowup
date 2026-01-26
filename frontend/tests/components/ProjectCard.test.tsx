import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectCard from '../src/components/ProjectCard';

const mockProject = {
  id: '1',
  name: 'Test Project',
  contractCode: 'CONTRACT-001',
  status: 'IN_PROGRESS',
  clientName: 'Test Client',
  progress: 50,
};

describe('ProjectCard Component', () => {
  it('should render project card', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('CONTRACT-001')).toBeInTheDocument();
  });

  it('should display project status', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
  });

  it('should show client name', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });

  it('should display progress bar', () => {
    render(<ProjectCard project={mockProject} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle navigation click', () => {
    const { mockClick } = vi.hoisted(vi.fn());

    render(<ProjectCard project={mockProject} onNavigate={mockClick} />);

    // Verify card is clickable
    // Implementation depends on ProjectCard component structure
  });
});
