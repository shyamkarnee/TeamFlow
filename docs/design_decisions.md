# TeamFlow Design Decisions Log

This log chronicles major architecture and engineering choices made during TeamFlow's development, presenting alternatives, tradeoffs, and justifications.

---

## Decision 1: Authentication Engine (Firebase Auth vs Custom JWT)
- **Choice**: **Firebase Authentication** with Google Sign-in.
- **Alternatives Considered**: Self-rolled Node.js backend with JSON Web Tokens (JWT) and MySQL password encryption (bcrypt).
- **Justification & Trade-off**:
  - *Why*: Direct Google Auth integrates instantly, handles token refreshing natively, avoids storing raw passwords on local databases, and guarantees enterprise-grade security.
  - *Trade-off*: Relies on third-party availability. We mitigate this by checking authentication readiness flags before subscribing to live Firestore listeners.

---

## Decision 2: Real-time Live Streams vs Polling REST APIs
- **Choice**: **Reactive Websocket Listeners** (`onSnapshot`).
- **Alternatives Considered**: RESTful HTTP endpoints returning JSON payloads.
- **Justification & Trade-off**:
  - *Why*: Teams need to see blocker alerts and review states immediately. If a task dependency is resolved, sibling tasks should instantly light up as "Ready" on the developer's screen without refreshing.
  - *Trade-off*: Higher Firestore concurrent connections. Mitigated by centralizing active listeners in `DataContext` and cleaning up subscriptions on component unmounts.

---

## Decision 3: Project Membership Storage
- **Choice**: **Embedded members array** inside the Project document.
- **Alternatives Considered**: Independent `/memberships` mapping collection.
- **Justification & Trade-off**:
  - *Why*: Checking if `request.auth.uid in getProject(projectId).members` can be evaluated in $O(1)$ directly inside the Firestore Security Rules. This avoids costly recursive document lookups during list queries, optimizing load speeds and Firestore billing.
  - *Trade-off*: Limits a project roster to 20 members (due to the 1MB document limit). This is completely acceptable for standard agile engineering scrum teams.
