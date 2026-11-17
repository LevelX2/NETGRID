import type { Side } from "@netgrid/shared";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import {
  assertValidAiDeckSnapshotForRuntime,
  type AiDeckSnapshotRuntimeExpectation,
} from "./deck-strategy-snapshot-validation";
import {
  buildDeckDoctrineV2Diagnostic,
  type DeckDoctrineV2Diagnostic,
  type DeckDoctrineV2DiagnosticStatus,
  type DeckDoctrineV2RoleDiagnosticSummary,
} from "./deck-doctrine-diagnostic";
import {
  buildDeckStrategyProfile,
  type AiDeckStrategyProfile,
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
      ...params.expectedDeckSnapshot,
      side: params.side,
    },
  );
  const strategyProfile = buildDeckStrategyProfile(deckSnapshot);
  const v2Diagnostic = buildDeckDoctrineV2Diagnostic(
    deckSnapshot,
    strategyProfile,
  );

  return {
    strategyProfile,
    v2Diagnostic,
    neutralDoctrine: v2Diagnostic.neutralDoctrine,
    completenessStatus: v2Diagnostic.status,
    rolesStatus: v2Diagnostic.rolesStatus.status,
  };
}
