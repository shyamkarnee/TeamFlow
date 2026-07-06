# TeamFlow Entity-Relationship Diagram (ERD)

This document maps the data shapes and relations between our primary document collections.

---

## 1. ERD Text Model Representation

```
  +------------------+             +------------------+
  |      USERS       |             |     PROJECTS     |
  +------------------+             +------------------+
  | PK  uid          |<----------- | PK  id           |
  |     name         |             |     name         |
  |     email        |             |     description  |
  |     role         |             | FK  managerId    |
  |     createdAt    |             |     members[]    |
  +--------+---------+             |     createdAt    |
           |                       +--------+---------+
           |                                |
           |                                | Has Many
           | Assigned                       v
           |                        +------------------+
           |                        |      TASKS       |
           |                        +------------------+
           +----------------------->| PK  id           |
           |                        | FK  projectId    |
           |                        |     title        |
           |                        |     description  |
           |                        | FK  assignedTo   |
           |                        |     status       |
           |                        |     dependencies| (Task IDs list)
           |                        |     reviewerComm |
           |                        |     createdAt    |
           |                        |     updatedAt    |
           |                        +------------------+
           |                                |
           |                                |
           | Assigned                       | Has Many
           |                        v
           |                        +------------------+
           |                        |    INCIDENTS     |
           |                        +------------------+
           +----------------------->| PK  id           |
                                    | FK  projectId    |
                                    |     title        |
                                    |     description  |
                                    | FK  reportedBy   |
                                    | FK  assignedTo   |
                                    |     status       |
                                    |     createdAt    |
                                    |     updatedAt    |
                                    +------------------+
```

---

## 2. Collection Schemas

### `/users/{userId}` (Profiles)
- `uid`: String (Primary Key)
- `email`: String (Unique)
- `name`: String
- `role`: Enum ("Admin" | "Manager" | "Developer")
- `createdAt`: Timestamp

### `/projects/{projectId}` (Workspaces)
- `id`: String (Primary Key)
- `name`: String (Unique index enforced application-side)
- `description`: String
- `managerId`: String (Foreign Key matching `users.uid`)
- `members`: List<String> (Array of `users.uid` strings, size <= 20)
- `createdAt`: Timestamp

### `/projects/{projectId}/tasks/{taskId}` (Deliverables)
- `id`: String (Primary Key)
- `projectId`: String (Foreign Key matching `projects.id`)
- `title`: String
- `description`: String
- `assignedTo`: String (Foreign Key matching `users.uid`)
- `status`: Enum ("To Do" | "In Progress" | "Review" | "Completed")
- `dependencies`: List<String> (Array of sibling `tasks.id` strings)
- `reviewerComment`: String (Optional, for rejection annotations)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### `/projects/{projectId}/incidents/{incidentId}` (Blockers)
- `id`: String (Primary Key)
- `projectId`: String (Foreign Key matching `projects.id`)
- `title`: String
- `description`: String
- `reportedBy`: String (Foreign Key matching `users.uid`)
- `assignedTo`: String (Foreign Key matching `users.uid`)
- `status`: Enum ("Open" | "In Progress" | "Resolved" | "Closed")
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### `/users/{userId}/notifications/{notificationId}` (System Feed)
- `id`: String (Primary Key)
- `userId`: String (Foreign Key matching `users.uid`)
- `message`: String
- `read`: Boolean (Default false)
- `type`: String
- `createdAt`: Timestamp
