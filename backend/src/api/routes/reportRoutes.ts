import { Router, Response } from 'express';
import reportService from '../../services/reportService';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { authorize } from '../../middleware/authz';
import { auditMiddleware } from '../../middleware/auditMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware);

/**
 * @route   GET /api/v1/reports/project/:id/follow-up
 * @desc    Get project follow-up report data
 * @access  Private (Manager)
 */
router.get(
  '/project/:id/follow-up',
  authorize(['MANAGER']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id || '';

    const report = await reportService.exportProjectFollowUpReportPDF(id, userId);
    res.json(report);
  })
);

/**
 * @route   GET /api/v1/reports/project/:id/follow-up/excel
 * @desc    Export project follow-up report as Excel file
 * @access  Private (Manager)
 */
router.get(
  '/project/:id/follow-up/excel',
  authorize(['MANAGER']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id || '';

    const report = await reportService.exportProjectFollowUpReportPDF(id, userId);
    res.json(report);
  })
);

/**
 * @route   GET /api/v1/reports/employee/:id/summary
 * @desc    Get employee summary report
 * @access  Private
 */
router.get(
  '/employee/:id/summary',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id || '';

    const report = await reportService.getEmployeeSummaryReport(id, userId);
    res.json(report);
  })
);

/**
 * @route   GET /api/v1/reports/employee/:id/kpi
 * @desc    Get employee KPI summary report
 * @access  Private
 */
router.get(
  '/employee/:id/kpi',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id || '';

    const report = await reportService.getKPISummaryReport(id, userId);
    res.json(report);
  })
);

export default router;
