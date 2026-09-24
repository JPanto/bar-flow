# Table Sessions, Customer Portal & Real-time Waiter Calls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic gastronomic table session words (e.g., `MOJITO-24`), a responsive Customer Table Portal accessible by QR/URL, a real-time event bus (WebSockets + BroadcastChannel), and a waiter call queue with continuous chromatic urgency grading (smooth HSL gradient from green to yellow, orange, and pulsating red) with visual feedback on the croquis canvas.

**Architecture:** Dexie database version 2 migration adding `table_sessions` and `waiter_calls` tables. A multi-transport `RealtimeService` handles pub/sub events via `BroadcastChannel` (offline/local multi-tab) and WebSockets. Urgency is calculated dynamically every second with HSL hue interpolation. The Customer Portal at `/?mesa=:tableId` displays the session word and triggers calls, while the Waiter View displays a floating drawer and pulsating table halos on the React-Konva canvas.

**Tech Stack:** React 19 / Vite / TypeScript / Tailwind CSS / Lucide React / Konva / React-Konva / Dexie.js / Web Audio API / Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-24-table-sessions-and-waiter-calls-design.md`](file:///Users/jersondanielpantojaduarte/Documents/Bar%20MVP/docs/superpowers/specs/2026-09-24-table-sessions-and-waiter-calls-design.md)

## Global Constraints

- 100% offline-first compatibility: Must work completely offline via `BroadcastChannel` & IndexedDB without requiring an external WebSocket server.
- Continuous chromatic transition: Urgency colors must smoothly interpolate hues (145° Green -> 60° Yellow -> 25° Orange -> 0° Red) second-by-second.
- FIFO queue: Waiter calls are sorted strictly by `createdAt` ascending.
- Memorable words: Auto-generated format `[GASTRONOMIC_TERM]-[2_DIGITS]`.
- Strict TypeScript types with 0 compiler errors.

---

### Task 1: Database Migration & Schema Upgrade (TableSessions & WaiterCalls)

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/db/index.ts`
- Test: `tests/sessionsAndCalls.test.ts`

**Interfaces:**
- Produces:
  - Types: `TableSession`, `WaiterCall`, `CallReason`, `CallStatus`, `RealtimeEvent`.
  - Dexie stores: `table_sessions: 'id, tableId, sessionWord, status, openedAt, closedAt'`, `waiter_calls: 'id, tableId, sessionId, reason, status, createdAt'`.
  - Transaction helpers: `startTableSession`, `closeTableSession`, `getActiveSessionForTable`, `createWaiterCall`, `attendingWaiterCall`, `resolveWaiterCall`, `cancelWaiterCall`.

- [ ] **Step 1: Write failing test for table sessions and waiter calls**
Test creating an active session, generating a word, creating a waiter call, transitioning to "attending", and resolving the call.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/sessionsAndCalls.test.ts`
Expected: FAIL.
- [ ] **Step 3: Implement database types and Dexie version 2 schema**
Update `src/types/database.ts` and `src/db/index.ts` with stores and helpers.
- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/sessionsAndCalls.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/types/database.ts src/db/index.ts tests/sessionsAndCalls.test.ts
git commit -m "feat: add table_sessions and waiter_calls schema to dexie db"
```

---

### Task 2: Dynamic Word Generator Utility

**Files:**
- Create: `src/utils/wordGenerator.ts`
- Test: `tests/wordGenerator.test.ts`

**Interfaces:**
- Produces: `generateSessionWord(activeWords?: string[]): string`
  - Output format: `[WORD]-[10..99]` (e.g. `MOJITO-42`, `BURGER-15`)

- [ ] **Step 1: Write failing test for word generator**
Verify format regex `^[A-ZÑÁÉÍÓÚ]+-[0-9]{2}$` and collision avoidance when active words are provided.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/wordGenerator.test.ts`
Expected: FAIL.
- [ ] **Step 3: Implement wordGenerator**
Curate 30+ gastronomic and cocktail terms, pick random term and 2-digit number with collision retry.
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/wordGenerator.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/utils/wordGenerator.ts tests/wordGenerator.test.ts
git commit -m "feat: implement gastronomic session word generator"
```

---

### Task 3: Continuous Chromatic Urgency Calculator

**Files:**
- Create: `src/utils/urgencyGradient.ts`
- Test: `tests/urgencyGradient.test.ts`

**Interfaces:**
- Produces: `calculateUrgency(createdAt: number, currentTime?: number): UrgencyInfo`
  - `UrgencyInfo`: `{ secondsElapsed, hue, hslColor, hexColor, formattedTime, urgencyLabel, isCritical }`

- [ ] **Step 1: Write failing test for urgency gradient calculations**
Test 0s -> ~145° (Green), 120s -> ~60° (Yellow), 240s -> ~25° (Orange), 360s -> 0° (Red, isCritical: true).
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/urgencyGradient.test.ts`
Expected: FAIL.
- [ ] **Step 3: Implement urgency gradient calculation with HSL interpolation**
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/urgencyGradient.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/utils/urgencyGradient.ts tests/urgencyGradient.test.ts
git commit -m "feat: implement continuous chromatic urgency calculator"
```

