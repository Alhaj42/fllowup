import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import TaskService, { CreateTaskInput, UpdateTaskInput } from '../../services/taskService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';
import type { Request } from 'express';

const router = Router();
const taskService = new TaskService();

// GET /phases/:phaseId/tasks
router.get(
  '/phases/:phaseId/tasks',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { phaseId } = req.params;
      const tasks = await taskService.getTasksByPhase(phaseId);
      res.json(tasks);
    } catch (error) {
      logger.error('Failed to get tasks by phase', { error, phaseId: req.params.phaseId });
      res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
  }
);

// POST /tasks
router.post('/tasks', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // TODO: Add stricter role check here if needed (e.g. only Team Leader/Manager)
    // For now relying on RBAC middleware if applied in index or future refinements

    const input = req.body as CreateTaskInput;
    const task = await taskService.createTask(input, req.user.id, req.user.role);
    res.status(201).json(task);
  } catch (error) {
    logger.error('Failed to create task', { error, userId: req.user?.id });
    if (error instanceof Error && error.message.includes('Task code already exists')) {
      res.status(409).json({ error: error.message });
    } else if (error instanceof Error && error.message === 'Phase not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
});

// PUT /tasks/:id
router.put('/tasks/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const input = req.body as UpdateTaskInput;

    const task = await taskService.updateTask(id, input, req.user.id, req.user.role);
    res.json(task);
  } catch (error) {
    logger.error('Failed to update task', { error, taskId: req.params.id });
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ error: error.message });
    } else if (error instanceof Error && error.message === 'Version conflict') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
});

// DELETE /tasks/:id
router.delete(
  '/tasks/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await taskService.deleteTask(id, req.user.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      logger.error('Failed to delete task', { error, taskId: req.params.id });
      if (error instanceof Error && error.message === 'Task not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete task' });
      }
    }
  }
);

export default router;
