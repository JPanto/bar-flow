import { useState } from 'react';
import {
  db,
  BarMvpDB,
  confirmProductOrder,
  createProductOrder,
  updateProductOrderStatus,
  CreateProductOrderInput,
} from '../db';
import { ProductOrder } from '../types/database';
import { realtimeService } from '../services/realtime';
import { syncService } from '../services/syncService';

/**
 * Confirms an order, atomically deducting stock and increasing totalOrders.
 * Emits realtime event and triggers background sync.
 */
export async function processOrderConfirmation(
  databaseOrOrderId: BarMvpDB | string,
  maybeOrderId?: string
): Promise<{ success: boolean; reason?: string }> {
  const database = typeof databaseOrOrderId === 'string' ? db : databaseOrOrderId;
  const orderId = typeof databaseOrOrderId === 'string' ? databaseOrOrderId : maybeOrderId!;

  const result = await confirmProductOrder(database, orderId);
  if (result.success) {
    realtimeService.publish({
      type: 'ORDER_CONFIRMED',
      payload: { orderId },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  }
  return result;
}

/**
 * Creates an order with items in Dexie, logs sync event and emits realtime broadcast.
 */
export async function createOrder(
  databaseOrInput: BarMvpDB | CreateProductOrderInput,
  maybeInput?: CreateProductOrderInput
): Promise<ProductOrder> {
  const database = typeof (databaseOrInput as any).product_orders !== 'undefined'
    ? (databaseOrInput as BarMvpDB)
    : db;
  const input = typeof (databaseOrInput as any).product_orders !== 'undefined'
    ? maybeInput!
    : (databaseOrInput as CreateProductOrderInput);

  const order = await createProductOrder(database, input);
  realtimeService.publish({
    type: 'ORDER_CREATED',
    payload: { order },
    timestamp: Date.now(),
  });
  syncService.triggerSync();
  return order;
}

/**
 * Cancels a pending order (e.g. by customer before confirmation).
 */
export async function cancelOrder(
  databaseOrOrderId: BarMvpDB | string,
  maybeOrderIdOrReason?: string,
  maybeReason?: string
): Promise<{ success: boolean; reason?: string }> {
  const isDbFirst = typeof databaseOrOrderId !== 'string';
  const database = isDbFirst ? (databaseOrOrderId as BarMvpDB) : db;
  const orderId = isDbFirst ? maybeOrderIdOrReason! : (databaseOrOrderId as string);
  const reason = isDbFirst ? maybeReason : maybeOrderIdOrReason;

  const result = await updateProductOrderStatus(database, orderId, 'cancelled', reason);
  if (result.success) {
    realtimeService.publish({
      type: 'ORDER_REJECTED',
      payload: { orderId, reason: reason || 'cancelled_by_customer' },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  }
  return result;
}

/**
 * Rejects a pending order (e.g. by staff or kitchen due to lack of ingredients).
 */
export async function rejectOrder(
  databaseOrOrderId: BarMvpDB | string,
  maybeOrderIdOrReason?: string,
  maybeReason?: string
): Promise<{ success: boolean; reason?: string }> {
  const isDbFirst = typeof databaseOrOrderId !== 'string';
  const database = isDbFirst ? (databaseOrOrderId as BarMvpDB) : db;
  const orderId = isDbFirst ? maybeOrderIdOrReason! : (databaseOrOrderId as string);
  const reason = isDbFirst ? maybeReason : maybeOrderIdOrReason;

  const result = await updateProductOrderStatus(database, orderId, 'rejected', reason);
  if (result.success) {
    realtimeService.publish({
      type: 'ORDER_REJECTED',
      payload: { orderId, reason },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  }
  return result;
}

export interface UseOrderManagementReturn {
  isProcessing: boolean;
  createOrder: (input: CreateProductOrderInput) => Promise<ProductOrder>;
  cancelOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; reason?: string }>;
  rejectOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; reason?: string }>;
  processOrderConfirmation: (orderId: string) => Promise<{ success: boolean; reason?: string }>;
}

/**
 * Custom Hook for managing customer and service orders.
 */
export function useOrderManagement(): UseOrderManagementReturn {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateOrder = async (input: CreateProductOrderInput) => {
    setIsProcessing(true);
    try {
      return await createOrder(db, input);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async (orderId: string, reason?: string) => {
    setIsProcessing(true);
    try {
      return await cancelOrder(db, orderId, reason);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOrder = async (orderId: string, reason?: string) => {
    setIsProcessing(true);
    try {
      return await rejectOrder(db, orderId, reason);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setIsProcessing(true);
    try {
      return await processOrderConfirmation(db, orderId);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    createOrder: handleCreateOrder,
    cancelOrder: handleCancelOrder,
    rejectOrder: handleRejectOrder,
    processOrderConfirmation: handleConfirmOrder,
  };
}
