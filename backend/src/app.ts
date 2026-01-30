import express from 'express';
import cors from 'cors';

export const app = express();

// Configure CORS to allow multiple origins
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
