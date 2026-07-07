import type { Side } from "@netgrid/shared";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import {
  buildDeckDoctrineV2Diagnostic,
  buildDeckStrategyProfile,
  buildNeutralDeckStrategyProfile,
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
  deckSnapshot?: AiDeckStrategyDeckSnapshot;
  neutralDeckId: string;
}): DeckDoctrineRuntimeContext {
  const strategyProfile = params.deckSnapshot
    ? buildDeckStrategyProfile(params.deckSnapshot)
    : buildNeutralDeckStrategyProfile(params.side, params.neutralDeckId);
  const v2Diagnostic = buildDeckDoctrineV2Diagnostic(params.deckSnapshot);

  return {
    strategyProfile,
    v2Diagnostic,
    neutralDoctrine: v2Diagnostic.neutralDoctrine,
    completenessStatus: v2Diagnostic.status,
    rolesStatus: v2Diagnostic.rolesStatus.status,
  };
}
