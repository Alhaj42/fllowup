import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import apiClient from '../services/api';

export interface Requirement {
  id: string;
  projectId: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  sortOrder: number;
  modificationCount: number;
  isModified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RequirementFormProps {
  projectId: string;
  mode?: 'create' | 'edit';
  requirement?: Requirement;
  onCancel?: () => void;
  onSuccess?: (requirement: Requirement) => void;
}

const RequirementForm: React.FC<RequirementFormProps> = ({
  projectId,
  mode = 'create',
  requirement,
  onCancel,
  onSuccess,
}) => {
  const [description, setDescription] = useState(requirement?.description || '');
  const [isModified, setIsModified] = useState(requirement?.isModified || false);
  const [sortOrder, setSortOrder] = useState(requirement?.sortOrder || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (!description.trim()) {
      setDescriptionError('Description is required');
      return false;
    }
    if (description.trim().length > 1000) {
      setDescriptionError('Description must be less than 1000 characters');
      return false;
    }
    setDescriptionError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'create') {
        const response = await apiClient.post<Requirement>(`/projects/${projectId}/requirements`, {
          description: description.trim(),
          isModified,
          sortOrder,
        });

        onSuccess?.(response.data);

        setDescription('');
        setIsModified(false);
        setSortOrder(prev => prev + 1);
      } else if (requirement) {
        const response = await apiClient.patch<Requirement>(`/requirements/${requirement.id}`, {
          description: description.trim(),
          isModified,
          sortOrder,
        });

        onSuccess?.(response.data);
      }
    } catch (err) {
      console.error('Failed to save requirement:', err);
      setError('Failed to save requirement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDescription(requirement?.description || '');
    setIsModified(requirement?.isModified || false);
    setSortOrder(requirement?.sortOrder || 1);
    setError(null);
    setDescriptionError(null);
    onCancel?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {mode === 'create' ? 'Add Requirement' : 'Edit Requirement'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            error={!!descriptionError}
            helperText={
              descriptionError ||
              `${description.length}/1000 characters`
            }
            disabled={loading}
            required
            placeholder="Enter requirement description..."
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isModified}
                  onChange={e => setIsModified(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Modified Requirement"
            />

            <TextField
              label="Sort Order"
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              disabled={loading}
              inputProps={{ min: 1, step: 1 }}
              sx={{ width: 150 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
              >
                {mode === 'create' ? 'Cancel' : 'Discard Changes'}
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              startIcon={mode === 'create' ? <Add /> : undefined}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Saving...
                </>
              ) : (
                mode === 'create' ? 'Add Requirement' : 'Save Changes'
              )}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default RequirementForm;
