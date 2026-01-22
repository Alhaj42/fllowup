# Data Model: Excel to SaaS Migration

**Feature**: 001-excel-to-saas
**Date**: 2025-01-21
**Database**: PostgreSQL 16+ via Prisma ORM
**Purpose**: Define entities, relationships, validation rules, and state transitions

---

## Entity Relationship Diagram

```
User (1) ----< (M) Assignment
  |                   |
  |                   v
  |                Project (1) ----< (M) Phase
  |                   |                   |
  |                   |                   +----< (M) Task
  |                   |                   |
  |                   |                   +----< (M) CostEntry
  |                   |                   |
  |                   |                   +----< (M) KPIEntry
  |                   |
  |                   +----< (M) ProjectRequirement
  |
  +----< (M) AuditLog

Client (1) ----< (M) Project

ConfigurationItem (many, reference data)
```

---

## Entities

### User

Represents application users with authentication and authorization.

**Fields**:
- `id` (UUID, primary key)
- `email` (String, unique, not null, validated format)
- `name` (String, not null)
- `role` (Enum: MANAGER | TEAM_LEADER | TEAM_MEMBER, not null)
- `position` (String, nullable - references ConfigurationItem)
- `region` (String, nullable - references ConfigurationItem)
- `grade` (String, nullable)
- `level` (String, nullable)
- `monthlyCost` (Decimal, nullable, >= 0)
- `isActive` (Boolean, default true)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)

**Relationships**:
- One-to-Many: Assignment (as assignedTeamMember)
- One-to-Many: AuditLog (as changedBy)

**Validation Rules**:
- Email must be valid format
- Role must be one of: MANAGER, TEAM_LEADER, TEAM_MEMBER
- monthlyCost must be >= 0

**Indexes**:
- Unique index on email
- Index on role
- Index on isActive

---

### Client

Represents client organizations.

**Fields**:
- `id` (UUID, primary key)
- `name` (String, not null, unique)
- `contactName` (String, nullable)
- `contactEmail` (String, nullable, validated format)
- `contactPhone` (String, nullable)
- `address` (Text, nullable)
- `isActive` (Boolean, default true)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)

**Relationships**:
- One-to-Many: Project

**Validation Rules**:
- Name must not be empty
- contactEmail must be valid format if provided

**Indexes**:
- Unique index on name
- Index on isActive

---

### Project

Represents a client engagement project.

**Fields**:
- `id` (UUID, primary key)
- `clientId` (UUID, foreign key to Client, not null)
- `name` (String, not null)
- `contractCode` (String, not null, unique)
- `contractSigningDate` (Date, not null)
- `builtUpArea` (Decimal, not null, > 0, unit: m²)
- `licenseType` (String, nullable - references ConfigurationItem)
- `projectType` (String, nullable - references ConfigurationItem)
- `requirements` (Text, nullable)
- `startDate` (Date, not null)
- `estimatedEndDate` (Date, not null)
- `actualEndDate` (Date, nullable)
- `currentPhase` (Enum: STUDIES | DESIGN | COMPLETED | ON_HOLD | CANCELLED, default STUDIES)
- `status` (Enum: PLANNED | IN_PROGRESS | ON_HOLD | CANCELLED | COMPLETED, default PLANNED)
- `modificationAllowedTimes` (Int, default 3)
- `modificationDaysPerTime` (Int, default 5)
- `totalCost` (Decimal, default 0)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)
- `version` (Int, default 1, for optimistic locking)

**Relationships**:
- Many-to-One: Client
- One-to-Many: Phase
- One-to-Many: Assignment (through phases)

**Validation Rules**:
- contractSigningDate must be <= startDate
- startDate must be <= estimatedEndDate
- actualEndDate must be >= startDate if provided
- modificationAllowedTimes must be >= 0
- modificationDaysPerTime must be >= 0

**Indexes**:
- Unique index on contractCode
- Index on clientId
- Index on currentPhase
- Index on status
- Index on startDate, estimatedEndDate (for timeline queries)

