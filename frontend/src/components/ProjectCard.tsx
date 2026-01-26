import { Box, Card, CardContent, Typography, Chip, LinearProgress, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCallback, useRef, useMemo } from 'react';

export interface Project {
  id: string;
  name: string;
  contractCode: string;
  clientId: string;
  clientName?: string;
  client?: {
    id: string;
    name: string;
  };
  currentPhase?: string;
  status: string;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  builtUpArea?: number;
  totalCost?: number;
  progress?: number;
  version: number;
  phases?: Array<{
    id: string;
    name: string;
    status: string;
    phaseOrder: number;
  }>;
  modificationAllowedTimes?: number;
  modificationDaysPerTime?: number;
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  getStatusColor?: (status: string) => string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatProgress = (progress?: number): string => {
  if (progress === undefined || progress === null) return 'N/A';
  return `${Math.round(progress)}%`;
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PLANNED':
      return 'Planned';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'ON_HOLD':
      return 'On Hold';
    case 'CANCELLED':
      return 'Cancelled';
    case 'COMPLETE':
      return 'Completed';
    default:
      return status.replace('_', ' ');
  }
};

const getPhaseLabel = (phase: string): string => {
  switch (phase) {
    case 'STUDIES':
      return 'STUDIES';
    case 'DESIGN':
      return 'DESIGN';
    default:
      return phase.replace('_', ' ');
  }
};

const defaultGetStatusColor = (status: string): string => {
  switch (status) {
    case 'PLANNED':
      return '#9e9e9e';
    case 'IN_PROGRESS':
      return '#4caf50';
    case 'ON_HOLD':
      return '#ff9800';
    case 'CANCELLED':
      return '#f44336';
    case 'COMPLETE':
      return '#2196f3';
    default:
      return '#9e9e9e';
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, getStatusColor }) => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  const currentPhase = project.currentPhase || project.phases?.find(p => p.status === 'IN_PROGRESS')?.name || 'Not Started';
  const clientName = project.clientName || project.client?.name || 'Unknown Client';
  const progress = project.progress || 0;

  const statusColor = useMemo(
    () => (getStatusColor ? getStatusColor(project.status) : defaultGetStatusColor(project.status)),
    [getStatusColor, project.status]
  );

  const builtUpAreaLabel = useMemo(
    () => (project.builtUpArea ? `${project.builtUpArea.toLocaleString()} m²` : 'N/A'),
    [project.builtUpArea]
  );

  const totalCostLabel = useMemo(
    () => formatCurrency(project.totalCost),
    [project.totalCost]
  );

  const progressLabel = useMemo(
    () => formatProgress(progress),
    [progress]
  );

  const startDateLabel = useMemo(() => formatDate(project.startDate), [project.startDate]);
  const estimatedEndDateLabel = useMemo(() => formatDate(project.estimatedEndDate), [project.estimatedEndDate]);
  const actualEndDateLabel = useMemo(() => project.actualEndDate ? formatDate(project.actualEndDate) : null, [project.actualEndDate]);

  const progressBarColor = useMemo(() => {
    if (progress === 100) return '#4caf50';
    if (progress >= 50) return '#2196f3';
    return '#ff9800';
  }, [progress]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      navigateRef.current(`/projects/${project.id}`);
    }
  }, [onClick, project.id]);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        },
      }}
      onClick={handleClick}
      role="article"
      aria-label={`${project.name} project card`}
      tabIndex={0}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip
            label={getStatusLabel(project.status)}
            size="small"
            sx={{
              backgroundColor: statusColor,
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Chip
            label={getPhaseLabel(currentPhase)}
            size="small"
            variant="outlined"
            sx={{ borderColor: '#1976d2', color: '#1976d2' }}
          />
        </Box>

        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
          {project.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          <strong>Contract Code:</strong> {project.contractCode}
        </Typography>

         <Typography
           variant="body2"
           color="text.secondary"
           sx={{ mb: 1 }}
           >
           <strong>Client:</strong> {clientName}
         </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Start Date:</strong> {startDateLabel}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Est. End:</strong> {estimatedEndDateLabel}
          </Typography>

          {actualEndDateLabel && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Actual End:</strong> {actualEndDateLabel}
            </Typography>
          )}
        </Box>

         <Box sx={{ mt: 2 }}>
           <Typography variant="body2" sx={{ mb: 0.5 }}>
             <strong>Built-up Area:</strong> {builtUpAreaLabel}
           </Typography>
           <Typography variant="body2" sx={{ mb: 0.5 }}>
             <strong>Total Cost:</strong> {totalCostLabel}
           </Typography>
         </Box>

         <Box sx={{ mt: 2 }}>
           <Typography variant="body2" sx={{ mb: 1 }}>
             <strong>Progress:</strong>
           </Typography>
           <LinearProgress
             variant="determinate"
             value={progress}
             sx={{
               height: 10,
               borderRadius:5,
               backgroundColor: '#e0e0e0',
               '& .MuiLinearProgress-bar': {
                 backgroundColor: progressBarColor,
               },
             }}
             aria-label={`${progressLabel} project progress`}
             aria-valuenow={progress}
             aria-valuemin={0}
             aria-valuemax={100}
           />
           <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
             {progressLabel}
           </Typography>
         </Box>

        {project.modificationAllowedTimes && project.modificationDaysPerTime && (
          <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Modifications:</strong> {project.modificationAllowedTimes} allowed ({project.modificationDaysPerTime} days each)
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleClick}
          aria-label={`View ${project.name} details`}
        >
          View Details
        </Button>
      </Box>
    </Card>
  );
};

export default ProjectCard;
