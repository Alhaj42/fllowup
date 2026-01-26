import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, UserRole } from '../../middleware/authz';
import assignmentService, { CreateAssignmentInput, UpdateAssignmentInput } from '../../services/assignmentService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

/**
 * POST /phases/:phaseId/assignments
 * Creates a new assignment with over-allocation detection
 */
router.post('/phases/:phaseId/assignments',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const phaseId = req.params.phaseId as string;
      const input = req.body as CreateAssignmentInput;
      const userId = req.user?.id as string;
      const userRole = req.user?.role;

      logger.info('Assignment request received', { phaseId, input, userId, userRole });
      logger.info('Request body JSON:', JSON.stringify(req.body));
      logger.info('typeof userId:', typeof userId);
      logger.info('typeof workingPercent:', typeof input.workingPercent);

      if (!input.userId || !input.workingPercent || !input.role || !input.startDate) {
        logger.warn('Missing required fields', { missing: !input.userId, noWorkingPercent: !input.workingPercent, noRole: !input.role, noStartDate: !input.startDate });
        res.status(400).json({ error: 'Missing required fields: userId, workingPercent, role, startDate' });
        return;
      }

      if (input.workingPercent < 0) {
        logger.warn('Invalid workingPercent', { value: input.workingPercent });
        res.status(400).json({ error: 'workingPercent must be greater than 0' });
        return;
      }

      if (input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
        logger.warn('Invalid date range', { startDate: input.startDate, endDate: input.endDate });
        res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
        return;
      }

      if (input.workingPercent < 0) {
        logger.warn('Invalid workingPercent', { value: input.workingPercent });
        res.status(400).json({ error: 'workingPercent must be greater than 0' });
        return;
      }

      if (input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
        logger.warn('Invalid date range', { startDate: input.startDate, endDate: input.endDate });
        res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
        return;
      }

      const overallocationCheck = await assignmentService.checkOverAllocation(
        input.userId,
        input.workingPercent
      );

      if (overallocationCheck.isOverallocated) {
        const warning = `Warning: Team member will be over-allocated (${overallocationCheck.currentAllocation + input.workingPercent}%).`;
        logger.warn(warning, { userId: input.userId });

        res.status(200).json({
          assignment: null,
          overallocationWarning: warning,
          currentAllocation: overallocationCheck.currentAllocation,
        });
        return;
      }

      const assignment = await assignmentService.createAssignment({ ...input, phaseId }, userId, userRole);
      res.status(201).json({ assignment, overallocationWarning: null });

    } catch (error) {
      logger.error('Failed to create assignment', { error, userId: req.user?.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({ error: 'Assignment already exists for this user and phase' });
      } else if (error instanceof Error && error.message.includes('Foreign key constraint')) {
        res.status(404).json({ error: 'Phase or user not found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create assignment' });
      }
    }
  }
);

/**
 * GET /phases/:phaseId/assignments
 * List assignments for a specific phase
 */
router.get('/phases/:phaseId/assignments',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const phaseId = req.params.phaseId as string;
      const assignments = await assignmentService.getAssignmentsByPhase(phaseId);
      res.json(assignments);
    } catch (error) {
      logger.error('Failed to retrieve assignments', { error, phaseId: req.params.phaseId });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve assignments' });
      }
    }
  }
);

/**
 * PUT /assignments/:id
 * Updates assignment details
 */
router.put('/assignments/:id',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const input = req.body as UpdateAssignmentInput;
      const userId = req.user!.id as string;
      const userRole = req.user!.role;

      if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
        res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
        return;
      }

      const assignment = await assignmentService.updateAssignment(id, input, userId, userRole);
      res.json(assignment);
    } catch (error) {
      logger.error('Failed to update assignment', { error, assignmentId: req.params.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update assignment' });
      }
    }
  }
);

/**
 * DELETE /assignments/:id
 * Deletes an assignment
 */
router.delete('/assignments/:id',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const userId = req.user!.id as string;
      const userRole = req.user!.role;

      await assignmentService.deleteAssignment(id, userId, userRole);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete assignment', { error, assignmentId: req.params.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete assignment' });
      }
    }
  }
);

export default router;
