import { useLiveQuery } from 'dexie-react-hooks';
import { db, attendingWaiterCall, resolveWaiterCall } from '../db';
import { WaiterCall } from '../types/database';
import { calculateUrgency } from '../utils/urgencyGradient';
import { realtimeService } from '../services/realtime';
import { syncService } from '../services/syncService';

export interface UseWaiterCallsReturn {
  activeCalls: WaiterCall[];
  sortedActiveCalls: WaiterCall[];
  activeCallsCount: number;
  highestUrgencyColor: string;
  handleAttendCall: (callId: string) => Promise<void>;
  handleResolveCall: (callId: string) => Promise<void>;
}

/**
 * Hook to manage waiter calls queue (FIFO), urgency gradient calculations,
 * and waiter status actions (attending/resolved) with realtime broadcasts.
 */
export function useWaiterCalls(): UseWaiterCallsReturn {
  const activeCalls =
    useLiveQuery(() =>
      db.waiter_calls.where('status').anyOf(['pending', 'attending']).toArray()
    ) || [];

  // Strict FIFO sort (oldest call first)
  const sortedActiveCalls = [...activeCalls].sort((a, b) => a.createdAt - b.createdAt);

  const highestUrgency =
    sortedActiveCalls.length > 0 ? calculateUrgency(sortedActiveCalls[0].createdAt) : null;
  const highestUrgencyColor = highestUrgency ? highestUrgency.hslColor : '#10b981';

  const handleAttendCall = async (callId: string) => {
    await attendingWaiterCall(db, callId);
    realtimeService.publish({
      type: 'CALL_ATTENDING',
      payload: { callId },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  };

  const handleResolveCall = async (callId: string) => {
    await resolveWaiterCall(db, callId);
    realtimeService.publish({
      type: 'CALL_RESOLVED',
      payload: { callId },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  };

  return {
    activeCalls,
    sortedActiveCalls,
    activeCallsCount: sortedActiveCalls.length,
    highestUrgencyColor,
    handleAttendCall,
    handleResolveCall,
  };
}
