import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient, ProjectStatus, PhaseStatus, PhaseName, TaskStatus } from '@prisma/client';
import TimelineService from '../../../src/services/timelineService';

const prisma = new PrismaClient();

describe('TimelineService', () => {
  let testClient: { id: string };
  let testProject: { id: string; name: string; startDate: Date; estimatedEndDate: Date };
  let testPhases: Array<{ id: string; name: PhaseName; startDate: Date; estimatedEndDate: Date }>;

  beforeEach(async () => {
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
        contractCode: 'CONTRACT-001',
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
      { id: studiesPhase.id, name: studiesPhase.name, startDate: studiesPhase.startDate, estimatedEndDate: studiesPhase.estimatedEndDate },
      { id: designPhase.id, name: designPhase.name, startDate: designPhase.startDate, estimatedEndDate: designPhase.estimatedEndDate },
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
        {
          phaseId: designPhase.id,
          code: 'T004',
          description: 'Design Task 2',
          duration: 45,
          status: 'PLANNED',
          startDate: new Date('2024-05-02'),
          endDate: new Date('2024-06-14'),
        },
      ],
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.task.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.phase.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  describe('getTimelineData', () => {
    it('should return timeline data for a project', async () => {
      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('phases');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('conflicts');
    });

    it('should include project information in timeline data', async () => {
      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      expect(result.project).toBeDefined();
      expect(result.project.id).toBe(testProject.id);
      expect(result.project.name).toBe(testProject.name);
      expect(result.project.startDate).toEqual(testProject.startDate);
      expect(result.project.estimatedEndDate).toEqual(testProject.estimatedEndDate);
    });

    it('should include all phases with timeline information', async () => {
      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      expect(result.phases).toHaveLength(2);
      expect(result.phases[0]).toHaveProperty('id');
      expect(result.phases[0]).toHaveProperty('name');
      expect(result.phases[0]).toHaveProperty('startDate');
      expect(result.phases[0]).toHaveProperty('estimatedEndDate');
      expect(result.phases[0]).toHaveProperty('status');
      expect(result.phases[0]).toHaveProperty('progress');
    });

    it('should include tasks grouped by phases', async () => {
      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      expect(result.tasks).toBeDefined();
      expect(Array.isArray(result.tasks)).toBe(true);

      const studiesTasks = result.tasks.filter((t: any) => t.phaseName === 'STUDIES');
      const designTasks = result.tasks.filter((t: any) => t.phaseName === 'DESIGN');

      expect(studiesTasks).toHaveLength(2);
      expect(designTasks).toHaveLength(2);
    });

    it('should include task timeline information', async () => {
      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      const firstTask = result.tasks[0];
      expect(firstTask).toHaveProperty('id');
      expect(firstTask).toHaveProperty('code');
      expect(firstTask).toHaveProperty('description');
      expect(firstTask).toHaveProperty('startDate');
      expect(firstTask).toHaveProperty('endDate');
      expect(firstTask).toHaveProperty('status');
      expect(firstTask).toHaveProperty('duration');
    });

    it('should throw error for non-existent project', async () => {
      const service = new TimelineService();

      await expect(service.getTimelineData('non-existent-id')).rejects.toThrow('Project not found');
    });

    it('should calculate phase progress correctly', async () => {
      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      const studiesPhase = result.phases.find((p: any) => p.name === 'STUDIES');
      const designPhase = result.phases.find((p: any) => p.name === 'DESIGN');

      expect(studiesPhase.progress).toBe(100); // All tasks completed
      expect(designPhase.progress).toBe(50); // 1 of 2 tasks completed
    });
  });

  describe('detectConflicts', () => {
    it('should detect overlapping phases', async () => {
      // Create overlapping phases in another project
      const overlapProject = await prisma.project.create({
        data: {
          clientId: testClient.id,
          name: 'Overlap Project',
          contractCode: 'CONTRACT-002',
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 1000,
          startDate: new Date('2024-02-01'),
          estimatedEndDate: new Date('2024-04-01'),
          status: 'IN_PROGRESS',
        },
      });

      await prisma.phase.create({
        data: {
          projectId: overlapProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-15'),
          duration: 60,
          estimatedEndDate: new Date('2024-04-15'),
          status: 'IN_PROGRESS',
        },
      });

      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      expect(result.conflicts).toBeDefined();
      expect(Array.isArray(result.conflicts)).toBe(true);
    });

    it('should identify conflict type and severity', async () => {
      const service = new TimelineService();

      const result = await service.detectConflicts([
        {
          projectId: 'project-1',
          projectName: 'Project 1',
          phaseId: 'phase-1',
          phaseName: 'STUDIES',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-03-15'),
        },
        {
          projectId: 'project-2',
          projectName: 'Project 2',
          phaseId: 'phase-2',
          phaseName: 'STUDIES',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-04-01'),
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('severity');
      expect(result[0]).toHaveProperty('message');
      expect(result[0]).toHaveProperty('projects');
    });

    it('should detect resource conflicts', async () => {
      // Create team members and assign to phases
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          name: 'User 1',
          role: 'TEAM_MEMBER',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: testPhases[0].id,
          teamMemberId: user1.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: testPhases[0].startDate,
          endDate: testPhases[0].estimatedEndDate,
        },
      });

      // Create another project with overlapping phase
      const overlapProject = await prisma.project.create({
        data: {
          clientId: testClient.id,
          name: 'Overlap Project',
          contractCode: 'CONTRACT-002',
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 1000,
          startDate: new Date('2024-02-01'),
          estimatedEndDate: new Date('2024-04-01'),
          status: 'IN_PROGRESS',
        },
      });

      const overlapPhase = await prisma.phase.create({
        data: {
          projectId: overlapProject.id,
          name: 'STUDIES',
          startDate: new Date('2024-02-15'),
          duration: 60,
          estimatedEndDate: new Date('2024-04-15'),
          status: 'IN_PROGRESS',
        },
      });

      await prisma.assignment.create({
        data: {
          phaseId: overlapPhase.id,
          teamMemberId: user1.id,
          role: 'TEAM_MEMBER',
          workingPercentage: 100,
          startDate: overlapPhase.startDate,
          endDate: overlapPhase.estimatedEndDate,
        },
      });

      const service = new TimelineService();
      const result = await service.getTimelineData(testProject.id);

      const resourceConflicts = result.conflicts.filter((c: any) => c.type === 'RESOURCE');
      expect(resourceConflicts.length).toBeGreaterThan(0);
    });

    it('should return empty array when no conflicts exist', async () => {
      const service = new TimelineService();

      const result = await service.detectConflicts([
        {
          projectId: 'project-1',
          projectName: 'Project 1',
          phaseId: 'phase-1',
          phaseName: 'STUDIES',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-03-15'),
        },
        {
          projectId: 'project-2',
          projectName: 'Project 2',
          phaseId: 'phase-2',
          phaseName: 'STUDIES',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-06-01'),
        },
      ]);

      expect(result).toHaveLength(0);
    });
  });

  describe('getCalendarData', () => {
    it('should return calendar data for a date range', async () => {
      const service = new TimelineService();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getCalendarData(startDate, endDate);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('events');
      expect(Array.isArray(result.events)).toBe(true);
    });

    it('should include project events in calendar data', async () => {
      const service = new TimelineService();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getCalendarData(startDate, endDate);

      const projectEvents = result.events.filter((e: any) => e.type === 'PROJECT');
      expect(projectEvents.length).toBeGreaterThan(0);
    });

    it('should include phase events in calendar data', async () => {
      const service = new TimelineService();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getCalendarData(startDate, endDate);

      const phaseEvents = result.events.filter((e: any) => e.type === 'PHASE');
      expect(phaseEvents.length).toBeGreaterThan(0);
    });

    it('should include task milestones in calendar data', async () => {
      const service = new TimelineService();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getCalendarData(startDate, endDate);

      const taskEvents = result.events.filter((e: any) => e.type === 'TASK');
      expect(taskEvents.length).toBeGreaterThan(0);
    });
  });
});
