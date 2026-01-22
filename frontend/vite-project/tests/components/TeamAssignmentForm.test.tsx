import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamAssignmentForm from '../../src/components/TeamAssignmentForm';
import apiClient from '../../src/services/api';

jest.mock('../../src/services/api');

describe('TeamAssignmentForm Component', () => {
  const mockProps = {
    phaseId: 'phase-1',
    onCancel: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all required fields', () => {
      render(<TeamAssignmentForm {...mockProps} />);

      expect(screen.getByLabelText('Team Member')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Working Percentage')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<TeamAssignmentForm {...mockProps} />);

      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render form in create mode by default', () => {
      render(<TeamAssignmentForm {...mockProps} />);

      expect(screen.getByText('Create Assignment')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when team member is not selected', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { users: [] } });

      render(<TeamAssignmentForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/team member is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when working percentage is not provided', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { users: [{ id: '1', name: 'John' }] } });

      render(<TeamAssignmentForm {...mockProps} />);

      fireEvent.change(screen.getByLabelText('Team Member'), { target: { value: '1' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/working percentage is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when working percentage is out of range (0-100)', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { users: [{ id: '1', name: 'John' }] } });

      render(<TeamAssignmentForm {...mockProps} />);

      fireEvent.change(screen.getByLabelText('Team Member'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Working Percentage'), { target: { value: '150' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/working percentage must be between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('should show error when start date is not provided', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { users: [{ id: '1', name: 'John' }] } });

      render(<TeamAssignmentForm {...mockProps} />);

      fireEvent.change(screen.getByLabelText('Team Member'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Working Percentage'), { target: { value: '50' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call API with correct data on submit', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          users: [
            { id: 'user-1', name: 'John Doe', role: 'TEAM_MEMBER' },
            { id: 'user-2', name: 'Jane Smith', role: 'TEAM_LEADER' },
          ],
        },
      });

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: {
          id: 'assignment-1',
          phaseId: 'phase-1',
          teamMemberId: 'user-1',
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: '2024-02-01',
          endDate: '2024-02-28',
        },
      });

      render(<TeamAssignmentForm {...mockProps} />);

      fireEvent.change(screen.getByLabelText('Team Member'), { target: { value: 'user-1' } });
      fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'TEAM_MEMBER' } });
      fireEvent.change(screen.getByLabelText('Working Percentage'), { target: { value: '100' } });
      fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-02-01' } });
      fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-02-28' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/phases/phase-1/assignments', {
          teamMemberId: 'user-1',
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: '2024-02-01',
          endDate: '2024-02-28',
        });
      });
    });

    it('should call onSuccess callback on successful submission', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { users: [{ id: '1', name: 'John' }] } });
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: 'assignment-1' } });

      render(<TeamAssignmentForm {...mockProps} />);

      fireEvent.change(screen.getByLabelText('Team Member'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Working Percentage'), { target: { value: '100' } });
      fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-02-01' } });
      fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-02-28' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockProps.onSuccess).toHaveBeenCalledWith({ id: 'assignment-1' });
      });
    });

    it('should show loading state during submission', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { users: [{ id: '1', name: 'John' }] } });
      let resolvePromise: any;
      (apiClient.post as jest.Mock).mockImplementation(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      render(<TeamAssignmentForm {...mockProps} />);

      fireEvent.change(screen.getByLabelText('Team Member'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Working Percentage'), { target: { value: '100' } });
      fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-02-01' } });
      fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-02-28' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolvePromise({ data: { id: 'assignment-1' } });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show error message on API failure', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { users: [{ id: '1', name: 'John' }] } });
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<TeamAssignmentForm {...mockProps} />);

      fireEvent.change(screen.getByLabelText('Team Member'), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText('Working Percentage'), { target: { value: '100' } });
      fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-02-01' } });
      fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-02-28' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create assignment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Cancellation', () => {
    it('should call onCancel callback when cancel is clicked', () => {
      render(<TeamAssignmentForm {...mockProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('should clear form data on cancel', () => {
      render(<TeamAssignmentForm {...mockProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.getByLabelText('Team Member')).toHaveValue('');
      expect(screen.getByLabelText('Working Percentage')).toHaveValue('');
    });
  });

  describe('Team Member Loading', () => {
    it('should show loading state while fetching team members', async () => {
      (apiClient.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<TeamAssignmentForm {...mockProps} />);

      expect(screen.getByText(/loading team members/i)).toBeInTheDocument();
    });

    it('should populate team member dropdown after loading', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          users: [
            { id: 'user-1', name: 'John Doe' },
            { id: 'user-2', name: 'Jane Smith' },
          ],
        },
      });

      render(<TeamAssignmentForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Team Member')).toBeInTheDocument();
      });
    });

    it('should show error if team members fail to load', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Failed to load team members'));

      render(<TeamAssignmentForm {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load team members/i)).toBeInTheDocument();
      });
    });
  });
});
