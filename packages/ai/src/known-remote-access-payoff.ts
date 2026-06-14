import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "./ai-hints";
import {
  reconstructBeliefState,
  type BeliefState,
  type KnownPositionMemory,
} from "./belief-state";
import {
  knownRemoteAgendaAccessCommitment,
  knownRemoteLowValueAccessCommitment,
  projectKnownRemoteTrashCommitment,
} from "./decision/known-remote-access-commitment";
import {
  createRemoteAccessOutcomeMemoryEntry,
  remoteAccessOutcomeEvidence,
} from "./memory/remote-access-outcome";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";

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
  visibleCard?: VisibleCard;
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
    const commitment = knownRemoteAgendaAccessCommitment(
      serverId,
      agendaRoots.map((root) => `known_remote_agenda_root:${root.positionKey}`),
    );
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
        ...commitment.evidence,
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
    const trashProjection = projectKnownRemoteTrashCommitment(input, {
      serverId,
      definitionId: cheapestTrashRoot.definitionId,
      rootType: cheapestTrashRoot.type,
      trashCost: cheapestTrashCost,
      creditsAfterPath,
      ...(cheapestTrashRoot.visibleCard
        ? { visibleCard: cheapestTrashRoot.visibleCard }
        : {}),
    });
    const declinedTrashOutcome = trashProjection.knownNoCurrentPayoff
      ? createRemoteAccessOutcomeMemoryEntry({
          serverId,
          knownRootDefinitionId: cheapestTrashRoot.definitionId,
          accessDecision: "declined_trash",
          reason: trashProjection.commitment.reason,
          stateVersion: input.playerView.stateVersion,
        })
      : undefined;
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
        ...trashProjection.commitment.evidence,
        ...(declinedTrashOutcome
          ? remoteAccessOutcomeEvidence(declinedTrashOutcome)
          : []),
        ...trashProjection.evidence,
        trashProjection.contestable
          ? "remote_trash_boosted_by_known_remote_trashable:true"
          : "remote_run_suppressed_by_known_low_value_remote:true",
        `remote_memory_payoff:${trashProjection.payoff}`,
      ],
    };
  }

  const lowValueCommitment = knownRemoteLowValueAccessCommitment(serverId);
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
      ...lowValueCommitment.evidence,
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
      visibleCard: card,
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
