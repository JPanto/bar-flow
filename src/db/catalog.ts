import type { BarMvpDB } from './index';
import { logSyncEvent } from './index';
import type {
  ProductCategory,
  Product,
  ProductOrder,
  OrderItem,
  OrderStatus,
} from '../types/database';

export interface CreateProductCategoryInput {
  id?: string;
  tenantId?: string;
  name: string;
  sortOrder?: number;
  createdAt?: number;
}

export interface CreateProductInput {
  id?: string;
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

export interface CreateOrderItemInput {
  id?: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface CreateProductOrderInput {
  id?: string;
  tenantId?: string;
  tableId: string;
  sessionId: string;
  tableName: string;
  sessionWord: string;
  status?: OrderStatus;
  totalAmount: number;
  createdAt?: number;
  items?: CreateOrderItemInput[];
}

export async function createProductCategory(
  database: BarMvpDB,
  data: CreateProductCategoryInput
): Promise<ProductCategory> {
  const category: ProductCategory = {
    id: data.id || crypto.randomUUID(),
    tenantId: data.tenantId || 'default',
    name: data.name,
    sortOrder: data.sortOrder ?? 0,
    createdAt: data.createdAt ?? Date.now(),
  };

  await database.transaction(
    'rw',
    database.product_categories,
    database.sync_queue,
    async () => {
      await database.product_categories.add(category);
      await logSyncEvent(database, 'category', 'INSERT', category.id, category);
    }
  );

  return category;
}

export async function createProduct(
  database: BarMvpDB,
  data: CreateProductInput
): Promise<Product> {
  const product: Product = {
    id: data.id || crypto.randomUUID(),
    tenantId: data.tenantId || 'default',
    categoryId: data.categoryId,
    name: data.name,
    description: data.description || '',
    price: data.price,
    stock: data.stock ?? 0,
    isActive: data.isActive ?? true,
    totalOrders: data.totalOrders ?? 0,
    updatedAt: data.updatedAt ?? Date.now(),
  };

  await database.transaction(
    'rw',
    database.products,
    database.sync_queue,
    async () => {
      await database.products.add(product);
      await logSyncEvent(database, 'product', 'INSERT', product.id, product);
    }
  );

  return product;
}

export async function updateProductStock(
  database: BarMvpDB,
  productId: string,
  newStock: number
): Promise<void> {
  const safeStock = Math.max(0, newStock);
  const changes = {
    stock: safeStock,
    updatedAt: Date.now(),
  };

  await database.transaction(
    'rw',
    database.products,
    database.sync_queue,
    async () => {
      await database.products.update(productId, changes);
      await logSyncEvent(database, 'product', 'UPDATE', productId, {
        id: productId,
        ...changes,
      });
    }
  );
}

export async function createProductOrder(
  database: BarMvpDB,
  data: CreateProductOrderInput
): Promise<ProductOrder> {
  const orderId = data.id || crypto.randomUUID();
  const order: ProductOrder = {
    id: orderId,
    tenantId: data.tenantId || 'default',
    tableId: data.tableId,
    sessionId: data.sessionId,
    tableName: data.tableName,
    sessionWord: data.sessionWord,
    status: data.status || 'pending',
    totalAmount: data.totalAmount,
    createdAt: data.createdAt ?? Date.now(),
    confirmedAt: null,
  };

  const orderItems: OrderItem[] = (data.items || []).map((it) => ({
    id: it.id || crypto.randomUUID(),
    orderId,
    productId: it.productId,
    productName: it.productName,
    unitPrice: it.unitPrice,
    quantity: it.quantity,
    notes: it.notes,
  }));

  await database.transaction(
    'rw',
    database.product_orders,
    database.order_items,
    database.sync_queue,
    async () => {
      await database.product_orders.add(order);
      for (const item of orderItems) {
        await database.order_items.add(item);
      }
      await logSyncEvent(database, 'product_order', 'INSERT', order.id, {
        ...order,
        items: orderItems,
      });
    }
  );

  return {
    ...order,
    items: orderItems,
  };
}

export async function confirmProductOrder(
  database: BarMvpDB,
  orderId: string
): Promise<{ success: boolean; reason?: string }> {
  return await database.transaction(
    'rw',
    database.product_orders,
    database.order_items,
    database.products,
    database.sync_queue,
    async () => {
      const order = await database.product_orders.get(orderId);
      if (!order) {
        return { success: false, reason: 'order_not_found' };
      }
      if (order.status !== 'pending') {
        return { success: false, reason: `order_already_${order.status}` };
      }

      const items = await database.order_items
        .where('orderId')
        .equals(orderId)
        .toArray();

      for (const item of items) {
        const prod = await database.products.get(item.productId);
        if (!prod || prod.stock < item.quantity) {
          return {
            success: false,
            reason: `insufficient_stock_for_${item.productName || item.productId}`,
          };
        }
      }

      for (const item of items) {
        const prod = (await database.products.get(item.productId))!;
        const newStock = Math.max(0, prod.stock - item.quantity);
        const newTotalOrders = (prod.totalOrders || 0) + item.quantity;
        const prodChanges = {
          stock: newStock,
          totalOrders: newTotalOrders,
          updatedAt: Date.now(),
        };
        await database.products.update(item.productId, prodChanges);
        await logSyncEvent(database, 'product', 'UPDATE', item.productId, {
          id: item.productId,
          ...prodChanges,
        });
      }

      const confirmedAt = Date.now();
      const orderChanges = {
        status: 'confirmed' as const,
        confirmedAt,
      };
      await database.product_orders.update(orderId, orderChanges);
      await logSyncEvent(database, 'product_order', 'UPDATE', orderId, {
        id: orderId,
        ...orderChanges,
      });

      return { success: true };
    }
  );
}
