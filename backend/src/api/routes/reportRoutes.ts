import { Router, Request, Response } from 'express';
import { reportService } from '../../services/reportService';
import { authz } from '../../middleware/authz';
import { auditMiddleware } from '../../middleware/auditMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);
router.use(auditMiddleware);

const router = Router();

/**
 * @route   GET /api/v1/reports/project/:id/follow-up
 * @desc    Get project follow-up report data
 * @access  Private (Manager)
 */
router.get(
  '/project/:id/follow-up',
  authz(['MANAGER']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const report = await reportService.getProjectFollowUpReport(id, userId);
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
  authz(['MANAGER']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const excelFile = await reportService.exportProjectFollowUpReportExcel(id, userId);

    res.setHeader('Content-Type', excelFile.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${excelFile.filename}"`
    );
    res.send(excelFile.buffer);
  })
);

/**
 * @route   GET /api/v1/reports/employee/:id/summary
 * @desc    Get employee summary report
 * @access  Private
 */
router.get(
  '/employee/:id/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

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
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const filters = req.query as any;

    const report = await reportService.getKPISummary(id, filters, userId);
    res.json(report);
  })
);

export default router;
