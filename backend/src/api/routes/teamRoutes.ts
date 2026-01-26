import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, UserRole } from '../../middleware/authz';
import assignmentService from '../../services/assignmentService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /team/allocation
 * Retrieves allocation summary based on filters
 */
router.get('/allocation',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const filter = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        projectId: req.query.projectId as string | undefined,
      };

      const summary = await assignmentService.getTeamAllocation(filter);
      res.json(summary);
    } catch (error) {
      logger.error('Failed to retrieve team allocation', { error, userId: req.user?.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve team allocation' });
      }
    }
  }
);

export default router;
