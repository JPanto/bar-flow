import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../src/components/customer/ProductCard';
import { FavoritesRanking } from '../src/components/customer/FavoritesRanking';
import { OrderCartDrawer, CartItem } from '../src/components/customer/OrderCartDrawer';
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
