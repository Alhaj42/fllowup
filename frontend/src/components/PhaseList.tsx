import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Button
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import TaskList from './TaskList';
import apiClient from '../services/api';

interface Phase {
    id: string;
    name: string;
    status: string;
    progress: number;
}

interface PhaseListProps {
    projectId: string;
}

const STATUS_REF = {
    PLANNED: { color: 'default' },
    IN_PROGRESS: { color: 'primary' },
    COMPLETED: { color: 'success' },
};

export default function PhaseList({ projectId }: PhaseListProps) {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPhases = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<Phase[]>(`/projects/${projectId}/phases`);
                setPhases(data);
            } catch (err) {
                console.error('Failed to load phases', err);
            } finally {
                setLoading(false);
            }
        };
        loadPhases();
    }, [projectId]);

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Project Phases</Typography>
            {phases.map((phase) => (
                <Accordion key={phase.id} defaultExpanded={phase.status === 'IN_PROGRESS'}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mr: 2 }}>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                {phase.name}
                            </Typography>
                            <Chip
                                label={phase.status}
                                size="small"
                                // @ts-ignore
                                color={STATUS_REF[phase.status]?.color || 'default'}
                                sx={{ mr: 2 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {phase.progress}%
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TaskList phaseId={phase.id} />
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
}
