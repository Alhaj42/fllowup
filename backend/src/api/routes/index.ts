import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const router = Router();

// Apply middleware to all routes
router.use(helmet());
router.use(cors());
router.use(express.json());

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 routes
router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    endpoints: {
      health: '/health',
      projects: '/projects',
      phases: '/phases',
      tasks: '/tasks',
      assignments: '/assignments',
      costs: '/costs',
      kpis: '/kpis',
      reports: '/reports',
      configuration: '/configuration',
    },
  });
});

// Import route handlers
import projectRoutes from './projectRoutes';
import phaseRoutes from './phaseRoutes';
import requirementRoutes from './requirementRoutes';
import configurationRoutes from './configurationRoutes';
import taskRoutes from './taskRoutes';
import assignmentRoutes from './assignmentRoutes';
import reportRoutes from './reportRoutes';
import kpiRoutes from './kpiRoutes';
import timelineRoutes from './timelineRoutes';

router.use('/', projectRoutes);
router.use('/projects', projectRoutes);
router.use('/phases', phaseRoutes);
router.use('/projects/:id/timeline', timelineRoutes);
router.use('/phases', phaseRoutes);
router.use('/phases/:phaseId/tasks', taskRoutes);
router.use('/phases/:phaseId/assignments', assignmentRoutes);
router.use('/projects/:id', projectRoutes);
router.use('/projects/:id/dashboard', projectRoutes);
router.use('/projects/:id/timeline', projectRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/assignments/:id', assignmentRoutes);
router.use('/costs', taskRoutes);
router.use('/costs/:id', taskRoutes);
router.use('/costs/summary', taskRoutes);
router.use('/kpis', kpiRoutes);
router.use('/kpis/:id', kpiRoutes);
router.use('/kpis/summary', kpiRoutes);
router.use('/reports', reportRoutes);
router.use('/configuration', configurationRoutes);
router.use('/requirements', requirementRoutes);

export default router;
