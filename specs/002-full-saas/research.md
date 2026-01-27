# Research: SaaS Platform

**Feature**: 002-saas-platform
**Date**: 2026-01-23
**Status**: Draft

## Executive Summary

Research completed for SaaS platform project management system with role-based access control (Manager, Team Leader, Team Member) and three project phases (Studies, Design, Technical). All technology choices align with constitution principles and support the required functionality.

---

## Authentication Providers Research

### Options Evaluated

| Provider | OAuth 2.0 | OIDC Support | RBAC Support | Pricing | Documentation | Pros | Cons |
|-----------|-----------|--------------|-----------|--------|-------------|------|------|
| Auth0 | ✅ Yes | ✅ Yes | ✅ Excellent | ✅ Comprehensive | Enterprise-grade, easy RBAC, great docs | Cost at scale, vendor lock-in |
| Keycloak | ✅ Yes | ✅ Yes | ✅ Excellent | ✅ Comprehensive | Self-hosted, fully customizable | Complex setup, maintenance overhead |
| Firebase Auth | ✅ Yes | ⚠️ Limited | ✅ Good | ✅ Good | Easy setup, free tier | Limited RBAC, Google ecosystem |
| AWS Cognito | ✅ Yes | ✅ Yes | ✅ Good | ✅ Good | AWS integrated, scalable | AWS lock-in, complex RBAC |
| Okta | ✅ Yes | ✅ Yes | ✅ Excellent | ✅ Good | Enterprise features | Costly, overkill for small teams |

### Recommendation: Auth0

**Rationale**:
- **Constitution Compliance**: Auth0 recommended in constitution principle V (Security & Compliance)
- **RBAC Support**: Built-in role-based access control (Manager, Team Leader, Team Member)
- **OAuth 2.0/OIDC**: Full support required by constitution
- **Enterprise Ready**: Suitable for design firm with sensitive project data
- **Quick Implementation**: Excellent documentation and SDKs for Node.js and React
- **Scalable**: Can handle 100+ concurrent users

**Implementation Approach**:
- Universal Login page for all users
- Role-based tokens and permissions stored in JWT
- Role claims embedded in ID token for authorization middleware
- Refresh token flow for session management
- Logout functionality with token revocation

**Alternatives Considered**:
- Self-hosted Keycloak rejected due to maintenance overhead for small team
- Firebase rejected due to limited RBAC granularity needed for 3-tier role system
- AWS Cognito rejected due to potential vendor lock-in and complex RBAC setup

---

## Role-Based Authorization Research

### Requirements

1. **Three distinct roles** with hierarchical permissions:
   - **Manager**: Full access to all projects, all phases, all tasks
   - **Team Leader**: Access to one or more assigned phases, can control tasks for assigned phases only
   - **Team Member**: Read-only access to view projects, tasks, phases

2. **Phase-based permissions**: Team Leaders can only access/manage their assigned phase
3. **Project-level permissions**: Managers can see/control all projects, Team Leaders limited to their phase

### Implementation Pattern

```typescript
// Role hierarchy
enum Role {
  MANAGER = 'MANAGER',        // Full access: projects, phases, tasks
  TEAM_LEADER = 'TEAM_LEADER', // Phase-specific access
  TEAM_MEMBER = 'TEAM_MEMBER'    // Read-only: viewing only
}

// Permission matrix
interface Permissions {
  canCreateProjects: boolean;
  canAssignTeamLeaders: boolean;
  canEditProject: (role: Role, phaseId?: string) => boolean;
  canCreateTasks: (role: Role, phaseId: string) => boolean;
  canDeleteTasks: (role: Role, phaseId: string) => boolean;
  canViewTasks: boolean;  // All roles can view tasks
}

// Permission check examples
const permissions: Permissions = {
  MANAGER: {
    canCreateProjects: true,
    canAssignTeamLeaders: true,
    canEditProject: () => true,  // Can edit ANY project
    canCreateTasks: () => true,  // Can create tasks in ANY phase
    canDeleteTasks: () => true,  // Can delete tasks in ANY phase
    canViewTasks: true,
  },
  TEAM_LEADER: {
    canCreateProjects: false,
    canAssignTeamLeaders: false,
    canEditProject: (role, phaseId) => phaseId === assignedPhaseId,
    canCreateTasks: (role, phaseId) => phaseId === assignedPhaseId,
    canDeleteTasks: (role, phaseId) => phaseId === assignedPhaseId,
    canViewTasks: true,
  },
  TEAM_MEMBER: {
    canCreateProjects: false,
    canAssignTeamLeaders: false,
    canEditProject: () => false,  // Read-only
    canCreateTasks: () => false,  // Read-only
    canDeleteTasks: () => false,  // Read-only
    canViewTasks: true,  // Can view but not modify
  },
};
```

