import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();

describe('Excel to Database Import Integration', () => {
  let testClientId: string;

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactEmail: 'client@example.com',
      },
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should import projects from Excel to database', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Projects List');

    worksheet.columns = [
      { header: 'Client Name', key: 'clientName' },
      { header: 'Contract Code', key: 'contractCode' },
      { header: 'Contract Signing Date', key: 'contractSigningDate' },
      { header: 'Built-Up Area', key: 'builtUpArea' },
      { header: 'License Type', key: 'licenseType' },
      { header: 'Project Type', key: 'projectType' },
      { header: 'Requirements', key: 'requirements' },
      { header: 'Start Date', key: 'startDate' },
      { header: 'Estimated End Date', key: 'estimatedEndDate' },
    ];

    const contractCode = `CONTRACT-${Date.now()}`;
    worksheet.addRow({
      clientName: 'Test Client',
      contractCode,
      contractSigningDate: '2024-01-01',
      builtUpArea: 1000,
      licenseType: 'Commercial',
      projectType: 'Studies',
      requirements: 'Test requirements',
      startDate: '2024-01-15',
      estimatedEndDate: '2024-03-15',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(parsedWorkbook.Sheets['Projects List']) as Array<Record<string, unknown>>;

    const projectData = data[0];

    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: `${projectData.clientName as string} Project`,
        contractCode: projectData.contractCode as string,
        contractSigningDate: new Date(projectData.contractSigningDate as string),
        builtUpArea: Number(projectData.builtUpArea),
        licenseType: projectData.licenseType as string,
        projectType: projectData.projectType as string,
        requirements: projectData.requirements as string,
        startDate: new Date(projectData.startDate as string),
        estimatedEndDate: new Date(projectData.estimatedEndDate as string),
      },
    });

    expect(project).toBeDefined();
    expect(project.contractCode).toBe(contractCode);
    expect(project.builtUpArea).toBe(1000);
  });

  it('should import users from Excel to database', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Team members Data');

    worksheet.columns = [
      { header: 'Name', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Position', key: 'position' },
      { header: 'Region', key: 'region' },
      { header: 'Grade', key: 'grade' },
      { header: 'Level', key: 'level' },
      { header: 'Monthly Cost', key: 'monthlyCost' },
    ];

    worksheet.addRow({
      name: 'Jane Smith',
      email: 'jane@example.com',
      position: 'Architect',
      region: 'South',
      grade: 'B',
      level: 'Junior',
      monthlyCost: 4000,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(parsedWorkbook.Sheets['Team members Data']) as Array<Record<string, unknown>>;

    const userData = data[0];

    const user = await prisma.user.create({
      data: {
        name: userData.name as string,
        email: userData.email as string,
        role: 'TEAM_MEMBER',
        position: userData.position as string,
        region: userData.region as string,
        grade: userData.grade as string,
        level: userData.level as string,
        monthlyCost: Number(userData.monthlyCost),
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('jane@example.com');
    expect(user.name).toBe('Jane Smith');
    expect(user.position).toBe('Architect');
    expect(user.monthlyCost).toBe(4000);
  });

  it('should import phases and tasks from Excel to database', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Import Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');

    worksheet.columns = [
      { header: 'Project Code', key: 'projectCode' },
      { header: 'Phase', key: 'phase' },
      { header: 'Task Code', key: 'taskCode' },
      { header: 'Description', key: 'description' },
      { header: 'Duration (Days)', key: 'duration' },
    ];

    worksheet.addRow({
      projectCode: project.contractCode,
      phase: 'STUDIES',
      taskCode: 'TASK-001',
      description: 'Initial design review',
      duration: 15,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(parsedWorkbook.Sheets['Tasks']) as Array<Record<string, unknown>>;

    const taskData = data[0];

    const phase = await prisma.phase.create({
      data: {
        projectId: project.id,
        name: taskData.phase as 'STUDIES' | 'DESIGN',
        startDate: new Date('2024-01-15'),
        duration: 30,
      },
    });

    const task = await prisma.task.create({
      data: {
        phaseId: phase.id,
        code: taskData.taskCode as string,
        description: taskData.description as string,
        duration: Number(taskData['Duration (Days)']),
      },
    });

    expect(phase).toBeDefined();
    expect(phase.name).toBe('STUDIES');
    expect(task).toBeDefined();
    expect(task.code).toBe('TASK-001');
    expect(task.duration).toBe(15);
  });

  it('should import cost entries from Excel to database', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Cost Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });

    const phase = await prisma.phase.create({
      data: {
        projectId: project.id,
        name: 'STUDIES',
        startDate: new Date('2024-01-15'),
        duration: 30,
      },
    });

    const user = await prisma.user.create({
      data: {
        name: 'Cost Test User',
        email: `cost${Date.now()}@example.com`,
        role: 'TEAM_MEMBER',
        monthlyCost: 5000,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Project Costs');

    worksheet.columns = [
      { header: 'Project Code', key: 'projectCode' },
      { header: 'Employee Email', key: 'employeeEmail' },
      { header: 'Period', key: 'period' },
      { header: 'Cost Amount', key: 'costAmount' },
    ];

    worksheet.addRow({
      projectCode: project.contractCode,
      employeeEmail: user.email,
      period: '2024-01',
      costAmount: 5000,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(parsedWorkbook.Sheets['Project Costs']) as Array<Record<string, unknown>>;

    const costData = data[0];

    const costEntry = await prisma.costEntry.create({
      data: {
        projectId: project.id,
        phaseId: phase.id,
        employeeId: user.id,
        period: new Date(`${costData.period}-01`),
        costAmount: Number(costData.costAmount),
      },
    });

    expect(costEntry).toBeDefined();
    expect(costEntry.costAmount).toBe(5000);
    expect(costEntry.employeeId).toBe(user.id);
  });

  it('should validate imported data against Excel source', async () => {
    const testContractCode = `CONTRACT-${Date.now()}`;
    const testClientName = 'Validation Test Client';

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Projects List');

    worksheet.columns = [
      { header: 'Client Name', key: 'clientName' },
      { header: 'Contract Code', key: 'contractCode' },
      { header: 'Built-Up Area', key: 'builtUpArea' },
    ];

    worksheet.addRow({
      clientName: testClientName,
      contractCode: testContractCode,
      builtUpArea: 2000,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const excelData = XLSX.utils.sheet_to_json(parsedWorkbook.Sheets['Projects List']) as Array<Record<string, unknown>>;

    const excelRecord = excelData[0];

    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: `${excelRecord.clientName as string} Project`,
        contractCode: excelRecord.contractCode as string,
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: Number(excelRecord.builtUpArea),
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });

    expect(project.builtUpArea).toBe(excelRecord.builtUpArea);
    expect(project.contractCode).toBe(excelRecord.contractCode);
    expect(project.name).toContain(excelRecord.clientName as string);
  });
});
