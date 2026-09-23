import { TableShape } from '../types/database';

export interface ChairPosition {
  x: number;
  y: number;
  rotation: number; // degrees
  size: number;
}

export function getChairsForTable(
  shape: TableShape,
  width: number,
  height: number,
  seats: number
): ChairPosition[] {
  if (seats <= 0) return [];

  const chairSize = Math.max(12, Math.min(18, Math.min(width, height) * 0.22));
  const offset = chairSize * 0.75;
  const chairs: ChairPosition[] = [];

  const cx = width / 2;
  const cy = height / 2;

  if (shape === 'round') {
    const radius = Math.min(width, height) / 2 + offset;
    const angleStep = 360 / seats;

    for (let i = 0; i < seats; i++) {
      const angle = i * angleStep;
      const rad = (angle * Math.PI) / 180;
      chairs.push({
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad),
        rotation: angle,
        size: chairSize,
      });
    }
    return chairs;
  }

  if (shape === 'counter') {
    // Bar stools placed along the customer edge (bottom of counter)
    const step = width / (seats + 1);
    for (let i = 1; i <= seats; i++) {
      chairs.push({
        x: step * i,
        y: height + offset,
        rotation: 90,
        size: chairSize,
      });
    }
    return chairs;
  }

  // Rectangular / Square tables
  if (seats === 1) {
    chairs.push({ x: cx, y: -offset, rotation: 270, size: chairSize });
    return chairs;
  }

  if (seats === 2) {
    // Top and Bottom
    chairs.push({ x: cx, y: -offset, rotation: 270, size: chairSize });
    chairs.push({ x: cx, y: height + offset, rotation: 90, size: chairSize });
    return chairs;
  }

  if (seats === 4) {
    // One per side
    chairs.push({ x: cx, y: -offset, rotation: 270, size: chairSize }); // Top
    chairs.push({ x: width + offset, y: cy, rotation: 0, size: chairSize }); // Right
    chairs.push({ x: cx, y: height + offset, rotation: 90, size: chairSize }); // Bottom
    chairs.push({ x: -offset, y: cy, rotation: 180, size: chairSize }); // Left
    return chairs;
  }

  // For seats > 4: 1 on each short end (left/right), rest split evenly between top and bottom
  const sideSeats = Math.max(0, seats - 2);
  const topSeats = Math.ceil(sideSeats / 2);
  const bottomSeats = Math.floor(sideSeats / 2);

  // Left & Right heads of the table
  chairs.push({ x: -offset, y: cy, rotation: 180, size: chairSize });
  chairs.push({ x: width + offset, y: cy, rotation: 0, size: chairSize });

  // Top side
  const topStep = width / (topSeats + 1);
  for (let i = 1; i <= topSeats; i++) {
    chairs.push({
      x: topStep * i,
      y: -offset,
      rotation: 270,
      size: chairSize,
    });
  }

  // Bottom side
  const bottomStep = width / (bottomSeats + 1);
  for (let i = 1; i <= bottomSeats; i++) {
    chairs.push({
      x: bottomStep * i,
      y: height + offset,
      rotation: 90,
      size: chairSize,
    });
  }

  return chairs;
}
