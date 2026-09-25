# Catálogo de Productos, Control de Stock y Pedidos en Tiempo Real — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en BarFlow un catálogo de productos con control de stock local-first, menú interactivo para clientes (con búsqueda, filtrado por categorías y ranking dinámico de favoritos), y un flujo de pedidos en tiempo real integrado a la cola de atención del personal con semáforo de urgencia continua y validación física en mesa.

**Architecture:** Arquitectura Local-First con persistencia en Dexie (IndexedDB) en frontend y sincronización bidireccional mediante el Patrón Outbox (`sync_queue`) con Fastify y PostgreSQL (Drizzle ORM). Notificación en tiempo real vía WebSockets con eventos tipados (`ORDER_CREATED`, `ORDER_CONFIRMED`, `STOCK_UPDATED`).

**Tech Stack:** React 19, TypeScript, Dexie.js (`useLiveQuery`), Tailwind CSS, Lucide React, Fastify, Drizzle ORM, PostgreSQL (Neon), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-25-product-catalog-orders-design.md`

## Global Constraints

- Límite de tamaño de archivo (Regla 1 de AGENTS.md): Ningún archivo debe superar las 300 líneas de código.
- Identificadores en base de datos: Todos los IDs deben ser `varchar(100)` para compatibilidad con IDs generados en el cliente (`crypto.randomUUID()`).
- Idempotencia en sincronización (Regla 4 de AGENTS.md): Toda ingesta en backend debe registrarse en `sync_audit_log` con clave única `clientEventId`.
- WebSockets seguros (Regla 3 de AGENTS.md): Todos los eventos deben validarse contra `ALLOWED_REALTIME_EVENTS` con límite de 64 KB.
- Verificación obligatoria (Regla 6 de AGENTS.md): `npm run test` y `npm run build` deben pasar con 0 errores de TypeScript antes de finalizar.
- Sin imágenes en esta fase: Interfaz basada en tipografía, badges, e iconos vectoriales (`lucide-react`) según categoría.

---

## File Structure

```
backend/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── ProductCategory.ts (Entidad de dominio)
│   │   │   ├── Product.ts (Entidad de dominio con stock y totalOrders)
│   │   │   ├── ProductOrder.ts (Entidad de pedido de mesa)
│   │   │   └── OrderItem.ts (Línea de pedido con snapshot de precio)
│   │   └── repositories/
│   │       ├── IProductRepository.ts
│   │       └── IOrderRepository.ts
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── schema.ts (Modificado: tablas product_categories, products, product_orders, order_items)
│   │   │   └── bootstrap.ts (Modificado: DDL idempotente para nuevas tablas e índices)
│   │   ├── repositories/
│   │   │   ├── DrizzleProductRepository.ts
│   │   │   └── DrizzleOrderRepository.ts
│   │   └── ws/
│   │       └── FastifyWebSocketHub.ts (Modificado: eventos ORDER_CREATED, ORDER_CONFIRMED, STOCK_UPDATED)
│   └── application/
│       └── use-cases/
│           └── SyncOutboxBatchUseCase.ts (Modificado: ingesta de categorías, productos y pedidos)

