import { roundNumber } from "./number-rounding";

export function scoreConfidence(score: number): number {
  return Math.max(0.1, Math.min(0.99, roundNumber(score / 1000)));
}
