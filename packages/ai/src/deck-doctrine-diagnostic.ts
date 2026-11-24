import type { CardDefinitionId } from "@netgrid/shared";
import type { Side } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import {
  buildDeckStrategyProfile,
  strategyMatchesSide,
  type AiDeckStrategyProfile,
  type DeckStrategyConfidence,
  type DeckStrategyScore,
} from "./deck-doctrine-strategy";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";

export type DeckDoctrineV2DiagnosticStatus =
  | "anchorless"
  | "partial"
  | "complete"
  | "unknown_snapshot";

export type DeckDoctrineV2CardRoleDiagnosticStatus =
  | "anchorless"
  | "partial"
  | "complete";

export type DeckDoctrineV2CardRoleDiagnostic = {
  cardId: CardDefinitionId;
  quantity: number;
  status: DeckDoctrineV2CardRoleDiagnosticStatus;
  roles: string[];
  functionSignals: string[];
  strategyAnchors: string[];
  warnings: string[];
};

export type DeckDoctrineV2RoleDiagnosticSummary = {
  status: DeckDoctrineV2DiagnosticStatus;
  cardCount: number;
  cardRows: number;
  completeCards: number;
  partialCards: number;
  anchorlessCards: number;
  cardsWithoutRoles: number[];
  roleSignalCount: number;
  functionSignalCount: number;
  strategyAnchorCount: number;
};

export type DeckDoctrineV2StrategyDiagnostic = {
  strategyId: string;
  status: Exclude<DeckDoctrineV2DiagnosticStatus, "unknown_snapshot">;
  anchorScore: number;
  supportScore: number;
  finalScore: number;
  confidence: DeckStrategyConfidence;
  anchorEvidenceCount: number;
  supportEvidenceCount: number;
  supportGaps: string[];
};

export type DeckDoctrineV2Diagnostic = {
  schemaVersion: "deck-doctrine-v2-diagnostic-v1";
  scope: "diagnostic_only";
  productiveUseAllowed: false;
  deckSnapshotId: string;
  side: Side | "unknown";
  status: DeckDoctrineV2DiagnosticStatus;
  neutralDoctrine: boolean;
  strategyDiagnostics: DeckDoctrineV2StrategyDiagnostic[];
  rolesStatus: DeckDoctrineV2RoleDiagnosticSummary;
  cardRoles: DeckDoctrineV2CardRoleDiagnostic[];
  warnings: string[];
  source: {
    strategyProfile: "buildDeckStrategyProfile";
    mode: "report_only";
    plannerEffect: "none";
  };
  noEffectFlags: {
    actionSelection: false;
    plannerWeights: false;
    scoring: false;
    legalActionGeneration: false;
    engineMutation: false;
    hiddenInfoProjection: false;
  };
};

export function buildDeckDoctrineV2Diagnostic(
  snapshot?: AiDeckStrategyDeckSnapshot,
  currentProfile?: AiDeckStrategyProfile,
): DeckDoctrineV2Diagnostic {
  if (snapshot === undefined || snapshot.cards.length === 0) {
    return {
      schemaVersion: "deck-doctrine-v2-diagnostic-v1",
      scope: "diagnostic_only",
      productiveUseAllowed: false,
      deckSnapshotId: snapshot?.deckSnapshotId ?? "unknown_snapshot",
      side: snapshot?.side ?? "unknown",
      status: "unknown_snapshot",
      neutralDoctrine: true,
      strategyDiagnostics: [],
      rolesStatus: emptyRoleDiagnosticSummary("unknown_snapshot"),
      cardRoles: [],
      warnings: ["unknown_snapshot"],
      source: {
        strategyProfile: "buildDeckStrategyProfile",
        mode: "report_only",
        plannerEffect: "none",
      },
      noEffectFlags: deckDoctrineV2NoEffectFlags(),
    };
  }

  if (
    currentProfile &&
    (currentProfile.deckId !== snapshot.deckSnapshotId ||
      currentProfile.side !== snapshot.side)
  ) {
    throw new Error("deck_doctrine_diagnostic_profile_mismatch");
  }
  const strategyProfile = currentProfile ?? buildDeckStrategyProfile(snapshot);
  const cardRoles = deckDoctrineV2CardRoles(snapshot);
  const rolesStatus = summarizeDeckDoctrineV2Roles(
    strategyProfile.cardCount,
    cardRoles,
  );
  const strategyDiagnostics = Object.entries(strategyProfile.strategyScores)
    .map(([strategyId, score]) => ({
      strategyId,
      status: deckDoctrineV2StrategyStatus(score),
      anchorScore: score.anchorScore,
      supportScore: score.supportScore,
      finalScore: score.finalScore,
      confidence: score.confidence,
      anchorEvidenceCount: score.anchorEvidence.length,
      supportEvidenceCount: score.supportEvidence.length,
      supportGaps: [...score.supportGaps],
    }))
    .sort(
      (left, right) =>
        right.finalScore - left.finalScore ||
        left.strategyId.localeCompare(right.strategyId),
    );
  const status = deckDoctrineV2Status(strategyDiagnostics, rolesStatus);

  return {
    schemaVersion: "deck-doctrine-v2-diagnostic-v1",
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    deckSnapshotId: snapshot.deckSnapshotId,
    side: snapshot.side,
    status,
    neutralDoctrine: status === "anchorless",
    strategyDiagnostics,
    rolesStatus,
    cardRoles,
    warnings: sortedUnique([
      ...strategyProfile.warnings,
      ...(status === "anchorless"
        ? ["NeutralDoctrine: no strategy anchor"]
        : []),
    ]),
    source: {
      strategyProfile: "buildDeckStrategyProfile",
      mode: "report_only",
      plannerEffect: "none",
    },
    noEffectFlags: deckDoctrineV2NoEffectFlags(),
  };
}

