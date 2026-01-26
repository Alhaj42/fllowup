import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { useAuthStore } from '../state/authStore';
import PhaseList from '../components/PhaseList';

const STATUS_CONFIG = {
  PLANNED: { label: 'Planned', color: '#9e9e9e' },
  IN_PROGRESS: { label: 'In Progress', color: '#4caf50' },
  COMPLETE: { label: 'Complete', color: '#2196f3' },
  ON_HOLD: { label: 'On Hold', color: '#ff9800' },
  CANCELLED: { label: 'Cancelled', color: '#f44336' },
};

interface Project {
  id: string;
  name: string;
  contractCode: string;
  clientName?: string;
  status: string;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  builtUpArea?: number;
  progress?: number;
  version: number;
}

export default function ProjectDetail() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const canEdit = user && user.role === 'MANAGER';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PLANNED;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    const loadProject = async () => {
      setLoading(true);
      setError(null);

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setProject(data);
      } catch (err: any) {
        console.error('Error loading project:', err);
        setError('Failed to load project. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  const handleEdit = useCallback(() => {
    navigate(`/projects/${projectId}/edit`);
  }, [navigate, projectId]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 3, pb: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleBack}
              aria-label="Back to dashboard"
            >
              Back
            </Button>

            <Typography variant="h4" component="h1">
              {loading ? 'Loading...' : project?.name || 'Project Details'}
            </Typography>
          </Box>

          {!loading && !error && canEdit && project && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleEdit}
              aria-label="Edit project"
            >
              Edit
            </Button>
          )}
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} role="status" aria-busy="true" aria-live="polite">
            <CircularProgress size={60} />
            <Typography sx={{ mt: 2 }}>Loading project details…</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" role="alert" aria-live="polite" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
            <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>Back to Dashboard</Button>
          </Alert>
        )}

        {!loading && !error && project && (
          <Paper elevation={2} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Project Information
              </Typography>

              <Chip
                label={getStatusConfig(project.status).label}
                size="medium"
                sx={{
                  bgcolor: getStatusConfig(project.status).color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Version {project.version}
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Contract Code</Typography>
                <Typography variant="h6" sx={{ wordWrap: 'break-word' }}>
                  {project.contractCode}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Client</Typography>
                <Typography variant="h6">
                  {project.clientName || 'Unknown'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Typography variant="h6">
                  {getStatusConfig(project.status).label}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Progress</Typography>
                <Typography variant="h6">
                  {project.progress || 0}%
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Start Date</Typography>
                <Typography variant="h6">
                  {formatDate(project.startDate)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Estimated End Date</Typography>
                <Typography variant="h6">
                  {formatDate(project.estimatedEndDate)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">Built-Up Area</Typography>
                <Typography variant="h6">
                  {project.builtUpArea ? `${project.builtUpArea} m²` : 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleLogout}
                aria-label="Log out"
                sx={{
                  background: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 24px',
                  cursor: 'pointer',
                }}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        )}

        {!loading && !error && project && (
          <PhaseList projectId={project.id} />
        )}

      </Container>
    </Box>
  );
}
