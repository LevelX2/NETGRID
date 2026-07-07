import type { Side } from "@netgrid/shared";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import {
  assertValidAiDeckSnapshotForRuntime,
  type AiDeckSnapshotRuntimeExpectation,
} from "./deck-strategy-snapshot-validation";
import {
  buildDeckDoctrineV2Diagnostic,
  buildDeckStrategyProfile,
  type AiDeckStrategyProfile,
  type DeckDoctrineV2Diagnostic,
  type DeckDoctrineV2DiagnosticStatus,
  type DeckDoctrineV2RoleDiagnosticSummary,
} from "./deck-doctrine-strategy";

export type DeckDoctrineRuntimeContext = {
  strategyProfile: AiDeckStrategyProfile;
  v2Diagnostic: DeckDoctrineV2Diagnostic;
  neutralDoctrine: boolean;
  completenessStatus: DeckDoctrineV2DiagnosticStatus;
  rolesStatus: DeckDoctrineV2RoleDiagnosticSummary["status"];
};

export function buildDeckDoctrineRuntimeContext(params: {
  side: Side;
  deckSnapshot: AiDeckStrategyDeckSnapshot;
  expectedDeckSnapshot?: Omit<AiDeckSnapshotRuntimeExpectation, "side">;
}): DeckDoctrineRuntimeContext {
  const deckSnapshot = assertValidAiDeckSnapshotForRuntime(
    params.deckSnapshot,
    {
      side: params.side,
      ...params.expectedDeckSnapshot,
    },
  );
  const strategyProfile = buildDeckStrategyProfile(deckSnapshot);
  const v2Diagnostic = buildDeckDoctrineV2Diagnostic(deckSnapshot);

  return {
    strategyProfile,
    v2Diagnostic,
    neutralDoctrine: v2Diagnostic.neutralDoctrine,
    completenessStatus: v2Diagnostic.status,
    rolesStatus: v2Diagnostic.rolesStatus.status,
  };
}
