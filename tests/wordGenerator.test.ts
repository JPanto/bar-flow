import { describe, it, expect } from 'vitest';
import { generateSessionWord, GASTRONOMIC_WORDS } from '../src/utils/wordGenerator';

describe('Word Generator Utility', () => {
  it('should generate a valid session word matching [WORD]-[NUM]', () => {
    const word = generateSessionWord();
    expect(word).toMatch(/^[A-ZÑÁÉÍÓÚ]+-[0-9]{2}$/);
    const [term, num] = word.split('-');
    expect(GASTRONOMIC_WORDS).toContain(term);
    expect(Number(num)).toBeGreaterThanOrEqual(10);
    expect(Number(num)).toBeLessThanOrEqual(99);
  });

  it('should avoid collisions with active words if provided', () => {
    const active = ['MOJITO-24', 'BURGER-15'];
    for (let i = 0; i < 20; i++) {
      const word = generateSessionWord(active);
      expect(active).not.toContain(word);
    }
  });

  it('should provide a rich vocabulary of at least 25 words', () => {
    expect(GASTRONOMIC_WORDS.length).toBeGreaterThanOrEqual(25);
  });
});
