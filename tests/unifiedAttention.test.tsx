import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedAttentionFeed } from '../src/components/service/UnifiedAttentionFeed';
import { OrderConfirmationModal } from '../src/components/service/OrderConfirmationModal';
import { ServiceStatsBar } from '../src/components/service/ServiceStatsBar';

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

  it('triggers onSelectCall and onSelectOrder upon clicking corresponding cards', () => {
    const onSelectCall = vi.fn();
    const onSelectOrder = vi.fn();

    const items = [
      {
        id: 'call-1',
        type: 'call' as const,
        tableName: 'Mesa 2',
        reason: 'help' as const,
        createdAt: Date.now() - 30000,
        urgency: { color: 'hsl(90, 80%, 45%)', isUrgent: false, elapsedMs: 30000 },
      },
      {
        id: 'order-1',
        type: 'order' as const,
        tableName: 'Mesa 5',
        itemSummary: '1x Mojito Clásico',
        totalAmount: 18000,
        createdAt: Date.now() - 250000,
        urgency: { color: 'hsl(10, 80%, 45%)', isUrgent: true, elapsedMs: 250000 },
      },
    ];

    render(
      <UnifiedAttentionFeed
        items={items}
        onSelectCall={onSelectCall}
        onSelectOrder={onSelectOrder}
      />
    );

    const callCard = screen.getByText('Mesa 2').closest('[data-testid="attention-item-call-1"]') ||
                     screen.getByText('Mesa 2').closest('button') ||
                     screen.getByText('Mesa 2');
    fireEvent.click(callCard);
    expect(onSelectCall).toHaveBeenCalledWith(expect.objectContaining({ id: 'call-1' }));

    const orderCard = screen.getByText('Mesa 5').closest('[data-testid="attention-item-order-1"]') ||
                      screen.getByText('Mesa 5').closest('button') ||
                      screen.getByText('Mesa 5');
    fireEvent.click(orderCard);
    expect(onSelectOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }));
  });

  it('applies pulsing urgency styles when item is marked urgent', () => {
    const items = [
      {
        id: 'call-critical',
        type: 'call' as const,
        tableName: 'Mesa Urgente',
        reason: 'bill' as const,
        createdAt: Date.now() - 300000,
        urgency: { color: 'hsl(0, 80%, 45%)', isUrgent: true, elapsedMs: 300000 },
      },
    ];

    const { container } = render(
      <UnifiedAttentionFeed
        items={items}
        onSelectCall={vi.fn()}
        onSelectOrder={vi.fn()}
      />
    );

    const urgentBadgeOrCard = container.querySelector('.animate-pulse');
    expect(urgentBadgeOrCard).not.toBeNull();
  });
});

describe('OrderConfirmationModal Component', () => {
  const mockOrder = {
    id: 'order-123',
    tableId: 'table-4',
    sessionId: 'sess-123',
    tableName: 'Mesa 4',
    sessionWord: 'azul-sol',
    status: 'pending' as const,
    totalAmount: 24000,
    createdAt: Date.now() - 60000,
    items: [
      {
        id: 'item-1',
        orderId: 'order-123',
        productId: 'prod-1',
        productName: 'Cerveza Corona',
        unitPrice: 12000,
        quantity: 2,
        notes: 'Bien frías por favor',
      },
    ],
  };

  it('renders order details, items and notes', () => {
    render(
      <OrderConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockOrder}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Mesa 4')).toBeDefined();
    expect(screen.getByText(/azul-sol/i)).toBeDefined();
    expect(screen.getByText(/Cerveza Corona/i)).toBeDefined();
    expect(screen.getByText(/Bien frías por favor/i)).toBeDefined();
    expect(screen.getAllByText(/24.000/i).length).toBeGreaterThan(0);
  });

  it('handles order confirmation successfully', async () => {
    const onConfirm = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();

    render(
      <OrderConfirmationModal
        isOpen={true}
        onClose={onClose}
        order={mockOrder}
        onConfirm={onConfirm}
        onReject={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirmar y despachar/i });
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith('order-123');
  });

  it('shows error alert when confirmation fails due to insufficient stock', async () => {
    const onConfirm = vi.fn().mockResolvedValue({
      success: false,
      reason: 'Stock insuficiente (disponible: 1)',
    });

    render(
      <OrderConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockOrder}
        onConfirm={onConfirm}
        onReject={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirmar y despachar/i });
    fireEvent.click(confirmButton);

    expect(await screen.findByText(/Stock insuficiente \(disponible: 1\)/i)).toBeDefined();
  });

  it('handles order rejection', async () => {
    const onReject = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();

    render(
      <OrderConfirmationModal
        isOpen={true}
        onClose={onClose}
        order={mockOrder}
        onConfirm={vi.fn()}
        onReject={onReject}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /rechazar pedido/i });
    fireEvent.click(rejectButton);

    expect(onReject).toHaveBeenCalledWith('order-123');
  });
});

describe('ServiceStatsBar Component with Orders Count', () => {
  it('displays pending orders count when provided', () => {
    render(
      <ServiceStatsBar
        tables={[]}
        pendingCallsCount={1}
        pendingOrdersCount={2}
      />
    );

    expect(screen.getByText(/2 pedidos en espera/i)).toBeDefined();
    expect(screen.getByText(/1 llamado/i)).toBeDefined();
  });
});
