import { useState, useEffect, useCallback } from 'react';
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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { User, UserRole, CreateUserInput, UpdateUserInput } from '../types/user';
import { userService } from '../services/userService';

interface UserFormProps {
  mode?: 'create' | 'edit';
  user?: User;
  onCancel?: () => void;
  onSuccess?: (user: User) => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'TEAM_LEADER', label: 'Team Leader' },
  { value: 'TEAM_MEMBER', label: 'Team Member' },
];

const UserForm: React.FC<UserFormProps> = ({
  mode = 'create',
  user,
  onCancel,
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateUserInput & { isActive?: boolean }>({
    email: '',
    name: '',
    role: 'TEAM_MEMBER',
    position: '',
    region: '',
    grade: '',
    level: '',
    monthlyCost: undefined,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'TEAM_MEMBER',
        position: user.position || '',
        region: user.region || '',
        grade: user.grade || '',
        level: user.level || '',
        monthlyCost: user.monthlyCost,
        isActive: user.isActive ?? true,
      });
    }
  }, [mode, user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (formData.monthlyCost !== undefined && formData.monthlyCost < 0) {
      newErrors.monthlyCost = 'Monthly cost must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      let response: User;

      if (mode === 'create') {
        const createData: CreateUserInput = {
          email: formData.email.trim(),
          name: formData.name.trim(),
          role: formData.role,
          position: formData.position?.trim() || undefined,
          region: formData.region?.trim() || undefined,
          grade: formData.grade?.trim() || undefined,
          level: formData.level?.trim() || undefined,
          monthlyCost: formData.monthlyCost,
        };
        response = await userService.createUser(createData);
        setSuccessMessage('User created successfully!');
      } else {
        const updateData: UpdateUserInput = {
          email: formData.email.trim(),
          name: formData.name.trim(),
          role: formData.role,
          position: formData.position?.trim() || undefined,
          region: formData.region?.trim() || undefined,
          grade: formData.grade?.trim() || undefined,
          level: formData.level?.trim() || undefined,
          monthlyCost: formData.monthlyCost,
          isActive: formData.isActive,
        };
        response = await userService.updateUser(user!.id, updateData);
        setSuccessMessage('User updated successfully!');
      }

      onSuccess?.(response);
      
      setTimeout(() => {
        setSuccessMessage(null);
        if (mode === 'create') {
          navigate('/users');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Failed to save user:', error);
      setSubmitError(error.message || 'Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    if (mode === 'create') {
      navigate('/users');
    } else if (user) {
      navigate(`/users/${user.id}`);
    }
  };

  const handleFieldChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {mode === 'create' ? 'Create User' : 'Edit User'}
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                required
                value={formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading || mode === 'edit'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={e => handleFieldChange('role', e.target.value as UserRole)}
                  disabled={loading}
                  label="Role"
                >
                  {ROLE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && <FormHelperText error>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.position || ''}
                onChange={e => handleFieldChange('position', e.target.value)}
                error={!!errors.position}
                helperText={errors.position}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Region"
                value={formData.region || ''}
                onChange={e => handleFieldChange('region', e.target.value)}
                error={!!errors.region}
                helperText={errors.region}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grade"
                value={formData.grade || ''}
                onChange={e => handleFieldChange('grade', e.target.value)}
                error={!!errors.grade}
                helperText={errors.grade}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Level"
                value={formData.level || ''}
                onChange={e => handleFieldChange('level', e.target.value)}
                error={!!errors.level}
                helperText={errors.level}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Cost"
                type="number"
                value={formData.monthlyCost || ''}
                onChange={e => handleFieldChange('monthlyCost', e.target.value ? Number(e.target.value) : undefined)}
                error={!!errors.monthlyCost}
                helperText={errors.monthlyCost || 'Monthly cost in local currency'}
                disabled={loading}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {mode === 'edit' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isActive}
                      onChange={e => handleFieldChange('isActive', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Active"
                />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm;
