import { describe, it, expect, beforeEach } from 'vitest';
import { db, createProduct, createProductCategory } from '../src/db';
import { processOrderConfirmation } from '../src/hooks/useOrderManagement';

describe('Order Confirmation & Stock Deduction', () => {
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
});
