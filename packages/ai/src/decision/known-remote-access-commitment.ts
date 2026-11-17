import { isRemoteServerId } from "@netgrid/shared";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import {
  quoteAccessReserve,
  type AccessReserveEconomyPosture,
} from "../access/access-reserve-adapter";
import type {
  AccessDecisionReason,
  AccessIntent,
} from "../access/access-decision-types";
import { projectRemoteRootValue } from "../access/remote-root-value-projection";
import { rolesMatch } from "../role-match";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { assessRunnerAccessTrashImpactFromPlanningCard } from "../access/runner-access-trash-impact";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

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
  declineReason?:
    | "insufficient_credits"
    | "reserve_would_break"
    | "low_value_target";
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
    definitionId: number;
    rootType: string;
    trashCost: number;
    creditsAfterPath: number;
    economyPosture?: AccessReserveEconomyPosture;
    visibleCard?: VisibleCard;
  },
): KnownRemoteTrashCommitmentProjection {
  const reserveQuote = quoteAccessReserve({
    input,
    remotePhaseReserve: () => knownRemoteTrashCreditReserve(input),
    ...(params.economyPosture ? { economyPosture: params.economyPosture } : {}),
  });
  const desiredCreditReserve = reserveQuote.desiredCreditReserve;
  const support = knownRemoteTrashCreditSupport(input, params.rootType);
  const generalTrashCost = Math.max(
    0,
    params.trashCost - support.dedicatedCredits,
  );
  const creditsAfterTrash = params.creditsAfterPath - generalTrashCost;
  const technicallyAffordable = params.creditsAfterPath >= generalTrashCost;
  const targetProfile = knownRemoteTrashTargetProfile(
    params.definitionId,
    params.visibleCard,
  );
  const preservesReserve =
    technicallyAffordable && creditsAfterTrash >= desiredCreditReserve;
  const planningCard = cardSpecPlanningCardByDefinitionId(params.definitionId);
  if (!planningCard) {
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Supply canonical trash-impact facts for observed card ${params.definitionId} in ${params.serverId}.`,
    });
  }
  const impact = assessRunnerAccessTrashImpactFromPlanningCard({
    planningCard,
    accessed: {
      known: true,
      definitionId: params.definitionId,
      ...(params.visibleCard?.rezzed !== undefined
        ? { rezzed: params.visibleCard.rezzed }
        : {}),
      ...(params.visibleCard?.advancementCounters !== undefined
        ? { advancementCounters: params.visibleCard.advancementCounters }
        : {}),
      ...(params.visibleCard?.counters
        ? { counters: params.visibleCard.counters }
        : {}),
    },
    trashCost: params.trashCost,
    dedicatedTrashCredits: params.trashCost - generalTrashCost,
    runnerCredits: params.creditsAfterPath,
    economyReserve: desiredCreditReserve,
  });
  if (!impact) {
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Bind the observed Corp trash target ${params.definitionId} to its canonical planning card.`,
    });
  }
  const baseEvidence = [
    ...support.evidence,
    ...targetProfile.evidence,
    ...reserveQuote.evidence,
    ...impact.evidenceCodes,
  ];

  const assessedCost = {
    targetValue: targetProfile.value,
    generalTrashCost,
    desiredCreditReserve,
    creditsAfterTrash,
    finitePoolValueRemaining: targetProfile.corpValueRemaining,
    technicallyAffordable,
    preservesReserve,
  };

  if (
    technicallyAffordable &&
    impact.recommendation === "decline" &&
    impact.margin + impact.liquidityPenalty <= 0
  ) {
    const commitment = trashCommitment(params.serverId, {
      knownAccessState: "known_no_current_payoff",
      intendedAccessAction: "decline",
      reason: targetProfile.finitePoolDepleted
        ? "finite_pool_depleted"
        : "low_value_target",
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
        ...(targetProfile.finitePoolDepleted
          ? ["known_remote_root_finite_pool_depleted"]
          : ["known_remote_root_visible_impact_below_cost"]),
        "known_remote_low_value",
        "remote_known_no_current_payoff",
      ],
      evidence: baseEvidence,
      ...assessedCost,
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
      ...assessedCost,
      reserveBreakAllowed: false,
      commitment,
    };
  }

  if (impact.recommendation === "decline") {
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
      ...assessedCost,
      reserveBreakAllowed: false,
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
    ...assessedCost,
    reserveBreakAllowed: !preservesReserve,
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
): { dedicatedCredits: number; evidence: string[] } {
  const use =
    rootType === "asset"
      ? "trash_nodes"
      : rootType === "upgrade"
        ? "trash_upgrades"
        : undefined;
  let dedicatedCredits = 0;
  const sources = new Set<number>();
  if (use) {
    for (const card of input.playerView.own.rig ?? []) {
      if (!card.known || !card.definitionId) continue;
      const pool = card.counterDisplays?.find(
        (display) =>
          display.creditPool?.kind === "restricted_credit" &&
          display.creditPool.uses?.includes(use),
      );
      if (!pool || !Number.isSafeInteger(pool.amount) || pool.amount <= 0)
        continue;
      dedicatedCredits += pool.amount;
      sources.add(card.definitionId);
    }
  }
  return {
    dedicatedCredits,
    evidence: [
      `known_remote_root_trash_dedicated_credits:${dedicatedCredits}`,
      ...[...sources]
        .slice(0, 4)
        .map((source) => `known_remote_root_trash_support_source:${source}`),
    ],
  };
}

function knownRemoteTrashTargetProfile(
  definitionId: number,
  visibleCard: VisibleCard | undefined,
): {
  value: number;
  finitePoolDepleted: boolean;
  corpValueRemaining: number;
  evidence: string[];
} {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const roles = [...(hint?.roles ?? []), ...(hint?.planRoles ?? [])];
  if (hint?.remoteRole?.kind) roles.push(hint.remoteRole.kind);
  const valueProjection = projectRemoteRootValue({
    definitionId,
    roles,
    ...(visibleCard ? { visibleCard } : {}),
    ...(hint?.effects ? { effects: hint.effects } : {}),
    ...(hint?.functionSignals ? { functionSignals: hint.functionSignals } : {}),
    ...(hint?.lineSupport ? { lineSupport: hint.lineSupport } : {}),
    ...(hint?.strategicRole ? { strategicRoles: hint.strategicRole } : {}),
    ...(hint?.valueHints ? { valueHints: hint.valueHints } : {}),
  });
  const value = valueProjection.valueScore;
  const corpValueRemaining = valueProjection.finitePoolValueRemaining;
  const finitePoolEconomy = valueProjection.kind === "finite_economy_pool";
  const finitePoolDepleted = finitePoolEconomy && corpValueRemaining <= 0;
  const highImpactRole = knownRemoteRootHasHighImpactRole(roles);
  return {
    value,
    finitePoolDepleted,
    corpValueRemaining,
    evidence: [
      `known_remote_root_value:${value}`,
      `known_remote_root_high_impact_role:${highImpactRole}`,
      `known_remote_root_finite_pool_economy:${finitePoolEconomy}`,
      `known_remote_root_finite_pool_depleted:${finitePoolDepleted}`,
      `known_remote_root_corp_value_remaining:${corpValueRemaining}`,
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
    "score_acceleration",
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
  return Math.max(phaseReserve, knownRemoteContestReserve(input));
}

function knownRemoteContestReserve(input: AiDecisionInput): number {
  let visibleThreat = false;
  let urgentThreat = false;
  for (const server of input.playerView.servers) {
    if (!isRemoteServerId(server.id) || server.root.length === 0) continue;
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
