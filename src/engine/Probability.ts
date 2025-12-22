export class Probability {
    // Cache for dice probabilities: [numDice][target] = probability
    private static cache: Map<string, number> = new Map();

    /**
     * Calculates the probability of rolling >= target with n dice.
     * Uses Standard 6-sided dice (1-6).
     */
    public static calculateSuccessChance(numDice: number, target: number): number {
        if (numDice <= 0) return 0;
        if (target <= numDice) return 100; // Minimum roll is 1 per die
        if (target > numDice * 6) return 0; // Max roll is 6 per die

        const key = `${numDice}-${target}`;
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        // DP table: dp[i][j] = ways to get sum j with i dice
        // Max sum for 6 dice (typical max) is 36.
        // Let's support up to 10 dice comfortably.
        const maxSum = numDice * 6;
        let dp: number[] = new Array(maxSum + 1).fill(0);

        // Base case: 1 die
        for (let i = 1; i <= 6; i++) {
            dp[i] = 1;
        }

        // Add remaining dice
        for (let d = 2; d <= numDice; d++) {
            const newDp = new Array(maxSum + 1).fill(0);
            for (let sum = d; sum <= d * 6; sum++) {
                for (let face = 1; face <= 6; face++) {
                    if (sum - face >= d - 1) { // Prev sum must be at least d-1
                        newDp[sum] += dp[sum - face] || 0;
                    }
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
