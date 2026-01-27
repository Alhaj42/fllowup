import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, ProjectStatus, PhaseStatus, PhaseName, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'MANAGER',
};

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

describe('Timeline View User Journey - Integration Test', () => {
  let testClient: { id: string };
  let testProjects: Array<{ id: string; name: string; startDate: Date; estimatedEndDate: Date }>;
  let testUsers: Array<{ id: string; name: string; email: string }>;

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

    // Create test users
    testUsers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'manager@example.com',
          name: 'Test Manager',
          role: 'MANAGER',
        },
      }),
      prisma.user.create({
        data: {
          email: 'leader1@example.com',
          name: 'Team Leader 1',
          role: 'TEAM_LEADER',
        },
      }),
      prisma.user.create({
        data: {
          email: 'member1@example.com',
          name: 'Team Member 1',
          role: 'TEAM_MEMBER',
        },
      }),
    ]);

    // Create multiple test projects with different phases
    testProjects = await Promise.all([
      // Project 1: Active project with phases and tasks
      prisma.project.create({
        data: {
          clientId: testClient.id,
          name: 'Active Project Alpha',
          contractCode: 'TL-001',
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 1000,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-06-15'),
          status: 'IN_PROGRESS',
        },
      }),
      // Project 2: Planned project
      prisma.project.create({
        data: {
          clientId: testClient.id,
          name: 'Planned Project Beta',
          contractCode: 'TL-002',
          contractSigningDate: new Date('2024-02-01'),
          builtUpArea: 1500,
          startDate: new Date('2024-03-01'),
          estimatedEndDate: new Date('2024-08-01'),
          status: 'PLANNED',
        },
      }),
      // Project 3: Completed project
      prisma.project.create({
        data: {
          clientId: testClient.id,
          name: 'Completed Project Gamma',
          contractCode: 'TL-003',
          contractSigningDate: new Date('2023-01-01'),
          builtUpArea: 800,
          startDate: new Date('2023-02-01'),
          estimatedEndDate: new Date('2023-07-01'),
          status: 'COMPLETED',
        },
      }),
    ]);

    // Create phases and tasks for Project 1
    const project1Phases = await Promise.all([
      prisma.phase.create({
        data: {
          projectId: testProjects[0].id,
          name: 'STUDIES',
          startDate: new Date('2024-01-15'),
          duration: 60,
          estimatedEndDate: new Date('2024-03-15'),
          status: 'COMPLETED',
        },
      }),
      prisma.phase.create({
        data: {
          projectId: testProjects[0].id,
          name: 'DESIGN',
          startDate: new Date('2024-03-16'),
          duration: 90,
          estimatedEndDate: new Date('2024-06-14'),
          status: 'IN_PROGRESS',
        },
      }),
    ]);

    // Assign team to phases
    await Promise.all([
      prisma.assignment.create({
        data: {
          phaseId: project1Phases[0].id,
          teamMemberId: testUsers[1].id,
          role: 'TEAM_LEADER',
          workingPercentage: 100,
          startDate: project1Phases[0].startDate,
          endDate: project1Phases[0].estimatedEndDate,
        },
      }),
      prisma.assignment.create({
        data: {
          phaseId: project1Phases[1].id,
          teamMemberId: testUsers[2].id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: project1Phases[1].startDate,
          endDate: project1Phases[1].estimatedEndDate,
        },
      }),
    ]);

    // Create tasks for phases
    await Promise.all([
      // Studies phase tasks
      prisma.task.create({
        data: {
          phaseId: project1Phases[0].id,
          code: 'ST001',
          description: 'Initial Study',
          duration: 20,
          status: 'COMPLETED',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-04'),
          assignedTeamMemberId: testUsers[2].id,
        },
      }),
      prisma.task.create({
        data: {
          phaseId: project1Phases[0].id,
          code: 'ST002',
          description: 'Final Study',
          duration: 40,
          status: 'COMPLETED',
          startDate: new Date('2024-02-05'),
          endDate: new Date('2024-03-15'),
          assignedTeamMemberId: testUsers[2].id,
        },
      }),
      // Design phase tasks
      prisma.task.create({
        data: {
          phaseId: project1Phases[1].id,
          code: 'DS001',
          description: 'Initial Design',
          duration: 30,
          status: 'IN_PROGRESS',
          startDate: new Date('2024-03-16'),
          endDate: new Date('2024-04-15'),
          assignedTeamMemberId: testUsers[2].id,
        },
      }),
      prisma.task.create({
        data: {
          phaseId: project1Phases[1].id,
          code: 'DS002',
          description: 'Final Design',
          duration: 60,
          status: 'PLANNED',
          startDate: new Date('2024-04-16'),
          endDate: new Date('2024-06-14'),
        },
      }),
    ]);

    // Create phases for Project 2 (Planned)
    await Promise.all([
      prisma.phase.create({
        data: {
          projectId: testProjects[1].id,
          name: 'STUDIES',
          startDate: new Date('2024-03-01'),
          duration: 60,
          estimatedEndDate: new Date('2024-05-01'),
          status: 'PLANNED',
        },
      }),
      prisma.phase.create({
        data: {
          projectId: testProjects[1].id,
          name: 'DESIGN',
          startDate: new Date('2024-05-02'),
          duration: 90,
          estimatedEndDate: new Date('2024-08-01'),
          status: 'PLANNED',
        },
      }),
    ]);
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

  describe('Complete Timeline View User Journey', () => {
    it('Step 1: User views all projects timeline', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(3);
      expect(response.body.phases.length).toBeGreaterThan(0);
      expect(response.body.tasks.length).toBeGreaterThan(0);
      expect(Array.isArray(response.body.conflicts)).toBe(true);
    });

    it('Step 2: User views single project timeline in detail', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProjects[0].id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.project.id).toBe(testProjects[0].id);
      expect(response.body.project.name).toBe('Active Project Alpha');
      expect(response.body.phases).toHaveLength(2);
      expect(response.body.tasks).toHaveLength(4);
    });

    it('Step 3: User filters timeline by date range', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?startDate=2024-03-01&endDate=2024-06-30')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeInstanceOf(Array);

      // All projects should be within or overlapping the date range
      response.body.projects.forEach((project: any) => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.estimatedEndDate);
        const rangeStart = new Date('2024-03-01');
        const rangeEnd = new Date('2024-06-30');
        // Projects should overlap with the range or be within it
        const overlaps = projectStart <= rangeEnd && projectEnd >= rangeStart;
        expect(overlaps).toBe(true);
      });
    });

    it('Step 4: User filters timeline by project status', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?status=IN_PROGRESS')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].status).toBe('IN_PROGRESS');
    });

    it('Step 5: User views calendar for the year', async () => {
      const response = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.events).toBeInstanceOf(Array);
      expect(response.body.events.length).toBeGreaterThan(0);
    });

    it('Step 6: User filters calendar by project', async () => {
      const response = await request(app)
        .get(`/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31&projectId=${testProjects[0].id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.events).toBeInstanceOf(Array);

      // All events should belong to the specified project
      response.body.events.forEach((event: any) => {
        expect(event.projectId).toBe(testProjects[0].id);
      });
    });

    it('Step 7: User views project phases with progress', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProjects[0].id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.phases).toHaveLength(2);

      const studiesPhase = response.body.phases.find((p: any) => p.name === 'STUDIES');
      const designPhase = response.body.phases.find((p: any) => p.name === 'DESIGN');

      // Studies phase should be 100% complete (all tasks completed)
      expect(studiesPhase.progress).toBe(100);
      expect(studiesPhase.status).toBe('COMPLETED');

      // Design phase should be 50% complete (1 of 2 tasks completed)
      expect(designPhase.progress).toBe(50);
      expect(designPhase.status).toBe('IN_PROGRESS');
    });

    it('Step 8: User views task timeline with assignments', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProjects[0].id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.tasks).toHaveLength(4);

      // Check tasks have assignment info
      const assignedTasks = response.body.tasks.filter((t: any) => t.assignedTeamMemberId);
      expect(assignedTasks.length).toBeGreaterThan(0);
    });

    it('Step 9: User checks for timeline conflicts', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.conflicts)).toBe(true);

      // Check conflict structure
      if (response.body.conflicts.length > 0) {
        response.body.conflicts.forEach((conflict: any) => {
          expect(conflict).toHaveProperty('type');
          expect(conflict).toHaveProperty('severity');
          expect(conflict).toHaveProperty('message');
          expect(conflict).toHaveProperty('projects');
        });
      }
    });

    it('Step 10: User navigates between different views', async () => {
      // Get all projects timeline
      const allTimelineResponse = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');
      expect(allTimelineResponse.status).toBe(200);

      // Get single project timeline
      const singleTimelineResponse = await request(app)
        .get(`/api/v1/timeline/${testProjects[0].id}`)
        .set('Authorization', 'Bearer test-token');
      expect(singleTimelineResponse.status).toBe(200);

      // Get calendar view
      const calendarResponse = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer test-token');
      expect(calendarResponse.status).toBe(200);

      // Verify data consistency
      expect(allTimelineResponse.body.projects.length).toBeGreaterThanOrEqual(
        singleTimelineResponse.body.projects ? 1 : 0
      );
    });

    it('Step 11: User views planned vs completed phases', async () => {
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);

      const completedPhases = response.body.phases.filter((p: any) => p.status === 'COMPLETED');
      const inProgressPhases = response.body.phases.filter((p: any) => p.status === 'IN_PROGRESS');
      const plannedPhases = response.body.phases.filter((p: any) => p.status === 'PLANNED');

      expect(completedPhases.length).toBeGreaterThan(0);
      expect(inProgressPhases.length).toBeGreaterThan(0);
      expect(plannedPhases.length).toBeGreaterThan(0);

      // Completed phases should have 100% progress
      completedPhases.forEach((phase: any) => {
        expect(phase.progress).toBe(100);
      });
    });

    it('Step 12: User verifies task dependency chain through phases', async () => {
      const response = await request(app)
        .get(`/api/v1/timeline/${testProjects[0].id}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);

      const studiesTasks = response.body.tasks.filter((t: any) => t.phaseName === 'STUDIES');
      const designTasks = response.body.tasks.filter((t: any) => t.phaseName === 'DESIGN');

      // Studies tasks should all be completed before design tasks start
      const studiesMaxEnd = Math.max(...studiesTasks.map((t: any) => new Date(t.endDate).getTime()));
      const designMinStart = Math.min(...designTasks.map((t: any) => new Date(t.startDate).getTime()));

      expect(studiesMaxEnd).toBeLessThanOrEqual(designMinStart);
    });

    it('Step 13: User filters calendar by event type', async () => {
      const response = await request(app)
        .get('/api/v1/calendar?startDate=2024-01-01&endDate=2024-12-31&eventType=PHASE')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.events).toBeInstanceOf(Array);

      // All events should be of type PHASE
      if (response.body.events.length > 0) {
        response.body.events.forEach((event: any) => {
          expect(event.type).toBe('PHASE');
        });
      }
    });

    it('Step 14: User exports timeline data', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?format=json')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('phases');
      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('conflicts');

      // Verify data structure is complete for export
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(Array.isArray(response.body.phases)).toBe(true);
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(Array.isArray(response.body.conflicts)).toBe(true);
    });
  });

  describe('Timeline View Error Handling', () => {
    it('should handle missing date parameters in calendar', async () => {
      const response = await request(app)
        .get('/api/v1/calendar')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid project ID gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/timeline/invalid-uuid-format')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid date format in timeline filter', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?startDate=invalid-date')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty results gracefully', async () => {
      // Create a date range with no projects
      const response = await request(app)
        .get('/api/v1/timeline?startDate=2025-01-01&endDate=2025-12-31')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.projects).toEqual([]);
      expect(response.body.phases).toEqual([]);
      expect(response.body.tasks).toEqual([]);
      expect(response.body.conflicts).toEqual([]);
    });
  });

  describe('Timeline View Performance', () => {
    it('should return timeline data within reasonable time', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/timeline')
        .set('Authorization', 'Bearer test-token');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle pagination for large datasets', async () => {
      const response = await request(app)
        .get('/api/v1/timeline?page=1&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });
  });
});
