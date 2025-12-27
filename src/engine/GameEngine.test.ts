import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './GameEngine';
import type { Enhancement } from './types';

describe('GameEngine', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    it('should not apply enhancement bonuses when capturing another enhancement', () => {
        const player = engine.state.players[0];

        // Give player a "Silver Sword" (+2 Strike)
        const silverSword: Enhancement = {
            id: 'e1',
            type: 'enhancement',
            name: 'Silver Sword',
            effectDescription: '+2 Strike',
            victoryPoints: 2,
            captureCost: { strike: 10, stomp: 10, scream: 10 },
            image: 'silver_sword'
        };
        player.capturedCards.push(silverSword);

        // Set target to an Enhancement "Cloak of Darkness"
        const targetEnhancement: Enhancement = {
            id: 'e2',
            type: 'enhancement',
            name: 'Cloak of Darkness',
            effectDescription: '+2 Scream',
            victoryPoints: 2,
            captureCost: { strike: 5, stomp: 99, scream: 99 },
            image: 'cloak'
        };
        engine.state.landscape.push(targetEnhancement);

        // Manually place specific cards in hand for a valid Strike
        player.hand = [
            { id: '1', type: 'adventurer', suit: 'red', value: 1 },
            { id: '2', type: 'adventurer', suit: 'red', value: 2 },
            { id: '3', type: 'adventurer', suit: 'green', value: 3 }
        ];

        // Ensure phase is action
        engine.state.phase = 'action';
        engine.state.currentPlayerIndex = 0; // Ensure it's player 0's turn

        // Attempt capture of Enhancement using Strike
        engine.declareCapture(targetEnhancement.id, 'strike', ['1', '2', '3']);

        // Verify Bonus is 0
        // Currently, without the fix, it will be 2 (from Silver Sword)
        expect(engine.state.diceRollConfig.bonus).toBe(0);
    });
    it('should limit capture attempts to a maximum of 6 cards (dice)', () => {
        const player = engine.state.players[0];

        // Setup target
        const targetCreature: import('./types').Creature = {
            id: 'c1', type: 'creature', name: 'Big Monster', victoryPoints: 5,
            captureCost: { strike: 15, stomp: 15, scream: 15 } // High cost
        };
        engine.state.landscape.push(targetCreature);

        // Give player 7 cards for a valid Scream (all value 1)
        player.hand = [
            { id: '1', type: 'adventurer', suit: 'red', value: 1 },
            { id: '2', type: 'adventurer', suit: 'blue', value: 1 },
            { id: '3', type: 'adventurer', suit: 'green', value: 1 },
            { id: '4', type: 'adventurer', suit: 'orange', value: 1 },
            { id: '5', type: 'adventurer', suit: 'purple', value: 1 },
            { id: '6', type: 'adventurer', suit: 'red', value: 1 },
            { id: '7', type: 'adventurer', suit: 'blue', value: 1 }
        ];

        engine.state.phase = 'action';
        engine.state.currentPlayerIndex = 0;

        // Attempt to use 7 cards
        // Should throw error or be invalid
        expect(() => {
            engine.declareCapture(targetCreature.id, 'scream', ['1', '2', '3', '4', '5', '6', '7']);
        }).toThrow("Max 6 cards allowed");
    });
});
