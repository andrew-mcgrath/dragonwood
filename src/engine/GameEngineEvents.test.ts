
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './GameEngine';
import type { EventCard } from './types';

describe('GameEngine - Events', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    it('should handle Sunny Day (draw 2 cards)', () => {
        const player1 = engine.state.players[0];
        const initialHandSize = player1.hand.length;

        // Force deterministic deck (no Ladybugs)
        engine.state.adventurerDeck = [
            { id: 'a1', type: 'adventurer', suit: 'red', value: 1 },
            { id: 'a2', type: 'adventurer', suit: 'blue', value: 2 },
            { id: 'a3', type: 'adventurer', suit: 'green', value: 3 }
        ];
        engine.state.discardPile = []; // Ensure no Ladybugs in discard trigger recursion

        // Mock an event card
        const sunnyDay: EventCard = {
            id: 'evt_sunny',
            name: 'Sunny Day',
            type: 'event',
            description: 'All players draw 2 cards.'
        };

        (engine as any).resolveEvent(sunnyDay);

        expect(player1.hand.length).toBe(initialHandSize + 2);
    });

    it('should handle Thunder Storm (discard 1 card)', () => {
        const player1 = engine.state.players[0];
        // Ensure hand has cards
        while (player1.hand.length < 2) engine.drawCard();
        const initialHandSize = player1.hand.length;
        const cardToDiscard = player1.hand[0];

        const thunderStorm: EventCard = {
            id: 'evt_thunder',
            name: 'Thunder Storm',
            type: 'event',
            description: 'Discard 1 card.'
        };

        // 1. Trigger Event
        (engine as any).resolveEvent(thunderStorm);

        // 2. Verify State Transition
        expect(engine.state.phase).toBe('resolve_event_discard');
        expect(engine.state.pendingEventDiscards).toContain(player1.id);

        // 3. User Action
        engine.handleEventDiscard(player1.id, cardToDiscard.id);

        // 4. Verify Resolution
        expect(player1.hand.length).toBe(initialHandSize - 1);
        expect(player1.hand.find(c => c.id === cardToDiscard.id)).toBeUndefined();
        expect(engine.state.phase).not.toBe('resolve_event_discard');
    });

    it('should handle Quicksand (remove enhancements)', () => {
        // Setup landscape with enhancements
        engine.state.landscape = [
            { id: 'enh1', name: 'Silver Sword', type: 'enhancement' } as any,
            { id: 'cre1', name: 'Goblin', type: 'creature' } as any
        ];

        const quicksand: EventCard = {
            id: 'evt_quick',
            name: 'Quicksand',
            type: 'event',
            description: 'Remove enhancements.'
        };

        (engine as any).resolveEvent(quicksand);

        const enhancements = engine.state.landscape.filter(c => c.type === 'enhancement');
        expect(enhancements.length).toBe(0);
        expect(engine.state.landscape.length).toBe(1); // Only goblin remains
    });

    it('should handle Wind Storm (pass card to right)', () => {
        // Setup fixed hands to track movement
        const p1 = engine.state.players[0]; // Human
        const p2 = engine.state.players[1]; // Bot

        p1.hand = [{ id: 'p1_card', type: 'adventurer', suit: 'red', value: 1 }];
        p2.hand = [{ id: 'p2_card', type: 'adventurer', suit: 'blue', value: 2 }];

        const windStorm: EventCard = {
            id: 'evt_wind',
            name: 'Wind Storm',
            type: 'event',
            description: 'Pass 1 card.'
        };

        // 1. Trigger Event
        (engine as any).resolveEvent(windStorm);

        // 2. Verify State Transition
        expect(engine.state.phase).toBe('resolve_event_pass');
        expect(engine.state.pendingEventPasses).toContain(p1.id);
        // Bot (p2) should have already chosen (checked via buffer presence if we could access it, or just wait for resolution)

        // 3. User Action
        engine.handleEventPass(p1.id, 'p1_card');

        // 4. Verify Resolution
        // P2 (Bot) receives P1's card
        // P1 (Human) receives P4's card (since 4 players, P1<-P4, P2<-P1). 
        // Wait, standard setup is 4 players?
        // Default GameEngine creates 4 players.
        // P(i) passes to P(i+1). 
        // P1(0) -> P2(1).
        // P4(3) -> P1(0).

        // P2 should have 'p1_card'.
        expect(p2.hand.find(c => c.id === 'p1_card')).toBeDefined();

        // P1 should have received SOMETHING from P4 (who had random cards).
        // Check local P1 hand size is 1 (gave 1, got 1).
        expect(p1.hand.length).toBe(1);
        expect(engine.state.phase).not.toBe('resolve_event_pass');
    });
});
