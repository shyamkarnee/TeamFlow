# TeamFlow Business Rules & Lifecycles

This document details the functional specifications, access boundaries, and workflow lifecycles of TeamFlow.

---

## 1. User Roles & System Privileges

- **Admin** (System Auditor):
  - Full system directory visibility.
  - Can modify the role of any registered user (promoting developers to managers or auditing admin privileges).
  - Can read/view any project workspace.
  - Can delete any project, task, or incident log.

- **Manager** (Workspace Owner):
  - Can create and modify projects (assigning managers and configuring roster lists).
  - Can create, assign, and delete tasks within their managed project.
  - Controls the review workflow gate (approving tasks to `Completed` or rejecting them to `In Progress`).
  - Can resolve and close incident blockers.

- **Developer** (Task Assignee):
  - Can view projects they are assigned to.
  - Can modify the status of tasks assigned to them (moving them from `To Do` ➔ `In Progress` ➔ `Review`).
  - Can raise blocker incidents against their active workspaces.
  - Receives automated task, rejection, and blocking notifications.

---

## 2. The Task Progression Lifecycle

The status of any task must follow a strict linear sequence:
`To Do` ➔ `In Progress` ➔ `Review` ➔ `Completed`

```
  +---------+         +-------------+         +----------+         +-----------+
  |  To Do  |  ====>  | In Progress |  ====>  |  Review  |  ====>  | Completed |
  +---------+         +------+------+         +----+-----+         +-----------+
                             ^                     |
                             |      Rejected       |
                             +---------------------+
                               (Requires comment)
```

### Dependency Conflict Handling
- Before a task enters `In Progress` state, the system audits its linked `dependencies`.
- If **any** of the prerequisite tasks are not in the `Completed` state, the action is blocked:
  1. The task remains in `To Do` or is blocked from advancing.
  2. The system triggers a red warning notification for the assignee: *"Task [Title] is blocked. Dependent tasks are not completed."*
  3. Displays a descriptive blocking banner on the active workspace.

### Actionable Review Gate
- Only Managers or Admins can promote a task from `Review` to `Completed`.
- If approved, the task moves to `Completed` and is locked from standard edits.
- If rejected, the manager **must** specify a `reviewerComment` explaining the rejection. The task status is returned to `In Progress`, and the developer is notified of the rejection and comment instantly.
