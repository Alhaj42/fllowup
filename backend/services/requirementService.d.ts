import { UserRole, ProjectRequirement } from '@prisma/client';
export interface CreateRequirementInput {
    description: string;
    sortOrder?: number;
}
export interface UpdateRequirementInput {
    description?: string;
    sortOrder?: number;
}
declare class RequirementService {
    private prisma;
    constructor();
    createRequirement(input: CreateRequirementInput, projectId: string, userId: string, userRole: UserRole): Promise<ProjectRequirement>;
    updateRequirement(id: string, input: UpdateRequirementInput, userId: string, userRole: UserRole): Promise<ProjectRequirement>;
    completeRequirement(id: string, isCompleted: boolean, userId: string, userRole: UserRole): Promise<ProjectRequirement>;
    deleteRequirement(id: string, userId: string, userRole: UserRole): Promise<void>;
    getRequirementsByProject(projectId: string): Promise<ProjectRequirement[]>;
}
declare const _default: RequirementService;
export default _default;
//# sourceMappingURL=requirementService.d.ts.map