### Best Practices

- **Middleware Authorization**: Check role at API boundary layer
- **Row-Level Security**: Database constraints for read-only users (Team Members)
- **Audit Logging**: Log all permission denials with role, action, resource
- **Explicit UI Controls**: Hide/disable controls based on user role
- **Phase Validation**: Ensure Team Leaders can't access other phases

**Alternatives Considered**:
- Attribute-based access control (ABAC) rejected as too complex for 3-tier system
- Rule-based access control (RBAC) chosen for clarity and maintainability

---

## Phase-Based Task Management Research

### Requirements

1. **Configurable phases**: Initial set (Studies, Design, Technical) but expandable via admin
2. **Phase progression**: Sequential based on phase order (1, 2, 3...)
3. **Role-specific control**: Team Leaders control tasks in their assigned phase(s) only
4. **Task dependencies**: Tasks can depend on other tasks within same phase
5. **Progress tracking**: Phase completion based on task completion percentage

### Data Model Considerations

```prisma
model Phase {
  id        String   @id
  projectId  String
  name       String   // Configurable name
  phaseOrder Int      // 1, 2, 3... (determines sequence)
  status     PhaseStatus // PLANNED, IN_PROGRESS, COMPLETE, ON_HOLD
  startDate  DateTime
  endDate    DateTime?
  
  // Team Leader assignment (one per phase)
  teamLeaderId String? @relation(fields: [teamLeader], references: [User])
  
  // Team member assignments (multiple)
  assignments  Assignment[] @relation(fields: [phase])
  
  // Tasks (belong to phase)
  tasks       Task[]      @relation(fields: [phase])
  
  // Role-specific permissions enforced at service layer
  @@map("phase_role_permissions", (phase) => ({
    canManage: (userRole, userId) => 
      // Manager: can manage all phases
      // Team Leader: can manage only if assigned to this phase
      // Team Member: cannot manage (read-only)
  }))
}

model Task {
  id          String
  phaseId     String  @relation(fields: [phase])
  description  String
  duration    Int      // in days
  status      TaskStatus
  startDate   DateTime?
  endDate     DateTime?
  assignedTo  String?  @relation(fields: [assignedMember])
  
  // Role-based creation/deletion permissions
  @@map("task_role_permissions", (task, userRole, userPhaseAssignments) => ({
    canCreate: (userRole) =>
      // Manager: can create in any phase
      // Team Leader: can create only in their assigned phase
      // Team Member: cannot create
    canDelete: (userRole) =>
      // Manager: can delete in any phase
      // Team Leader: can delete only in their assigned phase
      // Team Member: cannot delete
  }))
}
```

### Phase Progression Logic

```typescript
// Automatic phase transition when tasks complete
const checkPhaseCompletion = (phase: Phase): boolean => {
  const completedTasks = phase.tasks.filter(t => t.status === 'COMPLETE').length;
  const totalTasks = phase.tasks.length;
  const progress = completedTasks / totalTasks;
  
  return progress >= 1.0; // 100% complete
};

const transitionToNextPhase = async (currentPhase: Phase): Promise<void> => {
  // Validate: Current phase complete?
  if (!checkPhaseCompletion(currentPhase)) {
    throw new Error('Cannot transition: phase not complete');
  }
  
  // Get next phase by phaseOrder (dynamic)
  const nextPhase = await prisma.phase.findFirst({
    where: {
      projectId: currentPhase.projectId,
      phaseOrder: currentPhase.phaseOrder + 1,
    },
  });
  
  if (nextPhase) {
    await prisma.phase.update({
      where: { id: currentPhase.id },
      data: { status: 'COMPLETE', endDate: new Date() },
    });
    
    await prisma.phase.update({
      where: { id: nextPhase.id },
      data: { status: 'IN_PROGRESS', startDate: new Date() },
    });
  }
};
```

