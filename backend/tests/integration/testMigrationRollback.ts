import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

describe('Migration Rollback Integration', () => {
  let testClientId: string;

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Rollback Test Client',
        contactEmail: 'rollback@example.com',
      },
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should rollback transaction on validation failure', async () => {
    const initialProjectCount = await prisma.project.count({
      where: { clientId: testClientId },
    });

    try {
      await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            clientId: testClientId,
            name: 'Valid Project',
            contractCode: `CONTRACT-${Date.now()}`,
            contractSigningDate: new Date('2024-01-01'),
            builtUpArea: 1000,
            startDate: new Date('2024-01-15'),
            estimatedEndDate: new Date('2024-03-15'),
          },
        });

        await tx.phase.create({
          data: {
            projectId: project.id,
            name: 'STUDIES',
            startDate: new Date('2024-01-15'),
            duration: 30,
          },
        });

        await tx.user.create({
          data: {
            email: 'duplicate@example.com',
            name: 'Duplicate User',
            role: 'TEAM_MEMBER',
          },
        });

        throw new Error('Validation failed - should rollback');
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    const finalProjectCount = await prisma.project.count({
      where: { clientId: testClientId },
    });

    expect(finalProjectCount).toBe(initialProjectCount);
  });

  it('should rollback transaction on constraint violation', async () => {
    const contractCode = `CONTRACT-${Date.now()}`;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.project.create({
          data: {
            clientId: testClientId,
            name: 'Project 1',
            contractCode,
            contractSigningDate: new Date('2024-01-01'),
            builtUpArea: 1000,
            startDate: new Date('2024-01-15'),
            estimatedEndDate: new Date('2024-03-15'),
          },
        });

        await tx.project.create({
          data: {
            clientId: testClientId,
            name: 'Project 2',
            contractCode,
            contractSigningDate: new Date('2024-01-01'),
            builtUpArea: 2000,
            startDate: new Date('2024-01-20'),
            estimatedEndDate: new Date('2024-04-20'),
          },
        });
      });
    } catch (error) {
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    }

    const projects = await prisma.project.findMany({
      where: { contractCode },
    });

    expect(projects).toHaveLength(0);
  });

  it('should rollback on duplicate email constraint violation', async () => {
    const email = `test${Date.now()}@example.com`;

    await prisma.user.create({
      data: {
        email,
        name: 'User 1',
        role: 'TEAM_MEMBER',
      },
    });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email,
            name: 'User 2',
            role: 'TEAM_MEMBER',
          },
        });

        await tx.user.create({
          data: {
            email: `other${Date.now()}@example.com`,
            name: 'User 3',
            role: 'TEAM_MEMBER',
          },
        });
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    const users = await prisma.user.findMany({
      where: { email },
    });

    expect(users).toHaveLength(1);
  });

  it('should successfully commit valid transaction', async () => {
    const contractCode = `CONTRACT-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          clientId: testClientId,
          name: 'Valid Transaction Project',
          contractCode,
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 1500,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-03-15'),
        },
      });

      await tx.phase.create({
        data: {
          projectId: project.id,
          name: 'STUDIES',
          startDate: new Date('2024-01-15'),
          duration: 30,
        },
      });

      await tx.user.create({
        data: {
          email: `valid${Date.now()}@example.com`,
          name: 'Valid User',
          role: 'TEAM_MEMBER',
        },
      });
    });

    const project = await prisma.project.findUnique({
      where: { contractCode },
      include: {
        phases: true,
      },
    });

    expect(project).toBeDefined();
    expect(project?.phases).toHaveLength(1);
  });

  it('should rollback nested transactions on error', async () => {
    const initialCount = await prisma.project.count();

    try {
      await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            clientId: testClientId,
            name: 'Nested Transaction Project',
            contractCode: `CONTRACT-${Date.now()}`,
            contractSigningDate: new Date('2024-01-01'),
            builtUpArea: 1000,
            startDate: new Date('2024-01-15'),
            estimatedEndDate: new Date('2024-03-15'),
          },
        });

        await tx.phase.create({
          data: {
            projectId: project.id,
            name: 'STUDIES',
            startDate: new Date('2024-01-15'),
            duration: 30,
          },
        });

        await tx.task.create({
          data: {
            phaseId: 'invalid-phase-id',
            code: 'TASK-001',
            description: 'This should fail',
            duration: 15,
          },
        });
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    const finalCount = await prisma.project.count();
    expect(finalCount).toBe(initialCount);
  });

  it('should preserve data isolation during rollback', async () => {
    const contractCode1 = `CONTRACT-${Date.now()}-1`;
    const contractCode2 = `CONTRACT-${Date.now()}-2`;

    await prisma.$transaction(async (tx) => {
      await tx.project.create({
        data: {
          clientId: testClientId,
          name: 'Project 1',
          contractCode: contractCode1,
          contractSigningDate: new Date('2024-01-01'),
          builtUpArea: 1000,
          startDate: new Date('2024-01-15'),
          estimatedEndDate: new Date('2024-03-15'),
        },
      });
    });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.project.create({
          data: {
            clientId: testClientId,
            name: 'Project 2',
            contractCode: contractCode2,
            contractSigningDate: new Date('2024-01-01'),
            builtUpArea: 1000,
            startDate: new Date('2024-01-15'),
            estimatedEndDate: new Date('2024-03-15'),
          },
        });

        throw new Error('Rollback this transaction');
      });
    } catch (error) {
      expect(error).toBeDefined();
    }

    const project1 = await prisma.project.findUnique({
      where: { contractCode: contractCode1 },
    });

    const project2 = await prisma.project.findUnique({
      where: { contractCode: contractCode2 },
    });

    expect(project1).toBeDefined();
    expect(project2).toBeNull();
  });
});
