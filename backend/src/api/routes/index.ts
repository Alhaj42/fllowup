// @ts-nocheck
import express, { Router } from 'express';
import helmet from 'helmet';

const router = Router();

// Apply middleware to all routes (CORS is handled globally in app.ts)
router.use(helmet());
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
      users: '/users',
      team: '/team',
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
import userRoutes from './userRoutes';

// Mount routes - each only once!
router.use('/projects', projectRoutes);
router.use('/phases', phaseRoutes);
router.use('/phases/:phaseId/tasks', taskRoutes);
router.use('/phases/:phaseId/assignments', assignmentRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/kpis', kpiRoutes);
router.use('/reports', reportRoutes);
router.use('/configuration', configurationRoutes);
router.use('/requirements', requirementRoutes);
router.use('/users', userRoutes);
router.use('/team', teamRoutes);

export default router;
