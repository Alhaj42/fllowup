import { PrismaClient, ProjectRequirement } from '@prisma/client';

const prisma = new PrismaClient();

describe('ProjectRequirement Model', () => {
  let testProject: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'test-requirements@example.com',
        name: 'Test User',
        role: 'MANAGER',
      },
    });

    testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Requirements',
        contractCode: 'REQ-001',
        clientId: 'client-1',
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-12-31'),
        status: 'PLANNED',
        createdBy: testUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.projectRequirement.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Create Operations', () => {
    it('should create a project requirement successfully', async () => {
      const requirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Test requirement 1',
          isCompleted: false,
          sortOrder: 1,
          isModified: false,
        },
      });

      expect(requirement).toBeDefined();
      expect(requirement.id).toBeDefined();
      expect(requirement.projectId).toBe(testProject.id);
      expect(requirement.description).toBe('Test requirement 1');
      expect(requirement.isCompleted).toBe(false);
      expect(requirement.sortOrder).toBe(1);
      expect(requirement.isModified).toBe(false);
    });

    it('should create a completed requirement', async () => {
      const requirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Test completed requirement',
          isCompleted: true,
          completedAt: new Date(),
          completedBy: testUser.id,
          sortOrder: 2,
          isModified: false,
        },
      });

      expect(requirement.isCompleted).toBe(true);
      expect(requirement.completedAt).toBeDefined();
      expect(requirement.completedBy).toBe(testUser.id);
    });

    it('should create a modified requirement', async () => {
      const requirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Modified requirement',
          isModified: true,
          modificationCount: 1,
          sortOrder: 3,
          isCompleted: false,
        },
      });

      expect(requirement.isModified).toBe(true);
      expect(requirement.modificationCount).toBe(1);
    });

    it('should fail to create requirement without description', async () => {
      await expect(
        prisma.projectRequirement.create({
          data: {
            projectId: testProject.id,
            description: '',
            sortOrder: 4,
            isCompleted: false,
            isModified: false,
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should fail to create requirement without projectId', async () => {
      await expect(
        prisma.projectRequirement.create({
          data: {
            projectId: '',
            description: 'Test',
            sortOrder: 5,
            isCompleted: false,
            isModified: false,
          } as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('Update Operations', () => {
    let requirement: ProjectRequirement;

    beforeEach(async () => {
      requirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Requirement to update',
          isCompleted: false,
          sortOrder: 10,
          isModified: false,
        },
      });
    });

    afterEach(async () => {
      await prisma.projectRequirement.delete({ where: { id: requirement.id } });
    });

    it('should update requirement description', async () => {
      const updated = await prisma.projectRequirement.update({
        where: { id: requirement.id },
        data: {
          description: 'Updated description',
        },
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should mark requirement as completed', async () => {
      const updated = await prisma.projectRequirement.update({
        where: { id: requirement.id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          completedBy: testUser.id,
        },
      });

      expect(updated.isCompleted).toBe(true);
      expect(updated.completedAt).toBeDefined();
      expect(updated.completedBy).toBe(testUser.id);
    });

    it('should mark requirement as modified', async () => {
      const updated = await prisma.projectRequirement.update({
        where: { id: requirement.id },
        data: {
          isModified: true,
          modificationCount: { increment: 1 },
        },
      });

      expect(updated.isModified).toBe(true);
      expect(updated.modificationCount).toBe(1);
    });

    it('should update sort order', async () => {
      const updated = await prisma.projectRequirement.update({
        where: { id: requirement.id },
        data: {
          sortOrder: 20,
        },
      });

      expect(updated.sortOrder).toBe(20);
    });
  });

  describe('Read Operations', () => {
    let requirements: ProjectRequirement[];

    beforeEach(async () => {
      requirements = await Promise.all([
        prisma.projectRequirement.create({
          data: {
            projectId: testProject.id,
            description: 'First requirement',
            isCompleted: false,
            sortOrder: 1,
            isModified: false,
          },
        }),
        prisma.projectRequirement.create({
          data: {
            projectId: testProject.id,
            description: 'Second requirement',
            isCompleted: true,
            sortOrder: 2,
            isModified: false,
          },
        }),
        prisma.projectRequirement.create({
          data: {
            projectId: testProject.id,
            description: 'Third requirement',
            isCompleted: false,
            sortOrder: 3,
            isModified: true,
          },
        }),
      ]);
    });

    afterEach(async () => {
      await prisma.projectRequirement.deleteMany({
        where: { projectId: testProject.id },
      });
    });

    it('should find requirement by id', async () => {
      const found = await prisma.projectRequirement.findUnique({
        where: { id: requirements[0].id },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(requirements[0].id);
      expect(found?.description).toBe('First requirement');
    });

    it('should find all requirements for a project', async () => {
      const found = await prisma.projectRequirement.findMany({
        where: { projectId: testProject.id },
        orderBy: { sortOrder: 'asc' },
      });

      expect(found).toHaveLength(3);
      expect(found[0].sortOrder).toBe(1);
      expect(found[1].sortOrder).toBe(2);
      expect(found[2].sortOrder).toBe(3);
    });

    it('should find only completed requirements', async () => {
      const completed = await prisma.projectRequirement.findMany({
        where: {
          projectId: testProject.id,
          isCompleted: true,
        },
      });

      expect(completed).toHaveLength(1);
      expect(completed[0].description).toBe('Second requirement');
    });

    it('should find only modified requirements', async () => {
      const modified = await prisma.projectRequirement.findMany({
        where: {
          projectId: testProject.id,
          isModified: true,
        },
      });

      expect(modified).toHaveLength(1);
      expect(modified[0].description).toBe('Third requirement');
    });
  });

  describe('Delete Operations', () => {
    let requirement: ProjectRequirement;

    beforeEach(async () => {
      requirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Requirement to delete',
          isCompleted: false,
          sortOrder: 1,
          isModified: false,
        },
      });
    });

    it('should delete a requirement', async () => {
      await prisma.projectRequirement.delete({
        where: { id: requirement.id },
      });

      const found = await prisma.projectRequirement.findUnique({
        where: { id: requirement.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('Cascade Operations', () => {
    let requirement: ProjectRequirement;

    beforeEach(async () => {
      requirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Requirement for cascade test',
          isCompleted: false,
          sortOrder: 1,
          isModified: false,
        },
      });
    });

    it('should cascade delete when project is deleted', async () => {
      await prisma.project.delete({
        where: { id: testProject.id },
      });

      const found = await prisma.projectRequirement.findUnique({
        where: { id: requirement.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('Constraints and Validations', () => {
    it('should allow multiple requirements with same description', async () => {
      await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Duplicate description',
          isCompleted: false,
          sortOrder: 100,
          isModified: false,
        },
      });

      await expect(
        prisma.projectRequirement.create({
          data: {
            projectId: testProject.id,
            description: 'Duplicate description',
            isCompleted: false,
            sortOrder: 101,
            isModified: false,
          },
        })
      ).resolves.toBeDefined();
    });

    it('should allow null completedAt when not completed', async () => {
      const requirement = await prisma.projectRequirement.create({
        data: {
          projectId: testProject.id,
          description: 'Incomplete requirement',
          isCompleted: false,
          sortOrder: 200,
          isModified: false,
        },
      });

      expect(requirement.completedAt).toBeNull();
      expect(requirement.completedBy).toBeNull();
    });
  });
});
