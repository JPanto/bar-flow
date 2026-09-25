import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, BarMvpDB } from '../db';
import {
  AttentionItem,
  CallAttentionItem,
  OrderAttentionItem,
} from '../types/database';
import { calculateUrgency } from '../utils/urgencyGradient';

export interface UseUnifiedAttentionQueueReturn {
  items: AttentionItem[];
  pendingCallsCount: number;
  pendingOrdersCount: number;
  totalAttentionCount: number;
  highestUrgencyColor: string;
}

/**
 * Pure data fetching function that combines pending waiter calls and pending product orders,
 * calculates HSL urgency, and sorts by createdAt ascending (FIFO).
 */
export async function getUnifiedAttentionItems(
  database: BarMvpDB,
  currentTime = Date.now()
): Promise<AttentionItem[]> {
  const activeCalls = await database.waiter_calls
    .where('status')
    .anyOf(['pending', 'attending'])
    .toArray();

  const pendingOrders = await database.product_orders
    .where('status')
    .equals('pending')
    .toArray();

  const orderIds = pendingOrders.map((o) => o.id);
  const orderItems =
    orderIds.length > 0
      ? await database.order_items.where('orderId').anyOf(orderIds).toArray()
      : [];

  const itemsByOrderId = new Map<string, typeof orderItems>();
  for (const item of orderItems) {
    const list = itemsByOrderId.get(item.orderId) || [];
    list.push(item);
    itemsByOrderId.set(item.orderId, list);
  }

  const callItems: CallAttentionItem[] = activeCalls.map((call) => {
    const urgencyResult = calculateUrgency(call.createdAt, currentTime);
    return {
      id: call.id,
      type: 'call',
      tableId: call.tableId,
      tableName: call.tableName,
      sessionId: call.sessionId,
      sessionWord: call.sessionWord,
      reason: call.reason,
      status: call.status,
      createdAt: call.createdAt,
      call,
      urgency: {
        ...urgencyResult,
        color: urgencyResult.hslColor,
        isUrgent: urgencyResult.isCritical || urgencyResult.secondsElapsed >= 240,
        elapsedMs: urgencyResult.secondsElapsed * 1000,
      },
    };
  });

  const orderAttentionItems: OrderAttentionItem[] = pendingOrders.map((order) => {
    const items = itemsByOrderId.get(order.id) || [];
    const itemSummary =
      items.length > 0
        ? items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')
        : 'Sin ítems';
    const urgencyResult = calculateUrgency(order.createdAt, currentTime);
    return {
      id: order.id,
      type: 'order',
      tableId: order.tableId,
      tableName: order.tableName,
      sessionId: order.sessionId,
      sessionWord: order.sessionWord,
      itemSummary,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      order,
      items,
      urgency: {
        ...urgencyResult,
        color: urgencyResult.hslColor,
        isUrgent: urgencyResult.isCritical || urgencyResult.secondsElapsed >= 240,
        elapsedMs: urgencyResult.secondsElapsed * 1000,
      },
    };
  });

  return [...callItems, ...orderAttentionItems].sort(
    (a, b) => a.createdAt - b.createdAt
  );
}

/**
 * Hook to manage unified attention queue combining waiter calls and product orders (FIFO),
 * updating urgency continuously every second for fluid visual indicators.
 */
export function useUnifiedAttentionQueue(): UseUnifiedAttentionQueueReturn {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rawData = useLiveQuery(async () => {
    const activeCalls = await db.waiter_calls
      .where('status')
      .anyOf(['pending', 'attending'])
      .toArray();

    const pendingOrders = await db.product_orders
      .where('status')
      .equals('pending')
      .toArray();

    const orderIds = pendingOrders.map((o) => o.id);
    const orderItems =
      orderIds.length > 0
        ? await db.order_items.where('orderId').anyOf(orderIds).toArray()
        : [];

    return {
      activeCalls,
      pendingOrders,
      orderItems,
    };
  }, []);

  const { items, pendingCallsCount, pendingOrdersCount } = useMemo(() => {
    if (!rawData) {
      return { items: [], pendingCallsCount: 0, pendingOrdersCount: 0 };
    }

    const { activeCalls, pendingOrders, orderItems } = rawData;
    const itemsByOrderId = new Map<string, typeof orderItems>();
    for (const item of orderItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    const callItems: CallAttentionItem[] = activeCalls.map((call) => {
      const urgencyResult = calculateUrgency(call.createdAt, currentTime);
      return {
        id: call.id,
        type: 'call',
        tableId: call.tableId,
        tableName: call.tableName,
        sessionId: call.sessionId,
        sessionWord: call.sessionWord,
        reason: call.reason,
        status: call.status,
        createdAt: call.createdAt,
        call,
        urgency: {
          ...urgencyResult,
          color: urgencyResult.hslColor,
          isUrgent: urgencyResult.isCritical || urgencyResult.secondsElapsed >= 240,
          elapsedMs: urgencyResult.secondsElapsed * 1000,
        },
      };
    });

    const orderAttentionItems: OrderAttentionItem[] = pendingOrders.map((order) => {
      const items = itemsByOrderId.get(order.id) || [];
      const itemSummary =
        items.length > 0
          ? items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')
          : 'Sin ítems';
      const urgencyResult = calculateUrgency(order.createdAt, currentTime);
      return {
        id: order.id,
        type: 'order',
        tableId: order.tableId,
        tableName: order.tableName,
        sessionId: order.sessionId,
        sessionWord: order.sessionWord,
        itemSummary,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        order,
        items,
        urgency: {
          ...urgencyResult,
          color: urgencyResult.hslColor,
          isUrgent: urgencyResult.isCritical || urgencyResult.secondsElapsed >= 240,
          elapsedMs: urgencyResult.secondsElapsed * 1000,
        },
      };
    });

    const combined: AttentionItem[] = [...callItems, ...orderAttentionItems].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    return {
      items: combined,
      pendingCallsCount: callItems.length,
      pendingOrdersCount: orderAttentionItems.length,
    };
  }, [rawData, currentTime]);

  const highestUrgencyColor =
    items.length > 0 ? items[0].urgency.hslColor : '#10b981';

  return {
    items,
    pendingCallsCount,
    pendingOrdersCount,
    totalAttentionCount: items.length,
    highestUrgencyColor,
  };
}
