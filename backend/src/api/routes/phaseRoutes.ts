import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, UserRole } from '../../middleware/authz';
import ProjectService from '../../services/projectService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const projectService = new ProjectService();

const handleRouteError = (res: Response, error: any, message: string) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
  } else if (error instanceof Error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: message });
  }
};

/**
 * PUT /:phaseId
 * Updates phase details or status
 */
router.put('/:phaseId',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const phaseId = req.params.phaseId as string;
      const input = req.body;
      const userId = req.user!.id as string;
      const userRole = req.user!.role;

      const phase = await projectService.updatePhase(
        phaseId,
        { name: input.name, status: input.status, teamLeaderId: input.teamLeaderId },
        userId,
        userRole
      );

      res.json(phase);
    } catch (error) {
      handleRouteError(res, error, 'Failed to update phase');
    }
  }
);

/**
 * POST /:phaseId/team-leader
 * Assigns a team leader to a phase
 */
router.post('/:phaseId/team-leader',
  authenticate,
  authorize(['MANAGER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const phaseId = req.params.phaseId as string;
      const { userId } = req.body;
      const currentUserId = req.user!.id as string;
      const userRole = req.user!.role;

      const phase = await projectService.assignTeamLeader(phaseId, userId, currentUserId, userRole);
      res.json(phase);
    } catch (error) {
      handleRouteError(res, error, 'Failed to assign team leader');
    }
  }
);

/**
 * DELETE /:phaseId/team-leader
 * Removes team leader from a phase
 */
router.delete('/:phaseId/team-leader',
  authenticate,
  authorize(['MANAGER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const phaseId = req.params.phaseId as string;
      const userId = req.user!.id as string;
      const userRole = req.user!.role;

      const phase = await projectService.removeTeamLeader(phaseId, userId, userRole);
      res.json(phase);
    } catch (error) {
      handleRouteError(res, error, 'Failed to remove team leader');
    }
  }
);

export default router;
