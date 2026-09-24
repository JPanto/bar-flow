# BarFlow Backend: Arquitectura, Sincronización Outbox, WebSockets y Despliegue

- **Fecha**: 2026-09-24
- **Proyecto**: BarFlow Gastrobar Management System
- **Componente**: Backend API & Real-time Hub
- **Estado**: Aprobado por el usuario

---

## 1. Contexto y Objetivos

BarFlow es una aplicación web progresiva (PWA) de gestión integral para bares y gastrobartes con capacidades offline-first (IndexedDB / Dexie v2), croquis interactivo de mesas, sesiones con códigos gastronómicos dinámicos y un sistema de llamados al mesero con semáforo cromático continuo.

El objetivo de este backend es:
1. Proveer persistencia centralizada y duradera en la nube con **PostgreSQL**.
2. Ofrecer un **Endpoint de Sincronización Idempotente (`POST /api/sync`)** que ingiera y resuelva en bloque las mutaciones generadas en el Outbox (`sync_queue`) del frontend.
3. Distribuir eventos en tiempo real mediante un **Hub de WebSockets bidireccional (`/ws`)** conectado con el `realtimeService` del frontend (campana de meseros, llamados de mesa, actualización del croquis).
4. Establecer una base escalable con **Arquitectura Hexagonal (Puertos y Adaptadores)** preparada para la futura incorporación del módulo de comandas, cocina (KDS), facturación e inventario.
5. Permitir un despliegue **100% gratuito** continuo desde GitHub sin costos de servidor ni caídas molestas.

---

## 2. Decisiones Tecnológicas (Stack)

| Componente | Tecnología | Justificación |
|---|---|---|
| **Lenguaje** | **TypeScript 5+ / Node.js 22 LTS** | Tipado estricto de punta a punta e interoperabilidad total con los contratos del frontend. |
| **Framework HTTP** | **Fastify 5** | Hasta 4-5x más rápido que Express y menor consumo de memoria (~30-50MB RAM en reposo), esencial para tiers gratuitos. |
| **Tiempo Real** | **`@fastify/websocket` (`ws`)** | WebSockets nativos de alto rendimiento embebidos en el mismo puerto y servidor HTTP sin capas intermedias pesadas. |
| **ORM / Migraciones** | **Drizzle ORM + `drizzle-kit`** | Tipado SQL-like sin sobrecarga binaria de motores externos; consultas ultra rápidas y generación limpia de migraciones. |
| **Base de Datos** | **PostgreSQL (Neon.tech)** | Base de datos relacional serverless gratuita (0.5 GB), con connection pooling integrado y branching. |
| **Validación** | **Zod** | Esquemas de validación en tiempo de ejecución para DTOs, payloads de sincronización y variables de entorno. |
| **Testing** | **Vitest + Supertest** | Pruebas unitarias de casos de uso y pruebas de integración HTTP/WS rápidas y compartibles. |
| **Hosting Cloud** | **Koyeb (o Render)** | Servicio Nano gratuito sin *cold sleeps* severos y soporte nativo para WebSockets persistentes con SSL. |

---

## 3. Arquitectura del Sistema (Hexagonal / Ports & Adapters)

El backend se estructura en tres capas desacopladas:

