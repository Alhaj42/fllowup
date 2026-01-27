# Remediation Edits for 002-full-saas spec.md

## Critical Issue #1: Optimistic Locking Conflict Handling

**Current State (spec.md:154-172):**
```
- How does system handle concurrent edits to the same project (optimistic locking)?
```

**Remediation:**
Replace with:
```
- How does system handle concurrent edits to the same project (optimistic locking)?
  - When a concurrent edit is detected (version mismatch), the system MUST return a 409 Conflict error with details about the conflicting version
  - The frontend MUST display a message: "This project was modified by another user. Please refresh and try again."
  - User can refresh the page to load the latest version and reapply their changes
  - No data loss: the system MUST preserve all user-entered data on the conflict page for re-entry
```

---

## High Issue #2: Allocation >100% Behavior

**Current State (spec.md:154):**
```
- What happens when a team member is assigned >100% allocation across projects?
```

**Remediation:**
Replace with:
```
- What happens when a team member is assigned >100% allocation across projects?
  - System MUST display a validation error when allocation >100%: "Team member allocation exceeds 100%. Current total: {current}%. Maximum: 100%."
  - Manager MUST explicitly acknowledge the over-allocation by checking "Override allocation limit" checkbox before saving
  - Allocation >100% is recorded in AuditLog with reason "Manager override: allocation limit exceeded"
  - Dashboard shows allocation bar in red when >100% with warning icon
```

---

## High Issue #3: Project with No Phases Behavior

**Current State (spec.md:154):**
```
- What happens when a project has no phases configured?
```

**Remediation:**
Replace with:
```
- What happens when a project has no phases configured?
  - Project creation MUST require at least one phase to be configured
  - If Manager tries to save project with zero phases, system MUST display validation error: "At least one project phase is required."
  - Suggested default: When creating a new project, system MUST auto-create a default "Studies" phase if no phases are specified
  - Existing projects with no phases (edge case) display in dashboard with "No phases configured - please add at least one phase" badge
```

---

## High Issue #4: Incomplete Task Phase Transition

**Current State (spec.md:154):**
```
- How does system handle phase transition when tasks are incomplete?
```

**Remediation:**
Replace with:
```
- How does system handle phase transition when tasks are incomplete?
  - When Team Leader tries to complete a phase with incomplete tasks, system MUST display error: "Cannot complete phase. {count} tasks are still in progress."
  - Dashboard shows task completion percentage for each phase (e.g., "7/10 tasks completed")
  - Phase status changes to IN_PROGRESS only when ALL tasks in that phase have status COMPLETE
  - If subsequent phase exists, it remains PLANNED until previous phase is COMPLETE
  - Manual override option: Manager can force phase completion with reason entry (logged in AuditLog)
```

---

## Medium Issue #5: Define NFR-004 Degradation Criteria

**Current State (spec.md:236):**
```
- **NFR-004**: API response times MUST be under 500ms for 95th percentile
```

**Remediation:**
Replace with:
```
- **NFR-004**: API response times MUST be under 500ms for 95th percentile
  - Applies to critical endpoints: GET /projects, POST /projects, GET /projects/:id/dashboard
  - Read-heavy queries (reports, exports) may exceed 500ms but must complete within 2s
  - Dashboard load with 1000 projects: must complete in under 2s (separate NFR-001)
  - Degradation threshold: Response time >2s for any endpoint triggers performance alert
```

---

## Implementation Notes

### Files to Modify:
1. **spec.md** - Update Edge Cases section and NFR-004 definition

### After Edits:
1. Run `/speckit.tasks` to update task list if needed
2. Run `/speckit.analyze` again to verify all issues resolved
3. Run `/speckit.implement` to begin implementation

### New Requirements to Add (if not already present):
- FR-031: System MUST return 409 Conflict error on optimistic lock failure
- FR-032: System MUST allow allocation >100% with Manager override and audit logging
- FR-033: System MUST require at least one phase for project creation
- FR-034: System MUST display task completion percentage per phase
- FR-035: Manager can force complete phase with reason (audit logged)
- FR-036: Performance alerts triggered when endpoint response time >2s
