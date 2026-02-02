import { UserRole, AssignmentRole, Assignment } from '@prisma/client';
export interface AssignTeamMemberInput {
    phaseId: string;
    teamMemberId: string;
    role: AssignmentRole;
    workingPercentage: number;
    startDate: Date;
    endDate?: Date;
}
export interface UpdateAssignmentInput {
    role?: AssignmentRole;
    workingPercentage?: number;
    startDate?: Date;
    endDate?: Date;
}
export interface AllocationCheckResult {
    isOverallocated: boolean;
    currentAllocation: number;
    proposedAllocation: number;
    warning: string | null;
}
declare class TeamService {
    private prisma;
    constructor();
    /**
     * Assign a team member to a phase with allocation validation
     * @param input Assignment details
     * @param currentUserId ID of user making the change
     * @param currentUserRole UserRole of user making the change
     * @returns Created assignment
     */
    assignTeamMember(input: AssignTeamMemberInput, currentUserId: string, currentUserRole: UserRole): Promise<Assignment>;
    /**
     * Update an existing assignment with allocation validation
     * @param id Assignment ID
     * @param input Fields to update
     * @param currentUserId ID of user making the change
     * @param currentUserRole UserRole of user making the change
     * @returns Updated assignment
     */
    updateAssignment(id: string, input: UpdateAssignmentInput, currentUserId: string, currentUserRole: UserRole): Promise<Assignment>;
    /**
     * Get all assignments for a specific team member
     * @param teamMemberId Team member ID
     * @returns Array of assignments with project details
     */
    getTeamMemberAssignments(teamMemberId: string): Promise<Assignment[]>;
    /**
     * Get all assignments for a specific project across all phases
     * @param projectId Project ID
     * @returns Array of assignments with team member and phase details
     */
    getProjectTeamAssignments(projectId: string): Promise<Assignment[]>;
    /**
     * Check if adding a new allocation would exceed 100%
     * @param teamMemberId Team member ID
     * @param workingPercentage New allocation percentage
     * @returns Allocation check result with warning if overallocated
     */
    checkAllocation(teamMemberId: string, workingPercentage: number): Promise<AllocationCheckResult>;
    /**
     * Remove an assignment
     * @param id Assignment ID
     * @param currentUserId ID of user making the change
     * @param currentUserRole UserRole of user making the change
     */
    removeAssignment(id: string, currentUserId: string, currentUserRole: UserRole): Promise<void>;
    /**
     * Get team workload summary for all team members
     * @param filter Optional filters (projectId, date range)
     * @returns Team workload summary with allocation percentages
     */
    getTeamWorkload(filter?: {
        projectId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{
        teamMemberId: string;
        teamMemberName: string;
        teamMemberEmail: string;
        totalAllocation: number;
        isOverallocated: boolean;
        assignments: Array<{
            id: string;
            projectName: string;
            phaseName: string;
            role: AssignmentRole;
            workingPercentage: number;
            startDate: Date;
            endDate: Date | null;
        }>;
    }>>;
}
declare const _default: TeamService;
export default _default;
//# sourceMappingURL=teamService.d.ts.map