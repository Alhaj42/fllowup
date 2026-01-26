import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  FormHelperText,
  Alert,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';

interface Client {
  id: string;
  name: string;
}

interface CreateProjectFormData {
  name: string;
  contractCode: string;
  clientId: string;
  status: string;
  startDate: string;
  estimatedEndDate: string;
  builtUpArea: string;
}

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETE', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export default function CreateProject() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [formData, setFormData] = useState<CreateProjectFormData>({
    name: '',
    contractCode: '',
    clientId: '',
    status: 'PLANNED',
    startDate: '',
    estimatedEndDate: '',
    builtUpArea: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.contractCode.trim()) {
      newErrors.contractCode = 'Contract code is required';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.estimatedEndDate) {
      newErrors.estimatedEndDate = 'Estimated end date is required';
    }

    if (formData.startDate && formData.estimatedEndDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.estimatedEndDate);

      if (startDate >= endDate) {
        newErrors.estimatedEndDate = 'End date must be after start date';
      }
    }

    if (formData.builtUpArea && parseFloat(formData.builtUpArea) <= 0) {
      newErrors.builtUpArea = 'Built-up area must be greater than 0';
    }

    setErrors(newErrors);

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  }, [formData]);

  const handleFieldChange = useCallback((field: keyof CreateProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const { isValid } = validateForm();

    if (!isValid) {
      return;
    }

    setLoading(true);

    const token = localStorage.getItem('auth_token');

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name.trim(),
          contractCode: formData.contractCode.trim(),
          clientId: formData.clientId,
          status: formData.status,
          startDate: formData.startDate,
          estimatedEndDate: formData.estimatedEndDate,
          builtUpArea: formData.builtUpArea ? parseFloat(formData.builtUpArea) : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setSuccess(true);

      setTimeout(() => {
        navigate(`/projects/${data.id}`);
      }, 1500);

    } catch (err: any) {
      console.error('Failed to create project:', err);
      setSubmitError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, navigate]);

  const handleCancel = useCallback(() => {
    if (loading) {
      return;
    }

    const formChanges = Object.values(formData).some(value => value !== '');

    if (formChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) {
        return;
      }
    }

    navigate('/dashboard');
  }, [loading, formData, navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create Project
          </Typography>

          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 1 }}>
              <button
                type="button"
                onClick={e => { e.preventDefault(); navigate('/dashboard'); }}
                aria-label="Back to dashboard"
                style={{
                  background: 'transparent',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              >
                ←
              </button>
              <span>Back to Dashboard</span>
            </Link>
          </Box>

          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }} role="alert" aria-live="polite" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} role="status" aria-live="polite">
              Project created successfully! Redirecting…
            </Alert>
          )}

          <form onSubmit={handleSubmit} aria-label="Create project form">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Project Information
                </Typography>

                <TextField
                  fullWidth
                  label="Project Name"
                  required
                  autoComplete="off"
                  name="projectName"
                  value={formData.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  disabled={loading}
                  inputProps={{ maxLength: 100, 'aria-label': 'Project name', 'aria-invalid': !!errors.name }}
                  aria-describedby="name-helper"
                />

                <TextField
                  fullWidth
                  label="Contract Code"
                  required
                  autoComplete="off"
                  name="contractCode"
                  value={formData.contractCode}
                  onChange={e => handleFieldChange('contractCode', e.target.value.toUpperCase())}
                  error={!!errors.contractCode}
                  helperText={errors.contractCode}
                  disabled={loading}
                  inputProps={{ style: { textTransform: 'uppercase' }, 'aria-label': 'Contract code', 'aria-invalid': !!errors.contractCode }}
                  aria-describedby="contractCode-helper"
                />

                <FormControl fullWidth required disabled={loading} error={!!errors.clientId}>
                  <Typography id="client-label">Client</Typography>
                  <Select
                    labelId="client-select"
                    label="Select Client"
                    value={formData.clientId}
                    onChange={e => handleFieldChange('clientId', e.target.value)}
                    disabled={loading}
                    aria-describedby="client-helper"
                    inputProps={{ 'aria-label': 'Select client' }}
                  >
                    <MenuItem value="">Select a client...</MenuItem>
                    <MenuItem value="mock-client-1">Mock Client 1</MenuItem>
                    <MenuItem value="mock-client-2">Mock Client 2</MenuItem>
                  </Select>
                  {errors.clientId && <FormHelperText id="client-helper" error>{errors.clientId}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth required disabled={loading} error={!!errors.status}>
                  <Typography id="status-label">Status</Typography>
                  <Select
                    labelId="status-select"
                    label="Select Status"
                    value={formData.status}
                    onChange={e => handleFieldChange('status', e.target.value)}
                    disabled={loading}
                    aria-describedby="status-helper"
                    inputProps={{ 'aria-label': 'Select status' }}
                  >
                    {STATUS_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.status && <FormHelperText id="status-helper" error>{errors.status}</FormHelperText>}
                </FormControl>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Dates
                </Typography>

                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  required
                  autoComplete="off"
                  name="startDate"
                  value={formData.startDate}
                  onChange={e => handleFieldChange('startDate', e.target.value)}
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  disabled={loading}
                  inputProps={{ 'aria-label': 'Start date', 'aria-invalid': !!errors.startDate }}
                  aria-describedby="startDate-helper"
                />

                <TextField
                  fullWidth
                  label="Estimated End Date"
                  type="date"
                  required
                  autoComplete="off"
                  name="estimatedEndDate"
                  value={formData.estimatedEndDate}
                  onChange={e => handleFieldChange('estimatedEndDate', e.target.value)}
                  error={!!errors.estimatedEndDate}
                  helperText={errors.estimatedEndDate}
                  disabled={loading}
                  inputProps={{ 'aria-label': 'Estimated end date', 'aria-invalid': !!errors.estimatedEndDate }}
                  aria-describedby="estimatedEndDate-helper"
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Built-Up Area (optional)
                </Typography>

                <TextField
                  fullWidth
                  label="Built-Up Area (m²)"
                  type="number"
                  autoComplete="off"
                  name="builtUpArea"
                  value={formData.builtUpArea}
                  onChange={e => handleFieldChange('builtUpArea', e.target.value)}
                  error={!!errors.builtUpArea}
                  helperText={errors.builtUpArea || 'Enter numeric value for area in square meters'}
                  disabled={loading}
                  inputProps={{
                    min: 0,
                    step: 1,
                    inputMode: 'numeric',
                    'aria-label': 'Built-up area',
                    'aria-invalid': !!errors.builtUpArea,
                    'aria-describedby': 'builtUpArea-helper'
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                aria-label="Cancel and return to dashboard"
                style={{
                  padding: '10px 24px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                aria-label="Create project"
                style={{
                  padding: '10px 24px',
                  border: '1px solid #1976d2',
                  borderRadius: '6px',
                  background: '#1976d2',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {loading && (
                  <>
                    <CircularProgress size={20} thickness={3} sx={{ color: 'inherit' }} />
                    <span>Creating…</span>
                  </>
                )}
                {!loading && <span>Create Project</span>}
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 4 }}>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              style={{
                background: 'transparent',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: '#d32f2f',
              }}
            >
              Logout
            </button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
