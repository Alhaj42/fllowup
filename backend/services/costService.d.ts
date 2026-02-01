import { UserRole, CostType } from '@prisma/client';
export interface CreateCostEntryInput {
    projectId: string;
    phaseId: string;
    employeeId: string;
    period: Date;
    costAmount: number;
    costType: CostType;
    description?: string;
}
export interface UpdateCostEntryInput {
    costAmount?: number;
    costType?: CostType;
    description?: string;
}
export interface CostCategoryBreakdown {
    EMPLOYEE_COST: Array<any>;
    MATERIAL_COST: Array<any>;
    OTHER_COST: Array<any>;
}
export interface CostSummary {
    projectId: string;
    totalCost: number;
    employeeCostTotal: number;
    materialCostTotal: number;
    otherCostTotal: number;
    employeeCostCount: number;
    materialCostCount: number;
    otherCostCount: number;
    totalEntries: number;
}
declare class CostService {
    private prisma;
    constructor();
    createCostEntry(input: CreateCostEntryInput, currentUserId: string, currentUserRole: UserRole): Promise<any>;
    updateCostEntry(id: string, input: UpdateCostEntryInput, currentUserId: string, currentUserRole: UserRole): Promise<any>;
    deleteCostEntry(id: string, currentUserId: string, currentUserRole: UserRole): Promise<void>;
    getCostsByProject(projectId: string): Promise<any[]>;
    getCostsByProjectAndCategory(projectId: string): Promise<CostCategoryBreakdown>;
    getCostSummary(projectId: string): Promise<CostSummary>;
    checkDuplicateCostEntry(projectId: string, phaseId: string, employeeId: string, period: Date): Promise<boolean>;
}
declare const _default: CostService;
export default _default;
//# sourceMappingURL=costService.d.ts.map