import {
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import {
  quoteAccessReserve,
  type AccessReserveEconomyPosture,
} from "../access/access-reserve-adapter";
import type { AccessDecisionReason, AccessIntent } from "../access/access-decision-types";
import { projectRemoteRootValue } from "../access/remote-root-value-projection";
import { rolesMatch } from "../runtime/role-match";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type KnownRemoteAccessCommitment = {
  serverId: string;
  knownAccessState:
    | "known_payoff"
    | "known_no_current_payoff"
    | "unknown_payoff";
  intendedAccessAction: AccessIntent;
  reason: AccessDecisionReason;
  evidence: string[];
};

export type KnownRemoteTrashCommitmentProjection = {
  payoff: "trash_affordable" | "trash_unaffordable" | "known_low_value";
  accessDecision: "trash" | "defer_until_funded" | "decline";
  declineReason?: "insufficient_credits" | "reserve_would_break" | "low_value_target";
  contestable: boolean;
  knownNoCurrentPayoff: boolean;
  score: number;
  penalty: number;
  reasons: string[];
  evidence: string[];
  targetValue: number;
  generalTrashCost: number;
  desiredCreditReserve: number;
  creditsAfterTrash: number;
  finitePoolValueRemaining: number;
  technicallyAffordable: boolean;
  preservesReserve: boolean;
  reserveBreakAllowed: boolean;
  commitment: KnownRemoteAccessCommitment;
};

export function knownRemoteAgendaAccessCommitment(
  serverId: string,
  evidence: readonly string[] = [],
): KnownRemoteAccessCommitment {
  return {
    serverId,
    knownAccessState: "known_payoff",
    intendedAccessAction: "steal",
    reason: "agenda_payoff",
    evidence: [
      `known_remote_access_commitment_server:${serverId}`,
      "known_remote_access_commitment_state:known_payoff",
      "known_remote_access_commitment_intended_action:steal",
      "known_remote_access_commitment_reason:agenda_payoff",
      ...evidence,
    ],
  };
}

export function knownRemoteLowValueAccessCommitment(
  serverId: string,
  evidence: readonly string[] = [],
): KnownRemoteAccessCommitment {
  return {
    serverId,
    knownAccessState: "known_no_current_payoff",
    intendedAccessAction: "decline",
    reason: "low_value_target",
    evidence: [
      `known_remote_access_commitment_server:${serverId}`,
      "known_remote_access_commitment_state:known_no_current_payoff",
      "known_remote_access_commitment_intended_action:decline",
      "known_remote_access_commitment_reason:low_value_target",
      ...evidence,
    ],
  };
}

export function projectKnownRemoteTrashCommitment(
  input: AiDecisionInput,
  params: {
    serverId: string;
    definitionId: string;
    rootType: string;
    trashCost: number;
    creditsAfterPath: number;
    economyPosture?: AccessReserveEconomyPosture;
    visibleCard?: VisibleCard;
  },
): KnownRemoteTrashCommitmentProjection {
  const reserveQuote = quoteAccessReserve({
    input,
    fallbackReserve: knownRemoteTrashCreditReserve(input),
    ...(params.economyPosture
      ? { economyPosture: params.economyPosture }
      : {}),
  });
  const desiredCreditReserve = reserveQuote.desiredCreditReserve;
  const support = knownRemoteTrashCreditSupport(input, params.rootType);
  const generalTrashCost = support.freeTrash
    ? 0
    : Math.max(0, params.trashCost - support.dedicatedCredits);
  const creditsAfterTrash = params.creditsAfterPath - generalTrashCost;
  const technicallyAffordable = params.creditsAfterPath >= generalTrashCost;
  const targetProfile = knownRemoteTrashTargetProfile(
    params.definitionId,
    params.trashCost,
    params.visibleCard,
  );
  const preservesReserve =
    technicallyAffordable && creditsAfterTrash >= desiredCreditReserve;
  const baseEvidence = [
    ...support.evidence,
    ...targetProfile.evidence,
    ...reserveQuote.evidence,
  ];

  if (targetProfile.finitePoolDepleted) {
    const commitment = trashCommitment(params.serverId, {
      knownAccessState: "known_no_current_payoff",
      intendedAccessAction: "decline",
      reason: "finite_pool_depleted",
      evidence: baseEvidence,
    });
    return {
      payoff: "known_low_value",
      accessDecision: "decline",
      declineReason: "low_value_target",
      contestable: false,
      knownNoCurrentPayoff: true,
      score: 0,
      penalty: 520,
      reasons: [
        "known_remote_root_finite_pool_depleted",
        "known_remote_low_value",
        "remote_known_no_current_payoff",
      ],
      evidence: baseEvidence,
      targetValue: targetProfile.value,
      generalTrashCost,
      desiredCreditReserve,
      creditsAfterTrash,
      finitePoolValueRemaining: targetProfile.corpValueRemaining,
      technicallyAffordable,
      preservesReserve,
      reserveBreakAllowed: false,
      commitment,
    };
  }

  if (!technicallyAffordable) {
    const commitment = trashCommitment(params.serverId, {
      knownAccessState: "known_no_current_payoff",
      intendedAccessAction: "decline",
      reason: "insufficient_credits",
      evidence: baseEvidence,
    });
    return {
      payoff: "trash_unaffordable",
      accessDecision: "defer_until_funded",
      declineReason: "insufficient_credits",
      contestable: false,
      knownNoCurrentPayoff: true,
      score: 0,
      penalty: 780,
      reasons: [
        "known_remote_root_trash_unaffordable_after_ice",
        "known_remote_low_value",
        "remote_known_no_current_payoff",
        "remote_root_trash_unaffordable",
      ],
      evidence: baseEvidence,
      targetValue: targetProfile.value,
      generalTrashCost,
      desiredCreditReserve,
      creditsAfterTrash,
      finitePoolValueRemaining: targetProfile.corpValueRemaining,
      technicallyAffordable,
      preservesReserve,
      reserveBreakAllowed: targetProfile.reserveBreakAllowed,
      commitment,
    };
  }

  if (!preservesReserve && !targetProfile.reserveBreakAllowed) {
    const commitment = trashCommitment(params.serverId, {
      knownAccessState: "known_no_current_payoff",
      intendedAccessAction: "decline",
      reason: "reserve_would_break",
      evidence: baseEvidence,
    });
    return {
      payoff: "trash_unaffordable",
      accessDecision: "defer_until_funded",
      declineReason: "reserve_would_break",
      contestable: false,
      knownNoCurrentPayoff: true,
      score: 0,
      penalty: 720,
      reasons: [
        "known_remote_root_trash_declined_by_reserve",
        "known_remote_low_value",
        "remote_known_no_current_payoff",
        "remote_root_trash_reserve_would_break",
      ],
      evidence: baseEvidence,
      targetValue: targetProfile.value,
      generalTrashCost,
      desiredCreditReserve,
      creditsAfterTrash,
      finitePoolValueRemaining: targetProfile.corpValueRemaining,
      technicallyAffordable,
      preservesReserve,
      reserveBreakAllowed: targetProfile.reserveBreakAllowed,
      commitment,
    };
  }

  const commitment = trashCommitment(params.serverId, {
    knownAccessState: "known_payoff",
    intendedAccessAction: "trash",
    reason: "trash_affordable",
    evidence: baseEvidence,
  });
  return {
    payoff: "trash_affordable",
    accessDecision: "trash",
    contestable: true,
    knownNoCurrentPayoff: false,
    score: 150,
    penalty: 0,
    reasons: [
      "known_remote_trash_target",
      "known_remote_root_trash_affordable_after_ice",
      ...(!preservesReserve
        ? ["known_remote_trash_reserve_break_allowed_by_target_value"]
        : []),
    ],
    evidence: baseEvidence,
    targetValue: targetProfile.value,
    generalTrashCost,
    desiredCreditReserve,
    creditsAfterTrash,
    finitePoolValueRemaining: targetProfile.corpValueRemaining,
    technicallyAffordable,
    preservesReserve,
    reserveBreakAllowed: targetProfile.reserveBreakAllowed,
    commitment,
  };
}

function trashCommitment(
  serverId: string,
  params: Omit<KnownRemoteAccessCommitment, "serverId">,
): KnownRemoteAccessCommitment {
  return {
    serverId,
    knownAccessState: params.knownAccessState,
    intendedAccessAction: params.intendedAccessAction,
    reason: params.reason,
    evidence: [
      `known_remote_access_commitment_server:${serverId}`,
      `known_remote_access_commitment_state:${params.knownAccessState}`,
      `known_remote_access_commitment_intended_action:${params.intendedAccessAction}`,
      `known_remote_access_commitment_reason:${params.reason}`,
      ...params.evidence,
    ],
  };
}

function knownRemoteTrashCreditSupport(
  input: AiDecisionInput,
  rootType: string,
): { dedicatedCredits: number; freeTrash: boolean; evidence: string[] } {
  let dedicatedCredits = 0;
  let freeTrash = false;
  const sources: string[] = [];
  for (const card of input.playerView.own.rig ?? []) {
    if (!card.known || !card.definitionId) continue;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    const effects = (
      hint as
        | {
            effects?: Array<{
              amount?: number;
              kind?: string;
              resource?: string;
              target?: string;
            }>;
          }
        | undefined
    )?.effects ?? [];
    for (const effect of effects) {
      if (!trashSupportEffectMatchesRoot(effect.target, rootType)) continue;
      if (effect.target?.includes("free_trash")) {
        freeTrash = true;
        sources.push(card.definitionId);
        continue;
      }
      if (effect.kind === "trash_credit") {
        const amount = Math.max(0, Math.floor(effect.amount ?? 0));
        if (amount <= 0) continue;
        dedicatedCredits += amount;
        sources.push(card.definitionId);
      }
    }
  }
  return {
    dedicatedCredits,
    freeTrash,
    evidence: [
      `known_remote_root_trash_dedicated_credits:${dedicatedCredits}`,
      `known_remote_root_free_trash_support:${freeTrash}`,
      ...[...new Set(sources)]
        .slice(0, 4)
        .map((source) => `known_remote_root_trash_support_source:${source}`),
    ],
  };
}

function trashSupportEffectMatchesRoot(
  target: string | undefined,
  rootType: string,
): boolean {
  if (!target) return true;
  const normalized = target.toLowerCase();
  if (normalized === "trash_cost") {
    return true;
  }
  if (normalized === rootType) return true;
  return normalized === "node" && rootType === "asset";
}

function knownRemoteTrashTargetProfile(
  definitionId: string,
  trashCost: number,
  visibleCard: VisibleCard | undefined,
): {
  value: number;
  reserveBreakAllowed: boolean;
  finitePoolEconomy: boolean;
  finitePoolDepleted: boolean;
  corpValueRemaining: number;
  evidence: string[];
} {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const roles = [...(hint?.roles ?? []), ...(hint?.planRoles ?? [])];
  const values = Object.values(hint?.valueHints ?? {}).filter(
    (value): value is number => typeof value === "number",
  );
  const value = values.length > 0 ? Math.max(...values) : 0;
  const valueProjection = projectRemoteRootValue({
    definitionId,
    roles,
    ...(visibleCard ? { visibleCard } : {}),
    ...(hint?.effects ? { effects: hint.effects } : {}),
    ...(hint?.valueHints ? { valueHints: hint.valueHints } : {}),
  });
  const corpValueRemaining = valueProjection.finitePoolValueRemaining;
  const finitePoolEconomy = valueProjection.kind === "finite_economy_pool";
  const finitePoolDepleted = finitePoolEconomy && corpValueRemaining <= 0;
  const highRemainingFinitePool =
    finitePoolEconomy &&
    corpValueRemaining >= Math.max(trashCost + 2, 8) &&
    trashCost > 0;
  const highImpactRole = knownRemoteRootHasHighImpactRole(roles);
  const reserveBreakAllowed =
    highImpactRole &&
    value >= 2 &&
    !finitePoolDepleted &&
    (!finitePoolEconomy || highRemainingFinitePool);
  return {
    value,
    reserveBreakAllowed,
    finitePoolEconomy,
    finitePoolDepleted,
    corpValueRemaining,
    evidence: [
      `known_remote_root_value:${value}`,
      `known_remote_root_high_impact_role:${highImpactRole}`,
      `known_remote_root_finite_pool_economy:${finitePoolEconomy}`,
      `known_remote_root_finite_pool_depleted:${finitePoolDepleted}`,
      `known_remote_root_corp_value_remaining:${corpValueRemaining}`,
      `known_remote_root_high_remaining_finite_pool:${highRemainingFinitePool}`,
      ...valueProjection.evidence,
      ...roles.slice(0, 6).map((role) => `known_remote_root_role:${role}`),
    ],
  };
}

export function knownRemoteRootHasHighImpactRole(
  roles: readonly string[],
): boolean {
  return rolesMatch(roles, [
    "economy",
    "campaign",
    "scoring_protection",
    "agenda_protection",
    "remote_upgrade_tax",
    "access_tax",
    "run_tax",
    "tag_punish",
    "ambush",
  ]);
}

function knownRemoteTrashCreditReserve(input: AiDecisionInput): number {
  const phaseReserve = input.playerView.stateVersion <= 8 ? 4 : 5;
  const emergencyReserve = input.playerView.own.tags > 0 ? 3 : 0;
  return Math.max(
    2,
    phaseReserve,
    knownRemoteContestReserve(input),
    emergencyReserve,
  );
}

function knownRemoteContestReserve(input: AiDecisionInput): number {
  let visibleThreat = false;
  let urgentThreat = false;
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_") || server.root.length === 0) continue;
    if (
      server.root.some(
        (card) =>
          (card.advancementCounters ?? 0) > 0 ||
          (card.known && card.type === "agenda"),
      )
    ) {
      visibleThreat = true;
    }
    if (
      server.root.some(
        (card) =>
          (card.advancementCounters ?? 0) >= 2 ||
          (card.known && card.type === "agenda"),
      ) ||
      input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin - 2
    ) {
      urgentThreat = true;
    }
  }
  if (urgentThreat) return 8;
  if (visibleThreat) return 6;
  return 0;
}
