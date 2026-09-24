import { describe, it, expect, vi } from 'vitest';
import { RealtimeService, RealtimeEvent } from '../src/services/realtime';

describe('Realtime Communication Service', () => {
  it('should publish and receive events across local subscribers', () => {
    const service = new RealtimeService({ enableBroadcastChannel: false });
    const listener = vi.fn();

    const unsubscribe = service.subscribe(listener);

    const event: RealtimeEvent = {
      type: 'CALL_CREATED',
      payload: { callId: '123', tableId: 'table-1' },
      timestamp: Date.now(),
    };

    service.publish(event);
    expect(listener).toHaveBeenCalledWith(event);

    unsubscribe();
    service.publish(event);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should support multiple concurrent listeners', () => {
    const service = new RealtimeService({ enableBroadcastChannel: false });
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    service.subscribe(listener1);
    service.subscribe(listener2);

    const event: RealtimeEvent = {
      type: 'CALL_RESOLVED',
      payload: { callId: '456' },
      timestamp: Date.now(),
    };

    service.publish(event);
    expect(listener1).toHaveBeenCalledWith(event);
    expect(listener2).toHaveBeenCalledWith(event);
  });
});
