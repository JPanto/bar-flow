import { describe, it, expect } from 'vitest';
import { calculateUrgency, hslToHex } from '../src/utils/urgencyGradient';

describe('Continuous Chromatic Urgency Calculator', () => {
  it('should calculate green hue at 0 seconds', () => {
    const now = 1000000;
    const urgency = calculateUrgency(now, now);
    expect(urgency.secondsElapsed).toBe(0);
    expect(urgency.hue).toBeCloseTo(145, 0);
    expect(urgency.isCritical).toBe(false);
    expect(urgency.urgencyLabel).toBe('Reciente');
  });

  it('should smoothly transition to yellow around 120s (2 min)', () => {
    const now = 1000000;
    const createdAt = now - 120 * 1000;
    const urgency = calculateUrgency(createdAt, now);
    expect(urgency.secondsElapsed).toBe(120);
    expect(urgency.hue).toBeCloseTo(60, 1);
    expect(urgency.formattedTime).toBe('2m 0s');
  });

  it('should smoothly transition to orange around 240s (4 min)', () => {
    const now = 1000000;
    const createdAt = now - 240 * 1000;
    const urgency = calculateUrgency(createdAt, now);
    expect(urgency.secondsElapsed).toBe(240);
    expect(urgency.hue).toBeCloseTo(25, 1);
  });

  it('should reach red and set isCritical when wait time exceeds 300s', () => {
    const now = 1000000;
    const createdAt = now - 360 * 1000; // 6 min
    const urgency = calculateUrgency(createdAt, now);
    expect(urgency.secondsElapsed).toBe(360);
    expect(urgency.hue).toBe(0);
    expect(urgency.isCritical).toBe(true);
    expect(urgency.urgencyLabel).toBe('Crítico');
  });

  it('should convert HSL to valid HEX code for canvas strokes', () => {
    const hex = hslToHex(145, 85, 48);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
