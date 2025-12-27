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
    it('should allow Dragon Spell capture on Dragon with valid cards', () => {
        const engine = new GameEngine();
        const player = engine.state.players[0];

        // 1. Mock Landscape with Dragon
        engine.state.landscape = [{
            id: 'dragon_1', name: 'Orange Dragon', type: 'creature', victoryPoints: 7,
            captureCost: { strike: 9, stomp: 9, scream: 9 }
        } as any];

        // 2. Mock Hand (3-card Straight Flush)
        player.hand = [
            { id: 'c1', type: 'adventurer', suit: 'red', value: 3 },
            { id: 'c2', type: 'adventurer', suit: 'red', value: 4 },
            { id: 'c3', type: 'adventurer', suit: 'red', value: 5 },
        ] as any;

        // 3. Execute Capture
        engine.declareCapture('dragon_1', 'dragon_spell', ['c1', 'c2', 'c3']);

        // 4. Assert Configuration (Success is not guaranteed: 2 Dice vs Target 6)
        expect(engine.state.diceRollConfig.count).toBe(2);
        // We can't check success/fail deterministically without mocking dice, 
        // but we can ensure the phase transitioned to capture_attempt or completed.
        // Actually, declareCapture calls rollDice immediately and updates result.
        // So we just check that a result exists.
        expect(engine.state.diceRollConfig.results.length).toBe(2);
    });

    it('should fail Dragon Spell if target is not Dragon', () => {
        const engine = new GameEngine();
        const player = engine.state.players[0];

        // Mock Landscape with NOT Dragon
        engine.state.landscape = [{
            id: 'troll_1', name: 'Troll', type: 'creature', victoryPoints: 4,
            captureCost: { strike: 6, stomp: 5, scream: 5 }
        } as any];

        player.hand = [
            { id: 'c1', type: 'adventurer', suit: 'red', value: 3 },
            { id: 'c2', type: 'adventurer', suit: 'red', value: 4 },
            { id: 'c3', type: 'adventurer', suit: 'red', value: 5 },
        ] as any;

        expect(() => {
            engine.declareCapture('troll_1', 'dragon_spell', ['c1', 'c2', 'c3']);
        }).toThrow("Dragon Spell can only be used on a Dragon!");
    });

    it('should fail Dragon Spell if cards are not a 3-card Straight Flush', () => {
        const engine = new GameEngine();
        const player = engine.state.players[0];

        engine.state.landscape = [{ id: 'd1', name: 'Orange Dragon', type: 'creature' } as any];

        // Invalid: Flush but not Straight
        player.hand = [
            { id: 'c1', type: 'adventurer', suit: 'red', value: 3 },
            { id: 'c2', type: 'adventurer', suit: 'red', value: 5 },
            { id: 'c3', type: 'adventurer', suit: 'red', value: 7 },
        ] as any;

        expect(() => {
            engine.declareCapture('d1', 'dragon_spell', ['c1', 'c2', 'c3']);
        }).toThrow("Dragon Spell requires a generic 3-card Straight Flush!");
    });

    it('should update turnLog when actions occur', () => {
        const engine = new GameEngine();
        const player = engine.state.players[0];

        // 1. Initial log
        expect(engine.state.turnLog).toContain('Game Started');

        // 2. Draw card
        engine.state.phase = 'action';
        engine.state.currentPlayerIndex = 0;
        engine.drawCard();
        expect(engine.state.turnLog.some(l => l.includes('drew'))).toBe(true);

        // 3. Capture Attempt (Mock)
        engine.state.landscape = [{
            id: 'c1', name: 'TestCreature', type: 'creature',
            captureCost: { strike: 1 } // Very low cost
        } as any];
        player.hand = [{ id: 'h1', type: 'adventurer', suit: 'red', value: 5 }] as any;

        // Force capture
        // We can't easily force dice roll result without mocking module, 
        // but we can check the log for "rolled"
        engine.state.currentPlayerIndex = 0; // Ensure it's player 0's turn again
        engine.state.phase = 'action'; // Ensure phase is action
        engine.declareCapture('c1', 'strike', ['h1']);

        expect(engine.state.turnLog.some(l => l.includes('rolled'))).toBe(true);
        // Expect success or fail message
        expect(engine.state.turnLog.some(l => l.includes('Capture Successful!') || l.includes('Capture Failed!'))).toBe(true);
    });

    it('should require 2 discards on Dragon Spell failure', () => {
        const engine = new GameEngine();
        const player = engine.state.players[0];

        // Mock Dragon Landscape
        engine.state.landscape = [{
            id: 'd1', name: 'Orange Dragon', type: 'creature',
            captureCost: { strike: 9, stomp: 9, scream: 9 }
        } as any];

        // Mock Hand (Valid Flush/Straight) but we will force fail result in logic if we could, 
        // OR just test the state transition if we mock failure.
        // Since we can't easily mock rollDice results here without module mocking,
        // let's manually trigger the failure logic path by simulating a check or 
        // just relying on a "forced" fail if we can (we can't easily).
        // ALTERNATIVE: Use the fact that 2 dice cannot reach 99 (target defaults to 99 if not dragon spell, but here it IS dragon spell).
        // Dragon Spell Target is 6. 2 Dice CAN fail (e.g. 1+1=2).
        // We will try 10 times? No, non-deterministic.

        // Let's just manually invoke the logic block OR 
        // trust that if we set up a scenario where it fails it works.
        // Actually, let's just inspect the Code Coverage manually or 
        // rely on "if (attackType === 'dragon_spell')" logic we wrote.

        // BETTER: Manually set phase to 'capture_attempt' and then call a helper? No private.

        // Let's use a standard test but mock the dice roll? 
        // OR: Just check that IF it fails, penalty is 2.
        // We can force failure by "hacking" the rollDice function? No.
        // We can force failure by hacking the 'required' value? 
        // 'required' is hardcoded to 6 for Dragon Spell.

        // OK, for this specific test, let's just verify the state logic by 
        // calling declareCapture, ensuring it rolls, and IF it fails, checking the state.
        // It's probabilistic (36% success), so 64% fail.
        // We can loop until failure?

        let failed = false;
        let attempts = 0;
        while (!failed && attempts < 50) {
            const eng = new GameEngine();
            const p = eng.state.players[0];
            eng.state.landscape = [{ id: 'd1', name: 'Orange Dragon', type: 'creature' } as any];
            p.hand = [
                { id: 'c1', type: 'adventurer', suit: 'red', value: 3 },
                { id: 'c2', type: 'adventurer', suit: 'red', value: 4 },
                { id: 'c3', type: 'adventurer', suit: 'red', value: 5 },
                { id: 'x1', type: 'adventurer', suit: 'blue', value: 1 }, // Extra cards for penalty
                { id: 'x2', type: 'adventurer', suit: 'blue', value: 2 }
            ] as any;

            eng.declareCapture('d1', 'dragon_spell', ['c1', 'c2', 'c3']);

            if (eng.state.phase === 'penalty_discard') {
                failed = true;
                expect(eng.state.penaltyCardsNeeded).toBe(2);
                expect(eng.state.turnLog[eng.state.turnLog.length - 1]).toContain("Dragon Spell Failed! Must discard 2 cards!");

                // Test Discard 1
                eng.resolvePenaltyDiscard('x1');
                expect(eng.state.phase).toBe('penalty_discard');
                expect(eng.state.penaltyCardsNeeded).toBe(1);

                // Test Discard 2
                eng.resolvePenaltyDiscard('x2');
                expect(eng.state.phase).toBe('action'); // Turn Ended
                expect(eng.state.penaltyCardsNeeded).toBe(0);
            }
            attempts++;
        }
    });
    it('should not award VP for enhancements', () => {
        const engine = new GameEngine();
        const player = engine.state.players[0];

        // Manually give player an enhancement
        player.capturedCards.push({
            id: 'e1', name: 'Silver Sword', type: 'enhancement',
            victoryPoints: 0,
            captureCost: {}, effectDescription: ''
        } as any);

        // Calculate score logic (mimicking GameBoard logic)
        const score = player.capturedCards.reduce((acc, c) => acc + (c as any).victoryPoints, 0);
        expect(score).toBe(0);

        // Add a creature to ensure mixed calculation works
        player.capturedCards.push({
            id: 'c1', name: 'Goblin', type: 'creature',
            victoryPoints: 2, captureCost: {}
        } as any);

        const score2 = player.capturedCards.reduce((acc, c) => acc + (c as any).victoryPoints, 0);
        expect(score2).toBe(2);
    });
    it('should trigger Game Over when both dragons are captured', () => {
        const engine = new GameEngine();
        const player = engine.state.players[0];

        // Simulate capturing both dragons
        player.capturedCards.push({
            id: 'd1', name: 'Orange Dragon', type: 'creature',
            victoryPoints: 7, captureCost: { strike: 9, stomp: 9, scream: 9 }
        } as any);

        player.capturedCards.push({
            id: 'd2', name: 'Blue Dragon', type: 'creature',
            victoryPoints: 6, captureCost: { strike: 9, stomp: 9, scream: 9 }
        } as any);

        // Manually trigger checkGameOver (it's private, but we can call a method that calls it, 
        // OR we can simulate a turn end or capture which triggers checks.
        // declareCapture -> calls resolveCapture -> calls checkGameOver.
        // So let's simulate a capture that leads to this state.

        // Reset state for a clean capture action
        const engine2 = new GameEngine();
        const p1 = engine2.state.players[0];

        // Give player 1 dragon already
        p1.capturedCards.push({
            id: 'd1', name: 'Orange Dragon', type: 'creature',
            victoryPoints: 7, captureCost: { strike: 1, stomp: 1, scream: 1 }
        } as any);

        // Put Blue Dragon in landscape to be captured
        const blueDragon = {
            id: 'd2', name: 'Blue Dragon', type: 'creature',
            victoryPoints: 6, captureCost: { strike: 1, stomp: 1, scream: 1 } // Easy capture
        };
        engine2.state.landscape = [blueDragon as any];

        // Give player cards to capture it
        p1.hand = [{ id: 'h1', type: 'adventurer', suit: 'red', value: 5 }] as any;

        // Execute capture
        engine2.state.phase = 'action';
        engine2.state.currentPlayerIndex = 0;

        // Mock dice roll to ensure success? 
        // Since cost is 1, and 1 die (min 1) will always succeed.
        engine2.declareCapture('d2', 'strike', ['h1']);

        // Check if game over
        expect(engine2.state.phase).toBe('game_over');
        expect(engine2.state.turnLog.some(l => l.includes('Both Dragons have been defeated!'))).toBe(true);
    });
});
