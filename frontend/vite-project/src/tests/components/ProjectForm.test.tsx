import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectForm from '../../../src/components/ProjectForm';

const mockClients = [
  { id: '1', name: 'Test Client 1' },
  { id: '2', name: 'Test Client 2' },
];

const mockProject = {
  id: '1',
  name: 'Test Project',
  contractCode: 'CONTRACT-001',
  clientId: '1',
  licenseType: 'Commercial',
  projectType: 'Studies',
  requirements: 'Test requirements',
  startDate: '2024-01-15',
  estimatedEndDate: '2024-03-15',
  builtUpArea: 1000,
  currentPhase: 'STUDIES',
  status: 'PLANNED',
  modificationAllowedTimes: 3,
  modificationDaysPerTime: 5,
};

describe('ProjectForm Component', () => {
  it('should render form fields', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Contract Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Client')).toBeInTheDocument();
    expect(screen.getByLabelText('Contract Signing Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Built-up Area')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Estimated End Date')).toBeInTheDocument();
  });

  it('should render optional fields', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('License Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Requirements')).toBeInTheDocument();
    expect(screen.getByLabelText('Modification Allowed Times')).toBeInTheDocument();
    expect(screen.getByLabelText('Modification Days Per Time')).toBeInTheDocument();
  });

  it('should pre-fill form in edit mode', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="edit"
          project={mockProject}
        />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Project Name')).toHaveValue('Test Project');
    expect(screen.getByLabelText('Contract Code')).toHaveValue('CONTRACT-001');
    expect(screen.getByLabelText('Built-up Area')).toHaveValue(1000);
    expect(screen.getByLabelText('Modification Allowed Times')).toHaveValue(3);
    expect(screen.getByLabelText('Modification Days Per Time')).toHaveValue(5);
  });

  it('should validate required fields', async () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/contract code is required/i)).toBeInTheDocument();
      expect(screen.getByText(/client is required/i)).toBeInTheDocument();
    });
  });

  it('should validate built-up area is positive', async () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const builtUpAreaInput = screen.getByLabelText('Built-up Area');
    fireEvent.change(builtUpAreaInput, { target: { value: '-1000' } });

    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/built-up area must be positive/i)).toBeInTheDocument();
    });
  });

  it('should validate date sequence', async () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('Estimated End Date');

    fireEvent.change(startDateInput, { target: { value: '2024-03-15' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-15' } });

    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/estimated end date must be after start date/i)).toBeInTheDocument();
    });
  });

  it('should validate modification count is non-negative', async () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const modificationInput = screen.getByLabelText('Modification Allowed Times');
    fireEvent.change(modificationInput, { target: { value: '-1' } });

    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/modification allowed times must be non-negative/i)).toBeInTheDocument();
    });
  });

  it('should populate client dropdown', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const clientSelect = screen.getByLabelText('Client');
    expect(clientSelect).toBeInTheDocument();
    fireEvent.mouseDown(clientSelect);

    expect(screen.getByText('Test Client 1')).toBeInTheDocument();
    expect(screen.getByText('Test Client 2')).toBeInTheDocument();
  });

  it('should populate license type dropdown', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const licenseSelect = screen.getByLabelText('License Type');
    expect(licenseSelect).toBeInTheDocument();
    fireEvent.mouseDown(licenseSelect);

    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByText('Residential')).toBeInTheDocument();
  });

  it('should populate project type dropdown', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const projectTypeSelect = screen.getByLabelText('Project Type');
    expect(projectTypeSelect).toBeInTheDocument();
    fireEvent.mouseDown(projectTypeSelect);

    expect(screen.getByText('Studies')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('should display cancel button', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', async () => {
    const onCancel = jest.fn();

    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
          onCancel={onCancel}
        />
      </BrowserRouter>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('should display loading state during submission', async () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
          loading={true}
        />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /create project/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
          error="Failed to create project"
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to create project')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
        />
      </BrowserRouter>
    );

    const inputs = screen.getAllByRole('textbox', { hidden: false });
    inputs.forEach(input => {
      expect(input).toHaveAttribute('aria-label');
    });

    const selects = screen.getAllByRole('combobox');
    selects.forEach(select => {
      expect(select).toHaveAttribute('aria-label');
    });
  });

  it('should handle form submission', async () => {
    const onSubmit = jest.fn();

    render(
      <BrowserRouter>
        <ProjectForm
          clients={mockClients}
          mode="create"
          onSubmit={onSubmit}
        />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Project Name'), {
      target: { value: 'New Test Project' },
    });
    fireEvent.change(screen.getByLabelText('Contract Code'), {
      target: { value: 'NEW-001' },
    });
    fireEvent.change(screen.getByLabelText('Client'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Built-up Area'), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2024-02-01' },
    });
    fireEvent.change(screen.getByLabelText('Estimated End Date'), {
      target: { value: '2024-04-30' },
    });

    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        clientId: '1',
        name: 'New Test Project',
        contractCode: 'NEW-001',
        builtUpArea: 1000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-30',
      });
    });
  });
});
