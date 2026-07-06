# TeamFlow Firestore Security Specification

This document details the security model, data invariants, and the adversarial "Dirty Dozen" test cases that the firestore rules must defend against.

## 1. Data Invariants

- **Profile Role Lockdown**: Users cannot assign or change their own `role` field. Profile creation defaults to 'Developer' unless initialized by an Admin, and updates to the `role` field are strictly restricted.
- **Project Ownership**: Only Admins and Managers can create or delete projects.
- **Membership Scope**: A user can only view or modify sub-resources (Tasks, Incidents, Members) of a project if they are an active member of that project, or if they are an Admin.
- **Task Progression Flow**: 
  - Status sequence must be strictly: `To Do` -> `In Progress` -> `Review` -> `Completed`.
  - Only Managers can approve a task from `Review` to `Completed` (or transition it back to `In Progress` with a comment).
  - Developers can only transition tasks they are assigned to, and only between `To Do`, `In Progress`, and `Review`.
- **Dependency Enforcement**: A task cannot be marked `In Progress` if any of its `dependencies` task statuses are not `Completed`.
- **Notification Privacy**: Notifications are private. Only the specific user (`userId == auth.uid`) can read or write (mark as read) their notifications.
- **Immutability of Historical Fields**: Fields like `createdAt` and `reportedBy` must be immutable after document creation.

---

## 2. The "Dirty Dozen" Rogue Payloads

These 12 malicious payloads represent attacks attempting to violate identity, integrity, and state transition rules. The security rules are designed to reject all of these.

| ID | Attack Name | Target Collection | Payload Description / Attack Vector | Expected Result |
|---|---|---|---|---|
| **D1** | Self-Role Escalation | `/users/{userId}` | A user attempts to create their profile with `"role": "Admin"`. | `PERMISSION_DENIED` |
| **D2** | Shadow Privilege Update | `/users/{userId}` | An authenticated developer attempts to update their profile with `"role": "Manager"`. | `PERMISSION_DENIED` |
| **D3** | Ghost Project Creation | `/projects/{projectId}` | A Developer role attempts to create a project with them as the manager. | `PERMISSION_DENIED` |
| **D4** | Member Injection | `/projects/{projId}/members/{id}` | A Developer attempts to add another developer directly to a project. | `PERMISSION_DENIED` |
| **D5** | Non-Member Task Creation | `/projects/{projId}/tasks/{id}` | A user who is not a member of the project attempts to create a task in it. | `PERMISSION_DENIED` |
| **D6** | Task Hijacking (Assignee change) | `/projects/{projId}/tasks/{taskId}` | A Developer attempts to reassign a task to another user. | `PERMISSION_DENIED` |
| **D7** | Illegitimate Task Approval | `/projects/{projId}/tasks/{taskId}` | A Developer attempts to bypass review by updating status from `Review` directly to `Completed`. | `PERMISSION_DENIED` |
| **D8** | Rejection comment omission | `/projects/{projId}/tasks/{taskId}` | A Manager attempts to reject a task (status `Review` -> `In Progress`) without specifying a `reviewerComment`. | `PERMISSION_DENIED` |
| **D9** | Notification Snooping | `/users/{userId}/notifications/{id}` | User A attempts to list or read user B's notification subcollection. | `PERMISSION_DENIED` |
| **D10** | Timestamp Spoofing | `/projects/{projId}/tasks/{id}` | Client attempts to create a task with a backdated or future `createdAt` string instead of the actual `request.time`. | `PERMISSION_DENIED` |
| **D11** | Rogue Incident Escalation | `/projects/{projId}/incidents/{id}` | A non-member user attempts to log an incident against a private project. | `PERMISSION_DENIED` |
| **D12** | Project Name Poisoning | `/projects/{projectId}` | An attacker tries to write a 1MB string or empty name as a project name. | `PERMISSION_DENIED` |

---

## 3. Security Test Scenarios

The security specification is tested through client access rules and structural schema validations.
These assertions have been compiled into `firestore.rules` to prevent any of the described operations from succeeding.
