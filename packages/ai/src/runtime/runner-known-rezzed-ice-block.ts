import { canBreakerDefinitionBreakIce, iceHasEndTheRun } from "../visible-run-analysis";

type KnownRezzedIceCandidate = {
  definitionId?: string;
  rezzed?: boolean;
  known: boolean;
  subtypes?: string[];
};

export function isBlockedByKnownRezzedIce(
  ice: KnownRezzedIceCandidate | undefined,
  rigDefinitionIds: Set<string>,
): boolean {
  if (!ice?.definitionId || !ice.known || ice.rezzed !== true) return false;
  const iceDefinitionId = ice.definitionId;
  if (!iceHasEndTheRun(iceDefinitionId)) return false;
  return ![...rigDefinitionIds].some((breakerDefinitionId) =>
    canBreakerDefinitionBreakIce(breakerDefinitionId, iceDefinitionId),
  );
}
