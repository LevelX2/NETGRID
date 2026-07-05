import type { AiDeckDoctrineProfile, Side } from "@netgrid/shared";
import {
  buildDeckDoctrineProfile,
  type AiDeckDoctrineDeckSnapshot,
} from "./deck-doctrine";
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
  v1Profile?: AiDeckDoctrineProfile;
  neutralDoctrine: boolean;
  completenessStatus: DeckDoctrineV2DiagnosticStatus;
  rolesStatus: DeckDoctrineV2RoleDiagnosticSummary["status"];
};

export function buildDeckDoctrineRuntimeContext(params: {
  side: Side;
  deckSnapshot?: AiDeckDoctrineDeckSnapshot;
  v1Profile?: AiDeckDoctrineProfile;
  neutralDeckId: string;
}): DeckDoctrineRuntimeContext {
  const strategyProfile = params.deckSnapshot
    ? buildDeckStrategyProfile(params.deckSnapshot)
    : buildNeutralDeckStrategyProfile(params.side, params.neutralDeckId);
  const v2Diagnostic = buildDeckDoctrineV2Diagnostic(params.deckSnapshot);
  const v1Profile =
    params.v1Profile ??
    (params.deckSnapshot
      ? buildDeckDoctrineProfile(params.deckSnapshot)
      : undefined);

  return {
    strategyProfile,
    v2Diagnostic,
    ...(v1Profile ? { v1Profile } : {}),
    neutralDoctrine: v2Diagnostic.neutralDoctrine,
    completenessStatus: v2Diagnostic.status,
    rolesStatus: v2Diagnostic.rolesStatus.status,
  };
}
