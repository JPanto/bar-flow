# Bar & Gastrobar Table & Reservation System (PWA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Minimum Viable Product (MVP) of an offline-first Progressive Web App (PWA) for bar/gastrobar/restaurant management, featuring an interactive 2D floor plan (croquis) with free drag-and-drop tables/chairs (React-Konva), reservation management, table status tracking, and a normalized IndexedDB database (Dexie.js) with an Outbox Pattern for future cloud/WebSocket sync.

**Architecture:** Client-side React 18/19 with TypeScript and Tailwind CSS. State is stored reactively in IndexedDB using Dexie.js with an outbox sync queue table (`sync_queue`) tracking all mutations. The interactive croquis uses React-Konva with separate layers for snap-to-grid, table nodes with calculated perimeter chairs, and transform handles. The application offers two distinct modes: **Editor Mode** (designing the floor plan) and **In-Service Mode** (live operations, seating guests, and status updates), alongside a dedicated **Reservations** agenda.

**Tech Stack:** React 19 / Vite / TypeScript / Tailwind CSS / Lucide React / Konva / React-Konva / Dexie / Dexie-react-hooks / vite-plugin-pwa / Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-23-bar-table-reservations-pwa-design.md`](file:///Users/jersondanielpantojaduarte/Documents/Bar%20MVP/docs/superpowers/specs/2026-09-23-bar-table-reservations-pwa-design.md)

## Global Constraints

- Standalone offline-first execution via IndexedDB; zero network requirement to operate.
- Strict TypeScript types for all database entities, props, and geometric calculations.
- Normalized schema in Dexie (`zones`, `tables`, `reservations`, `customers`, `sync_queue`).
- Outbox event log generated on all mutating actions (`INSERT`, `UPDATE`, `DELETE`).
- Smooth drag-and-drop with snap-to-grid toggle (20px).
- PWA manifest and service worker configured for mobile/tablet installability.

---

### Task 1: Project Scaffolding & Dependencies Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

**Interfaces:**
- Produces: Working React + Vite + Tailwind + Vitest development environment with Konva, Dexie, and PWA plugins installed.

- [ ] **Step 1: Create package.json and project configuration files**
Scaffold dependencies: `react`, `react-dom`, `konva`, `react-konva`, `dexie`, `dexie-react-hooks`, `lucide-react`, `clsx`, `tailwind-merge`, and dev dependencies: `vite`, `typescript`, `@types/react`, `@types/react-dom`, `tailwindcss`, `autoprefixer`, `postcss`, `vite-plugin-pwa`, `vitest`, `fake-indexeddb`.

- [ ] **Step 2: Create Vite, Tailwind, and TypeScript configurations**
Configure Vite with React, Tailwind, and Vitest test environment (using jsdom and `fake-indexeddb`).

- [ ] **Step 3: Run npm install**
Run: `npm install`
Expected: Successfully installs all packages with lockfile generated.

- [ ] **Step 4: Verify test runner works**
Create `tests/setup.test.ts` to test simple assertion.
Run: `npx vitest run tests/setup.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json tailwind.config.js postcss.config.js index.html src/ vitest.config.ts tests/
git commit -m "chore: scaffold react vite tailwind konva and dexie project"
```

---

### Task 2: Database Schema, Relational Types & Outbox Store (Dexie.js)

**Files:**
- Create: `src/types/database.ts`
- Create: `src/db/index.ts`
- Create: `src/db/seed.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Produces:
  - Types: `Zone`, `TableElement`, `TableShape`, `TableStatus`, `Reservation`, `ReservationStatus`, `SyncEvent`.
  - Database instance: `db` (`BarMvpDB` extending `Dexie`).
  - Outbox transactional helpers: `createTable`, `updateTable`, `deleteTable`, `createReservation`, `updateReservationStatus`, `updateTableStatus`, `createZone`.
  - Seeder: `seedInitialData(db)`.

- [ ] **Step 1: Write failing database test**
Test creating a zone, inserting a table, updating its status, and asserting that `sync_queue` received corresponding pending outbox events.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/db.test.ts`
Expected: FAIL (modules not found).
- [ ] **Step 3: Implement database types and Dexie DB with Outbox pattern**
Implement `src/types/database.ts`, `src/db/index.ts` with stores:
`zones: 'id, name, isDefault, createdAt'`,
`tables: 'id, zoneId, name, status, shape, seats, updatedAt'`,
`reservations: 'id, tableId, date, time, status, customerName, createdAt'`,
`sync_queue: '++id, entity, action, entityId, status, createdAt'`.
Implement automatic outbox event logging in transaction helpers.
- [ ] **Step 4: Implement seedInitialData**
Populate demo data (1 Main Zone, 6 configured tables of different shapes/sizes, and 2 sample reservations).
- [ ] **Step 5: Run tests to verify they pass**
Run: `npx vitest run tests/db.test.ts`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/types/database.ts src/db/ tests/db.test.ts
git commit -m "feat: implement dexie database with outbox pattern and seed data"
```

