import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerMenu } from '../src/components/customer/CustomerMenu';
import { CustomerPortal } from '../src/components/customer/CustomerPortal';
import { db, createProductCategory, createProduct, createTable } from '../src/db';

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
