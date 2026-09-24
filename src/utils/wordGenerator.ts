export const GASTRONOMIC_WORDS = [
  'MOJITO',
  'MARGARITA',
  'TEQUILA',
  'MEZCAL',
  'DAIQUIRI',
  'CAIPIRINHA',
  'SANGRIA',
  'GIN',
  'VODKA',
  'WHISKEY',
  'MALBEC',
  'PROSECCO',
  'CERVEZA',
  'BURGER',
  'NACHOS',
  'TAPAS',
  'TACO',
  'PIZZA',
  'ESPRESSO',
  'BBQ',
  'CHEDDAR',
  'CRISPY',
  'CEVICHE',
  'EMPANADA',
  'AREPA',
  'CROQUETA',
  'JAMON',
  'PAELLA',
  'SIDRA',
  'CORONA',
];

export function generateSessionWord(activeWords: string[] = []): string {
  const activeSet = new Set(activeWords);

  // Attempt up to 30 times to generate a non-colliding word
  for (let attempt = 0; attempt < 30; attempt++) {
    const randomTerm = GASTRONOMIC_WORDS[Math.floor(Math.random() * GASTRONOMIC_WORDS.length)];
    const randomNum = Math.floor(10 + Math.random() * 90); // 10 to 99
    const candidate = `${randomTerm}-${randomNum}`;

    if (!activeSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback with timestamp micro-hash if all random collisions fail
  const fallbackTerm = GASTRONOMIC_WORDS[Math.floor(Math.random() * GASTRONOMIC_WORDS.length)];
  return `${fallbackTerm}-${Math.floor(10 + (Date.now() % 90))}`;
}