src/ (Frontend)
├── types/
│   └── database.ts (Modificado: tipos ProductCategory, Product, ProductOrder, OrderItem, AttentionItem)
├── db/
│   ├── index.ts (Modificado: tiendas Dexie product_categories, products, product_orders, order_items, app_settings)
│   └── seed.ts (Modificado: categorías iniciales y productos con stock de prueba)
├── hooks/
│   ├── useCustomerMenu.ts (Hook reactivo: categorías, productos, búsqueda y ranking de favoritos)
│   ├── useOrderManagement.ts (Hook para crear pedidos, cancelar y confirmar con descuento de stock)
│   └── useUnifiedAttentionQueue.ts (Hook unificado: mezcla waiter_calls y product_orders ordenados por urgencia HSL)
├── components/
│   ├── customer/
│   │   ├── CustomerMenu.tsx (Menú principal con buscador y tabs de categoría)
│   │   ├── ProductCard.tsx (Tarjeta de producto con badge de stock y selector de cantidad)
│   │   ├── FavoritesRanking.tsx (Sección de los más pedidos)
│   │   ├── OrderCartDrawer.tsx (Bottom sheet de carrito y notas antes de enviar a mesa)
│   │   └── CustomerPortal.tsx (Modificado: navegación por pestañas Menú vs Asistencia)
│   ├── service/
│   │   ├── UnifiedAttentionFeed.tsx (Feed de atención combinado llamados + pedidos)
│   │   ├── OrderConfirmationModal.tsx (Modal de mesero para confirmar/descontar stock o rechazar)
│   │   └── ServiceStatsBar.tsx (Modificado: métricas combinadas de llamados y pedidos pendientes)
│   ├── menu/
│   │   ├── MenuManagementTab.tsx (Panel de gestión del catálogo para el rol manager)
│   │   ├── ProductFormModal.tsx (Crear/editar producto y stock inicial)
│   │   ├── CategoryFormModal.tsx (Crear/editar categoría)
│   │   └── QuickStockAdjuster.tsx (Ajustador rápido de stock en tabla)
│   ├── layout/
│   │   └── Navbar.tsx (Modificado: pestaña "Menú" protegida para rol manager)
│   └── dashboard/
│       └── StaffDashboard.tsx (Modificado: integración de pestaña Menú y cola unificada)
```

---

## Tasks

### Task 1: Esquema de Base de Datos y Entidades en Backend

**Files:**
- Create: `backend/src/domain/entities/ProductCategory.ts`
- Create: `backend/src/domain/entities/Product.ts`
- Create: `backend/src/domain/entities/ProductOrder.ts`
- Create: `backend/src/domain/entities/OrderItem.ts`
- Modify: `backend/src/infrastructure/db/schema.ts`
- Modify: `backend/src/infrastructure/db/bootstrap.ts`
- Test: `backend/tests/infrastructure/schema.test.ts`
- Test: `backend/tests/domain/productEntities.test.ts`

**Interfaces:**
- Produces: `ProductCategory`, `Product`, `ProductOrder`, `OrderItem` domain models and Drizzle table schemas (`productCategories`, `products`, `productOrders`, `orderItems`).

- [ ] **Step 1: Escribir prueba unitaria que falla para entidades de producto y pedido**

Crear `backend/tests/domain/productEntities.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { Product } from '../../src/domain/entities/Product.js';
import { ProductOrder } from '../../src/domain/entities/ProductOrder.js';

