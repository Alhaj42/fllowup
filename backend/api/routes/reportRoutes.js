"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportService_1 = __importDefault(require("../../services/reportService"));
const auth_1 = require("../../middleware/auth");
const authz_1 = require("../../middleware/authz");
const auditMiddleware_1 = require("../../middleware/auditMiddleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auditMiddleware_1.auditMiddleware);
/**
 * @route   GET /api/v1/reports/project/:id/follow-up
 * @desc    Get project follow-up report data
 * @access  Private (Manager)
 */
router.get('/project/:id/follow-up', (0, authz_1.authorize)(['MANAGER']), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id || '';
    const report = await reportService_1.default.exportProjectFollowUpReportPDF(id, userId);
    res.json(report);
}));
/**
 * @route   GET /api/v1/reports/project/:id/follow-up/excel
 * @desc    Export project follow-up report as Excel file
 * @access  Private (Manager)
 */
router.get('/project/:id/follow-up/excel', (0, authz_1.authorize)(['MANAGER']), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id || '';
    const report = await reportService_1.default.exportProjectFollowUpReportPDF(id, userId);
    res.json(report);
}));
/**
 * @route   GET /api/v1/reports/employee/:id/summary
 * @desc    Get employee summary report
 * @access  Private
 */
router.get('/employee/:id/summary', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id || '';
    const report = await reportService_1.default.getEmployeeSummaryReport(id, userId);
    res.json(report);
}));
/**
 * @route   GET /api/v1/reports/employee/:id/kpi
 * @desc    Get employee KPI summary report
 * @access  Private
 */
router.get('/employee/:id/kpi', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = req.params.id;
    const userId = req.user?.id || '';
    const report = await reportService_1.default.getKPISummaryReport(id, userId);
    res.json(report);
}));
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map