import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, PhaseName, Role } from '@prisma/client';
import request from 'supertest';
import express from 'express';
import kpiRoutes from '../../src/api/routes/kpiRoutes';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use('/api', kpiRoutes);

describe('KPI Tracking User Journey (Integration Test)', () => {
  let testClient: { id: string };
  let testProject: { id: string; name: string };
  let testPhase: { id: string };
  let testEmployee: { id: string; name: string; email: string };
  let testManager: { id: string; role: string };
  let kpiEntryIds: string[] = [];

  beforeAll(async () => {
    await prisma.kPIEntry.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    testClient = await prisma.client.create({
      data: {
        name: 'Integration Test Client',
        contactEmail: 'integration@example.com',
      },
    });

    testProject = await prisma.project.create({
      data: {
        clientId: testClient.id,
        contractCode: `INT-${Date.now()}`,
        name: 'Integration Test Project',
        contractSigningDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        estimatedEndDate: new Date('2025-12-31'),
        builtUpArea: 2000,
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

    testEmployee = await prisma.user.create({
      data: {
        email: 'employee@example.com',
        name: 'Test Employee',
        role: 'TEAM_MEMBER',
      },
    });

    testManager = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Test Manager',
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
    kpiEntryIds = [];
  });

  describe('Complete KPI Tracking Workflow', () => {
    it('should complete full KPI tracking lifecycle', async () => {
      // Step 1: Manager creates initial KPI entry for employee
      const createResponse1 = await request(app)
        .post('/api/')
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 3,
          clientModifications: 1,
          technicalMistakes: 0,
          period: '2025-01-15',
        });

      expect(createResponse1.status).toBe(201);
      expect(createResponse1.body).toHaveProperty('id');
      expect(createResponse1.body.employeeId).toBe(testEmployee.id);
      expect(createResponse1.body.delayedDays).toBe(3);
      expect(createResponse1.body.clientModifications).toBe(1);
      expect(createResponse1.body.technicalMistakes).toBe(0);
      // Score: 100 - (3*2) - (1*3) - (0*5) = 100 - 6 - 3 = 91
      expect(createResponse1.body.score).toBe(91);
      kpiEntryIds.push(createResponse1.body.id);

      // Step 2: Manager creates second KPI entry
      const createResponse2 = await request(app)
        .post('/api/')
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
          technicalMistakes: 1,
          period: '2025-02-15',
        });

      expect(createResponse2.status).toBe(201);
      kpiEntryIds.push(createResponse2.body.id);

      // Step 3: Manager creates third KPI entry (improvement)
      const createResponse3 = await request(app)
        .post('/api/')
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 0,
          clientModifications: 0,
          technicalMistakes: 0,
          period: '2025-03-15',
        });

      expect(createResponse3.status).toBe(201);
      expect(createResponse3.body.score).toBe(100);
      kpiEntryIds.push(createResponse3.body.id);

      // Step 4: Retrieve all KPI entries for the employee
      const listResponse = await request(app)
        .get(`/api/employee/${testEmployee.id}`)
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(3);
      listResponse.body.forEach((entry: any) => {
        expect(entry.employeeId).toBe(testEmployee.id);
      });

      // Step 5: Filter KPI entries by date range
      const filteredResponse = await request(app)
        .get(`/api/employee/${testEmployee.id}`)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-02-28',
        })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(filteredResponse.status).toBe(200);
      expect(filteredResponse.body).toHaveLength(2);

      // Step 6: Get KPI summary for the employee
      const summaryResponse = await request(app)
        .get('/api/summary')
        .query({
          employeeId: testEmployee.id,
        })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body.employeeId).toBe(testEmployee.id);
      expect(summaryResponse.body.totalKPIs).toBe(3);
      expect(summaryResponse.body.totalDelayedDays).toBe(8);
      expect(summaryResponse.body.totalClientModifications).toBe(3);
      expect(summaryResponse.body.totalTechnicalMistakes).toBe(1);
      expect(summaryResponse.body.averageScore).toBeCloseTo(97.33, 1);

      // Step 7: Get KPI trends over time
      const trendsResponse = await request(app)
        .get('/api/trends')
        .query({
          employeeId: testEmployee.id,
        })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(trendsResponse.status).toBe(200);
      expect(trendsResponse.body).toHaveLength(3);
      expect(trendsResponse.body[0].period).toEqual(new Date('2025-01-15T00:00:00.000Z'));
      expect(trendsResponse.body[1].period).toEqual(new Date('2025-02-15T00:00:00.000Z'));
      expect(trendsResponse.body[2].period).toEqual(new Date('2025-03-15T00:00:00.000Z'));

      // Step 8: Update first KPI entry (correction)
      const updateResponse = await request(app)
        .put(`/api/${kpiEntryIds[0]}`)
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          delayedDays: 2, // Reduced from 3
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.delayedDays).toBe(2);
      // New score: 100 - (2*2) - (1*3) = 100 - 4 - 3 = 93
      expect(updateResponse.body.score).toBe(93);

      // Step 9: Verify update in summary
      const updatedSummaryResponse = await request(app)
        .get('/api/summary')
        .query({
          employeeId: testEmployee.id,
        })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(updatedSummaryResponse.status).toBe(200);
      expect(updatedSummaryResponse.body.totalDelayedDays).toBe(7); // Reduced from 8

      // Step 10: Delete the second KPI entry
      const deleteResponse = await request(app)
        .delete(`/api/${kpiEntryIds[1]}`)
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(deleteResponse.status).toBe(204);

      // Step 11: Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/employee/${testEmployee.id}`)
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveLength(2);

      // Step 12: Final summary check
      const finalSummaryResponse = await request(app)
        .get('/api/summary')
        .query({
          employeeId: testEmployee.id,
        })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(finalSummaryResponse.status).toBe(200);
      expect(finalSummaryResponse.body.totalKPIs).toBe(2);
      expect(finalSummaryResponse.body.averageScore).toBeCloseTo(96.5, 1);
    });
  });

  describe('KPI Tracking with Multiple Employees', () => {
    let employee2: { id: string; email: string };

    beforeAll(async () => {
      employee2 = await prisma.user.create({
        data: {
          email: 'employee2@example.com',
          name: 'Second Employee',
          role: 'TEAM_MEMBER',
        },
      });
    });

    it('should track KPIs for multiple employees independently', async () => {
      // Create KPI entries for first employee
      await request(app)
        .post('/api/')
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          clientModifications: 2,
        });

      // Create KPI entries for second employee
      await request(app)
        .post('/api/')
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          employeeId: employee2.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 1,
          clientModifications: 0,
        });

      // Get KPIs for first employee
      const response1 = await request(app)
        .get(`/api/employee/${testEmployee.id}`)
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(response1.body).toHaveLength(1);
      expect(response1.body[0].employeeId).toBe(testEmployee.id);

      // Get KPIs for second employee
      const response2 = await request(app)
        .get(`/api/employee/${employee2.id}`)
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(response2.body).toHaveLength(1);
      expect(response2.body[0].employeeId).toBe(employee2.id);

      // Get summary for first employee
      const summary1 = await request(app)
        .get('/api/summary')
        .query({ employeeId: testEmployee.id })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(summary1.body.totalKPIs).toBe(1);
      expect(summary1.body.totalDelayedDays).toBe(5);

      // Get summary for second employee
      const summary2 = await request(app)
        .get('/api/summary')
        .query({ employeeId: employee2.id })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(summary2.body.totalKPIs).toBe(1);
      expect(summary2.body.totalDelayedDays).toBe(1);
    });
  });

  describe('KPI Tracking Performance Analysis', () => {
    it('should analyze performance trends over time', async () => {
      // Create KPI entries over several months
      const kpiData = [
        { period: '2025-01-15', delayedDays: 10, clientModifications: 5, technicalMistakes: 2 }, // Poor performance
        { period: '2025-02-15', delayedDays: 7, clientModifications: 3, technicalMistakes: 1 },  // Improving
        { period: '2025-03-15', delayedDays: 3, clientModifications: 1, technicalMistakes: 0 },  // Better
        { period: '2025-04-15', delayedDays: 1, clientModifications: 0, technicalMistakes: 0 },  // Excellent
      ];

      for (const data of kpiData) {
        const response = await request(app)
          .post('/api/')
          .set('X-User-Id', testManager.id)
          .set('X-User-Role', testManager.role)
          .send({
            employeeId: testEmployee.id,
            projectId: testProject.id,
            phaseId: testPhase.id,
            ...data,
          });

        expect(response.status).toBe(201);
        kpiEntryIds.push(response.body.id);
      }

      // Get trends to analyze performance
      const trendsResponse = await request(app)
        .get('/api/trends')
        .query({ employeeId: testEmployee.id })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(trendsResponse.status).toBe(200);
      expect(trendsResponse.body).toHaveLength(4);

      // Verify performance improvement
      expect(trendsResponse.body[0].score).toBeLessThan(trendsResponse.body[3].score);
      expect(trendsResponse.body[0].delayedDays).toBeGreaterThan(trendsResponse.body[3].delayedDays);

      // Get summary for the full period
      const summaryResponse = await request(app)
        .get('/api/summary')
        .query({
          employeeId: testEmployee.id,
          startDate: '2025-01-01',
          endDate: '2025-04-30',
        })
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role);

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body.totalKPIs).toBe(4);
      expect(summaryResponse.body.totalDelayedDays).toBe(21);
      expect(summaryResponse.body.averageScore).toBeGreaterThan(80); // Overall good performance
    });
  });

  describe('Error Handling in KPI Tracking', () => {
    it('should handle invalid employee ID gracefully', async () => {
      const response = await request(app)
        .post('/api/')
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          employeeId: 'non-existent-id',
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        });

      expect(response.status).toBe(500); // Or 404 if service returns 404
    });

    it('should handle invalid date formats', async () => {
      const response = await request(app)
        .post('/api/')
        .set('X-User-Id', testManager.id)
        .set('X-User-Role', testManager.role)
        .send({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
          period: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid period format');
    });

    it('should prevent non-managers from creating KPI entries', async () => {
      const response = await request(app)
        .post('/api/')
        .set('X-User-Id', testEmployee.id)
        .set('X-User-Role', testEmployee.role)
        .send({
          employeeId: testEmployee.id,
          projectId: testProject.id,
          phaseId: testPhase.id,
          delayedDays: 5,
        });

      expect(response.status).toBe(403);
    });
  });
});
