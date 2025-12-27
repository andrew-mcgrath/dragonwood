
import { describe, it, expect } from 'vitest';
import { Probability } from './Probability';

describe('Probability Calculator', () => {
    it('should calculate success chance for 2 dice (Dragonwood: 1, 2, 2, 3, 3, 4) vs target 6', () => {
        // 2 Dice. Total combinations: 6*6 = 36.
        // Faces: 1, 2, 2, 3, 3, 4
        // Possible sums >= 6:
        // 4+2 (x2), 4+3 (x2), 4+4 (x1) -> (4,2),(4,2),(2,4),(2,4) = 4; (4,3),(4,3),(3,4),(3,4) = 4; (4,4) = 1. Total = 9?
        // Let's list pairs:
        // (1, x) -> max 5. No.
        // (2, 4) -> 6. (2 instances of 2) * (1 instance of 4) = 2 ways.
        // (2, x) other sum < 6.
        // (3, 3) -> 6. (2 instances) * (2 instances) = 4 ways.
        // (3, 4) -> 7. (2 instances) * (1 instance) = 2 ways.
        // (4, 2) -> 6. (1 instance) * (2 instances) = 2 ways.
        // (4, 3) -> 7. (1 instance) * (2 instances) = 2 ways.
        // (4, 4) -> 8. (1 instance) * (1 instance) = 1 way.
        // Total ways: 2 (2,4) + 4 (3,3) + 2 (3,4) + 2 (4,2) + 2 (4,3) + 1 (4,4) = 13 ways.
        // Probability: 13/36 = 36.111%

        const prob = Probability.calculateSuccessChance(2, 6);
        expect(prob).toBeCloseTo(36.11, 1);
    });

    it('should calculate chance for 1 die vs target 3', () => {
        // Faces >= 3: 3, 3, 4. (3 faces).
        // 3/6 = 50%.
        const prob = Probability.calculateSuccessChance(1, 3);
        expect(prob).toBeCloseTo(50, 1);
    });
});
