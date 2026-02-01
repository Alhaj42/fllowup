"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const teamService_1 = __importDefault(require("../../services/teamService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * POST /assignments
 * Create a new team member assignment
 */
router.post('/', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { phaseId, teamMemberId, role, workingPercentage, startDate, endDate } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
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
        const allocationCheck = await teamService_1.default.checkAllocation(teamMemberId, workingPercentage);
        if (allocationCheck.isOverallocated) {
            res.status(400).json({
                error: allocationCheck.warning,
                currentAllocation: allocationCheck.currentAllocation,
                proposedAllocation: allocationCheck.proposedAllocation,
            });
            return;
        }
        // Create assignment
        const assignment = await teamService_1.default.assignTeamMember({
            phaseId,
            teamMemberId,
            role,
            workingPercentage,
            startDate: parsedStartDate,
            endDate: parsedEndDate || undefined,
        }, userId, userRole);
        res.status(201).json(assignment);
    }
    catch (error) {
        logger_1.default.error('Failed to create assignment', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message.includes('already assigned')) {
            res.status(409).json({ error: 'Team member is already assigned to this phase' });
        }
        else if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to create assignment' });
        }
    }
});
/**
 * GET /assignments/team/:memberId
 * Get all assignments for a specific team member
 */
router.get('/team/:memberId', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const memberId = req.params.memberId;
        const assignments = await teamService_1.default.getTeamMemberAssignments(memberId);
        res.json(assignments);
    }
    catch (error) {
        logger_1.default.error('Failed to get team member assignments', { error, memberId: req.params.memberId });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to get team member assignments' });
        }
    }
});
/**
 * GET /assignments/project/:projectId
 * Get all team assignments for a specific project
 */
router.get('/project/:projectId', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const projectId = req.params.projectId;
        const assignments = await teamService_1.default.getProjectTeamAssignments(projectId);
        res.json(assignments);
    }
    catch (error) {
        logger_1.default.error('Failed to get project team assignments', {
            error,
            projectId: req.params.projectId,
        });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to get project team assignments' });
        }
    }
});
/**
 * PUT /assignments/:id
 * Update an existing assignment
 */
router.put('/:id', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const id = req.params.id;
        const { role, workingPercentage, startDate, endDate } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
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
        const assignment = await teamService_1.default.updateAssignment(id, {
            role,
            workingPercentage,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
        }, userId, userRole);
        res.json(assignment);
    }
    catch (error) {
        logger_1.default.error('Failed to update assignment', { error, assignmentId: req.params.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Assignment not found') {
            res.status(404).json({ error: 'Assignment not found' });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update assignment' });
        }
    }
});
/**
 * DELETE /assignments/:id
 * Delete an assignment
 */
router.delete('/:id', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const id = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        await teamService_1.default.removeAssignment(id, userId, userRole);
        res.status(204).send();
    }
    catch (error) {
        logger_1.default.error('Failed to delete assignment', { error, assignmentId: req.params.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Assignment not found') {
            res.status(404).json({ error: 'Assignment not found' });
        }
        else {
            res.status(500).json({ error: 'Failed to delete assignment' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=assignmentRoutes.js.map