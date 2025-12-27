import { createAdventurerDeck, createDragonwoodDeck } from './DeckManager';
import { rollDice } from './Dice';
import type { GameState, Player, PlayerCard, DragonwoodCard, AttackType } from './types';
import { generateRandomName } from '../utils/NameGenerator';

export class GameEngine {
    state: GameState;

    private listeners: (() => void)[] = [];

    constructor() {
        this.state = this.initializeGame();
    }

    public subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    public getState(): GameState {
        return this.state;
    }

    public setPlayerName(playerId: string, newName: string) {
        const player = this.state.players.find(p => p.id === playerId);
        if (player) {
            player.name = newName;
            this.notify();
        }
    }

    private initializeGame(): GameState {
        const adventurerDeck = createAdventurerDeck();
        const dragonwoodDeck = createDragonwoodDeck();

        // Initial setup for 1 player (Human) + 1 Bot (or just 1 player for now)
        // Let's do 1 Player vs Bot for structure
        const player1: Player = {
            id: 'p1',
            name: 'Player 1',
            hand: [],
            capturedCards: [],
            isBot: false
        };

        const player2: Player = {
            id: 'p2',
            name: generateRandomName(true), // Default random name for safety
            hand: [],
            capturedCards: [],
            isBot: true
        };



        const tempDiscard: PlayerCard[] = [];

        // Helper to deal safe
        for (let i = 0; i < 5; i++) {
            // Player 1
            let c = adventurerDeck.pop();
            while (c && c.type === 'lucky_ladybug') {
                tempDiscard.push(c);
                c = adventurerDeck.pop();
            }
            if (c) player1.hand.push(c);

            // Player 2
            c = adventurerDeck.pop();
            while (c && c.type === 'lucky_ladybug') {
                tempDiscard.push(c);
                c = adventurerDeck.pop();
            }
            if (c) player2.hand.push(c);
        }

        // Deal 5 landscape cards
        const landscape: DragonwoodCard[] = [];
        for (let i = 0; i < 5; i++) {
            if (dragonwoodDeck.length > 0) {
                landscape.push(dragonwoodDeck.pop()!);
            }
        }

        return {
            players: [player1, player2],
            currentPlayerIndex: 0,
            adventurerDeck,
            discardPile: tempDiscard,
            dragonwoodDeck,
            landscape,
            diceRollConfig: { count: 0, pending: false, results: [] },
            phase: 'action', // Start with action phase
            turnLog: ['Game Started'],
            deckCycles: 1,
            latestNotification: null
        };
    }



    public drawCard() {
        if (this.state.phase !== 'action') return;
        const player = this.state.players[this.state.currentPlayerIndex];

        // Use recursive helper to handle Ladybugs
        this.performDraw(player);

        this.endTurn();
    }

    private setNotification(message: string, type: 'info' | 'error' | 'success') {
        this.state.latestNotification = {
            message,
            type,
            id: Date.now() + Math.random()
        };
    }

    // Helper to handle drawing and Ladybug recursion
    private performDraw(player: Player) {
        // Shuffle if needed
        if (this.state.adventurerDeck.length === 0) {
            // Deck empty, try to reshuffle
            if (this.state.discardPile.length === 0) {
                this.state.turnLog.push("Adventurer Deck is empty and Discard is empty!");
                return; // Nothing to draw
            }

            this.state.turnLog.push("Reshuffling Discard Pile into Deck...");

            // Increment Cycle
            this.state.deckCycles++;
            if (this.state.deckCycles > 2 && this.state.finalTurnsLeft === undefined) {
                this.state.finalTurnsLeft = this.state.players.length + 1;
                this.state.turnLog.push("Adventure Deck exhausted twice! Each player gets 1 final turn! ⏳");
            }

            // Shuffle
            const newDeck = this.state.discardPile;
            for (let i = newDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
            }
            this.state.adventurerDeck = newDeck;
            this.state.discardPile = [];
        }

        const card = this.state.adventurerDeck.pop();
        if (card) {
            if (card.type === 'lucky_ladybug') {
                this.state.turnLog.push(`${player.name} drew a Lucky Ladybug! 🐞 Discarding and drawing 2 more...`);
                this.setNotification(`${player.name} found a Ladybug! 🐞`, 'success');
                this.state.discardPile.push(card);

                // Draw 2 more recursively
                this.performDraw(player);
                this.performDraw(player);
            } else {
                player.hand.push(card);
                this.state.turnLog.push(`${player.name} drew ${card.value} ${card.suit}`);
                // Only notify if it's the bot, or unified? Unified is better.
                // But "You drew 1 red" might be too verbose?
                // Step 728 shows user handled raw draw toast: "player.name drew a card!"
                // So I should replicate that.
                this.setNotification(`${player.name} drew a card!`, 'info');
            }
        }
    }