**State Transitions**:
```
PLANNED -> IN_PROGRESS -> COMPLETED
PLANNED -> ON_HOLD
PLANNED -> CANCELLED
IN_PROGRESS -> ON_HOLD -> IN_PROGRESS
IN_PROGRESS -> COMPLETED
IN_PROGRESS -> CANCELLED
ON_HOLD -> CANCELLED
```

---

### Phase

Represents a project phase (Studies, Design, etc.).

**Fields**:
- `id` (UUID, primary key)
- `projectId` (UUID, foreign key to Project, not null)
- `name` (Enum: STUDIES | DESIGN, not null)
- `startDate` (Date, not null)
- `duration` (Int, not null, unit: days)
- `estimatedEndDate` (Date, calculated: startDate + duration)
- `actualStartDate` (Date, nullable)
- `actualEndDate` (Date, nullable)
- `status` (Enum: PLANNED | IN_PROGRESS | COMPLETED, default PLANNED)
- `progress` (Decimal, default 0, range: 0-100)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)
- `version` (Int, default 1, for optimistic locking)

**Relationships**:
- Many-to-One: Project
- One-to-Many: Task
- One-to-Many: Assignment
- One-to-Many: CostEntry
- One-to-Many: KPIEntry

**Validation Rules**:
- duration must be > 0
- progress must be between 0 and 100
- actualEndDate must be >= actualStartDate if both provided

**Indexes**:
- Unique compound index on (projectId, name) - only one phase of each type per project
- Index on status
- Index on startDate, estimatedEndDate

**State Transitions**:
```
PLANNED -> IN_PROGRESS -> COMPLETED
```

---

### Task

Represents a unit of work within a phase.

**Fields**:
- `id` (UUID, primary key)
- `phaseId` (UUID, foreign key to Phase, not null)
- `code` (String, not null)
- `description` (Text, not null)
- `duration` (Int, not null, unit: days)
- `status` (Enum: PLANNED | IN_PROGRESS | COMPLETED, default PLANNED)
- `assignedTeamMemberId` (UUID, foreign key to User, nullable)
- `startDate` (Date, nullable)
- `endDate` (Date, nullable)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)
- `version` (Int, default 1, for optimistic locking)

**Relationships**:
- Many-to-One: Phase
- Many-to-One: User (assignedTeamMember)

**Validation Rules**:
- duration must be > 0
- endDate must be >= startDate if both provided

**Indexes**:
- Unique compound index on (phaseId, code)
- Index on status
- Index on assignedTeamMemberId
- Index on startDate, endDate (for timeline queries)

**State Transitions**:
```
PLANNED -> IN_PROGRESS -> COMPLETED
```

---

### Assignment

Represents the relationship between a team member and a project phase.

**Fields**:
- `id` (UUID, primary key)
- `phaseId` (UUID, foreign key to Phase, not null)
- `teamMemberId` (UUID, foreign key to User, not null)
- `role` (Enum: TEAM_LEADER | TEAM_MEMBER, not null)
- `workingPercentage` (Decimal, not null, range: 0-100)
- `startDate` (Date, not null)
- `endDate` (Date, nullable)
- `isActive` (Boolean, default true)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)
- `version` (Int, default 1, for optimistic locking)

**Relationships**:
- Many-to-One: Phase
- Many-to-One: User (teamMember)

**Validation Rules**:
- workingPercentage must be between 0 and 100
- endDate must be >= startDate if provided
- One team member can only be TEAM_LEADER once per phase
- Total workingPercentage for a team member across active phases should not exceed 100 (application-level validation)

**Indexes**:
- Unique compound index on (phaseId, teamMemberId, role) - only one assignment per role per phase
- Index on teamMemberId
- Index on startDate, endDate (for allocation queries)
- Index on isActive

---

### CostEntry

Represents cost data for a project.

**Fields**:
- `id` (UUID, primary key)
- `projectId` (UUID, foreign key to Project, not null)
- `phaseId` (UUID, foreign key to Phase, not null)
- `employeeId` (UUID, foreign key to User, not null)
- `period` (Date, not null, represents month)
- `costAmount` (Decimal, not null, >= 0)
- `costType` (Enum: EMPLOYEE_COST | MATERIAL_COST | OTHER_COST, default EMPLOYEE_COST)
- `description` (Text, nullable)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)

