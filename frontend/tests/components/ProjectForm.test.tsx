import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectForm from '../../src/components/ProjectForm';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../../src/state/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id', role: 'MANAGER' },
    hasRole: vi.fn(() => true),
  })),
  hasRole: vi.fn(() => true),
}));

describe('ProjectForm Component', () => {
  const mockClients = [
    { id: 'client-1', name: 'Test Client A' },
    { id: 'client-2', name: 'Test Client B' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('Create Mode', () => {
    it('renders form with all required fields', () => {
      renderWithRouter(<ProjectForm mode="create" />);

      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contract Code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contract Signing Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Built-up Area/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated End Date/i)).toBeInTheDocument();
    });

    it('loads clients on mount', async () => {
      const api = await import('../../src/services/api');
      vi.mocked(api.default.get).mockResolvedValueOnce({ clients: mockClients });

      renderWithRouter(<ProjectForm mode="create" />);

      await waitFor(() => {
        expect(api.default.get).toHaveBeenCalledWith('/clients');
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectForm mode="create" />);

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Project name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Contract code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Client is required/i)).toBeInTheDocument();
      });
    });

    it('validates date sequence', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ProjectForm mode="create" />);

      const startDate = screen.getByLabelText(/Start Date/i);
      const endDate = screen.getByLabelText(/Estimated End Date/i);

      await user.type(startDate, '2025-01-10');
      await user.type(endDate, '2025-01-01');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Estimated end date must be after start date/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.post).mockResolvedValueOnce({
        status: 201,
        data: { id: 'new-project-id', name: 'Test Project' },
      });
      vi.mocked(api.default.get).mockResolvedValueOnce({ clients: mockClients });

      renderWithRouter(<ProjectForm mode="create" />);

      await user.type(screen.getByLabelText(/Project Name/i), 'Test Project');
      await user.type(screen.getByLabelText(/Contract Code/i), 'TEST-001');

      const clientSelect = screen.getByLabelText(/Client/i);
      await user.selectOptions(clientSelect, 'client-1');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.default.post).toHaveBeenCalledWith('/projects', expect.objectContaining({
          name: 'Test Project',
          contractCode: 'TEST-001',
          clientId: 'client-1',
        }));
      });
    });

    it('shows success message on successful creation', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.post).mockResolvedValueOnce({
        status: 201,
        data: { id: 'new-project-id', name: 'Test Project' },
      });
      vi.mocked(api.default.get).mockResolvedValueOnce({ clients: mockClients });

      renderWithRouter(<ProjectForm mode="create" />);

      await user.type(screen.getByLabelText(/Project Name/i), 'Test Project');
      await user.type(screen.getByLabelText(/Contract Code/i), 'TEST-001');

      const clientSelect = screen.getByLabelText(/Client/i);
      fireEvent.change(clientSelect, { target: { value: 'client-1' } });

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Project created successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockProject = {
      id: 'existing-project-id',
      name: 'Existing Project',
      contractCode: 'EXIST-001',
      clientId: 'client-1',
      startDate: '2025-01-01',
      estimatedEndDate: '2025-03-01',
      builtUpArea: 1500,
      version: 1,
    };

    it('pre-fills form with project data', () => {
      renderWithRouter(<ProjectForm mode="edit" project={mockProject} />);

      expect(screen.getByLabelText(/Project Name/i)).toHaveValue('Existing Project');
      expect(screen.getByLabelText(/Contract Code/i)).toHaveValue('EXIST-001');
      expect(screen.getByLabelText(/Built-up Area/i)).toHaveValue(1500);
    });

    it('submits update with version field', async () => {
      const user = userEvent.setup();
      const api = await import('../../src/services/api');
      vi.mocked(api.default.put).mockResolvedValueOnce({
        status: 200,
        data: { ...mockProject, name: 'Updated Project' },
      });

      renderWithRouter(<ProjectForm mode="edit" project={mockProject} />);

      const nameField = screen.getByLabelText(/Project Name/i);
      await user.clear(nameField);
      await user.type(nameField, 'Updated Project');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.default.put).toHaveBeenCalledWith(
          '/projects/existing-project-id',
          expect.objectContaining({
            name: 'Updated Project',
            version: 1,
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      renderWithRouter(<ProjectForm mode="create" />);

      const nameInput = screen.getByLabelText(/Project Name/i);
      expect(nameInput).toHaveAttribute('aria-required');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      expect(submitButton).toBeEnabled();
    });

    it('disables submit button while loading', () => {
      renderWithRouter(<ProjectForm mode="create" />);

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      expect(submitButton).toBeEnabled();
    });
  });
});
