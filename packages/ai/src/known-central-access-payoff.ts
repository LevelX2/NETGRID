import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
} from "@netgrid/shared";
import { RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";
import {
  reconstructBeliefState,
  type BeliefState,
} from "./belief-state";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";

export type KnownCentralAccessPayoffKind =
  | "agenda"
  | "trash_affordable"
  | "trash_unaffordable"
  | "known_low_value"
  | "unknown"
  | "fresh"
  | "access_bonus";

export type KnownCentralAccessPayoff = {
  payoff: KnownCentralAccessPayoffKind;
  knownNoCurrentPayoff: boolean;
  score: number;
  penalty: number;
  reasons: string[];
  evidence: string[];
};

export type HqKnownnessAssessment = {
  handCount: number;
  safeKnownCount: number;
  candidateKnownCount: number;
  unknownRestCount: number;
  knownFraction: number;
  unknownFraction: number;
  knownAgendaCount: number;
  knownTrashPayoffCount: number;
  knownLowValueCount: number;
  candidatePossibleAgendaCount: number;
  candidatePossibleTrashPayoffCount: number;
  candidateLowValueCount: number;
  accessDepthEstimate: number;
  unknownAccessChanceEstimate: number;
  knownnessPenalty: number;
  knownnessPayoff:
    | "known_agenda"
    | "known_trash_affordable"
    | "mostly_known_low_value"
    | "partially_known_low_value"
    | "candidate_possible_payoff"
    | "meaningful_unknown_rest"
    | "unknown";
};

const AI_HINTS_BY_CARD = createAiHintsByCard();
const HQ_DRAW_DEPARTURE_INVALIDATION_REASONS = [
  "corp_draw_added_unknown_hq_card",
  "corp_installed_hidden_hq_card",
  "corp_played_unknown_hq_card",
] as const;
const HQ_REORDER_INVALIDATION_REASONS = [
  "shuffle_changed_hq_hand",
  "arrange_changed_hq_hand",
  "swap_changed_hq_hand",
] as const;

export function evaluateKnownCentralAccessPayoff(
  input: AiDecisionInput,
  serverId: string | undefined,
  beliefState: BeliefState = reconstructBeliefState(input),
): KnownCentralAccessPayoff {
  if (serverId === "hq") return evaluateKnownHqAccessPayoff(input, beliefState);
  if (serverId !== "rd") return unknownCentralPayoff(serverId ?? "none");
  const freshness = beliefState.runnerOpponentModel?.rndTopFreshness;
  if (!freshness || freshness.freshness === "invalidated")
    return unknownCentralPayoff("rd", ["central_memory_payoff:invalidated"]);
  if (freshness.freshness === "fresh_after_top_removed") {
    return {
      payoff: "fresh",
      knownNoCurrentPayoff: false,
      score: 160,
      penalty: 0,
      reasons: ["rnd_top_fresh_after_access_removed"],
      evidence: [
        "central_target:rd",
        "central_memory_payoff:fresh",
        `rnd_freshness:${freshness.freshness}`,
      ],
    };
  }
  const definitionId = freshness.knownTopDefinitionId;
  if (freshness.freshness !== "stale_known_same_top" || !definitionId) {
    return unknownCentralPayoff("rd", [
      `rnd_freshness:${freshness.freshness}`,
      `rnd_known_top_definition:${definitionId ?? "unknown"}`,
    ]);
  }

  const type = cardDefinitionType(definitionId);
  const path = knownCentralPathCost(input, "rd");
  const evidenceBase = [
    "central_target:rd",
    "central_memory_payoff:known",
    `rnd_freshness:${freshness.freshness}`,
    `rnd_known_top_definition:${definitionId}`,
    `rnd_known_top_type:${type ?? "unknown"}`,
    `rnd_known_top_visible_break_cost:${path.visibleBreakCost}`,
    `rnd_known_top_credits_after_path:${path.creditsAfterPath}`,
    `rnd_freshened_by_runner_access:${freshness.freshenedByRunnerAccess === true}`,
    `rnd_known_sequence_count:${freshness.knownSequenceDefinitionIds?.length ?? 0}`,
  ];

  if (type === "agenda" || freshness.knownTopIsAgenda === true) {
    return {
      payoff: "agenda",
      knownNoCurrentPayoff: false,
      score: 520,
      penalty: 0,
      reasons: ["known_rnd_top_agenda_pressure"],
      evidence: [
        ...evidenceBase,
        "central_memory_payoff:agenda",
        "rd_run_boosted_by_known_top_agenda:true",
      ],
    };
  }

  if (hasInstalledRdAccessBonus(input)) {
    return {
      payoff: "access_bonus",
      knownNoCurrentPayoff: false,
      score: 120,
      penalty: 0,
      reasons: ["known_rnd_top_repeat_has_access_bonus"],
      evidence: [
        ...evidenceBase,
        "central_memory_payoff:access_bonus",
      ],
    };
  }

  if (type === "asset" || type === "upgrade") {
    const trashCost = cardDefinitionTrashCost(definitionId);
    if (trashCost !== undefined) {
      const affordable = path.creditsAfterPath >= trashCost;
      return {
        payoff: affordable ? "trash_affordable" : "trash_unaffordable",
        knownNoCurrentPayoff: !affordable,
        score: affordable ? 150 : 0,
        penalty: affordable ? 0 : 700,
        reasons: [
          affordable
            ? "known_rnd_top_trash_affordable_after_ice"
            : "known_rnd_top_trash_unaffordable_after_ice",
          ...(affordable
            ? ["known_rnd_top_trash_target"]
            : [
                "known_rnd_top_low_value_stale",
                "central_known_no_current_payoff",
              ]),
        ],
        evidence: [
          ...evidenceBase,
          `rnd_known_top_trash_cost:${trashCost}`,
          `rnd_known_top_trash_affordable:${affordable}`,
          affordable
            ? "rd_run_boosted_by_known_top_trashable:true"
            : "rd_run_suppressed_by_known_low_value_top:true",
          `central_memory_payoff:${affordable ? "trash_affordable" : "trash_unaffordable"}`,
        ],
      };
    }
  }

  return {
    payoff: "known_low_value",
    knownNoCurrentPayoff: true,
    score: 0,
    penalty: 640,
    reasons: [
      "known_rnd_top_low_value_stale",
      "central_known_no_current_payoff",
    ],
    evidence: [
      ...evidenceBase,
      "rd_run_suppressed_by_known_low_value_top:true",
      "central_memory_payoff:known_low_value",
    ],
  };
}

function evaluateKnownHqAccessPayoff(
  input: AiDecisionInput,
  beliefState: BeliefState,
): KnownCentralAccessPayoff {
  const memory = beliefState.runnerOpponentModel?.hqHandMemory;
  if (!memory) {
    return unknownCentralPayoff("hq", ["hq_hand_memory:none"]);
  }

  const path = knownCentralPathCost(input, "hq");
  const assessment = assessHqKnownness(
    input,
    memory,
    path.creditsAfterPath,
  );
  const safeKnownDefinitions = expandHqSafeDefinitionIds(memory);
  const candidateGroupCount = memory.ledger.candidateGroups.length;
  const evidenceBase = [
    "central_target:hq",
    memory.allCardsKnown
      ? "central_memory_payoff:known"
      : assessment.safeKnownCount > 0 || candidateGroupCount > 0
        ? "central_memory_payoff:partial_known"
        : "central_memory_payoff:unknown",
    `hq_hand_known_count:${assessment.safeKnownCount}`,
    `hq_hand_count:${assessment.handCount}`,
    `hq_all_cards_known:${memory.allCardsKnown}`,
    `hq_unknown_cards:${Math.max(0, assessment.handCount - assessment.safeKnownCount)}`,
    `hq_safe_definition_count:${assessment.safeKnownCount}`,
    `hq_candidate_group_count:${candidateGroupCount}`,
    `hq_unknown_rest_count:${assessment.unknownRestCount}`,
    `hq_known_fraction:${assessment.knownFraction}`,
    `hq_unknown_fraction:${assessment.unknownFraction}`,
    `hq_known_agenda_count:${assessment.knownAgendaCount}`,
    `hq_known_trash_payoff_count:${assessment.knownTrashPayoffCount}`,
    `hq_known_low_value_count:${assessment.knownLowValueCount}`,
    `hq_candidate_known_count:${assessment.candidateKnownCount}`,
    `hq_candidate_payoff_summary:agenda:${assessment.candidatePossibleAgendaCount}:trash:${assessment.candidatePossibleTrashPayoffCount}:low:${assessment.candidateLowValueCount}`,
    `hq_access_depth_estimate:${assessment.accessDepthEstimate}`,
    `hq_unknown_access_chance_estimate:${assessment.unknownAccessChanceEstimate}`,
    `hq_knownness_payoff:${assessment.knownnessPayoff}`,
    `hq_knownness_penalty:${assessment.knownnessPenalty}`,
    `hq_memory_retained_after_draw_departure:${hqMemoryRetainedAfterDrawDeparture(memory, assessment)}`,
    `hq_memory_invalidated_reason:${hqMemoryInvalidatedReason(memory)}`,
    `hq_visible_break_cost:${path.visibleBreakCost}`,
    `hq_credits_after_path:${path.creditsAfterPath}`,
  ];

  if (
    assessment.safeKnownCount === 0 &&
    assessment.candidateKnownCount === 0 &&
    candidateGroupCount === 0
  ) {
    return unknownCentralPayoff("hq", [
      "hq_hand_memory:none",
      ...evidenceBase,
    ]);
  }

  if (assessment.knownAgendaCount > 0) {
    return {
      payoff: "agenda",
      knownNoCurrentPayoff: false,
      score: 520,
      penalty: 0,
      reasons: ["known_hq_agenda_pressure"],
      evidence: [
        ...evidenceBase,
        "central_memory_payoff:agenda",
        "hq_run_boosted_because_known_agenda:true",
      ],
    };
  }

  const trashableKnownCards = safeKnownDefinitions
    .map((definitionId) => {
      const type = cardDefinitionType(definitionId);
      if (type !== "asset" && type !== "upgrade") return undefined;
      const trashCost = cardDefinitionTrashCost(definitionId);
      return trashCost !== undefined ? { definitionId, trashCost } : undefined;
    })
    .filter(
      (
        card,
      ): card is {
        definitionId: string;
        trashCost: number;
      } => card !== undefined,
    );
  const affordableTrashCards = trashableKnownCards.filter(
    (card) => path.creditsAfterPath >= card.trashCost,
  );
  if (affordableTrashCards.length > 0) {
    return {
      payoff: "trash_affordable",
      knownNoCurrentPayoff: false,
      score: 120,
      penalty: 0,
      reasons: ["known_hq_trash_affordable_after_ice"],
      evidence: [
        ...evidenceBase,
        `hq_known_trash_affordable_count:${affordableTrashCards.length}`,
        "central_memory_payoff:trash_affordable",
        "hq_run_boosted_by_known_trashable:true",
      ],
    };
  }

  if (memory.allCardsKnown && trashableKnownCards.length > 0) {
    return {
      payoff: "trash_unaffordable",
      knownNoCurrentPayoff: true,
      score: 0,
      penalty: 700,
      reasons: [
        "known_hq_trash_unaffordable_after_ice",
        "central_known_no_current_payoff",
      ],
      evidence: [
        ...evidenceBase,
        `hq_known_trash_unaffordable_count:${trashableKnownCards.length}`,
        "central_memory_payoff:trash_unaffordable",
        "hq_run_suppressed_by_known_unaffordable_trash:true",
      ],
    };
  }

  if (
    memory.allCardsKnown &&
    assessment.safeKnownCount > 0 &&
    assessment.knownLowValueCount >= assessment.safeKnownCount
  ) {
    return {
      payoff: "known_low_value",
      knownNoCurrentPayoff: true,
      score: 0,
      penalty: 640,
      reasons: ["known_hq_hand_low_value", "central_known_no_current_payoff"],
      evidence: [
        ...evidenceBase,
        "central_memory_payoff:known_low_value",
        "hq_run_suppressed_by_fully_known_low_value_hand:true",
      ],
    };
  }

  if (
    assessment.knownnessPayoff === "mostly_known_low_value" ||
    assessment.knownnessPayoff === "partially_known_low_value"
  ) {
    return {
      payoff: "unknown",
      knownNoCurrentPayoff: false,
      score: 0,
      penalty: assessment.knownnessPenalty,
      reasons: [
        assessment.knownnessPayoff === "mostly_known_low_value"
          ? "hq_mostly_known_low_value"
          : "hq_partially_known_low_value",
      ],
      evidence: [
        ...evidenceBase,
        "central_memory_payoff:unknown",
        "hq_run_suppressed_by_knownness_low_value:true",
      ],
    };
  }

  return unknownCentralPayoff("hq", [
    ...evidenceBase,
    assessment.knownnessPayoff === "candidate_possible_payoff"
      ? "hq_candidate_possible_payoff_remains:true"
      : "hq_unknown_or_ambiguous_cards_remain:true",
  ]);
}

function assessHqKnownness(
  input: AiDecisionInput,
  memory: NonNullable<BeliefState["runnerOpponentModel"]>["hqHandMemory"],
  creditsAfterPath: number,
): HqKnownnessAssessment {
  const support = installedHqAccessSupport(input);
  const safeKnownDefinitions = expandHqSafeDefinitionIds(memory);
  const safeKnownCount = safeKnownDefinitions.length;
  const candidateKnownCount = memory.ledger.candidateGroups.reduce(
    (sum, group) =>
      sum + Math.max(0, group.candidateCount - group.departureCount),
    0,
  );
  const candidateDefinitions = memory.ledger.candidateGroups.flatMap((group) =>
    group.candidateDefinitions.flatMap((definition) =>
      Array.from({ length: definition.count }, () => definition.definitionId),
    ),
  );
  const handCount = Math.max(
    memory.handCount,
    safeKnownCount + candidateKnownCount + memory.ledger.unknownRestCount,
  );
  const constrainedKnownCount = Math.min(
    handCount,
    safeKnownCount + candidateKnownCount,
  );
  const unknownCount = Math.max(0, handCount - constrainedKnownCount);
  const knownAgendaCount = safeKnownDefinitions.filter(
    (definitionId) => cardDefinitionType(definitionId) === "agenda",
  ).length;
  const knownTrashPayoffCount = safeKnownDefinitions.filter((definitionId) =>
    hqDefinitionHasAffordableTrashPayoff(definitionId, creditsAfterPath),
  ).length;
  const knownLowValueCount = safeKnownDefinitions.filter((definitionId) =>
    hqDefinitionIsLowValueForAccess(definitionId, creditsAfterPath),
  ).length;
  const candidatePossibleAgendaCount = candidateDefinitions.filter(
    (definitionId) => cardDefinitionType(definitionId) === "agenda",
  ).length;
  const candidatePossibleTrashPayoffCount = candidateDefinitions.filter(
    (definitionId) =>
      hqDefinitionHasAffordableTrashPayoff(definitionId, creditsAfterPath),
  ).length;
  const candidateLowValueCount = candidateDefinitions.filter((definitionId) =>
    hqDefinitionIsLowValueForAccess(definitionId, creditsAfterPath),
  ).length;
  const knownFraction =
    handCount > 0 ? round(constrainedKnownCount / handCount) : 0;
  const unknownFraction = handCount > 0 ? round(unknownCount / handCount) : 0;
  const unknownAccessChanceEstimate = estimateAccessChance(
    handCount,
    unknownCount,
    support.accessDepthEstimate,
  );
  const knownnessPayoff = hqKnownnessPayoff({
    handCount,
    knownFraction,
    unknownFraction,
    unknownAccessChanceEstimate,
    knownAgendaCount,
    knownTrashPayoffCount,
    knownLowValueCount,
    candidatePossibleAgendaCount,
    candidatePossibleTrashPayoffCount,
    candidateLowValueCount,
    candidateGroupCount: memory.ledger.candidateGroups.length,
  });
  return {
    handCount,
    safeKnownCount,
    candidateKnownCount,
    unknownRestCount: memory.ledger.unknownRestCount,
    knownFraction,
    unknownFraction,
    knownAgendaCount,
    knownTrashPayoffCount,
    knownLowValueCount,
    candidatePossibleAgendaCount,
    candidatePossibleTrashPayoffCount,
    candidateLowValueCount,
    accessDepthEstimate: support.accessDepthEstimate,
    unknownAccessChanceEstimate,
    knownnessPenalty: hqKnownnessPenalty(
      knownnessPayoff,
      knownFraction,
      unknownAccessChanceEstimate,
      support.hasInstalledHqPayoffSupport,
    ),
    knownnessPayoff,
  };
}

function hqKnownnessPayoff(params: {
  handCount: number;
  knownFraction: number;
  unknownFraction: number;
  unknownAccessChanceEstimate: number;
  knownAgendaCount: number;
  knownTrashPayoffCount: number;
  knownLowValueCount: number;
  candidatePossibleAgendaCount: number;
  candidatePossibleTrashPayoffCount: number;
  candidateLowValueCount: number;
  candidateGroupCount: number;
}): HqKnownnessAssessment["knownnessPayoff"] {
  if (params.knownAgendaCount > 0) return "known_agenda";
  if (params.knownTrashPayoffCount > 0) return "known_trash_affordable";
  if (
    params.candidatePossibleAgendaCount > 0 ||
    params.candidatePossibleTrashPayoffCount > 0
  ) {
    return "candidate_possible_payoff";
  }
  if (params.handCount <= 0 || params.knownFraction === 0) return "unknown";
  const lowValueCount =
    params.knownLowValueCount + params.candidateLowValueCount;
  const lowValueFraction =
    params.handCount > 0 ? lowValueCount / params.handCount : 0;
  if (
    params.knownFraction >= 0.75 &&
    lowValueFraction >= 0.6 &&
    params.unknownAccessChanceEstimate < 0.5
  ) {
    return "mostly_known_low_value";
  }
  if (
    params.knownFraction >= 0.45 &&
    lowValueFraction >= 0.4 &&
    params.unknownAccessChanceEstimate < 0.55
  ) {
    return "partially_known_low_value";
  }
  if (
    params.unknownFraction >= 0.45 ||
    params.unknownAccessChanceEstimate >= 0.45
  ) {
    return "meaningful_unknown_rest";
  }
  if (params.candidateGroupCount > 0) return "partially_known_low_value";
  return "unknown";
}

function hqKnownnessPenalty(
  payoff: HqKnownnessAssessment["knownnessPayoff"],
  knownFraction: number,
  unknownAccessChanceEstimate: number,
  hasInstalledHqPayoffSupport: boolean,
): number {
  if (
    payoff !== "mostly_known_low_value" &&
    payoff !== "partially_known_low_value"
  ) {
    return 0;
  }
  const base =
    payoff === "mostly_known_low_value"
      ? 420 * knownFraction * (1 - unknownAccessChanceEstimate)
      : 220 * knownFraction * (1 - unknownAccessChanceEstimate);
  const supportMultiplier = hasInstalledHqPayoffSupport ? 0.8 : 1;
  return Math.max(40, Math.round(base * supportMultiplier));
}

function expandHqSafeDefinitionIds(
  memory: NonNullable<BeliefState["runnerOpponentModel"]>["hqHandMemory"],
): string[] {
  const fromLedger = memory.ledger.safeDefinitions.flatMap((definition) =>
    Array.from({ length: definition.count }, () => definition.definitionId),
  );
  return fromLedger.length > 0 || memory.knownDefinitions.length === 0
    ? fromLedger
    : memory.knownDefinitions.slice();
}

function hqDefinitionHasAffordableTrashPayoff(
  definitionId: string,
  creditsAfterPath: number,
): boolean {
  const type = cardDefinitionType(definitionId);
  if (type !== "asset" && type !== "upgrade") return false;
  const trashCost = cardDefinitionTrashCost(definitionId);
  return trashCost !== undefined && creditsAfterPath >= trashCost;
}

function hqDefinitionIsLowValueForAccess(
  definitionId: string,
  creditsAfterPath: number,
): boolean {
  const type = cardDefinitionType(definitionId);
  if (!type || type === "agenda") return false;
  if (
    (type === "asset" || type === "upgrade") &&
    hqDefinitionHasAffordableTrashPayoff(definitionId, creditsAfterPath)
  ) {
    return false;
  }
  return true;
}

function estimateAccessChance(
  handCount: number,
  interestingCount: number,
  accessDepth: number,
): number {
  if (handCount <= 0 || interestingCount <= 0) return 0;
  const depth = Math.max(1, Math.min(handCount, accessDepth));
  let missChance = 1;
  for (let index = 0; index < depth; index += 1) {
    const remainingCards = handCount - index;
    const remainingMisses = Math.max(0, handCount - interestingCount - index);
    missChance *= remainingMisses / remainingCards;
  }
  return round(1 - missChance);
}

function installedHqAccessSupport(input: AiDecisionInput): {
  accessDepthEstimate: number;
  hasInstalledHqPayoffSupport: boolean;
} {
  let extraAccess = 0;
  let hasInstalledHqPayoffSupport = false;
  for (const card of input.playerView.own.rig ?? []) {
    if (card.known === false || !card.definitionId) continue;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    for (const effect of hint?.effects ?? []) {
      const effectRecord = effect as Record<string, unknown>;
      if (!effectScopeMatchesHq(effectRecord.scope)) continue;
      const kind = effectRecord.kind;
      if (kind === "multiaccess") {
        const amount =
          typeof effectRecord.amount === "number" &&
          Number.isFinite(effectRecord.amount)
            ? effectRecord.amount
            : 1;
        extraAccess += Math.max(1, Math.floor(amount));
        hasInstalledHqPayoffSupport = true;
        continue;
      }
      if (
        kind === "hq_info" ||
        kind === "access_replacement" ||
        kind === "persistent_counter_effect"
      ) {
        hasInstalledHqPayoffSupport = true;
      }
    }
  }
  return {
    accessDepthEstimate: 1 + extraAccess,
    hasInstalledHqPayoffSupport,
  };
}

function effectScopeMatchesHq(scope: unknown): boolean {
  return scope === "hq" || scope === "server";
}

function hqMemoryRetainedAfterDrawDeparture(
  memory: NonNullable<BeliefState["runnerOpponentModel"]>["hqHandMemory"],
  assessment: HqKnownnessAssessment,
): boolean {
  return (
    assessment.safeKnownCount > 0 &&
    memory.invalidationReasons.some((reason) =>
      hqMemoryInvalidationReasonMatches(
        reason,
        HQ_DRAW_DEPARTURE_INVALIDATION_REASONS,
      ),
    )
  );
}

function hqMemoryInvalidatedReason(
  memory: NonNullable<BeliefState["runnerOpponentModel"]>["hqHandMemory"],
): string {
  const reason = memory.invalidationReasons.find(
    (candidate) =>
      hqMemoryInvalidationReasonMatches(
        candidate,
        HQ_REORDER_INVALIDATION_REASONS,
      ),
  );
  return reason?.split(":")[0] ?? "none";
}

export function hqMemoryInvalidationReasonMatches(
  reason: string,
  reasonCodes: readonly string[],
): boolean {
  const reasonCodeSet = new Set(reasonCodes);
  return reasonCodeSet.has(reason.split(":")[0] ?? reason);
}

function knownCentralPathCost(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
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
  return {
    visibleBreakCost: assessment.visibleBreakCost ?? 0,
    creditsAfterPath: assessment.creditsAfterPath,
  };
}

function hasInstalledRdAccessBonus(input: AiDecisionInput): boolean {
  return (input.playerView.own.rig ?? []).some((card) => {
    const definitionId = card.definitionId;
    return (
      definitionId === "onr_v1_024_expert-schedule-analyzer" ||
      definitionId === "onr_v1_041_microtech-ai-interface" ||
      definitionId === "onr_v1_050_r-and-d-protocol-files" ||
      definitionId === "onr_v1_105_priority-wreck"
    );
  });
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function unknownCentralPayoff(
  serverId: string,
  extraEvidence: string[] = [],
): KnownCentralAccessPayoff {
  return {
    payoff: "unknown",
    knownNoCurrentPayoff: false,
    score: 0,
    penalty: 0,
    reasons: [],
    evidence: [
      `central_target:${serverId}`,
      "central_memory_payoff:unknown",
      ...extraEvidence,
    ],
  };
}
