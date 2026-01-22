import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, authorizeRole } from '../../middleware/authz';
import AssignmentService, { CreateAssignmentInput, GetTeamAllocationFilter } from '../../services/assignmentService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient({});
const assignmentService = new AssignmentService();

router.post('/:phaseId/assignments',
  authenticate,
  authorizeRole(['MANAGER', 'TEAM_LEADER']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { phaseId } = req.params;
      const input = req.body as CreateAssignmentInput;

      if (!input.teamMemberId) {
        res.status(400).json({ error: 'Team member ID is required' });
        return;
      }

      if (!input.role || !['TEAM_MEMBER', 'TEAM_LEADER'].includes(input.role)) {
        res.status(400).json({ error: 'Valid role is required (TEAM_MEMBER or TEAM_LEADER)' });
        return;
      }

      if (input.workingPercentage === undefined || input.workingPercentage < 0 || input.workingPercentage > 100) {
        res.status(400).json({ error: 'Working percentage must be between 0 and 100' });
        return;
      }

      if (!input.startDate) {
        res.status(400).json({ error: 'Start date is required' });
        return;
      }

      if (input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
        res.status(400).json({ error: 'End date must be after start date' });
        return;
      }

      const phase = await prisma.phase.findUnique({
        where: { id: phaseId },
      });

      if (!phase) {
        res.status(404).json({ error: 'Phase not found' });
        return;
      }

      const overallocationCheck = await assignmentService.checkOverAllocation(
        input.teamMemberId,
        input.workingPercentage,
        req.user.id
      );

      if (overallocationCheck.isOverallocated) {
        const warning = `Warning: Team member will be over-allocated (${overallocationCheck.currentAllocation + input.workingPercentage}%). Current allocation: ${overallocationCheck.currentAllocation}%`;
        logger.warn(warning, { teamMemberId: input.teamMemberId });

        return res.status(200).json({
          assignment: null,
          overallocationWarning: warning,
          currentAllocation: overallocationCheck.currentAllocation,
        });
      }

      const assignment = await assignmentService.createAssignment(phaseId, input, req.user.id);

      res.status(201).json({
        assignment,
        overallocationWarning: null,
      });
    } catch (error) {
      logger.error('Failed to create assignment', { error, phaseId: req.params.phaseId });

      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({ error: 'Assignment already exists for this team member and role' });
      } else if (error instanceof Error && error.message === 'Foreign key constraint')) {
        res.status(400).json({ error: 'Invalid team member ID or phase ID' });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create assignment' });
      }
    }
  }
);

router.get('/team/allocation',
  authenticate,
  authorizeRole(['MANAGER', 'TEAM_LEADER']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        startDate,
        endDate,
        projectId,
      } = req.query as Record<string, string | undefined>;

      const filter: GetTeamAllocationFilter = {
        startDate,
        endDate,
        projectId,
      };

      const summary = await assignmentService.getTeamAllocation(filter, req.user.id);

      res.json(summary);
    } catch (error) {
      logger.error('Failed to get team allocation', { error, query: req.query });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve team allocation' });
      }
    }
  }
);

router.get('/:phaseId/assignments',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { phaseId } = req.params;

      const phase = await prisma.phase.findUnique({
        where: { id: phaseId },
      });

      if (!phase) {
        res.status(404).json({ error: 'Phase not found' });
        return;
      }

      const assignments = await assignmentService.getAssignmentsByPhase(phaseId, req.user.id);

      res.json(assignments);
    } catch (error) {
      logger.error('Failed to get phase assignments', { error, phaseId: req.params.phaseId });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve assignments' });
      }
    }
  }
);

router.get('/team-member/:teamMemberId/assignments',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { teamMemberId } = req.params;

      const assignments = await assignmentService.getAssignmentsByTeamMember(teamMemberId, req.user.id);

      res.json(assignments);
    } catch (error) {
      logger.error('Failed to get team member assignments', { error, teamMemberId: req.params.teamMemberId });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve assignments' });
      }
    }
  }
);

router.put('/:id',
  authenticate,
  authorizeRole(['MANAGER', 'TEAM_LEADER']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const input = req.body as Partial<CreateAssignmentInput>;

      const existing = await prisma.assignment.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      if (input.workingPercentage !== undefined) {
        if (input.workingPercentage < 0 || input.workingPercentage > 100) {
          res.status(400).json({ error: 'Working percentage must be between 0 and 100' });
          return;
        }

        if (input.teamMemberId && input.teamMemberId !== existing.teamMemberId) {
          const overallocationCheck = await assignmentService.checkOverAllocation(
            input.teamMemberId,
            input.workingPercentage - Number(existing.workingPercentage),
            req.user.id
          );

          if (overallocationCheck.isOverallocated) {
            res.status(400).json({ error: 'Update would cause over-allocation' });
            return;
          }
        }
      }

      const assignment = await assignmentService.updateAssignment(id, input, req.user.id);

      res.json(assignment);
    } catch (error) {
      logger.error('Failed to update assignment', { error, assignmentId: req.params.id });

      if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update assignment' });
      }
    }
  }
);

router.delete('/:id',
  authenticate,
  authorizeRole(['MANAGER', 'TEAM_LEADER']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await assignmentService.deleteAssignment(id, req.user.id);

      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete assignment', { error, assignmentId: req.params.id });

      if (error instanceof Error && error.message === 'Assignment not found') {
        res.status(404).json({ error: 'Assignment not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete assignment' });
      }
    }
  }
);

export default router;
