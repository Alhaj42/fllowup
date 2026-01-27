import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, PhaseName, Role } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import kpiRoutes from '../../../src/api/routes/kpiRoutes';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api', kpiRoutes);

describe('GET /kpis/employee/:employeeId endpoint (Contract Test)', () => {
  let testProject: { id: string; name: string };
  let testProject2: { id: string; name: string };
  let testUser: { id: string; email: string };
  let testUser2: { id: string; email: string };
  let testPhase: { id: string };
  let testPhase2: { id: string };
  let managerUser: { id: string; role: string };

  beforeAll(async () => {
    await prisma.kPIEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactEmail: 'test@example.com',
      },
    });

    testProject = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `KPI-GET-${Date.now()}`,
        name: 'KPI Get Test Project',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 1000,
      },
    });

    testProject2 = await prisma.project.create({
      data: {
        clientId: client.id,
        contractCode: `KPI-GET-2-${Date.now()}`,
        name: 'KPI Get Test Project 2',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 1000,
      },
    });

    testPhase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: PhaseName.STUDIES,
        startDate: new Date('2025-01-01'),
        duration: 90,
        estimatedEndDate: new Date('2025-04-01'),
        status: 'IN_PROGRESS',
      },
    });

    testPhase2 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: PhaseName.DESIGN,
        startDate: new Date('2025-04-01'),
        duration: 90,
        estimatedEndDate: new Date('2025-07-01'),
        status: 'PLANNED',
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: 'kpi-get-member@example.com',
        name: 'KPI Get Team Member',
        role: 'TEAM_MEMBER',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'kpi-get-member2@example.com',
        name: 'KPI Get Team Member 2',
        role: 'TEAM_MEMBER',
      },
    });

    managerUser = await prisma.user.create({
      data: {
        email: 'kpi-get-manager@example.com',
        name: 'KPI Get Manager',
        role: 'MANAGER',
      },
    });
  });

  afterAll(async () => {
    await prisma.kPIEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.kPIEntry.deleteMany({});
  });

  describe('GET /kpis/employee/:employeeId', () => {
    it('should return empty array for employee with no KPIs', async () => {
      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all KPIs for employee', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: new Date('2025-01-01'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          period: new Date('2025-02-01'),
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].employeeId).toBe(testUser.id);
      expect(response.body[1].employeeId).toBe(testUser.id);
    });

    it('should filter by projectId when provided', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject2.id,
          phaseId: testPhase.id,
          delayedDays: 3,
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .query({ projectId: testProject.id })
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].projectId).toBe(testProject.id);
    });

    it('should filter by phaseId when provided', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase2.id,
          delayedDays: 3,
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .query({ phaseId: testPhase.id })
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].phaseId).toBe(testPhase.id);
    });

    it('should filter by date range when provided', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: new Date('2025-01-15'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          period: new Date('2025-02-15'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 2,
          period: new Date('2025-03-15'),
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-02-28',
        })
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should include employee, project, and phase details', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body[0].employee).toBeDefined();
      expect(response.body[0].project).toBeDefined();
      expect(response.body[0].phase).toBeDefined();
      expect(response.body[0].employee.name).toBe('KPI Get Team Member');
      expect(response.body[0].project.name).toBe('KPI Get Test Project');
      expect(response.body[0].phase.name).toBe(PhaseName.STUDIES);
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .get('/api/kpis/employee/non-existent-user-id')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Employee not found');
    });

    it('should return only KPIs for the specified employee', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser2.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].employeeId).toBe(testUser.id);
    });

    it('should handle multiple filters together', async () => {
      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: new Date('2025-01-15'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase2.id,
          delayedDays: 3,
          period: new Date('2025-02-15'),
        },
      });

      await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 2,
          period: new Date('2025-03-15'),
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .query({
          projectId: testProject.id,
          phaseId: testPhase.id,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].projectId).toBe(testProject.id);
      expect(response.body[0].phaseId).toBe(testPhase.id);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .query({ startDate: 'invalid-date' })
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid date format');
    });

    it('should sort by createdAt in descending order', async () => {
      const firstKPI = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const secondKPI = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
        },
      });

      const response = await request(app)
        .get(`/api/kpis/employee/${testUser.id}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(secondKPI.id);
      expect(response.body[1].id).toBe(firstKPI.id);
    });
  });
});
