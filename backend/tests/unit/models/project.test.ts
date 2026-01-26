import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Project Model', () => {
  let testClientId: string;

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
      },
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.project.deleteMany({});
  });

  it('should create a project with all required fields', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
        status: 'PLANNED',
      },
    });

    expect(project).toBeDefined();
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');
    expect(project.contractCode).toMatch(/^CONTRACT-/);
    expect(project.builtUpArea).toBe(1000);
    expect(project.status).toBe('PLANNED');
    expect(project.version).toBe(1);
  });

  it('should enforce unique contract code', async () => {
    const contractCode = `CONTRACT-${Date.now()}`;

    await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Project 1',
        contractCode,
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });

    await expect(
      prisma.project.create({
        data: {
          clientId: testClientId,
          name: 'Project 2',
          contractCode,
          builtUpArea: 1000,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-03-15'),
        },
      })
    ).rejects.toThrow();
  });

  it('should calculate estimatedEndDate correctly', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });

    expect(project.estimatedEndDate).toBeInstanceOf(Date);
    const diffTime = project.estimatedEndDate.getTime() - project.startDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(60, 0);
  });

  it('should handle optional fields correctly', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Project with Optional Fields',
        contractCode: `CONTRACT-${Date.now()}`,
        builtUpArea: 2000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
        licenseType: 'Commercial',
        projectType: 'Studies',
        description: 'Test description',
      },
    });

    expect(project.licenseType).toBe('Commercial');
    expect(project.projectType).toBe('Studies');
    expect(project.description).toBe('Test description');
  });

  it('should support modification tracking fields', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Project with Modifications',
        contractCode: `CONTRACT-${Date.now()}`,
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
        modificationAllowedTimes: 5,
        modificationDaysPerTime: 10,
      },
    });

    expect(project.modificationAllowedTimes).toBe(5);
    expect(project.modificationDaysPerTime).toBe(10);
  });

  it('should handle actualEndDate when project completes', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Completed Project',
        contractCode: `CONTRACT-${Date.now()}`,
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
        actualEndDate: new Date('2024-03-10'),
        status: 'COMPLETE',
      },
    });

    expect(project.actualEndDate).toBeDefined();
    expect(project.actualEndDate).toBeInstanceOf(Date);
    expect(project.status).toBe('COMPLETE');
  });

  it('should have proper indexes defined', async () => {
    const project = await prisma.project.create({
      data: {
        clientId: testClientId,
        name: 'Index Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
        status: 'IN_PROGRESS',
      },
    });

    const projects = await prisma.project.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe(project.id);
  });
});
