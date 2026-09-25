import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QuickStockAdjuster } from '../src/components/menu/QuickStockAdjuster';
import { CategoryFormModal } from '../src/components/menu/CategoryFormModal';
import { ProductFormModal } from '../src/components/menu/ProductFormModal';
import { MenuManagementTab } from '../src/components/menu/MenuManagementTab';
import { Navbar } from '../src/components/layout/Navbar';
import { db, createProductCategory, createProduct } from '../src/db';
import { ProductCategory, Product } from '../src/types/database';
import * as authHook from '../src/hooks/useAuth';

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

  it('disables decrement button when current stock is 0', () => {
    const onStockChange = vi.fn();
    render(<QuickStockAdjuster currentStock={0} onStockChange={onStockChange} />);

    const minusBtn = screen.getByRole('button', { name: /-/i });
    expect(minusBtn.hasAttribute('disabled')).toBe(true);

    fireEvent.click(minusBtn);
    expect(onStockChange).not.toHaveBeenCalled();
  });
});

describe('CategoryFormModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(<CategoryFormModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByText('Nueva Categoría')).toBeNull();
  });

  it('submits a new category with entered name and sortOrder', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<CategoryFormModal isOpen={true} onClose={onClose} onSave={onSave} />);

    expect(screen.getByText('Nueva Categoría')).toBeDefined();
    const nameInput = screen.getByPlaceholderText(/Ej: Cervezas/i);
    fireEvent.change(nameInput, { target: { value: 'Bebidas Calientes' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Categoría/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        name: 'Bebidas Calientes',
        sortOrder: 0,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('populates fields when editing an existing category', async () => {
    const onSave = vi.fn();
    const cat: ProductCategory = { id: 'c-1', name: 'Snacks', sortOrder: 3, createdAt: 100 };
    render(<CategoryFormModal isOpen={true} category={cat} onClose={vi.fn()} onSave={onSave} />);

    expect(screen.getByText('Editar Categoría')).toBeDefined();
    expect(screen.getByDisplayValue('Snacks')).toBeDefined();
    expect(screen.getByDisplayValue('3')).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        id: 'c-1',
        name: 'Snacks',
        sortOrder: 3,
      });
    });
  });
});

describe('ProductFormModal Component', () => {
  const categories: ProductCategory[] = [
    { id: 'cat-1', name: 'Licores', sortOrder: 1, createdAt: 100 },
    { id: 'cat-2', name: 'Comidas', sortOrder: 2, createdAt: 100 },
  ];

  it('creates a new product validating required fields', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <ProductFormModal
        isOpen={true}
        categories={categories}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Nuevo Producto')).toBeDefined();
    const nameInput = screen.getByPlaceholderText(/Ej: Hamburguesa/i);
    fireEvent.change(nameInput, { target: { value: 'Tequila Don Julio' } });

    const priceInput = screen.getByPlaceholderText('0');
    fireEvent.change(priceInput, { target: { value: '35000' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Producto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Tequila Don Julio',
          categoryId: 'cat-1',
          price: 35000,
          stock: 10,
          isActive: true,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('edits an existing product with its populated data', async () => {
    const onSave = vi.fn();
    const product: Product = {
      id: 'p-1',
      tenantId: 'default',
      categoryId: 'cat-2',
      name: 'Papas Bravas',
      description: 'Con salsa picante',
      price: 15000,
      stock: 7,
      isActive: true,
      totalOrders: 4,
      updatedAt: 100,
    };

    render(
      <ProductFormModal
        isOpen={true}
        product={product}
        categories={categories}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Editar Producto')).toBeDefined();
    expect(screen.getByDisplayValue('Papas Bravas')).toBeDefined();
    expect(screen.getByDisplayValue('Con salsa picante')).toBeDefined();

    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'p-1',
          name: 'Papas Bravas',
          price: 15000,
          stock: 7,
        })
      );
    });
  });
});

describe('MenuManagementTab Component', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.product_categories.clear();
    await db.app_settings.clear();

    const cat = await createProductCategory(db, { name: 'Cervezas', sortOrder: 1 });
    await createProduct(db, {
      categoryId: cat.id,
      name: 'Cerveza Club Colombia',
      description: 'Dorada y refrescante',
      price: 10000,
      stock: 4, // low stock (<= 5)
      isActive: true,
      totalOrders: 15,
    });

    await createProduct(db, {
      categoryId: cat.id,
      name: 'Cerveza Águila',
      description: 'Tradicional',
      price: 8000,
      stock: 0, // out of stock
      isActive: false,
      totalOrders: 5,
    });
  });

  it('renders KPIs, product list and adjusts stock inline', async () => {
    render(<MenuManagementTab />);

    await waitFor(() => {
      expect(screen.getByText('Gestión de Menú y Stock')).toBeDefined();
      expect(screen.getByText('Cerveza Club Colombia')).toBeDefined();
      expect(screen.getByText('Cerveza Águila')).toBeDefined();
    });

    // KPI cards: Active products = 1, Stock bajo = 1, Agotados = 1, Top seller = Club Colombia (15)
    expect(screen.getByText('Stock Bajo (≤ 5)')).toBeDefined();
    expect(screen.getByText(/Club Colombia \(15\)/i)).toBeDefined();

    // Inline stock adjustment for Club Colombia (from 4 to 5)
    const stockBadge = screen.getByTitle('Stock actual: 4');
    const adjuster = stockBadge.closest('div')!;
    const plusBtn = within(adjuster).getByRole('button', { name: /\+/i });
    fireEvent.click(plusBtn);

    await waitFor(async () => {
      const updated = await db.products.filter((p) => p.name === 'Cerveza Club Colombia').first();
      expect(updated?.stock).toBe(5);
    });
  });

  it('filters product list by search query', async () => {
    render(<MenuManagementTab />);

    await waitFor(() => {
      expect(screen.getByText('Cerveza Club Colombia')).toBeDefined();
      expect(screen.getByText('Cerveza Águila')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Águila' } });

    await waitFor(() => {
      expect(screen.queryByText('Cerveza Club Colombia')).toBeNull();
      expect(screen.getByText('Cerveza Águila')).toBeDefined();
    });
  });
});

describe('Navbar Role Based Access Control for Menu Tab', () => {
  const mockAuth = (role: 'manager' | 'staff') => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { id: `u-${role}`, email: `${role}@bar.com` } as any,
      session: { access_token: 'fake' } as any,
      role,
      tenantId: 'default',
      isLoading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      continueAsDemo: vi.fn(),
    });
  };

  it('displays Menu tab only for manager role', () => {
    mockAuth('manager');
    const { rerender } = render(
      <Navbar
        currentTab="service"
        onSelectTab={vi.fn()}
        isOnline={true}
        pendingSyncCount={0}
        onOpenBackup={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^Menú$/i })).toBeDefined();

    mockAuth('staff');
    rerender(
      <Navbar
        currentTab="service"
        onSelectTab={vi.fn()}
        isOnline={true}
        pendingSyncCount={0}
        onOpenBackup={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /^Menú$/i })).toBeNull();
  });
});
