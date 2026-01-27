import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  MenuItem,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { api } from '../../services/api';

export interface KPISummary {
  employeeId: string;
  total: number;
  delayedTasksCount: number;
  clientModificationsCount: number;
  technicalMistakesCount: number;
  performanceScore: number;
  projectsAssigned: number;
  projectSummaries: Array<{
    projectId: string;
    projectName: string;
    contractCode: string;
    role: string;
    workingPercentage: number;
    phase: {
      phaseName: string;
      status: string;
      taskCount: number;
      completedTasks: number;
    };
  }>;
}

export interface EmployeeKPISummaryProps {
  employeeId: string;
  onRefresh?: () => void;
}

export const EmployeeKPISummary: React.FC<EmployeeKPISummaryProps> = ({ employeeId, onRefresh }) => {
  const [summary, setSummary] = useState<KPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');

  useEffect(() => {
    fetchSummary();
  }, [employeeId]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/employees/${employeeId}/kpis`);
      setSummary(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load KPI summary');
    } finally {
      setLoading(false);
    }
  };

  const getKPITypeColor = (type: string): 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'DELAYED_TASK':
        return 'error';
      case 'CLIENT_MODIFICATION':
        return 'warning';
      case 'TECHNICAL_MISTAKE':
        return 'error';
      default:
        return 'success';
    }
  };

  const filteredProjects = summary?.projectSummaries || [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>Loading KPI data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Employee KPI Summary
        </Typography>

        <Box display="flex" gap={2}>
          <TextField
            select
            label="Filter by Project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Projects</MenuItem>
            {Array.from(new Set(filteredProjects.map(p => p.projectId))).map(projectId => (
              <MenuItem key={projectId} value={projectId}>
                {filteredProjects.find(p => p.projectId === projectId)?.projectName || projectId}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Filter by Phase"
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Phases</MenuItem>
            <MenuItem value="Studies">Studies</MenuItem>
            <MenuItem value="Design">Design</MenuItem>
            <MenuItem value="Technical">Technical</MenuItem>
            <MenuItem value="Construction">Construction</MenuItem>
          </TextField>

          <Button variant="outlined" onClick={() => { fetchSummary(); if (onRefresh) onRefresh(); }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {summary && (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Performance Overview
                  </Typography>
                  <Typography variant="h3" gutterBottom>
                    {summary.performanceScore}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={summary.performanceScore}
                    sx={{ mt: 2 }}
                    color={summary.performanceScore >= 80 ? 'success' : summary.performanceScore >= 60 ? 'warning' : 'error'}
                  />
                  <Typography variant="caption" sx={{ mt: 1 }} color="textSecondary">
                    Performance Score: {summary.performanceScore >= 80 ? 'Excellent' : summary.performanceScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    KPI Breakdown
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography variant="body2" color="error">
                        Delayed Tasks
                      </Typography>
                      <Typography variant="h4">
                        {summary.delayedTasksCount}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="warning">
                        Client Modifications
                      </Typography>
                      <Typography variant="h4">
                        {summary.clientModificationsCount}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="error">
                        Technical Mistakes
                      </Typography>
                      <Typography variant="h4">
                        {summary.technicalMistakesCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Project Assignments
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {summary.projectsAssigned} Projects
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Contract</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Allocation</TableCell>
                      <TableCell>Phase</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tasks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No project assignments found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((projectSummary) => (
                        <TableRow key={`${projectSummary.projectId}-${projectSummary.projectName}`}>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {projectSummary.projectName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {projectSummary.contractCode}
                          </TableCell>
                          <TableCell>
                            <Chip label={projectSummary.role} size="small" />
                          </TableCell>
                          <TableCell>
                            {projectSummary.workingPercentage}%
                          </TableCell>
                          <TableCell>
                            <Chip label={projectSummary.phase.phaseName} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={projectSummary.phase.status}
                              size="small"
                              color={projectSummary.phase.status === 'COMPLETE' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {projectSummary.taskCount}
                            {projectSummary.completedTasks > 0 && (
                              <Typography variant="caption" color="success">
                                ({projectSummary.completedTasks} completed)
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};