---

### Task 3: Chair Geometry & Spatial Layout Utilities

**Files:**
- Create: `src/utils/chairGeometry.ts`
- Test: `tests/chairGeometry.test.ts`

**Interfaces:**
- Produces:
  - Function: `getChairsForTable(shape: TableShape, width: number, height: number, seats: number): ChairPosition[]`
  - Type: `ChairPosition = { x: number; y: number; rotation: number; size: number }`

- [ ] **Step 1: Write failing tests for chair geometry**
Assert that for round tables with 4 seats, 4 chairs are positioned symmetrically at radial distance around 360/4 degrees.
Assert that for rectangular tables with 6 seats, chairs are distributed along the long sides and ends.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/chairGeometry.test.ts`
Expected: FAIL.
- [ ] **Step 3: Implement `getChairsForTable`**
Compute geometric coordinates relative to table center/bounds with proper rotation angles for round, square, rectangular, and counter/bar shapes.
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/chairGeometry.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/utils/chairGeometry.ts tests/chairGeometry.test.ts
git commit -m "feat: implement parametric chair geometry calculation"
```

---

### Task 4: Interactive Croquis Canvas Engine (React-Konva)

**Files:**
- Create: `src/components/croquis/GridBackground.tsx`
- Create: `src/components/croquis/TableNode.tsx`
- Create: `src/components/croquis/CroquisCanvas.tsx`
- Test: `tests/TableNode.test.ts`

**Interfaces:**
- Consumes: `TableElement`, `getChairsForTable`, `db`
- Produces:
  - `CroquisCanvas`: Full Konva Stage with Pan & Zoom controls, grid snapping (20px), table rendering, and transformer for selection.
  - `TableNode`: Konva Group rendering table body (circle, rect), perimeter chairs, table name, seat badge, and status color fill/stroke.

- [ ] **Step 1: Write unit tests for table color and status helpers**
- [ ] **Step 2: Implement GridBackground**
Renders subtle dot or line grid matching 20px intervals with stage scaling.
- [ ] **Step 3: Implement TableNode**
Draws table shape with rounded corners or circle, perimeter chairs from `getChairsForTable`, text label, and visual status indication. Handles drag start, drag move (with optional snap-to-grid rounding `Math.round(val / 20) * 20`), and drag end saving to database.
- [ ] **Step 4: Implement CroquisCanvas**
Renders Stage, Layers, Transformer (when in Editor mode), Pan/Zoom handling via pointer drag and wheel events, and selection state.
- [ ] **Step 5: Verify tests and rendering**
Run: `npx vitest run tests/TableNode.test.ts`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/components/croquis/ tests/TableNode.test.ts
git commit -m "feat: implement interactive croquis canvas engine with react-konva"
```

---

### Task 5: Floor Plan Editor Controls & Table Property Inspector

**Files:**
- Create: `src/components/croquis/EditorToolbar.tsx`
- Create: `src/components/croquis/TableInspectorModal.tsx`
- Create: `src/components/croquis/ZoneTabs.tsx`
- Test: `tests/EditorToolbar.test.tsx`

**Interfaces:**
- Produces:
  - `EditorToolbar`: Floating palette to add Mesa Redonda (2p/4p), Mesa Cuadrada (2p/4p), Mesa Rectangular (6p/8p), Barra/Counter, toggle Snap-to-Grid, and zoom controls.
  - `TableInspectorModal`: Modal/drawer to edit table name, number of seats, width/height, or delete table.
  - `ZoneTabs`: Selector to switch between zones (Salón Principal, Terraza, Barra) and create new zones.

- [ ] **Step 1: Implement ZoneTabs**
Loads active zones from Dexie `useLiveQuery`, allows switching active zone and adding a new zone.
- [ ] **Step 2: Implement EditorToolbar**
Adds predefined table archetypes into current zone coordinates with default dimensions.
- [ ] **Step 3: Implement TableInspectorModal**
Allows modifying table name, capacity (`seats`), and provides confirmation modal to delete table.
- [ ] **Step 4: Run component tests**
Run: `npx vitest run tests/EditorToolbar.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/components/croquis/ tests/EditorToolbar.test.tsx
git commit -m "feat: implement floor plan editor toolbar, zone selector, and inspector"
```

---

### Task 6: Live Service Mode & Quick Table Operations

**Files:**
- Create: `src/components/service/TableServiceModal.tsx`
- Create: `src/components/service/ServiceStatsBar.tsx`
- Test: `tests/TableServiceModal.test.tsx`

**Interfaces:**
- Consumes: `TableElement`, `Reservation`, `updateTableStatus`, `updateReservationStatus`
- Produces:
  - `TableServiceModal`: Quick interactive card triggered on table click in Service Mode to:
    - Change status: Libre (available), Ocupada (occupied), Reservada (reserved), Bloqueada (blocked).
    - Seat walk-in guests directly (prompting guest count).
    - Link to pending reservation if one exists for this table.
    - Free table (sets status to available and completes reservation if active).
  - `ServiceStatsBar`: Top summary showing live table count: Disponibles, Ocupadas, Reservadas, Capacidad Total.

- [ ] **Step 1: Write test for table status transitions and outbox events**
- [ ] **Step 2: Implement TableServiceModal**
Renders current table info, seat capacity, active reservation (if any), and one-tap action buttons (Ocupar, Liberar, Reservar, Bloquear).
- [ ] **Step 3: Implement ServiceStatsBar**
Calculates live counts from tables in active zone.
- [ ] **Step 4: Run tests**
Run: `npx vitest run tests/TableServiceModal.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/components/service/ tests/TableServiceModal.test.tsx
git commit -m "feat: implement live table service operations and operational stats"
```

---

### Task 7: Reservations Module & Daily Timeline

**Files:**
- Create: `src/components/reservations/ReservationView.tsx`
- Create: `src/components/reservations/ReservationList.tsx`
- Create: `src/components/reservations/ReservationModal.tsx`
- Create: `src/components/reservations/DateSelector.tsx`
- Test: `tests/reservations.test.ts`

**Interfaces:**
- Produces:
  - `ReservationView`: Complete reservations agenda screen.
  - `ReservationModal`: Form to create or edit reservation (Customer, Phone, Date, Time, Pax, Notes, Table selection).
  - `DateSelector`: Quick day toggle (Hoy, Mañana, selector de fecha).
  - Table auto-sync: marking a reservation as "sentada" immediately sets table to `occupied`.

- [ ] **Step 1: Write failing reservation service test**
Test reservation CRUD, date filtering, and table assignment sync.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/reservations.test.ts`
Expected: FAIL.
- [ ] **Step 3: Implement DateSelector, ReservationModal, and ReservationList**
Include pax selector, customer fields, available table dropdown filtered by capacity (`table.seats >= pax`), and status badges.
- [ ] **Step 4: Implement "Sentar ahora" action**
Changes reservation status to `seated` and updates `table.status` to `occupied` in a single Dexie transaction with outbox logging.
- [ ] **Step 5: Run tests to verify they pass**
Run: `npx vitest run tests/reservations.test.ts`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/components/reservations/ tests/reservations.test.ts
git commit -m "feat: implement reservations agenda with smart table assignment and live sync"
```

---

### Task 8: PWA Configuration, Offline Monitor & JSON Backup / Restore

**Files:**
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/common/BackupModal.tsx`
- Create: `src/utils/backup.ts`
- Modify: `vite.config.ts` (PWA setup)
- Modify: `src/App.tsx` (App layout, navigation between Servicio, Croquis Editor, Reservas)
- Test: `tests/backup.test.ts`