    // Attempt to capture mechanism
    public declareCapture(cardId: string, attackType: AttackType, cardIdsToPlay: string[]) {
        if (this.state.phase !== 'action') return;

        const player = this.state.players[this.state.currentPlayerIndex];
        const targetCard = this.state.landscape.find(c => c.id === cardId);

        if (!targetCard) {
            throw new Error("Target card not found in landscape");
        }

        // Validate cards exist in hand
        const cardsToPlay = player.hand.filter(c => cardIdsToPlay.includes(c.id));
        if (cardsToPlay.length !== cardIdsToPlay.length) {
            throw new Error("Invalid cards selected");
        }

        if (cardsToPlay.length > 6) {
            throw new Error("Max 6 cards allowed");
        }

        // Remove Lucky Ladybugs from selection logic if selected (shouldn't be select-able for attack usually, but handle it)
        const adventurerCards = cardsToPlay.filter(c => c.type === 'adventurer') as unknown as import('./types').AdventurerCard[];

        // Validate Combination
        let isValid = false;
        if (attackType === 'strike') {
            // Straight (numerical order)
            // Sort by value
            adventurerCards.sort((a, b) => a.value - b.value);
            isValid = true;
            for (let i = 0; i < adventurerCards.length - 1; i++) {
                if (adventurerCards[i + 1].value !== adventurerCards[i].value + 1) {
                    isValid = false;
                    break;
                }
            }
        } else if (attackType === 'stomp') {
            // Flush (same suit)
            const suit = adventurerCards[0].suit;
            isValid = adventurerCards.every(c => c.suit === suit);
        } else if (attackType === 'scream') {
            // Kind (same value)
            const val = adventurerCards[0].value;
            isValid = adventurerCards.every(c => c.value === val);
        } else if (attackType === 'dragon_spell') {
            // Specific: Target must be Dragon, Cards must be 3, Straight Flush
            if (targetCard.name !== 'Dragon') {
                throw new Error("Dragon Spell can only be used on a Dragon!");
            }
            if (adventurerCards.length !== 3) {
                throw new Error("Dragon Spell requires exactly 3 cards!");
            }

            // Check Flush
            const suit = adventurerCards[0].suit;
            const isFlush = adventurerCards.every(c => c.suit === suit);

            // Check Straight
            adventurerCards.sort((a, b) => a.value - b.value);
            let isStraight = true;
            for (let i = 0; i < adventurerCards.length - 1; i++) {
                if (adventurerCards[i + 1].value !== adventurerCards[i].value + 1) {
                    isStraight = false;
                    break;
                }
            }

            if (!isFlush || !isStraight) {
                throw new Error("Dragon Spell requires a generic 3-card Straight Flush!");
            }
            isValid = true;
        }

        if (!isValid) {
            throw new Error(`Invalid card combination for ${attackType}`);
        }

        // Dice calculation
        // 1 card = 1 die base.
        // Check for enhancements (TODO)
        let diceCount = adventurerCards.length; // + enhancements

        // Dragon Spell: Roll 2 dice (user rule)
        if (attackType === 'dragon_spell') {
            diceCount = 2;
        }

        // Update state to rolling
        this.state.phase = 'capture_attempt';
        this.state.diceRollConfig = {
            count: diceCount,
            pending: true,
            results: [],
            player: { name: player.name, isBot: player.isBot },
            targetCardName: targetCard.name
        };

        // Determine Success
        let required = 0;
        if (attackType === 'dragon_spell') {
            required = 6; // User rule: Roll 2 dice, need 6+
        } else {
            // Check if property exists, otherwise default high
            const costMap = (targetCard as any).captureCost;
            required = costMap ? costMap[attackType] || 99 : 99;
        }

        // Check enhancements player owns
        // e.g. +2 to strike
        // For now basics only.

        // Calculate Bonuses
        let bonusValue = 0;
        if (attackType !== 'dragon_spell') {
            const bonuses = this.calculateBonuses(player);
            bonusValue = bonuses[attackType];
        }

        // Enhancement bonuses cannot be used to capture other enhancements
        if (targetCard.type === 'enhancement') {
            bonusValue = 0;
        }

        // Execute Roll immediately for simplicity
        let results = rollDice(diceCount);

        // Honey Pot Mechanic: Re-roll 1s (once)
        // Check if player has Honey Pot
        const hasHoneyPot = player.capturedCards.some(c => c.name === 'Honey Pot');
        if (hasHoneyPot) {
            const initialOnes = results.filter(r => r === 1).length;
            if (initialOnes > 0) {
                this.state.turnLog.push(`${player.name} uses Honey Pot to re-roll ${initialOnes} die(dice)! 🍯`); // Add emoji or clear text
                results = results.map(r => {
                    if (r === 1) {
                        return rollDice(1)[0];
                    }
                    return r;
                });
            }
        }

        const rollTotal = results.reduce((a, b) => a + b, 0);
        const total = rollTotal + bonusValue;

        this.state.diceRollConfig.results = results;
        this.state.diceRollConfig.pending = false;
        this.state.diceRollConfig.required = required;
        this.state.diceRollConfig.bonus = bonusValue;
        this.state.diceRollConfig.total = total;

        let logMsg = `${player.name} rolled ${results.join(', ')} (Sum: ${rollTotal})`;
        if (bonusValue > 0) {
            logMsg += ` + Bonus: ${bonusValue} = Total: ${total}`;
        } else {
            logMsg += ` = Total: ${total}`;
        }
        logMsg += ` for ${attackType} on ${targetCard.name}`;

        this.state.turnLog.push(logMsg);

        // Populate success
        this.state.diceRollConfig.success = total >= required;

        if (total >= required) {
            // Success
            this.state.turnLog.push("Capture Successful!");
            this.setNotification(`${player.name} Captured ${targetCard.name}!`, 'success');
            player.capturedCards.push(targetCard);
            this.state.landscape = this.state.landscape.filter(c => c.id !== cardId);

            // Refill landscape
            if (this.state.dragonwoodDeck.length > 0) {
                this.state.landscape.push(this.state.dragonwoodDeck.pop()!);
            }

            // Discard played cards
            player.hand = player.hand.filter(c => !cardIdsToPlay.includes(c.id));
            this.state.discardPile.push(...cardsToPlay);
            this.endTurn();
        } else {
            // Fail
            this.state.turnLog.push("Capture Failed!");
            this.setNotification(`${player.name} Failed Capture!`, 'error');
            // Penalty: Discard 1 card (Adventurer Card)
            // Rule: "If you fail, take the cards you played back into your hand. Then you must discard one Adventurer card from your hand as a penalty."

            if (player.hand.length > 0) {
                // Change phase to penalty_discard so user must choose
                this.state.phase = 'penalty_discard';
                this.state.turnLog.push(`${player.name} must discard a card as penalty.`);
                this.notify();
                // Do NOT end turn yet
            } else {
                // Empty hand, nothing to discard? Rare case (played cards returned to hand, so hand shouldn't be empty unless played 0 cards?)
                // Played cards ARE returned to hand strictly speaking (they never left really, we just selected them).
                this.endTurn();
            }
        }
    }

