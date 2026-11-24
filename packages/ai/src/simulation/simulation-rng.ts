import { fnv1a } from "../runtime/stable-hash";

export type SimulationRng = {
  readonly seed: string;
  counter: number;
  nextInt: (maxExclusive: number) => number;
};

export function createSimulationRng(seed: string): SimulationRng {
  const rng: SimulationRng = {
    seed,
    counter: 0,
    nextInt: (maxExclusive: number): number => {
      if (maxExclusive <= 1) return 0;
      rng.counter += 1;
      const numeric = Number.parseInt(fnv1a(`${seed}:${rng.counter}`), 16);
      return numeric % maxExclusive;
    },
  };
  return rng;
}
