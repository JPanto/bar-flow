import { describe, it, expect, beforeEach } from 'vitest';
import { db, createProduct, createProductCategory } from '../src/db';
import {
  processOrderConfirmation,
  createOrder,
  cancelOrder,
  rejectOrder,
} from '../src/hooks/useOrderManagement';
import { getCustomerMenuData } from '../src/hooks/useCustomerMenu';
import { getUnifiedAttentionItems } from '../src/hooks/useUnifiedAttentionQueue';

describe('Order Management & Stock Deduction', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.product_categories.clear();
    await db.product_orders.clear();
    await db.order_items.clear();
    await db.sync_queue.clear();
    await db.app_settings.clear();
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

  it('accumulates quantities by productId in pre-validation when duplicate items exist', async () => {
    const cat = await createProductCategory(db, { name: 'Cervezas' });
    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Club Colombia Dorada',
      price: 8000,
      stock: 5,
      totalOrders: 0,
    });

    const orderId = 'order-dup-fail';
    await db.product_orders.put({
      id: orderId,
      tenantId: 'default',
      tableId: 'table-1',
      sessionId: 'sess-1',
      tableName: 'Mesa 1',
      sessionWord: 'azul-sol',
      status: 'pending',
      totalAmount: 48000,
      createdAt: Date.now(),
    });

    // 2 duplicate lines of 3 items each -> total 6 > stock 5
    await db.order_items.put({
      id: 'item-dup-1',
      orderId,
      productId: prod.id,
      productName: prod.name,
      unitPrice: 8000,
      quantity: 3,
    });
    await db.order_items.put({
      id: 'item-dup-2',
      orderId,
      productId: prod.id,
      productName: prod.name,
      unitPrice: 8000,
      quantity: 3,
    });

    const result = await processOrderConfirmation(db, orderId);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('insufficient_stock');

    // Stock must remain intact
    const unchangedProd = await db.products.get(prod.id);
    expect(unchangedProd?.stock).toBe(5);
  });

  it('deducts accumulated quantities correctly when duplicate lines are within stock', async () => {
    const cat = await createProductCategory(db, { name: 'Cervezas' });
    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Corona Extra',
      price: 10000,
      stock: 10,
      totalOrders: 1,
    });

    const orderId = 'order-dup-success';
    await db.product_orders.put({
      id: orderId,
      tenantId: 'default',
      tableId: 'table-2',
      sessionId: 'sess-2',
      tableName: 'Mesa 2',
      sessionWord: 'verde-luna',
      status: 'pending',
      totalAmount: 50000,
      createdAt: Date.now(),
    });

    await db.order_items.put({
      id: 'item-d1',
      orderId,
      productId: prod.id,
      productName: prod.name,
      unitPrice: 10000,
      quantity: 2,
    });
    await db.order_items.put({
      id: 'item-d2',
      orderId,
      productId: prod.id,
      productName: prod.name,
      unitPrice: 10000,
      quantity: 3,
    });

    const result = await processOrderConfirmation(db, orderId);
    expect(result.success).toBe(true);

    const updatedProd = await db.products.get(prod.id);
    expect(updatedProd?.stock).toBe(5); // 10 - (2 + 3)
    expect(updatedProd?.totalOrders).toBe(6); // 1 + (2 + 3)
  });

  it('creates an order, stores items and records sync event', async () => {
    const cat = await createProductCategory(db, { name: 'Comida' });
    const prod = await createProduct(db, {
      categoryId: cat.id,
      name: 'Hamburguesa BarFlow',
      price: 25000,
      stock: 8,
    });

    const order = await createOrder(db, {
      tableId: 'table-3',
      sessionId: 'sess-3',
      tableName: 'Mesa 3',
      sessionWord: 'rojo-estrella',
      totalAmount: 50000,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          unitPrice: prod.price,
          quantity: 2,
          notes: 'Sin cebolla',
        },
      ],
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');
    expect(order.items?.length).toBe(1);

    const storedOrder = await db.product_orders.get(order.id);
    expect(storedOrder).toBeDefined();
    expect(storedOrder?.tableName).toBe('Mesa 3');

    const storedItems = await db.order_items.where('orderId').equals(order.id).toArray();
    expect(storedItems.length).toBe(1);
    expect(storedItems[0].notes).toBe('Sin cebolla');

    const syncEvents = await db.sync_queue.toArray();
    const orderSync = syncEvents.find((e) => e.entity === 'product_order' && e.entityId === order.id);
    expect(orderSync).toBeDefined();
  });

  it('rejects an order and updates status with sync event', async () => {
    const order = await createOrder(db, {
      tableId: 'table-4',
      sessionId: 'sess-4',
      tableName: 'Mesa 4',
      sessionWord: 'blanco-rio',
      totalAmount: 12000,
      items: [],
    });

    const result = await rejectOrder(db, order.id, 'Cocina cerrada');
    expect(result.success).toBe(true);

    const updated = await db.product_orders.get(order.id);
    expect(updated?.status).toBe('rejected');
  });

  it('cancels a pending order', async () => {
    const order = await createOrder(db, {
      tableId: 'table-5',
      sessionId: 'sess-5',
      tableName: 'Mesa 5',
      sessionWord: 'negro-mar',
      totalAmount: 18000,
      items: [],
    });

    const result = await cancelOrder(db, order.id);
    expect(result.success).toBe(true);

    const updated = await db.product_orders.get(order.id);
    expect(updated?.status).toBe('cancelled');
  });

  it('sorts categories by sortOrder and ranks top 5 favorites with totalOrders > 0', async () => {
    const catDrinks = await createProductCategory(db, { name: 'Bebidas', sortOrder: 2 });
    const catFood = await createProductCategory(db, { name: 'Comida', sortOrder: 1 });

    await createProduct(db, {
      categoryId: catDrinks.id,
      name: 'Mojito',
      price: 15000,
      totalOrders: 10,
    });
    await createProduct(db, {
      categoryId: catDrinks.id,
      name: 'Cerveza',
      price: 8000,
      totalOrders: 35,
    });
    await createProduct(db, {
      categoryId: catFood.id,
      name: 'Papas Fritas',
      price: 12000,
      totalOrders: 25,
    });
    await createProduct(db, {
      categoryId: catFood.id,
      name: 'Hamburguesa',
      price: 25000,
      totalOrders: 50,
    });
    await createProduct(db, {
      categoryId: catDrinks.id,
      name: 'Gaseosa',
      price: 5000,
      totalOrders: 5,
    });
    const p6 = await createProduct(db, {
      categoryId: catDrinks.id,
      name: 'Agua',
      price: 4000,
      totalOrders: 2,
    });
    const pInactive = await createProduct(db, {
      categoryId: catDrinks.id,
      name: 'Cóctel Secreto',
      price: 30000,
      totalOrders: 99,
      isActive: false,
    });

    const menu = await getCustomerMenuData(db);

    // Categories sorted by sortOrder
    expect(menu.categories[0].name).toBe('Comida'); // sortOrder: 1
    expect(menu.categories[1].name).toBe('Bebidas'); // sortOrder: 2

    // Top 5 favorites (active only, totalOrders > 0, descending)
    expect(menu.favorites.length).toBe(5);
    expect(menu.favorites[0].name).toBe('Hamburguesa'); // 50
    expect(menu.favorites[1].name).toBe('Cerveza'); // 35
    expect(menu.favorites[2].name).toBe('Papas Fritas'); // 25
    expect(menu.favorites[3].name).toBe('Mojito'); // 10
    expect(menu.favorites[4].name).toBe('Gaseosa'); // 5
    // pInactive (99) and p6 (2) should not be in top 5
    expect(menu.favorites.some((f) => f.id === pInactive.id)).toBe(false);
    expect(menu.favorites.some((f) => f.id === p6.id)).toBe(false);

    // Search query filtering
    const searchResult = await getCustomerMenuData(db, { searchQuery: 'papas' });
    expect(searchResult.products.length).toBe(1);
    expect(searchResult.products[0].name).toBe('Papas Fritas');

    // Category filtering
    const categoryResult = await getCustomerMenuData(db, { selectedCategoryId: catFood.id });
    expect(categoryResult.products.every((p) => p.categoryId === catFood.id)).toBe(true);
  });

  it('combines waiter calls and pending orders into a unified attention queue ordered by FIFO and calculates urgency', async () => {
    await db.waiter_calls.clear();
    await db.product_orders.clear();
    await db.order_items.clear();

    const now = Date.now();

    // Call created 5 minutes ago (300s -> Urgent/Critical)
    await db.waiter_calls.put({
      id: 'call-1',
      tableId: 't-1',
      tableName: 'Mesa 1',
      sessionId: 's-1',
      sessionWord: 'azul-sol',
      reason: 'waiter',
      status: 'pending',
      createdAt: now - 300000,
    });

    // Order created 2 minutes ago (120s)
    const orderId = 'order-1';
    await db.product_orders.put({
      id: orderId,
      tenantId: 'default',
      tableId: 't-2',
      tableName: 'Mesa 2',
      sessionId: 's-2',
      sessionWord: 'rojo-luna',
      status: 'pending',
      totalAmount: 32000,
      createdAt: now - 120000,
    });

    await db.order_items.put({
      id: 'item-u1',
      orderId,
      productId: 'p-1',
      productName: 'Cerveza Corona',
      unitPrice: 16000,
      quantity: 2,
    });

    // Resolved call should NOT appear
    await db.waiter_calls.put({
      id: 'call-resolved',
      tableId: 't-3',
      tableName: 'Mesa 3',
      sessionId: 's-3',
      sessionWord: 'verde-mar',
      reason: 'bill',
      status: 'resolved',
      createdAt: now - 500000,
    });

    // Confirmed order should NOT appear
    await db.product_orders.put({
      id: 'order-confirmed',
      tenantId: 'default',
      tableId: 't-4',
      tableName: 'Mesa 4',
      sessionId: 's-4',
      sessionWord: 'blanco-rio',
      status: 'confirmed',
      totalAmount: 20000,
      createdAt: now - 400000,
    });

    const attentionItems = await getUnifiedAttentionItems(db, now);

    expect(attentionItems.length).toBe(2);
    // Strict FIFO: call-1 (300s ago) before order-1 (120s ago)
    expect(attentionItems[0].id).toBe('call-1');
    expect(attentionItems[0].type).toBe('call');
    expect(attentionItems[0].urgency.secondsElapsed).toBeGreaterThanOrEqual(300);
    expect(attentionItems[0].urgency.color).toBeDefined();

    expect(attentionItems[1].id).toBe('order-1');
    expect(attentionItems[1].type).toBe('order');
    if (attentionItems[1].type === 'order') {
      expect(attentionItems[1].itemSummary).toBe('2x Cerveza Corona');
      expect(attentionItems[1].totalAmount).toBe(32000);
    }
  });
});
