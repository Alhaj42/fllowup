import { UserRole, ProjectStatus, PhaseStatus, Project } from '@prisma/client';
export interface CreateProjectInput {
    clientId: string;
    name: string;
    contractCode: string;
    startDate: Date;
    estimatedEndDate: Date;
    builtUpArea?: number;
    licenseType?: string;
    projectType?: string;
    description?: string;
    managerId?: string;
}
export interface UpdateProjectInput {
    name?: string;
    builtUpArea?: number;
    licenseType?: string;
    projectType?: string;
    description?: string;
    startDate?: Date;
    estimatedEndDate?: Date;
    actualEndDate?: Date;
    status?: ProjectStatus;
    version: number;
}
export interface GetProjectsFilter {
    status?: ProjectStatus;
    page?: number;
    limit?: number;
    search?: string;
    clientId?: string;
}
export interface ProjectsResponse {
    projects: Array<Project & {
        clientName: string;
        progress: number;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
declare class ProjectService {
    private prisma;
    constructor();
    createProject(input: CreateProjectInput, userId: string, role: UserRole): Promise<Project>;
    updateProject(id: string, input: UpdateProjectInput, userId: string, role: UserRole): Promise<Project>;
    getProjectById(id: string, userId: string): Promise<Project | null>;
    getProjects(filter: GetProjectsFilter, userId: string): Promise<ProjectsResponse>;
    getProjectDashboard(id: string, userId: string): Promise<{
        project: {
            clientName: any;
            progress: number;
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
        phases: any;
        summary: {
            totalPhases: any;
            totalTasks: any;
            completedTasks: any;
            overallProgress: number;
        };
    }>;
    deleteProject(id: string, userId: string, role: UserRole): Promise<void>;
    private calculatePhaseProgress;
    private calculateProjectProgress;
    createPhases(projectId: string, phaseNames: string[], userId: string, role: UserRole): Promise<any[]>;
    updatePhase(phaseId: string, updates: {
        name?: string;
        status?: PhaseStatus;
        teamLeaderId?: string | null;
    }, userId: string, role: UserRole): Promise<any>;
    deletePhase(phaseId: string, userId: string, role: UserRole): Promise<void>;
    assignTeamLeader(phaseId: string, teamLeaderId: string, userId: string, role: UserRole): Promise<any>;
    removeTeamLeader(phaseId: string, userId: string, role: UserRole): Promise<any>;
    checkPhaseCompletion(phaseId: string): Promise<boolean>;
    completePhase(phaseId: string, userId: string, role: UserRole): Promise<void>;
}
export default ProjectService;
//# sourceMappingURL=projectService.d.ts.map