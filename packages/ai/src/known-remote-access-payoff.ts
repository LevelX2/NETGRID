import { CARD_DEFINITIONS_BY_ID } from "./card-definition-compatibility";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
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
import { projectAccessDecision } from "./decision/access-decision-projection";
import { createProjectedAccessOutcome } from "./access/access-outcome-projection";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";
import { currentRunRemainingIce } from "./runtime/current-encounter";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "./runtime/public-event-history";

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
  | "defer_until_safe"
  | "unknown";

export type KnownRemoteAccessDeclineReason =
  | "insufficient_credits"
  | "reserve_would_break"
  | "unsafe_access_damage"
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
  observedAccessDamage?: ObservedRemoteAccessDamage;
};

type KnownRemoteRoot = {
  definitionId: string;
  positionKey: string;
  source: "player_view" | "position_memory";
  sourceEventId?: string;
  visibleCard?: VisibleCard;
};

export type ObservedRemoteAccessDamage = {
  amount: number;
  damageType: "net" | "meat" | "core";
  preventionRemaining: number;
  survivalCapacity: number;
  survivable: boolean;
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
  if (!server) return unknownRemotePayoff(serverId, ["remote_server:missing"]);
  if (server.root.length === 0) return emptyRemotePayoff(serverId);

  const knownRoots = knownRemoteRoots(input, serverId, beliefState);
  const remoteInvalidations = beliefState.invalidationLog
    .filter((entry) => invalidationEntryReferencesServer(entry, serverId))
    .slice(0, 3);
  if (knownRoots.length === 0) {
    const unknownRootCount = server.root.filter((card) => !card.known).length;
    if (unknownRootCount > 0) {
      const typeDeduction =
        beliefState.runnerOpponentModel?.remoteRootTypeDeductions?.find(
          (deduction) =>
            deduction.serverId === serverId &&
            deduction.unknownRootCount >= unknownRootCount &&
            !deduction.candidateTypes.includes("agenda"),
        );
      if (typeDeduction) {
        return {
          payoff: "unknown",
          accessDecision: "unknown",
          contestable: false,
          knownNoCurrentPayoff: false,
          score: 0,
          penalty: 0,
          reasons: ["remote_root_type_excludes_agenda"],
          evidence: [
            `remote_target:${serverId}`,
            "remote_memory_payoff:unknown",
            `known_remote_root_unknown_count:${unknownRootCount}`,
            "remote_root_type_candidates:upgrade",
            "remote_root_agenda_candidate:false",
            ...typeDeduction.basis,
          ],
        };
      }
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
    const observedStealCost =
      agendaRoots.find(
        (root) =>
          root.visibleCard?.effectiveStealCostQuote?.complete === true &&
          root.visibleCard.effectiveStealCostQuote.stateVersion ===
            input.playerView.stateVersion &&
          root.visibleCard.effectiveStealCostQuote.serverId === serverId,
      )?.visibleCard?.effectiveStealCostQuote?.creditCost ??
      observedRemoteAgendaStealCost(input, serverId, agendaRoots);
    const stealAffordable =
      observedStealCost === undefined || creditsAfterPath >= observedStealCost;
    const observedAccessDamage = observedRemoteAccessDamage(
      input,
      serverId,
      agendaRoots,
    );
    const accessSurvivable = observedAccessDamage?.survivable !== false;
    const contestable = stealAffordable && accessSurvivable;
    const commitment = knownRemoteAgendaAccessCommitment(
      serverId,
      agendaRoots.map((root) => `known_remote_agenda_root:${root.positionKey}`),
    );
    const accessProjection = projectAccessDecision({
      source: "pre_run",
      serverId,
      ...(agendaRoots[0]?.definitionId
        ? { knownRootDefinitionId: agendaRoots[0].definitionId }
        : {}),
      target: "agenda",
      intendedAccessAction: "steal",
    });
    return {
      payoff: "agenda",
      accessDecision: !accessSurvivable
        ? "defer_until_safe"
        : stealAffordable
          ? "steal"
          : "defer_until_funded",
      ...(!accessSurvivable
        ? { declineReason: "unsafe_access_damage" as const }
        : stealAffordable
          ? {}
          : { declineReason: "insufficient_credits" as const }),
      contestable,
      knownNoCurrentPayoff: false,
      score: contestable ? 420 : 0,
      penalty: contestable ? 0 : accessSurvivable ? 420 : 840,
      reasons: [
        !accessSurvivable
          ? "known_remote_access_damage_would_flatline"
          : stealAffordable
            ? "known_remote_agenda_pressure"
            : "known_remote_agenda_steal_unaffordable_after_ice",
      ],
      ...(observedAccessDamage ? { observedAccessDamage } : {}),
      evidence: [
        ...evidenceBase,
        "remote_memory_payoff:agenda",
        ...(observedStealCost !== undefined
          ? [
              `known_remote_agenda_steal_cost:${observedStealCost}`,
              `known_remote_agenda_credits_after_steal:${creditsAfterPath - observedStealCost}`,
              `known_remote_agenda_steal_affordable:${stealAffordable}`,
            ]
          : ["known_remote_agenda_steal_cost:unknown"]),
        ...(observedAccessDamage
          ? [
              `known_remote_access_damage_amount:${observedAccessDamage.amount}`,
              `known_remote_access_damage_type:${observedAccessDamage.damageType}`,
              `known_remote_access_damage_prevention_remaining:${observedAccessDamage.preventionRemaining}`,
              `known_remote_access_damage_survival_capacity:${observedAccessDamage.survivalCapacity}`,
              `known_remote_access_damage_survivable:${observedAccessDamage.survivable}`,
            ]
          : ["known_remote_access_damage_amount:unknown"]),
        !accessSurvivable
          ? "remote_run_deferred_for_known_access_damage:true"
          : stealAffordable
            ? "remote_run_boosted_by_known_remote_agenda:true"
            : "remote_run_deferred_for_known_agenda_steal_cost:true",
        ...commitment.evidence,
        ...accessProjection.evidence,
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
    const projectedAccessOutcome = trashProjection.knownNoCurrentPayoff
      ? createProjectedAccessOutcome({
          serverId,
          knownRootDefinitionId: cheapestTrashRoot.definitionId,
          projectedIntent: "decline",
          reason: trashProjection.commitment.reason,
          stateVersion: input.playerView.stateVersion,
        })
      : undefined;
    const intendedAccessAction =
      trashProjection.accessDecision === "trash" ? "trash" : "decline";
    const accessProjection = projectAccessDecision({
      source: "pre_run",
      serverId,
      knownRootDefinitionId: cheapestTrashRoot.definitionId,
      target:
        cheapestTrashRoot.type === "asset" ||
        cheapestTrashRoot.type === "upgrade"
          ? cheapestTrashRoot.type
          : "unknown",
      intendedAccessAction,
      ...(intendedAccessAction === "trash"
        ? {
            trashCost: cheapestTrashCost,
            generalTrashCost: trashProjection.generalTrashCost,
            dedicatedTrashCredits: Math.max(
              0,
              cheapestTrashCost - trashProjection.generalTrashCost,
            ),
          }
        : {}),
      reserveWouldBreak:
        trashProjection.declineReason === "reserve_would_break",
      finitePoolValueRemaining: trashProjection.finitePoolValueRemaining,
    });
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
      reasons: [...trashProjection.reasons],
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
        ...accessProjection.evidence,
        ...(projectedAccessOutcome ? projectedAccessOutcome.evidence : []),
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

function observedRemoteAgendaStealCost(
  input: AiDecisionInput,
  serverId: string,
  agendaRoots: readonly KnownRemoteRoot[],
): number | undefined {
  const agendaDefinitionIds = new Set(
    agendaRoots.map((root) => root.definitionId),
  );
  const history = mergedPublicHistory(input);
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    if (
      publicActionType(event) !== "decline_trash" ||
      publicActor(event) !== "runner" ||
      remoteEventServerId(event) !== serverId
    ) {
      continue;
    }
    const stealCost = numberPayloadValue(event, "stealCost");
    if (stealCost === undefined || stealCost <= 0) continue;
    for (let accessIndex = index - 1; accessIndex >= 0; accessIndex -= 1) {
      const accessEvent = history[accessIndex]!;
      if (publicActionType(accessEvent) === "start_run") break;
      if (
        publicActionType(accessEvent) !== "access_card" ||
        publicActor(accessEvent) !== "runner" ||
        remoteEventServerId(accessEvent) !== serverId
      ) {
        continue;
      }
      const accessedDefinitionId = stringPayloadValue(
        accessEvent,
        "cardDefinitionId",
      );
      if (
        accessedDefinitionId &&
        agendaDefinitionIds.has(accessedDefinitionId)
      ) {
        return stealCost;
      }
      break;
    }
  }
  return undefined;
}

function observedRemoteAccessDamage(
  input: AiDecisionInput,
  serverId: string,
  agendaRoots: readonly KnownRemoteRoot[],
): ObservedRemoteAccessDamage | undefined {
  const rootsBySourceEventId = new Map(
    agendaRoots
      .filter((root) => root.sourceEventId)
      .map((root) => [root.sourceEventId!, root] as const),
  );
  if (rootsBySourceEventId.size === 0) return undefined;
  const history = mergedPublicHistory(input);
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const root = rootsBySourceEventId.get(event.eventId);
    if (!root) continue;
    if (
      publicActionType(event) !== "access_card" ||
      publicActor(event) !== "runner" ||
      remoteEventServerId(event) !== serverId ||
      stringPayloadValue(event, "cardDefinitionId") !== root.definitionId ||
      stringPayloadValue(event, "accessedCardPositionKey") !==
        root.positionKey ||
      event.publicPayload.damageResolved !== true
    ) {
      continue;
    }
    const amount = numberPayloadValue(event, "damageAmount");
    const damageType = stringPayloadValue(event, "damageType");
    if (
      amount === undefined ||
      amount <= 0 ||
      (damageType !== "net" && damageType !== "meat" && damageType !== "core")
    ) {
      continue;
    }
    const preventionRemaining =
      damageType === "meat"
        ? 0
        : Math.max(
            0,
            input.playerView.own.freeNetOrCoreDamagePreventionRemaining ?? 0,
          );
    const survivalCapacity =
      input.playerView.own.gripOrHq.length + preventionRemaining;
    return {
      amount,
      damageType,
      preventionRemaining,
      survivalCapacity,
      survivable: amount <= survivalCapacity,
    };
  }
  return undefined;
}

function publicActionType(event: AiDecisionInput["eventTail"][number]): string {
  return stringPayloadValue(event, "actionType") ?? event.type;
}

function publicActor(
  event: AiDecisionInput["eventTail"][number],
): string | undefined {
  return stringPayloadValue(event, "actor");
}

function remoteEventServerId(
  event: AiDecisionInput["eventTail"][number],
): string | undefined {
  const direct = serverIdFromEvent(event);
  if (direct) return direct;
  const label = stringPayloadValue(event, "serverLabel")?.trim().toLowerCase();
  const match = /^remote[\s_-]+(\d+)$/.exec(label ?? "");
  return match?.[1] ? `remote_${Number.parseInt(match[1], 10)}` : undefined;
}

function stringPayloadValue(
  event: AiDecisionInput["eventTail"][number],
  key: string,
): string | undefined {
  const value = event.publicPayload[key];
  return typeof value === "string" ? value : undefined;
}

function numberPayloadValue(
  event: AiDecisionInput["eventTail"][number],
  key: string,
): number | undefined {
  const value = event.publicPayload[key];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : undefined;
}

function knownRemoteRoots(
  input: AiDecisionInput,
  serverId: string,
  beliefState: BeliefState,
): KnownRemoteRoot[] {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const memoryByPosition = new Map(
    knownRemoteRootMemory(beliefState, serverId).map((entry) => [
      entry.positionKey,
      entry,
    ]),
  );
  const byPosition = new Map<string, KnownRemoteRoot>();
  server?.root.forEach((card, index) => {
    if (!card.known || !card.definitionId) return;
    const positionKey = `root:${index}`;
    const memory = memoryByPosition.get(positionKey);
    byPosition.set(positionKey, {
      definitionId: card.definitionId,
      positionKey,
      source: "player_view",
      ...(memory?.definitionId === card.definitionId
        ? { sourceEventId: memory.sourceEventId }
        : {}),
      visibleCard: card,
    });
  });
  for (const entry of knownRemoteRootMemory(beliefState, serverId)) {
    if (byPosition.has(entry.positionKey)) continue;
    byPosition.set(entry.positionKey, {
      definitionId: entry.definitionId,
      positionKey: entry.positionKey,
      source: "position_memory",
      sourceEventId: entry.sourceEventId,
    });
  }
  return [...byPosition.values()].sort((left, right) =>
    left.positionKey.localeCompare(right.positionKey),
  );
}

function invalidationEntryReferencesServer(
  entry: string,
  serverId: string,
): boolean {
  return entry
    .toLowerCase()
    .split(/[.:-]+/)
    .some((segment) => segment === serverId);
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
  const ice =
    input.playerView.run?.attackedServerId === serverId
      ? currentRunRemainingIce(input)
      : server.ice;
  const assessment = assessKnownRezzedIcePath(
    ice,
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
    evidence: [
      `remote_target:${serverId}`,
      "remote_memory_payoff:unknown",
      ...extraEvidence,
    ],
  };
}

function emptyRemotePayoff(serverId: string): KnownRemoteAccessPayoff {
  return {
    payoff: "known_low_value",
    accessDecision: "decline",
    declineReason: "no_current_payoff",
    contestable: false,
    knownNoCurrentPayoff: true,
    score: 0,
    penalty: 420,
    reasons: ["remote_root_empty", "remote_known_no_current_payoff"],
    evidence: [
      `remote_target:${serverId}`,
      "remote_root_count:0",
      "remote_memory_payoff:known_low_value",
      "remote_run_suppressed_by_empty_remote:true",
    ],
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
    CARD_DEFINITIONS_BY_ID[definitionId]?.trashCost
  );
}

function cardDefinitionType(definitionId: string): string | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.type ??
    CARD_DEFINITIONS_BY_ID[definitionId]?.type
  );
}
