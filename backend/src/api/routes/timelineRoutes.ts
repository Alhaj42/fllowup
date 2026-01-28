// @ts-nocheck
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize, UserRole } from '../../middleware/authz';
import TimelineService from '../../services/timelineService';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /timeline
 * Get timeline data for projects, phases, tasks, and team assignments with conflict detection
 */
router.get(
  '/',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = req.user?.id as string;
      const userRole = req.user?.role;

      const filters: {
        startDate?: string;
        endDate?: string;
        projectId?: string;
        teamMemberId?: string;
      } = {};

      if (req.query.startDate) {
        filters.startDate = req.query.startDate as string;
      }

      if (req.query.endDate) {
        filters.endDate = req.query.endDate as string;
      }

      if (req.query.projectId) {
        filters.projectId = req.query.projectId as string;
      }

      if (req.query.teamMemberId) {
        filters.teamMemberId = req.query.teamMemberId as string;
      }

      // Log timeline access
      await TimelineService.logTimelineAccess(userId, 'view', JSON.stringify(filters));

      logger.info('Timeline request received', { userId, userRole, filters });

      const timelineData = await TimelineService.getTimeline(filters);

      res.json({
        timeline: timelineData,
        filters,
        projectCount: timelineData.length,
        conflictCount: timelineData.reduce((sum, t) => sum + (t.conflicts?.length || 0), 0)
      });

    } catch (error) {
      logger.error('Failed to retrieve timeline data', { error, userId: req.user?.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve timeline data' });
      }
    }
  }
);

/**
 * GET /timeline/calendar/:year/:month
 * Get calendar events for a given month/year
 */
router.get(
  '/calendar/:year/:month',
  authenticate,
  authorize(['MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER'] as UserRole[]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = req.user?.id as string;
      const userRole = req.user?.role;
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);

      if (isNaN(year) || year < 2000 || year > 2100) {
        res.status(400).json({ error: 'Invalid year' });
        return;
      }

      if (isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({ error: 'Invalid month' });
        return;
      }

      // Log calendar access
      await TimelineService.logTimelineAccess(userId, 'view-calendar', JSON.stringify({ year, month }));

      logger.info('Calendar request received', { userId, userRole, year, month });

      const events = await TimelineService.getCalendarEvents(year, month);

      res.json({
        events,
        year,
        month,
        eventCount: events.length
      });

    } catch (error) {
      logger.error('Failed to retrieve calendar events', { error, userId: req.user?.id });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to retrieve calendar events' });
      }
    }
  }
);

export default router;
