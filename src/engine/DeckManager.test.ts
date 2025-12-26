import { describe, it, expect } from 'vitest';
import { createDragonwoodDeck } from './DeckManager';

describe('DeckManager', () => {
    describe('createDragonwoodDeck', () => {
        it('should never have a Dragon in the top half of the deck', () => {
            // Run multiple times to statistically ensure correctness
            const ITERATIONS = 100;

            for (let i = 0; i < ITERATIONS; i++) {
                const deck = createDragonwoodDeck();
                const totalCards = deck.length;


                // Calculate halfway point
                const halfPoint = Math.floor(totalCards / 2);

                // The Game uses pop() to draw, so the "Top" of the deck is the END of the array.
                // We want to ensure Dragons are NOT in the Top Half (End of Array).
                const topHalf = deck.slice(halfPoint);

                // Check if any card in top half is a Dragon
                const dragonsInTop = topHalf.filter(card => card.name === 'Dragon');

                expect(dragonsInTop.length, `Found dragons in top half on iteration ${i}`).toBe(0);
            }
        });

        it('should contain the correct number of dragons in the deck', () => {
            const deck = createDragonwoodDeck();
            const dragonCount = deck.filter(c => c.name === 'Dragon').length;
            // Based on createDragonwoodDeck logic: 1 Dragon entry * 2 copies = 2 Dragons
            expect(dragonCount).toBe(2);
        });
    });
});
