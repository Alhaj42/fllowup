import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProjectDetail from '../../src/pages/ProjectDetail';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../src/state/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    logout: vi.fn(),
    user: { id: 'test-user-id', role: 'MANAGER' },
  })),
}));

const mockFetch = vi.fn();

describe('ProjectDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
  });

  const renderWithRouter = (projectId: string) => {
    return render(
      <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('shows loading spinner while fetching project', () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(() => {}) // Never resolves
      );

      renderWithRouter('test-project-id');

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/Loading project details/i)).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    const mockProject = {
      id: 'test-project-id',
      name: 'Test Project',
      contractCode: 'TEST-001',
      clientName: 'Test Client',
      status: 'IN_PROGRESS',
      startDate: '2025-01-01T00:00:00.000Z',
      estimatedEndDate: '2025-03-01T00:00:00.000Z',
      builtUpArea: 2000,
      progress: 45,
      version: 2,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProject,
      });
    });

    it('displays project details', async () => {
      renderWithRouter('test-project-id');

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('TEST-001')).toBeInTheDocument();
        expect(screen.getByText('Test Client')).toBeInTheDocument();
      });
    });

    it('shows project status chip', async () => {
      renderWithRouter('test-project-id');

      await waitFor(() => {
        const statusChip = screen.getByText(/In Progress/i);
        expect(statusChip).toBeInTheDocument();
        expect(statusChip).toHaveStyle({
          backgroundColor: '#4caf50',
          color: 'white',
        });
      });
    });

    it('displays all project information', async () => {
      renderWithRouter('test-project-id');

      await waitFor(() => {
        expect(screen.getByText('Contract Code')).toBeInTheDocument();
        expect(screen.getByText('TEST-001')).toBeInTheDocument();
        expect(screen.getByText('Client')).toBeInTheDocument();
        expect(screen.getByText('Test Client')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Progress')).toBeInTheDocument();
        expect(screen.getByText('Start Date')).toBeInTheDocument();
        expect(screen.getByText('Estimated End Date')).toBeInTheDocument();
        expect(screen.getByText('Built-Up Area')).toBeInTheDocument();
      });
    });

    it('displays formatted dates', async () => {
      renderWithRouter('test-project-id');

      await waitFor(() => {
        expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument();
        expect(screen.getByText(/Mar 1, 2025/)).toBeInTheDocument();
      });
    });

    it('displays built-up area with unit', async () => {
      renderWithRouter('test-project-id');

      await waitFor(() => {
        expect(screen.getByText(/2000 m²/i)).toBeInTheDocument();
      });
    });

    it('displays project version', async () => {
      renderWithRouter('test-project-id');

      await waitFor(() => {
        expect(screen.getByText(/Version 2/i)).toBeInTheDocument();
      });
    });

    it('has back button that navigates to dashboard', async () => {
      const { container } = renderWithRouter('test-project-id');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('shows error message when project fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      renderWithRouter('non-existent-project');

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load project/i)).toBeInTheDocument();
      });
    });

    it('provides back to dashboard button on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      renderWithRouter('non-existent-project');

      await waitFor(() => {
        expect(screen.getByText(/Back to Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Configurations', () => {
    it('renders correct status for PLANNED', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'test-id',
          name: 'Test',
          status: 'PLANNED',
        }),
      });

      renderWithRouter('test-id');

      await waitFor(() => {
        expect(screen.getByText(/Planned/i)).toBeInTheDocument();
      });
    });

    it('renders correct status for COMPLETE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'test-id',
          name: 'Test',
          status: 'COMPLETE',
        }),
      });

      renderWithRouter('test-id');

      await waitFor(() => {
        expect(screen.getByText(/Complete/i)).toBeInTheDocument();
      });
    });

    it('renders correct status for ON_HOLD', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'test-id',
          name: 'Test',
          status: 'ON_HOLD',
        }),
      });

      renderWithRouter('test-id');

      await waitFor(() => {
        expect(screen.getByText(/On Hold/i)).toBeInTheDocument();
      });
    });

    it('renders correct status for CANCELLED', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'test-id',
          name: 'Test',
          status: 'CANCELLED',
        }),
      });

      renderWithRouter('test-id');

      await waitFor(() => {
        expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for loading state', () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(() => {})
      );

      renderWithRouter('test-id');

      const loadingSpinner = screen.getByRole('status');
      expect(loadingSpinner).toHaveAttribute('aria-busy', 'true');
      expect(loadingSpinner).toHaveAttribute('aria-live', 'polite');
    });

    it('has proper ARIA attributes for error alerts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      renderWithRouter('test-id');

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('has proper ARIA labels for navigation buttons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'test-id',
          name: 'Test',
          status: 'PLANNED',
        }),
      });

      renderWithRouter('test-id');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log out/i })).toBeInTheDocument();
      });
    });
  });
});
