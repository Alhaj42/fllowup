import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorizeRole, requireManager } from '../../middleware/authz';
import UserService, { CreateUserInput, UpdateUserInput } from '../../services/userService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const userService = new UserService();

// Simple test endpoint (no auth required) - MUST be before /:id route
router.get('/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'User routes working!', timestamp: new Date().toISOString() });
});

router.get('/',
  authenticate,
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        role,
        isActive,
        page,
        limit,
        search,
      } = req.query as Record<string, string | undefined>;

      const filter = {
        role: role as any,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        search,
      };

      const result = await userService.getUsers(filter);

      res.json(result);
    } catch (error) {
      console.error('GET /users error:', error);
      logger.error('Failed to get users', { error: error instanceof Error ? error.message : error, userId: req.user?.id });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message, details: error.stack });
      } else {
        res.status(500).json({ error: 'Failed to retrieve users' });
      }
    }
  }
);

router.post('/',
  authenticate,
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const input = req.body as CreateUserInput;
      console.log('Creating user with input:', input);

      const existingUser = await userService.getUserByEmail(input.email);
      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      const user = await userService.createUser(input, req.user.id, req.user.role);
      console.log('User created successfully:', user.id);

      res.status(201).json(user);
    } catch (error) {
      console.error('CREATE USER ERROR:', error);
      logger.error('Failed to create user', { error: error instanceof Error ? error.message : error, userId: req.user?.id });

      if (error instanceof Error && error.message.includes('Unique constraint')) {
        res.status(409).json({ error: 'User with this email already exists' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message, details: error.stack });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
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

      const user = await userService.getUserById(id as string);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      console.log('GET /:id route hit with id:', req.params.id);
      console.log('Error:', error);
      logger.error('Failed to get user', { error, userId: req.params.id as string });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve user' });
      }
    }
  }
);

router.put('/:id',
  authenticate,
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const input = req.body as UpdateUserInput;

      const user = await userService.getUserById(id as string);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updatedUser = await userService.updateUser(id as string, input, req.user.id, req.user.role);

      res.json(updatedUser);
    } catch (error) {
      logger.error('Failed to update user', { error, userId: req.params.id as string });

      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({ error: 'User not found' });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update user' });
      }
    }
  }
);

router.delete('/:id',
  authenticate,
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const user = await userService.getUserById(id as string);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      await userService.deactivateUser(id as string, req.user.id, req.user.role);

      res.status(204).send();
    } catch (error) {
      logger.error('Failed to deactivate user', { error, userId: req.params.id as string });

      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({ error: 'User not found' });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to deactivate user' });
      }
    }
  }
);

router.patch('/:id/toggle',
  authenticate,
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const user = await userService.getUserById(id as string);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updatedUser = await userService.toggleUserActiveStatus(id as string, req.user.id, req.user.role);

      res.json(updatedUser);
    } catch (error) {
      logger.error('Failed to toggle user active status', { error, userId: req.params.id as string });

      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({ error: 'User not found' });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to toggle user active status' });
      }
    }
  }
);

router.get('/roles/team-leaders',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const teamLeaders = await userService.getTeamLeaders();

      res.json(teamLeaders);
    } catch (error) {
      logger.error('Failed to get team leaders', { error, userId: req.user?.id });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve team leaders' });
      }
    }
  }
);

router.get('/roles/team-members',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const teamMembers = await userService.getTeamMembers();

      res.json(teamMembers);
    } catch (error) {
      logger.error('Failed to get team members', { error, userId: req.user?.id });
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve team members' });
      }
    }
  }
);

export default router;
