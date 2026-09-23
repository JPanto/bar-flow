import { describe, it, expect } from 'vitest';
import { getChairsForTable } from '../src/utils/chairGeometry';

describe('Chair Geometry Utility', () => {
  it('should calculate radial chair positions for a round table', () => {
    const chairs = getChairsForTable('round', 80, 80, 4);
    expect(chairs).toHaveLength(4);

    // Each chair should have coordinates, rotation and size
    chairs.forEach(chair => {
      expect(chair).toHaveProperty('x');
      expect(chair).toHaveProperty('y');
      expect(chair).toHaveProperty('rotation');
      expect(chair).toHaveProperty('size');
      expect(chair.size).toBeGreaterThan(0);
    });

    // Check angular spacing (90 degrees apart for 4 seats)
    const angles = chairs.map(c => c.rotation).sort((a, b) => a - b);
    expect(angles).toEqual([0, 90, 180, 270]);
  });

  it('should calculate chair positions for a rectangular table', () => {
    const chairs = getChairsForTable('rectangle', 160, 80, 6);
    expect(chairs).toHaveLength(6);
    // Should distribute 2 chairs on top, 2 on bottom, 1 on left, 1 on right
    // Or 3 on top, 3 on bottom
    chairs.forEach(chair => {
      expect(chair.size).toBeGreaterThan(0);
    });
  });

  it('should calculate chair positions for a counter/bar table', () => {
    const chairs = getChairsForTable('counter', 200, 50, 4);
    expect(chairs).toHaveLength(4);
    // Counter stools distributed evenly along the front edge
    chairs.forEach(chair => {
      expect(chair.y).toBeGreaterThan(0);
    });
  });

  it('should handle single chair or 0 chairs gracefully', () => {
    expect(getChairsForTable('round', 60, 60, 0)).toEqual([]);
    expect(getChairsForTable('round', 60, 60, 1)).toHaveLength(1);
  });
});
