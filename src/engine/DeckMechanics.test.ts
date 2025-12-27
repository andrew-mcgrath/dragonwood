import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './GameEngine';
import type { PlayerCard } from './types';

describe('Deck Mechanics', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
        // Setup a single player for simplicity
        engine.state.players = [{
            id: 'p1', name: 'Player 1', hand: [], capturedCards: [], isBot: false
        }];
        engine.state.currentPlayerIndex = 0;
        engine.state.phase = 'action';
    });

    it('should reshuffle discard pile into deck when deck is empty', () => {
        const player = engine.state.players[0];

        // 1. Empty the deck
        engine.state.adventurerDeck = [];

        // 2. Put some cards in discard pile
        const discardCards: PlayerCard[] = [
            { id: 'c1', type: 'adventurer', suit: 'red', value: 1 },
            { id: 'c2', type: 'adventurer', suit: 'blue', value: 2 },
            { id: 'c3', type: 'adventurer', suit: 'green', value: 3 }
        ];
        engine.state.discardPile = [...discardCards];

        // 3. Trigger draw (via public API)
        // drawCard calls performDraw which handles reshuffle
        engine.drawCard();

        // 4. Verification
        // Deck should now contain the cards (minus the one drawn)
        expect(engine.state.adventurerDeck.length).toBe(2);
        expect(engine.state.discardPile.length).toBe(0);

        // Player should have drawn 1 card
        expect(player.hand.length).toBe(1);

        // Check cycle increment
        expect(engine.state.deckCycles).toBeGreaterThan(0);
    });

    it('should trigger final turns logic when deck is exhausted twice', () => {
        // 1. Set cycles to 2 (meaning we are on the 2nd cycle already, about to finish it?)
        // The code says: if (this.state.deckCycles > 2 && this.state.finalTurnsLeft === undefined)
        engine.state.deckCycles = 3;

        // Empty deck and setup discard
        engine.state.adventurerDeck = [];
        engine.state.discardPile = [{ id: 'c1', type: 'adventurer', suit: 'red', value: 1 }];

        engine.drawCard();

        // Should trigger final turns
        // number of players + 1 = 2
        // BUT drawCard calls endTurn which decrements it immediately. 
        // So expected value is 1.
        expect(engine.state.finalTurnsLeft).toBe(engine.state.players.length);
        expect(engine.state.turnLog.some(l => l.includes("Adventure Deck exhausted twice"))).toBe(true);
    });

    it('should handle Lucky Ladybug by drawing 2 more cards', () => {
        const player = engine.state.players[0];

        // 1. Setup Deck: Top card is Ladybug, underneath are two normal cards
        // clean deck
        engine.state.adventurerDeck = [];

        // Stack deck (pop takes from end)
        // We want: [Normal, Normal, Ladybug(top)] -> pop ladybug, then pop normal, normal
        engine.state.adventurerDeck.push({ id: 'c3', type: 'adventurer', suit: 'green', value: 3 });
        engine.state.adventurerDeck.push({ id: 'c2', type: 'adventurer', suit: 'blue', value: 2 });
        engine.state.adventurerDeck.push({ id: 'ladybug', type: 'lucky_ladybug' });

        // 2. Trigger Draw
        engine.drawCard();

        // 3. Verify
        // Ladybug should be in discard (or removed?) 
        // Code says: this.state.discardPile.push(card);
        const ladybug = engine.state.discardPile.find(c => c.type === 'lucky_ladybug');
        expect(ladybug).toBeDefined();

        // Player should have 2 cards (the extra draws)
        // Wait, regular draw is 1 card. Ladybug = discard it and draw 2 more.
        expect(player.hand.length).toBe(2);
        expect(player.hand.map(c => c.id)).toEqual(expect.arrayContaining(['c2', 'c3']));

        // Notification should occur
        const ladybugLog = engine.state.turnLog.find(log => log.includes("drew a Lucky Ladybug"));
        expect(ladybugLog).toBeDefined();
    });
});
