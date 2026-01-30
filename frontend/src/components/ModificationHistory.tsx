import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import apiClient from '../services/api';

export interface ModificationRecord {
  id: string;
  projectId: string;
  modificationNumber: number;
  description: string;
  createdAt: string;
  createdBy: string | null;
  daysUsed?: number;
}

export interface ModificationStats {
  projectId: string;
  totalAllowed: number;
  totalUsed: number;
  remaining: number;
  daysPerTime: number;
  daysUsed: number;
  canModify: boolean;
  modifications: ModificationRecord[];
}

interface ModificationHistoryProps {
  projectId: string;
}

const ModificationHistory: React.FC<ModificationHistoryProps> = ({ projectId }) => {
  const [stats, setStats] = useState<ModificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<ModificationStats>(
          `/projects/${projectId}/modifications`
        );

        setStats(response.data);
      } catch (err) {
        console.error('Failed to load modifications:', err);
        setError('Failed to load modification history');
      } finally {
        setLoading(false);
      }
    };

    loadModifications();
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const remainingPercentage = stats.totalAllowed > 0
    ? ((stats.remaining / stats.totalAllowed) * 100).toFixed(0)
    : 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Modification History
        </Typography>

<Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Used
              </Typography>
              <Typography variant="h6">
                {stats.totalUsed} / {stats.totalAllowed}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Remaining
              </Typography>
              <Typography variant="h6">
                {stats.remaining}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Days Used
              </Typography>
              <Typography variant="h6">
                {stats.daysUsed}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={stats.canModify ? 'Can Modify' : 'Limit Reached'}
                color={stats.canModify ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            width: '100%',
            height: 8,
            backgroundColor: 'grey.200',
            borderRadius: 4,
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: `${remainingPercentage}%`,
              height: '100%',
              backgroundColor: stats.canModify ? 'success.main' : 'error.main',
              transition: 'width 0.3s ease',
            }}
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          {stats.canModify
            ? `You can make ${stats.remaining} more modification(s) (${stats.daysPerTime} days each)`
            : 'Modification limit reached. Contact administrator for exceptions.'}
        </Typography>

        {stats.modifications.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Modification Timeline
            </Typography>
            <List dense>
              {stats.modifications.map((mod, index) => (
                <React.Fragment key={mod.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Chip
                        label={`#${mod.modificationNumber}`}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
                        {new Date(mod.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                      {mod.daysUsed !== undefined && (
                        <Typography variant="caption" color="textSecondary">
                          {mod.daysUsed} days
                        </Typography>
                      )}
                    </Box>
                    <ListItemText
                      primary={mod.description}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="textSecondary">
                              {mod.createdBy || 'Unknown'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="textSecondary">
                              {new Date(mod.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < stats.modifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}

        {stats.modifications.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              color: 'text.secondary',
            }}
          >
            <DescriptionIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">No modifications recorded yet</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ModificationHistory;
