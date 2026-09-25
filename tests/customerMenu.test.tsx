import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductCard } from '../src/components/customer/ProductCard';
import { FavoritesRanking } from '../src/components/customer/FavoritesRanking';
import { OrderCartDrawer, CartItem } from '../src/components/customer/OrderCartDrawer';
import { CustomerMenu } from '../src/components/customer/CustomerMenu';
import { CustomerPortal } from '../src/components/customer/CustomerPortal';
import { db, createProductCategory, createProduct, createTable } from '../src/db';
import { Product } from '../src/types/database';

describe('ProductCard Component', () => {
  const mockProduct: Product = {
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

  it('displays product details, formatted price and available stock', () => {
    render(
      <ProductCard
        product={mockProduct}
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
    const outOfStockProduct: Product = {
      ...mockProduct,
      id: 'p-2',
      name: 'Cerveza Especial',
      stock: 0,
    };

    render(
      <ProductCard
        product={outOfStockProduct}
        quantityInCart={0}
        onAddToCart={vi.fn()}
        onUpdateQuantity={vi.fn()}
      />
    );

    expect(screen.getByText('Agotado')).toBeDefined();
    const btn = screen.getByRole('button', { name: /agotado/i });
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('shows badge when stock is low (stock <= 3)', () => {
    const lowStockProduct: Product = {
      ...mockProduct,
      id: 'p-3',
      stock: 2,
    };

    render(
      <ProductCard
        product={lowStockProduct}
        quantityInCart={0}
        onAddToCart={vi.fn()}
        onUpdateQuantity={vi.fn()}
      />
    );

    expect(screen.getByText('Últimas 2 unidades')).toBeDefined();
  });

  it('handles onAddToCart and quantity changes', () => {
    const onAddToCart = vi.fn();
    const onUpdateQuantity = vi.fn();

    const { rerender } = render(
      <ProductCard
        product={mockProduct}
        quantityInCart={0}
        onAddToCart={onAddToCart}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    fireEvent.click(screen.getByText('Agregar'));
    expect(onAddToCart).toHaveBeenCalledTimes(1);

    // Now re-render with quantity 2 in cart
    rerender(
      <ProductCard
        product={mockProduct}
        quantityInCart={2}
        onAddToCart={onAddToCart}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    expect(screen.getByText('2')).toBeDefined();

    // Increment
    fireEvent.click(screen.getByLabelText('Aumentar cantidad'));
    expect(onUpdateQuantity).toHaveBeenCalledWith(3, mockProduct);

    // Decrement
    fireEvent.click(screen.getByLabelText('Disminuir cantidad'));
    expect(onUpdateQuantity).toHaveBeenCalledWith(1, mockProduct);
  });

  it('disables plus button when quantity in cart reaches stock limit', () => {
    const onUpdateQuantity = vi.fn();

    render(
      <ProductCard
        product={{ ...mockProduct, stock: 3 }}
        quantityInCart={3}
        onAddToCart={vi.fn()}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    const plusBtn = screen.getByLabelText('Aumentar cantidad');
    expect(plusBtn.hasAttribute('disabled')).toBe(true);
    fireEvent.click(plusBtn);
    expect(onUpdateQuantity).not.toHaveBeenCalled();
  });
});

describe('FavoritesRanking Component', () => {
  const favoriteProduct: Product = {
    id: 'fav-1',
    categoryId: 'cat-1',
    name: 'Gin Tonic Botánico',
    price: 22000,
    stock: 10,
    isActive: true,
    totalOrders: 35,
    updatedAt: Date.now(),
  };

  it('renders top favorites with ranking indicator', () => {
    render(
      <FavoritesRanking
        favorites={[favoriteProduct]}
        getQuantityInCart={() => 0}
        onAddToCart={vi.fn()}
      />
    );

    expect(screen.getByText('Los más pedidos')).toBeDefined();
    expect(screen.getByText('Gin Tonic Botánico')).toBeDefined();
    expect(screen.getByText('$22.000')).toBeDefined();
    expect(screen.getByText('#1')).toBeDefined();
  });

  it('returns null if favorites list is empty', () => {
    const { container } = render(
      <FavoritesRanking
        favorites={[]}
        getQuantityInCart={() => 0}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('OrderCartDrawer Component', () => {
  const cartItems: CartItem[] = [
    {
      product: {
        id: 'p-1',
        categoryId: 'c-1',
        name: 'Margarita Clásica',
        price: 20000,
        stock: 5,
        isActive: true,
        totalOrders: 10,
        updatedAt: Date.now(),
      },
      quantity: 2,
      notes: 'sin sal en el borde',
    },
  ];

  it('renders floating bar when closed and opens drawer on click', () => {
    const onOpen = vi.fn();
    render(
      <OrderCartDrawer
        items={cartItems}
        isOpen={false}
        onOpen={onOpen}
        onClose={vi.fn()}
        onUpdateQuantity={vi.fn()}
        onUpdateNotes={vi.fn()}
        onSubmitOrder={vi.fn()}
      />
    );

    const trigger = screen.getByText(/Ver Pedido \(2 items\) — \$40\.000/i);
    expect(trigger).toBeDefined();

    fireEvent.click(trigger);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders item breakdown and enables notes and order submission when open', () => {
    const onUpdateNotes = vi.fn();
    const onSubmitOrder = vi.fn();
    const onClose = vi.fn();

    render(
      <OrderCartDrawer
        items={cartItems}
        isOpen={true}
        onOpen={vi.fn()}
        onClose={onClose}
        onUpdateQuantity={vi.fn()}
        onUpdateNotes={onUpdateNotes}
        onSubmitOrder={onSubmitOrder}
      />
    );

    expect(screen.getByText('Tu Pedido')).toBeDefined();
    expect(screen.getByText('Margarita Clásica')).toBeDefined();
    expect(screen.getByDisplayValue('sin sal en el borde')).toBeDefined();

    // Edit notes
    const notesInput = screen.getByPlaceholderText(/Nota opcional/i);
    fireEvent.change(notesInput, { target: { value: 'bien frío' } });
    expect(onUpdateNotes).toHaveBeenCalledWith('p-1', 'bien frío');

    // Submit order
    const submitBtn = screen.getByText('Enviar Pedido a Mesa');
    fireEvent.click(submitBtn);
    expect(onSubmitOrder).toHaveBeenCalledTimes(1);

    // Close button
    const closeBtn = screen.getByLabelText('Cerrar pedido');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CustomerMenu Component Integration', () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.product_categories.clear();
    await db.product_orders.clear();
    await db.order_items.clear();
    await db.restaurantTables.clear();
    await db.table_sessions.clear();

    const cat1 = await createProductCategory(db, { name: 'Cocteles', sortOrder: 1 });
    const cat2 = await createProductCategory(db, { name: 'Cervezas', sortOrder: 2 });

    await createProduct(db, {
      categoryId: cat1.id,
      name: 'Mojito Maracuyá',
      description: 'Dulce y refrescante',
      price: 19000,
      stock: 10,
      totalOrders: 8,
    });

    await createProduct(db, {
      categoryId: cat2.id,
      name: 'Corona Extra',
      description: 'Cerveza importada',
      price: 12000,
      stock: 15,
      totalOrders: 20,
    });
  });

  it('renders products and filters via category selector tabs', async () => {
    render(
      <CustomerMenu
        tableId="tbl-1"
        sessionId="ses-1"
        tableName="Mesa 1"
        sessionWord="LUNA"
      />
    );

    // Wait for Dexie products to load
    await waitFor(() => {
      expect(screen.getAllByText('Mojito Maracuyá').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Corona Extra').length).toBeGreaterThan(0);
    });

    // Filter by Cocteles category
    const coctelesTab = screen.getByRole('button', { name: 'Cocteles' });
    fireEvent.click(coctelesTab);

    await waitFor(() => {
      expect(screen.getByText('Mojito Maracuyá')).toBeDefined();
      expect(screen.queryByText('Corona Extra')).toBeNull();
    });

    // Reset to "Todas"
    const todasTab = screen.getByRole('button', { name: 'Todas' });
    fireEvent.click(todasTab);

    await waitFor(() => {
      expect(screen.getAllByText('Mojito Maracuyá').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Corona Extra').length).toBeGreaterThan(0);
    });
  });

  it('filters products through search bar', async () => {
    render(
      <CustomerMenu
        tableId="tbl-1"
        sessionId="ses-1"
        tableName="Mesa 1"
        sessionWord="LUNA"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Mojito Maracuyá').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Buscar bebidas/i);
    fireEvent.change(searchInput, { target: { value: 'Corona' } });

    await waitFor(
      () => {
        expect(screen.queryByText('Mojito Maracuyá')).toBeNull();
        expect(screen.getByText('Corona Extra')).toBeDefined();
      },
      { timeout: 1000 }
    );
  });
});

describe('CustomerPortal Component Integration', () => {
  beforeEach(async () => {
    await db.restaurantTables.clear();
    await db.table_sessions.clear();
    await db.waiter_calls.clear();
    await db.product_orders.clear();
    await db.order_items.clear();

    await createTable(db, {
      id: 'table-portal-1',
      zoneId: 'z1',
      name: 'Mesa Terraza 4',
      shape: 'round',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
      seats: 4,
      rotation: 0,
      status: 'occupied',
    });

    await db.table_sessions.add({
      id: 'session-portal-1',
      tableId: 'table-portal-1',
      sessionWord: 'SOLAR',
      status: 'active',
      openedAt: Date.now(),
    });
  });

  it('renders top navigation tabs and allows switching between tabs', async () => {
    render(<CustomerPortal tableId="table-portal-1" />);

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByText('Mesa Terraza 4')).toBeDefined();
      expect(screen.getByText('Menú & Pedidos')).toBeDefined();
      expect(screen.getByText('Asistencia & Cuenta')).toBeDefined();
    });

    // Default tab is Menú & Pedidos
    expect(screen.getByPlaceholderText(/Buscar bebidas/i)).toBeDefined();

    // Switch to Asistencia & Cuenta
    fireEvent.click(screen.getByText('Asistencia & Cuenta'));

    await waitFor(() => {
      expect(screen.getByText('SOLAR')).toBeDefined();
      expect(screen.getByText('Mesero')).toBeDefined();
      expect(screen.getByText('La Cuenta')).toBeDefined();
    });
  });

  it('displays pending order banner and permits cancellation', async () => {
    await db.product_orders.add({
      id: 'order-pending-1',
      tenantId: 'default',
      tableId: 'table-portal-1',
      sessionId: 'session-portal-1',
      tableName: 'Mesa Terraza 4',
      sessionWord: 'SOLAR',
      status: 'pending',
      totalAmount: 31000,
      createdAt: Date.now(),
    });

    await db.order_items.add({
      id: 'item-1',
      orderId: 'order-pending-1',
      productId: 'p-1',
      productName: 'Mojito Maracuyá',
      unitPrice: 19000,
      quantity: 1,
    });

    render(<CustomerPortal tableId="table-portal-1" />);

    await waitFor(() => {
      expect(screen.getByText('Pedido pendiente de confirmación')).toBeDefined();
      expect(screen.getByText(/\$31\.000/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeDefined();
    });

    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(async () => {
      const updatedOrder = await db.product_orders.get('order-pending-1');
      expect(updatedOrder?.status).toBe('cancelled');
    });
  });
});
