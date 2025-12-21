import { createAdventurerDeck, createDragonwoodDeck } from './DeckManager';
import { rollDice } from './Dice';
import type { GameState, Player, PlayerCard, DragonwoodCard, Creature, Enhancement, AttackType, GamePhase } from './types';

export class GameEngine {
    state: GameState;

    constructor() {
        this.state = this.initializeGame();
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

        // Deal 5 cards to each player
        for (let i = 0; i < 5; i++) {
            player1.hand.push(adventurerDeck.pop()!); // Assume deck sufficient
            player2.hand.push(adventurerDeck.pop()!);
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
            discardPile: [],
            dragonwoodDeck,
            landscape,
            diceRollConfig: { count: 0, pending: false, results: [] },
            phase: 'action', // Start with action phase
            turnLog: ['Game Started']
        };
    }

    public getState(): GameState {
        return this.state;
    }

    public drawCard() {
        if (this.state.phase !== 'action') return;

        const player = this.state.players[this.state.currentPlayerIndex];

        // Draw 1 card
        // If hand limit (9) reached, must discard - implementing basic hard limit prevention later
        // For now, allow draw.

        const card = this.state.adventurerDeck.pop();
        if (card) {
            // Check for Lucky Ladybug
            if (card.type === 'lucky_ladybug') {
                this.state.turnLog.push(`${player.name} drew a Lucky Ladybug! Draw 2 more.`);
                this.state.discardPile.push(card);

                // Draw 2 more
                for (let i = 0; i < 2; i++) {
                    const extra = this.state.adventurerDeck.pop();
                    if (extra) {
                        player.hand.push(extra);
                        this.state.turnLog.push(`${player.name} drew ${extra.type === 'adventurer' ? extra.value + ' ' + extra.suit : 'another ladybug'}`);
                    }
                }
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

        // Execute Roll immediately for simplicity
        const results = rollDice(diceCount);
        this.state.diceRollConfig.results = results;
        this.state.diceRollConfig.pending = false;

        const total = results.reduce((a, b) => a + b, 0);
        this.state.turnLog.push(`${player.name} rolled ${results.join(', ')} (Total: ${total}) for ${attackType} on ${targetCard.name}`);

        // Determine Success
        const required = (targetCard as Creature).captureCost?.[attackType] || 0; // Handle non-creatures?
        // Enhancements also have cost

        // Check enhancements player owns
        // e.g. +2 to strike
        // For now basics only.

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
        } else {
            // Fail
            this.state.turnLog.push("Capture Failed!");
            // Penalty: Discard 1 card (Adventurer Card)
            // Implementation: Ideally let user choose. For MVP, discard random or last played.
            // Rule: "If you fail, you must discard 1 Adventurer card from your hand as a penalty."
            if (player.hand.length > 0) {
                // Discard the first card played in the failed attempt (simple rule interpretation or just first in hand)
                // Actually the played cards return to hand, AND you discard one.
                // Correct Rule: "If you fail, take the cards you played back into your hand. Then you must discard one Adventurer card from your hand as a penalty."

                // So we don't discard the used cards yet.
                // We need to implement a 'penalty' phase or just auto-discard.
                // For MVP auto-discard first card of hand.
                const penaltyCard = player.hand.pop();
                if (penaltyCard) {
                    this.state.discardPile.push(penaltyCard);
                    this.state.turnLog.push(`${player.name} discards a card as penalty.`);
                }
            }
        }

        this.endTurn();
    }

    private endTurn() {
        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
        this.state.phase = 'action';

        // Check game over
        // Rule: Both decks gone or 2 dragons killed? 
        // "The game ends when the last Dragon is captured OR the Adventure deck has been gone through twice."

        // For now, simple standard turn rotation.

        if (this.state.players[this.state.currentPlayerIndex].isBot) {
            this.runBotTurn();
        }
    }

    private runBotTurn() {
        // Super simple bot: Attempts to draw always
        this.state.turnLog.push("Bot is thinking...");
        setTimeout(() => { // Simulate think time not real async, just logical separation? 
            // Actually in React state update must be atomic. 
            // So we just process directly.
            this.drawCard();
        }, 0);
    }
}
