"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kpiService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const auditLogService_1 = __importDefault(require("./auditLogService"));
const prismaClient_1 = require("./prismaClient");
class KPIService {
    prisma;
    constructor() {
        this.prisma = prismaClient_1.prisma;
    }
    /**
     * Calculate KPI score based on delays, modifications, and mistakes
     * Formula: 100 - (delayedDays * 2) - (clientModifications * 3) - (technicalMistakes * 5)
     */
    calculateScore(delayedDays, clientModifications, technicalMistakes) {
        const penalty = (delayedDays * 2) + (clientModifications * 3) + (technicalMistakes * 5);
        const score = Math.max(0, 100 - penalty);
        return Math.round(score * 100) / 100; // Round to 2 decimal places
    }
    /**
     * Create a new KPI entry for an employee
     */
    async createKPIEntry(input, currentUserId, currentUserRole) {
        try {
            // Validate employee exists
            const employee = await this.prisma.user.findUnique({
                where: { id: input.employeeId },
            });
            if (!employee) {
                throw new Error('Employee not found');
            }
            // Validate project exists
            const project = await this.prisma.project.findUnique({
                where: { id: input.projectId },
            });
            if (!project) {
                throw new Error('Project not found');
            }
            // Validate phase exists
            const phase = await this.prisma.phase.findUnique({
                where: { id: input.phaseId },
            });
            if (!phase) {
                throw new Error('Phase not found');
            }
            // Validate non-negative values
            if (input.delayedDays !== undefined && input.delayedDays < 0) {
                throw new Error('delayedDays cannot be negative');
            }
            if (input.clientModifications !== undefined && input.clientModifications < 0) {
                throw new Error('clientModifications cannot be negative');
            }
            if (input.technicalMistakes !== undefined && input.technicalMistakes < 0) {
                throw new Error('technicalMistakes cannot be negative');
            }
            // Calculate score
            const delayedDays = input.delayedDays || 0;
            const clientModifications = input.clientModifications || 0;
            const technicalMistakes = input.technicalMistakes || 0;
            const score = this.calculateScore(delayedDays, clientModifications, technicalMistakes);
            const kpiEntry = await this.prisma.kPIEntry.create({
                data: {
                    employeeId: input.employeeId,
                    projectId: input.projectId,
                    phaseId: input.phaseId,
                    delayedDays,
                    clientModifications,
                    technicalMistakes,
                    period: input.period || null,
                    score,
                },
                include: {
                    employee: true,
                    project: true,
                    phase: true,
                },
            });
            await auditLogService_1.default.logCreate('KPIEntry', kpiEntry.id, currentUserId, currentUserRole, kpiEntry);
            logger_1.default.info('KPI entry created successfully', {
                kpiEntryId: kpiEntry.id,
                employeeId: input.employeeId,
                projectId: input.projectId,
            });
            return kpiEntry;
        }
        catch (error) {
            logger_1.default.error('Failed to create KPI entry', { error, input });
            throw error;
        }
    }
    /**
     * Get all KPI entries for an employee
     */
    async getEmployeeKPIs(employeeId, filter) {
        try {
            const whereClause = { employeeId };
            if (filter?.projectId) {
                whereClause.projectId = filter.projectId;
            }
            if (filter?.phaseId) {
                whereClause.phaseId = filter.phaseId;
            }
            if (filter?.startDate || filter?.endDate) {
                whereClause.period = {};
                if (filter.startDate) {
                    whereClause.period.gte = new Date(filter.startDate);
                }
                if (filter.endDate) {
                    whereClause.period.lte = new Date(filter.endDate);
                }
            }
            const kpiEntries = await this.prisma.kPIEntry.findMany({
                where: whereClause,
                include: {
                    employee: true,
                    project: true,
                    phase: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return kpiEntries;
        }
        catch (error) {
            logger_1.default.error('Failed to get employee KPIs', { error, employeeId, filter });
            throw error;
        }
    }
    /**
     * Update a KPI entry
     */
    async updateKPIEntry(id, input, currentUserId, currentUserRole) {
        try {
            const existing = await this.prisma.kPIEntry.findUnique({
                where: { id },
            });
            if (!existing) {
                throw new Error('KPI entry not found');
            }
            // Validate non-negative values
            if (input.delayedDays !== undefined && input.delayedDays < 0) {
                throw new Error('delayedDays cannot be negative');
            }
            if (input.clientModifications !== undefined && input.clientModifications < 0) {
                throw new Error('clientModifications cannot be negative');
            }
            if (input.technicalMistakes !== undefined && input.technicalMistakes < 0) {
                throw new Error('technicalMistakes cannot be negative');
            }
            // Calculate new score
            const delayedDays = input.delayedDays ?? existing.delayedDays;
            const clientModifications = input.clientModifications ?? existing.clientModifications;
            const technicalMistakes = input.technicalMistakes ?? existing.technicalMistakes;
            const score = this.calculateScore(delayedDays, clientModifications, technicalMistakes);
            const kpiEntry = await this.prisma.kPIEntry.update({
                where: { id },
                data: {
                    ...input,
                    score,
                },
                include: {
                    employee: true,
                    project: true,
                    phase: true,
                },
            });
            await auditLogService_1.default.logUpdate('KPIEntry', id, currentUserId, currentUserRole, existing, kpiEntry);
            logger_1.default.info('KPI entry updated successfully', { kpiEntryId: id });
            return kpiEntry;
        }
        catch (error) {
            logger_1.default.error('Failed to update KPI entry', { error, id, input });
            throw error;
        }
    }
    /**
     * Delete a KPI entry
     */
    async deleteKPIEntry(id, currentUserId, currentUserRole) {
        try {
            const kpiEntry = await this.prisma.kPIEntry.findUnique({
                where: { id },
            });
            if (!kpiEntry) {
                throw new Error('KPI entry not found');
            }
            await this.prisma.kPIEntry.delete({
                where: { id },
            });
            await auditLogService_1.default.logDelete('KPIEntry', id, currentUserId, currentUserRole, kpiEntry);
            logger_1.default.info('KPI entry deleted successfully', { kpiEntryId: id });
        }
        catch (error) {
            logger_1.default.error('Failed to delete KPI entry', { error, id });
            throw error;
        }
    }
    /**
     * Get KPI summary for an employee
     */
    async getKPISummary(employeeId, filter) {
        try {
            const whereClause = { employeeId };
            if (filter?.startDate || filter?.endDate) {
                whereClause.period = {};
                if (filter.startDate) {
                    whereClause.period.gte = new Date(filter.startDate);
                }
                if (filter.endDate) {
                    whereClause.period.lte = new Date(filter.endDate);
                }
            }
            const kpiEntries = await this.prisma.kPIEntry.findMany({
                where: whereClause,
            });
            const employee = await this.prisma.user.findUnique({
                where: { id: employeeId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });
            const totalKPIs = kpiEntries.length;
            const totalDelayedDays = kpiEntries.reduce((sum, kpi) => sum + kpi.delayedDays, 0);
            const totalClientModifications = kpiEntries.reduce((sum, kpi) => sum + kpi.clientModifications, 0);
            const totalTechnicalMistakes = kpiEntries.reduce((sum, kpi) => sum + kpi.technicalMistakes, 0);
            const scoresWithValues = kpiEntries.filter((kpi) => kpi.score !== null);
            const averageScore = scoresWithValues.length > 0
                ? scoresWithValues.reduce((sum, kpi) => sum + Number(kpi.score), 0) /
                    scoresWithValues.length
                : null;
            return {
                employeeId,
                employeeName: employee?.name,
                employee,
                totalKPIs,
                averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null,
                totalDelayedDays,
                totalClientModifications,
                totalTechnicalMistakes,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get KPI summary', { error, employeeId, filter });
            throw error;
        }
    }
    /**
     * Get KPI trends over time for an employee
     */
    async getKPITrends(employeeId, filter) {
        try {
            const whereClause = { employeeId };
            if (filter?.startDate || filter?.endDate) {
                whereClause.period = {};
                if (filter.startDate) {
                    whereClause.period.gte = new Date(filter.startDate);
                }
                if (filter.endDate) {
                    whereClause.period.lte = new Date(filter.endDate);
                }
            }
            const kpiEntries = await this.prisma.kPIEntry.findMany({
                where: whereClause,
                include: {
                    project: {
                        select: {
                            name: true,
                        },
                    },
                    phase: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { period: 'asc' },
            });
            return kpiEntries.map((kpi) => ({
                id: kpi.id,
                period: kpi.period,
                score: kpi.score ? Number(kpi.score) : null,
                delayedDays: kpi.delayedDays,
                clientModifications: kpi.clientModifications,
                technicalMistakes: kpi.technicalMistakes,
                projectName: kpi.project.name,
                phaseName: String(kpi.phase.name),
            }));
        }
        catch (error) {
            logger_1.default.error('Failed to get KPI trends', { error, employeeId, filter });
            throw error;
        }
    }
}
exports.kpiService = new KPIService();
//# sourceMappingURL=kpiService.js.map