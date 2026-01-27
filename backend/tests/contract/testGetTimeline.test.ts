import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, ProjectStatus, PhaseStatus, PhaseName } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'MANAGER',
};

// Mock authentication middleware - always sets user and allows all requests
jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

describe('GET /timeline API Contract', () => {
  let testClient: { id: string };
  let testProject: { id: string; name: string; startDate: Date; estimatedEndDate: Date };
  let testPhases: Array<{ id: string; name: PhaseName }>;

  beforeAll(async () => {
    setupRoutes();

    // Clean up test data
    await prisma.task.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});

    // Create test client
    testClient = await prisma.client.create({
      data: {
        name: 'Test Client',
        email: 'test@example.com',
      },
    });

    // Create test project
    testProject = await prisma.project.create({
      data: {
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: 'CONTRACT-TIMELINE-001',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-06-15'),
        status: 'IN_PROGRESS',
      },
    });

    // Create test phases
    const studiesPhase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'STUDIES',
        startDate: new Date('2024-01-15'),
        duration: 60,
        estimatedEndDate: new Date('2024-03-15'),
        status: 'COMPLETED',
      },
    });

    const designPhase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'DESIGN',
        startDate: new Date('2024-03-16'),
        duration: 90,
        estimatedEndDate: new Date('2024-06-14'),
        status: 'IN_PROGRESS',
      },
    });

    testPhases = [
      { id: studiesPhase.id, name: studiesPhase.name },
      { id: designPhase.id, name: designPhase.name },
    ];

    // Create test tasks
    await prisma.task.createMany({
      data: [
        {
          phaseId: studiesPhase.id,
          code: 'T001',
          description: 'Study Task 1',
          duration: 30,
          status: 'COMPLETED',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-15'),
        },
        {
          phaseId: studiesPhase.id,
          code: 'T002',
          description: 'Study Task 2',
          duration: 30,
          status: 'COMPLETED',
          startDate: new Date('2024-02-16'),
          endDate: new Date('2024-03-15'),
        },
        {
          phaseId: designPhase.id,
          code: 'T003',
          description: 'Design Task 1',
          duration: 45,
          status: 'IN_PROGRESS',
          startDate: new Date('2024-03-16'),
          endDate: new Date('2024-05-01'),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.task.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /timeline (all projects)', () => {
    it('should return 200 with valid authentication', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('phases');
      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('conflicts');
    });

    it('should return projects array', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.projects.length).toBeGreaterThanOrEqual(0);
    });

    it('should include all required project timeline fields', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      if (response.body.projects.length > 0) {
        const project = response.body.projects[0];
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('contractCode');
        expect(project).toHaveProperty('startDate');
        expect(project).toHaveProperty('estimatedEndDate');
        expect(project).toHaveProperty('status');
      }
    });

    it('should return phases array with timeline information', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.body.phases).toBeInstanceOf(Array);
      expect(response.body.phases.length).toBeGreaterThanOrEqual(0);

      if (response.body.phases.length > 0) {
        const phase = response.body.phases[0];
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('projectId');
        expect(phase).toHaveProperty('name');
        expect(phase).toHaveProperty('startDate');
        expect(phase).toHaveProperty('estimatedEndDate');
        expect(phase).toHaveProperty('status');
        expect(phase).toHaveProperty('progress');
      }
    });

    it('should return tasks array grouped by phases', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.body.tasks).toBeInstanceOf(Array);
      expect(response.body.tasks.length).toBeGreaterThanOrEqual(0);

      if (response.body.tasks.length > 0) {
        const task = response.body.tasks[0];
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('phaseId');
        expect(task).toHaveProperty('code');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('startDate');
        expect(task).toHaveProperty('endDate');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('duration');
      }
    });

    it('should return conflicts array', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.body.conflicts).toBeInstanceOf(Array);
      expect(Array.isArray(response.body.conflicts)).toBe(true);
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?startDate=2024-01-01&endDate=2024-06-30')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeInstanceOf(Array);
    });

    it('should support project filtering', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline?projectId=${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeInstanceOf(Array);
      if (response.body.projects.length > 0) {
        expect(response.body.projects[0].id).toBe(testProject.id);
      }
    });

    it('should support status filtering', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?status=IN_PROGRESS')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeInstanceOf(Array);
      response.body.projects.forEach((project: { status: string }) => {
        expect(project.status).toBe('IN_PROGRESS');
      });
    });
  });

  describe('GET /timeline/:projectId (single project)', () => {
    it('should return 200 for valid project ID', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('phases');
      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('conflicts');
    });

    it('should return project details', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.body.project).toBeDefined();
      expect(response.body.project.id).toBe(testProject.id);
      expect(response.body.project.name).toBe(testProject.name);
    });

    it('should return all phases for the project', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.body.phases).toBeInstanceOf(Array);
      expect(response.body.phases.length).toBe(2);
    });

    it('should return all tasks for the project phases', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.body.tasks).toBeInstanceOf(Array);
      expect(response.body.tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/v1/timeline/non-existent-id')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should include phase progress in response', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      response.body.phases.forEach((phase: any) => {
        expect(phase).toHaveProperty('progress');
        expect(typeof phase.progress).toBe('number');
        expect(phase.progress).toBeGreaterThanOrEqual(0);
        expect(phase.progress).toBeLessThanOrEqual(100);
      });
    });

    it('should include task timeline information', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      if (response.body.tasks.length > 0) {
        const task = response.body.tasks[0];
        expect(task).toHaveProperty('startDate');
        expect(task).toHaveProperty('endDate');
        expect(task).toHaveProperty('duration');
      }
    });
  });

  describe('GET /calendar API Contract', () => {
    it('should return 200 with valid authentication', async () => {
      const response = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('events');
    });

    it('should return events array', async () => {
      const response = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.body.events).toBeInstanceOf(Array);
      expect(response.body.events.length).toBeGreaterThanOrEqual(0);
    });

    it('should require date range parameters', async () => {
      const response = await request(app)
        .get('/api/v1/calendar')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should include event type in response', async () => {
      const response = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer test-token');

      if (response.body.events.length > 0) {
        const event = response.body.events[0];
        expect(event).toHaveProperty('type');
        expect(['PROJECT', 'PHASE', 'TASK', 'MILESTONE']).toContain(event.type);
      }
    });

    it('should include event dates', async () => {
      const response = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer test-token');

      if (response.body.events.length > 0) {
        const event = response.body.events[0];
        expect(event).toHaveProperty('startDate');
        expect(event).toHaveProperty('endDate');
      }
    });

    it('should filter events by project ID', async () => {
      const response = await request(app)
        .get(`/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31&projectId=${testProject.id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.events).toBeInstanceOf(Array);
    });

    it('should include event metadata', async () => {
      const response = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer test-token');

      if (response.body.events.length > 0) {
        const event = response.body.events[0];
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('description');
      }
    });
  });

  describe('Error handling', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/timeline');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?startDate=invalid-date')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/timeline/invalid-uuid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
    });
  });
});
