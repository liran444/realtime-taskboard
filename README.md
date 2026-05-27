# Realtime Taskboard

A full-stack real-time to-do application built with Angular 17, Node.js/Express, MongoDB, and Socket.IO, fully runnable via Docker Compose.
Features a paginated tasks list with real-time sync between connected clients.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, Angular Material, RxJS, Socket.IO Client |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | MongoDB 7 (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens) |
| Containerization | Docker, Docker Compose |

## Architecture

The application follows a clean layered architecture with well-defined design patterns:

- **RESTful API** for CRUD operations — clients perform create, read, update, delete via standard HTTP endpoints
- **Socket.IO** for real-time sync — after a REST operation succeeds, the server broadcasts the change to all connected clients via WebSocket
- **Repository Pattern** — all database interactions go through repository classes (`BaseRepository<T>`, `TaskRepository`, `UserRepository`), abstracting Mongoose from the service layer
- **Singleton Pattern** — database connection (`mongoose.connect` called once) and Socket.IO server instance (shared across the app)
- **Factory Pattern** — `ResponseFactory` provides consistent API response formatting (`{ success, data, error, statusCode }`)
- **Service Pattern (Angular)** — Angular services manage HTTP calls, socket communication, and reactive state using RxJS `BehaviorSubject`

```
Client (Angular 17)               Server (Node.js + Express)           MongoDB
┌─────────────────┐               ┌──────────────────────┐            ┌─────────┐
│  Components     │──HTTP REST──> │  Controllers         │            │         │
│  Services       │               │  Services            │──Repos──>  │  Tasks  │
│  Socket.IO      │<──WebSocket──>│  Socket.IO Server    │            │  Users  │
│  Client         │               │  Repositories        │            │         │
└─────────────────┘               └──────────────────────┘            └─────────┘
```

## Prerequisites

- [Docker](https://www.docker.com/get-started) (v20+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)

No local Node.js installation is required — everything runs inside containers.

## Getting Started

### 1. Clone and configure

```bash
cd realtime-taskboard
cp .env.example .env
```

### 2. Start the application

```bash
docker compose up --build
```

This starts three containers:

| Container | Service | Port |
|-----------|---------|------|
| `taskboard-mongo` | MongoDB 7 | 27017 |
| `taskboard-server` | Node.js API + Socket.IO | 3000 |
| `taskboard-client` | Angular 17 dev server | 4200 |

### 3. Access the app

Open [http://localhost:4200](http://localhost:4200) in your browser.

### 4. Seed users (optional)

The application auto-seeds default users on first startup when the users collection is empty. To manually re-seed:

```bash
docker compose exec server npm run seed
```

To insert randomized tasks for stress testing (defaults to 500, accepts an optional count):

```bash
docker compose exec server npm run seed:stress
docker compose exec server npm run seed:stress -- 1000
```

### Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@taskboard.com | admin123 | Admin |
| user1@taskboard.com | user123 | User |
| user2@taskboard.com | user123 | User |

## API Reference

All endpoints (except login and health) require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password, returns JWT token |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (paginated). Query params: `page`, `limit`, `status`, `priority`, `assignee` |
| GET | `/api/tasks/:id` | Get a single task |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| PATCH | `/api/tasks/:id/status` | Quick status update (body: `{ status }`) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (for assignee dropdown) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### Pagination

The `GET /api/tasks` endpoint supports offset-based pagination:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | - | Page number (1-indexed) |
| `limit` | 20 | 100 | Items per page |

The response includes a `meta` object alongside `data`:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "total": 500, "page": 1, "limit": 20 },
  "statusCode": 200
}
```

## Real-Time Features

The application uses Socket.IO for real-time synchronization across all connected clients:

- **Task Created** — when any user creates a task, it instantly appears on all other clients
- **Task Updated** — edits are broadcast to all clients in real-time
- **Task Deleted** — deletions are reflected across all clients immediately
- **Task Locking** — visual lock indicators show when another user is editing a task
- **Connection Handling** — a banner notifies users of connection loss, and tasks are re-fetched on reconnection

### Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `task:created` | Server → Client | Full task object |
| `task:updated` | Server → Client | Full task object |
| `task:deleted` | Server → Client | `{ taskId }` |
| `task:locked` | Server → Client | `{ taskId, lockedBy: { userId, displayName } }` |
| `task:unlocked` | Server → Client | `{ taskId }` |
| `task:lock` | Client → Server | `taskId` |
| `task:unlock` | Client → Server | `taskId` |

## Task Locking

Task locking prevents concurrent edits:

1. When a user opens the edit dialog, a `task:lock` event is emitted
2. The server sets `lockedBy` and `lockedAt` on the task document and broadcasts `task:locked` to all clients
3. Other clients see a lock indicator on the task card and cannot edit or delete it
4. The lock is released when the user saves, cancels, or disconnects
5. A periodic cleanup (every 60 seconds) auto-expires stale locks older than 5 minutes

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://mongo:27017/taskboard` | MongoDB connection string |
| `JWT_SECRET` | `taskboard-dev-secret-key-change-in-production` | Secret for signing JWTs |
| `JWT_EXPIRATION` | `24h` | JWT token expiration |
| `SERVER_PORT` | `3000` | Backend server port |
| `CLIENT_PORT` | `4200` | Frontend dev server port |
| `NODE_ENV` | `development` | Node environment |

## Project Structure

```
realtime-taskboard/
├── docker-compose.yml
├── .env.example
├── README.md
├── client/                          # Angular 17 Frontend
│   ├── Dockerfile
│   ├── angular.json
│   ├── proxy.conf.json              # Dev proxy for /api and /socket.io
│   └── src/
│       ├── index.html
│       ├── main.ts
│       ├── styles.scss              # Global styles + self-hosted font @font-face
│       ├── assets/
│       │   └── fonts/               # Self-hosted Roboto + Material Icons (woff2)
│       └── app/
│           ├── app.component.ts     # Root component (bfcache pagehide/pageshow)
│           ├── app.config.ts
│           ├── app.routes.ts
│           ├── core/                # Singleton services, guards, interceptors
│           │   ├── services/        # AuthService, SocketService, TaskService, UserService
│           │   ├── guards/          # AuthGuard
│           │   └── interceptors/    # JwtInterceptor
│           ├── features/
│           │   ├── auth/            # Login component
│           │   └── tasks/           # TaskList, TaskDialog, TaskCard, DeleteConfirm
│           ├── shared/
│           │   └── components/
│           │       └── layout/      # App toolbar + layout shell
│           └── models/              # Task and User TypeScript interfaces
└── server/                          # Node.js Backend
    ├── Dockerfile
    └── src/
        ├── app.ts                   # Entry point, DI wiring, route registration
        ├── config/                  # Database connection, environment vars
        ├── controllers/             # Auth, Task, User controllers
        ├── middleware/              # JWT auth, error handling
        ├── models/                  # Mongoose schemas (User, Task)
        ├── repositories/            # BaseRepository, TaskRepository, UserRepository
        ├── services/                # Auth, Task, User services
        ├── socket/                  # Socket.IO setup, handlers, lock expiry cleanup
        ├── routes/                  # auth.routes, task.routes, user.routes
        ├── seed/
        │   ├── default-users.ts     # Shared default user definitions
        │   ├── auto-seed.ts         # Auto-seed on first startup (empty collection)
        │   ├── manual-seed.ts       # Manual seed CLI (drops and re-seeds users)
        │   └── stress-seed.ts       # Stress-test seed (insert N randomized tasks)
        ├── types/                   # TypeScript interfaces and enums
        └── utils/                   # Password hashing, response factory
```
