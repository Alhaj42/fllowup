import { UserRole } from '@prisma/client';
export interface CreateKPIEntryInput {
    employeeId: string;
    projectId: string;
    phaseId: string;
    delayedDays?: number;
    clientModifications?: number;
    technicalMistakes?: number;
    period?: Date;
}
export interface UpdateKPIEntryInput {
    delayedDays?: number;
    clientModifications?: number;
    technicalMistakes?: number;
    period?: Date;
}
export interface GetEmployeeKPIsFilter {
    projectId?: string;
    phaseId?: string;
    startDate?: string;
    endDate?: string;
}
export interface KPISummary {
    employeeId: string;
    employeeName?: string;
    employee?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    totalKPIs: number;
    averageScore: number | null;
    totalDelayedDays: number;
    totalClientModifications: number;
    totalTechnicalMistakes: number;
}
export interface KPITrend {
    id: string;
    period: Date | null;
    score: number | null;
    delayedDays: number;
    clientModifications: number;
    technicalMistakes: number;
    projectName: string;
    phaseName: string;
}
declare class KPIService {
    private prisma;
    constructor();
    /**
     * Calculate KPI score based on delays, modifications, and mistakes
     * Formula: 100 - (delayedDays * 2) - (clientModifications * 3) - (technicalMistakes * 5)
     */
    private calculateScore;
    /**
     * Create a new KPI entry for an employee
     */
    createKPIEntry(input: CreateKPIEntryInput, currentUserId: string, currentUserRole: UserRole): Promise<{
        project: {
            id: string;
            clientId: string;
            name: string;
            contractCode: string;
            contractSigningDate: Date;
            builtUpArea: import("@prisma/client/runtime/library").Decimal;
            licenseType: string | null;
            projectType: string | null;
            requirements: string | null;
            startDate: Date;
            estimatedEndDate: Date;
            actualEndDate: Date | null;
            currentPhase: import(".prisma/client").$Enums.ProjectPhase;
            status: import(".prisma/client").$Enums.ProjectStatus;
            modificationAllowedTimes: number;
            modificationDaysPerTime: number;
            totalCost: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            version: number;
        };
        phase: {
            id: string;
            projectId: string;
            name: import(".prisma/client").$Enums.PhaseName;
            startDate: Date;
            duration: number;
            estimatedEndDate: Date;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            status: import(".prisma/client").$Enums.PhaseStatus;
            progress: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            version: number;
        };
        employee: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            position: string | null;
            region: string | null;
            grade: string | null;
            level: string | null;
            monthlyCost: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        employeeId: string;
        projectId: string;
        phaseId: string;
        delayedDays: number;
        clientModifications: number;
        technicalMistakes: number;
        period: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Get all KPI entries for an employee
     */
    getEmployeeKPIs(employeeId: string, filter?: GetEmployeeKPIsFilter): Promise<({
        project: {
            id: string;
            clientId: string;
            name: string;
            contractCode: string;
            contractSigningDate: Date;
            builtUpArea: import("@prisma/client/runtime/library").Decimal;
            licenseType: string | null;
            projectType: string | null;
            requirements: string | null;
            startDate: Date;
            estimatedEndDate: Date;
            actualEndDate: Date | null;
            currentPhase: import(".prisma/client").$Enums.ProjectPhase;
            status: import(".prisma/client").$Enums.ProjectStatus;
            modificationAllowedTimes: number;
            modificationDaysPerTime: number;
            totalCost: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            version: number;
        };
        phase: {
            id: string;
            projectId: string;
            name: import(".prisma/client").$Enums.PhaseName;
            startDate: Date;
            duration: number;
            estimatedEndDate: Date;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            status: import(".prisma/client").$Enums.PhaseStatus;
            progress: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            version: number;
        };
        employee: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            position: string | null;
            region: string | null;
            grade: string | null;
            level: string | null;
            monthlyCost: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        employeeId: string;
        projectId: string;
        phaseId: string;
        delayedDays: number;
        clientModifications: number;
        technicalMistakes: number;
        period: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    /**
     * Update a KPI entry
     */
    updateKPIEntry(id: string, input: UpdateKPIEntryInput, currentUserId: string, currentUserRole: UserRole): Promise<{
        project: {
            id: string;
            clientId: string;
            name: string;
            contractCode: string;
            contractSigningDate: Date;
            builtUpArea: import("@prisma/client/runtime/library").Decimal;
            licenseType: string | null;
            projectType: string | null;
            requirements: string | null;
            startDate: Date;
            estimatedEndDate: Date;
            actualEndDate: Date | null;
            currentPhase: import(".prisma/client").$Enums.ProjectPhase;
            status: import(".prisma/client").$Enums.ProjectStatus;
            modificationAllowedTimes: number;
            modificationDaysPerTime: number;
            totalCost: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            version: number;
        };
        phase: {
            id: string;
            projectId: string;
            name: import(".prisma/client").$Enums.PhaseName;
            startDate: Date;
            duration: number;
            estimatedEndDate: Date;
            actualStartDate: Date | null;
            actualEndDate: Date | null;
            status: import(".prisma/client").$Enums.PhaseStatus;
            progress: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            version: number;
        };
        employee: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            position: string | null;
            region: string | null;
            grade: string | null;
            level: string | null;
            monthlyCost: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        employeeId: string;
        projectId: string;
        phaseId: string;
        delayedDays: number;
        clientModifications: number;
        technicalMistakes: number;
        period: Date | null;
        score: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Delete a KPI entry
     */
    deleteKPIEntry(id: string, currentUserId: string, currentUserRole: UserRole): Promise<void>;
    /**
     * Get KPI summary for an employee
     */
    getKPISummary(employeeId: string, filter?: {
        startDate?: string;
        endDate?: string;
    }): Promise<KPISummary>;
    /**
     * Get KPI trends over time for an employee
     */
    getKPITrends(employeeId: string, filter?: {
        startDate?: string;
        endDate?: string;
    }): Promise<KPITrend[]>;
}
export declare const kpiService: KPIService;
export {};
//# sourceMappingURL=kpiService.d.ts.map