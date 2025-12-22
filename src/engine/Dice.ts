export const DICE_FACES = [1, 2, 3, 4, 5, 6];

export function rollDie(): number {
    return Math.floor(Math.random() * 6) + 1;
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
