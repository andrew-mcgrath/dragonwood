import { DICE_FACES } from './Dice';

export class Probability {
    // Cache for dice probabilities: [numDice][target] = probability
    private static cache: Map<string, number> = new Map();

    /**
     * Calculates the probability of rolling >= target with n dice.
     * Uses Standard Dragonwood dice via DICE_FACES.
     */
    public static calculateSuccessChance(numDice: number, target: number): number {
        if (numDice <= 0) return 0;
        // Max roll per die is 4
        if (target <= numDice) return 100; // Minimum roll is 1 per die
        if (target > numDice * 4) return 0; // Max roll is 4 per die

        const key = `${numDice}-${target}`;
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        // DP table: dp[i][j] = ways to get sum j with i dice
        // Max sum for numDice dice (max face 4) is numDice * 4.
        const maxSum = numDice * 4;
        let dp: number[] = new Array(maxSum + 1).fill(0);

        // Base case: 1 die
        for (const face of DICE_FACES) {
            dp[face] = (dp[face] || 0) + 1;
        }

        // Add remaining dice
        for (let d = 2; d <= numDice; d++) {
            const newDp = new Array(maxSum + 1).fill(0);
            // Iterate over all possible previous sums
            for (let sum = 0; sum <= (d - 1) * 4; sum++) {
                if (!dp[sum]) continue;
                // Add each face
                for (const face of DICE_FACES) {
                    newDp[sum + face] += dp[sum];
                }
            }
            dp = newDp;
        }

        // Sum ways >= target
        let winningWays = 0;
        for (let s = target; s <= maxSum; s++) {
            winningWays += dp[s];
        }

        const totalCombinations = Math.pow(6, numDice);
        const probability = (winningWays / totalCombinations) * 100;

        // Cache rounded to 1 decimal for simplicity, but storing full float is fine
        this.cache.set(key, probability);
        return probability;
    }
}