describe('Product & Order Domain Entities', () => {
  it('instantiates a Product with stock and totalOrders', () => {
    const p = new Product({
      id: 'prod-1',
      tenantId: 'default',
      categoryId: 'cat-1',
      name: 'Cerveza Corona',
      description: '355ml fría',
      price: 12000,
      stock: 24,
      isActive: true,
      totalOrders: 10,
      updatedAt: Date.now(),
    });

    expect(p.id).toBe('prod-1');
    expect(p.stock).toBe(24);
    expect(p.totalOrders).toBe(10);
  });

  it('validates stock decrement helper', () => {
    const p = new Product({
      id: 'prod-1',
      tenantId: 'default',
      categoryId: 'cat-1',
      name: 'Cerveza Corona',
      price: 12000,
      stock: 5,
      updatedAt: Date.now(),
    });

    const decremented = p.decrementStock(3);
    expect(decremented.stock).toBe(2);
    expect(decremented.totalOrders).toBe(3);
  });

  it('instantiates a ProductOrder with pending status', () => {
    const o = new ProductOrder({
      id: 'order-1',
      tenantId: 'default',
      tableId: 'table-1',
      sessionId: 'sess-1',
      tableName: 'Mesa 1',
      sessionWord: 'rio-azul',
      status: 'pending',
      totalAmount: 24000,
      createdAt: Date.now(),
    });

    expect(o.status).toBe('pending');
    expect(o.totalAmount).toBe(24000);
  });
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Ejecutar: `npm run test -- tests/domain/productEntities.test.ts` en `backend/`  
Esperado: FAIL por módulos no encontrados (`Product.js`, `ProductOrder.js`).

- [ ] **Step 3: Implementar entidades de dominio en Backend**

Crear `backend/src/domain/entities/ProductCategory.ts`:
```typescript
export interface ProductCategoryProps {
  id: string;
  tenantId?: string;
  name: string;
  sortOrder?: number;
  createdAt?: number;
}

export class ProductCategory {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly name: string;
  public readonly sortOrder: number;
  public readonly createdAt: number;

  constructor(props: ProductCategoryProps) {
    this.id = props.id;
    this.tenantId = props.tenantId ?? 'default';
    this.name = props.name;
    this.sortOrder = props.sortOrder ?? 0;
    this.createdAt = props.createdAt ?? Date.now();
  }
}
```

Crear `backend/src/domain/entities/Product.ts`:
```typescript
export interface ProductProps {
  id: string;
  tenantId?: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  isActive?: boolean;
  totalOrders?: number;
  updatedAt?: number;
}

export class Product {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly categoryId: string;
  public readonly name: string;
  public readonly description: string;
  public readonly price: number;
  public readonly stock: number;
  public readonly isActive: boolean;
  public readonly totalOrders: number;
  public readonly updatedAt: number;

  constructor(props: ProductProps) {
    this.id = props.id;
    this.tenantId = props.tenantId ?? 'default';
    this.categoryId = props.categoryId;
    this.name = props.name;
    this.description = props.description ?? '';
    this.price = props.price;
    this.stock = Math.max(0, props.stock ?? 0);
    this.isActive = props.isActive ?? true;
    this.totalOrders = props.totalOrders ?? 0;
    this.updatedAt = props.updatedAt ?? Date.now();
  }

  public decrementStock(quantity: number): Product {
    return new Product({
      ...this,
      stock: Math.max(0, this.stock - quantity),
      totalOrders: this.totalOrders + quantity,
      updatedAt: Date.now(),
    });
  }
}
```

Crear `backend/src/domain/entities/OrderItem.ts`:
```typescript
export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export class OrderItem {
  public readonly id: string;
  public readonly orderId: string;
  public readonly productId: string;
  public readonly productName: string;
  public readonly unitPrice: number;
  public readonly quantity: number;
  public readonly notes?: string;

  constructor(props: OrderItemProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.productName = props.productName;
    this.unitPrice = props.unitPrice;
    this.quantity = props.quantity;
    this.notes = props.notes;
  }
}
```

Crear `backend/src/domain/entities/ProductOrder.ts`:
```typescript
export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'delivered';

export interface ProductOrderProps {
  id: string;
  tenantId?: string;
  tableId: string;
  sessionId: string;
  tableName: string;
  sessionWord: string;
  status?: OrderStatus;
  totalAmount: number;
  createdAt?: number;
  confirmedAt?: number;
}

export class ProductOrder {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly tableId: string;
  public readonly sessionId: string;
  public readonly tableName: string;
  public readonly sessionWord: string;
  public readonly status: OrderStatus;
  public readonly totalAmount: number;
  public readonly createdAt: number;
  public readonly confirmedAt?: number;

  constructor(props: ProductOrderProps) {
    this.id = props.id;
    this.tenantId = props.tenantId ?? 'default';
    this.tableId = props.tableId;
    this.sessionId = props.sessionId;
    this.tableName = props.tableName;
    this.sessionWord = props.sessionWord;
    this.status = props.status ?? 'pending';
    this.totalAmount = props.totalAmount;
    this.createdAt = props.createdAt ?? Date.now();
    this.confirmedAt = props.confirmedAt;
  }
}
```

- [ ] **Step 4: Actualizar esquema Drizzle y bootstrapper en Backend**

Modificar `backend/src/infrastructure/db/schema.ts` agregando `productCategories`, `products`, `productOrders`, `orderItems` (con `id: varchar('id', { length: 100 }).primaryKey()` y foreign keys en cascada).
Modificar `backend/src/infrastructure/db/bootstrap.ts` agregando sentencias `CREATE TABLE IF NOT EXISTS` e índices correspondientes en `runIdempotentSchemaBootstrap`.

- [ ] **Step 5: Ejecutar pruebas y verificar compilación de Backend**

Ejecutar:
```bash
cd backend
npm run test
npm run build
```
Esperado: 100% pasando con 0 errores TypeScript.

- [ ] **Step 6: Commit de Task 1**

```bash
cd backend
git add src/domain/entities/ tests/domain/ src/infrastructure/db/schema.ts src/infrastructure/db/bootstrap.ts
git commit -m "feat(db): add product catalog, stock and orders schema and entities"
```

---

### Task 2: Ingesta Idempotente del Outbox y WebSockets en Backend

**Files:**
- Modify: `backend/src/application/use-cases/SyncOutboxBatchUseCase.ts`
- Modify: `backend/src/infrastructure/ws/FastifyWebSocketHub.ts`
- Create: `backend/src/infrastructure/repositories/DrizzleProductRepository.ts`
- Create: `backend/src/infrastructure/repositories/DrizzleOrderRepository.ts`
- Test: `backend/tests/application/syncProductOrders.test.ts`

**Interfaces:**
- Consumes: `Product`, `ProductOrder`, `OrderItem`, `ProductCategory`
- Produces: `SyncOutboxBatchUseCase` extendido con soporte para entidades `category`, `product`, `product_order`, y eventos en tiempo real `ORDER_CREATED`, `ORDER_CONFIRMED`, `STOCK_UPDATED`.

- [ ] **Step 1: Escribir prueba unitaria que falla para la sincronización outbox de productos y pedidos**

Crear `backend/tests/application/syncProductOrders.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { SyncOutboxBatchUseCase } from '../../src/application/use-cases/SyncOutboxBatchUseCase.js';

describe('SyncOutboxBatchUseCase - Products & Orders', () => {
  it('processes product insertion and deduplicates repeated clientEventId', async () => {
    const processedEvents = new Set<string>();
    const mockAuditRepo = {
      hasEventBeenProcessed: vi.fn(async (id: string) => processedEvents.has(id)),
      recordSync: vi.fn(async (rec: any) => { processedEvents.add(rec.clientEventId); }),
      recordSyncBatch: vi.fn(),
    };

    const mockTableRepo = { findById: vi.fn(), findAll: vi.fn(), findByZoneId: vi.fn(), save: vi.fn(), update: vi.fn(), delete: vi.fn() };
    const mockSessionRepo = { findById: vi.fn(), findActiveByTableId: vi.fn(), findActiveSessions: vi.fn(), save: vi.fn(), update: vi.fn(), closeActiveByTableId: vi.fn() };
    const mockCallRepo = { findById: vi.fn(), findActiveCalls: vi.fn(), findByTableId: vi.fn(), save: vi.fn(), update: vi.fn() };

    const useCase = new SyncOutboxBatchUseCase({
      syncAuditRepo: mockAuditRepo as any,
      tableRepo: mockTableRepo as any,
      sessionRepo: mockSessionRepo as any,
      callRepo: mockCallRepo as any,
    });

    const event = {
      id: 'evt-prod-1',
      entity: 'product' as any,
      action: 'INSERT' as any,
      entityId: 'prod-1',
      payload: {
        id: 'prod-1',
        categoryId: 'cat-1',
        name: 'Mojito Cubano',
        price: 18000,
        stock: 15,
      },
      timestamp: Date.now(),
    };

    const result1 = await useCase.execute([event]);
    expect(result1.syncedIds).toContain('evt-prod-1');

    // Second execution with same event ID should be deduplicated
    const result2 = await useCase.execute([event]);
    expect(result2.syncedIds).toContain('evt-prod-1');
    expect(mockAuditRepo.recordSync).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Ejecutar: `npm run test -- tests/application/syncProductOrders.test.ts` en `backend/`  
Esperado: Falla porque `case 'product'` o tipos aún no están implementados en el caso de uso.

- [ ] **Step 3: Implementar repositorios e integrar en `SyncOutboxBatchUseCase`**

1. Implementar `DrizzleProductRepository` y `DrizzleOrderRepository` con `onConflictDoUpdate`.
2. Extender `SyncOutboxBatchUseCase.ts` para manejar `case 'category'`, `case 'product'`, y `case 'product_order'`.
3. Actualizar `ALLOWED_REALTIME_EVENTS` en `backend/src/infrastructure/ws/FastifyWebSocketHub.ts`:
```typescript
export const ALLOWED_REALTIME_EVENTS = [
  'TABLE_UPDATED',
  'TABLE_DELETED',
  'ZONE_CREATED',
  'ZONE_UPDATED',
  'CALL_CREATED',
  'CALL_ATTENDING',
  'CALL_RESOLVED',
  'CALL_CANCELLED',
  'SESSION_STARTED',
  'SESSION_CLOSED',
  'RESERVATION_CREATED',
  'RESERVATION_UPDATED',
  'ORDER_CREATED',
  'ORDER_CONFIRMED',
  'ORDER_REJECTED',
  'STOCK_UPDATED',
] as const;
```

- [ ] **Step 4: Ejecutar pruebas y verificar compilación de Backend**

Ejecutar:
```bash
cd backend
npm run test
npm run build
```
Esperado: Todos los tests pasan, 0 errores TypeScript.

- [ ] **Step 5: Commit de Task 2**

```bash
cd backend
git add src/application/ src/infrastructure/ tests/
git commit -m "feat(sync): add outbox sync and websocket handlers for products and orders"
```

---

### Task 3: Esquema Dexie y Semilla en Frontend

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/db/index.ts`
- Modify: `src/db/seed.ts`
- Test: `tests/catalogDexie.test.ts`

**Interfaces:**
- Produces: Tipos TypeScript y tablas locales en Dexie (`product_categories`, `products`, `product_orders`, `order_items`, `app_settings`) con datos iniciales de prueba en la semilla.

- [ ] **Step 1: Escribir prueba unitaria que falla para el esquema Dexie de productos**

Crear `tests/catalogDexie.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db, createProductCategory, createProduct } from '../src/db';

describe('Dexie Catalog & Products Local Storage', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.product_categories.clear();
  });

  it('stores and retrieves categories and products with stock', async () => {
    const cat = await createProductCategory(db, {
      name: 'Bebidas & Cervezas',
      sortOrder: 1,
    });

    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Club Colombia Dorada',
      price: 9000,
      stock: 20,
    });

    expect(prod.id).toBeDefined();
    expect(prod.stock).toBe(20);

    const storedProd = await db.products.get(prod.id);
    expect(storedProd?.name).toBe('Club Colombia Dorada');
  });
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Ejecutar: `npm run test tests/catalogDexie.test.ts`  
Esperado: FAIL por métodos no definidos (`createProductCategory`, etc.).

- [ ] **Step 3: Actualizar `src/types/database.ts` y `src/db/index.ts`**

1. En `src/types/database.ts`: definir `ProductCategory`, `Product`, `ProductOrder`, `OrderItem`, `AppSettings`.
2. En `src/db/index.ts`:
   - Añadir stores a Dexie: `product_categories: 'id, tenantId, sortOrder'`, `products: 'id, tenantId, categoryId, isActive, totalOrders'`, `product_orders: 'id, tenantId, tableId, sessionId, status, createdAt'`, `order_items: 'id, orderId, productId'`, `app_settings: 'key, tenantId'`.
   - Implementar funciones auxiliares: `createProductCategory`, `createProduct`, `updateProductStock`, `createProductOrder`, `confirmProductOrder`.
3. En `src/db/seed.ts`:
   - Crear categorías semilla ("Cervezas & Licores", "Cocteles", "Tapas & Entradas").
   - Crear 5-6 productos semilla con precios y stock inicial para pruebas (ej. Cerveza Corona, Mojito Clásico, Nachos Mixtos, Alitas BBQ).

- [ ] **Step 4: Ejecutar pruebas y verificar compilación de Frontend**

Ejecutar:
```bash
npm run test
npm run build
```
Esperado: 100% pruebas pasando, build de Vite exitoso con 0 errores TypeScript.

- [ ] **Step 5: Commit de Task 3**

```bash
git add src/types/database.ts src/db/index.ts src/db/seed.ts tests/catalogDexie.test.ts
git commit -m "feat(db): add products, categories and orders tables to Dexie schema"
```

---

### Task 4: Hooks de Negocio (`useCustomerMenu`, `useOrderManagement`, `useUnifiedAttentionQueue`)

**Files:**
- Create: `src/hooks/useCustomerMenu.ts`
- Create: `src/hooks/useOrderManagement.ts`
- Create: `src/hooks/useUnifiedAttentionQueue.ts`
- Test: `tests/orderManagement.test.ts`

**Interfaces:**
- Consumes: Dexie stores (`products`, `product_categories`, `product_orders`, `order_items`, `waiter_calls`)
- Produces: Hooks reactivos con `useLiveQuery` para el menú del cliente, gestión de órdenes y cola de atención unificada.

- [ ] **Step 1: Escribir prueba unitaria que falla para la lógica de confirmación y descuento de stock**

Crear `tests/orderManagement.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db, createProduct, createProductCategory } from '../src/db';
import { processOrderConfirmation } from '../src/hooks/useOrderManagement';

describe('Order Management & Stock Deduction', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.product_orders.clear();
    await db.order_items.clear();
  });

  it('deducts stock and increases totalOrders upon confirmation', async () => {
    const cat = await createProductCategory(db, { name: 'Bebidas' });
    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Agua con Gas',
      price: 5000,
      stock: 10,
      totalOrders: 2,
    });

    const orderId = 'order-test-1';
    await db.product_orders.put({
      id: orderId,
      tenantId: 'default',
      tableId: 'table-1',
      sessionId: 'sess-1',
      tableName: 'Mesa 1',
      sessionWord: 'azul-sol',
      status: 'pending',
      totalAmount: 15000,
      createdAt: Date.now(),
    });

    await db.order_items.put({
      id: 'item-1',
      orderId,
      productId: prod.id,
      productName: prod.name,
      unitPrice: prod.price,
      quantity: 3,
    });

    const result = await processOrderConfirmation(db, orderId);
    expect(result.success).toBe(true);

    const updatedProd = await db.products.get(prod.id);
    expect(updatedProd?.stock).toBe(7); // 10 - 3
    expect(updatedProd?.totalOrders).toBe(5); // 2 + 3

    const updatedOrder = await db.product_orders.get(orderId);
    expect(updatedOrder?.status).toBe('confirmed');
    expect(updatedOrder?.confirmedAt).toBeDefined();
  });
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Ejecutar: `npm run test tests/orderManagement.test.ts`  
Esperado: FAIL por `processOrderConfirmation` no definido.

