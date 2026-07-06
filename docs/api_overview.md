# TeamFlow Service API Overview

TeamFlow utilizes Firestore direct-client services to securely execute transactions. This overview maps the core service methods that interact with Cloud Firestore.

---

## 1. Authentication Services
- **`signInWithGoogle()`**:
  - Spawns Google Auth Popup. On success, queries `/users/{uid}`. If absent, registers the profile as `Developer` role with verified email credentials.
- **`signOut()`**:
  - Clears active session tokens, instantly revoking read/write listeners on security gates.

---

## 2. Project Management Services
- **`createProject(name, description, managerId, members)`**:
  - Enforces project name uniqueness.
  - Registers the document and spawns `project_added` notifications for all members.
- **`updateProject(projectId, name, description, members)`**:
  - Modifies workspace parameters. Sends alert notifications.
- **`deleteProject(projectId)`**:
  - Purges workspace from the index.

---

## 3. Task Workflow Services
- **`createTask(projectId, projectName, title, description, assignedTo, dependencies)`**:
  - Registers task and alerts assigned developer (`task_assigned`).
- **`updateTaskStatus(projectId, projectName, task, newStatus, allProjectTasks, isManagerUser, reviewerComment)`**:
  - Audits state sequence (`To Do` ➔ `In Progress` ➔ `Review` ➔ `Completed`).
  - **Dependency Check**: Verifies and blocks task if dependencies are not `Completed`. Triggers `dependency_blocked` notification.
  - **Review Gate**: Triggers `task_submitted` on review request. If rejected by manager, verifies `reviewerComment` exists, returns status to `In Progress`, and sends `task_rejected`. If approved, transitions to `Completed`.

---

## 4. Incident Blocker Services
- **`createIncident(projectId, projectName, title, description, reportedBy, assignedTo)`**:
  - Logs incident blocker. Spawns `incident_assigned` notifications.
- **`updateIncidentStatus(projectId, projectName, incident, newStatus, assignedTo)`**:
  - Manages progress (`Open` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`). Alerts reported user.
- **`deleteIncident(projectId, incidentId)`**:
  - Discards blocker log.
