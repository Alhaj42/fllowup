"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const configurationService_1 = require("../../services/configurationService");
const router = (0, express_1.Router)();
// GET /configuration/:category - Get all configuration items for a category (all roles)
router.get('/:category', auth_1.authenticate, async (req, res) => {
    try {
        const category = req.params.category;
        const items = await configurationService_1.configurationService.getConfigurationByCategory(category);
        res.json({ data: items });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve configuration' });
    }
});
// POST /configuration - Create configuration item (MANAGER only)
router.post('/', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER']), async (req, res) => {
    try {
        const { category, name, code, description, sortOrder } = req.body;
        if (!category || !name) {
            res.status(400).json({ error: 'category and name are required' });
            return;
        }
        const item = await configurationService_1.configurationService.createConfiguration({
            category,
            name,
            code,
            description,
            sortOrder,
        });
        res.status(201).json({ data: item });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create configuration' });
    }
});
// PUT /configuration/:category/:key - Update configuration item (MANAGER only)
router.put('/:category/:key', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER']), async (req, res) => {
    try {
        const category = req.params.category;
        const name = req.params.key;
        const { code, description, isActive, sortOrder } = req.body;
        const item = await configurationService_1.configurationService.updateConfiguration(category, name, { name, code, description, isActive, sortOrder });
        res.json({ data: item });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});
// DELETE /configuration/:category/:key - Delete configuration item (MANAGER only)
router.delete('/:category/:key', auth_1.authenticate, (0, authz_1.authorize)(['MANAGER']), async (req, res) => {
    try {
        const category = req.params.category;
        const name = req.params.key;
        await configurationService_1.configurationService.deleteConfiguration(category, name);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete configuration' });
    }
});
exports.default = router;
//# sourceMappingURL=configurationRoutes.js.map