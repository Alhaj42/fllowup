import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Checkbox,
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import ProjectForm from '../components/ProjectForm';
import ProjectCard from '../components/ProjectCard';
import ModificationHistory from '../components/ModificationHistory';
import RequirementsList from '../components/RequirementsList';
import RequirementForm from '../components/RequirementForm';
import apiClient from '../services/api';
import { Edit, Delete, ArrowBack, Add, MoreVert } from '@mui/icons-material';
import { Requirement } from '../components/RequirementsList';

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
  phases: Array<{
    id: string;
    projectId: string;
    name: string;
    status: string;
    progress: number;
  }>;
  projectRequirements: Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    completedAt: string;
    sortOrder: number;
  }>;
}

interface Phase {
  id: string;
  projectId: string;
  name: string;
  status: string;
  progress: number;
  taskCount: number;
  completedTasks: number;
}

const ProjectDetail = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasRole = useAuthStore(state => state.hasRole);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Project>(`/projects/${projectId}`);
      setProject(response.data);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmEdit = () => {
    setEditDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!project) return;

    setDeleteDialogOpen(false);
    try {
      await apiClient.delete(`/projects/${projectId}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete project:', error);
      setError('Failed to delete project. Please try again.');
    }
  };

  const handleRequirementToggle = async (requirementId: string, currentStatus: boolean) => {
    if (!project) return;

    try {
      const updatedProject = await apiClient.patch(`/requirements/${requirementId}`, {
        isCompleted: !currentStatus,
        completedAt: new Date().toISOString(),
        completedBy: project.currentPhase?.toLowerCase(),
      });

      setProject({ ...project });
    } catch (error) {
      console.error('Failed to update requirement:', error);
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return '#4caf50';
    if (progress >= 50) return '#2196f3';
    if (progress >= 25) return '#ff9800';
    return '#ff9800';
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

  const getPhaseLabel = (phaseName: string): string => {
    switch (phaseName) {
      case 'STUDIES':
        return 'STUDIES';
      case 'DESIGN':
        return 'DESIGN';
      default:
        return phaseName.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error && !project) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1">
          {project.name}
        </Typography>
        <Chip label={project.status} sx={{ bgcolor: getStatusColor(project.status), color: 'white', fontWeight: 'bold' }} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Contract Code
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="medium">
                  {project.contractCode}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Client
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="medium">
                  {project.clientName}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Start Date
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  {formatDate(project.startDate)}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Est. End Date
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  {formatDate(project.estimatedEndDate)}
                </Typography>
              </Grid>
            </Grid>

            {project.actualEndDate && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Actual End Date
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    {formatDate(project.actualEndDate)}
                  </Typography>
                </Grid>
              </Grid>
            )}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Built-up Area
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  {project.builtUpArea.toLocaleString()} m²
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Current Phase
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">
                  {getPhaseLabel(project.currentPhase)}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" align="center">
                    Progress
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign:center' }}>
                    {project.progress}%
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor:
                          project.progress >= 80
                            ? '#4caf50'
                            : project.progress >= 50
                              ? '#2196f3'
                              : '#ff9800',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box>
                <IconButton
                  color="primary"
                  onClick={handleEdit}
                  disabled={!hasRole('MANAGER')}
                  aria-label="Edit project"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={handleDelete}
                  disabled={!hasRole('MANAGER')}
                  aria-label="Delete project"
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Version: {project.version}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Paper elevation={1}>
          <Box sx={{ borderBottom: '1px solid #e0e0e0' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue as number)}
            >
              <Tab label="Phases" />
              <Tab label="Requirements" />
              <Tab label="Tasks" />
            </Tabs>
          </Box>

          <Box sx={{ p: 2 }}>
            {activeTab === 0 && (
              <Box>
                {project.phases && project.phases.length > 0 ? (
                  project.phases.map((phase) => (
                    <Paper key={phase.id} sx={{ mb: 2, p: 2, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          {getPhaseLabel(phase.name)}
                        </Typography>
                        <Chip
                          label={phase.status}
                          size="small"
                          sx={{ bgcolor: getStatusColor(phase.status), color: 'white', fontWeight: 'bold' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress: {phase.progress}%
                        </Typography>
                        <Typography variant="body1">
                          {phase.completedTasks}/{phase.taskCount}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Tasks
                        </Typography>
                        {phase.tasks && phase.tasks.length > 0 ? (
                          phase.tasks.map((task) => (
                            <Box
                              key={task.id}
                              sx={{
                                py: 1,
                                borderBottom: '1px solid #f0f0f0',
                              '&:last-child': { borderBottom: 'none' },
                              '&:hover': { bgcolor: '#fafafa' },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                  label={task.status}
                                  size="small"
                                  sx={{
                                    bgcolor:
                                      task.status === 'COMPLETED'
                                        ? '#4caf50'
                                        : task.status === 'IN_PROGRESS'
                                          ? '#2196f3'
                                          : '#9e9e9e',
                                    color: 'white',
                                  }}
                                />
                                <Typography variant="body1">
                                  {task.code}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {task.description}
                                </Typography>
                              </Box>
                            </Box>
                          )) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                              <Typography variant="body2" color="text.secondary">
                                No tasks for this phase
                              </Typography>
                            </Box>
                          )}
                      </Box>
                    </Box>
                  )) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No phases configured
                      </Typography>
                    </Box>
                  )}
                </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Project Requirements
                  </Typography>
                  {hasRole('MANAGER') && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        setShowRequirementForm(true);
                        setEditingRequirement(null);
                      }}
                    >
                      Add Requirement
                    </Button>
                  )}
                </Box>

                {showRequirementForm && (
                  <RequirementForm
                    projectId={project.id}
                    mode={editingRequirement ? 'edit' : 'create'}
                    requirement={editingRequirement || undefined}
                    onCancel={() => {
                      setShowRequirementForm(false);
                      setEditingRequirement(null);
                    }}
                    onSuccess={updatedReq => {
                      setShowRequirementForm(false);
                      setEditingRequirement(null);
                      loadProject();
                    }}
                  />
                )}

                {project.projectRequirements && project.projectRequirements.length > 0 && (
                  <RequirementsList
                    requirements={project.projectRequirements.map(req => ({
                      ...req,
                      completedByUser: req.completedBy ? {
                        id: req.completedBy,
                        name: 'Unknown',
                        email: 'unknown@example.com',
                      } : undefined,
                    }))}
                    canEdit={hasRole('MANAGER')}
                    onRequirementToggle={(id, isCompleted) => {
                      handleRequirementToggle(id, !isCompleted);
                    }}
                    onRequirementDelete={async id => {
                      await apiClient.delete(`/requirements/${id}`);
                      loadProject();
                    }}
                    onRequirementEdit={req => {
                      setEditingRequirement(req);
                      setShowRequirementForm(true);
                    }}
                  />
                )}

                {(!project.projectRequirements || project.projectRequirements.length === 0) && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No requirements added yet
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Task management coming soon...
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <ModificationHistory projectId={project.id} />
      </Grid>

      <Grid item xs={12}>
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Project Summary
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total Phases
            </Typography>
            <Typography variant="h4">
              {project.phases?.length || 0}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Total Tasks
            </Typography>
            <Typography variant="h4">
              {project.phases?.reduce((sum, p) => sum + p.tasks.length, 0) || 0}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="h4">
              {project.progress}%
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Budget
            </Typography>
            <Typography variant="h4">
              {formatCurrency(project.totalCost || 0)}
            </Typography>
          </Box>
        </Box>
      </Grid>
      </Grid>

      <Dialog
        open={editDialogOpen}
        onClose={confirmEdit}
        aria-labelledby="edit-project-dialog"
      >
        <DialogTitle id="edit-project-dialog">Edit Project</DialogTitle>
        <DialogContent>
          <ProjectForm
            mode="edit"
            project={project}
            onCancel={confirmEdit}
            onSuccess={(updatedProject) => {
              setProject(updatedProject);
              setEditDialogOpen(false);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmEdit}>Cancel</Button>
          <Button onClick={confirmEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-project-dialog"
      >
        <DialogTitle id="delete-project-dialog">
          Delete Project?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete project &quot;{project.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetail;
