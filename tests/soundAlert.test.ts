import { describe, it, expect, vi } from 'vitest';
import { playServiceChime } from '../src/utils/soundAlert';

describe('Sound Alert Utility', () => {
  it('should run playServiceChime without throwing even if AudioContext is unavailable or mocked', () => {
    expect(() => playServiceChime()).not.toThrow();
  });
});
