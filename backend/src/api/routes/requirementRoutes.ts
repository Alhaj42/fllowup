import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, UserRole } from '../../middleware/authz';
import requirementService, {
  CreateRequirementInput,
  UpdateRequirementInput,
} from '../../services/requirementService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';
import { prisma } from '../../services/prismaClient';

const router = Router();

router.post(
  '/:projectId/requirements',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const projectId = req.params.projectId as string;
      const input = req.body as CreateRequirementInput;

      if (!input.description || input.description.trim() === '') {
        res.status(400).json({ error: 'Description is required' });
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const requirement = await requirementService.createRequirement(
        input,
        projectId,
        req.user.id,
        req.user.role
      );

      res.status(201).json(requirement);
    } catch (error) {
      const projectId = req.params.projectId as string;
      logger.error('Failed to create requirement', { error, projectId });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create requirement' });
      }
    }
  }
);

router.patch(
  '/:id/complete',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const { isCompleted } = req.body;

      if (typeof isCompleted !== 'boolean') {
        res.status(400).json({ error: 'isCompleted must be a boolean' });
        return;
      }

      const requirement = await requirementService.completeRequirement(
        id,
        isCompleted,
        req.user.id,
        req.user.role
      );

      res.json(requirement);
    } catch (error) {
      logger.error('Failed to update requirement completion', {
        error,
        requirementId: req.params.id,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error && error.message === 'Requirement not found') {
        res.status(404).json({ error: 'Requirement not found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update requirement' });
      }
    }
  }
);

export default router;
