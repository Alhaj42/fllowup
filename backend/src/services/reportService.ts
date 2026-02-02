import * as XLSX from 'xlsx';
import logger from '../utils/logger';
import { AuditAction, PrismaClient } from '@prisma/client';
import cacheService from './cacheService';

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

class ReportService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async exportProjectFollowUpReportPDF(projectId: string, userId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        phases: {
          include: {
            tasks: true,
            assignments: {
              include: {
                teamMember: true,
              },
            },
          },
        },
        costEntries: {
          include: {
            phase: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const costSummary = await this.getCostSummary(projectId);

    const phases = project.phases.map((phase: any) => ({
      phaseName: phase.name,
      status: phase.status,
      startDate: phase.startDate,
      endDate: phase.estimatedEndDate,
      progress: this.calculatePhaseProgress(phase),
      taskCount: phase.tasks.length,
      completedTasks: phase.tasks.filter((t: any) => t.status === 'COMPLETED').length,
      teamAssignments: phase.assignments.map((a: any) => ({
        teamMember: a.teamMember.name,
        role: a.role,
        workingPercentage: Number(a.workingPercentage),
      })),
    }));

    const tasks = project.phases.flatMap((phase: any) =>
      phase.tasks.map((t: any) => {
        const assignment = phase.assignments.find((a: any) => a.id === t.assignedTeamMemberId);
        const assignedTo = assignment?.teamMember.name || 'Unassigned';
        const startDate = t.startDate ? new Date(t.startDate).toLocaleDateString() : '';
        const endDate = t.endDate ? new Date(t.endDate).toLocaleDateString() : '';
        const duration =
          startDate && endDate
            ? Math.ceil(
              (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
            )
            : 0;

        return {
          id: t.id,
          phase: phase.name,
          description: t.description,
          assignedTo,
          status: t.status,
          startDate,
          endDate,
          duration,
        };
      })
    );

    const reportData: ProjectFollowUpReport = {
      projectId: project.id,
      projectName: project.name,
      clientName: project.client.name,
      contractCode: project.contractCode,
      startDate: project.startDate,
      estimatedEndDate: project.estimatedEndDate,
      status: project.status,
      phases,
      costSummary,
      tasks,
    };

    await this.logReportGeneration(projectId, userId, 'ProjectFollowUp', 'PDF');

    return reportData;
  }

  async getEmployeeSummaryReport(
    employeeId: string,
    userId: string
  ): Promise<EmployeeSummaryReport> {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        assignments: {
          include: {
            project: {
              phases: true,
            },
          },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const projectSummaries = employee.assignments.map((assignment: any) => {
      const project = assignment.project;
      const projectPhases = project.phases || [];

      return {
        projectId: project.id,
        projectName: project.name,
        contractCode: project.contractCode,
        role: assignment.role,
        workingPercentage: Number(assignment.workingPercentage),
        phases: projectPhases.map((phase: any) => ({
          phaseName: phase.name,
          status: phase.status,
          taskCount: phase.tasks.length,
          completedTasks: phase.tasks.filter((t: any) => t.status === 'COMPLETED').length,
        })),
      };
    });

    const totalAllocation = employee.assignments.reduce(
      (sum: number, a: any) => sum + Number(a.workingPercentage),
      0
    );

    const allProjectIds = employee.assignments.map((a: any) => a.project.id);
    const allCosts = await this.prisma.costEntry.findMany({
      where: {
        projectId: { in: allProjectIds },
      },
      include: {
        phase: true,
      },
    });

    const totalCost = allCosts.reduce((sum: number, c: any) => sum + Number(c.costAmount), 0);

    const reportData: EmployeeSummaryReport = {
      employeeId: employee.id,
      employeeName: employee.name,
      email: employee.email,
      totalProjects: employee.assignments.length,
      totalAllocationPercentage: totalAllocation,
      totalCost,
      projectSummaries,
      generatedAt: new Date(),
      generatedBy: userId,
    };

    await this.logReportGeneration(employeeId, userId, 'EmployeeSummary', 'PDF');

    return reportData;
  }

  async exportEmployeeSummaryReportExcel(employeeId: string, userId: string): Promise<any> {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        assignments: {
          include: {
            project: {
              phases: true,
            },
          },
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ['Employee Name', employee.name],
      ['Email', employee.email],
      ['Position', employee.position || ''],
      ['Role', employee.role],
      ['Total Projects', employee.assignments.length],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    const projectsData = employee.assignments.map((assignment: any, index: number) => {
      const project = assignment.project;
      const projectPhases = project.phases || [];

      const completedTasks = projectPhases
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce(
          (sum: number, p: any) =>
            sum + p.tasks.filter((t: any) => t.status === 'COMPLETED').length,
          0
        );

      return [
        project.name,
        project.contractCode,
        assignment.role,
        `${Number(assignment.workingPercentage)}%`,
        projectPhases.length,
        completedTasks,
      ];
    });

    const projectsSheet = XLSX.utils.aoa_to_sheet([
      ['Project Name', 'Contract Code', 'Role', 'Allocation %', 'Phases', 'Completed Tasks'],
      ...projectsData,
    ]);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Employee Summary');
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Project Assignments');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    logger.info('Excel employee report generated successfully', { employeeId });

    return {
      filename: `${employee.name}-summary-${new Date().toISOString().split('T')[0]}.xlsx`,
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  async getKPISummaryReport(employeeId: string, userId: string): Promise<KPISummaryReport> {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        kpiEntries: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const kpiEntries = employee.kpiEntries || [];

    const delayedTasks = kpiEntries.filter((k: any) => k.delayedDays > 0);
    const clientMods = kpiEntries.filter((k: any) => k.clientModifications > 0);
    const techMistakes = kpiEntries.filter((k: any) => k.technicalMistakes > 0);
    const total = kpiEntries.length;

    const performanceScore =
      total > 0
        ? Math.round(
          ((total - (delayedTasks.length + clientMods.length + techMistakes.length)) / total) *
          100
        )
        : 100;

    const reportData: KPISummaryReport = {
      employeeId: employee.id,
      employeeName: employee.name,
      totalProjects: 0,
      totalAllocationPercentage: 0,
      totalCost: 0,
      delayedTasksCount: delayedTasks.length,
      clientModificationsCount: clientMods.length,
      technicalMistakesCount: techMistakes.length,
      performanceScore,
      generatedAt: new Date(),
      generatedBy: userId,
    };

    await this.logReportGeneration(employeeId, userId, 'KPISummary', 'PDF');

    return reportData;
  }

  async getCostSummary(projectId: string): Promise<CostSummary> {
    const costEntries = await this.prisma.costEntry.findMany({
      where: { projectId },
      include: {
        phase: true,
      },
    });

    const employeeCosts = costEntries.filter((c: any) => c.costType === 'EMPLOYEE_COST');
    const materialCosts = costEntries.filter((c: any) => c.costType === 'MATERIAL_COST');

    const totalCost = costEntries.reduce((sum: number, c: any) => sum + Number(c.costAmount), 0);
    const employeeCostTotal = employeeCosts.reduce(
      (sum: number, c: any) => sum + Number(c.costAmount),
      0
    );
    const materialCostTotal = materialCosts.reduce(
      (sum: number, c: any) => sum + Number(c.costAmount),
      0
    );

    return {
      totalCost,
      employeeCostTotal,
      materialCostTotal,
      totalEntries: costEntries.length,
    };
  }

  private calculatePhaseProgress(phase: any): number {
    if (!phase.tasks || phase.tasks.length === 0) {
      return 0;
    }

    const completedTasks = phase.tasks.filter((t: any) => t.status === 'COMPLETED').length;
    return Math.round((completedTasks / phase.tasks.length) * 100);
  }

  private async logReportGeneration(
    entityId: string,
    userId: string,
    reportType: string,
    format: string
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Report',
        entityId: entityId,
        action: AuditAction.CREATE,
        changedBy: userId,
        timestamp: new Date(),
      },
    });

    logger.info(`Report generated`, { reportType, format, entityId });
  }
}

export default new ReportService();
