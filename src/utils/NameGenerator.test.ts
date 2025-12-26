
import { describe, it, expect } from 'vitest';
import { generateRandomName, FANTASY_ADJECTIVES, FANTASY_NOUNS } from './NameGenerator';

describe('NameGenerator', () => {
    it('should generate a name with Adjective + Space + Noun', () => {
        const name = generateRandomName(false);
        const parts = name.split(' ');
        expect(parts.length).toBe(2);
        expect(FANTASY_ADJECTIVES).toContain(parts[0]);
        expect(FANTASY_NOUNS).toContain(parts[1]);
    });

    it('should prefix with "Bot: " if isBot is true', () => {
        const name = generateRandomName(true);
        expect(name.startsWith('Bot: ')).toBe(true);

        const coreName = name.substring(5); // Remove "Bot: "
        const parts = coreName.split(' ');
        expect(parts.length).toBe(2);
        expect(FANTASY_ADJECTIVES).toContain(parts[0]);
        expect(FANTASY_NOUNS).toContain(parts[1]);
    });

    it('should generate different names (high probability)', () => {
        // There is a tiny chance they are equal, but with 25x25 = 625 combinations, it's low.
        // We can check that the function doesn't return a static string.
        // Let's run a loop to be safe.
        const names = new Set();
        for (let i = 0; i < 50; i++) {
            names.add(generateRandomName());
        }
        expect(names.size).toBeGreaterThan(1);
    });
});
