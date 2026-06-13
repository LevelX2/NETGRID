export type EndgameGoalConversionContractId =
  | "runner.fix_coverage"
  | "runner.convert_reachability_to_access"
  | "runner.find_payoff"
  | "corp.convert_economy_to_scoreline"
  | "corp.protect_scoreline"
  | "corp.convert_tag_to_punish";

export type EndgameGoalConversionBlockerCategory =
  | "missing_legal_alternative"
  | "missing_target_context"
  | "missing_conversion_payoff"
  | "unpayable_conversion"
  | "hard_gate_blocked"
  | "stale_without_replacement";

export type EndgameGoalConversionContract = {
  id: EndgameGoalConversionContractId;
  side: "runner" | "corp";
  supportingActions: string[];
  expectedConversions: string[];
  staleThreshold: number;
  blockerCategories: EndgameGoalConversionBlockerCategory[];
  legalAlternativeRequirements: string[];
};

export type EndgameGoalConversionObservation = {
  contractId: EndgameGoalConversionContractId;
  staleCount: number;
  lastConversionAttempt?: string;
  hasLegalAlternative?: boolean;
  targetContextComplete?: boolean;
  payoffVisible?: boolean;
  payable?: boolean;
  hardGateClear?: boolean;
};

export type EndgameGoalConversionClassification = {
  contractId: EndgameGoalConversionContractId;
  status: "conversion_observed" | "stale_without_conversion";
  blockerCategory: EndgameGoalConversionBlockerCategory;
};

export const ENDGAME_GOAL_CONVERSION_CONTRACTS: EndgameGoalConversionContract[] =
  [
    {
      id: "runner.fix_coverage",
      side: "runner",
      supportingActions: ["install_card", "trigger_ability", "draw_card", "gain_credit"],
      expectedConversions: [
        "coverage_program_installed",
        "coverage_search_resolved",
        "wall_passage_reachability_improved",
      ],
      staleThreshold: 5,
      blockerCategories: [
        "missing_legal_alternative",
        "missing_target_context",
        "unpayable_conversion",
        "hard_gate_blocked",
      ],
      legalAlternativeRequirements: [
        "visible installable coverage, side-safe search target, or concrete credit path",
        "cost and timing gate clear",
      ],
    },
    {
      id: "runner.convert_reachability_to_access",
      side: "runner",
      supportingActions: ["start_run", "continue_run", "break_subroutine", "pump_breaker"],
      expectedConversions: ["access_card", "trash_accessed_card", "steal_agenda"],
      staleThreshold: 3,
      blockerCategories: [
        "missing_target_context",
        "missing_conversion_payoff",
        "hard_gate_blocked",
        "stale_without_replacement",
      ],
      legalAlternativeRequirements: [
        "same-run access or access-step continuation is legal",
        "known payoff or unknown-access value is side-safe",
      ],
    },
    {
      id: "runner.find_payoff",
      side: "runner",
      supportingActions: ["access_card", "trash_accessed_card", "steal_agenda", "start_run"],
      expectedConversions: ["agenda_stolen", "valuable_card_trashed", "new_information_accessed"],
      staleThreshold: 4,
      blockerCategories: [
        "missing_target_context",
        "missing_conversion_payoff",
        "hard_gate_blocked",
      ],
      legalAlternativeRequirements: [
        "access or trash target is legal and side-safe",
        "payoff is visible, unknown but valuable, or agenda-relevant",
      ],
    },
    {
      id: "corp.convert_economy_to_scoreline",
      side: "corp",
      supportingActions: ["score_agenda", "advance_card", "gain_credit", "play_operation"],
      expectedConversions: ["agenda_scored", "agenda_advanced_to_scoreline"],
      staleThreshold: 4,
      blockerCategories: [
        "missing_legal_alternative",
        "missing_target_context",
        "unpayable_conversion",
        "hard_gate_blocked",
        "stale_without_replacement",
      ],
      legalAlternativeRequirements: [
        "score or advance action is legal",
        "remote scoreline risk gates are clear enough for shadow promotion",
      ],
    },
    {
      id: "corp.protect_scoreline",
      side: "corp",
      supportingActions: ["rez_ice", "install_card", "advance_card", "trigger_ability"],
      expectedConversions: ["scoreline_remote_protected", "server_rezzed_or_hardened"],
      staleThreshold: 4,
      blockerCategories: [
        "missing_legal_alternative",
        "missing_target_context",
        "unpayable_conversion",
        "hard_gate_blocked",
      ],
      legalAlternativeRequirements: [
        "protection action is legal and target server is side-safe",
        "cost and timing gate clear",
      ],
    },
    {
      id: "corp.convert_tag_to_punish",
      side: "corp",
      supportingActions: ["play_operation", "trigger_ability", "trash_resource"],
      expectedConversions: ["tag_payoff_used", "damage_or_resource_punish_taken", "punish_line_abandoned_for_scoreline"],
      staleThreshold: 3,
      blockerCategories: [
        "missing_target_context",
        "missing_conversion_payoff",
        "unpayable_conversion",
        "hard_gate_blocked",
        "stale_without_replacement",
      ],
      legalAlternativeRequirements: [
        "runner is actually tagged or punish action creates a legal immediate payoff",
        "damage, trash, or scoreline replacement action is legal and payable",
      ],
    },
  ];

export function endgameGoalConversionContract(
  id: EndgameGoalConversionContractId,
): EndgameGoalConversionContract {
  const contract = ENDGAME_GOAL_CONVERSION_CONTRACTS.find(
    (candidate) => candidate.id === id,
  );
  if (!contract) throw new Error(`Unknown endgame goal conversion contract: ${id}`);
  return contract;
}

export function classifyEndgameGoalConversion(
  observation: EndgameGoalConversionObservation,
): EndgameGoalConversionClassification {
  const contract = endgameGoalConversionContract(observation.contractId);
  if (observation.staleCount < contract.staleThreshold) {
    return {
      contractId: observation.contractId,
      status: "conversion_observed",
      blockerCategory: "stale_without_replacement",
    };
  }
  if (observation.hasLegalAlternative === false) {
    return {
      contractId: observation.contractId,
      status: "stale_without_conversion",
      blockerCategory: "missing_legal_alternative",
    };
  }
  if (observation.targetContextComplete === false) {
    return {
      contractId: observation.contractId,
      status: "stale_without_conversion",
      blockerCategory: "missing_target_context",
    };
  }
  if (observation.payoffVisible === false) {
    return {
      contractId: observation.contractId,
      status: "stale_without_conversion",
      blockerCategory: "missing_conversion_payoff",
    };
  }
  if (observation.payable === false) {
    return {
      contractId: observation.contractId,
      status: "stale_without_conversion",
      blockerCategory: "unpayable_conversion",
    };
  }
  if (observation.hardGateClear === false) {
    return {
      contractId: observation.contractId,
      status: "stale_without_conversion",
      blockerCategory: "hard_gate_blocked",
    };
  }
  return {
    contractId: observation.contractId,
    status: "stale_without_conversion",
    blockerCategory: "stale_without_replacement",
  };
}
