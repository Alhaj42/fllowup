import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import { api } from '../../services/api';

export interface CostEntryFormData {
  projectId: string;
  phaseId: string;
  employeeId: string;
  period: string;
  costAmount: number;
  costType: 'EMPLOYEE_COST' | 'MATERIAL_COST' | 'OTHER_COST';
  description?: string;
}

export interface Phase {
  id: string;
  name: string;
  phaseName?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
}

interface CostEntryFormProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCostCreated?: (cost: any) => void;
}

export const CostEntryForm: React.FC<CostEntryFormProps> = ({
  projectId,
  open,
  onClose,
  onCostCreated,
}) => {
  const [formData, setFormData] = useState<CostEntryFormData>({
    projectId,
    phaseId: '',
    employeeId: '',
    period: new Date().toISOString().split('T')[0],
    costAmount: 0,
    costType: 'EMPLOYEE_COST',
    description: '',
  });

  const [phases, setPhases] = useState<Phase[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && projectId) {
      loadPhases();
      loadEmployees();
    }
  }, [open, projectId]);

  const loadPhases = async () => {
    setLoadingData(true);
    try {
      const response = await api.get(`/projects/${projectId}/phases`);
      setPhases(response.data || []);
    } catch (err: any) {
      console.error('Failed to load phases:', err);
      setError('Failed to load phases');
    } finally {
      setLoadingData(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/users?role=TEAM_MEMBER');
      setEmployees(response.data.users || response.data || []);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    }
  };

  const handleChange = (field: keyof CostEntryFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'costAmount' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSelectChange = (field: keyof CostEntryFormData) => (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value as string }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phaseId) {
      setError('Phase is required');
      return;
    }

    if (!formData.employeeId) {
      setError('Employee is required');
      return;
    }

    if (!formData.period) {
      setError('Period is required');
      return;
    }

    if (formData.costAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!formData.costType) {
      setError('Cost type is required');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/costs', {
        ...formData,
        period: new Date(formData.period).toISOString(),
      });

      if (onCostCreated) {
        onCostCreated(response.data);
      }

      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create cost entry';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId,
      phaseId: '',
      employeeId: '',
      period: new Date().toISOString().split('T')[0],
      costAmount: 0,
      costType: 'EMPLOYEE_COST',
      description: '',
    });
    setError(null);
    onClose();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Cost Entry</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loadingData && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          )}

          {!loadingData && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
<Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Phase</InputLabel>
                  <Select
                    value={formData.phaseId}
                    onChange={handleSelectChange('phaseId')}
                    label="Phase"
                    disabled={loading}
                  >
                    <MenuItem value="">Select Phase</MenuItem>
                    {phases.map((phase) => (
                      <MenuItem key={phase.id} value={phase.id}>
                        {phase.name || phase.phaseName || 'Unnamed Phase'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

<Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={formData.employeeId}
                    onChange={handleSelectChange('employeeId')}
                    label="Employee"
                    disabled={loading}
                  >
                    <MenuItem value="">Select Employee</MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

<Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Period"
                  value={formData.period}
                  onChange={handleChange('period')}
                  disabled={loading}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

<Grid xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Cost Type</InputLabel>
                  <Select
                    value={formData.costType}
                    onChange={handleSelectChange('costType')}
                    label="Cost Type"
                    disabled={loading}
                  >
                    <MenuItem value="EMPLOYEE_COST">Employee Cost</MenuItem>
                    <MenuItem value="MATERIAL_COST">Material Cost</MenuItem>
                    <MenuItem value="OTHER_COST">Other Cost</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

<Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.costAmount || ''}
                  onChange={handleChange('costAmount')}
                  disabled={loading}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText={`Enter amount (e.g., ${formatCurrency(1000)})`}
                />
              </Grid>

<Grid xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange('description')}
                  disabled={loading}
                  placeholder="Enter a detailed description of the cost"
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingData}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Creating...' : 'Create Cost Entry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
