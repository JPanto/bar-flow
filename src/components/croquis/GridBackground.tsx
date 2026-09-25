import React from 'react';
import { Rect, Line, Group } from 'react-konva';

interface GridBackgroundProps {
  zoneWidth: number;
  zoneHeight: number;
  gridSize?: number;
  showGrid?: boolean;
  isDark?: boolean;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  zoneWidth,
  zoneHeight,
  gridSize = 20,
  showGrid = true,
  isDark = true,
}) => {
  const lines: React.ReactNode[] = [];

  const majorLineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)';
  const minorLineColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
  const floorFill = isDark ? '#141416' : '#ffffff';
  const floorStroke = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)';

  if (showGrid) {
    // Vertical grid lines
    for (let x = 0; x <= zoneWidth; x += gridSize * 2) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, zoneHeight]}
          stroke={x % (gridSize * 10) === 0 ? majorLineColor : minorLineColor}
          strokeWidth={x % (gridSize * 10) === 0 ? 1.5 : 0.8}
          listening={false}
        />
      );
    }

    // Horizontal grid lines
    for (let y = 0; y <= zoneHeight; y += gridSize * 2) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, zoneWidth, y]}
          stroke={y % (gridSize * 10) === 0 ? majorLineColor : minorLineColor}
          strokeWidth={y % (gridSize * 10) === 0 ? 1.5 : 0.8}
          listening={false}
        />
      );
    }
  }

  return (
    <Group listening={false}>
      {/* Floor boundary rect - Adapts dynamically to Light & Dark theme */}
      <Rect
        x={0}
        y={0}
        width={zoneWidth}
        height={zoneHeight}
        fill={floorFill}
        stroke={floorStroke}
        strokeWidth={1.5}
      />
      {lines}
    </Group>
  );
};
