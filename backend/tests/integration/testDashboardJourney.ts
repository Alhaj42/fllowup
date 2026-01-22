import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Dashboard User Journey Integration', () => {
  let authToken: string;
  let testClient: { id: string; name: string };
  let testProjects: Array<{ id: string; contractCode: string; status: string; currentPhase: string }>;

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Journey Test Client',
        contactEmail: 'journey@example.com',
      },
    });
    testClient = client;

    const user = await prisma.user.create({
      data: {
        email: 'journey-manager@example.com',
        name: 'Journey Manager',
        role: 'MANAGER',
      },
    });

    authToken = 'test-journey-token';

    for (let i = 0; i < 10; i++) {
      const project = await prisma.project.create({
        data: {
          clientId: testClient.id,
          name: `Journey Project ${i}`,
          contractCode: `JOURNEY-${i.toString().padStart(3, '0')}`,
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 1000 + i * 100,
          startDate: new Date(`2024-0${(i % 3) + 1}-15`),
          estimatedEndDate: new Date(`2024-0${((i % 3) + 3)}-15`),
          currentPhase: i < 3 ? 'STUDIES' : 'DESIGN',
          status: i === 0 ? 'PLANNED' : i === 1 ? 'IN_PROGRESS' : i === 2 ? 'ON_HOLD' : 'COMPLETED',
        },
      });

      testProjects.push({
        id: project.id,
        contractCode: project.contractCode,
        status: project.status,
        currentPhase: project.currentPhase,
      });
    }

    const studiesPhase = await prisma.phase.create({
      data: {
        projectId: testProjects[0].id,
        name: 'STUDIES',
        startDate: new Date('2024-01-15'),
        duration: 30,
      },
    });

    await prisma.task.createMany({
      data: [
        {
          phaseId: studiesPhase.id,
          code: 'TASK-001',
          description: 'Initial design',
          duration: 15,
          status: 'COMPLETED',
        },
        {
          phaseId: studiesPhase.id,
          code: 'TASK-002',
          description: 'Design review',
          duration: 10,
          status: 'IN_PROGRESS',
        },
        {
          phaseId: studiesPhase.id,
          code: 'TASK-003',
          description: 'Final approval',
          duration: 5,
          status: 'PLANNED',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.task.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should load dashboard with authentication', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('projects');
    expect(response.body).toHaveProperty('total');
  });

  it('should display all active projects', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.body.projects.length).toBeGreaterThanOrEqual(5);
    expect(response.body.total).toBe(10);
  });

  it('should filter projects by status', async () => {
    const inProgressResponse = await request(app)
      .get('/api/v1/projects?status=IN_PROGRESS')
      .set('Authorization', `Bearer ${authToken}`);

    expect(inProgressResponse.status).toBe(200);
    expect(inProgressResponse.body.projects).toBeInstanceOf(Array);
    expect(inProgressResponse.body.projects.length).toBe(1);
    expect(inProgressResponse.body.projects[0].status).toBe('IN_PROGRESS');

    const plannedResponse = await request(app)
      .get('/api/v1/projects?status=PLANNED')
      .set('Authorization', `Bearer ${authToken}`);

    expect(plannedResponse.status).toBe(200);
    expect(plannedResponse.body.projects.length).toBe(1);
  });

  it('should navigate to project detail', async () => {
    const projectId = testProjects[0].id;

    const response = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(projectId);
    expect(response.body).toHaveProperty('phases');
    expect(response.body).toHaveProperty('client');
  });

  it('should show project dashboard data', async () => {
    const projectId = testProjects[0].id;

    const response = await request(app)
      .get(`/api/v1/projects/${projectId}/dashboard`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project');
    expect(response.body).toHaveProperty('phases');
    expect(response.body).toHaveProperty('tasks');
    expect(response.body).toHaveProperty('progress');
  });

  it('should display project status indicators', async () => {
    const response = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`);

    response.body.projects.forEach((project: { status: string; currentPhase: string }) => {
      expect(project.status).toBeDefined();
      expect(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED', 'COMPLETED']).toContain(project.status);
      expect(project.currentPhase).toBeDefined();
    });
  });

  it('should show progress information', async () => {
    const projectId = testProjects[0].id;

    const response = await request(app)
      .get(`/api/v1/projects/${projectId}/dashboard`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.body).toHaveProperty('progress');
    expect(typeof response.body.progress).toBe('number');
    expect(response.body.progress).toBeGreaterThanOrEqual(0);
    expect(response.body.progress).toBeLessThanOrEqual(100);
  });

  it('should filter projects by phase', async () => {
    const response = await request(app)
      .get('/api/v1/projects?phase=STUDIES')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    response.body.projects.forEach((project: { currentPhase: string }) => {
      expect(project.currentPhase).toBe('STUDIES');
    });
  });

  it('should support pagination for large datasets', async () => {
    const page1Response = await request(app)
      .get('/api/v1/projects?page=1&limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(page1Response.status).toBe(200);
    expect(page1Response.body.projects).toBeInstanceOf(Array);
    expect(page1Response.body.projects.length).toBeLessThanOrEqual(5);

    const page2Response = await request(app)
      .get('/api/v1/projects?page=2&limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(page2Response.status).toBe(200);
    expect(page2Response.body.projects).toBeInstanceOf(Array);
    expect(page2Response.body.projects.length).toBeLessThanOrEqual(5);

    const allIds = [
      ...page1Response.body.projects.map((p: { id: string }) => p.id),
      ...page2Response.body.projects.map((p: { id: string }) => p.id),
    ];
    expect(new Set(allIds).size).toBeGreaterThan(0);
  });

  it('should handle concurrent project views', async () => {
    const requests = testProjects.slice(0, 5).map(project =>
      request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
    );

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });
  });
});