    public resolvePenaltyDiscard(cardId: string) {
        if (this.state.phase !== 'penalty_discard') return;

        const player = this.state.players[this.state.currentPlayerIndex];
        const cardIndex = player.hand.findIndex(c => c.id === cardId);

        if (cardIndex === -1) {
            throw new Error("Card not found in hand");
        }

        const card = player.hand[cardIndex];
        player.hand.splice(cardIndex, 1);
        this.state.discardPile.push(card);
        this.state.turnLog.push(`${player.name} discarded a penalty card.`);
        this.setNotification(`${player.name} discarded a penalty card.`, 'info');

        this.endTurn();
    }

    private endTurn() {
        // Decrease final turns if active
        if (this.state.finalTurnsLeft !== undefined) {
            this.state.finalTurnsLeft--;
            if (this.state.finalTurnsLeft <= 0) {
                this.triggerGameOver("Adventure deck used twice!");
                return;
            }
        }

        if (this.checkGameOver()) {
            return;
        }

        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
        this.state.phase = 'action';

        this.notify(); // Update UI for new player turn

        if (this.state.players[this.state.currentPlayerIndex].isBot) {
            this.runBotTurn();
        }
    }

    private triggerGameOver(reason: string) {
        this.state.phase = 'game_over';
        this.state.turnLog.push(`Game Over! ${reason}`);
        this.notify();
    }

    private checkGameOver(): boolean {
        // Condition 1: Both Dragons captured
        const totalDragons = this.state.players.reduce((sum, p) =>
            sum + p.capturedCards.filter(c => c.name === 'Dragon').length, 0);

        if (totalDragons >= 2) {
            this.triggerGameOver("Both Dragons have been defeated!");
            return true;
        }

        return false;
    }

    public calculateBonuses(player: Player): { strike: number, stomp: number, scream: number } {
        const bonuses = { strike: 0, stomp: 0, scream: 0 };
        for (const card of player.capturedCards) {
            if (card.type === 'enhancement') {
                if (card.name === 'Silver Sword') bonuses.strike += 2;
                if (card.name === 'Magical Boots') bonuses.stomp += 2;
                if (card.name === 'Cloak of Darkness') bonuses.scream += 2;
            }
        }
        return bonuses;
    }

