import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  createWaiterCall,
  cancelWaiterCall,
  startTableSession,
  updateTableStatus,
} from '../db';
import { generateSessionWord } from '../utils/wordGenerator';
import { calculateUrgency, UrgencyInfo } from '../utils/urgencyGradient';
import { realtimeService } from '../services/realtime';
import { syncService } from '../services/syncService';
import { CallReason, TableElement, TableSession, WaiterCall } from '../types/database';

export interface UseCustomerSessionReturn {
  table: TableElement | undefined;
  activeSession: TableSession | null | undefined;
  activeCall: WaiterCall | null | undefined;
  urgency: UrgencyInfo | null;
  copied: boolean;
  isSubmitting: boolean;
  handleCopyWord: () => void;
  handleCall: (reason: CallReason) => Promise<void>;
  handleCancelCall: () => Promise<void>;
}

export function useCustomerSession(tableId: string): UseCustomerSessionReturn {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live timer tick every 1 second for smooth chromatic gradient transition
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch table and active session
  const table = useLiveQuery(() => db.restaurantTables.get(tableId), [tableId]);
  const activeSession = useLiveQuery(
    () => db.table_sessions.where({ tableId, status: 'active' }).first(),
    [tableId]
  );

  // Fetch active call for this table
  const activeCall = useLiveQuery(
    () =>
      db.waiter_calls
        .where('tableId')
        .equals(tableId)
        .filter((c) => c.status === 'pending' || c.status === 'attending')
        .first(),
    [tableId]
  );

  // Auto-start table session if none is currently active for this table
  useEffect(() => {
    if (!table || activeSession !== null) return;

    let isMounted = true;
    const initSession = async () => {
      try {
        const activeSessions = await db.table_sessions.where({ status: 'active' }).toArray();
        const activeWords = activeSessions.map((s) => s.sessionWord);
        const sessionWord = generateSessionWord(activeWords);
        const session = await startTableSession(db, table.id, sessionWord);
        if (table.status !== 'occupied') {
          await updateTableStatus(db, table.id, 'occupied');
        }
        if (isMounted) {
          realtimeService.publish({
            type: 'SESSION_STARTED',
            payload: { session },
            timestamp: Date.now(),
          });
          syncService.triggerSync();
        }
      } catch (err) {
        console.error('Error starting table session:', err);
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, [table, activeSession]);

  const urgency = activeCall
    ? calculateUrgency(activeCall.createdAt, currentTime)
    : null;

  const handleCopyWord = () => {
    if (activeSession?.sessionWord) {
      navigator.clipboard.writeText(activeSession.sessionWord);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCall = async (reason: CallReason) => {
    if (!table || !activeSession || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const call = await createWaiterCall(db, {
        tableId: table.id,
        sessionId: activeSession.id,
        tableName: table.name,
        sessionWord: activeSession.sessionWord,
        reason,
      });

      // Broadcast in real-time
      realtimeService.publish({
        type: 'CALL_CREATED',
        payload: { call },
        timestamp: Date.now(),
      });
      syncService.triggerSync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCall = async () => {
    if (!activeCall) return;
    await cancelWaiterCall(db, activeCall.id);
    realtimeService.publish({
      type: 'CALL_CANCELLED',
      payload: { callId: activeCall.id },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  };

  return {
    table,
    activeSession,
    activeCall,
    urgency,
    copied,
    isSubmitting,
    handleCopyWord,
    handleCall,
    handleCancelCall,
  };
}
