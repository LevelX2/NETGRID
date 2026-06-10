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
      if (!Number.isFinite(numeric)) return 0;
      return Math.abs(numeric) % maxExclusive;
    },
  };
  return rng;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
