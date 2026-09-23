import { describe, it, expect } from 'vitest';
import { snapToGrid, getTableStatusColors, clampWithinZone } from '../src/utils/canvasUtils';

describe('Canvas and Table Utilities', () => {
  it('should snap coordinates to grid intervals of 20px', () => {
    expect(snapToGrid(0)).toBe(0);
    expect(snapToGrid(8)).toBe(0);
    expect(snapToGrid(11)).toBe(20);
    expect(snapToGrid(29)).toBe(20);
    expect(snapToGrid(35)).toBe(40);
  });

  it('should return correct visual colors per table status', () => {
    const available = getTableStatusColors('available');
    expect(available.stroke).toBe('#10b981');
    expect(available.fill).toContain('#');

    const occupied = getTableStatusColors('occupied');
    expect(occupied.stroke).toBe('#ef4444');

    const reserved = getTableStatusColors('reserved');
    expect(reserved.stroke).toBe('#f59e0b');

    const blocked = getTableStatusColors('blocked');
    expect(blocked.stroke).toBe('#64748b');
  });

  it('should clamp position within zone dimensions', () => {
    const clamped = clampWithinZone(-50, -20, 100, 100, 1000, 800);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);

    const clampedMax = clampWithinZone(1200, 900, 100, 100, 1000, 800);
    expect(clampedMax.x).toBe(900);
    expect(clampedMax.y).toBe(700);
  });
});
