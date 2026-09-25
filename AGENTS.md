# AGENTS.md - Reglas Imperativas de Desarrollo de BarFlow SaaS

Este documento establece las directrices arquitectónicas, estándares de código y reglas operativas que **todos los agentes y desarrolladores deben respetar estrictamente** en cada sesión y prompt de desarrollo para BarFlow.

---

## 🏛️ 1. Arquitectura y Filosofía del Sistema

BarFlow es un SaaS diseñado para bares y restaurantes modernos con una arquitectura **Local-First / Offline-First**:
- **Cero latencia percibida:** La interfaz de usuario opera directamente contra **IndexedDB** local (a través de **Dexie.js** y `useLiveQuery`). La UI nunca debe bloquearse esperando respuestas HTTP de red.
- **Sincronización Bidireccional:** El frontend utiliza el **Patrón Outbox** (`sync_queue`) para encolar eventos de negocio persistidos localmente y evacuarlos al backend en lote.
- **Tiempo Real:** Se utiliza WebSocket con retransmisión de eventos de dominio en canales específicos (`staff`, `table:<id>`).
- **Equilibrio de Costos (Zero/Low Cost):** Todo el sistema en fase de validación debe correr en capas gratuitas: **Cloudflare Pages** (frontend), **Render / Koyeb Free Tier** (backend Fastify) y **Neon Serverless** (PostgreSQL). **No introducir servicios pagos ni sobreingeniería.**

---

## 📜 2. Reglas Imperativas de Código

### Regla 1: Límite de Tamaño y Responsabilidad Única (SRP)
- **Ningún componente o archivo debe superar las 300 líneas de código.**
- Si un componente crece en exceso (como ocurrió con el antiguo `App.tsx`), es **obligatorio** extraer la lógica de negocio hacia Custom Hooks (`useRealtimeSync`, `useTableManagement`, `useWaiterCalls`, etc.) o subcomponentes modulares.
- Los componentes deben encargarse exclusivamente de la renderización y orquestación de UI.

### Regla 2: Persistencia Local y Reactividad con `useLiveQuery`
- Toda mutación de estado que deba verse reflejada en la interfaz debe escribirse en la tabla correspondiente de Dexie (`db.<table_name>.put()` / `update()`).
- Los componentes deben suscribirse a los datos usando `useLiveQuery(...)`. No almacenar datos de colecciones en estados locales redundantes con `useState`.
- Toda mutación que cambie mesas, zonas, sesiones o llamados debe:
  1. Escribir en Dexie y encolar en `sync_queue`.
  2. Publicar en tiempo real vía `realtimeService.publish(...)`.
  3. Disparar sincronización inmediata vía `syncService.triggerSync()`.

### Regla 3: Seguridad y Validación en WebSockets
- El servidor WebSocket **nunca** debe retransmitir mensajes ciegos o payloads arbitrarios.
- Todo mensaje entrante debe validarse contra `ALLOWED_REALTIME_EVENTS`.
- Los paquetes entrantes deben tener límite de tamaño (máximo 64 KB) para prevenir ataques de denegación de servicio (DoS) por memoria.

### Regla 4: Idempotencia en la Ingesta del Backend
- Toda ingesta en `POST /api/sync` debe registrarse en `sync_audit_log` con clave única por evento (`clientEventId`).
- Si la conexión falla y el cliente reintenta enviar el mismo evento 10 veces, el servidor debe descartar duplicados sin generar inconsistencias en la base de datos.

### Regla 5: Modelado Matemático Continuo
- Para estados visuales temporales o de urgencia (como el semáforo dinámico de llamados de mesero), utilizar funciones matemáticas continuas en espacio HSL (`calculateUrgency`), evitando condicionales de salto brusco (`if/else`).

### Regla 6: Verificación Obligatoria Antes de Completar Cualquier Tarea
- **Siempre** ejecutar y verificar en la terminal antes de dar por terminada una tarea:
  - Frontend: `npm run test` (Vitest) y `npm run build` (`tsc -b && vite build`).
  - Backend: `npm run build` (`tsc`).
- **Cero tolerancia a errores de compilación de TypeScript.**

---

## 🛡️ 3. Directrices para Futuros Prompts y Módulos

Al planificar o implementar nuevos módulos (comandas de cocina KDS, facturación, control de inventario):
1. **Crear contratos de datos compartidos** en TypeScript (`types/database.ts` en front, `entities/` en backend).
2. **Definir la entidad en Dexie y en PostgreSQL (Drizzle)** asegurando compatibilidad hacia atrás con la columna `tenant_id` por defecto `'default'`.
3. **Escribir pruebas unitarias** antes o durante la implementación utilizando `vitest`.
4. **Si una decisión arquitectónica implica costos, migraciones remotas destructivas o selección de proveedores externos (ej. Pasarela de pagos, Auth0 vs Supabase Auth), NO implementarla sin consultarlo previamente y documentarla en un Plan de Acción.**
5. **Auto-inicialización y Migraciones Idempotentes de Base de Datos:** Toda nueva entidad o cambio de esquema en PostgreSQL debe generar su archivo de migración en `drizzle/` (`npm run db:generate`) y registrarse en el bootstrapper idempotente (`src/infrastructure/db/bootstrap.ts`). El backend siempre debe garantizar que tablas, enums e índices existan automáticamente en el arranque antes de aceptar tráfico para prevenir errores `42P01: relation does not exist` en bases de datos en la nube (Neon/Render).
