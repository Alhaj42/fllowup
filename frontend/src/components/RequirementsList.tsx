import { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import apiClient from '../services/api';

export interface Requirement {
  id: string;
  projectId: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  completedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  sortOrder: number;
  modificationCount: number;
  isModified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RequirementsListProps {
  requirements: Requirement[];
  canEdit: boolean;
  onRequirementToggle?: (id: string, isCompleted: boolean) => void;
  onRequirementDelete?: (id: string) => void;
  onRequirementEdit?: (requirement: Requirement) => void;
}

const RequirementsList: React.FC<RequirementsListProps> = ({
  requirements,
  canEdit,
  onRequirementToggle,
  onRequirementDelete,
  onRequirementEdit,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!canEdit) return;

    setLoading(id);
    setError(null);

    try {
      await apiClient.patch(`/requirements/${id}/complete`, {
        isCompleted: !currentStatus,
      });

      onRequirementToggle?.(id, !currentStatus);
    } catch (err) {
      console.error('Failed to update requirement:', err);
      setError('Failed to update requirement. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteClick = (requirement: Requirement) => {
    setRequirementToDelete(requirement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requirementToDelete) return;

    setLoading(requirementToDelete.id);
    setError(null);

    try {
      await apiClient.delete(`/requirements/${requirementToDelete.id}`);
      onRequirementDelete?.(requirementToDelete.id);
      setDeleteDialogOpen(false);
      setRequirementToDelete(null);
    } catch (err) {
      console.error('Failed to delete requirement:', err);
      setError('Failed to delete requirement. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleEditClick = (requirement: Requirement) => {
    onRequirementEdit?.(requirement);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not completed';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedRequirements = [...requirements].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sortedRequirements.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Typography variant="body2">No requirements added yet</Typography>
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <List dense>
        {sortedRequirements.map((req, index) => (
          <React.Fragment key={req.id}>
            <ListItem
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
                bgcolor: req.isCompleted ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1 }}>
                <Checkbox
                  checked={req.isCompleted}
                  onChange={() => handleToggle(req.id, req.isCompleted)}
                  disabled={!canEdit || loading === req.id}
                  sx={{ mt: -1 }}
                />

                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        textDecoration: req.isCompleted ? 'line-through' : 'none',
                        color: req.isCompleted ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {req.description}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        Completed: {formatDate(req.completedAt)}
                      </Typography>

                      {req.isModified && (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            bgcolor: 'warning.light',
                            color: 'warning.dark',
                            borderRadius: 1,
                            fontSize: '0.75rem',
                          }}
                        >
                          Modified ({req.modificationCount}x)
                        </Box>
                      )}

                      {req.completedByUser && (
                        <Typography variant="caption" color="text.secondary">
                          by {req.completedByUser.name}
                        </Typography>
                      )}
                    </Box>
                  }
                />

                {canEdit && (
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(req)}
                      disabled={loading === req.id}
                      aria-label="Edit requirement"
                    >
                      {loading === req.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <EditIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(req)}
                      disabled={loading === req.id}
                      color="error"
                      aria-label="Delete requirement"
                    >
                      {loading === req.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                )}
              </Box>
            </ListItem>
            {index < sortedRequirements.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRequirementToDelete(null);
        }}
        aria-labelledby="delete-requirement-dialog"
      >
        <DialogTitle id="delete-requirement-dialog">
          Delete Requirement?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the requirement &quot;{requirementToDelete?.description}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setRequirementToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RequirementsList;
