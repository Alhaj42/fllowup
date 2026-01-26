import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { PrismaClient, TaskStatus, AssignmentRole } from '@prisma/client';

const prisma = new PrismaClient();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'TEAM_LEADER',
};

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
}));

describe('POST /tasks API Contract', () => {
  let testClient: { id: string };
  let testProject: { id: string };
  let testPhase: { id: string };
  let testTeamMember: { id: string };

  beforeAll(async () => {
    setupRoutes();

    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactName: 'Test Contact',
      },
    });
    testClient = client;

    const user = await prisma.user.create({
      data: {
        email: 'teamleader@example.com',
        name: 'Test Team Leader',
        role: 'TEAM_LEADER',
      },
    });

    const teamMember = await prisma.user.create({
      data: {
        email: 'teammember@example.com',
        name: 'Test Team Member',
        role: 'TEAM_MEMBER',
      },
    });
    testTeamMember = teamMember;

    const project = await prisma.project.create({
      data: {
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });
    testProject = project;

    const phase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'STUDIES',
        startDate: new Date('2024-01-15'),
        duration: 60,
        estimatedEndDate: new Date('2024-03-15'),
        status: 'PLANNED',
      },
    });
    testPhase = phase;

    await prisma.assignment.create({
      data: {
        phaseId: testPhase.id,
        teamMemberId: user.id,
        role: 'TEAM_LEADER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
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

  it('should create a task with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Test task description',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('description', 'Test task description');
    expect(response.body).toHaveProperty('duration', 5);
    expect(response.body).toHaveProperty('status', 'PLANNED');
    expect(response.body).toHaveProperty('phaseId', testPhase.id);
    expect(response.body).toHaveProperty('version', 1);
  });

  it('should create task with assigned team member', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-ASSIGNED-${Date.now()}`,
        description: 'Assigned task',
        duration: 7,
        status: 'PLANNED',
        assignedTeamMemberId: testTeamMember.id,
      })
      .expect(201);

    expect(response.body).toHaveProperty('assignedTeamMemberId', testTeamMember.id);
  });

  it('should create task with optional start and end dates', async () => {
    const startDate = new Date('2024-01-20');
    const endDate = new Date('2024-01-25');

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-DATES-${Date.now()}`,
        description: 'Task with dates',
        duration: 10,
        status: 'IN_PROGRESS',
        startDate,
        endDate,
      })
      .expect(201);

    expect(response.body).toHaveProperty('startDate');
    expect(response.body).toHaveProperty('endDate');
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        description: 'Incomplete task',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 if task code already exists in phase', async () => {
    const code = `TASK-DUPLICATE-${Date.now()}`;

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code,
        description: 'First task',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(201);

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code,
        description: 'Second task with same code',
        duration: 6,
        status: 'PLANNED',
      })
      .expect(409);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 404 if phase does not exist', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: 'non-existent-phase-id',
        code: `TASK-${Date.now()}`,
        description: 'Invalid phase task',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('should allow duplicate task codes in different phases', async () => {
    const code = `TASK-DIFFPHASE-${Date.now()}`;

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code,
        description: 'Task in phase 1',
        duration: 3,
        status: 'PLANNED',
      })
      .expect(201);

    const phase2 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'DESIGN',
        startDate: new Date('2024-03-16'),
        duration: 30,
        estimatedEndDate: new Date('2024-04-15'),
        status: 'PLANNED',
      },
    });

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: phase2.id,
        code,
        description: 'Task in phase 2',
        duration: 4,
        status: 'PLANNED',
      })
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.code).toBe(code);
  });

  it('should support all task statuses', async () => {
    const statuses: TaskStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

    for (const status of statuses) {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer test-token`)
        .send({
          phaseId: testPhase.id,
          code: `TASK-${status}-${Date.now()}`,
          description: `${status} task`,
          duration: 5,
          status,
        })
        .expect(201);

      expect(response.body.status).toBe(status);
    }
  });

  it('should validate duration range (0.5 - 365 days)', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-INVALID-${Date.now()}`,
        description: 'Invalid duration task',
        duration: 0,
        status: 'PLANNED',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should validate description length (10 - 500 characters)', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-INVALID-${Date.now()}`,
        description: 'Short',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});
    testClient = client;

    const user = await prisma.user.create({
      data: {
        email: 'teamleader@example.com',
        name: 'Test Team Leader',
        role: 'TEAM_LEADER',
      },
    });
    testUser = user;

    const teamMember = await prisma.user.create({
      data: {
        email: 'teammember@example.com',
        name: 'Test Team Member',
        role: 'TEAM_MEMBER',
      },
    });
    testTeamMember = teamMember;

    const project = await prisma.project.create({
      data: {
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
        status: 'PLANNED',
      },
    });
    testProject = project;

    const phase = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Studies',
        phaseOrder: 1,
        status: 'IN_PROGRESS',
        teamLeaderId: user.id,
      },
    });
    testPhase = phase;

    await prisma.assignment.create({
      data: {
        phaseId: testPhase.id,
        teamMemberId: testTeamMember.id,
        role: 'TEAM_MEMBER',
        workingPercentage: 100,
        startDate: new Date('2024-01-15'),
      },
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

  it('should create a task with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-${Date.now()}`,
        description: 'Test task description',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('description', 'Test task description');
    expect(response.body).toHaveProperty('duration', 5);
    expect(response.body).toHaveProperty('status', 'PLANNED');
    expect(response.body).toHaveProperty('phaseId', testPhase.id);
    expect(response.body).toHaveProperty('version', 1);
  });

  it('should create task with assigned team member', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-ASSIGNED-${Date.now()}`,
        description: 'Assigned task',
        duration: 7,
        status: 'PLANNED',
        assignedTeamMemberId: testTeamMember.id,
      })
      .expect(201);

    expect(response.body).toHaveProperty('assignedTeamMemberId', testTeamMember.id);
  });

  it('should create task with optional start and end dates', async () => {
    const startDate = new Date('2024-01-20');
    const endDate = new Date('2024-01-25');

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-DATES-${Date.now()}`,
        description: 'Task with dates',
        duration: 5,
        status: 'IN_PROGRESS',
        startDate,
        endDate,
      })
      .expect(201);

    expect(response.body).toHaveProperty('startDate');
    expect(response.body).toHaveProperty('endDate');
    expect(new Date(response.body.startDate).toISOString()).toBe(startDate.toISOString());
    expect(new Date(response.body.endDate).toISOString()).toBe(endDate.toISOString());
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        description: 'Incomplete task',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 if task code already exists in phase', async () => {
    const code = `TASK-DUPLICATE-${Date.now()}`;

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code,
        description: 'First task',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(201);

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code,
        description: 'Second task with same code',
        duration: 6,
        status: 'PLANNED',
      })
      .expect(409);

    expect(response.body).toHaveProperty('error', 'Task code already exists in this phase');
  });

  it('should return 404 if phase does not exist', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: 'non-existent-phase-id',
        code: `TASK-${Date.now()}`,
        description: 'Invalid phase task',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Phase not found');
  });

  it('should return 400 if duration is invalid', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code: `TASK-INVALID-${Date.now()}`,
        description: 'Invalid duration task',
        duration: -5,
        status: 'PLANNED',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should allow duplicate task codes in different phases', async () => {
    const code = `TASK-DIFFPHASE-${Date.now()}`;

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: testPhase.id,
        code,
        description: 'Task in phase 1',
        duration: 5,
        status: 'PLANNED',
      })
      .expect(201);

    const phase2 = await prisma.phase.create({
      data: {
        projectId: testProject.id,
        name: 'Design',
        phaseOrder: 2,
        status: 'PLANNED',
      },
    });

    await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer test-token`)
      .send({
        phaseId: phase2.id,
        code,
        description: 'Task in phase 2',
        duration: 6,
        status: 'PLANNED',
      })
      .expect(201);
  });

  it('should support all task statuses', async () => {
    const statuses: TaskStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

    for (const status of statuses) {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer test-token`)
        .send({
          phaseId: testPhase.id,
          code: `TASK-${status}-${Date.now()}`,
          description: `${status} task`,
          duration: 5,
          status,
        })
        .expect(201);

      expect(response.body.status).toBe(status);
    }
  });
});
