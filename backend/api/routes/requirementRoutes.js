"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const requirementService_1 = __importDefault(require("../../services/requirementService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const prismaClient_1 = require("../../services/prismaClient");
const router = (0, express_1.Router)();
router.post('/:projectId/requirements', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const projectId = req.params.projectId;
        const input = req.body;
        if (!input.description || input.description.trim() === '') {
            res.status(400).json({ error: 'Description is required' });
            return;
        }
        const project = await prismaClient_1.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        const requirement = await requirementService_1.default.createRequirement(input, projectId, req.user.id, req.user.role);
        res.status(201).json(requirement);
    }
    catch (error) {
        const projectId = req.params.projectId;
        logger_1.default.error('Failed to create requirement', { error, projectId });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to create requirement' });
        }
    }
});
router.patch('/:id/complete', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER', 'TEAM_LEADER']), async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const id = req.params.id;
        const { isCompleted } = req.body;
        if (typeof isCompleted !== 'boolean') {
            res.status(400).json({ error: 'isCompleted must be a boolean' });
            return;
        }
        const requirement = await requirementService_1.default.completeRequirement(id, isCompleted, req.user.id, req.user.role);
        res.json(requirement);
    }
    catch (error) {
        logger_1.default.error('Failed to update requirement completion', { error, requirementId: req.params.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Requirement not found') {
            res.status(404).json({ error: 'Requirement not found' });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update requirement' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=requirementRoutes.js.map