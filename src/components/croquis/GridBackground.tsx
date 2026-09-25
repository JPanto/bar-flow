import React from 'react';
import { Rect, Line, Group } from 'react-konva';

interface GridBackgroundProps {
  zoneWidth: number;
  zoneHeight: number;
  gridSize?: number;
  showGrid?: boolean;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  zoneWidth,
  zoneHeight,
  gridSize = 20,
  showGrid = true,
}) => {
  const lines: React.ReactNode[] = [];

  if (showGrid) {
    // Vertical lines
    for (let x = 0; x <= zoneWidth; x += gridSize * 2) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, zoneHeight]}
          stroke={x % (gridSize * 10) === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}
          strokeWidth={x % (gridSize * 10) === 0 ? 1.5 : 0.8}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= zoneHeight; y += gridSize * 2) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, zoneWidth, y]}
          stroke={y % (gridSize * 10) === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}
          strokeWidth={y % (gridSize * 10) === 0 ? 1.5 : 0.8}
          listening={false}
        />
      );
    }
  }

  return (
    <Group listening={false}>
      {/* Floor boundary rect - Fast 2D rendering without CPU blur */}
      <Rect
        x={0}
        y={0}
        width={zoneWidth}
        height={zoneHeight}
        fill="#0d0d10"
        stroke="rgba(255, 255, 255, 0.18)"
        strokeWidth={1.5}
      />
      {lines}
    </Group>
  );
};
