export const DICE_FACES = [1, 2, 2, 3, 3, 4];

export function rollDie(): number {
    const index = Math.floor(Math.random() * DICE_FACES.length);
    return DICE_FACES[index];
}

export function rollDice(count: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
        results.push(rollDie());
    }
    return results;
}

export function calculateTotal(rolls: number[]): number {
    return rolls.reduce((sum, val) => sum + val, 0);
}
