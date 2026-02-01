export interface ModificationRecord {
    id: string;
    projectId: string;
    modificationNumber: number;
    description: string;
    createdAt: Date;
    createdBy: string | null;
}
export interface ModificationStats {
    projectId: string;
    totalAllowed: number;
    totalUsed: number;
    remaining: number;
    daysPerTime: number;
    daysUsed: number;
    canModify: boolean;
    modifications: ModificationRecord[];
}
export interface CreateModificationParams {
    projectId: string;
    userId: string;
    modificationNumber: number;
    description: string;
    daysUsed?: number;
}
declare class ModificationTrackingService {
    createModification(params: CreateModificationParams): Promise<ModificationRecord>;
    getModifications(projectId: string): Promise<ModificationRecord[]>;
    getModificationStats(projectId: string): Promise<ModificationStats>;
    checkModificationLimit(projectId: string): Promise<{
        canModify: boolean;
        remaining: number;
    }>;
    recordModification(projectId: string, userId: string, description: string, daysUsed?: number): Promise<ModificationRecord>;
}
declare const _default: ModificationTrackingService;
export default _default;
//# sourceMappingURL=modificationTrackingService.d.ts.map