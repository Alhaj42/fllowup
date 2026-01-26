import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const setupRoutes = (): void => {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1', require('./api/routes/index').default);
  app.use('/api/v1', require('./api/routes/assignmentRoutesV2').default);
  app.use('/api/v1/team', require('./api/routes/teamRoutes').default);
  app.use('/api/v1/projects', require('./api/routes/projectRoutes').default);
  app.use('/api/v1/requirements', require('./api/routes/requirementRoutes').default);
  // app.use('/api/v1', require('./api/routes/importRoutes').default);
  // Excel import not required per spec - fresh SaaS platform
};

export default app;