- [ ] **Step 3: Implementar hooks y lógica de confirmación**

1. Crear `src/hooks/useOrderManagement.ts` con `processOrderConfirmation`, `createOrder`, y `rejectOrder` asegurando transacción atómica de Dexie y encolado en `sync_queue`.
2. Crear `src/hooks/useCustomerMenu.ts` usando `useLiveQuery`:
   - Categorías ordenadas por `sortOrder`.
   - Búsqueda por texto (nombre / descripción insensible a mayúsculas/minúsculas).
   - Filtro por categoría seleccionada.
   - Ranking de favoritos: Top 5 productos activos con `totalOrders > 0` ordenados descendentemente.
3. Crear `src/hooks/useUnifiedAttentionQueue.ts`:
   - Combina `waiter_calls` pendientes y `product_orders` pendientes en una lista unificada de tipo `AttentionItem`.
   - Ordena por `createdAt` ascendente (FIFO) y aplica `calculateUrgency(createdAt)` de `urgencyGradient.ts`.

- [ ] **Step 4: Ejecutar pruebas y verificar compilación**

Ejecutar:
```bash
npm run test
npm run build
```
Esperado: 100% pasando con 0 errores TypeScript.

- [ ] **Step 5: Commit de Task 4**

```bash
git add src/hooks/ tests/orderManagement.test.ts
git commit -m "feat(hooks): implement useCustomerMenu, useOrderManagement and useUnifiedAttentionQueue"
```

