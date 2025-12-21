export type Suit = 'red' | 'orange' | 'purple' | 'green' | 'blue';

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface AdventurerCard {
  id: string;
  type: 'adventurer';
  suit: Suit;
  value: CardValue;
}

export interface LuckyLadybugCard {
  id: string;
  type: 'lucky_ladybug';
}

export type PlayerCard = AdventurerCard | LuckyLadybugCard;

export type AttackType = 'strike' | 'stomp' | 'scream';

export interface Creature {
  id: string;
  name: string;
  type: 'creature';
  victoryPoints: number;
  captureCost: {
    strike: number; // Low Straight (Cards in numerical order)
    stomp: number;  // Flush (Cards of same color)
    scream: number; // High Sum (Cards of any color/number? No, Scream is usually "Three of a kind" or similar? Wait, verify rules.)
    // Correction: 
    // Strike = Cards in numerical order (Straight)
    // Stomp = Cards of same color (Flush)
    // Scream = Cards of same number (Kind)
  };
  image?: string;
}

export interface Enhancement {
  id: string;
  name: string;
  type: 'enhancement';
  effectDescription: string;
  victoryPoints: number; // usually 0, but some might capture for points? Or finding enhancement is different.
  captureCost: {
    strike: number;
    stomp: number;
    scream: number;
  };
  image?: string;
}

export interface EventCard {
  id: string;
  name: string;
  type: 'event';
  description: string;
}

export type DragonwoodCard = Creature | Enhancement | EventCard;

export interface Player {
  id: string;
  name: string;
  hand: PlayerCard[];
  capturedCards: DragonwoodCard[];
  isBot: boolean;
}

export type GamePhase = 'draw' | 'action' | 'capture_attempt' | 'penalty_discard' | 'end_turn' | 'game_over';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  adventurerDeck: PlayerCard[];
  discardPile: PlayerCard[];
  dragonwoodDeck: DragonwoodCard[];
  landscape: DragonwoodCard[]; // The 5 visible cards
  diceRollConfig: {
    count: number;
    pending: boolean;
    results: number[];
    bonus?: number;
    total?: number;
    required?: number;
    success?: boolean;
    player?: { name: string, isBot: boolean };
    targetCardName?: string;
  };
  phase: GamePhase;
  turnLog: string[];
  deckCycles: number;
  finalTurnsLeft?: number;
}
