import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { useAuthStore } from '../state/authStore';

export interface Task {
    id: string;
    code: string;
    description: string;
    duration: number;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
    assignedTeamMemberId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    assignedTeamMember?: {
        id: string;
        name: string;
    } | null;
}

interface TaskItemProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
}

const STATUS_COLORS = {
    PLANNED: 'default',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
} as const;

export default function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
    const user = useAuthStore(state => state.user);
    const canEdit = user && (user.role === 'MANAGER' || user.role === 'TEAM_LEADER');

    return (
        <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>
                                {task.code}
                            </Typography>
                            <Chip
                                label={task.status.replace('_', ' ')}
                                size="small"
                                color={STATUS_COLORS[task.status] || 'default'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            {task.assignedTeamMember && (
                                <Tooltip title={`Assigned to ${task.assignedTeamMember.name}`}>
                                    <Chip
                                        icon={<PersonIcon sx={{ fontSize: '1rem' }} />}
                                        label={task.assignedTeamMember.name}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                </Tooltip>
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {task.description}
                        </Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Duration: {task.duration} days
                            </Typography>
                            {task.startDate && (
                                <Typography variant="caption" color="text.secondary">
                                    Start: {new Date(task.startDate).toLocaleDateString()}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {canEdit && (
                        <Box sx={{ display: 'flex' }}>
                            <IconButton size="small" onClick={() => onEdit(task)} aria-label="Edit task">
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => onDelete(task.id)} aria-label="Delete task" color="error">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