**Interfaces:**
- Produces:
  - `Navbar`: Mode switcher (`[En Servicio]`, `[Editor de Croquis]`, `[Reservas]`), Offline/Online indicator, pending sync badge, and backup button.
  - `exportDatabaseToJson` & `importDatabaseFromJson`: Offline backup and restore utilities.
  - PWA service worker with manifest (`name: 'Bar & Resto Flow'`).

- [ ] **Step 1: Write tests for exportDatabaseToJson and importDatabaseFromJson**
Verify round-trip export and restore of zones, tables, reservations, and sync queue.
- [ ] **Step 2: Implement backup utility and BackupModal**
Allows instant download of `bar-resto-backup-YYYY-MM-DD.json` and upload/restore with validation.
- [ ] **Step 3: Configure vite-plugin-pwa in vite.config.ts**
Configure icons, theme color `#0f172a`, background color `#020617`, and offline service worker strategies.
- [ ] **Step 4: Integrate complete App.tsx with Navbar and tabs**
Wire up active tab, seed initial data on first launch, handle online/offline network events.
- [ ] **Step 5: Run tests**
Run: `npx vitest run tests/backup.test.ts`
Expected: PASS.
- [ ] **Step 6: Commit**
```bash
git add src/components/layout/ src/components/common/ src/utils/backup.ts vite.config.ts src/App.tsx tests/backup.test.ts
git commit -m "feat: implement pwa offline caching, sync monitor, and json backup restore"
```

---

### Task 9: Full End-to-End Verification & Production Build

**Files:**
- Test: All tests in `tests/`
- Build artifacts in `dist/`

- [ ] **Step 1: Run full test suite**
Run: `npx vitest run`
Expected: All test suites PASS without warnings or regressions.
- [ ] **Step 2: Run TypeScript check and Vite production build**
Run: `npm run build`
Expected: Zero TypeScript errors; `dist/` folder generated with optimized assets, PWA manifest, and service worker.
- [ ] **Step 3: Verify preview**
Verify that service worker, canvas, and UI render cleanly.
- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "chore: verify test suite and production build"
```
