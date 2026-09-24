# Implementación: Multi-Tenancy y Autenticación con Supabase Auth ($0 Costo)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar autenticación obligatoria para Gestores y Colaboradores mediante Supabase Auth (Capa Gratuita hasta 50,000 MAU), dejando el acceso del Cliente final 100% libre de login y restringido a su mesa, con particionamiento multi-tenant en backend y base de datos.

**Architecture:** 
- **Frontend:** `@supabase/supabase-js` para gestión de sesión en el panel de administración/staff. Si la URL contiene `?mesa=:tableId`, se permite acceso anónimo al `CustomerPortal` sin exigir login. El Navbar muestra el perfil autenticado y botón de cierre de sesión.
- **Backend:** Fastify valida el token Bearer emitido por Supabase usando `SUPABASE_JWT_SECRET`. Se añade soporte multi-tenant con columna `tenant_id` por defecto `'default'` en PostgreSQL (Neon) para mantener compatibilidad hacia atrás.
- **WebSockets:** Se mantiene la fase actual en memoria, aislando los eventos por canal de tenant (`tenant:<id>:staff` y `table:<id>`), con interfaz abstracta lista para conectar un broker de mensajería (Redis) en el futuro.

**Tech Stack:** React 19, TypeScript, Fastify 5, Drizzle ORM, PostgreSQL (Neon), Supabase Auth (Free Tier), Dexie.js (IndexedDB).

---

## Restricciones Globales
- **Cero sobrecostos:** Mantenerse 100% en las capas gratuitas (Supabase Free, Neon Free, Render Free, Cloudflare Pages Free).
- **Límite de tamaño:** Ningún archivo o componente de código nuevo debe superar las 300 líneas (Regla 1 de `AGENTS.md`).
- **Local-First:** La reactividad del cliente y de los meseros debe seguir usando Dexie y `useLiveQuery` (Regla 2 de `AGENTS.md`).
- **Compatibilidad hacia atrás:** Toda tabla de base de datos debe tener `tenant_id` con valor por defecto `'default'` para no romper datos existentes ni requerir migraciones destructivas.
- **Verificación obligatoria:** Ejecutar `npm run test` y `npm run build` en frontend y backend antes de dar por completada cada tarea.

---

### Task 1: Esquema de Base de Datos Multi-Tenant en Backend (Drizzle ORM)

**Archivos:**
- Modificar: `backend/src/infrastructure/db/schema.ts`
- Modificar: `backend/src/domain/entities/Zone.ts`
- Modificar: `backend/src/domain/entities/Table.ts`
- Modificar: `backend/src/domain/entities/WaiterCall.ts`

**Interfaces:**
- Produce: Tablas `tenants` y `tenantUsers`, y campo `tenantId` en entidades principales.

- [ ] **Paso 1: Agregar tablas de tenants y columna tenantId en schema.ts**
```typescript
// backend/src/infrastructure/db/schema.ts
export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 50 }).primaryKey(), // slug o uuid
  name: varchar('name', { length: 100 }).notNull(),
  ownerEmail: varchar('owner_email', { length: 150 }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const tenantUsers = pgTable('tenant_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: varchar('tenant_id', { length: 50 }).references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 100 }).notNull(), // Supabase auth.users ID
  email: varchar('email', { length: 150 }).notNull(),
  role: varchar('role', { length: 20 }).default('staff').notNull(), // 'manager' | 'staff'
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
```
- [ ] **Paso 2: Agregar columna tenantId en zones, restaurantTables, tableSessions, waiterCalls, reservations y syncAuditLog**
Añadir `tenantId: varchar('tenant_id', { length: 50 }).default('default').notNull()` en cada tabla.
- [ ] **Paso 3: Compilar y verificar el backend**
Run: `npm run build` en `backend/`
Expected: 0 errores de TypeScript.
- [ ] **Paso 4: Commit**
```bash
git add backend/src/infrastructure/db/schema.ts
git commit -m "feat(db): add multi-tenancy schema with default tenant fallback"
```