### Best Practices

- **Service-Layer Validation**: Enforce role permissions in business logic, not just database
- **Explicit Phase Constants**: Use enum or constants for phase names ("Studies", "Design", "Technical")
- **Phase Order Tracking**: Store phase order (1, 2, 3) for transitions
- **Task Grouping**: Tasks belong to phases for scoped access control
- **Progress Calculation**: Automatic based on task completion, not manual
- **Audit Trail**: Log phase transitions with user, timestamp, reason

**Alternatives Considered**:
- Dynamic phases selected for extensibility
- Hardcoded phases rejected to allow future growth without code changes
- Parallel phases rejected as project management requires sequential workflow

---

## UI Patterns for Role-Based Access Control

### Requirements

1. **Different UI controls** based on user role
2. **Hide/disable controls** that user doesn't have permission for
3. **Visual feedback** for permission denials
4. **Clear role indicators** in interface (e.g., "You are viewing as Team Member")

### UI Control Matrix

| Feature | Manager | Team Leader | Team Member |
|----------|---------|-------------|-------------|
| Create Project | ✅ Shown | ❌ Hidden | ❌ Hidden |
| Assign Team Leader | ✅ Shown (all 3 phases) | ❌ Hidden | ❌ Hidden |
| Create Task | ✅ Shown (any phase) | ✅ Shown (assigned phase only) | ❌ Hidden |
| Edit Task | ✅ Shown (any phase) | ✅ Shown (assigned phase only) | ❌ Hidden |
| Delete Task | ✅ Shown (any phase) | ✅ Shown (assigned phase only) | ❌ Hidden |
| Change Phase Status | ✅ Shown (any phase) | ✅ Shown (assigned phase only) | ❌ Hidden |
| Edit Project | ✅ Shown (any project) | ❌ Hidden | ❌ Hidden (read-only) |
| Delete Project | ✅ Shown | ❌ Hidden | ❌ Hidden |
| View Projects | ✅ Shown | ✅ Shown | ✅ Shown |
| View Tasks | ✅ Shown | ✅ Shown | ✅ Shown (read-only) |

### React Component Patterns

```typescript
// Role-aware wrapper components
interface RoleAwareProps {
  userRole: Role;
  userAssignedPhaseId?: string;  // For Team Leaders
}

// ProjectCard with role controls
const ProjectCard: React.FC<Project & RoleAwareProps> = ({ project, userRole, userAssignedPhaseId }) => {
  const canEdit = userRole === 'MANAGER' || 
                   (userRole === 'TEAM_LEADER' && userAssignedPhaseId === project.currentPhaseId);
  
  return (
    <Card>
      {/* Project details visible to all */}
      <ProjectInfo project={project} />
      
      {/* Edit/delete controls: Manager only */}
      {userRole === 'MANAGER' && (
        <ProjectActions project={project} />
      )}
      
      {/* Phase status change: Manager or assigned Team Leader */}
      {canEdit && (
        <PhaseStatusControl project={project} />
      )}
    </Card>
  );
};

// TaskList with role controls
const TaskList: React.FC<TaskListProps & RoleAwareProps> = ({ 
  phase, 
  userRole, 
  userAssignedPhaseId,
  tasks,
  onTaskUpdate 
}) => {
  const canManageTasks = userRole === 'MANAGER' || 
                         (userRole === 'TEAM_LEADER' && userAssignedPhaseId === phase.id);
  
  return (
    <div>
      {/* Tasks visible to all roles */}
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} canEdit={canManageTasks} />
      ))}
      
      {/* Add task button: Manager or assigned Team Leader */}
      {canManageTasks && (
        <AddTaskButton phaseId={phase.id} />
      )}
      
      {/* Read-only indicator for Team Members */}
      {userRole === 'TEAM_MEMBER' && (
        <ReadOnlyIndicator message="You are viewing in read-only mode" />
      )}
    </div>
  );
};

// Dynamic phase assignment selector
const PhaseSelector: React.FC<PhaseSelectorProps> = ({ 
  project, 
  userRole,
  activePhases, // Fetched from configuration
  availableTeamLeaders,
  onPhaseLeaderAssign 
}) => {
  const canAssign = userRole === 'MANAGER';
  
  return (
    <Grid container spacing={2}>
      {activePhases.map(phase => (
        <Grid item key={phase.name}>
          <PhaseCard 
            phaseName={phase.name}
            canAssignTeamLeader={canAssign}
            assignedTeamLeader={project.teamLeaders[phase.id]}
            availableTeamLeaders={availableTeamLeaders}
            onAssign={(userId) => canAssign && onPhaseLeaderAssign(phase.id, userId)}
          />
        </Grid>
      ))}
    </Grid>
  );
};
```