function deckDoctrineV2CardRoles(
  snapshot: AiDeckStrategyDeckSnapshot,
): DeckDoctrineV2CardRoleDiagnostic[] {
  return snapshot.cards
    .slice()
    .sort((left, right) => (left.cardId - right.cardId))
    .filter((entry) => Math.max(0, entry.quantity) > 0)
    .map((entry) => {
      const hint = AI_HINTS_BY_CARD.get(entry.cardId);
      const roles = sortedUnique([
        ...(hint?.roles ?? []),
        ...(hint?.planRoles ?? []),
        ...(hint?.lineSupport ?? []),
        ...(hint?.strategicRole ?? []),
      ]);
      const functionSignals = sortedUnique(hint?.functionSignals ?? []);
      const strategyAnchors = sortedUnique([
        ...(hint?.strategyAnchors ?? []).filter((strategyId) =>
          strategyMatchesSide(strategyId, snapshot.side),
        ),
        ...(hint?.lineSupport ?? []).filter((strategyId) =>
          strategyMatchesSide(strategyId, snapshot.side),
        ),
      ]);
      const status =
        roles.length > 0 &&
        functionSignals.length > 0 &&
        strategyAnchors.length > 0
          ? "complete"
          : roles.length > 0 ||
              functionSignals.length > 0 ||
              strategyAnchors.length > 0
            ? "partial"
            : "anchorless";

      return {
        cardId: entry.cardId,
        quantity: Math.max(0, entry.quantity),
        status,
        roles,
        functionSignals,
        strategyAnchors,
        warnings: sortedUnique([
          ...(hint === undefined ? ["missing_card_hint"] : []),
        ]),
      };
    });
}

function summarizeDeckDoctrineV2Roles(
  cardCount: number,
  cardRoles: readonly DeckDoctrineV2CardRoleDiagnostic[],
): DeckDoctrineV2RoleDiagnosticSummary {
  if (cardRoles.length === 0)
    return emptyRoleDiagnosticSummary("unknown_snapshot");

  const completeCards = cardRoles.filter(
    (entry) => entry.status === "complete",
  ).length;
  const partialCards = cardRoles.filter(
    (entry) => entry.status === "partial",
  ).length;
  const anchorlessCards = cardRoles.filter(
    (entry) => entry.status === "anchorless",
  ).length;
  const cardsWithoutRoles = cardRoles
    .filter((entry) => entry.roles.length === 0)
    .map((entry) => entry.cardId);
  const strategyAnchorCount = cardRoles.reduce(
    (sum, entry) => sum + entry.strategyAnchors.length * entry.quantity,
    0,
  );
  const status =
    strategyAnchorCount === 0
      ? "anchorless"
      : anchorlessCards === 0 && partialCards === 0
        ? "complete"
        : "partial";

  return {
    status,
    cardCount,
    cardRows: cardRoles.length,
    completeCards,
    partialCards,
    anchorlessCards,
    cardsWithoutRoles,
    roleSignalCount: cardRoles.reduce(
      (sum, entry) => sum + entry.roles.length * entry.quantity,
      0,
    ),
    functionSignalCount: cardRoles.reduce(
      (sum, entry) => sum + entry.functionSignals.length * entry.quantity,
      0,
    ),
    strategyAnchorCount,
  };
}

function emptyRoleDiagnosticSummary(
  status: DeckDoctrineV2DiagnosticStatus,
): DeckDoctrineV2RoleDiagnosticSummary {
  return {
    status,
    cardCount: 0,
    cardRows: 0,
    completeCards: 0,
    partialCards: 0,
    anchorlessCards: 0,
    cardsWithoutRoles: [],
    roleSignalCount: 0,
    functionSignalCount: 0,
    strategyAnchorCount: 0,
  };
}

function deckDoctrineV2StrategyStatus(
  score: DeckStrategyScore,
): DeckDoctrineV2StrategyDiagnostic["status"] {
  if (score.anchorEvidence.length === 0 && score.anchorScore === 0) {
    return "anchorless";
  }
  if (
    score.supportGaps.length === 0 &&
    score.anchorEvidence.length > 0 &&
    score.finalScore >= 45
  ) {
    return "complete";
  }
  return "partial";
}

function deckDoctrineV2Status(
  strategyDiagnostics: readonly DeckDoctrineV2StrategyDiagnostic[],
  rolesStatus: DeckDoctrineV2RoleDiagnosticSummary,
): DeckDoctrineV2DiagnosticStatus {
  if (rolesStatus.status === "unknown_snapshot") return "unknown_snapshot";
  if (
    strategyDiagnostics.every((entry) => entry.status === "anchorless") ||
    rolesStatus.strategyAnchorCount === 0
  ) {
    return "anchorless";
  }
  if (
    rolesStatus.status === "complete" &&
    strategyDiagnostics.some((entry) => entry.status === "complete")
  ) {
    return "complete";
  }
  return "partial";
}

function deckDoctrineV2NoEffectFlags(): DeckDoctrineV2Diagnostic["noEffectFlags"] {
  return {
    actionSelection: false,
    plannerWeights: false,
    scoring: false,
    legalActionGeneration: false,
    engineMutation: false,
    hiddenInfoProjection: false,
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