---

### Task 2: Verificación de JWT de Supabase en Fastify Backend

**Archivos:**
- Crear: `backend/src/infrastructure/http/middleware/authMiddleware.ts`
- Modificar: `backend/src/infrastructure/http/server.ts`
- Modificar: `backend/src/config/env.ts`

**Interfaces:**
- Produce: Hook `verifyAuth(request, reply)` que valida el token Bearer de Supabase y adjunta `request.user = { id, email, tenantId, role }`.
- Permite acceso anónimo en rutas públicas (`GET /api/health`, `/ws` para clientes de mesa).

- [ ] **Paso 1: Añadir SUPABASE_JWT_SECRET en env.ts**
```typescript
// backend/src/config/env.ts
SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || 'dev-secret-only',
```
- [ ] **Paso 2: Crear authMiddleware.ts**
Validar firma JWT con `SUPABASE_JWT_SECRET` (o con `jose`/`jsonwebtoken`) y extraer el `tenant_id` y `role` del usuario. Si es una petición de cliente para llamado de mesa (`POST /api/sync` con entidad `waiter_call`), permitir continuar como invitado de mesa.
- [ ] **Paso 3: Proteger rutas en server.ts**
Exigir autenticación en `GET /api/state/initial` para personal de staff.
- [ ] **Paso 4: Compilar backend**
Run: `npm run build` en `backend/`
Expected: 0 errores.
- [ ] **Paso 5: Commit**
```bash
git add backend/src/infrastructure/http/middleware/authMiddleware.ts backend/src/infrastructure/http/server.ts
git commit -m "feat(auth): add Supabase JWT verification middleware to Fastify"
```

---

### Task 3: Particionamiento Multi-Tenant en Casos de Uso del Backend

**Archivos:**
- Modificar: `backend/src/application/use-cases/GetInitialStateUseCase.ts`
- Modificar: `backend/src/application/use-cases/SyncOutboxBatchUseCase.ts`
- Modificar: `backend/src/infrastructure/repositories/DrizzleTableRepository.ts`
- Modificar: `backend/src/infrastructure/repositories/DrizzleZoneRepository.ts`
- Modificar: `backend/src/infrastructure/repositories/DrizzleCallRepository.ts`

**Interfaces:**
- Consumes: `tenantId` provisto por la petición autenticada o `'default'` por omisión.
- Produces: Datos aislados exclusivamente para el establecimiento que consulta.

- [ ] **Paso 1: Modificar GetInitialStateUseCase para recibir tenantId**
Filtrar mesas, zonas y llamados por `tenantId`.
- [ ] **Paso 2: Modificar SyncOutboxBatchUseCase para asociar eventos entrantes a tenantId**
- [ ] **Paso 3: Compilar y correr tests del backend**
Run: `npm run build` en `backend/`
Expected: PASS
- [ ] **Paso 4: Commit**
```bash
git add backend/src/application/use-cases/ backend/src/infrastructure/repositories/
git commit -m "feat(multitenancy): scope initial state and outbox sync to tenantId"
```

---

### Task 4: Configuración de Supabase Client y Contexto de Autenticación en Frontend

**Archivos:**
- Instalar: `@supabase/supabase-js` en el Frontend.
- Crear: `src/services/supabase.ts`
- Crear: `src/context/AuthContext.tsx`
- Crear: `src/hooks/useAuth.ts`
- Modificar: `.env.example`

**Interfaces:**
- Produce: `useAuth()` hook retornando `{ user, session, role, tenantId, isLoading, signIn, signUp, signOut }`.

