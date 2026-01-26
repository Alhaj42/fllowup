import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETE', label: 'Completed' },
] as const;

const PHASE_OPTIONS = [
  { value: '', label: 'All Phases' },
  { value: 'STUDIES', label: 'STUDIES' },
  { value: 'DESIGN', label: 'DESIGN' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#9e9e9e',
  IN_PROGRESS: '#4caf50',
  ON_HOLD: '#ff9800',
  CANCELLED: '#f44336',
  COMPLETE: '#2196f3',
};

const getStatusColor = (status: string): string => STATUS_COLORS[status] || '#9e9e9e';

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading = false,
  error = null,
  pagination,
  onFilterChange,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [page, setPage] = useState(pagination?.page ?? 1);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (pagination?.page) {
      setPage(pagination.page);
    }
  }, [pagination?.page]);

  const handleStatusFilterChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    const status = event.target.value as string;
    setFilterStatus(status);
    onFilterChange?.({ status, phase: filterPhase || undefined });
  }, [filterPhase, onFilterChange]);

  const handlePhaseFilterChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    const phase = event.target.value as string;
    setFilterPhase(phase);
    onFilterChange?.({ status: filterStatus || undefined, phase });
  }, [filterStatus, onFilterChange]);

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    onPageChange?.(value);
    window.scrollTo(0, 0);
  }, [onPageChange]);

  const handleCardClick = useCallback((projectId: string) => {
    navigateRef.current(`/projects/${projectId}`);
  }, []);

  const projectsCountLabel = useMemo(
    () => `${projects.length} ${projects.length === 1 ? 'Project' : 'Projects'}`,
    [projects.length]
  );

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
               {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
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
              {PHASE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>
        {projectsCountLabel}
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
