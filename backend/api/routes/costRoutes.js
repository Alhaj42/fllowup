"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const costService_1 = __importDefault(require("../../services/costService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * POST /costs
 * Create a new cost entry
 */
router.post('/', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { projectId, phaseId, employeeId, period, costAmount, costType, description } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        // Validate required fields
        if (!projectId || !phaseId || !employeeId || !period || !costAmount || !costType) {
            res.status(400).json({
                error: 'Missing required fields: projectId, phaseId, employeeId, period, costAmount, costType',
            });
            return;
        }
        // Validate costAmount
        if (costAmount < 0) {
            res.status(400).json({ error: 'costAmount must be non-negative' });
            return;
        }
        // Validate costType
        const validCostTypes = ['EMPLOYEE_COST', 'MATERIAL_COST', 'OTHER_COST'];
        if (!validCostTypes.includes(costType)) {
            res.status(400).json({
                error: `Invalid costType. Must be one of: ${validCostTypes.join(', ')}`,
            });
            return;
        }
        // Validate period
        const parsedPeriod = new Date(period);
        if (isNaN(parsedPeriod.getTime())) {
            res.status(400).json({ error: 'Invalid period format' });
            return;
        }
        // Create cost entry
        const costEntry = await costService_1.default.createCostEntry({
            projectId,
            phaseId,
            employeeId,
            period: parsedPeriod,
            costAmount,
            costType,
            description,
        }, userId, userRole);
        res.status(201).json(costEntry);
    }
    catch (error) {
        logger_1.default.error('Failed to create cost entry', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message.includes('Duplicate cost entry')) {
            res.status(409).json({ error: error.message });
        }
        else if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to create cost entry' });
        }
    }
});
/**
 * GET /costs/project/:projectId
 * Get all cost entries for a project broken down by category
 */
router.get('/project/:projectId', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const projectId = req.params.projectId;
        const categorizedCosts = await costService_1.default.getCostsByProjectAndCategory(projectId);
        res.json(categorizedCosts);
    }
    catch (error) {
        logger_1.default.error('Failed to get project costs', {
            error,
            projectId: req.params.projectId,
        });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to get project costs' });
        }
    }
});
/**
 * GET /costs/summary/:projectId
 * Get cost summary for a project
 */
router.get('/summary/:projectId', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const projectId = req.params.projectId;
        const summary = await costService_1.default.getCostSummary(projectId);
        res.json(summary);
    }
    catch (error) {
        logger_1.default.error('Failed to get cost summary', {
            error,
            projectId: req.params.projectId,
        });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to get cost summary' });
        }
    }
});
/**
 * PUT /costs/:id
 * Update an existing cost entry
 */
router.put('/:id', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const id = req.params.id;
        const { costAmount, costType, description } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        // Validate costAmount if provided
        if (costAmount !== undefined && costAmount < 0) {
            res.status(400).json({ error: 'costAmount must be non-negative' });
            return;
        }
        // Validate costType if provided
        if (costType) {
            const validCostTypes = ['EMPLOYEE_COST', 'MATERIAL_COST', 'OTHER_COST'];
            if (!validCostTypes.includes(costType)) {
                res.status(400).json({
                    error: `Invalid costType. Must be one of: ${validCostTypes.join(', ')}`,
                });
                return;
            }
        }
        const costEntry = await costService_1.default.updateCostEntry(id, {
            costAmount,
            costType,
            description,
        }, userId, userRole);
        res.json(costEntry);
    }
    catch (error) {
        logger_1.default.error('Failed to update cost entry', { error, costEntryId: req.params.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Cost entry not found') {
            res.status(404).json({ error: 'Cost entry not found' });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update cost entry' });
        }
    }
});
/**
 * DELETE /costs/:id
 * Delete a cost entry
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
        await costService_1.default.deleteCostEntry(id, userId, userRole);
        res.status(204).send();
    }
    catch (error) {
        logger_1.default.error('Failed to delete cost entry', { error, costEntryId: req.params.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Cost entry not found') {
            res.status(404).json({ error: 'Cost entry not found' });
        }
        else {
            res.status(500).json({ error: 'Failed to delete cost entry' });
        }
    }
});
/**
 * GET /costs
 * Get all cost entries (admin/manager only)
 */
router.get('/', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { projectId } = req.query;
        if (!projectId || typeof projectId !== 'string') {
            res.status(400).json({ error: 'projectId query parameter is required' });
            return;
        }
        const costs = await costService_1.default.getCostsByProject(projectId);
        res.json(costs);
    }
    catch (error) {
        logger_1.default.error('Failed to get cost entries', { error });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to get cost entries' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=costRoutes.js.map