import app from './app';
import { setupRoutes } from './app';
import config from './config';
import logger from './utils/logger';

const PORT = config.port || 3000;

setupRoutes();

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv || 'development'}`);
  logger.info(`API available at http://localhost:${PORT}/api/v1`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;
