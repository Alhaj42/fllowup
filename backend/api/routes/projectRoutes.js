"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const projectService_1 = __importDefault(require("../../services/projectService"));
const timelineService_1 = __importDefault(require("../../services/timelineService"));
const modificationTrackingService_1 = __importDefault(require("../../services/modificationTrackingService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const prismaClient_1 = require("../../services/prismaClient");
const router = (0, express_1.Router)();
const projectService = new projectService_1.default();
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const input = req.body;
        const project = await projectService.createProject(input, req.user.id, req.user.role);
        res.status(201).json(project);
    }
    catch (error) {
        logger_1.default.error('Failed to create project', { error, userId: req.user?.id });
        if (error instanceof Error && error.message.includes('Foreign key constraint')) {
            res.status(400).json({ error: 'Invalid client ID provided' });
        }
        else if (error instanceof Error && error.message.includes('Unique constraint')) {
            res.status(409).json({ error: 'Contract code already exists' });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to create project' });
        }
    }
});
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { status, phase: currentPhase, page, limit, search, clientId, } = req.query;
        const filter = {
            status: status,
            currentPhase: currentPhase,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
            search,
            clientId,
        };
        const result = await projectService.getProjects(filter, req.user.id);
        res.json(result);
    }
    catch (error) {
        logger_1.default.error('Failed to get projects', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve projects' });
        }
    }
});
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const input = req.body;
        const project = await projectService.getProjectById(id, req.user.id);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        if (input.version !== undefined && input.version !== project.version) {
            throw new errorHandler_1.AppError('Version conflict: The record was modified by another user', 409);
        }
        const updatedProject = await projectService.updateProject(id, input, req.user.id, req.user.role);
        res.json(updatedProject);
    }
    catch (error) {
        logger_1.default.error('Failed to update project', { error, projectId: req.params.id });
        if (error instanceof errorHandler_1.AppError && error.statusCode === 409) {
            res.status(409).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update project' });
        }
    }
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const project = await projectService.getProjectById(id, req.user.id);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(project);
    }
    catch (error) {
        logger_1.default.error('Failed to get project', { error, projectId: req.params.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve project' });
        }
    }
});
router.get('/:id/dashboard', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const dashboard = await projectService.getProjectDashboard(id, req.user.id);
        res.json(dashboard);
    }
    catch (error) {
        logger_1.default.error('Failed to get project dashboard', { error, projectId: req.params.id });
        if (error instanceof Error && error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        }
        else if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve project dashboard' });
        }
    }
});
router.get('/:id/timeline', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const timeline = await timelineService_1.default.getTimeline({ projectId: id });
        res.json(timeline);
    }
    catch (error) {
        logger_1.default.error('Failed to get project timeline', { error, projectId: req.params.id });
        if (error instanceof errorHandler_1.AppError && error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        }
        else if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve project timeline' });
        }
    }
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        await projectService.deleteProject(id, req.user.id, req.user.role);
        res.status(204).send();
    }
    catch (error) {
        logger_1.default.error('Failed to delete project', { error, projectId: req.params.id });
        if (error instanceof Error && error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        }
        else {
            res.status(500).json({ error: 'Failed to delete project' });
        }
    }
});
router.get('/:id/phases', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const project = await projectService.getProjectById(id, req.user.id);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        const phases = await prismaClient_1.prisma.phase.findMany({
            where: { projectId: id },
            include: {
                tasks: true,
                assignments: {
                    include: {
                        teamMember: true,
                    },
                },
            },
        });
        res.json(phases);
    }
    catch (error) {
        logger_1.default.error('Failed to get project phases', { error, projectId: req.params.id });
        res.status(500).json({ error: 'Failed to retrieve phases' });
    }
});
router.get('/:id/requirements', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const project = await projectService.getProjectById(id, req.user.id);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        const requirements = await prismaClient_1.prisma.projectRequirement.findMany({
            where: { projectId: id },
        });
        res.json(requirements);
    }
    catch (error) {
        logger_1.default.error('Failed to get project requirements', { error, projectId: req.params.id });
        res.status(500).json({ error: 'Failed to retrieve requirements' });
    }
});
router.get('/:id/modifications', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const stats = await modificationTrackingService_1.default.getModificationStats(id);
        res.json(stats);
    }
    catch (error) {
        logger_1.default.error('Failed to get project modifications', { error, projectId: req.params.id });
        if (error instanceof Error && error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        }
        else if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve modifications' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=projectRoutes.js.map