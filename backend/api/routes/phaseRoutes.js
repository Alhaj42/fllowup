"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const projectService_1 = __importDefault(require("../../services/projectService"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
const projectService = new projectService_1.default();
const handleRouteError = (res, error, message) => {
    if (error instanceof errorHandler_1.AppError) {
        res.status(error.statusCode).json({ error: error.message });
    }
    else if (error instanceof Error) {
        res.status(500).json({ error: error.message });
    }
    else {
        res.status(500).json({ error: message });
    }
};
/**
 * PUT /:phaseId
 * Updates phase details or status
 */
router.put('/:phaseId', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        const phaseId = req.params.phaseId;
        const input = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        const phase = await projectService.updatePhase(phaseId, { name: input.name, status: input.status, teamLeaderId: input.teamLeaderId }, userId, userRole);
        res.json(phase);
    }
    catch (error) {
        handleRouteError(res, error, 'Failed to update phase');
    }
});
/**
 * POST /:phaseId/team-leader
 * Assigns a team leader to a phase
 */
router.post('/:phaseId/team-leader', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER']), async (req, res) => {
    try {
        const phaseId = req.params.phaseId;
        const { userId } = req.body;
        const currentUserId = req.user.id;
        const userRole = req.user.role;
        const phase = await projectService.assignTeamLeader(phaseId, userId, currentUserId, userRole);
        res.json(phase);
    }
    catch (error) {
        handleRouteError(res, error, 'Failed to assign team leader');
    }
});
/**
 * DELETE /:phaseId/team-leader
 * Removes team leader from a phase
 */
router.delete('/:phaseId/team-leader', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER']), async (req, res) => {
    try {
        const phaseId = req.params.phaseId;
        const userId = req.user.id;
        const userRole = req.user.role;
        const phase = await projectService.removeTeamLeader(phaseId, userId, userRole);
        res.json(phase);
    }
    catch (error) {
        handleRouteError(res, error, 'Failed to remove team leader');
    }
});
exports.default = router;
//# sourceMappingURL=phaseRoutes.js.map