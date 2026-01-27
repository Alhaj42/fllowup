import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, PhaseName, Role } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import kpiRoutes from '../../../src/api/routes/kpiRoutes';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api', kpiRoutes);

describe('POST /kpis endpoint (Contract Test)', () => {
  let testProject: { id: string };
  let testUser: { id: string; email: string };
  let testPhase: { id: string };
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
        contractCode: `KPI-POST-${Date.now()}`,
        name: 'KPI Post Test Project',
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

    testUser = await prisma.user.create({
      data: {
        email: 'kpi-member@example.com',
        name: 'KPI Team Member',
        role: 'TEAM_MEMBER',
      },
    });

    managerUser = await prisma.user.create({
      data: {
        email: 'kpi-manager@example.com',
        name: 'KPI Manager',
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

  describe('POST /kpis', () => {
    it('should create KPI entry with valid data', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
          period: '2025-01-01',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.employeeId).toBe(testUser.id);
      expect(response.body.projectId).toBe(testProject.id);
      expect(response.body.phaseId).toBe(testPhase.id);
      expect(response.body.delayedDays).toBe(5);
      expect(response.body.clientModifications).toBe(2);
      expect(response.body.technicalMistakes).toBe(1);
      expect(response.body.score).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          // Missing phaseId
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for negative delayedDays', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: -5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('delayedDays cannot be negative');
    });

    it('should return 400 for negative clientModifications', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          clientModifications: -2,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('clientModifications cannot be negative');
    });

    it('should return 400 for negative technicalMistakes', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          technicalMistakes: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('technicalMistakes cannot be negative');
    });

    it('should create KPI entry with zero values', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 0,
          clientModifications: 0,
          technicalMistakes: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.delayedDays).toBe(0);
      expect(response.body.clientModifications).toBe(0);
      expect(response.body.technicalMistakes).toBe(0);
      expect(response.body.score).toBe(100);
    });

    it('should create KPI entry without period', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.period).toBeNull();
    });

    it('should auto-calculate score correctly', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
        });

      expect(response.status).toBe(201);
      // Score: 100 - (5*2) - (2*3) - (1*5) = 100 - 10 - 6 - 5 = 79
      expect(response.body.score).toBe(79);
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: 'non-existent-user-id',
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Employee not found');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: 'non-existent-project-id',
          phaseId: testPhase.id,
          delayedDays: 5,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Project not found');
    });

    it('should return 404 for non-existent phase', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: 'non-existent-phase-id',
          delayedDays: 5,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Phase not found');
    });

    it('should return 400 for invalid period format', async () => {
      const response = await request(app)
        .post('/api/kpis')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid period format');
    });
  });

  describe('PUT /kpis/:id', () => {
    let kpiEntryId: string;

    beforeEach(async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
        },
      });
      kpiEntryId = kpiEntry.id;
    });

    it('should update KPI entry successfully', async () => {
      const response = await request(app)
        .put(`/api/kpis/${kpiEntryId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          delayedDays: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.delayedDays).toBe(10);
    });

    it('should update multiple fields', async () => {
      const response = await request(app)
        .put(`/api/kpis/${kpiEntryId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          delayedDays: 8,
          clientModifications: 3,
          technicalMistakes: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.delayedDays).toBe(8);
      expect(response.body.clientModifications).toBe(3);
      expect(response.body.technicalMistakes).toBe(2);
    });

    it('should recalculate score on update', async () => {
      const response = await request(app)
        .put(`/api/kpis/${kpiEntryId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          delayedDays: 2,
          clientModifications: 0,
          technicalMistakes: 0,
        });

      expect(response.status).toBe(200);
      // Score: 100 - (2*2) - (0*3) - (0*5) = 100 - 4 = 96
      expect(response.body.score).toBe(96);
    });

    it('should return 404 for non-existent KPI entry', async () => {
      const response = await request(app)
        .put('/api/kpis/non-existent-id')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          delayedDays: 10,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('KPI entry not found');
    });

    it('should return 400 for negative values on update', async () => {
      const response = await request(app)
        .put(`/api/kpis/${kpiEntryId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role)
        .send({
          delayedDays: -5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('delayedDays cannot be negative');
    });
  });

  describe('DELETE /kpis/:id', () => {
    let kpiEntryId: string;

    beforeEach(async () => {
      const kpiEntry = await prisma.kPIEntry.create({
        data: {
          employeeId: testUser.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        },
      });
      kpiEntryId = kpiEntry.id;
    });

    it('should delete KPI entry successfully', async () => {
      const response = await request(app)
        .delete(`/api/kpis/${kpiEntryId}`)
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(204);

      const deleted = await prisma.kPIEntry.findUnique({
        where: { id: kpiEntryId },
      });

      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent KPI entry', async () => {
      const response = await request(app)
        .delete('/api/kpis/non-existent-id')
        .set('X-User-Id', managerUser.id)
        .set('X-User-Role', managerUser.role);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('KPI entry not found');
    });
  });
});
