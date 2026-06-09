import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
} from "@netgrid/shared";
import { createAiHintsByCard, RUNTIME_CARDS } from "./ai-hints";
import {
  reconstructBeliefState,
  type BeliefState,
  type KnownPositionMemory,
} from "./belief-state";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type KnownRemoteAccessPayoffKind =
  | "agenda"
  | "trash_affordable"
  | "trash_unaffordable"
  | "known_low_value"
  | "unknown"
  | "changed";

export type KnownRemoteAccessDecision =
  | "steal"
  | "trash"
  | "decline"
  | "defer_until_funded"
  | "unknown";

export type KnownRemoteAccessDeclineReason =
  | "insufficient_credits"
  | "reserve_would_break"
  | "low_value_target"
  | "no_current_payoff"
  | "unknown";

export type KnownRemoteAccessPayoff = {
  payoff: KnownRemoteAccessPayoffKind;
  accessDecision: KnownRemoteAccessDecision;
  declineReason?: KnownRemoteAccessDeclineReason;
  contestable: boolean;
  knownNoCurrentPayoff: boolean;
  score: number;
  penalty: number;
  reasons: string[];
  evidence: string[];
};

type KnownRemoteRoot = {
  definitionId: string;
  positionKey: string;
  source: "player_view" | "position_memory";
};

export function evaluateKnownRemoteAccessPayoff(
  input: AiDecisionInput,
  serverId: string | undefined,
  beliefState: BeliefState = reconstructBeliefState(input),
): KnownRemoteAccessPayoff {
  if (!serverId?.startsWith("remote_")) return unknownRemotePayoff("none");
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.root.length === 0)
    return unknownRemotePayoff(serverId, ["remote_memory_payoff:no_root"]);

  const knownRoots = knownRemoteRoots(input, serverId, beliefState);
  const remoteInvalidations = beliefState.invalidationLog
    .filter((entry) => entry.includes(serverId))
    .slice(0, 3);
  if (knownRoots.length === 0) {
    const unknownRootCount = server.root.filter((card) => !card.known).length;
    if (unknownRootCount > 0) {
      return {
        payoff: "unknown",
        accessDecision: "unknown",
        contestable: true,
        knownNoCurrentPayoff: false,
        score: 0,
        penalty: 0,
        reasons: ["known_remote_root_affordability_deferred_for_unknown_root"],
        evidence: [
          `remote_target:${serverId}`,
          "remote_memory_payoff:unknown",
          `known_remote_root_unknown_count:${unknownRootCount}`,
        ],
      };
    }
    return remoteInvalidations.length > 0
      ? changedRemotePayoff(serverId, remoteInvalidations)
      : unknownRemotePayoff(serverId);
  }

  const rootCount = server.root.length;
  const knownPositions = new Set(knownRoots.map((root) => root.positionKey));
  const allRootsKnown = knownPositions.size >= rootCount;
  if (!allRootsKnown) {
    return unknownRemotePayoff(serverId, [
      `known_remote_cards:${knownRoots.length}`,
      `remote_memory_known_root_positions:${knownPositions.size}`,
      `remote_memory_root_count:${rootCount}`,
      "remote_memory_payoff:partial_unknown",
    ]);
  }

  const path = knownRemotePathCost(input, serverId);
  const creditsAfterPath = path.creditsAfterPath;
  const evidenceBase = [
    `known_remote_cards:${knownRoots.length}`,
    `remote_memory_payoff:known`,
    `remote_memory_root_count:${rootCount}`,
    `remote_memory_path_cost:${path.visibleBreakCost}`,
    `remote_memory_credits_after_path:${creditsAfterPath}`,
    ...knownRoots.map(
      (root) => `remote_memory_root_source:${root.positionKey}:${root.source}`,
    ),
    ...visibleNoProgressRunContext(server.ice),
    ...remoteInvalidations.map((entry) => `remote_memory_invalidated:${entry}`),
  ];

  const agendaRoots = knownRoots.filter(
    (root) => cardDefinitionType(root.definitionId) === "agenda",
  );
  if (agendaRoots.length > 0) {
    return {
      payoff: "agenda",
      accessDecision: "steal",
      contestable: true,
      knownNoCurrentPayoff: false,
      score: 420,
      penalty: 0,
      reasons: ["known_remote_agenda_pressure"],
      evidence: [
        ...evidenceBase,
        "remote_memory_payoff:agenda",
        "remote_run_boosted_by_known_remote_agenda:true",
      ],
    };
  }

  const trashableRoots = knownRoots
    .map((root) => ({
      ...root,
      trashCost: cardDefinitionTrashCost(root.definitionId),
      type: cardDefinitionType(root.definitionId),
    }))
    .filter(
      (root): root is KnownRemoteRoot & { trashCost: number; type: string } =>
        (root.type === "asset" || root.type === "upgrade") &&
        root.trashCost !== undefined,
    );
  if (trashableRoots.length > 0) {
    const cheapestTrashRoot = trashableRoots.sort(
      (left, right) =>
        left.trashCost - right.trashCost ||
        left.positionKey.localeCompare(right.positionKey),
    )[0]!;
    const cheapestTrashCost = cheapestTrashRoot.trashCost;
    const trashProjection = projectKnownRemoteTrashCommitment(
      input,
      cheapestTrashRoot.definitionId,
      cheapestTrashRoot.type,
      cheapestTrashCost,
      creditsAfterPath,
    );
    return {
      payoff: trashProjection.payoff,
      accessDecision: trashProjection.accessDecision,
      ...(trashProjection.declineReason
        ? { declineReason: trashProjection.declineReason }
        : {}),
      contestable: trashProjection.contestable,
      knownNoCurrentPayoff: trashProjection.knownNoCurrentPayoff,
      score: trashProjection.score,
      penalty: trashProjection.penalty,
      reasons: [
        ...trashProjection.reasons,
      ],
      evidence: [
        ...evidenceBase,
        `known_remote_root_trash_cost:${cheapestTrashCost}`,
        `known_remote_root_type:${cheapestTrashRoot.type}`,
        `known_remote_root_trash_target_value:${trashProjection.targetValue}`,
        `known_remote_root_general_trash_cost:${trashProjection.generalTrashCost}`,
        `known_remote_root_visible_break_cost:${path.visibleBreakCost}`,
        `known_remote_root_credits_after_ice:${creditsAfterPath}`,
        `known_remote_root_credits_after_trash:${trashProjection.creditsAfterTrash}`,
        `known_remote_root_desired_credit_reserve:${trashProjection.desiredCreditReserve}`,
        `known_remote_root_trash_affordable:${trashProjection.technicallyAffordable}`,
        `known_remote_root_trash_preserves_reserve:${trashProjection.preservesReserve}`,
        `known_remote_root_trash_reserve_break_allowed:${trashProjection.reserveBreakAllowed}`,
        `pre_run_access_decision:${trashProjection.accessDecision}`,
        ...(trashProjection.declineReason
          ? [`trash_decline_reason:${trashProjection.declineReason}`]
          : []),
        ...trashProjection.evidence,
        trashProjection.contestable
          ? "remote_trash_boosted_by_known_remote_trashable:true"
          : "remote_run_suppressed_by_known_low_value_remote:true",
        `remote_memory_payoff:${trashProjection.payoff}`,
      ],
    };
  }

  return {
    payoff: "known_low_value",
    accessDecision: "decline",
    declineReason: "low_value_target",
    contestable: false,
    knownNoCurrentPayoff: true,
    score: 0,
    penalty: 420,
    reasons: ["known_remote_low_value", "remote_known_no_current_payoff"],
    evidence: [
      ...evidenceBase,
      "pre_run_access_decision:decline",
      "trash_decline_reason:low_value_target",
      "remote_run_suppressed_by_known_low_value_remote:true",
      "remote_memory_payoff:known_low_value",
    ],
  };
}

