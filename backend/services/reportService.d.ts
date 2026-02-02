export interface ProjectFollowUpReport {
    projectId: string;
    projectName: string;
    clientName: string;
    contractCode: string;
    startDate: Date;
    estimatedEndDate: Date;
    status: string;
    phases: Array<{
        phaseName: string;
        status: string;
        startDate: Date;
        endDate: Date | null;
        progress: number;
        teamAssignments: Array<{
            teamMember: string;
            role: string;
            workingPercentage: number;
        }>;
        taskCount: number;
        completedTasks: number;
    }>;
    costSummary: {
        totalCost: number;
        employeeCostTotal: number;
        materialCostTotal: number;
        totalEntries: number;
    };
    tasks: Array<{
        id: string;
        phase: string;
        description: string;
        assignedTo: string;
        status: string;
        startDate: string;
        endDate: string;
        duration: number;
    }>;
}
export interface EmployeeSummaryReport {
    employeeId: string;
    employeeName: string;
    email: string;
    totalProjects: number;
    totalAllocationPercentage: number;
    totalCost: number;
    projectSummaries: Array<{
        projectId: string;
        projectName: string;
        contractCode: string;
        role: string;
        workingPercentage: number;
        phases: Array<{
            phaseName: string;
            status: string;
            taskCount: number;
            completedTasks: number;
        }>;
    }>;
    generatedAt: Date;
    generatedBy: string;
}
export interface KPISummaryReport {
    employeeId: string;
    employeeName: string;
    totalProjects: number;
    totalAllocationPercentage: number;
    totalCost: number;
    delayedTasksCount: number;
    clientModificationsCount: number;
    technicalMistakesCount: number;
    performanceScore: number;
    generatedAt: Date;
    generatedBy: string;
}
export interface CostSummary {
    totalCost: number;
    employeeCostTotal: number;
    materialCostTotal: number;
    totalEntries: number;
}
declare class ReportService {
    private prisma;
    constructor();
    exportProjectFollowUpReportPDF(projectId: string, userId: string): Promise<any>;
    getEmployeeSummaryReport(employeeId: string, userId: string): Promise<EmployeeSummaryReport>;
    exportEmployeeSummaryReportExcel(employeeId: string, userId: string): Promise<any>;
    getKPISummaryReport(employeeId: string, userId: string): Promise<KPISummaryReport>;
    getCostSummary(projectId: string): Promise<CostSummary>;
    private calculatePhaseProgress;
    private logReportGeneration;
}
declare const _default: ReportService;
export default _default;
//# sourceMappingURL=reportService.d.ts.map