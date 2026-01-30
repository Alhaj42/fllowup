import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Collapse,
  Button,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import apiClient from '../services/api';

export interface Assignment {
  id: string;
  phaseId: string;
  projectName: string;
  role: 'TEAM_MEMBER' | 'TEAM_LEADER';
  workingPercentage: number;
  startDate: string;
  endDate: string | null;
}

export interface TeamMemberAllocation {
  userId: string;
  userName: string;
  totalAllocation: number;
  isOverallocated: boolean;
  assignments: Assignment[];
}

export interface TeamAllocationSummary {
  totalTeamMembers: number;
  allocatedMembers: number;
  overallocatedMembers: number;
  allocations: TeamMemberAllocation[];
}

interface TeamAllocationViewProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const TeamAllocationView: React.FC<TeamAllocationViewProps> = ({
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const [summary, setSummary] = useState<TeamAllocationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const params: any = {};
        if (projectIdFilter) params.projectId = projectIdFilter;
        if (startDateFilter) params.startDate = startDateFilter;
        if (endDateFilter) params.endDate = endDateFilter;

        const response = await apiClient.get<TeamAllocationSummary>('/team/allocation', { params });
        setSummary(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load allocations:', err);
        setError(err.response?.data?.error || 'Failed to load allocations');
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchAllocations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [projectIdFilter, startDateFilter, endDateFilter, autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setSummary(null);
  };

  const toggleRow = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const getAllocationColor = (percentage: number, isOverallocated: boolean): string => {
    if (isOverallocated) return '#f44336';
    if (percentage === 0) return '#9e9e9e';
    if (percentage === 100) return '#4caf50';
    if (percentage >= 75) return '#2196f3';
    return '#ff9800';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6">Loading Team Allocations</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.allocations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Team Allocations Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {summary ? 'No allocations match the current filters.' : 'Start by assigning team members to projects.'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Team Allocation Overview
          </Typography>
          <IconButton onClick={handleRefresh} disabled={loading} aria-label="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>

<Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Team Members
              </Typography>
              <Typography variant="h4">
                {summary.totalTeamMembers}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Allocated
              </Typography>
              <Typography variant="h4">
                {summary.allocatedMembers}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Over-allocated
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: summary.overallocatedMembers > 0 ? 'error.main' : 'text.primary',
                }}
              >
                {summary.overallocatedMembers}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Utilization
              </Typography>
              <Typography variant="h4">
                {summary.totalTeamMembers > 0
                  ? Math.round((summary.allocatedMembers / summary.totalTeamMembers) * 100)
                  : 0}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Project</InputLabel>
              <Select
                value={projectIdFilter}
                onChange={e => setProjectIdFilter(e.target.value)}
                label="Project"
              >
                <MenuItem value="">All Projects</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              value={startDateFilter}
              onChange={e => setStartDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              value={endDateFilter}
              onChange={e => setEndDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Member</TableCell>
                <TableCell>Total Allocation</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assignments</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.allocations.map(allocation => (
                <React.Fragment key={allocation.userId}>
                  <TableRow
                    hover
                    sx={{
                      cursor: allocation.assignments.length > 0 ? 'pointer' : 'default',
                    }}
                  >
                    <TableCell>{allocation.userName}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 'bold',
                          color: getAllocationColor(allocation.totalAllocation, allocation.isOverallocated),
                        }}
                      >
                        {allocation.totalAllocation}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {allocation.totalAllocation === 0 && (
                        <Chip
                          label="Unallocated"
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                      {allocation.totalAllocation > 0 && allocation.totalAllocation <= 100 && (
                        <Chip
                          label="OK"
                          size="small"
                          icon={<CheckIcon fontSize="small" />}
                          color="success"
                          variant="outlined"
                        />
                      )}
                      {allocation.isOverallocated && (
                        <Chip
                          label="Over-allocated"
                          size="small"
                          icon={<WarningIcon fontSize="small" />}
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {allocation.assignments.length} project(s)
                    </TableCell>
                    <TableCell>
                      {allocation.assignments.length > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(allocation.userId)}
                          aria-label="Expand assignments"
                          aria-expanded={expandedRows.has(allocation.userId)}
                        >
                          {expandedRows.has(allocation.userId) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0 }}>
                      <Collapse in={expandedRows.has(allocation.userId)} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                          {allocation.assignments.length > 0 ? (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Assignment Details
                              </Typography>
                              {allocation.assignments.map(assignment => (
                                <Box
                                  key={assignment.id}
                                  sx={{
                                    p: 1.5,
                                    border: '1px solid rgba(0,0,0,0.12)',
                                    borderRadius: 1,
                                    mb: 1,
                                  }}
                                >
<Grid container spacing={2} alignItems="center">
                                    <Grid xs={12} sm={4}>
                                      <Typography variant="body2" color="textSecondary">
                                        Project
                                      </Typography>
                                      <Typography variant="body1" fontWeight="medium">
                                        {assignment.projectName}
                                      </Typography>
                                    </Grid>
                                    <Grid xs={6} sm={2}>
                                      <Chip
                                        label={assignment.role}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Grid>
                                    <Grid xs={6} sm={2}>
                                      <Typography variant="body2" color="textSecondary">
                                        Allocation
                                      </Typography>
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontWeight: 'bold',
                                          color: getAllocationColor(
                                            assignment.workingPercentage,
                                            false
                                          ),
                                        }}
                                      >
                                        {assignment.workingPercentage}%
                                      </Typography>
                                    </Grid>
                                    <Grid xs={6} sm={2}>
                                      <Typography variant="body2" color="textSecondary">
                                        Period
                                      </Typography>
                                      <Typography variant="body1">
                                        {formatDate(assignment.startDate)}
                                        {' - '}
                                        {assignment.endDate ? formatDate(assignment.endDate) : 'Present'}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                              No assignments found
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TeamAllocationView;
