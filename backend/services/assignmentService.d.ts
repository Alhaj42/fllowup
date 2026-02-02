import { UserRole, AssignmentRole, Assignment } from '@prisma/client';
export interface CreateAssignmentInput {
    phaseId: string;
    userId: string;
    role: AssignmentRole;
    workingPercent: number;
    startDate: Date;
    endDate?: Date;
}
export interface UpdateAssignmentInput {
    role?: AssignmentRole;
    workingPercent?: number;
    startDate?: Date;
    endDate?: Date;
}
export interface GetTeamAllocationFilter {
    startDate?: string;
    endDate?: string;
    projectId?: string;
}
export interface TeamMemberAllocation {
    userId: string;
    userName: string;
    userEmail: string;
    totalAllocation: number;
    isOverallocated: boolean;
    assignments: Array<{
        id: string;
        phaseId: string;
        projectName: string;
        role: AssignmentRole;
        workingPercent: number;
        startDate: Date;
        endDate: Date | null;
        userEmail: string;
    }>;
}
export interface TeamAllocationSummary {
    totalTeamMembers: number;
    allocatedMembers: number;
    overallocatedMembers: number;
    allocations: TeamMemberAllocation[];
}
declare class AssignmentService {
    private prisma;
    constructor();
    createAssignment(input: CreateAssignmentInput, currentUserId: string, currentUserRole: UserRole): Promise<Assignment>;
    getAssignmentsByPhase(phaseId: string): Promise<Assignment[]>;
    getAssignmentsByTeamMember(userId: string): Promise<Assignment[]>;
    updateAssignment(id: string, input: UpdateAssignmentInput, currentUserId: string, currentUserRole: UserRole): Promise<Assignment>;
    deleteAssignment(id: string, currentUserId: string, currentUserRole: UserRole): Promise<void>;
    getTeamAllocation(filter: GetTeamAllocationFilter): Promise<TeamAllocationSummary>;
    checkOverAllocation(userId: string, newWorkingPercent: number): Promise<{
        isOverallocated: boolean;
        currentAllocation: number;
    }>;
}
declare const _default: AssignmentService;
export default _default;
//# sourceMappingURL=assignmentService.d.ts.map