import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { api } from '../../services/api';
import { CostList, CostEntry } from './CostList';

export interface CostFormData {
  projectId: string;
  type: 'EMPLOYEE' | 'MATERIAL';
  description: string;
  amount: number;
  teamMemberId?: string;
  date?: string;
}

interface CostFormProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCostCreated?: (cost: CostEntry) => void;
  teamMembers?: Array<{ id: string; name: string }>;
}

export const CostForm: React.FC<CostFormProps> = ({
  projectId,
  open,
  onClose,
  onCostCreated,
  teamMembers = []
}) => {
  const [formData, setFormData] = useState<CostFormData>({
    projectId,
    type: 'EMPLOYEE',
    description: '',
    amount: 0,
    teamMemberId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof CostFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (formData.type === 'EMPLOYEE' && !formData.teamMemberId) {
      setError('Team member is required for employee costs');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/projects/${projectId}/costs`, formData);
      
      if (onCostCreated) {
        onCostCreated(response.data);
      }

      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create cost entry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId,
      type: 'EMPLOYEE',
      description: '',
      amount: 0,
      teamMemberId: '',
      date: new Date().toISOString().split('T')[0]
    });
    setError(null);
    onClose();
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

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Cost Type"
                value={formData.type}
                onChange={(e) => handleChange('type', e)}
                disabled={loading}
              >
                <MenuItem value="EMPLOYEE">Employee Cost</MenuItem>
                <MenuItem value="MATERIAL">Material Cost</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e)}
                disabled={loading}
                required
                error={!formData.description.trim()}
                helperText="Enter a detailed description of the cost"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount ($)"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e)}
                disabled={loading}
                required
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Enter the total amount for this cost"
              />
            </Grid>

            {formData.type === 'EMPLOYEE' && teamMembers.length > 0 && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Team Member"
                  value={formData.teamMemberId}
                  onChange={(e) => handleChange('teamMemberId', e)}
                  disabled={loading}
                  required={formData.type === 'EMPLOYEE'}
                >
                  <MenuItem value="">Select Team Member</MenuItem>
                  {teamMembers.map(member => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => handleChange('date', e)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                helperText="Leave blank to use today's date"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Cost Entry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
