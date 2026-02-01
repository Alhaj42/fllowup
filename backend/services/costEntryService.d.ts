export interface CostEntryInput {
    projectId: string;
    type: 'EMPLOYEE' | 'MATERIAL';
    description: string;
    amount: number;
    teamMemberId?: string;
    date?: string;
}
export interface CostEntryUpdate {
    type?: 'EMPLOYEE' | 'MATERIAL';
    description?: string;
    amount?: number;
}
export declare class CostEntryService {
    createCostEntry(data: CostEntryInput, userId: string): Promise<{
        id: string;
        projectId: string;
        phaseId: string;
        employeeId: string;
        period: Date;
        costAmount: import("@prisma/client/runtime/library").Decimal;
        costType: import(".prisma/client").$Enums.CostType;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCostEntry(costEntryId: string, data: CostEntryUpdate, userId: string): Promise<{
        id: string;
        projectId: string;
        phaseId: string;
        employeeId: string;
        period: Date;
        costAmount: import("@prisma/client/runtime/library").Decimal;
        costType: import(".prisma/client").$Enums.CostType;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteCostEntry(costEntryId: string, userId: string): Promise<{
        message: string;
    }>;
    getCostsByProject(projectId: string): Promise<{
        id: string;
        projectId: string;
        phaseId: string;
        employeeId: string;
        period: Date;
        costAmount: import("@prisma/client/runtime/library").Decimal;
        costType: import(".prisma/client").$Enums.CostType;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getCostSummary(projectId: string): Promise<{
        projectId: string;
        totalCost: any;
        employeeCostTotal: any;
        materialCostTotal: any;
        employeeCostCount: number;
        materialCostCount: number;
        totalEntries: number;
    }>;
    private logCostEntryCreation;
    private logCostEntryUpdate;
    private logCostEntryDeletion;
}
export declare const costEntryService: CostEntryService;
//# sourceMappingURL=costEntryService.d.ts.map