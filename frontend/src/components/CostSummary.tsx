import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { api } from '../../services/api';

export interface CostEntry {
  id: string;
  projectId: string;
  phaseId: string;
  employeeId: string;
  period: string;
  costAmount: number;
  costType: 'EMPLOYEE_COST' | 'MATERIAL_COST' | 'OTHER_COST';
  description?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  phase?: {
    id: string;
    name: string;
    phaseName?: string;
  };
  employee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CostSummaryData {
  projectId: string;
  totalCost: number;
  employeeCostTotal: number;
  materialCostTotal: number;
  otherCostTotal: number;
  employeeCostCount: number;
  materialCostCount: number;
  otherCostCount: number;
  totalEntries: number;
}

export interface CostCategoryBreakdown {
  EMPLOYEE_COST: CostEntry[];
  MATERIAL_COST: CostEntry[];
  OTHER_COST: CostEntry[];
}

interface CostSummaryProps {
  projectId: string;
  onRefresh?: () => void;
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  projectId,
  onRefresh,
}) => {
  const [summary, setSummary] = useState<CostSummaryData | null>(null);
  const [categorizedCosts, setCategorizedCosts] = useState<CostCategoryBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<CostEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryResponse, categoriesResponse] = await Promise.all([
        api.get(`/costs/summary/${projectId}`),
        api.get(`/costs/project/${projectId}`)
      ]);

      setSummary(summaryResponse.data);
      setCategorizedCosts(categoriesResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load cost data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
    if (onRefresh) onRefresh();
  };

  const handleDeleteClick = (cost: CostEntry) => {
    setCostToDelete(cost);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!costToDelete) return;

    setDeleting(true);

    try {
      await api.delete(`/costs/${costToDelete.id}`);
      setDeleteDialogOpen(false);
      setCostToDelete(null);

      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete cost entry');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCostTypeColor = (type: string): 'success' | 'info' | 'warning' | 'default' => {
    switch (type) {
      case 'EMPLOYEE_COST':
        return 'success';
      case 'MATERIAL_COST':
        return 'info';
      case 'OTHER_COST':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCostTypeLabel = (type: string): string => {
    switch (type) {
      case 'EMPLOYEE_COST':
        return 'Employee';
      case 'MATERIAL_COST':
        return 'Material';
      case 'OTHER_COST':
        return 'Other';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
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
          Cost Summary
        </Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Summary Cards */}
      {summary && (
<Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Total Cost
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(summary.totalCost)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {summary.totalEntries} entries
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Employee Costs
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(summary.employeeCostTotal)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {summary.employeeCostCount} entries
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Material Costs
                </Typography>
                <Typography variant="h4" color="info.main">
                  {formatCurrency(summary.materialCostTotal)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {summary.materialCostCount} entries
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Other Costs
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(summary.otherCostTotal)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {summary.otherCostCount} entries
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Cost Breakdown by Category */}
      {categorizedCosts && (
<Grid container spacing={3}>
          {Object.entries(categorizedCosts).map(([category, costs]) => (
            <Grid xs={12} key={category}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip
                    label={getCostTypeLabel(category)}
                    color={getCostTypeColor(category)}
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="h6">
                    {getCostTypeLabel(category)} Costs ({costs.length})
                  </Typography>
                </Box>

                {costs.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No {getCostTypeLabel(category).toLowerCase()} costs recorded.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Phase</TableCell>
                          <TableCell>Employee</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Period</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {costs.map((cost) => (
                          <TableRow key={cost.id} hover>
                            <TableCell>
                              {cost.phase?.name || cost.phase?.phaseName || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {cost.employee?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {cost.description || '-'}
                            </TableCell>
                            <TableCell>
                              {formatDate(cost.period)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(cost.costAmount)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(cost)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this cost entry?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            <strong>Type:</strong> {costToDelete && getCostTypeLabel(costToDelete.costType)}<br />
            <strong>Amount:</strong> {costToDelete && formatCurrency(costToDelete.costAmount)}<br />
            <strong>Date:</strong> {costToDelete && formatDate(costToDelete.period)}<br />
            {costToDelete?.description && (
              <>
                <strong>Description:</strong> {costToDelete.description}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : undefined}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