---

### Task 5: Experiencia del Cliente en el Menú (`CustomerPortal`)

**Files:**
- Create: `src/components/customer/CustomerMenu.tsx`
- Create: `src/components/customer/ProductCard.tsx`
- Create: `src/components/customer/FavoritesRanking.tsx`
- Create: `src/components/customer/OrderCartDrawer.tsx`
- Modify: `src/components/customer/CustomerPortal.tsx`
- Test: `tests/customerMenu.test.tsx`

**Interfaces:**
- Consumes: `useCustomerMenu`, `useOrderManagement`
- Produces: Interfaz completa de cliente para navegar el menú, buscar productos, ver stock en vivo y ordenar a mesa.

- [ ] **Step 1: Escribir prueba unitaria que falla para la interfaz del menú de cliente**

Crear `tests/customerMenu.test.tsx`:
```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../src/components/customer/ProductCard';

describe('ProductCard Component', () => {
  it('displays product details, formatted price and available stock', () => {
    const product = {
      id: 'p-1',
      tenantId: 'default',
      categoryId: 'cat-1',
      name: 'Mojito Artesanal',
      description: 'Hierbabuena fresca y ron blanco',
      price: 18000,
      stock: 8,
      isActive: true,
      totalOrders: 15,
      updatedAt: Date.now(),
    };

    render(
      <ProductCard
        product={product}
        quantityInCart={0}
        onAddToCart={vi.fn()}
        onUpdateQuantity={vi.fn()}
      />
    );

    expect(screen.getByText('Mojito Artesanal')).toBeDefined();
    expect(screen.getByText('Hierbabuena fresca y ron blanco')).toBeDefined();
    expect(screen.getByText('$18.000')).toBeDefined();
    expect(screen.getByText('Agregar')).toBeDefined();
  });

  it('disables add button and shows Agotado badge when stock is 0', () => {
    const product = {
      id: 'p-2',
      tenantId: 'default',
      categoryId: 'cat-1',
      name: 'Cerveza Especial',
      description: 'Edición limitada',
      price: 15000,
      stock: 0,
      isActive: true,
      totalOrders: 40,
      updatedAt: Date.now(),
    };

    render(
      <ProductCard
        product={product}
        quantityInCart={0}
        onAddToCart={vi.fn()}
        onUpdateQuantity={vi.fn()}
      />
    );

    expect(screen.getByText('Agotado')).toBeDefined();
    const btn = screen.getByRole('button', { name: /agotado/i });
    expect(btn.hasAttribute('disabled')).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Ejecutar: `npm run test tests/customerMenu.test.tsx`  
Esperado: FAIL por `ProductCard` no encontrado.

- [ ] **Step 3: Implementar componentes de UI del cliente**

1. Crear `src/components/customer/ProductCard.tsx` (< 150 líneas) con badges de stock y selector de cantidad.
2. Crear `src/components/customer/FavoritesRanking.tsx` (< 120 líneas) con diseño horizontal deslizable de productos más pedidos.
3. Crear `src/components/customer/OrderCartDrawer.tsx` (< 200 líneas) con desglose de ítems, campo de notas opcional y botón *"Enviar Pedido a Mesa"*.
4. Crear `src/components/customer/CustomerMenu.tsx` (< 250 líneas) integrando buscador con debounce, pestañas de categoría, favoritos y lista de productos.
5. Modificar `src/components/customer/CustomerPortal.tsx` (< 280 líneas) agregando barra de navegación superior entre pestaña *"Menú & Pedidos"* y *"Asistencia & Cuenta"*.

- [ ] **Step 4: Ejecutar pruebas y verificar compilación**

Ejecutar:
```bash
npm run test
npm run build
```
Esperado: 100% pasando, 0 errores TypeScript.

- [ ] **Step 5: Commit de Task 5**

```bash
git add src/components/customer/ tests/customerMenu.test.tsx
git commit -m "feat(ui): implement customer interactive menu, cart drawer and favorites ranking"
```

---

### Task 6: Cola Unificada de Atención y Modal de Validación en Mesa

**Files:**
- Create: `src/components/service/UnifiedAttentionFeed.tsx`
- Create: `src/components/service/OrderConfirmationModal.tsx`
- Modify: `src/components/service/ServiceStatsBar.tsx`
- Modify: `src/components/dashboard/StaffDashboard.tsx`
- Test: `tests/unifiedAttention.test.tsx`

**Interfaces:**
- Consumes: `useUnifiedAttentionQueue`, `useOrderManagement`
- Produces: Vista de atención unificada para el personal, integrando llamados y pedidos con semáforo de urgencia y confirmación física en mesa.

- [ ] **Step 1: Escribir prueba unitaria que falla para el feed de atención unificado**

Crear `tests/unifiedAttention.test.tsx`:
```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedAttentionFeed } from '../src/components/service/UnifiedAttentionFeed';