    private runBotTurn() {
        this.state.turnLog.push("Bot is thinking...");
        this.notify(); // Ensure UI updates to show thinking log if visible

        setTimeout(() => {
            const bot = this.state.players[this.state.currentPlayerIndex];
            const landscape = this.state.landscape;

            // 1. Analyze Hand
            const adventurers = bot.hand.filter(c => c.type === 'adventurer') as unknown as import('./types').AdventurerCard[];

            // Group by Suit (Stomp/Flush)
            const bySuit: Record<string, import('./types').AdventurerCard[]> = {};
            // Group by Value (Scream/Kind)
            const byValue: Record<number, import('./types').AdventurerCard[]> = {};

            adventurers.forEach(c => {
                if (!bySuit[c.suit]) bySuit[c.suit] = [];
                bySuit[c.suit].push(c);

                if (!byValue[c.value]) byValue[c.value] = [];
                byValue[c.value].push(c);
            });

            // Find Straights (Strike) - tricky, just find longest runs
            adventurers.sort((a, b) => a.value - b.value);
            const runs: import('./types').AdventurerCard[][] = [];
            let currentRun: import('./types').AdventurerCard[] = [];
            for (let i = 0; i < adventurers.length; i++) {
                if (currentRun.length === 0) {
                    currentRun.push(adventurers[i]);
                } else {
                    const last = currentRun[currentRun.length - 1];
                    if (adventurers[i].value === last.value + 1) {
                        currentRun.push(adventurers[i]);
                    } else if (adventurers[i].value !== last.value) { // Ignore duplicates for run
                        runs.push([...currentRun]);
                        currentRun = [adventurers[i]];
                    }
                }
            }
            if (currentRun.length > 0) runs.push(currentRun);


            // 2. Evaluate Opportunities
            let bestMove: { cardId: string, type: AttackType, cards: string[] } | null = null;
            let bestScore = -1;

            for (const target of landscape) {
                if (target.type !== 'creature' && target.type !== 'enhancement') continue;

                // Costs
                const cost = target.captureCost;

                // Check Stomp (Flush)
                for (const suit in bySuit) {
                    const hand = bySuit[suit];
                    const diceCount = hand.length; // + bonuses (skip for MVP bot)
                    const avgRoll = diceCount * 2.5;
                    if (avgRoll >= cost.stomp) {
                        // Valid-ish candidate
                        const score = ('victoryPoints' in target ? target.victoryPoints : 0) + (hand.length * 0.1); // Prioritize VP, then generic efficiency
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { cardId: target.id, type: 'stomp', cards: hand.map(c => c.id) };
                        }
                    }
                }

                // Check Scream (Kind)
                for (const val in byValue) {
                    const hand = byValue[val];
                    const diceCount = hand.length;
                    const avgRoll = diceCount * 2.5;
                    if (avgRoll >= cost.scream) {
                        const score = ('victoryPoints' in target ? target.victoryPoints : 0) + (hand.length * 0.1);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { cardId: target.id, type: 'scream', cards: hand.map(c => c.id) };
                        }
                    }
                }

                // Check Strike (Straight)
                for (const run of runs) {
                    const diceCount = run.length;
                    const avgRoll = diceCount * 2.5;
                    if (avgRoll >= cost.strike) {
                        const score = ('victoryPoints' in target ? target.victoryPoints : 0) + (run.length * 0.1);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { cardId: target.id, type: 'strike', cards: run.map(c => c.id) };
                        }
                    }
                }
            }

            // 3. Act
            if (bestMove) {
                const targetName = landscape.find(c => c.id === bestMove!.cardId)?.name;
                this.state.turnLog.push(`Bot attacks ${targetName} with ${bestMove.type} ! 🤖`);

                try {
                    this.declareCapture(bestMove.cardId, bestMove.type, bestMove.cards);

                    // Check if capture failed and we are in penalty phase
                    if (this.state.phase === 'penalty_discard') {
                        this.state.turnLog.push("Bot failed capture! Choosing card to discard...");
                        this.notify();

                        setTimeout(() => {
                            // Simple bot logic: discard first card in hand
                            const botPlayer = this.state.players[this.state.currentPlayerIndex];
                            if (botPlayer.hand.length > 0) {
                                this.resolvePenaltyDiscard(botPlayer.hand[0].id);
                            } else {
                                // Fallback if no cards to discard (shouldn't happen in penalty phase normally)
                                this.endTurn()
                            }
                        }, 1000);
                    }
                } catch (e) {
                    console.error("Bot failed capture execution", e);
                    this.drawCard(); // Fallback
                }
            } else {
                this.drawCard();
            }

        }, 1500);
    }
}
