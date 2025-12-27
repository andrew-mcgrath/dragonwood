import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from './GameEngine';
import type { Enhancement } from './types';

describe('ConsumableCards', () => {
    let engine: GameEngine;

    beforeEach(() => {
        engine = new GameEngine();
    });

    it('should allow using Lightning Bolt to add +4 to capture attempt', () => {
        const player = engine.state.players[0];

        // Give player a "Lightning Bolt"
        const lightningBolt: Enhancement = {
            id: 'lb1',
            type: 'enhancement',
            name: 'Lightning Bolt',
            effectDescription: 'Use only once to add 4 points',
            victoryPoints: 0,
            captureCost: { strike: 7, stomp: 5, scream: 7 },
            image: 'lightning'
        };
        player.capturedCards.push(lightningBolt);

        // Setup a difficult capture target
        const targetCard = {
            id: 'c1',
            type: 'creature',
            name: 'Tough Monster',
            victoryPoints: 3,
            captureCost: { strike: 99, stomp: 99, scream: 99 } // Impossible without luck/bonus
        };
        engine.state.landscape = [targetCard as any];

        // Setup hand
        player.hand = [{ id: 'h1', type: 'adventurer', suit: 'red', value: 5 }] as any;

        engine.state.phase = 'action';
        engine.state.currentPlayerIndex = 0;

        // Verify consumable validation
        // Should accept optional 4th argument
        engine.declareCapture('c1', 'strike', ['h1'], ['lb1']);

        // Check bonus value in rollout
        // Base roll (min 1) + 4 bonus.
        // We can't guarantee success but we can check the bonus recorded in valid roll results.
        expect(engine.state.diceRollConfig.bonus).toBeGreaterThanOrEqual(4);

        // Check log interaction
        expect(engine.state.turnLog.some(l => l.includes('Lightning Bolt'))).toBe(true);
    });

    it('should consume Lightning Bolt after use', () => {
        const player = engine.state.players[0];
        player.capturedCards.push({
            id: 'lb1', name: 'Lightning Bolt', type: 'enhancement'
        } as any);

        engine.state.landscape = [{ id: 'c1', name: 'T', type: 'creature', captureCost: { strike: 1 } } as any];
        player.hand = [{ id: 'h1', type: 'adventurer', suit: 'red', value: 1 }] as any;

        engine.state.phase = 'action';
        engine.declareCapture('c1', 'strike', ['h1'], ['lb1']);

        expect(player.capturedCards.find(c => c.id === 'lb1')).toBeUndefined();
    });

    it('should allow using Friendly Bunny to add +1 die', () => {
        const player = engine.state.players[0];

        player.capturedCards.push({
            id: 'fb1', name: 'Friendly Bunny', type: 'enhancement'
        } as any);

        engine.state.landscape = [{ id: 'c1', name: 'T', type: 'creature', captureCost: { strike: 1 } } as any];
        player.hand = [{ id: 'h1', type: 'adventurer', suit: 'red', value: 1 }] as any; // 1 Card = 1 Die

        engine.state.phase = 'action';
        engine.declareCapture('c1', 'strike', ['h1'], ['fb1']);

        // Check dice count
        // 1 Base + 1 Bonus = 2 Dice
        expect(engine.state.diceRollConfig.count).toBe(2);

        // Should be consumed
        expect(player.capturedCards.find(c => c.id === 'fb1')).toBeUndefined();
    });

    it('should fail if user tries to use a consumable they do not own', () => {
        const player = engine.state.players[0];
        engine.state.landscape = [{ id: 'c1', name: 'T', type: 'creature', captureCost: { strike: 1 } } as any];
        player.hand = [{ id: 'h1', type: 'adventurer', suit: 'red', value: 1 }] as any;

        expect(() => {
            engine.declareCapture('c1', 'strike', ['h1'], ['missing_card_id']);
        }).toThrow(/not found/);
    });

    it('should fail if user tries to use a non-consumable card as consumable', () => {
        const player = engine.state.players[0];
        player.capturedCards.push({
            id: 'ss1', name: 'Silver Sword', type: 'enhancement'
        } as any);

        engine.state.landscape = [{ id: 'c1', name: 'T', type: 'creature', captureCost: { strike: 1 } } as any];
        player.hand = [{ id: 'h1', type: 'adventurer', suit: 'red', value: 1 }] as any;

        expect(() => {
            engine.declareCapture('c1', 'strike', ['h1'], ['ss1']);
        }).toThrow(/Only Lightning Bolt and Friendly Bunny/);
    });
});