```text
bar-flow-backend/
├── src/
│   ├── domain/                         # Entidades puras y reglas de negocio del bar
│   │   ├── entities/
│   │   │   ├── Table.ts
│   │   │   ├── Zone.ts
│   │   │   ├── TableSession.ts
│   │   │   ├── WaiterCall.ts
│   │   │   └── Reservation.ts
│   │   └── repositories/               # Interfaces/Puertos de datos (sin SQL)
│   │       ├── ITableRepository.ts
│   │       ├── ITableSessionRepository.ts
│   │       ├── IWaiterCallRepository.ts
│   │       └── ISyncAuditRepository.ts
│   │
│   ├── application/                    # Casos de uso de la aplicación
│   │   ├── dtos/                       # Objetos de transferencia y validación Zod
│   │   ├── ports/                      # Puertos de salida secundarios (WebSockets)
│   │   │   └── IWebSocketHub.ts
│   │   └── use-cases/
│   │       ├── SyncOutboxBatchUseCase.ts
│   │       ├── CreateWaiterCallUseCase.ts
│   │       ├── AttendWaiterCallUseCase.ts
│   │       ├── ResolveWaiterCallUseCase.ts
│   │       ├── StartTableSessionUseCase.ts
│   │       └── GetInitialStateUseCase.ts
│   │
│   ├── infrastructure/                 # Adaptadores tecnológicos y frameworks
│   │   ├── db/
│   │   │   ├── index.ts                # Conexión Postgres Neon pooler
│   │   │   └── schema.ts               # Tablas Drizzle ORM
│   │   ├── repositories/               # Implementaciones concretas con Drizzle
│   │   │   ├── DrizzleTableRepository.ts
│   │   │   ├── DrizzleSessionRepository.ts
│   │   │   ├── DrizzleCallRepository.ts
│   │   │   └── DrizzleSyncAuditRepository.ts
│   │   ├── http/                       # Rutas, controladores y plugins Fastify
│   │   │   ├── routes/
│   │   │   │   ├── syncRoutes.ts
│   │   │   │   ├── stateRoutes.ts
│   │   │   │   └── healthRoutes.ts
│   │   │   └── server.ts
│   │   └── ws/                         # Hub de WebSockets por canales
│   │       └── FastifyWebSocketHub.ts
│   │
│   ├── config/                         # Variables de entorno validadas con Zod
│   │   └── env.ts
│   └── index.ts                        # Bootstrapping y arranque
├── drizzle/                            # Migraciones SQL generadas
├── tests/                              # Suites unitarias y de integración
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## 4. Modelo de Datos Relacional (Drizzle ORM)

```typescript
// infrastructure/db/schema.ts
import { pgTable, uuid, varchar, integer, boolean, bigint, text, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const tableShapeEnum = pgEnum('table_shape', ['round', 'square', 'rectangle', 'counter']);
export const tableStatusEnum = pgEnum('table_status', ['available', 'occupied', 'reserved', 'blocked']);
export const callReasonEnum = pgEnum('call_reason', ['waiter', 'bill', 'help']);
export const callStatusEnum = pgEnum('call_status', ['pending', 'attending', 'resolved', 'cancelled']);
export const reservationStatusEnum = pgEnum('reservation_status', ['confirmed', 'seated', 'cancelled', 'no_show', 'completed']);

// 1. Zonas
export const zones = pgTable('zones', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

// 2. Mesas
export const restaurantTables = pgTable('restaurant_tables', {
  id: uuid('id').primaryKey(),
  zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  shape: tableShapeEnum('shape').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  rotation: integer('rotation').default(0).notNull(),
  seats: integer('seats').notNull(),
  status: tableStatusEnum('status').default('available').notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
}, (t) => [
  index('idx_tables_zone').on(t.zoneId),
  index('idx_tables_status').on(t.status),
]);

// 3. Sesiones y Códigos Dinámicos
export const tableSessions = pgTable('table_sessions', {
  id: uuid('id').primaryKey(),
  tableId: uuid('table_id').references(() => restaurantTables.id, { onDelete: 'cascade' }).notNull(),
  sessionWord: varchar('session_word', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'active' | 'closed'
  openedAt: bigint('opened_at', { mode: 'number' }).notNull(),
  closedAt: bigint('closed_at', { mode: 'number' }),
}, (t) => [
  index('idx_sessions_table_status').on(t.tableId, t.status),
]);

// 4. Llamados al Mesero (Cola FIFO)
export const waiterCalls = pgTable('waiter_calls', {
  id: uuid('id').primaryKey(),
  tableId: uuid('table_id').references(() => restaurantTables.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => tableSessions.id, { onDelete: 'cascade' }).notNull(),
  tableName: varchar('table_name', { length: 50 }).notNull(),
  sessionWord: varchar('session_word', { length: 50 }).notNull(),
  reason: callReasonEnum('reason').notNull(),
  status: callStatusEnum('status').default('pending').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  attendingAt: bigint('attending_at', { mode: 'number' }),
  resolvedAt: bigint('resolved_at', { mode: 'number' }),
}, (t) => [
  index('idx_calls_status_created').on(t.status, t.createdAt),
]);

// 5. Reservas
export const reservations = pgTable('reservations', {
  id: uuid('id').primaryKey(),
  tableId: uuid('table_id').references(() => restaurantTables.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 150 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }).notNull(),
  customerEmail: varchar('customer_email', { length: 150 }),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  time: varchar('time', { length: 10 }).notNull(), // HH:mm
  pax: integer('pax').notNull(),
  notes: text('notes'),
  status: reservationStatusEnum('status').default('confirmed').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (t) => [
  index('idx_reservations_date_status').on(t.date, t.status),
]);

// 6. Auditoría e Idempotencia de Sincronización Outbox
export const syncAuditLog = pgTable('sync_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientEventId: varchar('client_event_id', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 50 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  syncedAt: bigint('synced_at', { mode: 'number' }).notNull(),
}, (t) => [
  uniqueIndex('uq_sync_client_event').on(t.clientEventId),
]);
```

---

## 5. Protocolo de Sincronización Offline (`POST /api/sync`)

### Request:
```json
{
  "events": [
    {
      "id": "event-uuid-from-client-queue",
      "entity": "table_session",
      "action": "INSERT",
      "entityId": "session-uuid",
      "payload": {
        "id": "session-uuid",
        "tableId": "table-uuid",
        "sessionWord": "MOJITO-24",
        "status": "active",
        "openedAt": 1727189500000
      },
      "createdAt": 1727189500000
    }
  ]
}
```

### Proceso en Transacción ACID:
1. Deduplicación contra `sync_audit_log`: Si `clientEventId` ya existe, se omite de forma idempotente.
2. Inserción o actualización en la tabla correspondiente según el timestamp (`Last-Write-Wins`).
3. Registro de auditoría en `sync_audit_log`.
4. Emisión inmediata por WebSocket del evento de dominio correspondiente (`SESSION_STARTED`, etc.).

### Response:
```json
{
  "success": true,
  "syncedIds": ["event-uuid-from-client-queue"],
  "processedAt": 1727189501230
}
```

---

## 6. Hub de WebSockets (`/ws`)

### Conexión y Suscripción:
El cliente (staff o mesa) se conecta a `wss://api-url/ws` y opcionalmente envía un mensaje de identificación:
```json
{ "action": "subscribe", "channel": "staff" }
// o para una mesa particular:
{ "action": "subscribe", "channel": "table:table-uuid" }
```

### Eventos Difundidos:
- `CALL_CREATED`: Emitido a canal `staff` y al canal de la mesa.
- `CALL_ATTENDING`: Notifica que el mesero va en camino.
- `CALL_RESOLVED`: Notifica el cierre del llamado.
- `CALL_CANCELLED`: Notifica que el cliente canceló el llamado.
- `SESSION_STARTED`: Notifica que la mesa se ocupó y asignó su palabra.
- `SESSION_CLOSED`: Notifica que la mesa fue liberada.

---

## 7. Estrategia de Despliegue Gratuito

### Base de Datos: Neon.tech (PostgreSQL)
1. Cuenta gratuita en [neon.tech](https://neon.tech).
2. Crear proyecto `bar-flow-db`.
3. Copiar la cadena de conexión `DATABASE_URL` con pooling habilitado.

### Servidor: Koyeb (Recomendado) o Render
1. Cuenta gratuita en [koyeb.com](https://www.koyeb.com).
2. Crear nuevo servicio seleccionando el repositorio de GitHub del backend.
3. Build command: `npm run build`.
4. Run command: `npm start`.
5. Variables de entorno:
   - `DATABASE_URL`: Cadena de conexión de Neon.
   - `PORT`: `8000` (o `$PORT` asignado por Koyeb).
   - `NODE_ENV`: `production`.
6. Koyeb genera URL pública con HTTPS y WSS automáticos (ej. `https://bar-flow-api.koyeb.app`).

---

## 8. Verificación y Criterios de Aceptación
1. Compilación TypeScript sin errores (`tsc -b`).
2. Pruebas unitarias de casos de uso ejecutadas con Vitest y passing al 100%.
3. Endpoint `/health` responde `200 OK` con estado de base de datos.
4. Endpoint `/api/sync` procesa eventos en lote idempotentemente.
5. Servidor WebSocket admite conexiones de clientes y retransmite eventos en tiempo real.
