export interface UrgencyInfo {
  secondsElapsed: number;
  hue: number;
  hslColor: string;
  hslBgColor: string;
  hexColor: string;
  formattedTime: string;
  urgencyLabel: 'Reciente' | 'En espera' | 'Urgente' | 'Crítico';
  isCritical: boolean;
}

export function hslToHex(h: number, s: number, l: number): string {
  const normS = s / 100;
  const normL = l / 100;
  const a = normS * Math.min(normL, 1 - normL);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = normL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function calculateUrgency(createdAt: number, currentTime = Date.now()): UrgencyInfo {
  const secondsElapsed = Math.max(0, Math.floor((currentTime - createdAt) / 1000));

  let hue = 145; // Start: Emerald Green (145°)

  if (secondsElapsed <= 120) {
    // 0s to 120s (0 to 2 min): Emerald Green (145°) -> Bright Yellow (60°)
    const t = secondsElapsed / 120;
    hue = 145 - t * (145 - 60);
  } else if (secondsElapsed <= 240) {
    // 120s to 240s (2 to 4 min): Yellow (60°) -> Warm Amber/Orange (25°)
    const t = (secondsElapsed - 120) / 120;
    hue = 60 - t * (60 - 25);
  } else if (secondsElapsed <= 360) {
    // 240s to 360s (4 to 6 min): Orange (25°) -> Crimson Red (0°)
    const t = (secondsElapsed - 240) / 120;
    hue = Math.max(0, 25 - t * 25);
  } else {
    // > 360s: Pure Crimson Red (0°)
    hue = 0;
  }

  const roundedHue = Math.round(hue);
  const saturation = 85;
  const lightness = 48;

  const hslColor = `hsl(${roundedHue}, ${saturation}%, ${lightness}%)`;
  const hslBgColor = `hsla(${roundedHue}, ${saturation}%, ${lightness}%, 0.15)`;
  const hexColor = hslToHex(roundedHue, saturation, lightness);

  let formattedTime = `${secondsElapsed}s`;
  if (secondsElapsed >= 60) {
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    formattedTime = `${mins}m ${secs}s`;
  }

  let urgencyLabel: UrgencyInfo['urgencyLabel'] = 'Reciente';
  if (secondsElapsed >= 360) {
    urgencyLabel = 'Crítico';
  } else if (secondsElapsed >= 240) {
    urgencyLabel = 'Urgente';
  } else if (secondsElapsed >= 90) {
    urgencyLabel = 'En espera';
  }

  const isCritical = secondsElapsed >= 300; // Pulsating animation threshold (5+ min)

  return {
    secondsElapsed,
    hue: roundedHue,
    hslColor,
    hslBgColor,
    hexColor,
    formattedTime,
    urgencyLabel,
    isCritical,
  };
}