function knownRemoteRoots(
  input: AiDecisionInput,
  serverId: string,
  beliefState: BeliefState,
): KnownRemoteRoot[] {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const byPosition = new Map<string, KnownRemoteRoot>();
  server?.root.forEach((card, index) => {
    if (!card.known || !card.definitionId) return;
    const positionKey = `root:${index}`;
    byPosition.set(positionKey, {
      definitionId: card.definitionId,
      positionKey,
      source: "player_view",
    });
  });
  for (const entry of knownRemoteRootMemory(beliefState, serverId)) {
    if (byPosition.has(entry.positionKey)) continue;
    byPosition.set(entry.positionKey, {
      definitionId: entry.definitionId,
      positionKey: entry.positionKey,
      source: "position_memory",
    });
  }
  return [...byPosition.values()].sort((left, right) =>
    left.positionKey.localeCompare(right.positionKey),
  );
}

function knownRemoteRootMemory(
  beliefState: BeliefState,
  serverId: string,
): KnownPositionMemory[] {
  return (
    beliefState.runnerOpponentModel?.knownPositionMemory.filter(
      (entry) =>
        entry.zone === serverId &&
        entry.positionKey.startsWith("root:") &&
        entry.definitionId,
    ) ?? []
  );
}

function knownRemotePathCost(
  input: AiDecisionInput,
  serverId: string,
): { visibleBreakCost: number; creditsAfterPath: number } {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) {
    return {
      visibleBreakCost: 0,
      creditsAfterPath: input.playerView.own.credits,
    };
  }
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    input.playerView.own.rig ?? [],
    input.playerView.own.credits,
    server.root,
  );
  const visibleBreakCost = assessment.visibleBreakCost ?? 0;
  return {
    visibleBreakCost,
    creditsAfterPath: assessment.creditsAfterPath,
  };
}