### Visual Indicators

- **Role Badge**: Display user role prominently in header/sidebar
- **Permission Alerts**: Toast messages when action denied due to insufficient permissions
- **Disabled State**: Gray out unavailable actions with tooltip explanation
- **Read-Only Mode**: Watermark or badge for Team Members when viewing restricted areas

**Alternatives Considered**:
- UI hiding vs disabling: Chose disabling for clarity and feedback
- Role switching: Rejected as users have single role, need to log out to switch

---

## Database Schema Design Research

### Requirements

1. **Three fixed phases** with explicit phase order
2. **Role-based data access** at database level (row-level security)
3. **Audit trail** for all changes (who, when, what)
4. **Optimistic locking** for concurrent edits (version fields)
5. **Foreign key relationships** for data integrity

### Schema Design

```prisma
// Users and authentication
model User {
  id       String   @id @default(cuid())
  email    String   @unique
  name     String
  role     Role     @default(TEAM_MEMBER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  projectsAsManager  Project[]  @relation("ProjectManager")
  projectsAsLeader   Phase[]     @relation("PhaseLeader")
  assignmentsAsMember Assignment[]
}

// Phases with Team Leader assignment
model Phase {
  id            String   @id @default(cuid())
  projectId     String
  name          String   // Configurable phase name
  phaseOrder    Int      // 1, 2, 3... (determines sequence)
  status        PhaseStatus // PLANNED, IN_PROGRESS, COMPLETE, ON_HOLD, CANCELLED
  startDate     DateTime @default(now())
  endDate       DateTime?
  
  // Team Leader: One leader per phase
  teamLeaderId   String?   @relation(fields: [phaseLeader], references: [User])
  phaseLeader     User?     @relation("PhaseLeader")
  
  // Relations
  project         Project     @relation(fields: [projectPhases])
  assignments     Assignment[]
  tasks           Task[]
  
  @@index([projectId, phaseOrder])
  @@index([teamLeaderId])
}

// Projects
model Project {
  id               String   @id @default(cuid())
  clientId         String
  contractCode     String   @unique
  name             String
  status           ProjectStatus // PLANNED, IN_PROGRESS, ON_HOLD, CANCELLED, COMPLETE
  startDate        DateTime
  estimatedEndDate  DateTime
  actualEndDate    DateTime?
  builtUpArea      Int
  licenseType      String
  projectType      String
  
  // Relations
  client             Client   @relation(fields: [projects])
  phases             Phase[]  @relation("ProjectPhases")
  modifications      ProjectModification[]
  requirements       ProjectRequirement[]
  
  @@index([contractCode])
  @@index([status])
}

// Role-enforced task model
model Task {
  id           String   @id @default(cuid())
  phaseId      String
  description  String
  duration     Int      // in days
  status       TaskStatus // TODO, IN_PROGRESS, COMPLETE
  startDate    DateTime?
  endDate      DateTime?
  
  // Who created the task
  createdByUserId  String  @relation(fields: [createdBy], references: [User])
  createdBy       User?   @relation("CreatedBy")
  
  // Who is assigned (can be different from creator)
  assignedToUserId String?  @relation(fields: [assignedMember], references: [User])
  assignedToUser   User?   @relation("AssignedMember")
  
  // Which phase this task belongs to
  phase        Phase     @relation(fields: [phase])
  
  @@index([phaseId])
  @@index([status])
  @@index([createdByUserId])
  @@index([assignedToUserId])
}

// Assignment (Team Members to phases)
model Assignment {
  id             String   @id @default(cuid())
  phaseId        String
  userId         String
  role           AssignmentRole // TEAM_LEADER, TEAM_MEMBER
  workingPercent  Int      // 0-100
  startDate      DateTime
  endDate        DateTime?
  
  // Relations
  phase          Phase    @relation(fields: [phase])
  user           User     @relation(fields: [assignments])
  
  @@unique([phaseId, userId])
  @@index([userId])
}

// Audit log for all changes
model AuditLog {
  id          String   @id @default(cuid())
  entityType  String   // "Project", "Phase", "Task", "Assignment"
  entityId    String
  action      AuditAction // CREATE, UPDATE, DELETE, STATUS_CHANGE
  userId      String
  role        Role     // Who made the change
  timestamp   DateTime @default(now())
  details     String?  // JSON or text description
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([timestamp])
}
```

