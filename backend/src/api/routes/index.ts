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
router.use('/projects', projectRoutes);
import phaseRoutes from './phaseRoutes';
router.use('/phases', phaseRoutes);
import requirementRoutes from './requirementRoutes';
router.use('/requirements', requirementRoutes);
import configurationRoutes from './configurationRoutes';
router.use('/configuration', configurationRoutes);
import taskRoutes from './taskRoutes';
router.use('/', taskRoutes);


export default router;
