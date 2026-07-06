# TeamFlow Architecture Diagram & Specification

This document details the software architecture, trade-offs, and data flows of the TeamFlow application.

---

## 1. System Architecture Overview

TeamFlow is designed as a **Serverless Monolithic SPA (Single Page Application)** utilizing a **BaaS (Backend-as-a-Service)** model powered by Google Firebase. This architecture optimizes deployment costs, delivers real-time synchronicity, and delegates security enforcement to the database layer.

```
       +-------------------------------------------------------------+
       |                         CLIENT VIEW                         |
       |                        React SPA client                     |
       +------------------------------+------------------------------+
                                      |
                 User Auth            |         Real-time state
                 & Profile updates    |         and CRUD queries
                                      v
       +-------------------------------------------------------------+
       |                        CLOUD SERVICES                       |
       |                       Google Firebase                       |
       +------------------------------+------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
  +--------------+                                          +--------------+
  | Firebase     |                                          | Cloud        |
  | Auth         |                                          | Firestore    |
  | Service      |                                          | Database     |
  +--------------+                                          +-------+------+
                                                                    |
                                                                    v
                                                            +--------------+
                                                            | Attribute-   |
                                                            | Based Access |
                                                            | Security     |
                                                            | Rules        |
                                                            +--------------+
```

---

## 2. Architectural Decisions & Trade-Offs

### Monolith vs. Microservices
- **Choice**: Monolith (Single-Page React SPA with unified Firebase backend).
- **Trade-off**:
  - *Pros*: Extremely low cold-start latency, zero inter-service communication overhead, unified state context, and dramatically simpler development and debugging cycles.
  - *Cons*: Scalability is vertically bound to the Firebase Firestore limits (which scale to millions of concurrent reads/writes natively, mitigating this downside).

### SQL vs. NoSQL
- **Choice**: Document-oriented NoSQL (Cloud Firestore).
- **Trade-off**:
  - *Pros*: Exceptional horizontal scaling, real-time live synchronization out-of-the-box (using WebSocket streams via client SDK), and dynamic schema-on-read capabilities.
  - *Cons*: Joins must be handled application-side. We resolve this by structuring projects, tasks, and incidents with denormalized relationship lookups (`projectId` references, `managerId` references, etc.), which are validated securely at the database rules gate.

### Real-time vs. Request-Response
- **Choice**: Event-Driven Real-time Synchronization (Firestore `onSnapshot` listeners).
- **Trade-off**:
  - *Pros*: Instant UI responsiveness without polling. Collaborators see blocker incidents, review status transitions, and dependencies update live.
  - *Cons*: Slightly higher connection quotas. This is handled by binding listeners reactively to active projects only, conserving active sockets.
