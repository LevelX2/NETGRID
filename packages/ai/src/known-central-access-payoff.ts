import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "./ai-hints";
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
  if (!memory || memory.knownDefinitions.length === 0) {
    return unknownCentralPayoff("hq", ["hq_hand_memory:none"]);
  }

  const path = knownCentralPathCost(input, "hq");
  const knownAgendaDefinitions = memory.knownDefinitions.filter(
    (definitionId) => cardDefinitionType(definitionId) === "agenda",
  );
  const knownNonAgendaCount =
    memory.knownDefinitions.length - knownAgendaDefinitions.length;
  const unknownCount = Math.max(0, memory.handCount - memory.knownCount);
  const candidateGroupCount = memory.ledger.candidateGroups.length;
  const evidenceBase = [
    "central_target:hq",
    memory.allCardsKnown
      ? "central_memory_payoff:known"
      : "central_memory_payoff:partial_known",
    `hq_hand_known_count:${memory.knownCount}`,
    `hq_hand_count:${memory.handCount}`,
    `hq_all_cards_known:${memory.allCardsKnown}`,
    `hq_unknown_cards:${unknownCount}`,
    `hq_candidate_group_count:${candidateGroupCount}`,
    `hq_known_agenda_count:${knownAgendaDefinitions.length}`,
    `hq_known_non_agenda_count:${knownNonAgendaCount}`,
    `hq_visible_break_cost:${path.visibleBreakCost}`,
    `hq_credits_after_path:${path.creditsAfterPath}`,
  ];

  if (knownAgendaDefinitions.length > 0) {
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

  if (!memory.allCardsKnown) {
    return unknownCentralPayoff("hq", [
      ...evidenceBase,
      "hq_unknown_or_ambiguous_cards_remain:true",
    ]);
  }

  const trashableKnownCards = memory.knownDefinitions
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

  if (trashableKnownCards.length > 0) {
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
