import type { AiDecisionInput } from "@netgrid/shared";

type DecisionDerivedCacheEntry = {
  generation: object;
  values: Map<unknown, unknown>;
};

let activeGeneration: object | undefined;
let activeDepth = 0;
const cacheByInput = new WeakMap<AiDecisionInput, DecisionDerivedCacheEntry>();

export function withDecisionDerivedCache<T>(callback: () => T): T {
  const ownsGeneration = activeGeneration === undefined;
  if (ownsGeneration) activeGeneration = {};
  activeDepth += 1;
  try {
    return callback();
  } finally {
    activeDepth -= 1;
    if (ownsGeneration || activeDepth === 0) activeGeneration = undefined;
  }
}

export function decisionDerivedValue<T>(
  input: AiDecisionInput,
  key: unknown,
  create: () => T,
): T {
  const generation = activeGeneration;
  if (!generation) return create();

  let entry = cacheByInput.get(input);
  if (!entry || entry.generation !== generation) {
    entry = { generation, values: new Map() };
    cacheByInput.set(input, entry);
  }
  if (entry.values.has(key)) return entry.values.get(key) as T;
  const value = create();
  entry.values.set(key, value);
  return value;
}
