"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const kpiService_1 = require("../../services/kpiService");
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
// Apply authentication to all routes
router.use(auth_1.authenticate);
/**
 * @route   POST /api/v1/kpis
 * @desc    Create a new KPI entry
 * @access  Private (Manager only)
 */
router.post('/', authz_1.requireManager, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { employeeId, projectId, phaseId, delayedDays, clientModifications, technicalMistakes, period } = req.body;
    // Validate required fields
    if (!employeeId || !projectId || !phaseId) {
        return res.status(400).json({ error: 'Missing required fields: employeeId, projectId, phaseId' });
    }
    // Validate non-negative values
    if (delayedDays !== undefined && delayedDays < 0) {
        return res.status(400).json({ error: 'delayedDays cannot be negative' });
    }
    if (clientModifications !== undefined && clientModifications < 0) {
        return res.status(400).json({ error: 'clientModifications cannot be negative' });
    }
    if (technicalMistakes !== undefined && technicalMistakes < 0) {
        return res.status(400).json({ error: 'technicalMistakes cannot be negative' });
    }
    // Validate period format if provided
    if (period) {
        const periodDate = new Date(period);
        if (isNaN(periodDate.getTime())) {
            return res.status(400).json({ error: 'Invalid period format' });
        }
    }
    const kpiEntry = await kpiService_1.kpiService.createKPIEntry({
        employeeId,
        projectId,
        phaseId,
        delayedDays,
        clientModifications,
        technicalMistakes,
        period: period ? new Date(period) : undefined,
    }, req.user.id, req.user.role);
    res.status(201).json(kpiEntry);
}));
/**
 * @route   GET /api/v1/kpis/employee/:employeeId
 * @desc    Get all KPI entries for an employee
 * @access  Private
 */
router.get('/employee/:employeeId', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { employeeId } = req.params;
    const { projectId, phaseId, startDate, endDate } = req.query;
    // Validate date formats if provided
    if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            return res.status(400).json({ error: 'Invalid startDate format' });
        }
    }
    if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid endDate format' });
        }
    }
    const kpiEntries = await kpiService_1.kpiService.getEmployeeKPIs(employeeId, {
        projectId: typeof projectId === "string" ? projectId : projectId[0],
        phaseId: typeof phaseId === "string" ? phaseId : phaseId[0],
        startDate: typeof startDate === "string" ? startDate : startDate[0],
        endDate: typeof endDate === "string" ? endDate : endDate[0],
    });
    res.json(kpiEntries);
}));
/**
 * @route   PUT /api/v1/kpis/:id
 * @desc    Update a KPI entry
 * @access  Private (Manager only)
 */
router.put('/:id', authz_1.requireManager, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { delayedDays, clientModifications, technicalMistakes, period } = req.body;
    // Validate non-negative values
    if (delayedDays !== undefined && delayedDays < 0) {
        return res.status(400).json({ error: 'delayedDays cannot be negative' });
    }
    if (clientModifications !== undefined && clientModifications < 0) {
        return res.status(400).json({ error: 'clientModifications cannot be negative' });
    }
    if (technicalMistakes !== undefined && technicalMistakes < 0) {
        return res.status(400).json({ error: 'technicalMistakes cannot be negative' });
    }
    // Validate period format if provided
    if (period) {
        const periodDate = new Date(period);
        if (isNaN(periodDate.getTime())) {
            return res.status(400).json({ error: 'Invalid period format' });
        }
    }
    const updatedKPI = await kpiService_1.kpiService.updateKPIEntry(id, {
        delayedDays,
        clientModifications,
        technicalMistakes,
        period: period ? new Date(period) : undefined,
    }, req.user.id, req.user.role);
    res.json(updatedKPI);
}));
/**
 * @route   DELETE /api/v1/kpis/:id
 * @desc    Delete a KPI entry
 * @access  Private (Manager only)
 */
router.delete('/:id', authz_1.requireManager, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await kpiService_1.kpiService.deleteKPIEntry(id, req.user.id, req.user.role);
    res.status(204).send();
}));
/**
 * @route   GET /api/v1/kpis/summary
 * @desc    Get KPI summary for an employee
 * @access  Private
 */
router.get('/summary', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { employeeId, startDate, endDate } = req.query;
    if (!employeeId) {
        return res.status(400).json({ error: 'employeeId is required' });
    }
    const summary = await kpiService_1.kpiService.getKPISummary(employeeId, {
        startDate: startDate,
        endDate: endDate,
    });
    res.json(summary);
}));
/**
 * @route   GET /api/v1/kpis/trends
 * @desc    Get KPI trends over time for an employee
 * @access  Private
 */
router.get('/trends', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { employeeId, startDate, endDate } = req.query;
    if (!employeeId) {
        return res.status(400).json({ error: 'employeeId is required' });
    }
    const trends = await kpiService_1.kpiService.getKPITrends(employeeId, {
        startDate: startDate,
        endDate: endDate,
    });
    res.json(trends);
}));
exports.default = router;
//# sourceMappingURL=kpiRoutes.js.map