import { TableStatus } from '../types/database';

export function snapToGrid(value: number, step = 20): number {
  return Math.round(value / step) * step;
}

export interface StatusColorConfig {
  fill: string;
  stroke: string;
  label: string;
  badgeBg: string;
  badgeText: string;
}

export function getTableStatusColors(status: TableStatus): StatusColorConfig {
  switch (status) {
    case 'available':
      return {
        fill: '#064e3b',       // Emerald 900
        stroke: '#10b981',     // Emerald 500
        label: 'Libre',
        badgeBg: '#059669',
        badgeText: '#ecfdf5',
      };
    case 'occupied':
      return {
        fill: '#881337',       // Rose 900
        stroke: '#ef4444',     // Rose 500
        label: 'Ocupada',
        badgeBg: '#e11d48',
        badgeText: '#fff1f2',
      };
    case 'reserved':
      return {
        fill: '#78350f',       // Amber 900
        stroke: '#f59e0b',     // Amber 500
        label: 'Reservada',
        badgeBg: '#d97706',
        badgeText: '#fffbeb',
      };
    case 'blocked':
      return {
        fill: '#1e293b',       // Slate 800
        stroke: '#64748b',     // Slate 500
        label: 'Bloqueada',
        badgeBg: '#475569',
        badgeText: '#f8fafc',
      };
    default:
      return {
        fill: '#0f172a',
        stroke: '#94a3b8',
        label: 'Desconocido',
        badgeBg: '#334155',
        badgeText: '#ffffff',
      };
  }
}

export function clampWithinZone(
  x: number,
  y: number,
  width: number,
  height: number,
  zoneWidth: number,
  zoneHeight: number
): { x: number; y: number } {
  const minX = 0;
  const minY = 0;
  const maxX = Math.max(0, zoneWidth - width);
  const maxY = Math.max(0, zoneHeight - height);

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}