---

### Task 4: Real-time Communication Bus (WebSockets + BroadcastChannel)

**Files:**
- Create: `src/services/realtime.ts`
- Test: `tests/realtime.test.ts`

**Interfaces:**
- Produces: `realtimeService` singleton with:
  - `publish(event: RealtimeEvent): void`
  - `subscribe(listener: (event: RealtimeEvent) => void): () => void`

- [ ] **Step 1: Write failing test for realtime service pub/sub**
Test event publishing and subscription callbacks using BroadcastChannel mock/implementation.
- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/realtime.test.ts`
Expected: FAIL.
- [ ] **Step 3: Implement realtimeService**
Implement dual-layer transport (WebSocket if `VITE_WS_URL` is set, with automatic `BroadcastChannel` local fallback).
- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/realtime.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add src/services/realtime.ts tests/realtime.test.ts
git commit -m "feat: implement realtime pub-sub bus with broadcast channel fallback"
```

---

### Task 5: Sound Alert Utility (Web Audio API Synthesizer)

**Files:**
- Create: `src/utils/soundAlert.ts`
- Test: `tests/soundAlert.test.ts`

**Interfaces:**
- Produces: `playServiceChime(): void` (synthesizes high harmonic chime sound via Web Audio API).

- [ ] **Step 1: Implement Web Audio API bell chime synthesizer**
- [ ] **Step 2: Verify audio synthesis in unit test**
- [ ] **Step 3: Commit**
```bash
git add src/utils/soundAlert.ts tests/soundAlert.test.ts
git commit -m "feat: implement web audio api synthesized service chime"
```

---

### Task 6: Customer Portal Mobile View (`/?mesa=:tableId`)

**Files:**
- Create: `src/components/customer/CustomerPortal.tsx`
- Test: `tests/CustomerPortal.test.ts`

**Interfaces:**
- Produces: `CustomerPortal` component rendering:
  - Table name & big session word badge (`MOJITO-24`).
  - Action buttons: "Llamar al Mesero", "Pedir la Cuenta", "Asistencia".
  - Live status card with smooth chromatic gradient progress bar, timer, and cancel option.

- [ ] **Step 1: Implement CustomerPortal component**
- [ ] **Step 2: Test customer portal helper logic**
- [ ] **Step 3: Commit**
```bash
git add src/components/customer/ tests/CustomerPortal.test.ts
git commit -m "feat: implement customer table mobile portal"
```

---

### Task 7: Waiter Calls Queue Drawer & Bell Notification

**Files:**
- Create: `src/components/service/CallsQueueDrawer.tsx`
- Modify: `src/components/layout/Navbar.tsx`

**Interfaces:**
- Produces:
  - `CallsQueueDrawer`: Slide-over panel showing active waiter calls in FIFO order, with ticking timer, continuous chromatic borders, and "En camino" / "Resolver" buttons.
  - `Navbar`: Bell icon button with glowing badge showing call count and highest urgency color.

- [ ] **Step 1: Implement CallsQueueDrawer component**
- [ ] **Step 2: Update Navbar with interactive bell trigger and live urgency badge**
- [ ] **Step 3: Commit**
```bash
git add src/components/service/CallsQueueDrawer.tsx src/components/layout/Navbar.tsx
git commit -m "feat: implement waiter calls queue drawer and navbar bell badge"
```

---

### Task 8: Croquis Table Node Glowing Call Halo & QR Code Modal

**Files:**
- Create: `src/components/croquis/TableQrModal.tsx`
- Modify: `src/components/croquis/TableNode.tsx`
- Modify: `src/components/service/TableServiceModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces:
  - `TableQrModal`: Modal displaying table URL and QR code for scanning from mobile.
  - `TableNode`: Renders animated chromatic glowing ring around table when an active call is pending.
  - `TableServiceModal`: Shows session word and button to view QR / test customer portal.
  - `App.tsx`: Automatic session creation when table is occupied, session closing on release, and route handling for `?mesa=...`.

- [ ] **Step 1: Implement TableQrModal with SVG QR generation**
- [ ] **Step 2: Update TableNode to render pulsing chromatic halo ring for calling tables**
- [ ] **Step 3: Update TableServiceModal to display active session word and QR launcher**
- [ ] **Step 4: Integrate routing in App.tsx to display CustomerPortal when ?mesa= is present**
- [ ] **Step 5: Commit**
```bash
git add src/components/croquis/TableQrModal.tsx src/components/croquis/TableNode.tsx src/components/service/TableServiceModal.tsx src/App.tsx
git commit -m "feat: integrate call halos on canvas, qr code launcher, and url routing"
```

---

### Task 9: End-to-End Verification & Production Build

**Files:**
- Test: All tests in `tests/`
- Build: `dist/`

- [ ] **Step 1: Run full test suite with Vitest**
Run: `npm run test`
Expected: 100% tests pass.
- [ ] **Step 2: Run TypeScript compiler check and Vite build**
Run: `npm run build`
Expected: 0 errors; clean production build with PWA service worker.
- [ ] **Step 3: Commit and push**
```bash
git add .
git commit -m "feat: complete table sessions, customer portal and realtime waiter calls"
```
