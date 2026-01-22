import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Button,
  Fab,
  Add,
} from '@mui/material';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import ProjectList from '../components/ProjectList';
import ProjectFilter from '../components/ProjectFilter';
import apiClient from '../services/api';

export interface Project {
  id: string;
  name: string;
  contractCode: string;
  clientId: string;
  clientName: string;
  currentPhase: string;
  status: string;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  builtUpArea: number;
  totalCost: number;
  progress: number;
  version: number;
}

interface FilterState {
  status?: string;
  phase?: string;
  search?: string;
  clientId?: string;
}

interface DashboardResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Dashboard = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 50,
  });

  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};

      if (filters.status) params.status = filters.status;
      if (filters.phase) params.phase = filters.phase;
      if (filters.search) params.search = filters.search;
      params.page = pagination.page.toString();
      params.limit = pagination.limit.toString();

      const response = await apiClient.get<DashboardResponse>('/projects', { params });

      setProjects(response.data.projects);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        total: response.data.total,
        limit: response.data.limit,
      });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects. Please try again later.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo(0, 0);
  }, []);

  const handleResetFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Project Dashboard
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleCreateProject}
            sx={{ display: { md: 'none' } }}
          >
            Create New Project
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" color="text.secondary">
              Total Projects: <strong>{pagination.total}</strong>
            </Typography>
          </Grid>

          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body1" color="text.secondary">
              Page {pagination.page} of {pagination.totalPages}
            </Typography>
          </Grid>
        </Grid>

        <ProjectFilter
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          filters={filters}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {!loading && !error && (
        <ProjectList
          projects={projects}
          loading={loading}
          error={error}
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
          }}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
        />
      )}

      {!loading && !error && projects.length === 0 && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            No Projects Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your filters or create a new project.
          </Typography>
        </Paper>
      )}

      {!loading && !error && projects.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Planned
                </Typography>
                <Typography variant="h5">
                  {projects.filter(p => p.status === 'PLANNED').length}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
                <Typography variant="h5">
                  {projects.filter(p => p.status === 'IN_PROGRESS').length}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
                <Typography variant="h5">
                  {projects.filter(p => p.status === 'COMPLETED').length}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#fce4ec', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  On Hold
                </Typography>
                <Typography variant="h5">
                  {projects.filter(p => p.status === 'ON_HOLD').length}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Fab
        color="primary"
        aria-label="Create new project"
        onClick={handleCreateProject}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default Dashboard;
