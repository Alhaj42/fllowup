"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const assignmentService_1 = __importDefault(require("../../services/assignmentService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * GET /team/allocation
 * Retrieves allocation summary based on filters
 */
router.get('/allocation', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const filter = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            projectId: req.query.projectId,
        };
        const summary = await assignmentService_1.default.getTeamAllocation(filter);
        res.json(summary);
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve team allocation', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve team allocation' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map