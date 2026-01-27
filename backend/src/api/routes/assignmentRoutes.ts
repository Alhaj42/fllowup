import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, UserRole } from '../../middleware/authz';
import TeamService from '../../services/teamService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

/**
 * POST /assignments
 * Create a new team member assignment
 */
router.post(
  '/',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { phaseId, teamMemberId, role, workingPercentage, startDate, endDate } = req.body;
      const userId = req.user!.id as string;
      const userRole = req.user!.role;

      // Validate required fields
      if (!phaseId || !teamMemberId || !role || !workingPercentage || !startDate) {
        res.status(400).json({
          error: 'Missing required fields: phaseId, teamMemberId, role, workingPercentage, startDate',
        });
        return;
      }

      // Validate workingPercentage
      if (workingPercentage < 0 || workingPercentage > 100) {
        res.status(400).json({ error: 'workingPercentage must be between 0 and 100' });
        return;
      }

      // Validate dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (isNaN(parsedStartDate.getTime())) {
        res.status(400).json({ error: 'Invalid startDate format' });
        return;
      }

      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        res.status(400).json({ error: 'Invalid endDate format' });
        return;
      }

      if (parsedEndDate && parsedStartDate > parsedEndDate) {
        res.status(400).json({ error: 'endDate must be after startDate' });
        return;
      }

      // Check allocation
      const allocationCheck = await TeamService.checkAllocation(teamMemberId, workingPercentage);

      if (allocationCheck.isOverallocated) {
        res.status(400).json({
          error: allocationCheck.warning,
          currentAllocation: allocationCheck.currentAllocation,
          proposedAllocation: allocationCheck.proposedAllocation,
        });
        return;
      }

      // Create assignment
      const assignment = await TeamService.assignTeamMember(
        {
          phaseId,
          teamMemberId,
          role,
          workingPercentage,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
        },
        userId,
        userRole
      );

      res.status(201).json(assignment);
    } catch (error) {
      logger.error('Failed to create assignment', { error, userId: req.user?.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('already assigned')) {
        res.status(409).json({ error: 'Team member is already assigned to this phase' });
      } else if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create assignment' });
      }
    }
  }
);

/**
 * GET /assignments/team/:memberId
 * Get all assignments for a specific team member
 */
router.get(
  '/team/:memberId',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const memberId = req.params.memberId as string;

      const assignments = await TeamService.getTeamMemberAssignments(memberId);

      res.json(assignments);
    } catch (error) {
      logger.error('Failed to get team member assignments', { error, memberId: req.params.memberId });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to get team member assignments' });
      }
    }
  }
);

/**
 * GET /assignments/project/:projectId
 * Get all team assignments for a specific project
 */
router.get(
  '/project/:projectId',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const projectId = req.params.projectId as string;

      const assignments = await TeamService.getProjectTeamAssignments(projectId);

      res.json(assignments);
    } catch (error) {
      logger.error('Failed to get project team assignments', {
        error,
        projectId: req.params.projectId,
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to get project team assignments' });
      }
    }
  }
);

/**
 * PUT /assignments/:id
 * Update an existing assignment
 */
router.put(
  '/:id',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const { role, workingPercentage, startDate, endDate } = req.body;
      const userId = req.user!.id as string;
      const userRole = req.user!.role;

      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
        res.status(400).json({ error: 'Invalid startDate format' });
        return;
      }

      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        res.status(400).json({ error: 'Invalid endDate format' });
        return;
      }

      if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
        res.status(400).json({ error: 'endDate must be after startDate' });
        return;
      }

      const assignment = await TeamService.updateAssignment(
        id,
        {
          role,
          workingPercentage,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
        },
        userId,
        userRole
      );

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
 * Delete an assignment
 */
router.delete(
  '/:id',
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

      await TeamService.removeAssignment(id, userId, userRole);

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
