import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { api } from '../../services/api';

export interface CostEntry {
  id: string;
  projectId: string;
  type: 'EMPLOYEE' | 'MATERIAL';
  description: string;
  amount: number;
  teamMember?: {
    id: string;
    name: string;
  };
  date: string;
  createdAt: string;
}

export interface CostSummary {
  projectId: string;
  totalCost: number;
  employeeCostTotal: number;
  materialCostTotal: number;
  employeeCostCount: number;
  materialCostCount: number;
  totalEntries: number;
}

interface CostListProps {
  projectId: string;
  onRefresh?: () => void;
}

export const CostList: React.FC<CostListProps> = ({ projectId, onRefresh }) => {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<CostEntry | null>(null);

  useEffect(() => {
    fetchCosts();
  }, [projectId]);

  const fetchCosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/projects/${projectId}/costs`);
      setCosts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load costs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/costs/summary', { params: { projectId } });
      setSummary(response.data);
    } catch (err: any) {
      console.error('Failed to load cost summary:', err);
    }
  };

  useEffect(() => {
    if (costs.length > 0) {
      fetchSummary();
    }
  }, [costs]);

  const handleDeleteClick = (cost: CostEntry) => {
    setCostToDelete(cost);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!costToDelete) return;

    try {
      await api.delete(`/costs/${costToDelete.id}`);
      setDeleteDialogOpen(false);
      setCostToDelete(null);

      await fetchCosts();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete cost entry');
    }
  };

  const getTypeColor = (type: string): 'success' | 'info' | 'default' => {
    switch (type) {
      case 'EMPLOYEE':
        return 'success';
      case 'MATERIAL':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>Loading costs...</Typography>
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
        <Typography variant="h5" gutterBottom>
          Cost Entries ({costs.length})
        </Typography>

        <Button variant="contained" onClick={() => { fetchCosts(); if (onRefresh) onRefresh(); }}>
          Refresh
        </Button>
      </Box>

      {summary && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.light' }}>
          <Typography variant="h6" gutterBottom>
            Cost Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">Total Cost:</Typography>
              <Typography variant="h4">{formatCurrency(summary.totalCost)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">Employee Costs:</Typography>
              <Typography variant="h4">{formatCurrency(summary.employeeCostTotal)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">Material Costs:</Typography>
              <Typography variant="h4">{formatCurrency(summary.materialCostTotal)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">Total Entries:</Typography>
              <Typography variant="h4">{summary.totalEntries}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Team Member</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No cost entries found. Add your first cost entry to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              costs.map((cost) => (
                <TableRow key={cost.id} hover>
                  <TableCell>
                    <Chip label={cost.type} size="small" color={getTypeColor(cost.type)} />
                  </TableCell>
                  <TableCell>{cost.description}</TableCell>
                  <TableCell>{formatCurrency(cost.amount)}</TableCell>
                  <TableCell>
                    {cost.teamMember ? cost.teamMember.name : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(cost.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(cost)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this cost entry?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            <strong>Type:</strong> {costToDelete?.type}<br />
            <strong>Description:</strong> {costToDelete?.description}<br />
            <strong>Amount:</strong> {costToDelete && formatCurrency(costToDelete.amount)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
