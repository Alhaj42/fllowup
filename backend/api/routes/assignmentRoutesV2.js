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
 * POST /phases/:phaseId/assignments
 * Creates a new assignment with over-allocation detection
 */
router.post('/phases/:phaseId/assignments', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const phaseId = req.params.phaseId;
        const input = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        logger_1.default.info('Assignment request received', { phaseId, input, userId, userRole });
        logger_1.default.info('Request body JSON:', JSON.stringify(req.body));
        logger_1.default.info('typeof userId:', typeof userId);
        logger_1.default.info('typeof workingPercent:', typeof input.workingPercent);
        if (!input.userId || !input.workingPercent || !input.role || !input.startDate) {
            logger_1.default.warn('Missing required fields', { missing: !input.userId, noWorkingPercent: !input.workingPercent, noRole: !input.role, noStartDate: !input.startDate });
            res.status(400).json({ error: 'Missing required fields: userId, workingPercent, role, startDate' });
            return;
        }
        if (input.workingPercent < 0) {
            logger_1.default.warn('Invalid workingPercent', { value: input.workingPercent });
            res.status(400).json({ error: 'workingPercent must be greater than 0' });
            return;
        }
        if (input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
            logger_1.default.warn('Invalid date range', { startDate: input.startDate, endDate: input.endDate });
            res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
            return;
        }
        if (input.workingPercent < 0) {
            logger_1.default.warn('Invalid workingPercent', { value: input.workingPercent });
            res.status(400).json({ error: 'workingPercent must be greater than 0' });
            return;
        }
        if (input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
            logger_1.default.warn('Invalid date range', { startDate: input.startDate, endDate: input.endDate });
            res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
            return;
        }
        const overallocationCheck = await assignmentService_1.default.checkOverAllocation(input.userId, input.workingPercent);
        if (overallocationCheck.isOverallocated) {
            const warning = `Warning: Team member will be over-allocated (${overallocationCheck.currentAllocation + input.workingPercent}%).`;
            logger_1.default.warn(warning, { userId: input.userId });
            res.status(200).json({
                assignment: null,
                overallocationWarning: warning,
                currentAllocation: overallocationCheck.currentAllocation,
            });
            return;
        }
        const assignment = await assignmentService_1.default.createAssignment({ ...input, phaseId }, userId, userRole);
        res.status(201).json({ assignment, overallocationWarning: null });
    }
    catch (error) {
        logger_1.default.error('Failed to create assignment', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message.includes('Unique constraint')) {
            res.status(409).json({ error: 'Assignment already exists for this user and phase' });
        }
        else if (error instanceof Error && error.message.includes('Foreign key constraint')) {
            res.status(404).json({ error: 'Phase or user not found' });
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
 * GET /phases/:phaseId/assignments
 * List assignments for a specific phase
 */
router.get('/phases/:phaseId/assignments', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const phaseId = req.params.phaseId;
        const assignments = await assignmentService_1.default.getAssignmentsByPhase(phaseId);
        res.json(assignments);
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve assignments', { error, phaseId: req.params.phaseId });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve assignments' });
        }
    }
});
/**
 * PUT /assignments/:id
 * Updates assignment details
 */
router.put('/assignments/:id', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const id = req.params.id;
        const input = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
            res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
            return;
        }
        const assignment = await assignmentService_1.default.updateAssignment(id, input, userId, userRole);
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
 * Deletes an assignment
 */
router.delete('/assignments/:id', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const id = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        await assignmentService_1.default.deleteAssignment(id, userId, userRole);
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
//# sourceMappingURL=assignmentRoutesV2.js.map