"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const taskService_1 = __importDefault(require("../../services/taskService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const router = (0, express_1.Router)();
const taskService = new taskService_1.default();
// GET /phases/:phaseId/tasks
router.get('/phases/:phaseId/tasks', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { phaseId } = req.params;
        const tasks = await taskService.getTasksByPhase(phaseId);
        res.json(tasks);
    }
    catch (error) {
        logger_1.default.error('Failed to get tasks by phase', { error, phaseId: req.params.phaseId });
        res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
});
// POST /tasks
router.post('/tasks', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // TODO: Add stricter role check here if needed (e.g. only Team Leader/Manager)
        // For now relying on RBAC middleware if applied in index or future refinements
        const input = req.body;
        const task = await taskService.createTask(input, req.user.id, req.user.role);
        res.status(201).json(task);
    }
    catch (error) {
        logger_1.default.error('Failed to create task', { error, userId: req.user?.id });
        if (error instanceof Error && error.message.includes('Task code already exists')) {
            res.status(409).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Phase not found') {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to create task' });
        }
    }
});
// PUT /tasks/:id
router.put('/tasks/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const input = req.body;
        const task = await taskService.updateTask(id, input, req.user.id, req.user.role);
        res.json(task);
    }
    catch (error) {
        logger_1.default.error('Failed to update task', { error, taskId: req.params.id });
        if (error instanceof Error && error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
        }
        else if (error instanceof Error && error.message === 'Version conflict') {
            res.status(409).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update task' });
        }
    }
});
// DELETE /tasks/:id
router.delete('/tasks/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        await taskService.deleteTask(id, req.user.id, req.user.role);
        res.status(204).send();
    }
    catch (error) {
        logger_1.default.error('Failed to delete task', { error, taskId: req.params.id });
        if (error instanceof Error && error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map