### Best Practices

- **Enum over strings**: Use Prisma enums for PhaseStatus, TaskStatus, Role, AssignmentRole
- **Indexes**: Add indexes on frequently queried fields (projectId, phaseId, userId, status)
- **Cascading deletes**: Configure cascade or restrict for data integrity
- **Optimistic locking**: Add `version` field to entities that support concurrent edits
- **Audit triggers**: Use Prisma middleware or service-layer hooks for automatic logging

---

## State Management Research

### Requirements

1. **User role** stored in global state (for UI controls)
2. **Current phase** per project (for Team Leader UI)
3. **Project data** with optimistic updates (for concurrent edit handling)
4. **Permissions** checked before enabling/disabling UI controls

### Zustand Store Structure

```typescript
// Global store
interface AuthStore {
  // User info
  user: User | null;
  token: string | null;
  
  // User role (for UI permissions)
  role: Role | null;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setRole: (role: Role) => void;
}

// Project store
interface ProjectStore {
  // Current project being viewed
  currentProject: Project | null;
  
  // User's assigned phase (for Team Leaders)
  userAssignedPhaseId: string | null;
  
  // All projects (for dashboard)
  projects: Project[];
  
  // Permissions cache
  canEditProject: boolean;
  canManageTasks: (phaseId: string) => boolean;
  
  // Actions
  setCurrentProject: (project: Project) => void;
  updateProject: (project: Project) => void;  // Optimistic update
  setUserAssignedPhase: (phaseId: string) => void;
  setPermissions: (role: Role) => void;
}
```

### State Synchronization Strategy

- **Server state**: Single source of truth for project data
- **Optimistic UI**: Update UI immediately, then sync with server
- **Version conflict handling**: Detect 409 Conflict responses, show diff dialog
- **Role invalidation**: Re-fetch data when user role changes (shouldn't happen with Auth0, but safe)
- **Phase change handling**: Re-fetch project data when phase transitions

**Alternatives Considered**:
- Server state only (no optimistic UI) rejected due to poor UX
- Local state only (no server sync) rejected due to concurrency issues
- Redux (too complex) vs Zustand (simple) - Chose Zustand for simplicity

---

## Performance Optimization Research

### Requirements

1. **Dashboard load**: <2 seconds for 1000 projects
2. **Concurrent users**: 100 concurrent users without degradation
3. **Report export**: <10 seconds for 500 data rows
4. **Cost reports**: <5 seconds for 50 team members

### Database Optimization

```typescript
// Indexes for dashboard queries
model Project {
  // ... fields ...
  
  @@index([status])                          // Filter by status
  @@index([startDate, endDate])               // Timeline queries
  @@index([clientId])                        // Filter by client
  @@index([currentPhaseId])                  // Phase filtering
}

// Pagination for large datasets
const getProjectsPaginated = async (page: number, limit: number, filters: ProjectFilters) => {
  return prisma.project.findMany({
    where: filters,  // Apply status, phase, date filters
    include: {
      client: true,
      phases: true,
      teamLeader: true,
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
};

// Caching strategy (Redis)
const getProjectsCached = async (filters: ProjectFilters) => {
  const cacheKey = `projects:${JSON.stringify(filters)}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const projects = await getProjectsPaginated(1, 100, filters);
  await redis.setex(cacheKey, 300, JSON.stringify(projects));  // 5-minute cache
  
  return projects;
};
```

### Frontend Optimization

```typescript
// Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

