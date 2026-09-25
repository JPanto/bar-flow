import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  createProductCategory,
  createProduct,
  updateProductStock,
  createProductOrder,
  confirmProductOrder,
} from '../src/db';

describe('Dexie Catalog & Products Local Storage', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.product_categories.clear();
    await db.product_orders.clear();
    await db.order_items.clear();
    await db.sync_queue.clear();
    await db.app_settings.clear();
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
    expect(storedProd?.categoryId).toBe(cat.id);
  });

  it('updates product stock and logs sync event', async () => {
    const cat = await createProductCategory(db, {
      name: 'Cocteles',
      sortOrder: 2,
    });

    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Mojito Clásico',
      price: 18000,
      stock: 15,
    });

    await updateProductStock(db, prod.id, 10);

    const updated = await db.products.get(prod.id);
    expect(updated?.stock).toBe(10);

    const syncEvents = await db.sync_queue.where('entity').equals('product').toArray();
    expect(syncEvents.length).toBeGreaterThanOrEqual(2); // INSERT + UPDATE
    const updateEvent = syncEvents.find((e) => e.action === 'UPDATE');
    expect(updateEvent?.payload.stock).toBe(10);
  });

  it('creates product orders with order items and logs to sync queue', async () => {
    const cat = await createProductCategory(db, { name: 'Comidas' });
    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Nachos con Queso',
      price: 22000,
      stock: 8,
    });

    const order = await createProductOrder(db, {
      tableId: 'table-1',
      sessionId: 'sess-123',
      tableName: 'Mesa 1',
      sessionWord: 'azul-sol',
      totalAmount: 44000,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          unitPrice: prod.price,
          quantity: 2,
          notes: 'Extra jalapeños',
        },
      ],
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');

    const storedOrder = await db.product_orders.get(order.id);
    expect(storedOrder).toBeDefined();
    expect(storedOrder?.tableName).toBe('Mesa 1');

    const storedItems = await db.order_items.where('orderId').equals(order.id).toArray();
    expect(storedItems).toHaveLength(1);
    expect(storedItems[0].quantity).toBe(2);
    expect(storedItems[0].notes).toBe('Extra jalapeños');

    const orderSync = await db.sync_queue.where('entity').equals('product_order').first();
    expect(orderSync).toBeDefined();
    expect(orderSync?.action).toBe('INSERT');
    expect(orderSync?.payload.items).toHaveLength(1);
  });

  it('confirms product order, deducting stock and updating totalOrders', async () => {
    const cat = await createProductCategory(db, { name: 'Cervezas' });
    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Corona Extra',
      price: 12000,
      stock: 10,
      totalOrders: 3,
    });

    const order = await createProductOrder(db, {
      tableId: 'table-2',
      sessionId: 'sess-456',
      tableName: 'Mesa 2',
      sessionWord: 'luna-roja',
      totalAmount: 36000,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          unitPrice: prod.price,
          quantity: 3,
        },
      ],
    });

    const result = await confirmProductOrder(db, order.id);
    expect(result.success).toBe(true);

    const updatedProd = await db.products.get(prod.id);
    expect(updatedProd?.stock).toBe(7); // 10 - 3
    expect(updatedProd?.totalOrders).toBe(6); // 3 + 3

    const confirmedOrder = await db.product_orders.get(order.id);
    expect(confirmedOrder?.status).toBe('confirmed');
    expect(confirmedOrder?.confirmedAt).toBeDefined();
  });

  it('fails confirmation gracefully if stock is insufficient', async () => {
    const cat = await createProductCategory(db, { name: 'Licores' });
    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Whisky 12 Años',
      price: 35000,
      stock: 1,
    });

    const order = await createProductOrder(db, {
      tableId: 'table-3',
      sessionId: 'sess-789',
      tableName: 'Mesa 3',
      sessionWord: 'vino-mar',
      totalAmount: 70000,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          unitPrice: prod.price,
          quantity: 2,
        },
      ],
    });

    const result = await confirmProductOrder(db, order.id);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('insufficient_stock');

    const unchangedProd = await db.products.get(prod.id);
    expect(unchangedProd?.stock).toBe(1);

    const pendingOrder = await db.product_orders.get(order.id);
    expect(pendingOrder?.status).toBe('pending');
  });

  it('persists and retrieves app_settings in Dexie', async () => {
    await db.app_settings.put({
      key: 'show_favorites_ranking',
      tenantId: 'default',
      value: true,
      updatedAt: Date.now(),
    });

    const setting = await db.app_settings.get('show_favorites_ranking');
    expect(setting?.value).toBe(true);
  });

  it('seeds initial categories, products, and settings idempotently', async () => {
    const { seedInitialData } = await import('../src/db/seed');
    await seedInitialData(db);

    const categories = await db.product_categories.toArray();
    expect(categories.length).toBe(3);
    const categoryNames = categories.map((c) => c.name);
    expect(categoryNames).toContain('Cervezas & Licores');
    expect(categoryNames).toContain('Cocteles');
    expect(categoryNames).toContain('Tapas & Entradas');

    const products = await db.products.toArray();
    expect(products.length).toBe(6);
    const corona = products.find((p) => p.name === 'Cerveza Corona');
    expect(corona?.stock).toBe(24);
    expect(corona?.price).toBe(12000);

    const setting = await db.app_settings.get('show_favorites_ranking');
    expect(setting?.value).toBe(true);

    // Idempotency check: running seed again should not duplicate products or categories
    await seedInitialData(db);
    expect((await db.product_categories.toArray()).length).toBe(3);
    expect((await db.products.toArray()).length).toBe(6);
  });
});

