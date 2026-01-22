import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  Stack,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

export interface FilterState {
  status?: string;
  phase?: string;
  search?: string;
  clientId?: string;
}

interface ProjectFilterProps {
  onFilterChange: (filter: FilterState) => void;
  onReset?: () => void;
  filters?: FilterState;
  statusOptions?: { value: string; label: string }[];
  phaseOptions?: { value: string; label: string }[];
  clientOptions?: { value: string; label: string }[];
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({
  onFilterChange,
  onReset,
  filters = {},
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PLANNED', label: 'Planned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' },
  ],
  phaseOptions = [
    { value: '', label: 'All Phases' },
    { value: 'STUDIES', label: 'STUDIES' },
    { value: 'DESIGN', label: 'DESIGN' },
  ],
  clientOptions = [],
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const status = event.target.value as string;
    const newFilters = { ...localFilters, status };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePhaseChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const phase = event.target.value as string;
    const newFilters = { ...localFilters, phase };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClientChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const clientId = event.target.value as string;
    const newFilters = { ...localFilters, clientId };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const search = event.target.value;
    const newFilters = { ...localFilters, search };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: FilterState = {};
    setLocalFilters(emptyFilters);
    onReset?.();
  };

  const hasActiveFilters = !!(
    localFilters.status ||
    localFilters.phase ||
    localFilters.search ||
    localFilters.clientId
  );

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.status) count++;
    if (localFilters.phase) count++;
    if (localFilters.search) count++;
    if (localFilters.clientId) count++;
    return count;
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Filter Projects
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by name or contract code..."
              value={localFilters.search || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search color="action" />,
                'aria-label': 'Search projects',
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Status
              </Typography>
              <Select
                value={localFilters.status || ''}
                onChange={handleStatusChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Filter by status' }}
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Phase
              </Typography>
              <Select
                value={localFilters.phase || ''}
                onChange={handlePhaseChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Filter by phase' }}
              >
                {phaseOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Client
              </Typography>
              <Select
                value={localFilters.clientId || ''}
                onChange={handleClientChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Filter by client' }}
              >
                <MenuItem value="">All Clients</MenuItem>
                {clientOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {hasActiveFilters && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`${getActiveFilterCount()} active filter${getActiveFilterCount() !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
              />
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={handleReset}
                variant="outlined"
              >
                Clear Filters
              </Button>
            </Stack>
          </Box>
        )}

        <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Tip:</strong> Use filters to quickly find projects. Multiple filters work together.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectFilter;