**Relationships**:
- Many-to-One: Project
- Many-to-One: Phase
- Many-to-One: User (employee)

**Validation Rules**:
- costAmount must be >= 0

**Indexes**:
- Unique compound index on (projectId, phaseId, employeeId, period)
- Index on projectId
- Index on phaseId
- Index on employeeId
- Index on period (for monthly reports)

---

### KPIEntry

Represents performance metrics for an employee.

**Fields**:
- `id` (UUID, primary key)
- `employeeId` (UUID, foreign key to User, not null)
- `projectId` (UUID, foreign key to Project, not null)
- `phaseId` (UUID, foreign key to Phase, not null)
- `delayedDays` (Int, default 0, >= 0)
- `clientModifications` (Int, default 0, >= 0)
- `technicalMistakes` (Int, default 0, >= 0)
- `period` (Date, nullable, represents month)
- `score` (Decimal, nullable, calculated from KPI metrics)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)

**Relationships**:
- Many-to-One: User (employee)
- Many-to-One: Project
- Many-to-One: Phase

**Validation Rules**:
- All integer fields must be >= 0

**Indexes**:
- Index on employeeId
- Index on projectId
- Index on phaseId
- Index on period (for trend analysis)
- Index on score (for performance ranking)

---

### ConfigurationItem

Represents reference data (positions, regions, license types, project types, etc.).

**Fields**:
- `id` (UUID, primary key)
- `category` (Enum: POSITION | REGION | LICENSE_TYPE | PROJECT_TYPE | REPLY_REASON | ALLOWANCE_TYPE, not null)
- `name` (String, not null)
- `code` (String, nullable)
- `description` (Text, nullable)
- `isActive` (Boolean, default true)
- `sortOrder` (Int, default 0, for ordering)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)

**Relationships**:
- None (reference data)

**Validation Rules**:
- name must not be empty

**Indexes**:
- Unique compound index on (category, name)
- Index on category
- Index on isActive
- Index on sortOrder

---

### ProjectRequirement

Represents a project requirement that can be tracked for completion (FR-017).

**Fields**:
- `id` (UUID, primary key)
- `projectId` (UUID, foreign key to Project, not null)
- `description` (String, not null, max 500 characters)
- `isCompleted` (Boolean, default false)
- `completedAt` (DateTime, nullable)
- `completedBy` (UUID, foreign key to User, nullable)
- `sortOrder` (Int, default 0)
- `createdAt` (DateTime, not null, default now)
- `updatedAt` (DateTime, not null, default now)

**Relationships**:
- Many-to-One: Project
- Many-to-One: User (completedBy)

**Validation Rules**:
- description must not be empty
- description must be max 500 characters
- completedBy must be set if isCompleted is true

**Indexes**:
- Index on projectId
- Index on isCompleted
- Index on sortOrder

---

### AuditLog

Represents audit trail of all changes (constitution requirement).

**Fields**:
- `id` (UUID, primary key)
- `entityType` (Enum: PROJECT | PHASE | TASK | ASSIGNMENT | COST_ENTRY | KPI_ENTRY | USER | CLIENT, not null)
- `entityId` (UUID, not null)
- `action` (Enum: CREATE | UPDATE | DELETE, not null)
- `changedBy` (UUID, foreign key to User, not null)
- `changes` (JSON, nullable - contains before/after values)
- `ipAddress` (String, nullable)
- `userAgent` (String, nullable)
- `timestamp` (DateTime, not null, default now)

**Relationships**:
- Many-to-One: User (changedBy)

**Validation Rules**:
- None (logging all changes)

**Indexes**:
- Index on entityType, entityId (for querying entity history)
- Index on changedBy
- Index on timestamp (for time-based queries)

---

## Business Logic & Calculations

### Project Progress Calculation

Phase progress = (completedTasks / totalTasks) * 100

Overall project progress = weighted average of phase progresses

### Team Allocation Calculation

