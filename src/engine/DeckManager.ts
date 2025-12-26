import type { Creature, DragonwoodCard, Enhancement, PlayerCard, Suit } from './types';

// Constants
const SUITS: Suit[] = ['red', 'orange', 'purple', 'green', 'blue'];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

// Helper to shuffle array
export function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export function createAdventurerDeck(): PlayerCard[] {
    const deck: PlayerCard[] = [];

    // 5 Suits x 12 Ranks
    SUITS.forEach(suit => {
        VALUES.forEach(val => {
            deck.push({
                id: `adv_${suit}_${val}`,
                type: 'adventurer',
                suit,
                value: val
            });
        });
    });

    // 4 Lucky Ladybugs
    for (let i = 0; i < 4; i++) {
        deck.push({
            id: `ladybug_${i}`,
            type: 'lucky_ladybug'
        });
    }

    return shuffle(deck);
}

// Data for Dragonwood Deck
const CREATURES_DATA: Omit<Creature, 'id' | 'type'>[] = [
    { name: 'Fire Ant', victoryPoints: 2, captureCost: { strike: 3, stomp: 4, scream: 5 }, image: 'fire_ant' },
    { name: 'Gooey Glob', victoryPoints: 3, captureCost: { strike: 4, stomp: 5, scream: 6 }, image: 'gooey_glob' },
    { name: 'Angry Ogre', victoryPoints: 4, captureCost: { strike: 5, stomp: 6, scream: 7 }, image: 'angry_ogre' },
    { name: 'Spooky Spiders', victoryPoints: 1, captureCost: { strike: 3, stomp: 3, scream: 3 }, image: 'spooky_spiders' },
    { name: 'Hungry Bear', victoryPoints: 3, captureCost: { strike: 5, stomp: 4, scream: 6 }, image: 'hungry_bear' },
    { name: 'Gigantic Giant', victoryPoints: 5, captureCost: { strike: 6, stomp: 7, scream: 8 }, image: 'gigantic_giant' },
    { name: 'Dragon', victoryPoints: 7, captureCost: { strike: 9, stomp: 9, scream: 9 }, image: 'dragon' },
    { name: 'Troll', victoryPoints: 4, captureCost: { strike: 6, stomp: 5, scream: 5 }, image: 'troll' },
    { name: 'Goblin', victoryPoints: 2, captureCost: { strike: 4, stomp: 4, scream: 4 }, image: 'goblin' },
];

const ENHANCEMENTS_DATA: Omit<Enhancement, 'id' | 'type'>[] = [
    { name: 'Silver Sword', effectDescription: 'Add +2 to all Strikes', victoryPoints: 2, captureCost: { strike: 5, stomp: 99, scream: 99 }, image: 'silver_sword' }, // Approximate
    { name: 'Cloak of Darkness', effectDescription: 'Add +2 to all Screams', victoryPoints: 2, captureCost: { strike: 99, stomp: 99, scream: 5 }, image: 'cloak_of_darkness' },
    { name: 'Magical Boots', effectDescription: 'Add +2 to all Stomps', victoryPoints: 2, captureCost: { strike: 99, stomp: 5, scream: 99 }, image: 'magical_boots' },
    { name: 'Honey Pot', effectDescription: 'Re-roll any 1', victoryPoints: 0, captureCost: { strike: 4, stomp: 4, scream: 4 }, image: 'honey_pot' },
];

export function createDragonwoodDeck(): DragonwoodCard[] {
    const deck: DragonwoodCard[] = [];
    const dragonCards: DragonwoodCard[] = [];

    // Add multiple copies of some creatures to fill out the deck
    CREATURES_DATA.forEach((c, idx) => {
        const card1 = { ...c, id: `creature_${idx}`, type: 'creature' } as DragonwoodCard;
        const card2 = { ...c, id: `creature_${idx}_2`, type: 'creature' } as DragonwoodCard;

        if (c.name === 'Dragon') {
            dragonCards.push(card1);
            dragonCards.push(card2);
        } else {
            deck.push(card1);
            deck.push(card2);
        }
    });

    ENHANCEMENTS_DATA.forEach((e, idx) => {
        deck.push({ ...e, id: `enhancement_${idx}`, type: 'enhancement' } as DragonwoodCard);
    });

    // 1. Shuffle all non-dragon cards
    const shuffledNonDragons = shuffle(deck);

    // 2. Calculate the safe zone (top half) based on total cards
    const totalCards = deck.length + dragonCards.length;
    const halfIndex = Math.floor(totalCards / 2);

    // Ensure we have enough non-dragon cards for the top half
    // (In a normal game this is always true, but good to be safe)
    const splitIndex = Math.min(halfIndex, shuffledNonDragons.length);

    const topHalf = shuffledNonDragons.slice(0, splitIndex);
    const bottomNonDragons = shuffledNonDragons.slice(splitIndex);

    // 3. Add dragons to bottom half and shuffle ONLY the bottom half
    // NOTE: Game uses .pop() to draw, so the 'end' of the array is the 'top' of the deck.
    // Therefore, the Bottom Half (with Dragons) should be at the START of the array.
    const bottomWithDragons = shuffle([...bottomNonDragons, ...dragonCards]);

    // 4. Combine: Bottom (Start) + Top (End/Draw First)
    return [...bottomWithDragons, ...topHalf];
}
