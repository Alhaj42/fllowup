# Data Model: SaaS Platform

**Feature**: 002-saas-platform
**Date**: 2026-01-23
**Status**: Final

## Overview

This data model supports a full-stack SaaS project management system with three-tier role-based access control (Manager, Team Leader, Team Member) and configurable project phases. The model enforces role permissions at multiple layers (API middleware, service logic, database constraints) and provides comprehensive audit logging for compliance.

## Design Principles

1. **Role-Based Access Control**: Three roles (MANAGER, TEAM_LEADER, TEAM_MEMBER) with hierarchical permissions
2. **Configurable Phases**: Phases are dynamic (initially Studies, Design, Technical) with custom ordering
3. **Optimistic Locking**: Version fields on mutable entities to handle concurrent edits
4. **Audit Trail**: Comprehensive logging of all data changes with user context
5. **Data Integrity**: Foreign key relationships with cascading rules
6. **Performance**: Strategic indexes on frequently queried fields
7. **Extensibility**: Enum-based status fields and configurable reference data

---

## Entities

### User

Represents a system user with authentication and role assignment.

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  role        Role     @default(TEAM_MEMBER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  projectsAsManager  Project[]  @relation("ProjectManager")
  phasesAsLeader    Phase[]     @relation("PhaseLeader")
  assignmentsAsMember Assignment[]
  createdTasks       Task[]      @relation("CreatedBy")
  assignedTasks      Task[]      @relation("AssignedMember")
  auditLogs         AuditLog[]

  @@index([email])
}
```

**Key Attributes**:
- `role`: One of MANAGER, TEAM_LEADER, TEAM_MEMBER
- `email`: Unique identifier for authentication (from Auth0)

**Role-Based Access**:
- **MANAGER**: Can create projects, assign team leaders, manage all phases and tasks
- **TEAM_LEADER**: Can manage tasks and status only for assigned phase(s)
- **TEAM_MEMBER**: Read-only access to all data

---

### Client

Represents a client/customer organization.

```prisma
model Client {
  id        String   @id @default(cuid())
  name      String
  contact   String?
  email     String?
  phone     String?
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  projects Project[]

  @@index([name])
}
```

**Key Attributes**:
- `name`: Client organization name
- `contact`, `email`, `phone`: Client contact information

---

### Project

Represents a project with associated client, phases, and metadata.

```prisma
model Project {
  id               String          @id @default(cuid())
  clientId         String
  contractCode     String          @unique
  name             String
  status           ProjectStatus    @default(PLANNED)
  startDate        DateTime
  estimatedEndDate  DateTime
  actualEndDate    DateTime?
  builtUpArea      Int?
  licenseType      String?
  projectType      String?
  description      String?         @db.Text
  version          Int             @default(1)  // Optimistic locking

  // Relations
  client           Client               @relation(fields: [clientId], references: [id], onDelete: Restrict)
  phases           Phase[]              @relation("ProjectPhases")
  modifications    ProjectModification[]
  requirements     ProjectRequirement[]
  manager          User?                @relation("ProjectManager", fields: [managerId], references: [id])
  managerId        String?              @unique

  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt

  @@index([contractCode])
  @@index([status])
  @@index([startDate, estimatedEndDate])
  @@index([clientId])
  @@map("projects")
}
```

**Key Attributes**:
- `contractCode`: Unique project identifier
- `status`: PLANNED, IN_PROGRESS, ON_HOLD, CANCELLED, COMPLETE
- `version`: Optimistic locking field (incremented on each update)
- `managerId`: Optional direct manager assignment (or derived from phase assignments)

**Role-Based Access**:
- **MANAGER**: Full CRUD access to all projects
- **TEAM_LEADER**: Read-only project details, can manage only assigned phase(s)
- **TEAM_MEMBER**: Read-only project details

**State Transitions**:
```
PLANNED → IN_PROGRESS → (ON_HOLD | COMPLETE | CANCELLED)
ON_HOLD → IN_PROGRESS
```

---

### ProjectModification

Tracks modifications to project scope or requirements.

```prisma
model ProjectModification {
  id          String   @id @default(cuid())
  projectId   String
  description  String   @db.Text
  date        DateTime @default(now())
  version     Int      // Snapshot of project version at modification time

  // Relations
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, date])
  @@map("project_modifications")
}
```

**Key Attributes**:
- `description`: Modification details
- `version`: Project version when modification occurred

---

### ProjectRequirement

Tracks project-specific requirements (e.g., regulatory, technical).

```prisma
model ProjectRequirement {
  id          String   @id @default(cuid())
  projectId   String
  title       String
  description  String?  @db.Text
  priority    String   // LOW, MEDIUM, HIGH, CRITICAL
  status      String   @default("PENDING") // PENDING, APPROVED, REJECTED, IMPLEMENTED
  metAt       DateTime?

  // Relations
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, priority])
  @@map("project_requirements")
}
```

**Key Attributes**:
- `priority`: Requirement importance level
- `status`: Requirement lifecycle status

---

### Phase

Configurable project phase (e.g., Studies, Design, Technical) with team leader assignment.

```prisma
model Phase {
  id            String      @id @default(cuid())
  projectId     String
  name          String      // Configurable phase name
  phaseOrder    Int         // 1, 2, 3... (determines sequence)
  status        PhaseStatus @default(PLANNED)
  startDate     DateTime    @default(now())
  endDate       DateTime?
  version       Int         @default(1)  // Optimistic locking

  // Team Leader: One leader per phase
  teamLeaderId  String?     @unique
  teamLeader    User?       @relation("PhaseLeader", fields: [teamLeaderId], references: [id])

  // Relations
  project       Project      @relation("ProjectPhases", fields: [projectId], references: [id], onDelete: Cascade)
  assignments   Assignment[]
  tasks         Task[]

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@unique([projectId, phaseOrder])
  @@index([projectId, phaseOrder])
  @@index([teamLeaderId])
  @@index([status])
  @@map("phases")
}
```

**Key Attributes**:
- `name`: Configurable phase name (e.g., "Studies", "Design", "Technical")
- `phaseOrder`: Determines sequence (1 = first phase, 2 = second, etc.)
- `status`: PLANNED, IN_PROGRESS, COMPLETE, ON_HOLD, CANCELLED
- `teamLeaderId`: Optional assigned Team Leader (one per phase)

**Role-Based Access**:
- **MANAGER**: Full CRUD access to all phases, can assign team leaders
- **TEAM_LEADER**: Can manage tasks and status only for assigned phase (where `teamLeaderId = user.id`)
- **TEAM_MEMBER**: Read-only phase information

**State Transitions**:
```
PLANNED → IN_PROGRESS → (COMPLETE | ON_HOLD | CANCELLED)
ON_HOLD → IN_PROGRESS
```

**Phase Progression Logic**:
- Phase auto-completes when all tasks have status = COMPLETE
- Next phase auto-starts (PLANNED → IN_PROGRESS) when previous phase completes

---

### Task

Represents work tasks within a phase.

```prisma
model Task {
  id           String     @id @default(cuid())
  phaseId      String
  description  String     @db.Text
  duration     Int        // in days
  status       TaskStatus @default(TODO)
  startDate    DateTime?
  endDate      DateTime?
  version      Int        @default(1)  // Optimistic locking

  // Who created the task
  createdByUserId  String?
  createdBy       User?     @relation("CreatedBy", fields: [createdByUserId], references: [id])

  // Who is assigned (can be different from creator)
  assignedToUserId String?
  assignedToUser   User?     @relation("AssignedMember", fields: [assignedToUserId], references: [id])

  // Which phase this task belongs to
  phase        Phase      @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([phaseId])
  @@index([status])
  @@index([createdByUserId])
  @@index([assignedToUserId])
  @@map("tasks")
}
```

**Key Attributes**:
- `phaseId`: Foreign key to Phase (one phase has many tasks)
- `status`: TODO, IN_PROGRESS, COMPLETE
- `duration`: Task duration in days
- `createdByUserId`: User who created the task (Manager or Team Leader)
- `assignedToUserId`: User assigned to task (can be Team Member)

**Role-Based Access**:
- **MANAGER**: Can create/edit/delete tasks in any phase
- **TEAM_LEADER**: Can create/edit/delete tasks only in assigned phase (where `phase.teamLeaderId = user.id`)
- **TEAM_MEMBER**: Read-only task viewing, cannot modify

**State Transitions**:
```
TODO → IN_PROGRESS → COMPLETE
```

---

### Assignment

Assigns team members to phases with allocation percentage.

```prisma
model Assignment {
  id             String           @id @default(cuid())
  phaseId        String
  userId         String
  role           AssignmentRole   @default(TEAM_MEMBER)
  workingPercent  Int              // 0-100
  startDate      DateTime         @default(now())
  endDate        DateTime?

  // Relations
  phase          Phase    @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@unique([phaseId, userId])
  @@index([userId])
  @@index([phaseId])
  @@map("assignments")
}
```

**Key Attributes**:
- `role`: TEAM_LEADER, TEAM_MEMBER (Note: Team Leaders can also have assignments if they're also team members)
- `workingPercent`: Allocation percentage (0-100), used for over-allocation detection
- `startDate`, `endDate`: Assignment duration

**Role-Based Access**:
- **MANAGER**: Can create/edit/delete all assignments
- **TEAM_LEADER**: Can view assignments for their phase, cannot modify
- **TEAM_MEMBER**: Read-only assignment viewing

**Business Rules**:
- **Over-Allocation Detection**: Sum of `workingPercent` for a user across all active phases should not exceed 100
- **Phase Assignment Validation**: Users can only be assigned to phases where project is IN_PROGRESS

---

### CostEntry

Tracks project costs (employee, material, other).

```prisma
model CostEntry {
  id          String   @id @default(cuid())
  projectId   String
  category    String   // EMPLOYEE, MATERIAL, EQUIPMENT, OVERHEAD
  description String   @db.Text
  amount      Decimal  @db.Decimal(10, 2)
  currency    String   @default("USD")
  date        DateTime @default(now())
  version     Int      @default(1)  // Optimistic locking

  // Relations
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId, date])
  @@index([category])
  @@map("cost_entries")
}
```

**Key Attributes**:
- `category`: Cost categorization
- `amount`: Cost amount with decimal precision
- `currency`: Currency code

**Role-Based Access**:
- **MANAGER**: Full CRUD access to all cost entries
- **TEAM_LEADER**: Read-only cost viewing for their assigned phases
- **TEAM_MEMBER**: Read-only cost viewing

---

### KPIEntry

Tracks employee performance KPIs.

```prisma
model KPIEntry {
  id          String   @id @default(cuid())
  userId      String
  projectId   String?
  phaseId     String?
  type        String   // DELAYED_TASKS, CLIENT_MODIFICATIONS, TECHNICAL_MISTAKES
  description  String   @db.Text
  count       Int      @default(1)
  date        DateTime @default(now())
  version     Int      @default(1)  // Optimistic locking

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  phase       Phase?    @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, date])
  @@index([projectId])
  @@index([phaseId])
  @@index([type])
  @@map("kpi_entries")
}
```

**Key Attributes**:
- `type`: KPI category
- `count`: Quantity of occurrences
- `date`: When KPI was recorded

**Role-Based Access**:
- **MANAGER**: Full CRUD access to all KPI entries
- **TEAM_LEADER**: Read-only KPI viewing for their assigned phases
- **TEAM_MEMBER**: Read-only KPI viewing (their own performance only)

---

### ConfigurationItem

Configurable reference data (e.g., phase names, project types, license types).

```prisma
model ConfigurationItem {
  id          String   @id @default(cuid())
  category    String   // PHASE_NAMES, PROJECT_TYPES, LICENSE_TYPES
  key         String   // Unique key within category
  value       String   @db.Text
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([category, key])
  @@index([category, isActive])
  @@map("configuration_items")
}
```

**Key Attributes**:
- `category`: Configuration category (PHASE_NAMES, PROJECT_TYPES, etc.)
- `key`: Unique identifier within category
- `value`: Configuration value (JSON, comma-separated list, etc.)
- `isActive`: Enable/disable configuration items
- `sortOrder`: Display order

**Default Configuration**:
```json
{
  "PHASE_NAMES": [
    {"key": "phase_1", "value": "Studies", "sortOrder": 1},
    {"key": "phase_2", "value": "Design", "sortOrder": 2},
    {"key": "phase_3", "value": "Technical", "sortOrder": 3}
  ],
  "PROJECT_TYPES": [
    {"key": "type_1", "value": "Residential", "sortOrder": 1},
    {"key": "type_2", "value": "Commercial", "sortOrder": 2}
  ]
}
```

**Role-Based Access**:
- **MANAGER**: Can create/edit/delete configuration items
- **TEAM_LEADER**: Read-only configuration viewing
- **TEAM_MEMBER**: Read-only configuration viewing

---

### AuditLog

Comprehensive audit trail for all data changes.

```prisma
model AuditLog {
  id          String      @id @default(cuid())
  entityType  String      // "Project", "Phase", "Task", "Assignment", etc.
  entityId    String
  action      AuditAction // CREATE, UPDATE, DELETE, STATUS_CHANGE
  userId      String
  role        Role        // Who made the change
  timestamp   DateTime    @default(now())
  details     String?     @db.Text  // JSON or text description

  // Relations
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([entityType, entityId])
  @@index([userId])
  @@index([timestamp])
  @@index([action])
  @@map("audit_logs")
}
```

**Key Attributes**:
- `entityType`: Type of entity changed
- `entityId`: ID of changed entity
- `action`: CREATE, UPDATE, DELETE, STATUS_CHANGE
- `role`: Role of user who made the change
- `details`: Detailed information about the change (old values, new values, etc.)

**Automatic Logging**:
- All CREATE, UPDATE, DELETE operations should trigger audit log entry via Prisma middleware
- STATUS_CHANGE triggered when `status` field changes on Project, Phase, Task

---

## Enums

### Role

```typescript
enum Role {
  MANAGER        // Full access to all resources
  TEAM_LEADER    // Access to assigned phase(s) only
  TEAM_MEMBER    // Read-only access
}
```

### ProjectStatus

```typescript
enum ProjectStatus {
  PLANNED       // Initial state
  IN_PROGRESS    // Active project
  ON_HOLD        // Temporarily paused
  CANCELLED     // Cancelled project
  COMPLETE       // Finished successfully
}
```

### PhaseStatus

```typescript
enum PhaseStatus {
  PLANNED       // Phase not started
  IN_PROGRESS    // Phase active
  COMPLETE       // Phase finished (all tasks complete)
  ON_HOLD        // Phase paused
  CANCELLED      // Phase cancelled
}
```

### TaskStatus

```typescript
enum TaskStatus {
  TODO           // Task not started
  IN_PROGRESS     // Task in progress
  COMPLETE       // Task finished
}
```

### AssignmentRole

```typescript
enum AssignmentRole {
  TEAM_LEADER    // Phase leader (can also have workingPercent)
  TEAM_MEMBER    // Regular team member
}
```

### AuditAction

```typescript
enum AuditAction {
  CREATE          // Entity created
  UPDATE          // Entity modified
  DELETE          // Entity deleted
  STATUS_CHANGE    // Status field changed
}
```

---

## Role-Based Permission Matrix

| Entity          | MANAGER                          | TEAM_LEADER                                   | TEAM_MEMBER      |
|-----------------|----------------------------------|-----------------------------------------------|-----------------|
| **Project**     | CRUD all projects                | Read-only project details                        | Read-only       |
| **Phase**       | CRUD all phases, assign leaders  | Manage assigned phase only                       | Read-only       |
| **Task**        | CRUD all tasks                 | Create/edit/delete tasks in assigned phase only | Read-only       |
| **Assignment**  | CRUD all assignments            | View assignments in assigned phase             | Read-only       |
| **CostEntry**   | CRUD all costs                  | Read-only costs in assigned phase              | Read-only       |
| **KPIEntry**    | CRUD all KPIs                   | Read-only KPIs for assigned phase            | Read-only (own) |
| **Configuration** | CRUD all configuration          | Read-only                                     | Read-only       |

---

## Validation Rules

### Project Validation

1. **Contract Code**: Must be unique across all projects
2. **Dates**: `estimatedEndDate` must be > `startDate`
3. **Status**: Cannot transition from COMPLETE to other states (except archive)

### Phase Validation

1. **Phase Order**: Must be unique within a project (no duplicate phaseOrder values)
2. **Team Leader**: Can only assign one team leader per phase (enforced by `@unique([teamLeaderId])`)
3. **Status**: Can only transition to IN_PROGRESS if previous phase is COMPLETE (enforced in service layer)

### Task Validation

1. **Duration**: Must be > 0 days
2. **Assignment**: Can only assign task to user if user is assigned to the same phase
3. **Status**: Can only mark COMPLETE if previous tasks (if any) are COMPLETE

### Assignment Validation

1. **Over-Allocation**: Sum of `workingPercent` for a user across all active phases ≤ 100
2. **Dates**: `endDate` must be ≥ `startDate`
3. **Project Status**: Cannot assign users to projects with status = CANCELLED or COMPLETE

### Optimistic Locking

**Version-Based Concurrency Control**:
```typescript
// UPDATE operation with version check
const updateProject = async (id: string, updates: Partial<Project>, expectedVersion: number) => {
  const updated = await prisma.project.updateMany({
    where: {
      id,
      version: expectedVersion  // Only update if version matches
    },
    data: {
      ...updates,
      version: { increment: 1 }  // Increment version
    }
  });

  if (updated.count === 0) {
    throw new ConflictError('Project was modified by another user. Please refresh and try again.');
  }

  return updatedProject;
};
```

**409 Conflict Response**:
- If version mismatch, return HTTP 409 Conflict
- Frontend should prompt user to refresh data and retry

---

## Indexing Strategy

| Entity  | Indexed Fields         | Query Pattern Supported                     |
|---------|----------------------|------------------------------------------|
| User    | email                | Authentication lookups                    |
| Project | contractCode          | Unique project lookup                     |
|         | status               | Dashboard filtering by status              |
|         | startDate, endDate   | Timeline/date range queries                |
|         | clientId             | Filter by client                          |
| Phase    | projectId, phaseOrder| Get phases for project in order          |
|         | teamLeaderId         | Find phases led by specific team leader     |
|         | status               | Filter phases by status                    |
| Task     | phaseId              | Get tasks for a phase                    |
|         | status               | Filter tasks by status                    |
|         | createdByUserId      | Find tasks created by user                 |
|         | assignedToUserId     | Find tasks assigned to user                 |
| Assignment| userId              | Get all assignments for a user             |
|         | phaseId              | Get assignments for a phase                |
| CostEntry| projectId, date     | Get costs for project, sorted by date      |
|         | category             | Filter costs by type                      |
| KPIEntry | userId, date         | Get KPIs for user, sorted by date        |
|         | projectId            | Get KPIs for project                    |
|         | phaseId              | Get KPIs for phase                       |
|         | type                 | Filter KPIs by type                      |
| AuditLog | entityType, entityId   | Find all audits for specific entity         |
|         | userId               | Find all changes by user                   |
|         | timestamp            | Get recent audit trail                     |
|         | action               | Filter audit by action type                |

---

## Cascading Rules

| Entity  | Related Entity | On Delete | Rationale                |
|---------|----------------|------------|--------------------------|
| Project | Phase          | CASCADE    | Phases cannot exist without project |
|         | ProjectModification | CASCADE | Modifications tied to project |
|         | ProjectRequirement | CASCADE | Requirements tied to project |
| Phase    | Assignment      | CASCADE    | Assignments tied to phase      |
|         | Task           | CASCADE    | Tasks tied to phase           |
| Task     | N/A            | -          | No dependent entities          |
| Assignment| N/A          | -          | No dependent entities          |
| CostEntry| N/A            | -          | No dependent entities          |
| KPIEntry | N/A            | -          | No dependent entities          |

**Restrict Rules** (to prevent accidental data loss):
- Project.clientId: CASCADE (Client can exist without projects, but projects cannot exist without client)
- Phase.projectId: CASCADE (Phases tied to project)
- Task.phaseId: CASCADE (Tasks tied to phase)

---

## Migration Strategy

### Initial Migration

```prisma
// Initial schema (all entities above)
npx prisma migrate dev --name init_schema
```

### Future Migration Best Practices

1. **Always reversible**: Ensure `down` migration exists
2. **Backward-compatible**: Prefer adding nullable fields over changing existing fields
3. **Data preservation**: Never drop columns without migration script
4. **Version control**: All migrations committed to repository
5. **Testing**: Run migrations on staging before production

### Example Migration

```typescript
// Adding new field to Project
// Migration: add_project_license_type.ts
export const up = async (prisma) => {
  await prisma.$executeRaw`
    ALTER TABLE "projects" ADD COLUMN "licenseType" VARCHAR(255);
  `;
};

export const down = async (prisma) => {
  await prisma.$executeRaw`
    ALTER TABLE "projects" DROP COLUMN "licenseType";
  `;
};
```

---

## Summary

**Total Entities**: 10
**Total Enums**: 6 (Role, ProjectStatus, PhaseStatus, TaskStatus, AssignmentRole, AuditAction)
**Core Entities**: User, Client, Project, Phase, Task
**Supporting Entities**: Assignment, CostEntry, KPIEntry, ProjectModification, ProjectRequirement, ConfigurationItem, AuditLog
**Design Principles**: Role-based access, optimistic locking, audit logging, data integrity, performance optimization
