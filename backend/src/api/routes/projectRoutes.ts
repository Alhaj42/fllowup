import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, authorizeRole } from '../../middleware/authz';
import ProjectService, { CreateProjectInput, UpdateProjectInput } from '../../services/projectService';
import timelineService from "../../services/timelineService";
import RequirementService from '../../services/requirementService';
import modificationTrackingService from '../../services/modificationTrackingService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';
import { prisma } from '../../services/prismaClient';

const router = Router();
const projectService = new ProjectService();

router.post('/',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const input = req.body as CreateProjectInput;

      const project = await projectService.createProject(input, req.user.id, req.user.role);

      res.status(201).json(project);
    } catch (error) {
      logger.error('Failed to create project', { error, userId: req.user?.id });

      if (error instanceof Error && error.message.includes('Foreign key constraint')) {
        res.status(400).json({ error: 'Invalid client ID provided' });
      } else if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({ error: 'Contract code already exists' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create project' });
      }
    }
  }
);

router.get('/',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        status,
        phase: currentPhase,
        page,
        limit,
        search,
        clientId,
      } = req.query as Record<string, string | undefined>;

      const filter = {
        status: status as any,
        currentPhase: currentPhase as any,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        search,
        clientId,
      };

      const result = await projectService.getProjects(filter, req.user.id);

      res.json(result);
    } catch (error) {
      logger.error('Failed to get projects', { error, userId: req.user?.id });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve projects' });
      }
    }
  }
);

router.put('/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const input = req.body as UpdateProjectInput;

      const project = await projectService.getProjectById(id as string, req.user.id);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (input.version !== undefined && input.version !== project.version) {
        throw new AppError('Version conflict: The record was modified by another user', 409);
      }

      const updatedProject = await projectService.updateProject(id as string, input, req.user.id, req.user.role);

      res.json(updatedProject);
    } catch (error) {
      logger.error('Failed to update project', { error, projectId: req.params.id });

      if (error instanceof AppError && error.statusCode === 409) {
        res.status(409).json({ error: error.message });
      } else if (error instanceof Error && error.message === 'Project not found') {
        res.status(404).json({ error: 'Project not found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update project' });
      }
    }
  }
);

router.get('/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const project = await projectService.getProjectById(id as string, req.user.id);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.json(project);
    } catch (error) {
      logger.error('Failed to get project', { error, projectId: req.params.id as string });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve project' });
      }
    }
  }
);

router.get('/:id/dashboard',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const dashboard = await projectService.getProjectDashboard(id as string, req.user.id);

      res.json(dashboard);
    } catch (error) {
      logger.error('Failed to get project dashboard', { error, projectId: req.params.id as string });

      if (error instanceof Error && error.message === 'Project not found') {
        res.status(404).json({ error: 'Project not found' });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve project dashboard' });
      }
    }
  }
);

router.get('/:id/timeline',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const timeline = await timelineService.getTimeline({ projectId: id as string });

      res.json(timeline);
    } catch (error) {
      logger.error('Failed to get project timeline', { error, projectId: req.params.id as string });
      if (error instanceof AppError && error.message === 'Project not found') {
        res.status(404).json({ error: 'Project not found' });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve project timeline' });
      }
    }
  }
);

router.delete('/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await projectService.deleteProject(id as string, req.user.id, req.user.role);

      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete project', { error, projectId: req.params.id as string });

      if (error instanceof Error && error.message === 'Project not found') {
        res.status(404).json({ error: 'Project not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete project' });
      }
    }
  }
);

router.get('/:id/phases',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const project = await projectService.getProjectById(id as string, req.user.id);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const phases = await prisma.phase.findMany({
        where: { projectId: id as string },
        include: {
          tasks: true,
          assignments: {
            include: {
              teamMember: true,
            },
          },
        },
      });

      res.json(phases);
    } catch (error) {
      logger.error('Failed to get project phases', { error, projectId: req.params.id as string });
      res.status(500).json({ error: 'Failed to retrieve phases' });
    }
  }
);

router.get('/:id/requirements',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const project = await projectService.getProjectById(id as string, req.user.id);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const requirements = await prisma.projectRequirement.findMany({
        where: { projectId: id as string },
      });

      res.json(requirements);
    } catch (error) {
      logger.error('Failed to get project requirements', { error, projectId: req.params.id as string });
      res.status(500).json({ error: 'Failed to retrieve requirements' });
    }
  }
);

router.get('/:id/modifications',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const stats = await modificationTrackingService.getModificationStats(id as string);

      res.json(stats);
    } catch (error) {
      logger.error('Failed to get project modifications', { error, projectId: req.params.id as string });

      if (error instanceof Error && error.message === 'Project not found') {
        res.status(404).json({ error: 'Project not found' });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve modifications' });
      }
    }
  }
);

export default router;
