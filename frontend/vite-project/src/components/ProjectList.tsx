import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import { useAuthStore } from '../state/authStore';

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

interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    totalPages: number;
  };
  onFilterChange?: (filter: { status?: string; phase?: string }) => void;
  onPageChange?: (page: number) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading = false,
  error = null,
  pagination,
  onFilterChange,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const hasRole = useAuthStore(state => state.hasRole);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [page, setPage] = useState(pagination?.page ?? 1);

  useEffect(() => {
    if (pagination?.page) {
      setPage(pagination.page);
    }
  }, [pagination?.page]);

  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const status = event.target.value as string;
    setFilterStatus(status);
    onFilterChange?.({ status, phase: filterPhase || undefined });
  };

  const handlePhaseFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const phase = event.target.value as string;
    setFilterPhase(phase);
    onFilterChange?.({ status: filterStatus || undefined, phase });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    onPageChange?.(value);
    window.scrollTo(0, 0);
  };

  const handleCardClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PLANNED':
        return '#9e9e9e';
      case 'IN_PROGRESS':
        return '#4caf50';
      case 'ON_HOLD':
        return '#ff9800';
      case 'CANCELLED':
        return '#f44336';
      case 'COMPLETED':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No projects found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Filter by Status
            </Typography>
            <Select
              value={filterStatus}
              onChange={handleStatusFilterChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter by status' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PLANNED">Planned</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="ON_HOLD">On Hold</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Filter by Phase
            </Typography>
            <Select
              value={filterPhase}
              onChange={handlePhaseFilterChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter by phase' }}
            >
              <MenuItem value="">All Phases</MenuItem>
              <MenuItem value="STUDIES">STUDIES</MenuItem>
              <MenuItem value="DESIGN">DESIGN</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>
        {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
      </Typography>

      <Grid container spacing={2}>
        {projects.map(project => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
            <ProjectCard
              project={project}
              onClick={() => handleCardClick(project.id)}
              getStatusColor={getStatusColor}
            />
          </Grid>
        ))}
      </Grid>

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            aria-label="project list pagination"
          />
        </Box>
      )}
    </Box>
  );
};

export default ProjectList;
