import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    endpoints: {
      projects: '/projects',
      phases: '/phases',
      tasks: '/tasks',
      assignments: '/assignments',
      costs: '/costs',
      kpis: '/kpis',
      reports: '/reports',
      import: '/import',
      configuration: '/configuration',
    },
  });
});

export default router;
