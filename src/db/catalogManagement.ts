import type { BarMvpDB } from './index';
import { logSyncEvent } from './index';
import type { Product, ProductCategory, AppSettings } from '../types/database';

export async function updateProduct(
  database: BarMvpDB,
  productId: string,
  changes: Partial<Product>
): Promise<void> {
  const updateData = {
    ...changes,
    updatedAt: Date.now(),
  };

  await database.transaction(
    'rw',
    database.products,
    database.sync_queue,
    async () => {
      await database.products.update(productId, updateData);
      await logSyncEvent(database, 'product', 'UPDATE', productId, {
        id: productId,
        ...updateData,
      });
    }
  );
}

export async function deleteProduct(
  database: BarMvpDB,
  productId: string
): Promise<void> {
  await database.transaction(
    'rw',
    database.products,
    database.sync_queue,
    async () => {
      await database.products.delete(productId);
      await logSyncEvent(database, 'product', 'DELETE', productId, { id: productId });
    }
  );
}

export async function updateProductCategory(
  database: BarMvpDB,
  categoryId: string,
  changes: Partial<ProductCategory>
): Promise<void> {
  await database.transaction(
    'rw',
    database.product_categories,
    database.sync_queue,
    async () => {
      await database.product_categories.update(categoryId, changes);
      await logSyncEvent(database, 'category', 'UPDATE', categoryId, {
        id: categoryId,
        ...changes,
      });
    }
  );
}

export async function deleteProductCategory(
  database: BarMvpDB,
  categoryId: string
): Promise<void> {
  await database.transaction(
    'rw',
    database.product_categories,
    database.sync_queue,
    async () => {
      await database.product_categories.delete(categoryId);
      await logSyncEvent(database, 'category', 'DELETE', categoryId, { id: categoryId });
    }
  );
}

export async function updateAppSetting(
  database: BarMvpDB,
  key: string,
  value: any,
  tenantId: string = 'default'
): Promise<AppSettings> {
  const setting: AppSettings = {
    key,
    tenantId,
    value,
    updatedAt: Date.now(),
  };

  await database.transaction(
    'rw',
    database.app_settings,
    database.sync_queue,
    async () => {
      await database.app_settings.put(setting);
      await logSyncEvent(database, 'app_settings', 'UPDATE', key, setting);
    }
  );

  return setting;
}
