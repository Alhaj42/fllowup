import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import TaskItem, { Task } from './TaskItem';
import TaskForm, { TaskFormData } from './TaskForm';
import apiClient from '../services/api';
import { useAuthStore } from '../state/authStore';

interface TaskListProps {
    phaseId: string;
}

export default function TaskList({ phaseId }: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    const user = useAuthStore(state => state.user);
    // T098: Check if user has permission to manage tasks (Manager or Team Leader)
    const canManage = user && (user.role === 'MANAGER' || user.role === 'TEAM_LEADER');

    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<Task[]>(`/phases/${phaseId}/tasks`);
            setTasks(data);
            setError(null);
        } catch (err: any) {
            console.error('Error loading tasks:', err);
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [phaseId]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleCreate = () => {
        setEditingTask(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setIsFormOpen(true);
    };

    const handleDelete = async (taskId: string) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await apiClient.delete(`/tasks/${taskId}`);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Failed to delete task');
        }
    };

    const handleFormSubmit = async (data: TaskFormData) => {
        try {
            if (editingTask) {
                const updated = await apiClient.put<Task>(`/tasks/${editingTask.id}`, {
                    ...data,
                    version: 1 // TODO: Handle version properly
                });
                setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
            } else {
                const created = await apiClient.post<Task>('/tasks', {
                    ...data,
                    phaseId,
                });
                setTasks(prev => [...prev, created]);
            }
        } catch (err: any) {
            console.error('Error saving task:', err);
            // alert(err.response?.data?.error || 'Failed to save task');
            throw err; // Propagate to form or handle
        }
    };

    if (loading) return <CircularProgress size={24} />;

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold"> Tasks ({tasks.length})</Typography>
                {/* T098: Hide Add button for Team Members */}
                {canManage && (
                    <Button
                        startIcon={<AddIcon />}
                        size="small"
                        variant="outlined"
                        onClick={handleCreate}
                    >
                        Add Task
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {tasks.length === 0 && !loading && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No tasks defined for this phase.
                </Typography>
            )}

            {tasks.map(task => (
                <TaskItem
                    key={task.id}
                    task={task}
                    // T098: Pass dummy handlers or conditionally render actions in TaskItem
                    // TaskItem handles permission check internally too, but good to be explicit or let TaskItem decide
                    onEdit={canManage ? handleEdit : () => { }}
                    onDelete={canManage ? handleDelete : () => { }}
                />
            ))}

            {isFormOpen && (
                <TaskForm
                    open={isFormOpen}
                    initialData={editingTask}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    phaseId={phaseId}
                />
            )}
        </Box>
    );
}