- [ ] **Paso 1: Instalar @supabase/supabase-js en Frontend**
Run: `npm install @supabase/supabase-js`
- [ ] **Paso 2: Crear src/services/supabase.ts**
Inicializar `createClient(supabaseUrl, supabaseAnonKey)` leyendo de `import.meta.env.VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- [ ] **Paso 3: Crear AuthContext y useAuth hook (< 200 líneas)**
Gestionar el listener `supabase.auth.onAuthStateChange` y guardar el `role` y `tenantId` en estado.
- [ ] **Paso 4: Probar compilación**
Run: `npm run build` en root.
Expected: PASS
- [ ] **Paso 5: Commit**
```bash
git add src/services/supabase.ts src/context/AuthContext.tsx src/hooks/useAuth.ts package.json
git commit -m "feat(auth): add Supabase client and AuthContext hook in frontend"
```

---

### Task 5: Pantalla de Autenticación (Login/Registro) y Gestión de Sesión en Navbar

**Archivos:**
- Crear: `src/components/auth/AuthScreen.tsx` (< 250 líneas)
- Modificar: `src/components/layout/Navbar.tsx`
- Modificar: `src/App.tsx`

**Interfaces:**
- `AuthScreen`: Permite a Gestores y Empleados ingresar con correo y contraseña.
- `Navbar`: Muestra badge de usuario (ej. `gestor@bar.com | Gestor`) y botón de cerrar sesión.

- [ ] **Paso 1: Crear AuthScreen.tsx**
Formulario con pestañas de "Iniciar Sesión" y "Registrar Establecimiento". Diseño oscuro acorde a la interfaz actual (Tailwind CSS).
- [ ] **Paso 2: Integrar indicador de usuario y botón salir en Navbar.tsx**
Mostrar avatar/correo del colaborador y botón discreto de Logout.
- [ ] **Paso 3: Proteger el render de App.tsx**
Si `customerTableId` existe en la URL (`/?mesa=...`):
-> Renderiza `CustomerPortal` directamente sin pedir login.
Si no hay `customerTableId`:
-> Si no hay usuario autenticado, renderiza `<AuthScreen />`.
-> Si hay usuario autenticado, renderiza el croquis y panel administrativo.
- [ ] **Paso 4: Ejecutar tests y build**
Run: `npm run test && npm run build`
Expected: 11 suites pasando, 0 errores de compilación.
- [ ] **Paso 5: Commit**
```bash
git add src/components/auth/AuthScreen.tsx src/components/layout/Navbar.tsx src/App.tsx
git commit -m "feat(ui): add AuthScreen for staff and integrate role indicators in Navbar"
```

---

### Task 6: Restricción de Permisos Basada en Roles (RBAC) y Seguridad del Cliente

**Archivos:**
- Modificar: `src/components/layout/Navbar.tsx` (ocultar pestaña 'editor' si role !== 'manager')
- Modificar: `src/components/customer/CustomerPortal.tsx` (asegurar que cliente no pueda saltar a panel staff sin login)

- [ ] **Paso 1: Condicionar acceso al editor de croquis por rol**
Los colaboradores (`staff`) solo ven "Servicio" y "Reservas"; los administradores (`manager`) tienen acceso a "Editor de Croquis".
- [ ] **Paso 2: Proteger botón "Ir a Staff" en CustomerPortal**
Si el cliente pulsa "Ir a Staff", se remueve el query param `?mesa=...` y la app solicitará login al no tener sesión activa.
- [ ] **Paso 3: Ejecutar suite de pruebas completa**
Run: `npm run test`
Expected: 30 tests pasando.
- [ ] **Paso 4: Compilación final**
Run: `npm run build`
Expected: Build limpio con soporte PWA.
- [ ] **Paso 5: Commit**
```bash
git add src/components/layout/Navbar.tsx src/components/customer/CustomerPortal.tsx
git commit -m "feat(rbac): restrict croquis editor to manager and guard customer portal"
```

---

## Verificación Final del Plan
1. Ejecutar `npm run test` en frontend y backend.
2. Comprobar que ingresar con `/?mesa=<id>` abre el portal de cliente sin pedir login.
3. Comprobar que ingresar a la raíz `/` sin sesión muestra la pantalla de autenticación.
4. Validar que la sincronización y WebSockets continúen operando a cero latencia percibida.
