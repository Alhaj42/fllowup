import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  LinearProgress,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Search, FilterList, FilterListOff, Refresh, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';

interface Project {
  id: string;
  name: string;
  contractCode: string;
  clientId: string;
  clientName?: string;
  status: string;
  progress?: number;
}

interface FilterState {
  search: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANNED: { label: 'Planned', color: '#9e9e9e' },
  IN_PROGRESS: { label: 'In Progress', color: '#4caf50' },
  COMPLETE: { label: 'Complete', color: '#2196f3' },
  ON_HOLD: { label: 'On Hold', color: '#ff9800' },
  CANCELLED: { label: 'Cancelled', color: '#f44336' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({ search: '', status: '' });
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus = !filters.status || project.status === filters.status;
      const matchesSearch = !filters.search || 
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.contractCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        (project.clientName && project.clientName.toLowerCase().includes(filters.search.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [projects, filters]);

  const statusOptions = Object.keys(STATUS_CONFIG).map(key => ({
    value: key,
    label: STATUS_CONFIG[key].label,
    color: STATUS_CONFIG[key].color,
  }));

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    const loadProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const headers = {
          'Content-Type': 'application/json',
        } as HeadersInit;

        if (token) {
          (headers as any)['Authorization'] = `Bearer ${token}`;
        }

        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);

        const response = await fetch(`http://localhost:3000/api/v1/projects?${params.toString()}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err: any) {
        console.error('Error:', err);
        setError('Failed to load projects...');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [filters]);

  const handleFilterMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  }, []);

  const handleFilterMenuClose = useCallback(() => {
    setFilterMenuAnchor(null);
  }, []);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setFilterMenuAnchor(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ search: '', status: '' });
    setFilterMenuAnchor(null);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    return count;
  }, [filters]);

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 2, pb: 3, px: 2 }}>
      <Container maxWidth="xl">
        <Paper elevation={2} sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1">
              Projects
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtered)`}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh projects"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  <Refresh fontSize="small" />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  <Logout fontSize="small" />
                  <span>Logout</span>
                </button>
              </Box>
            </Box>

            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search projects..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                disabled={loading}
                InputProps={{
                  'aria-label': 'Search projects',
                  startAdornment: (
                    <Search sx={{ color: 'text.secondary', mr: 1 }} />
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />

              <button
                onClick={handleFilterMenuOpen}
                disabled={loading}
                aria-label="Filter by status"
                aria-haspopup="true"
                aria-expanded={Boolean(filterMenuAnchor)}
                style={{
                  padding: '8px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
              >
                <FilterListOff fontSize="small" />
                <span>
                  {filters.status ? STATUS_CONFIG[filters.status].label : 'All Statuses'}
                </span>
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  disabled={loading}
                  aria-label="Clear filters"
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d32f2f',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  Clear
                </button>
              )}
            </Box>

            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={handleFilterMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {statusOptions.map(option => (
                <MenuItem
                  key={option.value}
                  onClick={() => handleFilterChange('status', option.value)}
                  selected={filters.status === option.value}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: option.color,
                        mr: 2,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2">{option.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {error && (
            <Box sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 1 }} role="alert" aria-live="polite">
              <Typography color="error.main" sx={{ wordWrap: 'break-word' }}>
                {error}
              </Typography>
              <button
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  marginLeft: 1,
                  color: '#d32f2f',
                  fontSize: '18px',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} role="status" aria-busy="true" aria-live="polite">
              <CircularProgress size={48} thickness={4} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Loading projects...
              </Typography>
            </Box>
          )}

          {!loading && !error && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtered)`}
              </Typography>

              <Box component="ul" sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', listStyle: 'none', p: 0, m: 0 }}>
                {filteredProjects.map(project => (
                  <li key={project.id}>
                    <Paper
                      component="article"
                      elevation={1}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        transformOrigin: 'center center',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                        },
                        '&:focus-visible': {
                          outline: '3px solid #1976d2',
                          outlineOffset: '2px',
                        },
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${project.name} details`}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: STATUS_CONFIG[project.status].color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                          {project.name}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip
                          label={STATUS_CONFIG[project.status].label}
                          size="small"
                          sx={{
                            bgcolor: STATUS_CONFIG[project.status].color,
                            color: 'white',
                            fontWeight: 500,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          <strong>Code:</strong> {project.contractCode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {project.clientName || 'Unknown'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress:
                        </Typography>
                        <Box sx={{ flexGrow: 1, maxWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={project.progress || 0}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: project.progress === 100 ? '#4caf50' : '#1976d2',
                              },
                            }}
                            aria-label={`${project.progress || 0}% complete`}
                          />
                          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 32, ml: 1 }}>
                            {project.progress || 0}%
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </li>
                ))}
              </Box>
            </>
          )}

          {!loading && !error && filteredProjects.length === 0 && (
            <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                No Projects Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                {filters.search || filters.status
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first project to get started.'}
              </Typography>
              <button
                type="button"
                onClick={() => (window.location.href = '/projects/new')}
                aria-label="Create first project"
                style={{
                  marginTop: 16,
                  padding: '10px 24px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Create Project
              </button>
            </Paper>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
