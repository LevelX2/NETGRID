import type { AiDecision } from "@netgrid/shared";

export function memoizeLegacyDecision(provider: () => AiDecision): () => AiDecision {
  let cached: AiDecision | undefined;
  return () => {
    cached ??= provider();
    return cached;
  };
}
