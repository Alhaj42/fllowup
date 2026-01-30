import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  FilterListOff,
  Refresh,
  Logout,
  Edit,
  Delete,
  Add,
  ToggleOn,
  ToggleOff,
  Block,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, hasRole } from '../state/authStore';
import type { User, UserFilters, UserRole } from '../types/user';
import { USER_ROLES } from '../types/user';
import { userService } from '../services/userService';
import UserForm from '../components/UserForm';

const ROLE_COLORS: Record<UserRole, string> = {
  MANAGER: '#1976d2',
  TEAM_LEADER: '#ed6c02',
  TEAM_MEMBER: '#2e7d32',
};

export default function Users() {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const currentUser = useAuthStore(state => state.user);
  const isManager = hasRole('MANAGER');

  // Redirect non-managers
  useEffect(() => {
    if (!isManager) {
      navigate('/dashboard');
    }
  }, [isManager, navigate]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<UserFilters>(({}));
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesActive = filters.isActive === undefined || user.isActive === filters.isActive;
      const matchesSearch = !filters.search ||
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        (user.position && user.position.toLowerCase().includes(filters.search.toLowerCase()));
      return matchesRole && matchesActive && matchesSearch;
    });
  }, [users, filters]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.getUsers();
      setUsers(response.users || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isManager) {
      loadUsers();
    }
  }, [isManager, loadUsers]);

  const handleFilterMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  }, []);

  const handleFilterMenuClose = useCallback(() => {
    setFilterMenuAnchor(null);
  }, []);

  const handleFilterChange = useCallback((key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setFilterMenuAnchor(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setFilterMenuAnchor(null);
  }, []);

  const handleRefresh = () => {
    loadUsers();
  };

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  const handleCreateUser = () => {
    setDialogMode('create');
    setSelectedUser(undefined);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await userService.deleteUser(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const updatedUser = await userService.toggleUserActive(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      setError('Failed to update user status. Please try again.');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUser(undefined);
  };

  const handleUserSuccess = (user: User) => {
    if (dialogMode === 'create') {
      setUsers(prev => [user, ...prev]);
    } else {
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }
    setDialogOpen(false);
    setSelectedUser(undefined);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role) count++;
    if (filters.isActive !== undefined) count++;
    return count;
  }, [filters]);

  const roleOptions = Object.keys(USER_ROLES).map(key => ({
    value: key as UserRole,
    label: USER_ROLES[key as UserRole],
  }));

  if (!isManager) {
    return null;
  }

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 2, pb: 3, px: 2 }}>
      <Container maxWidth="xl">
        <Paper elevation={2} sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1">
              Users
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {users.length} {users.length === 1 ? 'user' : 'users'}
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtered)`}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh users"
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
          </Box>

          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search users..."
              value={filters.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
              disabled={loading}
              InputProps={{
                'aria-label': 'Search users',
                startAdornment: (
                  <Search sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />

            <button
              onClick={handleFilterMenuOpen}
              disabled={loading}
              aria-label="Filter by role"
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
              <FilterList fontSize="small" />
              <span>
                {filters.role ? USER_ROLES[filters.role] : 'All Roles'}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange('isActive', filters.isActive === undefined ? true : filters.isActive === true ? false : undefined)}
              disabled={loading}
              aria-label="Filter by status"
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
              {filters.isActive === undefined && <FilterListOff fontSize="small" />}
              {filters.isActive === true && <ToggleOn fontSize="small" />}
              {filters.isActive === false && <ToggleOff fontSize="small" />}
              <span>
                {filters.isActive === undefined ? 'All Status' : filters.isActive ? 'Active Only' : 'Inactive Only'}
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

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateUser}
              disabled={loading}
            >
              Add User
            </Button>
          </Box>

          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={handleFilterMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuItem
              onClick={() => handleFilterChange('role', undefined)}
              selected={!filters.role}
            >
              All Roles
            </MenuItem>
            {roleOptions.map(option => (
              <MenuItem
                key={option.value}
                onClick={() => handleFilterChange('role', option.value)}
                selected={filters.role === option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>

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
                Loading users...
              </Typography>
            </Box>
          )}

          {!loading && !error && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtered)`}
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {user.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={USER_ROLES[user.role]}
                            size="small"
                            sx={{
                              bgcolor: ROLE_COLORS[user.role],
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>{user.position || '-'}</TableCell>
                        <TableCell>{user.region || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleActive(user)}
                                color={user.isActive ? 'success' : 'default'}
                              >
                                {user.isActive ? <ToggleOn /> : <ToggleOff />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEditUser(user)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(user)}
                                color="error"
                                disabled={user.id === currentUser?.id}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                No Users Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                {filters.search || filters.role || filters.isActive !== undefined
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first user to get started.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateUser}
                sx={{ mt: 2 }}
              >
                Add User
              </Button>
            </Paper>
          )}
        </Paper>
      </Container>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <UserForm
            mode={dialogMode}
            user={selectedUser}
            onCancel={handleDialogClose}
            onSuccess={handleUserSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
