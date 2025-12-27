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
// // FOR VERIFICATION ONLY: Tiny Deck
// const CREATURES_DATA: Omit<Creature, 'id' | 'type'>[] = [
//     { name: 'Dragon', victoryPoints: 7, captureCost: { strike: 9, stomp: 9, scream: 9 }, image: 'dragon' },
//     { name: 'Spooky Spiders', victoryPoints: 1, captureCost: { strike: 1, stomp: 1, scream: 1 }, image: 'spooky_spiders' }, // Easy capture to end game
// ];

// const ENHANCEMENTS_DATA: Omit<Enhancement, 'id' | 'type'>[] = [];

// Deck composition: creature definitions with quantities
const CREATURES_DATA: Array<{ quantity: number } & Omit<Creature, 'id' | 'type'>> = [
    { quantity: 2, name: 'Wild Boar', victoryPoints: 3, captureCost: { strike: 8, stomp: 7, scream: 7 }, image: 'wild_boar' },
    { quantity: 2, name: 'Fire Ants', victoryPoints: 2, captureCost: { strike: 7, stomp: 4, scream: 6 }, image: 'fire_ant' },
    { quantity: 2, name: 'Giggle Goblin', victoryPoints: 2, captureCost: { strike: 7, stomp: 5, scream: 5 }, image: 'goblin' },
    { quantity: 1, name: 'Angry Ogre', victoryPoints: 5, captureCost: { strike: 12, stomp: 9, scream: 14 }, image: 'angry_ogre' },
    { quantity: 1, name: 'Orange Dragon', victoryPoints: 7, captureCost: { strike: 15, stomp: 11, scream: 12 }, image: 'orange_dragon' },
    { quantity: 1, name: 'Blue Dragon', victoryPoints: 6, captureCost: { strike: 99, stomp: 10, scream: 13 }, image: 'blue_dragon' },
    { quantity: 2, name: 'Pack of Wolves', victoryPoints: 3, captureCost: { strike: 6, stomp: 7, scream: 9 }, image: 'pack_of_wolves' },
    { quantity: 2, name: 'Fierce Jaguar', victoryPoints: 3, captureCost: { strike: 8, stomp: 6, scream: 8 }, image: 'fierce_jaguar' },
    { quantity: 4, name: 'Spooky Spiders', victoryPoints: 1, captureCost: { strike: 3, stomp: 3, scream: 3 }, image: 'spooky_spiders' },
    { quantity: 2, name: 'Hungry Bear', victoryPoints: 3, captureCost: { strike: 7, stomp: 6, scream: 9 }, image: 'hungry_bear' },
    { quantity: 1, name: 'Gooey Glob', victoryPoints: 5, captureCost: { strike: 14, stomp: 9, scream: 10 }, image: 'gooey_glob' },
    { quantity: 4, name: 'Crazy Bats', victoryPoints: 1, captureCost: { strike: 4, stomp: 3, scream: 3 }, image: 'crazy_bats' },
    { quantity: 2, name: 'Wasps\' Nest', victoryPoints: 2, captureCost: { strike: 5, stomp: 6, scream: 7 }, image: 'wasps_nest' },
    { quantity: 1, name: 'Grumpy Troll', victoryPoints: 4, captureCost: { strike: 9, stomp: 11, scream: 9 }, image: 'grumpy_troll' },
    { quantity: 1, name: 'Secret Shadow', victoryPoints: 4, captureCost: { strike: 10, stomp: 8, scream: 11 }, image: 'secret_shadow' },
    { quantity: 1, name: 'Gigantic Python', victoryPoints: 4, captureCost: { strike: 11, stomp: 8, scream: 10 }, image: 'gigantic_python' },
];

const ENHANCEMENTS_DATA: Omit<Enhancement, 'id' | 'type'>[] = [
    { name: 'Silver Sword', effectDescription: 'Add +2 to all Strikes', victoryPoints: 0, captureCost: { strike: 5, stomp: 99, scream: 99 }, image: 'silver_sword' }, // Approximate
    { name: 'Cloak of Darkness', effectDescription: 'Add +2 to all Screams', victoryPoints: 0, captureCost: { strike: 99, stomp: 99, scream: 5 }, image: 'cloak_of_darkness' },
    { name: 'Magical Boots', effectDescription: 'Add +2 to all Stomps', victoryPoints: 0, captureCost: { strike: 99, stomp: 5, scream: 99 }, image: 'magical_boots' },
    { name: 'Honey Pot', effectDescription: 'Re-roll any 1', victoryPoints: 0, captureCost: { strike: 4, stomp: 4, scream: 4 }, image: 'honey_pot' },
];

export function createDragonwoodDeck(): DragonwoodCard[] {
    const deck: DragonwoodCard[] = [];
    const dragonCards: DragonwoodCard[] = [];

    // Add creatures based on their specified quantities
    let creatureIdCounter = 0;
    CREATURES_DATA.forEach((creatureData) => {
        for (let i = 0; i < creatureData.quantity; i++) {
            const { quantity, ...creatureProps } = creatureData;
            const card: DragonwoodCard = {
                ...creatureProps,
                id: `creature_${creatureIdCounter++}`,
                type: 'creature'
            };

            // Separate dragon cards to ensure they appear in bottom half
            if (creatureData.name === 'Orange Dragon' || creatureData.name === 'Blue Dragon') {
                dragonCards.push(card);
            } else {
                deck.push(card);
            }
        }
    });

    ENHANCEMENTS_DATA.forEach((e, idx) => {
        deck.push({ ...e, id: `enhancement_${idx}`, type: 'enhancement' } as DragonwoodCard);
    });

    // 1. Shuffle all non-dragon cards
    const shuffledNonDragons = shuffle(deck);

    // 2. Calculate the safe zone (top half) based on total cards
    // The top half (end of array, drawn first) should get the LARGER portion for odd-length decks
    // This ensures dragons stay in the bottom half (start of array, drawn last)
    const totalCards = shuffledNonDragons.length + dragonCards.length;
    const topHalfSize = Math.ceil(totalCards / 2); // Larger half (for odd totals)

    // Ensure we have enough non-dragon cards for the top half
    const splitIndex = Math.max(0, shuffledNonDragons.length - topHalfSize);

    const bottomNonDragons = shuffledNonDragons.slice(0, splitIndex);
    const topHalf = shuffledNonDragons.slice(splitIndex);

    // 3. Add dragons to bottom half and shuffle ONLY the bottom half
    // NOTE: Game uses .pop() to draw, so the 'end' of the array is the 'top' of the deck.
    // Therefore, the Bottom Half (with Dragons) should be at the START of the array.
    const bottomWithDragons = shuffle([...bottomNonDragons, ...dragonCards]);

    // 4. Combine: Bottom (Start) + Top (End/Draw First)
    return [...bottomWithDragons, ...topHalf];
}
