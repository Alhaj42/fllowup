"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const userService_1 = require("../../services/userService");
const logger_1 = __importDefault(require("../../utils/logger"));
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
const userService = new userService_1.UserService();
// Simple test endpoint (no auth required) - MUST be before /:id route
router.get('/test', (req, res) => {
    console.log('Test endpoint hit!');
    res.json({ message: 'User routes working!', timestamp: new Date().toISOString() });
});
router.get('/', auth_1.authenticate, authz_1.requireManager, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { role, isActive, page, limit, search, } = req.query;
        const filter = {
            role: role,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
            search,
        };
        const result = await userService.getAllUsers(filter);
        res.json(result);
    }
    catch (error) {
        console.error('GET /users error:', error);
        logger_1.default.error('Failed to get users', { error: error instanceof Error ? error.message : error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(500).json({ error: error.message, details: error.stack });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve users' });
        }
    }
});
router.post('/', auth_1.authenticate, authz_1.requireManager, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const input = req.body;
        console.log('Creating user with input:', input);
        const existingUser = await userService.getUserByEmail(input.email);
        if (existingUser) {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }
        const user = await userService.createUser(input, req.user.id, req.user.role);
        console.log('User created successfully:', user.id);
        res.status(201).json(user);
    }
    catch (error) {
        console.error('CREATE USER ERROR:', error);
        logger_1.default.error('Failed to create user', { error: error instanceof Error ? error.message : error, userId: req.user?.id });
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            res.status(409).json({ error: 'User with this email already exists' });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message, details: error.stack });
        }
        else {
            res.status(500).json({ error: 'Failed to create user' });
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
        const user = await userService.getUserById(id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.log('GET /:id route hit with id:', req.params.id);
        console.log('Error:', error);
        logger_1.default.error('Failed to get user', { error, userId: req.params.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve user' });
        }
    }
});
router.put('/:id', auth_1.authenticate, authz_1.requireManager, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const input = req.body;
        const user = await userService.getUserById(id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const updatedUser = await userService.updateUser(id, input, req.user.id);
        res.json(updatedUser);
    }
    catch (error) {
        logger_1.default.error('Failed to update user', { error, userId: req.params.id });
        if (error instanceof Error && error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        }
        else if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update user' });
        }
    }
});
router.delete('/:id', auth_1.authenticate, authz_1.requireManager, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const user = await userService.getUserById(id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        await userService.deactivateUser(id, req.user.id, req.user.role);
        res.status(204).send();
    }
    catch (error) {
        logger_1.default.error('Failed to deactivate user', { error, userId: req.params.id });
        if (error instanceof Error && error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        }
        else if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to deactivate user' });
        }
    }
});
router.patch('/:id/toggle', auth_1.authenticate, authz_1.requireManager, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const user = await userService.getUserById(id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const updatedUser = await userService.toggleUserActiveStatus(id, req.user.id, req.user.role);
        res.json(updatedUser);
    }
    catch (error) {
        logger_1.default.error('Failed to toggle user active status', { error, userId: req.params.id });
        if (error instanceof Error && error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        }
        else if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to toggle user active status' });
        }
    }
});
router.get('/roles/team-leaders', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const teamLeaders = await userService.getTeamLeaders();
        res.json(teamLeaders);
    }
    catch (error) {
        logger_1.default.error('Failed to get team leaders', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve team leaders' });
        }
    }
});
router.get('/roles/team-members', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const teamMembers = await userService.getTeamMembers();
        res.json(teamMembers);
    }
    catch (error) {
        logger_1.default.error('Failed to get team members', { error, userId: req.user?.id });
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to retrieve team members' });
        }
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map