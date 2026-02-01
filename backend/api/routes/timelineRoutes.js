"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const timelineService_1 = __importDefault(require("../../services/timelineService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * GET /timeline
 * Get timeline data for projects, phases, tasks, and team assignments with conflict detection
 */
router.get('/', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const filters = {};
        if (req.query.startDate) {
            filters.startDate = req.query.startDate;
        }
        if (req.query.endDate) {
            filters.endDate = req.query.endDate;
        }
        if (req.query.projectId) {
            filters.projectId = req.query.projectId;
        }
        if (req.query.teamMemberId) {
            filters.teamMemberId = req.query.teamMemberId;
        }
        // Log timeline access
        await timelineService_1.default.logTimelineAccess(userId, 'view', JSON.stringify(filters));
        logger_1.default.info('Timeline request received', { userId, userRole, filters });
        const timelineData = await timelineService_1.default.getTimeline(filters);
        res.json({
            timeline: timelineData,
            filters,
            projectCount: timelineData.length,
            conflictCount: timelineData.reduce((sum, t) => sum + (t.conflicts?.length || 0), 0)
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve timeline data', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve timeline data' });
        }
    }
});
/**
 * GET /timeline/calendar/:year/:month
 * Get calendar events for a given month/year
 */
router.get('/calendar/:year/:month', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER', 'TEAM_MEMBER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user?.id;
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
        await timelineService_1.default.logTimelineAccess(userId, 'view-calendar', JSON.stringify({ year, month }));
        logger_1.default.info('Calendar request received', { userId, userRole, year, month });
        const events = await timelineService_1.default.getCalendarEvents(year, month);
        res.json({
            events,
            year,
            month,
            eventCount: events.length
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve calendar events', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve calendar events' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=timelineRoutes.js.map