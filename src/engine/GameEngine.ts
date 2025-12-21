import { createAdventurerDeck, createDragonwoodDeck } from './DeckManager';
import { rollDice } from './Dice';
import type { GameState, Player, PlayerCard, DragonwoodCard, Creature, AttackType } from './types';

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
            name: 'Bot',
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
            turnLog: ['Game Started']
        };
    }



    public drawCard() {
        if (this.state.phase !== 'action') return;

        const player = this.state.players[this.state.currentPlayerIndex];

        // Draw 1 card
        // If deck is empty, reshuffle discard pile
        if (this.state.adventurerDeck.length === 0) {
            if (this.state.discardPile.length === 0) {
                // Game Over condition or just pass turn?
                // Rule: "The game ends when... the Adventure deck has been gone through twice" (classic rule).
                // Simpler Rule: If both empty, cannot draw.
                this.state.turnLog.push("Adventurer Deck is empty!");
                this.endTurn();
                return;
            }

            // Reshuffle
            this.state.turnLog.push("Reshuffling Discard Pile into Deck...");
            // Shuffle function is in DeckManager but we can just simplify here or import
            // ideally use the shuffle utility
            const newDeck = this.state.discardPile;
            // Simple shuffle here to avoid circular imports or complex calls if shuffle isn't a method of GameEngine
            for (let i = newDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
            }
            this.state.adventurerDeck = newDeck;
            this.state.discardPile = [];
        }

        const card = this.state.adventurerDeck.pop();
        if (card) {
            // Check for Lucky Ladybug
            if (card.type === 'lucky_ladybug') {
                this.state.turnLog.push(`${player.name} drew a Lucky Ladybug! 🐞 Draw 2 more.`);
                this.state.discardPile.push(card);

                // Draw 2 more
                for (let i = 0; i < 2; i++) {
                    if (this.state.adventurerDeck.length === 0) {
                        if (this.state.discardPile.length > 0) {
                            this.state.turnLog.push("Reshuffling for extra draw...");
                            const newDeck = this.state.discardPile;
                            for (let j = newDeck.length - 1; j > 0; j--) {
                                const k = Math.floor(Math.random() * (j + 1));
                                [newDeck[j], newDeck[k]] = [newDeck[k], newDeck[j]];
                            }
                            this.state.adventurerDeck = newDeck;
                            this.state.discardPile = [];
                        } else {
                            break; // No cards left to draw
                        }
                    }
                    const extra = this.state.adventurerDeck.pop();
                    if (extra) {
                        player.hand.push(extra);
                        this.state.turnLog.push(`${player.name} drew ${extra.type === 'adventurer' ? extra.value + ' ' + extra.suit : 'another ladybug'}`);
                    }
                }
                this.state.turnLog.push(`${player.name} drew a card.`);
            } else {
                player.hand.push(card);
                this.state.turnLog.push(`${player.name} drew a card.`);
            }
        }

        this.endTurn();
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
        }

        if (!isValid) {
            throw new Error(`Invalid card combination for ${attackType}`);
        }

        // Dice calculation
        // 1 card = 1 die base.
        // Check for enhancements (TODO)
        const diceCount = adventurerCards.length; // + enhancements

        // Update state to rolling
        this.state.phase = 'capture_attempt';
        this.state.diceRollConfig = {
            count: diceCount,
            pending: true,
            results: []
        };

        // Determine Success
        const required = (targetCard as Creature).captureCost?.[attackType] || 0; // Handle non-creatures?
        // Enhancements also have cost

        // Check enhancements player owns
        // e.g. +2 to strike
        // For now basics only.

        // Calculate Bonuses
        const bonuses = this.calculateBonuses(player);
        const bonusValue = bonuses[attackType];

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

        this.endTurn();
    }

    private endTurn() {
        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
        this.state.phase = 'action';

        // Check game over
        // Rule: Both decks gone or 2 dragons killed? 
        // "The game ends when the last Dragon is captured OR the Adventure deck has been gone through twice."

        // For now, simple standard turn rotation.

        this.notify(); // Update UI for new player turn

        if (this.state.players[this.state.currentPlayerIndex].isBot) {
            this.runBotTurn();
        }
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
        // Super simple bot: Attempts to draw always
        this.state.turnLog.push("Bot is thinking...");
        this.notify();
        setTimeout(() => { // Simulate think time not real async, just logical separation? 
            // Actually in React state update must be atomic. 
            // So we just process directly.
            this.drawCard();
        }, 0);
    }
}
