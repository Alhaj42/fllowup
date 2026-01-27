import { prisma } from './prismaClient';
import * as XLSX from 'xlsx';
import logger from '../utils/logger';
import { AuditAction } from '@prisma/client';
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
      teamMemberName: string;
      role: string;
      workingPercentage: number;
    }>;
    taskCount: number;
    completedTasks: number;
  }>;
  costSummary: CostSummary;
  generatedAt: Date;
  generatedBy: string;
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
    role: string;
    workingPercentage: number;
    phases: Array<{
      phaseName: string;
      status: string;
      taskCount: number;
      completedTasks: number;
    }>;
  }>;
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
    this.prisma = prisma;
  }

  async exportProjectFollowUpReportPDF(projectId: string, userId: string): Promise<ProjectFollowUpReport> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        phases: {
          include: {
            assignments: {
              include: {
                teamMember: true
              }
            },
            tasks: true
          },
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const phases = project.phases.map(phase => ({
      phaseName: phase.phaseName,
      status: phase.status,
      startDate: phase.startDate,
      endDate: phase.endDate,
      progress: this.calculatePhaseProgress(phase),
      teamAssignments: phase.assignments.map(assignment => ({
        teamMemberName: assignment.teamMember?.name || 'Unassigned',
        role: assignment.role,
        workingPercentage: Number(assignment.workingPercentage)
      })),
      taskCount: phase.tasks.length,
      completedTasks: phase.tasks.filter(t => t.status === 'COMPLETED').length
    }));

    const costSummary = await this.getCostSummary(projectId);

    const reportData: ProjectFollowUpReport = {
      projectId: project.id,
      projectName: project.name,
      clientName: project.client?.name || 'N/A',
      contractCode: project.contractCode,
      startDate: project.startDate,
      estimatedEndDate: project.estimatedEndDate,
      status: project.status,
      phases,
      costSummary,
      generatedAt: new Date(),
      generatedBy: userId
    };

    await this.logReportGeneration(projectId, userId, 'ProjectFollowUp', 'PDF');

    return reportData;
  }

  async exportProjectFollowUpReportExcel(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        phases: {
          include: {
            assignments: {
              include: {
                teamMember: true
              }
            },
            tasks: true
          },
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // Project Details Sheet
    const projectSheet = workbook.addWorksheet('Project Details');
    projectSheet.cell('A1').value = 'Project Name';
    projectSheet.cell('B1').value = project.name;
    projectSheet.cell('A2').value = 'Client';
    projectSheet.cell('B2').value = project.client?.name || 'N/A';
    projectSheet.cell('A3').value = 'Contract Code';
    projectSheet.cell('B3').value = project.contractCode;
    projectSheet.cell('A4').value = 'Status';
    projectSheet.cell('B4').value = project.status;
    projectSheet.cell('A5').value = 'Start Date';
    projectSheet.cell('B5').value = new Date(project.startDate).toLocaleDateString();
    projectSheet.cell('A6').value = 'Est. End Date';
    projectSheet.cell('B6').value = new Date(project.estimatedEndDate).toLocaleDateString();

    // Phases Sheet
    const phasesSheet = workbook.addWorksheet('Phases');
    const phasesHeader = ['Phase Name', 'Status', 'Start Date', 'End Date', 'Progress', 'Tasks', 'Completed'];

    phasesHeader.forEach((header, index) => {
      const cell = phasesSheet.cell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
    });

    project.phases.forEach((phase, phaseIndex) => {
      const row = phaseIndex + 2;
      phasesSheet.cell(row, 1).value = phase.phaseName;
      phasesSheet.cell(row, 2).value = phase.status;
      phasesSheet.cell(row, 3).value = new Date(phase.startDate).toLocaleDateString();
      phasesSheet.cell(row, 4).value = phase.endDate ? new Date(phase.endDate).toLocaleDateString() : '';
      phasesSheet.cell(row, 5).value = `${this.calculatePhaseProgress(phase)}%`;
      phasesSheet.cell(row, 6).value = phase.tasks.length;
      phasesSheet.cell(row, 7).value = phase.tasks.filter(t => t.status === 'COMPLETED').length;

      // Team Assignments for this phase
      phase.assignments.forEach((assignment, assignIndex) => {
        phasesSheet.cell(row, 8 + assignIndex).value = assignment.teamMember?.name || 'Unassigned';
        phasesSheet.cell(row, 9 + assignIndex).value = assignment.role;
        phasesSheet.cell(row, 10 + assignIndex).value = `${Number(assignment.workingPercentage)}%`;
      });
    });

    // Cost Summary Sheet
    const costs = await this.prisma.costEntry.findMany({
      where: { projectId },
      include: {
        phase: true
      }
    });

    const costSummary = {
      totalCost: costs.reduce((sum, c) => sum + c.amount, 0),
      employeeCostTotal: costs.filter(c => c.type === 'EMPLOYEE').reduce((sum, c) => sum + c.amount, 0),
      materialCostTotal: costs.filter(c => c.type === 'MATERIAL').reduce((sum, c) => sum + c.amount, 0),
      totalEntries: costs.length
    };

    const costSheet = workbook.addWorksheet('Cost Summary');
    costSheet.cell('A1').value = 'Total Cost';
    costSheet.cell('B1').value = costSummary.totalCost;
    costSheet.cell('C1').value = 'Employee Costs';
    costSheet.cell('C2').value = costSummary.employeeCostTotal;
    costSheet.cell('D1').value = 'Material Costs';
    costSheet.cell('D2').value = costSummary.materialCostTotal;
    costSheet.cell('E1').value = 'Total Entries';
    costSheet.cell('E2').value = costSummary.totalEntries;

    // Tasks Sheet
    const tasksSheet = workbook.addWorksheet('Tasks');
    const tasksHeader = ['Task ID', 'Phase', 'Task Description', 'Assigned To', 'Status', 'Start Date', 'End Date', 'Duration (Days)'];

    tasksHeader.forEach((header, index) => {
      const cell = tasksSheet.cell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
    });

    let taskRow = 2;
    project.phases.forEach((phase, phaseIndex) => {
      phase.tasks.forEach((task, taskIndex) => {
        const assignment = phase.assignments.find(a => a.id === task.assignedTeamMemberId);
        const assignedTo = assignment?.teamMember?.name || 'Unassigned';
        const startDate = task.startDate ? new Date(task.startDate).toLocaleDateString() : '';
        const endDate = task.endDate ? new Date(task.endDate).toLocaleDateString() : '';
        const duration = startDate && endDate
          ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        tasksSheet.cell(taskRow, 1).value = task.id;
        tasksSheet.cell(taskRow, 2).value = phase.phaseName;
        tasksSheet.cell(taskRow, 3).value = task.description;
        tasksSheet.cell(taskRow, 4).value = assignedTo;
        tasksSheet.cell(taskRow, 5).value = task.status;
        tasksSheet.cell(taskRow, 6).value = startDate;
        tasksSheet.cell(taskRow, 7).value = endDate;
        tasksSheet.cell(taskRow, 8).value = duration;

        taskRow++;
      });
    });

    // Generate Excel buffer
    const buffer = await XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    logger.info('Excel report generated successfully', { projectId, reportType: 'ProjectFollowUp', workbook: workbook });

    return {
      filename: `${project.name}-followup-${new Date().toISOString().split('T')[0]}.xlsx`,
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  async getEmployeeSummaryReport(employeeId: string, userId: string): Promise<EmployeeSummaryReport> {
    const employee = await this.prisma.teamMember.findUnique({
      where: { id: employeeId },
      include: {
        assignments: {
          include: {
            project: {
              phases: true
            }
          }
        }
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const projectSummaries = employee.assignments.map(assignment => {
      const project = assignment.project;
      const projectPhases = project.phases || [];

      return {
        projectId: project.id,
        projectName: project.name,
        contractCode: project.contractCode,
        role: assignment.role,
        workingPercentage: Number(assignment.workingPercentage),
        phases: projectPhases.map(phase => ({
          phaseName: phase.phaseName,
          status: phase.status,
          taskCount: phase.tasks.length,
          completedTasks: phase.tasks.filter(t => t.status === 'COMPLETED').length
        }))
      };
    });

    const totalAllocation = employee.assignments.reduce((sum, a) => sum + Number(a.workingPercentage), 0);

    // Calculate total cost across all projects
    const allProjectIds = employee.assignments.map(a => a.project.id);
    const allCosts = await this.prisma.costEntry.findMany({
      where: {
        projectId: { in: allProjectIds }
      },
      include: {
        phase: true
      }
    });

    const totalCost = allCosts.reduce((sum, c) => sum + c.amount, 0);

    const reportData: EmployeeSummaryReport = {
      employeeId: employee.id,
      employeeName: employee.name,
      email: employee.email,
      totalProjects: employee.assignments.length,
      totalAllocationPercentage: totalAllocation,
      totalCost,
      projectSummaries,
      generatedAt: new Date(),
      generatedBy: userId
    };

    await this.logReportGeneration(employeeId, userId, 'EmployeeSummary', 'PDF');

    return reportData;
  }

  async exportEmployeeSummaryReportExcel(employeeId: string, userId: string): Promise<void> {
    const employee = await this.prisma.teamMember.findUnique({
      where: { id: employeeId },
      include: {
        assignments: {
          include: {
            project: {
              phases: true
            }
          }
        }
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // Employee Summary Sheet
    const summarySheet = workbook.addWorksheet('Employee Summary');
    summarySheet.cell('A1').value = 'Employee Name';
    summarySheet.cell('B1').value = employee.name;
    summarySheet.cell('C1').value = 'Email';
    summarySheet.cell('D1').value = employee.email;
    summarySheet.cell('E1').value = 'Position';
    summarySheet.cell('F1').value = employee.position;
    summarySheet.cell('G1').value = 'Role';
    summarySheet.cell('H1').value = employee.role;
    summarySheet.cell('A2').value = 'Total Projects';
    summarySheet.cell('B2').value = employee.assignments.length;

    // Project Summaries Sheet
    const projectsSheet = workbook.addWorksheet('Project Assignments');
    const projectsHeader = ['Project Name', 'Contract Code', 'Role', 'Allocation %', 'Phases', 'Completed Tasks'];

    projectsHeader.forEach((header, index) => {
      const cell = projectsSheet.cell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
    });

    employee.assignments.forEach((assignment, index) => {
      const row = index + 2;
      const project = assignment.project;
      const projectPhases = project.phases || [];

      projectsSheet.cell(row, 1).value = project.name;
      projectsSheet.cell(row, 2).value = project.contractCode;
      projectsSheet.cell(row, 3).value = assignment.role;
      projectsSheet.cell(row, 4).value = `${Number(assignment.workingPercentage)}%`;
      projectsSheet.cell(row, 5).value = projectPhases.length;
      projectsSheet.cell(row, 6).value = projectPhases.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETED').length, 0);
    });

    // Generate Excel buffer
    const buffer = await XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    logger.info('Excel employee report generated successfully', { employeeId, workbook: workbook });

    return {
      filename: `${employee.name}-summary-${new Date().toISOString().split('T')[0]}.xlsx`,
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  async getKPISummaryReport(employeeId: string, userId: string): Promise<KPISummaryReport> {
    const employee = await this.prisma.teamMember.findUnique({
      where: { id: employeeId },
      include: {
        kpiEntries: true
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const kpiEntries = employee.kpiEntries || [];

    const delayedTasks = kpiEntries.filter(k => kpi.type === 'DELAYED_TASK');
    const clientMods = kpiEntries.filter(k => kpi.type === 'CLIENT_MODIFICATION');
    const techMistakes = kpiEntries.filter(k => kpi.type === 'TECHNICAL_MISTAKE');
    const total = kpiEntries.length;

    const performanceScore = total > 0
      ? Math.round((total - (delayedTasks.length + clientMods.length + techMistakes.length)) / total * 100)
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
      generatedBy: userId
    };

    await this.logReportGeneration(employeeId, userId, 'KPISummary', 'PDF');

    return reportData;
  }

  async getCostSummary(projectId: string): Promise<CostSummary> {
    const costEntries = await this.prisma.costEntry.findMany({
      where: { projectId },
      include: {
        phase: true
      }
    });

    const employeeCosts = costEntries.filter(c => c.type === 'EMPLOYEE');
    const materialCosts = costEntries.filter(c => c.type === 'MATERIAL');

    const totalCost = costEntries.reduce((sum, c) => sum + c.amount, 0);
    const employeeCostTotal = employeeCosts.reduce((sum, c) => sum + c.amount, 0);
    const materialCostTotal = materialCosts.reduce((sum, c) => sum + c.amount, 0);

    return {
      totalCost,
      employeeCostTotal,
      materialCostTotal,
      totalEntries: costEntries.length
    };
  }

  private calculatePhaseProgress(phase: any): number {
    if (!phase.tasks || phase.tasks.length === 0) {
      return 0;
    }

    const completedTasks = phase.tasks.filter((t: any) => t.status === 'COMPLETED');
    return Math.round((completedTasks.length / phase.tasks.length) * 100);
  }

  private async logReportGeneration(entityId: string, userId: string, reportType: string, format: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Report',
        entityId: entityId,
        action: AuditAction.GENERATE,
        userId,
        details: JSON.stringify({ reportType, format }),
        timestamp: new Date()
      }
    });

    logger.info(`Report generated`, { reportType, format, entityId });
  }

  // Optimized version of getCostSummary with aggregation at database level
  private async getCostSummaryOptimized(projectId: string): Promise<CostSummary> {
    const costAggregations = await this.prisma.costEntry.aggregate({
      where: { projectId },
      _sum: {
        amount: true
      },
      _count: true
    });

    const employeeCostAggregations = await this.prisma.costEntry.aggregate({
      where: { projectId, type: 'EMPLOYEE_COST' },
      _sum: {
        amount: true
      }
    });

    const materialCostAggregations = await this.prisma.costEntry.aggregate({
      where: { projectId, type: 'MATERIAL_COST' },
      _sum: {
        amount: true
      }
    });

    return {
      totalCost: costAggregations._sum.amount || 0,
      employeeCostTotal: employeeCostAggregations._sum.amount || 0,
      materialCostTotal: materialCostAggregations._sum.amount || 0,
      totalEntries: costAggregations._count
    };
  }
}

export const reportService = new ReportService();