describe('UnifiedAttentionFeed Component', () => {
  it('renders both waiter calls and product orders with urgency badges', () => {
    const items = [
      {
        id: 'call-1',
        type: 'call' as const,
        tableName: 'Mesa 2',
        reason: 'waiter' as const,
        createdAt: Date.now() - 60000,
        urgency: { color: 'hsl(80, 80%, 45%)', isUrgent: false, elapsedMs: 60000 },
      },
      {
        id: 'order-1',
        type: 'order' as const,
        tableName: 'Mesa 4',
        itemSummary: '2x Cerveza Corona',
        totalAmount: 24000,
        createdAt: Date.now() - 120000,
        urgency: { color: 'hsl(50, 80%, 45%)', isUrgent: false, elapsedMs: 120000 },
      },
    ];

    render(
      <UnifiedAttentionFeed
        items={items}
        onSelectCall={vi.fn()}
        onSelectOrder={vi.fn()}
      />
    );

    expect(screen.getByText('Mesa 2')).toBeDefined();
    expect(screen.getByText('Mesa 4')).toBeDefined();
    expect(screen.getByText(/2x Cerveza Corona/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Ejecutar: `npm run test tests/unifiedAttention.test.tsx`  
Esperado: FAIL por componente no existente.

- [ ] **Step 3: Implementar componentes de atención unificada**

1. Crear `src/components/service/UnifiedAttentionFeed.tsx` (< 180 líneas): muestra llamado o pedido en un feed ordenado por urgencia.
2. Crear `src/components/service/OrderConfirmationModal.tsx` (< 220 líneas): muestra desglose del pedido de la mesa, notas, botón de confirmación con descuento de stock y botón de rechazo.
3. Actualizar `src/components/service/ServiceStatsBar.tsx` (< 200 líneas) para incluir contador de pedidos en espera.
4. Integrar en `src/components/dashboard/StaffDashboard.tsx` (< 250 líneas).

- [ ] **Step 4: Ejecutar pruebas y verificar compilación**

Ejecutar:
```bash
npm run test
npm run build
```
Esperado: 100% pruebas pasando, 0 errores TypeScript.

- [ ] **Step 5: Commit de Task 6**

```bash
git add src/components/service/ src/components/dashboard/ tests/unifiedAttention.test.tsx
git commit -m "feat(ui): implement unified attention feed and table order confirmation modal"
```

---

### Task 7: Pestaña de Gestión de Menú y Ajuste Rápido de Stock (Rol Manager)

**Files:**
- Create: `src/components/menu/MenuManagementTab.tsx`
- Create: `src/components/menu/ProductFormModal.tsx`
- Create: `src/components/menu/CategoryFormModal.tsx`
- Create: `src/components/menu/QuickStockAdjuster.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/dashboard/StaffDashboard.tsx`
- Test: `tests/menuManagement.test.tsx`

**Interfaces:**
- Consumes: Dexie stores (`products`, `product_categories`, `app_settings`), `useAuth`
- Produces: Módulo completo de administración del catálogo y control de existencias protegido para rol `manager`.

- [ ] **Step 1: Escribir prueba unitaria que falla para el ajuste rápido de stock**

Crear `tests/menuManagement.test.tsx`:
```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickStockAdjuster } from '../src/components/menu/QuickStockAdjuster';

describe('QuickStockAdjuster Component', () => {
  it('increments and decrements stock value with one tap', () => {
    const onStockChange = vi.fn();
    render(<QuickStockAdjuster currentStock={12} onStockChange={onStockChange} />);

    expect(screen.getByText('12')).toBeDefined();

    const plusBtn = screen.getByRole('button', { name: /\+/i });
    fireEvent.click(plusBtn);
    expect(onStockChange).toHaveBeenCalledWith(13);

    const minusBtn = screen.getByRole('button', { name: /-/i });
    fireEvent.click(minusBtn);
    expect(onStockChange).toHaveBeenCalledWith(11);
  });
});
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Ejecutar: `npm run test tests/menuManagement.test.tsx`  
Esperado: FAIL por componente no existente.

- [ ] **Step 3: Implementar componentes de administración de menú**

1. Crear `src/components/menu/QuickStockAdjuster.tsx` (< 100 líneas).
2. Crear `src/components/menu/CategoryFormModal.tsx` (< 150 líneas).
3. Crear `src/components/menu/ProductFormModal.tsx` (< 240 líneas) para crear o editar nombre, descripción, precio, categoría y stock inicial.
4. Crear `src/components/menu/MenuManagementTab.tsx` (< 280 líneas) con buscador de productos, filtro por categoría, interruptor del ranking de favoritos y listado de existencias.
5. Modificar `src/components/layout/Navbar.tsx` agregando la pestaña *"Menú"* accesible solo cuando `role === 'manager'`.

- [ ] **Step 4: Ejecutar pruebas y verificar compilación**

Ejecutar:
```bash
npm run test
npm run build
```
Esperado: 100% pasando, 0 errores TypeScript.

- [ ] **Step 5: Commit de Task 7**

```bash
git add src/components/menu/ src/components/layout/Navbar.tsx tests/menuManagement.test.tsx
git commit -m "feat(menu): implement menu management tab and quick stock adjuster for managers"
```

---

### Task 8: Verificación Integral End-to-End y Migración de Base de Datos

**Files:**
- Modify: `backend/drizzle/` (generación de migración formal 0002)
- Test: Todas las suites de pruebas de Frontend y Backend

- [ ] **Step 1: Generar migración Drizzle en backend**

Ejecutar en `backend/`:
```bash
npm run db:generate
```
Verificar que genera el archivo SQL incremental en `backend/drizzle/0002_...sql`.

- [ ] **Step 2: Ejecutar todas las pruebas de backend y frontend**

```bash
cd backend && npm run test && npm run build
cd .. && npm run test && npm run build
```
Esperado: Cero errores de compilación, 100% de suites de pruebas aprobadas en ambas aplicaciones.

- [ ] **Step 3: Commit final de verificación**

```bash
git add .
git commit -m "feat(catalog): complete product catalog, stock management and realtime orders implementation"
```
