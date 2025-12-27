import { describe, it, expect } from 'vitest';
import { createDragonwoodDeck, createAdventurerDeck } from './DeckManager';

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

                // Check if any card in top half is a Dragon (Orange or Blue)
                const dragonsInTop = topHalf.filter(card =>
                    card.name === 'Orange Dragon' || card.name === 'Blue Dragon'
                );

                expect(dragonsInTop.length, `Found dragons in top half on iteration ${i}`).toBe(0);
            }
        });

        it('should contain the correct number of dragons in the deck', () => {
            const deck = createDragonwoodDeck();
            const orangeDragonCount = deck.filter(c => c.name === 'Orange Dragon').length;
            const blueDragonCount = deck.filter(c => c.name === 'Blue Dragon').length;

            expect(orangeDragonCount).toBe(1);
            expect(blueDragonCount).toBe(1);
        });

        it('should contain exactly 29 creature cards', () => {
            const deck = createDragonwoodDeck();
            const creatureCount = deck.filter(c => c.type === 'creature').length;
            expect(creatureCount).toBe(29);
        });
    });

    describe('createAdventurerDeck', () => {
        it('should contain 4 Lucky Ladybugs', () => {
            const deck = createAdventurerDeck();
            const ladybugCount = deck.filter(c => c.type === 'lucky_ladybug').length;
            expect(ladybugCount).toBe(4);
        });
    });
});
