import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, UserRole } from '../../middleware/authz';
import { configurationService } from '../../services/configurationService';

const router = Router();

// GET /configuration/:category - Get all configuration items for a category (all roles)
router.get('/:category',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const category = req.params.category as string;
      const items = await configurationService.getConfigurationByCategory(category);
      res.json({ data: items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve configuration' });
    }
  }
);

// POST /configuration - Create configuration item (MANAGER only)
router.post('/',
  authenticate,
  authorize(['MANAGER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { category, key, value, sortOrder } = req.body;

      if (!category || !key || value === undefined) {
        res.status(400).json({ error: 'category, key, and value are required' });
        return;
      }

      const item = await configurationService.createConfiguration({
        category,
        key,
        value,
        sortOrder,
      });

      res.status(201).json({ data: item });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create configuration' });
    }
  }
);

// PUT /configuration/:category/:key - Update configuration item (MANAGER only)
router.put('/:category/:key',
  authenticate,
  authorize(['MANAGER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const category = req.params.category as string;
      const key = req.params.key as string;
      const { value, isActive, sortOrder } = req.body;

      const item = await configurationService.updateConfiguration(
        category,
        key,
        { value, isActive, sortOrder }
      );

      res.json({ data: item });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }
);

// DELETE /configuration/:category/:key - Delete configuration item (MANAGER only)
router.delete('/:category/:key',
  authenticate,
  authorize(['MANAGER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const category = req.params.category as string;
      const key = req.params.key as string;

      await configurationService.deleteConfiguration(category, key);

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  }
);

export default router;
