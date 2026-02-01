"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const XLSX = __importStar(require("xlsx"));
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
class ReportService {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async exportProjectFollowUpReportPDF(projectId, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: true,
                phases: {
                    include: {
                        tasks: true,
                        assignments: {
                            include: {
                                teamMember: true,
                            },
                        },
                    },
                },
                costEntries: {
                    include: {
                        phase: true,
                    },
                },
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const costSummary = await this.getCostSummary(projectId);
        const phases = project.phases.map((phase) => ({
            phaseName: phase.name,
            status: phase.status,
            startDate: phase.startDate,
            endDate: phase.estimatedEndDate,
            progress: this.calculatePhaseProgress(phase),
            taskCount: phase.tasks.length,
            completedTasks: phase.tasks.filter((t) => t.status === 'COMPLETED').length,
            teamAssignments: phase.assignments.map((a) => ({
                teamMember: a.teamMember.name,
                role: a.role,
                workingPercentage: Number(a.workingPercentage),
            })),
        }));
        const tasks = project.phases.flatMap((phase) => phase.tasks.map((t) => {
            const assignment = phase.assignments.find((a) => a.id === t.assignedTeamMemberId);
            const assignedTo = assignment?.teamMember.name || 'Unassigned';
            const startDate = t.startDate ? new Date(t.startDate).toLocaleDateString() : '';
            const endDate = t.endDate ? new Date(t.endDate).toLocaleDateString() : '';
            const duration = startDate && endDate
                ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) /
                    (1000 * 60 * 60 * 24))
                : 0;
            return {
                id: t.id,
                phase: phase.name,
                description: t.description,
                assignedTo,
                status: t.status,
                startDate,
                endDate,
                duration,
            };
        }));
        const reportData = {
            projectId: project.id,
            projectName: project.name,
            clientName: project.client.name,
            contractCode: project.contractCode,
            startDate: project.startDate,
            estimatedEndDate: project.estimatedEndDate,
            status: project.status,
            phases,
            costSummary,
            tasks,
        };
        await this.logReportGeneration(projectId, userId, 'ProjectFollowUp', 'PDF');
        return reportData;
    }
    async getEmployeeSummaryReport(employeeId, userId) {
        const employee = await this.prisma.user.findUnique({
            where: { id: employeeId },
            include: {
                assignments: {
                    include: {
                        project: {
                            phases: true,
                        },
                    },
                },
            },
        });
        if (!employee) {
            throw new Error('Employee not found');
        }
        const projectSummaries = employee.assignments.map((assignment) => {
            const project = assignment.project;
            const projectPhases = project.phases || [];
            return {
                projectId: project.id,
                projectName: project.name,
                contractCode: project.contractCode,
                role: assignment.role,
                workingPercentage: Number(assignment.workingPercentage),
                phases: projectPhases.map((phase) => ({
                    phaseName: phase.name,
                    status: phase.status,
                    taskCount: phase.tasks.length,
                    completedTasks: phase.tasks.filter((t) => t.status === 'COMPLETED').length,
                })),
            };
        });
        const totalAllocation = employee.assignments.reduce((sum, a) => sum + Number(a.workingPercentage), 0);
        const allProjectIds = employee.assignments.map((a) => a.project.id);
        const allCosts = await this.prisma.costEntry.findMany({
            where: {
                projectId: { in: allProjectIds },
            },
            include: {
                phase: true,
            },
        });
        const totalCost = allCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
        const reportData = {
            employeeId: employee.id,
            employeeName: employee.name,
            email: employee.email,
            totalProjects: employee.assignments.length,
            totalAllocationPercentage: totalAllocation,
            totalCost,
            projectSummaries,
            generatedAt: new Date(),
            generatedBy: userId,
        };
        await this.logReportGeneration(employeeId, userId, 'EmployeeSummary', 'PDF');
        return reportData;
    }
    async exportEmployeeSummaryReportExcel(employeeId, userId) {
        const employee = await this.prisma.user.findUnique({
            where: { id: employeeId },
            include: {
                assignments: {
                    include: {
                        project: {
                            phases: true,
                        },
                    },
                },
            },
        });
        if (!employee) {
            throw new Error('Employee not found');
        }
        const workbook = XLSX.utils.book_new();
        const summaryData = [
            ['Employee Name', employee.name],
            ['Email', employee.email],
            ['Position', employee.position || ''],
            ['Role', employee.role],
            ['Total Projects', employee.assignments.length],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        const projectsData = employee.assignments.map((assignment, index) => {
            const project = assignment.project;
            const projectPhases = project.phases || [];
            const completedTasks = projectPhases
                .filter((p) => p.status === 'COMPLETED')
                .reduce((sum, p) => sum + p.tasks.filter((t) => t.status === 'COMPLETED').length, 0);
            return [
                project.name,
                project.contractCode,
                assignment.role,
                `${Number(assignment.workingPercentage)}%`,
                projectPhases.length,
                completedTasks,
            ];
        });
        const projectsSheet = XLSX.utils.aoa_to_sheet([
            ['Project Name', 'Contract Code', 'Role', 'Allocation %', 'Phases', 'Completed Tasks'],
            ...projectsData,
        ]);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Employee Summary');
        XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Project Assignments');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        logger_1.default.info('Excel employee report generated successfully', { employeeId });
        return {
            filename: `${employee.name}-summary-${new Date().toISOString().split('T')[0]}.xlsx`,
            buffer,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }
    async getKPISummaryReport(employeeId, userId) {
        const employee = await this.prisma.user.findUnique({
            where: { id: employeeId },
            include: {
                kpiEntries: true,
            },
        });
        if (!employee) {
            throw new Error('Employee not found');
        }
        const kpiEntries = employee.kpiEntries || [];
        const delayedTasks = kpiEntries.filter((k) => k.delayedDays > 0);
        const clientMods = kpiEntries.filter((k) => k.clientModifications > 0);
        const techMistakes = kpiEntries.filter((k) => k.technicalMistakes > 0);
        const total = kpiEntries.length;
        const performanceScore = total > 0
            ? Math.round(((total - (delayedTasks.length + clientMods.length + techMistakes.length)) / total) *
                100)
            : 100;
        const reportData = {
            employeeId: employee.id,
            employeeName: employee.name,
            totalProjects: 0,
            totalAllocationPercentage: 0,
            totalCost: 0,
            delayedTasksCount: delayedTasks.length,
            clientModificationsCount: clientMods.length,
            technicalMistakesCount: techMistakes.length,
            performanceScore,
            generatedAt: new Date(),
            generatedBy: userId,
        };
        await this.logReportGeneration(employeeId, userId, 'KPISummary', 'PDF');
        return reportData;
    }
    async getCostSummary(projectId) {
        const costEntries = await this.prisma.costEntry.findMany({
            where: { projectId },
            include: {
                phase: true,
            },
        });
        const employeeCosts = costEntries.filter((c) => c.costType === 'EMPLOYEE_COST');
        const materialCosts = costEntries.filter((c) => c.costType === 'MATERIAL_COST');
        const totalCost = costEntries.reduce((sum, c) => sum + Number(c.costAmount), 0);
        const employeeCostTotal = employeeCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
        const materialCostTotal = materialCosts.reduce((sum, c) => sum + Number(c.costAmount), 0);
        return {
            totalCost,
            employeeCostTotal,
            materialCostTotal,
            totalEntries: costEntries.length,
        };
    }
    calculatePhaseProgress(phase) {
        if (!phase.tasks || phase.tasks.length === 0) {
            return 0;
        }
        const completedTasks = phase.tasks.filter((t) => t.status === 'COMPLETED').length;
        return Math.round((completedTasks / phase.tasks.length) * 100);
    }
    async logReportGeneration(entityId, userId, reportType, format) {
        await this.prisma.auditLog.create({
            data: {
                entityType: 'Report',
                entityId: entityId,
                action: client_1.AuditAction.CREATE,
                changedBy: userId,
                timestamp: new Date(),
            },
        });
        logger_1.default.info(`Report generated`, { reportType, format, entityId });
    }
}
exports.default = new ReportService();
//# sourceMappingURL=reportService.js.map