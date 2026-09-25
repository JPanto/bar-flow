import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, BarMvpDB } from '../db';
import { Product, ProductCategory } from '../types/database';

export interface CustomerMenuData {
  categories: ProductCategory[];
  products: Product[];
  favorites: Product[];
  showFavoritesRanking: boolean;
}

export interface UseCustomerMenuOptions {
  selectedCategoryId?: string | null;
  searchQuery?: string;
  tenantId?: string;
}

/**
 * Pure data fetching function for customer menu and favorites ranking.
 */
export async function getCustomerMenuData(
  database: BarMvpDB,
  options?: UseCustomerMenuOptions
): Promise<CustomerMenuData> {
  const tenantId = options?.tenantId;

  // 1. Fetch categories and sort by sortOrder ascending
  const rawCategories = await database.product_categories.toArray();
  const categories = rawCategories
    .filter((c) => !tenantId || (c.tenantId || 'default') === tenantId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // 2. Fetch all active products
  const rawProducts = await database.products.toArray();
  const allActiveProducts = rawProducts.filter(
    (p) => (!tenantId || (p.tenantId || 'default') === tenantId) && p.isActive !== false
  );

  // 3. Check App Settings for favorites ranking display
  const setting = await database.app_settings.get('show_favorites_ranking');
  const showFavoritesRanking = setting ? Boolean(setting.value) : true;

  // 4. Favorites: Top 5 products with highest totalOrders > 0
  const favorites = showFavoritesRanking
    ? [...allActiveProducts]
        .filter((p) => (p.totalOrders || 0) > 0)
        .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
        .slice(0, 5)
    : [];

  // 5. Filter products by selected category and search query
  let products = allActiveProducts;
  if (options?.selectedCategoryId && options.selectedCategoryId !== 'all') {
    products = products.filter((p) => p.categoryId === options.selectedCategoryId);
  }

  if (options?.searchQuery && options.searchQuery.trim().length > 0) {
    const q = options.searchQuery.trim().toLowerCase();
    products = products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
      return matchName || matchDesc;
    });
  }

  return {
    categories,
    products,
    favorites,
    showFavoritesRanking,
  };
}

export interface UseCustomerMenuReturn extends CustomerMenuData {
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
}

/**
 * Reactive hook for customer menu browsing, category filtering, search, and favorites ranking.
 */
export function useCustomerMenu(options?: UseCustomerMenuOptions): UseCustomerMenuReturn {
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<string | null>(
    options?.selectedCategoryId ?? null
  );
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>(
    options?.searchQuery ?? ''
  );

  const selectedCategoryId =
    options?.selectedCategoryId !== undefined
      ? options.selectedCategoryId
      : internalSelectedCategory;

  const searchQuery =
    options?.searchQuery !== undefined ? options.searchQuery : internalSearchQuery;

  const data = useLiveQuery(
    () =>
      getCustomerMenuData(db, {
        selectedCategoryId,
        searchQuery,
        tenantId: options?.tenantId,
      }),
    [selectedCategoryId, searchQuery, options?.tenantId]
  );

  return {
    categories: data?.categories || [],
    products: data?.products || [],
    favorites: data?.favorites || [],
    showFavoritesRanking: data?.showFavoritesRanking ?? true,
    selectedCategoryId,
    setSelectedCategoryId: setInternalSelectedCategory,
    searchQuery,
    setSearchQuery: setInternalSearchQuery,
    isLoading: data === undefined,
  };
}
