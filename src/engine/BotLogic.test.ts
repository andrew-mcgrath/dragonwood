import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from './GameEngine';
import type { Creature } from './types';

// Mock Dice to always return 1
vi.mock('./Dice', async (importOriginal) => {
    const mod = await importOriginal<typeof import('./Dice')>();
    return {
        ...mod,
        rollDice: (count: number) => Array(count).fill(1).map(_ => 1),
        calculateTotal: (rolls: number[]) => rolls.reduce((a, b) => a + b, 0)
    };
});

describe('Bot Logic', () => {
    let engine: GameEngine;

    beforeEach(() => {
        vi.useFakeTimers();
        engine = new GameEngine();

        // Setup Bot Player
        engine.state.players = [
            { id: 'p1', name: 'Human', hand: [], capturedCards: [], isBot: false },
            { id: 'p2', name: 'Bot', hand: [], capturedCards: [], isBot: true }
        ];
        engine.state.currentPlayerIndex = 1; // Bot's turn
        engine.state.phase = 'action';
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should choose the best capture option (Stomp/Flush)', () => {
        const bot = engine.state.players[1];

        // Give Bot a Flush (Stomp) hand
        bot.hand = [
            { id: 'c1', type: 'adventurer', suit: 'red', value: 1 },
            { id: 'c2', type: 'adventurer', suit: 'red', value: 3 },
            { id: 'c3', type: 'adventurer', suit: 'red', value: 5 }
        ];

        // 3 cards * 1 = 3 total (Mocked)
        // Cost should be <= 3.
        const target: Creature = {
            id: 't1', name: 'Goblin', type: 'creature', victoryPoints: 2,
            captureCost: { strike: 99, stomp: 3, scream: 99 }
        };
        engine.state.landscape = [target as any];

        (engine as any).runBotTurn();
        vi.runAllTimers();

        expect(engine.state.turnLog.some(l => l.includes("Bot attacks Goblin with stomp"))).toBe(true);
        expect(engine.state.diceRollConfig.targetCardName).toBe('Goblin');
    });

    it('should discard a card if capture fails and penalty applies', () => {
        const bot = engine.state.players[1];

        // Give Bot a hand of 4 identical suit/value cards to maximize chances for all types?
        // Suit: Red. Value: 1.
        // Stomp (Red): 4 cards. Avg 10. Roll 4.
        // Scream (1): 4 cards. Avg 10. Roll 4.

        bot.hand = [
            { id: 'c1', type: 'adventurer', suit: 'red', value: 1 },
            { id: 'c2', type: 'adventurer', suit: 'red', value: 1 },
            { id: 'c3', type: 'adventurer', suit: 'red', value: 1 },
            { id: 'c4', type: 'adventurer', suit: 'red', value: 1 }
        ];

        // Target Cost: 5 (Stomp).
        // Bot thinks: 10 >= 5. Try Stomp.
        // Actual: 4 < 5. Fail.

        const target: Creature = {
            id: 't2', name: 'Dragon', type: 'creature', victoryPoints: 5,
            captureCost: { strike: 99, stomp: 5, scream: 99 }
        };

        engine.state.landscape = [target as any];

        (engine as any).runBotTurn();
        vi.runAllTimers();

        // Check log for attempt
        expect(engine.state.turnLog.some(l => l.includes("Bot attacks Dragon"))).toBe(true);

        // Check log for failure/discard
        // "Bot failed capture! Choosing card to discard..."
        expect(engine.state.turnLog.some(l => l.includes("Bot failed capture"))).toBe(true);

        // Helper check: Hand should be empty? 
        // Bot had 4 cards. Used 4.
        // If failed, cards used are returned to hand. 
        // Then 1 discarded.
        // So 3 cards left.

        expect(bot.hand.length).toBe(3);
        expect(engine.state.discardPile.length).toBeGreaterThan(0);
    });
});