const ProjectList: React.FC = () => {
  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: (index) => document.getElementById(`project-${index}`),
    estimateSize: () => 100,  // Approximate row height
    overscan: 5,
  });
  
  return (
    <div>
      {rowVirtualizer.getVirtualItems().map(virtualRow => (
        <ProjectCard key={virtualRow.key} project={virtualRow.data} />
      ))}
    </div>
  );
};

// Lazy loading for dashboard
const Dashboard: React.FC = () => {
  const { data, isLoading, fetchNextPage } = useInfiniteScroll(
    fetchProjects,
    { threshold: 0.8 }  // Load more when 80% scrolled
  );
  
  if (isLoading) return <SkeletonLoader />;
  
  return <ProjectList projects={data} />;
};
```

### Performance Targets

| Metric | Target | Strategy |
|---------|--------|----------|
| Dashboard load time | <2s (1000 projects) | Pagination + Redis caching |
| Project creation | <3 min | Optimistic UI + debounced API calls |
| Task operations | <500ms | Database indexes + Redis cache |
| Report export | <10s (500 rows) | Async generation + streaming response |
| Concurrent users | 100 users | Connection pooling + Redis session store |

**Alternatives Considered**:
- Full client-side pagination rejected due to data freshness issues
- No caching rejected for dashboard (would be too slow at 1000 projects)
- Server-side rendering rejected due to complexity with role-based UI

---

## Recommendations Summary

### Authentication

✅ **Use Auth0** for OAuth 2.0/OIDC with built-in RBAC

### Authorization

✅ **Middleware-based role checks** with explicit permission matrix
✅ **Service-layer validation** for role-based task/phase control
✅ **UI controls** hidden/disabled based on user role

### Task Management

✅ **Configurable phases** with dynamic ordering
✅ **Team Leader assignments** (one per phase)
✅ **Phase-based task permissions** enforced at service and database layers
✅ **Automatic phase progression** based on task completion

### Database

✅ **Prisma ORM** with explicit indexes
✅ **Optimistic locking** (version fields) for concurrent edits
✅ **Audit logging** for all changes
✅ **Foreign key relationships** with cascading rules

### Performance

✅ **Redis caching** for dashboard queries (5-minute TTL)
✅ **Pagination** for large datasets (100 projects per page)
✅ **Virtual scrolling** for frontend lists (React Virtual)
✅ **Connection pooling** for 100 concurrent users
✅ **Async operations** for long-running tasks (report generation)

### State Management

✅ **Zustand** for simple, performant global state
✅ **Optimistic UI updates** with server synchronization
✅ **Version conflict detection** with 409 Conflict handling

---

## Technical Stack Decision

Based on research, the following technology stack is selected:

### Backend
- **Framework**: Node.js 20+ with Express.js and TypeScript
- **Database**: PostgreSQL 16+ with Prisma 5+ ORM
- **Auth**: Auth0 (OAuth 2.0/OIDC)
- **Caching**: Redis 7+
- **Testing**: Jest (unit), Supertest (integration), Vitest

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State**: Zustand
- **UI**: Material-UI v5+ (WCAG 2.1 AA compliant)
- **Routing**: React Router v7
- **Testing**: Vitest (unit), Playwright (E2E)

### Rationale for Constitution Compliance

| Constitution Principle | Compliance | Evidence |
|-------------------|-----------|----------|
| I. API-First | ✅ Yes | RESTful API with OpenAPI contracts |
| II. Data Integrity | ✅ N/A | No Excel import required |
| III. TDD | ✅ Yes | Tests before implementation enforced |
| IV. Integration Testing | ✅ Yes | Supertest for APIs, Playwright for E2E |
| V. Security | ✅ Yes | Auth0 + OAuth 2.0 + RBAC |
| VI. Observability | ✅ Yes | Winston logs + Prometheus metrics + health checks |
| VII. UX | ✅ Yes | Material-UI WCAG 2.1 AA + performance targets |

**All constitution principles satisfied** ✅
