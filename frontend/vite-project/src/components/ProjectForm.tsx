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
  Chip,
  FormHelperText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import apiClient from '../services/api';

export interface Client {
  id: string;
  name: string;
}

interface ProjectFormData {
  name: string;
  contractCode: string;
  clientId: string;
  contractSigningDate: string;
  builtUpArea: number;
  licenseType?: string;
  projectType?: string;
  requirements?: string;
  startDate: string;
  estimatedEndDate: string;
  modificationAllowedTimes?: number;
  modificationDaysPerTime?: number;
}

interface ProjectFormProps {
  mode?: 'create' | 'edit';
  project?: any;
  onCancel?: () => void;
  onSuccess?: (project: any) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  mode = 'create',
  project,
  onCancel,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const hasRole = useAuthStore(state => state.hasRole);

  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    contractCode: '',
    clientId: '',
    contractSigningDate: '',
    builtUpArea: 1000,
    licenseType: '',
    projectType: '',
    requirements: '',
    startDate: '',
    estimatedEndDate: '',
    modificationAllowedTimes: 3,
    modificationDaysPerTime: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await apiClient.get<{ clients: Client[] }>('/clients');

        setClients(response.data.clients || []);
      } catch (error) {
        console.error('Failed to load clients:', error);
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setFormData({
        name: project.name || '',
        contractCode: project.contractCode || '',
        clientId: project.clientId || '',
        contractSigningDate: project.contractSigningDate ? new Date(project.contractSigningDate).toISOString().split('T')[0] : '',
        builtUpArea: project.builtUpArea || 1000,
        licenseType: project.licenseType || '',
        projectType: project.projectType || '',
        requirements: project.requirements || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        estimatedEndDate: project.estimatedEndDate ? new Date(project.estimatedEndDate).toISOString().split('T')[0] : '',
        modificationAllowedTimes: project.modificationAllowedTimes || 3,
        modificationDaysPerTime: project.modificationDaysPerTime || 5,
      });
    }
  }, [mode, project]);

  const validate = (): boolean => {
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

    if (!formData.contractSigningDate) {
      newErrors.contractSigningDate = 'Contract signing date is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.estimatedEndDate) {
      newErrors.estimatedEndDate = 'Estimated end date is required';
    }

    if (formData.builtUpArea <= 0) {
      newErrors.builtUpArea = 'Built-up area must be positive';
    }

    const contractDate = new Date(formData.contractSigningDate);
    const startDate = new Date(formData.startDate);

    if (contractDate > startDate) {
      newErrors.startDate = 'Contract signing date must be before or equal to start date';
    }

    if (startDate >= new Date(formData.estimatedEndDate)) {
      newErrors.estimatedEndDate = 'Estimated end date must be after start date';
    }

    if (formData.modificationAllowedTimes !== undefined && formData.modificationAllowedTimes < 0) {
      newErrors.modificationAllowedTimes = 'Modification allowed times must be non-negative';
    }

    if (formData.modificationDaysPerTime !== undefined && formData.modificationDaysPerTime <= 0) {
      newErrors.modificationDaysPerTime = 'Modification days per time must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'create' ? '/projects' : `/projects/${project?.id}`;
      const method = mode === 'create' ? 'post' : 'put';

      const response = await apiClient[method]<any>(endpoint, formData);

      if (response.status >= 200 && response.status < 300) {
        onSuccess?.(response.data);
        navigate(`/projects/${response.data.id}`);
      } else {
        setSubmitError('Failed to save project. Please try again.');
      }
    } catch (error: {
      console.error('Failed to save project:', error);
      setSubmitError('Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    if (mode === 'create') {
      navigate('/dashboard');
    } else {
      navigate(`/projects/${project?.id}`);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {mode === 'create' ? 'Create Project' : 'Edit Project'}
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Project Name"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contract Code"
              required
              value={formData.contractCode}
              onChange={e => setFormData({ ...formData, contractCode: e.target.value.toUpperCase() })}
              error={!!errors.contractCode}
              helperText={errors.contractCode}
              disabled={loading}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.clientId}>
              <InputLabel>Client</InputLabel>
              <Select
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value as string })}
                disabled={loading}
              >
                <MenuItem value="">Select a client</MenuItem>
                {clients.map(client => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText error={errors.clientId}>{errors.clientId}</FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contract Signing Date"
              type="date"
              required
              value={formData.contractSigningDate}
              onChange={e => setFormData({ ...formData, contractSigningDate: e.target.value as string })}
              error={!!errors.contractSigningDate}
              helperText={errors.contractSigningDate}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Built-up Area (m²)"
              type="number"
              required
              value={formData.builtUpArea}
              onChange={e => setFormData({ ...formData, builtUpArea: Number(e.target.value) })}
              error={!!errors.builtUpArea}
              helperText={errors.builtUpArea}
              disabled={loading}
              inputProps={{ inputProps: { min: 0, step: 1 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>License Type</InputLabel>
              <Select
                value={formData.licenseType}
                onChange={e => setFormData({ ...formData, licenseType: e.target.value as string })}
                disabled={loading}
              displayEmpty
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Commercial">Commercial</MenuItem>
                <MenuItem value="Residential">Residential</MenuItem>
                <MenuItem value="Industrial">Industrial</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Project Type</InputLabel>
              <Select
                value={formData.projectType}
                onChange={e => setFormData({ ...formData, projectType: e.target.value as string })}
                disabled={loading}
                displayEmpty
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Studies">Studies</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Construction">Construction</MenuItem>
                <MenuItem value="Renovation">Renovation</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Requirements"
              multiline
              rows={4}
              value={formData.requirements}
              onChange={e => setFormData({ ...formData, requirements: e.target.value })}
              error={!!errors.requirements}
              helperText={errors.requirements}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value as string })}
              error={!!errors.startDate}
              helperText={errors.startDate}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated End Date"
              type="date"
              required
              value={formData.estimatedEndDate}
              onChange={e => setFormData({ ...formData, estimatedEndDate: e.target.value as string })}
              error={!!errors.estimatedEndDate}
              helperText={errors.estimatedEndDate}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Modification Allowed Times"
              type="number"
              value={formData.modificationAllowedTimes}
              onChange={e => setFormData({ ...formData, modificationAllowedTimes: Number(e.target.value) })}
              error={!!errors.modificationAllowedTimes}
              helperText={errors.modificationAllowedTimes}
              disabled={loading}
              inputProps={{ inputProps: { min: 0, step: 1 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Modification Days Per Time"
              type="number"
              value={formData.modificationDaysPerTime}
              onChange={e => setFormData({ ...formData, modificationDaysPerTime: Number(e.target.value) })}
              error={!!errors.modificationDaysPerTime}
              helperText={errors.modificationDaysPerTime}
              disabled={loading}
              inputProps={{ inputProps: { min: 1, step: 1 } }}
            />
          </Grid>
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
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;