function projectKnownRemoteTrashCommitment(
  input: AiDecisionInput,
  definitionId: string,
  rootType: string,
  trashCost: number,
  creditsAfterPath: number,
): {
  payoff: KnownRemoteAccessPayoffKind;
  accessDecision: KnownRemoteAccessDecision;
  declineReason?: KnownRemoteAccessDeclineReason;
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
  technicallyAffordable: boolean;
  preservesReserve: boolean;
  reserveBreakAllowed: boolean;
} {
  const desiredCreditReserve = knownRemoteTrashCreditReserve(input);
  const support = knownRemoteTrashCreditSupport(input, rootType);
  const generalTrashCost = support.freeTrash
    ? 0
    : Math.max(0, trashCost - support.dedicatedCredits);
  const creditsAfterTrash = creditsAfterPath - generalTrashCost;
  const technicallyAffordable = creditsAfterPath >= generalTrashCost;
  const targetProfile = knownRemoteTrashTargetProfile(definitionId);
  const preservesReserve = technicallyAffordable &&
    creditsAfterTrash >= desiredCreditReserve;
  if (!technicallyAffordable) {
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
      evidence: [...targetProfile.evidence, ...support.evidence],
      targetValue: targetProfile.value,
      generalTrashCost,
      desiredCreditReserve,
      creditsAfterTrash,
      technicallyAffordable,
      preservesReserve,
      reserveBreakAllowed: targetProfile.reserveBreakAllowed,
    };
  }
  if (!preservesReserve && !targetProfile.reserveBreakAllowed) {
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
      evidence: [...targetProfile.evidence, ...support.evidence],
      targetValue: targetProfile.value,
      generalTrashCost,
      desiredCreditReserve,
      creditsAfterTrash,
      technicallyAffordable,
      preservesReserve,
      reserveBreakAllowed: targetProfile.reserveBreakAllowed,
    };
  }
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
    evidence: [...targetProfile.evidence, ...support.evidence],
    targetValue: targetProfile.value,
    generalTrashCost,
    desiredCreditReserve,
    creditsAfterTrash,
    technicallyAffordable,
    preservesReserve,
    reserveBreakAllowed: targetProfile.reserveBreakAllowed,
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

function knownRemoteTrashTargetProfile(definitionId: string): {
  value: number;
  reserveBreakAllowed: boolean;
  evidence: string[];
} {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const roles = [...(hint?.roles ?? []), ...(hint?.planRoles ?? [])];
  const values = Object.values(hint?.valueHints ?? {}).filter(
    (value): value is number => typeof value === "number",
  );
  const value = values.length > 0 ? Math.max(...values) : 0;
  const highImpactRole = roles.some((role) =>
    [
      "economy",
      "campaign",
      "scoring_protection",
      "agenda_protection",
      "remote_upgrade_tax",
      "access_tax",
      "run_tax",
      "tag_punish",
      "ambush",
    ].some((token) => role.includes(token)),
  );
  const reserveBreakAllowed = highImpactRole && value >= 2;
  return {
    value,
    reserveBreakAllowed,
    evidence: [
      `known_remote_root_value:${value}`,
      `known_remote_root_high_impact_role:${highImpactRole}`,
      ...roles.slice(0, 6).map((role) => `known_remote_root_role:${role}`),
    ],
  };
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
        (card) => (card.advancementCounters ?? 0) > 0 ||
          (card.known && card.type === "agenda"),
      )
    ) {
      visibleThreat = true;
    }
    if (
      server.root.some(
        (card) => (card.advancementCounters ?? 0) >= 2 ||
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

function visibleNoProgressRunContext(
  ice: AiDecisionInput["playerView"]["servers"][number]["ice"],
): string[] {
  const visibleRandomIceCount = ice.filter(
    (card) =>
      card.known &&
      card.rezzed === true &&
      card.subtypes?.some((subtype) => subtype.toLowerCase() === "random"),
  ).length;
  if (visibleRandomIceCount === 0) return [];
  return [
    "known_remote_run_no_progress_context:visible_random_ice",
    `known_remote_visible_random_ice_count:${visibleRandomIceCount}`,
  ];
}

function unknownRemotePayoff(
  serverId: string,
  extraEvidence: string[] = [],
): KnownRemoteAccessPayoff {
  return {
    payoff: "unknown",
    accessDecision: "unknown",
    contestable: true,
    knownNoCurrentPayoff: false,
    score: 0,
    penalty: 0,
    reasons: [],
    evidence: [`remote_target:${serverId}`, "remote_memory_payoff:unknown", ...extraEvidence],
  };
}

function changedRemotePayoff(
  serverId: string,
  invalidations: string[],
): KnownRemoteAccessPayoff {
  return {
    payoff: "changed",
    accessDecision: "unknown",
    contestable: true,
    knownNoCurrentPayoff: false,
    score: 0,
    penalty: 0,
    reasons: ["remote_memory_invalidated"],
    evidence: [
      `remote_target:${serverId}`,
      "remote_memory_payoff:changed",
      ...invalidations.map((entry) => `remote_memory_invalidated:${entry}`),
    ],
  };
}

function cardDefinitionTrashCost(definitionId: string): number | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.trashCost ??
    DEMO_CARDS_BY_ID[definitionId]?.trashCost
  );
}

function cardDefinitionType(definitionId: string): string | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.type ?? DEMO_CARDS_BY_ID[definitionId]?.type
  );
}
