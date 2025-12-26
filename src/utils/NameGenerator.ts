export const FANTASY_ADJECTIVES = [
    "Brave", "Mighty", "Wise", "Swift", "Silent",
    "Ancient", "Shadowy", "Radiant", "Fierce", "Noble",
    "Crimson", "Azure", "Savage", "Grand", "Mystic",
    "Wandering", "Eternal", "Iron", "Golden", "Stormy",
    "Daring", "Fearless", "Cunning", "Wild", "Gallant"
];

export const FANTASY_NOUNS = [
    "Knight", "Wizard", "Rogue", "Dragon", "Hunter",
    "Seeker", "Wanderer", "Guardian", "Shadow", "Spirit",
    "Wolf", "Bear", "Falcon", "Warrior", "Legend",
    "Sage", "Druid", "Paladin", "Sorcerer", "Ranger",
    "Beast", "Titan", "Viper", "Storm", "Blade"
];

export function generateRandomName(isBot: boolean = false): string {
    const adj = FANTASY_ADJECTIVES[Math.floor(Math.random() * FANTASY_ADJECTIVES.length)];
    const noun = FANTASY_NOUNS[Math.floor(Math.random() * FANTASY_NOUNS.length)];
    const name = `${adj} ${noun}`;

    if (isBot) {
        return `Bot: ${name}`;
    }

    return name;
}