For a given team member in a given month:
- Sum workingPercentage from all active Assignments where the month falls within startDate/endDate
- If total > 100, flag as over-allocated

### KPI Score Calculation

KPI Score formula (to be defined based on business rules):
- Base score: 100
- Subtract: delayedDays * weight1
- Subtract: clientModifications * weight2
- Subtract: technicalMistakes * weight3

Weights to be configured based on business requirements.

### Project Cost Calculation

Total Project Cost = Sum of all CostEntry.costAmount for the project

Cost by Phase = Sum of CostEntry.costAmount where phaseId = X

Cost by Employee = Sum of CostEntry.costAmount where employeeId = X

### Phase Status Transition

When all Tasks in a Phase have status = COMPLETED:
- Automatically set Phase.status = COMPLETED
- Calculate phase.progress = 100
- If all phases are completed, set Project.status = COMPLETED

---

## Data Integrity Constraints

### Entity-Level Constraints

1. **Project**:
   - Cannot delete if Phases exist
   - Cannot delete if Assignments exist
   - Cannot delete if CostEntries exist

2. **Phase**:
   - Cannot delete if Tasks exist
   - Cannot delete if Assignments exist
   - Cannot delete if CostEntries exist
   - Cannot delete if KPIEntries exist

3. **User**:
   - Cannot delete if Assignments exist
   - Cannot delete if CostEntries exist
   - Cannot delete if KPIEntries exist
   - Set isActive = false instead of delete

4. **Client**:
   - Cannot delete if Projects exist

### Application-Level Validations

1. **Team Allocation**:
   - Warn when team member allocation exceeds 100%
   - Prevent creating Assignment if allocation would exceed 100% (configurable)

2. **Project Phases**:
   - Cannot have two phases of the same type in one project
   - Phase dates must not overlap with other phases of same project

3. **Task Dependencies**:
   - (Future enhancement) Support task dependencies if needed

---

## Excel Migration Mapping

| Excel Sheet | Target Entity | Notes |
|-------------|---------------|-------|
| Projects List | Project | Map all columns to Project fields |
| Team members Data | User, Assignment | Team member info to User, allocations to Assignment |
| Tasks | Task | Map tasks to Task entities |
| Project Costs | CostEntry | Map cost data to CostEntry |
| Employees KPIs | KPIEntry | Map KPI data to KPIEntry |
| List (configuration) | ConfigurationItem | Map positions, regions, etc. to ConfigurationItem |
| Employees Summary | Derived | Calculate from User, Assignment, CostEntry |

---

## Performance Optimization

### Indexes

All critical query paths are indexed:
- Dashboard queries (Project.status, Project.currentPhase)
- Timeline queries (Project.startDate, Phase.startDate, Task.startDate)
- Team allocation queries (Assignment.teamMemberId, Assignment.startDate, Assignment.endDate)
- Cost reporting (CostEntry.period, CostEntry.projectId)
- KPI reporting (KPIEntry.period, KPIEntry.employeeId)

### Caching Strategy

- Dashboard data: Cache for 5 minutes
- Team allocation: Cache for 10 minutes
- Configuration items: Cache for 1 hour
- Project details: Cache for 5 minutes

### Query Optimization

- Use Prisma's `select` to only fetch needed fields
- Use pagination for large datasets (Projects, Tasks)
- Use aggregation at database level (not application level) for reports

---

## Security Considerations

### Row-Level Security

- Users can only access Projects they are assigned to (unless MANAGER role)
- Team members can only see their own KPIs
- Managers can see all projects and team data

### Audit Logging

- All CREATE, UPDATE, DELETE operations logged
- Log includes: user, timestamp, changes, entity

### Data Encryption

- Sensitive data encrypted at rest (PostgreSQL TDE)
- All data in transit encrypted (TLS 1.3+)

---

## Next Steps

1. ✅ Data model complete
2. Next: Create API contracts (Phase 1)
3. Next: Create quickstart.md (Phase 1)
4. Next: Update agent context (Phase 1)
5. Next: Re-evaluate Constitution Check post-design (Phase 1)
