import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    FormControl,
    InputLabel,
    Select,
    FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { Task } from './TaskItem';
import apiClient from '../services/api';

interface TaskFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => Promise<void>;
    initialData?: Task;
    phaseId: string;
}

export interface TaskFormData {
    code: string;
    description: string;
    duration: number;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
    assignedTeamMemberId?: string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
}

export default function TaskForm({ open, onClose, onSubmit, initialData, phaseId }: TaskFormProps) {
    const { control, handleSubmit, reset } = useForm<TaskFormData>({
        defaultValues: {
            code: '',
            description: '',
            duration: 1,
            status: 'PLANNED',
            assignedTeamMemberId: '',
        },
    });

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        if (open && phaseId) {
            setLoadingMembers(true);
            // Fetch assignments for the phase to get eligible team members
            apiClient.get<any[]>(`/phases/${phaseId}/assignments`) // Assuming this endpoint exists or similar
                .then(assignments => {
                    // Extract unique users from assignments
                    const members = assignments.map((a: any) => ({
                        id: a.user.id,
                        name: a.user.name,
                        email: a.user.email
                    }));
                    // TODO: Deduplicate if needed (though phase assignments should be unique per user role, but logic check good)
                    setTeamMembers(members);
                })
                .catch(err => console.error("Failed to load team members", err))
                .finally(() => setLoadingMembers(false));
        }
    }, [open, phaseId]);

    useEffect(() => {
        if (initialData) {
            reset({
                code: initialData.code,
                description: initialData.description,
                duration: initialData.duration,
                status: initialData.status,
                assignedTeamMemberId: initialData.assignedTeamMemberId || '',
            });
        } else {
            reset({
                code: '',
                description: '',
                duration: 1,
                status: 'PLANNED',
                assignedTeamMemberId: '',
            });
        }
    }, [initialData, reset, open]);

    const onFormSubmit = async (data: TaskFormData) => {
        await onSubmit(data);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{initialData ? 'Edit Task' : 'Create Task'}</DialogTitle>
            <form onSubmit={handleSubmit(onFormSubmit)}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="code"
                                control={control}
                                rules={{ required: 'Code is required' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Task Code"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                        disabled={!!initialData}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="duration"
                                control={control}
                                rules={{ required: 'Duration is required', min: 1 }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Duration (Days)"
                                        type="number"
                                        fullWidth
                                        error={!!error}
                                        helperText={error?.message}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="description"
                                control={control}
                                rules={{ required: 'Description is required' }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        label="Description"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        error={!!error}
                                        helperText={error?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Status"
                                        fullWidth
                                    >
                                        <MenuItem value="PLANNED">Planned</MenuItem>
                                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                        <MenuItem value="COMPLETED">Completed</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="assignedTeamMemberId"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel id="assignee-label">Assigned To</InputLabel>
                                        <Select
                                            {...field}
                                            labelId="assignee-label"
                                            label="Assigned To"
                                            disabled={loadingMembers}
                                        >
                                            <MenuItem value="">
                                                <em>Unassigned</em>
                                            </MenuItem>
                                            {teamMembers.map((member) => (
                                                <MenuItem key={member.id} value={member.id}>
                                                    {member.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
