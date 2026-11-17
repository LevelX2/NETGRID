import type { CardDefinitionId } from "@netgrid/shared";
import type { VisibleCard } from "@netgrid/shared";
import { AI_HINTS_BY_CARD as AI_HINTS, type AiCardHint } from "./ai-hints";
import type {
  AiHintRemoteRole,
  AiHintStructuredEffect,
  KnownHintRemoteRoleKind,
} from "./hint-ontology";

export type StructuredRemoteRoleSafetyAssessment = {
  role?: AiHintRemoteRole;
  active: boolean;
  raisesSafety: boolean;
  blocksAgendaSteal: boolean;
  safetyBonus: number;
  evidence: string[];
};

export function getStructuredRemoteRoleForCard(
  cardId: CardDefinitionId | undefined,
): AiHintRemoteRole | undefined {
  if (!cardId) return undefined;
  return AI_HINTS.get(cardId)?.remoteRole;
}

export function classifyRemoteRoleFromOntology(
  cardIdOrHint: CardDefinitionId | AiCardHint | undefined,
): AiHintRemoteRole | undefined {
  const hint =
    typeof cardIdOrHint === "number"
      ? AI_HINTS.get(cardIdOrHint)
      : cardIdOrHint;
  return hint?.remoteRole;
}

export function remoteRoleIsScoringProtectionKind(
  kind: KnownHintRemoteRoleKind | undefined,
): boolean {
  return (
    kind === "scoring_protection" ||
    kind === "agenda_steal_tax" ||
    kind === "run_tax" ||
    kind === "tax_fort" ||
    kind === "ice_modifier"
  );
}

export function remoteRoleIsNonScoringProtectionKind(
  kind: KnownHintRemoteRoleKind | undefined,
): boolean {
  return (
    kind === "remote_capacity" ||
    kind === "score_acceleration" ||
    kind === "asset_economy" ||
    kind === "bait" ||
    kind === "ambush"
  );
}

export function structuredRemoteRoleSafetyAssessmentForCard(
  card: Pick<VisibleCard, "definitionId" | "rezzed" | "known">,
  context: {
    agendaContext: boolean;
    runnerCreditsAfterKnownPath?: number | undefined;
  },
): StructuredRemoteRoleSafetyAssessment {
  const role = getStructuredRemoteRoleForCard(card.definitionId);
  if (!role)
    return {
      active: false,
      raisesSafety: false,
      blocksAgendaSteal: false,
      safetyBonus: 0,
      evidence: [],
    };

  const active = card.known === true && card.rezzed === true;
  const roleTaxAmount = remoteRoleTaxAmount(card.definitionId);
  const blocksAgendaSteal =
    active &&
    context.agendaContext &&
    role.kind === "agenda_steal_tax" &&
    context.runnerCreditsAfterKnownPath !== undefined &&
    context.runnerCreditsAfterKnownPath < roleTaxAmount;
  const canRaiseSafety =
    active &&
    remoteRoleIsScoringProtectionKind(role.kind) &&
    (role.kind !== "agenda_steal_tax" || context.agendaContext);
  const safetyBonus = canRaiseSafety
    ? remoteRoleSafetyBonus(role.kind, role.threatLevel, blocksAgendaSteal)
    : 0;
  const raisesSafety = safetyBonus > 0;
  return {
    role,
    active,
    raisesSafety,
    blocksAgendaSteal,
    safetyBonus,
    evidence: [
      "corp_remote_role_profile_seen:true",
      `corp_remote_role_kind:${role.kind}`,
      ...(role.serverScope
        ? [`corp_remote_role_server_scope:${role.serverScope}`]
        : []),
      ...(active
        ? ["corp_remote_role_active:true"]
        : ["corp_remote_role_did_not_raise_safety_because_inactive:true"]),
      ...(raisesSafety ? ["corp_remote_role_used_for_safety:true"] : []),
      ...(raisesSafety ? [`corp_remote_role_safety_bonus:${safetyBonus}`] : []),
      ...(blocksAgendaSteal
        ? ["corp_remote_role_agenda_steal_tax_blocks_steal:true"]
        : []),
      ...(role.kind === "bait"
        ? ["corp_remote_role_prevented_bait_as_scoring_protection:true"]
        : []),
      ...(role.kind === "ambush"
        ? ["corp_remote_role_prevented_bait_as_scoring_protection:true"]
        : []),
      ...(role.kind === "asset_economy"
        ? ["corp_remote_role_prevented_asset_as_scoring_protection:true"]
        : []),
      ...(role.kind === "score_acceleration"
        ? [
            "corp_remote_role_prevented_score_acceleration_as_scoring_protection:true",
          ]
        : []),
    ],
  };
}

function remoteRoleSafetyBonus(
  kind: KnownHintRemoteRoleKind,
  threatLevel: AiHintRemoteRole["threatLevel"],
  blocksAgendaSteal: boolean,
): number {
  if (blocksAgendaSteal) return threatLevel === "high" ? 55 : 40;
  switch (kind) {
    case "scoring_protection":
      return threatLevel === "high" ? 42 : threatLevel === "medium" ? 30 : 20;
    case "agenda_steal_tax":
      return threatLevel === "high" ? 30 : 18;
    case "run_tax":
    case "tax_fort":
      return threatLevel === "high" ? 24 : 16;
    case "ice_modifier":
      return 12;
    default:
      return 0;
  }
}

function remoteRoleTaxAmount(cardId: CardDefinitionId | undefined): number {
  const hint = cardId ? AI_HINTS.get(cardId) : undefined;
  const taxAmounts = (hint?.effects ?? [])
    .filter(isRunTaxEffect)
    .map((effect) => effect.amount)
    .filter((amount): amount is number => Number.isFinite(amount));
  return Math.max(1, ...taxAmounts);
}

function isRunTaxEffect(effect: AiHintStructuredEffect): boolean {
  return effect.kind === "run_tax" || effect.kind === "remote_protection";
}
