import { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Grid,
  FormHelperText,
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import apiClient from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
}

export interface Assignment {
  id: string;
  phaseId: string;
  teamMemberId: string;
  role: 'TEAM_MEMBER' | 'TEAM_LEADER';
  workingPercentage: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

interface TeamAssignmentFormProps {
  phaseId: string;
  onCancel?: () => void;
  onSuccess?: (assignment: Assignment) => void;
}

const TeamAssignmentForm: React.FC<TeamAssignmentFormProps> = ({
  phaseId,
  onCancel,
  onSuccess,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teamMemberId, setTeamMemberId] = useState('');
  const [role, setRole] = useState<'TEAM_MEMBER' | 'TEAM_LEADER'>('TEAM_MEMBER');
  const [workingPercentage, setWorkingPercentage] = useState(100);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiClient.get<{ users: User[] }>('/users');
        setUsers(response.data.users || []);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!teamMemberId) {
      newErrors.teamMemberId = 'Team member is required';
    }

    if (!role) {
      newErrors.role = 'Role is required';
    }

    if (workingPercentage < 0 || workingPercentage > 100) {
      newErrors.workingPercentage = 'Working percentage must be between 0 and 100';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiClient.post<Assignment>(`/phases/${phaseId}/assignments`, {
        teamMemberId,
        role,
        workingPercentage,
        startDate,
        endDate: endDate || null,
      });

      onSuccess?.(response.data);
    } catch (err: any) {
      console.error('Failed to create assignment:', err);
      setError(err.response?.data?.error || 'Failed to create assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTeamMemberId('');
    setRole('TEAM_MEMBER');
    setWorkingPercentage(100);
    setStartDate('');
    setEndDate('');
    setValidationErrors({});
    onCancel?.();
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading team members...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error && !users.length) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Assign Team Member
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!validationErrors.teamMemberId}>
                <InputLabel>Team Member</InputLabel>
                <Select
                  value={teamMemberId}
                  onChange={e => setTeamMemberId(e.target.value as string)}
                  label="Team Member"
                  disabled={submitting}
                >
                  <MenuItem value="">Select a team member</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} {user.position && `(${user.position})`}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText error={!!validationErrors.teamMemberId}>
                  {validationErrors.teamMemberId}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!validationErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={role}
                  onChange={e => setRole(e.target.value as 'TEAM_MEMBER' | 'TEAM_LEADER')}
                  label="Role"
                  disabled={submitting}
                >
                  <MenuItem value="TEAM_MEMBER">Team Member</MenuItem>
                  <MenuItem value="TEAM_LEADER">Team Leader</MenuItem>
                </Select>
                <FormHelperText error={!!validationErrors.role}>
                  {validationErrors.role}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Working Percentage"
                type="number"
                required
                value={workingPercentage}
                onChange={e => setWorkingPercentage(Number(e.target.value))}
                error={!!validationErrors.workingPercentage}
                helperText={validationErrors.workingPercentage || '0-100%'}
                disabled={submitting}
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6} />

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                error={!!validationErrors.startDate}
                helperText={validationErrors.startDate}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                error={!!validationErrors.endDate}
                helperText={validationErrors.endDate || 'Optional for ongoing assignments'}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={submitting}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
            >
              {submitting ? 'Creating...' : 'Assign'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default TeamAssignmentForm;
