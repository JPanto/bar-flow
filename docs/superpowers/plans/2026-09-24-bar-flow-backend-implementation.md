# BarFlow Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, scalable TypeScript backend for BarFlow with Fastify, Drizzle ORM, PostgreSQL (Neon), native WebSockets, and an idempotent Outbox synchronization engine, structured under Hexagonal Architecture and prepared for 100% free deployment on Koyeb.

**Architecture:** Hexagonal Architecture (Ports & Adapters) separating Domain entities and rules, Application use cases and DTOs, and Infrastructure adapters (Fastify HTTP, Fastify WebSockets, Drizzle ORM with Postgres).

**Tech Stack:** Node.js 22 LTS, TypeScript 5, Fastify 5, `@fastify/websocket`, `@fastify/cors`, Drizzle ORM, `@neondatabase/serverless`, Zod, Vitest, Supertest.

**Spec:** `docs/superpowers/specs/2026-09-24-bar-flow-backend-design.md`

## Global Constraints

- Backend directory: `/Users/jersondanielpantojaduarte/Documents/Bar MVP/backend` (with its own standalone git repository).
- Main frontend repository ignores `backend/` in `.gitignore`.
- TypeScript strict mode enabled (`noImplicitAny`, `strictNullChecks`).
- All use cases must be unit-testable with mock repositories without requiring a live database.
- Idempotent synchronization via `client_event_id` in `sync_audit_log`.
- WebSockets compatible with frontend `RealtimeEvent` payload structure (`{ type, payload, timestamp }`).

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/config/env.ts`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Test: `backend/tests/config.test.ts`
- Modify: `.gitignore` (root repo ignores `backend/`)

**Interfaces:**
- Produces: `env` validated config object `{ PORT, NODE_ENV, DATABASE_URL, CORS_ORIGIN }`.

- [ ] **Step 1: Update root `.gitignore` to ignore `backend/`**
- [ ] **Step 2: Initialize `backend/package.json` with scripts and dependencies**
  - Dependencies: `fastify`, `@fastify/websocket`, `@fastify/cors`, `drizzle-orm`, `@neondatabase/serverless`, `pg`, `zod`, `dotenv`
  - DevDependencies: `typescript`, `@types/node`, `@types/pg`, `drizzle-kit`, `vitest`, `supertest`, `tsx`
- [ ] **Step 3: Create `backend/tsconfig.json`**
- [ ] **Step 4: Write failing test for environment configuration in `backend/tests/config.test.ts`**
- [ ] **Step 5: Implement `backend/src/config/env.ts` with Zod validation**
- [ ] **Step 6: Run `npm test` in `backend/` to verify test passes**
- [ ] **Step 7: Commit changes**

---

### Task 2: Domain Entities and Repository Interfaces

**Files:**
- Create: `backend/src/domain/entities/Zone.ts`
- Create: `backend/src/domain/entities/Table.ts`
- Create: `backend/src/domain/entities/TableSession.ts`
- Create: `backend/src/domain/entities/WaiterCall.ts`
- Create: `backend/src/domain/entities/Reservation.ts`
- Create: `backend/src/domain/repositories/ITableRepository.ts`
- Create: `backend/src/domain/repositories/ITableSessionRepository.ts`
- Create: `backend/src/domain/repositories/IWaiterCallRepository.ts`
- Create: `backend/src/domain/repositories/ISyncAuditRepository.ts`
- Test: `backend/tests/domain/entities.test.ts`

**Interfaces:**
- Produces: Domain entity types (`Zone`, `RestaurantTable`, `TableSession`, `WaiterCall`, `Reservation`) and repository contracts (`ITableRepository`, `ITableSessionRepository`, `IWaiterCallRepository`, `ISyncAuditRepository`).

- [ ] **Step 1: Write failing test in `backend/tests/domain/entities.test.ts`**
- [ ] **Step 2: Implement domain entities in `backend/src/domain/entities/`**
- [ ] **Step 3: Define repository interfaces in `backend/src/domain/repositories/`**
- [ ] **Step 4: Run tests to confirm entities pass validation**
- [ ] **Step 5: Commit changes**

---

### Task 3: Drizzle ORM Schema & Database Client

**Files:**
- Create: `backend/src/infrastructure/db/schema.ts`
- Create: `backend/src/infrastructure/db/client.ts`
- Create: `backend/drizzle.config.ts`
- Test: `backend/tests/infrastructure/schema.test.ts`

**Interfaces:**
- Consumes: Domain enum definitions.
- Produces: Drizzle schemas (`zones`, `restaurantTables`, `tableSessions`, `waiterCalls`, `reservations`, `syncAuditLog`) and `db` client instance.

- [ ] **Step 1: Write test in `backend/tests/infrastructure/schema.test.ts` checking schema exports and table definitions**
- [ ] **Step 2: Implement `backend/src/infrastructure/db/schema.ts` with PostgreSQL tables, indexes, and enums**
- [ ] **Step 3: Implement `backend/src/infrastructure/db/client.ts` supporting both direct Postgres pool and Neon serverless driver**
- [ ] **Step 4: Create `backend/drizzle.config.ts`**
- [ ] **Step 5: Run tests and verify schema validity**
- [ ] **Step 6: Commit changes**

---

### Task 4: Application Use Cases & Outbox Sync Engine (TDD)

**Files:**
- Create: `backend/src/application/dtos/syncDto.ts`
- Create: `backend/src/application/dtos/callDto.ts`
- Create: `backend/src/application/ports/IWebSocketHub.ts`
- Create: `backend/src/application/use-cases/SyncOutboxBatchUseCase.ts`
- Create: `backend/src/application/use-cases/CreateWaiterCallUseCase.ts`
- Create: `backend/src/application/use-cases/AttendWaiterCallUseCase.ts`
- Create: `backend/src/application/use-cases/ResolveWaiterCallUseCase.ts`
- Create: `backend/src/application/use-cases/GetInitialStateUseCase.ts`
- Test: `backend/tests/application/syncOutbox.test.ts`
- Test: `backend/tests/application/waiterCalls.test.ts`

**Interfaces:**
- Consumes: Domain repository interfaces and `IWebSocketHub`.
- Produces: `SyncOutboxBatchUseCase`, `CreateWaiterCallUseCase`, `AttendWaiterCallUseCase`, `ResolveWaiterCallUseCase`, `GetInitialStateUseCase`.

- [ ] **Step 1: Write failing unit test in `backend/tests/application/syncOutbox.test.ts` using in-memory mock repositories**
- [ ] **Step 2: Implement `SyncOutboxBatchUseCase` with deduplication and Last-Write-Wins logic**
- [ ] **Step 3: Verify `syncOutbox.test.ts` passes**
- [ ] **Step 4: Write failing unit test in `backend/tests/application/waiterCalls.test.ts`**
- [ ] **Step 5: Implement `CreateWaiterCallUseCase`, `AttendWaiterCallUseCase`, and `ResolveWaiterCallUseCase`**
- [ ] **Step 6: Verify `waiterCalls.test.ts` passes**
- [ ] **Step 7: Commit changes**

---

### Task 5: Drizzle Repository Implementations

**Files:**
- Create: `backend/src/infrastructure/repositories/DrizzleTableRepository.ts`
- Create: `backend/src/infrastructure/repositories/DrizzleSessionRepository.ts`
- Create: `backend/src/infrastructure/repositories/DrizzleCallRepository.ts`
- Create: `backend/src/infrastructure/repositories/DrizzleSyncAuditRepository.ts`
- Test: `backend/tests/infrastructure/repositories.test.ts`

**Interfaces:**
- Consumes: Drizzle schemas and database client.
- Produces: Implementations of `ITableRepository`, `ITableSessionRepository`, `IWaiterCallRepository`, `ISyncAuditRepository`.

- [ ] **Step 1: Write repository tests in `backend/tests/infrastructure/repositories.test.ts`**
- [ ] **Step 2: Implement `DrizzleSyncAuditRepository`**
- [ ] **Step 3: Implement `DrizzleTableRepository`**
- [ ] **Step 4: Implement `DrizzleSessionRepository`**
- [ ] **Step 5: Implement `DrizzleCallRepository`**
- [ ] **Step 6: Run tests and verify implementations**
- [ ] **Step 7: Commit changes**

---

### Task 6: Real-time WebSocket Hub

**Files:**
- Create: `backend/src/infrastructure/ws/FastifyWebSocketHub.ts`
- Test: `backend/tests/infrastructure/websocketHub.test.ts`

**Interfaces:**
- Consumes: `IWebSocketHub` port.
- Produces: `FastifyWebSocketHub` with channels (`staff`, `table:<id>`), subscriber registration, heartbeat ping/pong, and broadcast capabilities.

- [ ] **Step 1: Write failing test in `backend/tests/infrastructure/websocketHub.test.ts` testing topic subscription and message routing**
- [ ] **Step 2: Implement `FastifyWebSocketHub` handling connection lifecycle, channel maps, and message broadcasting**
- [ ] **Step 3: Verify `websocketHub.test.ts` passes**
- [ ] **Step 4: Commit changes**

---

### Task 7: Fastify HTTP Server, REST Routes & Server Bootstrapping

**Files:**
- Create: `backend/src/infrastructure/http/routes/healthRoutes.ts`
- Create: `backend/src/infrastructure/http/routes/syncRoutes.ts`
- Create: `backend/src/infrastructure/http/routes/stateRoutes.ts`
- Create: `backend/src/infrastructure/http/server.ts`
- Create: `backend/src/index.ts`
- Test: `backend/tests/http/api.test.ts`

**Interfaces:**
- Consumes: All use cases, Drizzle repositories, and WebSocket hub.
- Produces: Fastify HTTP/WS application instance listening on `env.PORT`.

- [ ] **Step 1: Write failing integration test in `backend/tests/http/api.test.ts` testing `GET /health` and `POST /api/sync`**
- [ ] **Step 2: Implement `healthRoutes.ts`, `syncRoutes.ts`, and `stateRoutes.ts`**
- [ ] **Step 3: Implement `server.ts` assembling Fastify plugins, CORS, WebSocket, and routes**
- [ ] **Step 4: Implement `index.ts` bootstrapping the application**
- [ ] **Step 5: Run integration tests to ensure HTTP and WS routes work**
- [ ] **Step 6: Commit changes**

---

### Task 8: Git Repository Initialization & Deployment Configuration

**Files:**
- Create: `backend/README.md`
- Create: `backend/.env.example`
- Initialize standalone Git repo in `backend/`

- [ ] **Step 1: Create comprehensive `backend/README.md` with Neon Postgres setup instructions, environment variables, local testing, and Koyeb deployment guide**
- [ ] **Step 2: Initialize Git in `backend/` (`git init`), create initial commit on `main`**
- [ ] **Step 3: Commit backend scaffolding and docs in the parent repository**

---

### Task 9: End-to-End Verification & Production Build

- [ ] **Step 1: Run `npm run test` across all backend test suites**
- [ ] **Step 2: Run `npm run build` (`tsc -b`) to verify 0 compiler errors**
- [ ] **Step 3: Test production launch `node dist/index.js` healthcheck**
- [ ] **Step 4: Document results and provide Koyeb/Neon setup steps to the user**
