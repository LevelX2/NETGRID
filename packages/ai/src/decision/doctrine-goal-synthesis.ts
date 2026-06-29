import type {
  DeckDoctrineV2Diagnostic,
  DeckDoctrineV2StrategyDiagnostic,
} from "../deck-doctrine-strategy";
import type { TacticalGoalLike } from "./semantic-decision-frame";

export function synthesizeDoctrineTacticalGoals(
  diagnostic: DeckDoctrineV2Diagnostic | undefined,
): TacticalGoalLike[] {
  if (!diagnostic || diagnostic.side === "unknown") return [];
  if (diagnostic.neutralDoctrine || diagnostic.status === "anchorless") {
    return [
      goal(`${diagnostic.side}.doctrine.neutral`, "setup", 520, "medium", [
        "doctrine_v2:neutral",
        `doctrine_status:${diagnostic.status}`,
      ]),
    ];
  }

  const goals: TacticalGoalLike[] = [];
  for (const strategy of diagnostic.strategyDiagnostics) {
    if (diagnostic.side === "runner") {
      goals.push(...runnerDoctrineGoals(strategy));
    } else {
      goals.push(...corpDoctrineGoals(strategy));
    }
  }
  return dedupeGoals(goals);
}

function runnerDoctrineGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (!hasStrategyAnchor(strategy)) return [];
  switch (strategy.strategyId) {
    case "runner.rnd_pressure":
      return runnerPressureGoals(strategy, {
        strategyId: "runner.rnd_pressure",
        accessGoalId: "runner.doctrine.rnd_pressure_access",
        coverageGoalId: "runner.doctrine.rnd_pressure_coverage",
        setupGoalId: "runner.doctrine.rnd_pressure_setup",
        completeEvidence: "doctrine_goal:run_access",
        priority: 790,
      });
    case "runner.hq_pressure":
      return runnerPressureGoals(strategy, {
        strategyId: "runner.hq_pressure",
        accessGoalId: "runner.doctrine.hq_pressure_access",
        coverageGoalId: "runner.doctrine.hq_pressure_coverage",
        setupGoalId: "runner.doctrine.hq_pressure_setup",
        completeEvidence: "doctrine_goal:hq_access",
        priority: 780,
      });
    case "runner.remote_contest":
      return runnerRemoteContestGoals(strategy);
    case "runner.search.breaker":
      return runnerBreakerSearchGoals(strategy);
    case "runner.survival_defense":
      return runnerSurvivalGoals(strategy);
    case "runner.economy_first":
      return runnerEconomyEngineGoals(strategy);
    default:
      return [];
  }
}

type RunnerPressureGoalSpec = {
  strategyId: string;
  accessGoalId: string;
  coverageGoalId: string;
  setupGoalId: string;
  completeEvidence: string;
  priority: number;
};

function runnerPressureGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
  spec: RunnerPressureGoalSpec,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal(spec.accessGoalId, "pressure", spec.priority, "high", [
        `doctrine_v2:${spec.strategyId}`,
        "doctrine_status:complete",
        spec.completeEvidence,
      ]),
    ];
  }
  if (strategy.status === "partial" && hasCoverageGap(strategy)) {
    return [
      goal(spec.coverageGoalId, "coverage", 720, "medium", [
        `doctrine_v2:${spec.strategyId}`,
        "doctrine_status:partial",
        "missing_breaker_coverage:doctrine_v2",
      ]),
    ];
  }
  if (strategy.status === "partial") {
    return [
      goal(spec.setupGoalId, "setup", 650, "medium", [
        `doctrine_v2:${spec.strategyId}`,
        "doctrine_status:partial",
        "doctrine_gap:setup_before_pressure",
      ]),
    ];
  }
  return [];
}

function runnerRemoteContestGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("runner.doctrine.remote_contest", "remote_contest", 800, "high", [
        "doctrine_v2:runner.remote_contest",
        "doctrine_status:complete",
        "doctrine_goal:remote_contest",
      ]),
    ];
  }
  if (strategy.status === "partial" && hasCoverageGap(strategy)) {
    return [
      goal("runner.doctrine.remote_contest_coverage", "coverage", 710, "medium", [
        "doctrine_v2:runner.remote_contest",
        "doctrine_status:partial",
        "missing_breaker_coverage:doctrine_v2",
      ]),
    ];
  }
  return [];
}

function runnerBreakerSearchGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("runner.doctrine.breaker_search", "coverage", 735, "medium", [
        "doctrine_v2:runner.search.breaker",
        "doctrine_status:complete",
        "doctrine_goal:breaker_search",
      ]),
    ];
  }
  if (strategy.status === "partial") {
    return [
      goal("runner.doctrine.breaker_search_setup", "setup", 650, "medium", [
        "doctrine_v2:runner.search.breaker",
        "doctrine_status:partial",
        "doctrine_gap:search_setup_before_payoff",
      ]),
    ];
  }
  return [];
}

function runnerSurvivalGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("runner.doctrine.survival", "risk_control", 760, "high", [
        "doctrine_v2:runner.survival_defense",
        "doctrine_status:complete",
        "doctrine_goal:survival",
      ]),
    ];
  }
  if (strategy.status === "partial") {
    return [
      goal("runner.doctrine.survival_setup", "setup", 650, "medium", [
        "doctrine_v2:runner.survival_defense",
        "doctrine_status:partial",
        "doctrine_gap:survival_tool_setup",
      ]),
    ];
  }
  return [];
}

function runnerEconomyEngineGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("runner.doctrine.economy_engine", "economy", 735, "medium", [
        "doctrine_v2:runner.economy_first",
        "doctrine_status:complete",
        "doctrine_goal:economy_engine",
      ]),
    ];
  }
  if (strategy.status === "partial") {
    return [
      goal("runner.doctrine.economy_engine_setup", "setup", 650, "medium", [
        "doctrine_v2:runner.economy_first",
        "doctrine_status:partial",
        "doctrine_gap:economy_setup_before_payoff",
      ]),
    ];
  }
  return [];
}

function corpDoctrineGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (!hasStrategyAnchor(strategy)) return [];
  if (strategy.strategyId === "corp.remote_scoring") {
    return corpRemoteScoringGoals(strategy);
  }
  if (strategy.strategyId === "corp.fast_advance") {
    return corpFastAdvanceGoals(strategy);
  }
  if (strategy.strategyId === "corp.ice_tax_glacier") {
    return corpIceTaxGoals(strategy);
  }
  if (strategy.strategyId === "corp.asset_economy") {
    return corpAssetEconomyGoals(strategy);
  }
  if (strategy.strategyId === "corp.central_stabilize") {
    return corpCentralDefenseGoals(strategy);
  }
  if (strategy.strategyId === "corp.ambush_bluff") {
    return corpRemoteAmbushGoals(strategy);
  }
  if (strategy.strategyId === "corp.tag_trace_punish" && tagPunishReady(strategy)) {
    return [
      goal("corp.doctrine.tag_trace_punish", "tag_punish", 740, "medium", [
        "doctrine_v2:corp.tag_trace_punish",
        "doctrine_status:complete",
      ]),
    ];
  }
  if (strategy.strategyId === "corp.damage_kill" && damagePressureReady(strategy)) {
    return [
      goal("corp.doctrine.damage_pressure", "damage_pressure", 740, "medium", [
        "doctrine_v2:corp.damage_kill",
        "doctrine_status:complete",
      ]),
    ];
  }
  return [];
}

function corpRemoteScoringGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("corp.doctrine.remote_scoring_scoreline", "corp_scoreline", 810, "high", [
        "doctrine_v2:corp.remote_scoring",
        "doctrine_status:complete",
        "doctrine_goal:corp_scoreline",
      ]),
      goal(
        "corp.doctrine.remote_scoring_ice_defense",
        "corp_ice_defense",
        760,
        "medium",
        [
          "doctrine_v2:corp.remote_scoring",
          "doctrine_status:complete",
          "doctrine_goal:corp_ice_defense",
        ],
      ),
    ];
  }
  if (strategy.status === "partial") {
    return [
      goal("corp.doctrine.remote_scoring_setup", "setup", 670, "medium", [
        "doctrine_v2:corp.remote_scoring",
        "doctrine_status:partial",
        "doctrine_gap:setup_before_remote_scoreline",
      ]),
    ];
  }
  return [];
}

function corpFastAdvanceGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("corp.doctrine.fast_advance", "corp_scoreline", 805, "high", [
        "doctrine_v2:corp.fast_advance",
        "doctrine_status:complete",
        "doctrine_goal:fast_advance",
      ]),
    ];
  }
  return corpPartialSetupGoal(strategy, "corp.doctrine.fast_advance_setup");
}

function corpIceTaxGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("corp.doctrine.ice_tax", "corp_ice_defense", 780, "medium", [
        "doctrine_v2:corp.ice_tax_glacier",
        "doctrine_status:complete",
        "doctrine_goal:ice_tax",
      ]),
    ];
  }
  return corpPartialSetupGoal(strategy, "corp.doctrine.ice_tax_setup");
}

function corpAssetEconomyGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("corp.doctrine.asset_economy", "economy", 740, "medium", [
        "doctrine_v2:corp.asset_economy",
        "doctrine_status:complete",
        "doctrine_goal:asset_economy",
      ]),
    ];
  }
  return corpPartialSetupGoal(strategy, "corp.doctrine.asset_economy_setup");
}

function corpCentralDefenseGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("corp.doctrine.hq_defense", "corp_ice_defense", 770, "medium", [
        "doctrine_v2:corp.central_stabilize",
        "doctrine_status:complete",
        "doctrine_goal:hq_defense",
        "central_server:hq",
      ]),
      goal("corp.doctrine.rnd_defense", "corp_ice_defense", 768, "medium", [
        "doctrine_v2:corp.central_stabilize",
        "doctrine_status:complete",
        "doctrine_goal:rnd_defense",
        "central_server:rd",
      ]),
    ];
  }
  if (strategy.status === "partial") {
    return partialCorpCentralDefenseGoals(strategy);
  }
  return corpPartialSetupGoal(strategy, "corp.doctrine.central_defense_setup");
}

function partialCorpCentralDefenseGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  const needsHq = hasCentralDefenseGap(strategy, "hq");
  const needsRnd = hasCentralDefenseGap(strategy, "rnd");
  if (!needsHq && !needsRnd) {
    return corpPartialSetupGoal(strategy, "corp.doctrine.central_defense_setup");
  }
  return [
    ...(needsHq
      ? [
          goal(
            "corp.doctrine.hq_defense_setup",
            "corp_ice_defense",
            668,
            "medium",
            [
              "doctrine_v2:corp.central_stabilize",
              "doctrine_status:partial",
              "doctrine_gap:hq_defense_setup",
              "central_server:hq",
            ],
          ),
        ]
      : []),
    ...(needsRnd
      ? [
          goal(
            "corp.doctrine.rnd_defense_setup",
            "corp_ice_defense",
            666,
            "medium",
            [
              "doctrine_v2:corp.central_stabilize",
              "doctrine_status:partial",
              "doctrine_gap:rnd_defense_setup",
              "central_server:rd",
            ],
          ),
        ]
      : []),
  ];
}

function corpRemoteAmbushGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("corp.doctrine.remote_ambush", "damage_pressure", 730, "medium", [
        "doctrine_v2:corp.ambush_bluff",
        "doctrine_status:complete",
        "doctrine_goal:remote_ambush",
      ]),
    ];
  }
  return corpPartialSetupGoal(strategy, "corp.doctrine.remote_ambush_setup");
}

function corpPartialSetupGoal(
  strategy: DeckDoctrineV2StrategyDiagnostic,
  goalId: string,
): TacticalGoalLike[] {
  if (strategy.status !== "partial") return [];
  return [
    goal(goalId, "setup", 660, "medium", [
      `doctrine_v2:${strategy.strategyId}`,
      "doctrine_status:partial",
      "doctrine_gap:setup_before_payoff",
    ]),
  ];
}

function tagPunishReady(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return (
    strategy.status === "complete" &&
    !hasAnyGap(strategy, ["low_tag_sources", "payoff_without_enablers", "low_punish_payoff_density"])
  );
}

function damagePressureReady(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return (
    strategy.status === "complete" &&
    !hasAnyGap(strategy, ["payoff_without_enablers", "low_punish_payoff_density"])
  );
}

function hasStrategyAnchor(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return strategy.anchorEvidenceCount > 0 || strategy.anchorScore > 0;
}

function hasCoverageGap(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return hasAnyGap(strategy, [
    "missing_wall_coverage",
    "missing_code_gate_coverage",
    "weak_sentry_coverage",
    "weak_breaker_coverage",
  ]);
}

function hasCentralDefenseGap(
  strategy: DeckDoctrineV2StrategyDiagnostic,
  central: "hq" | "rnd",
): boolean {
  return strategy.supportGaps.some((gap) => {
    if (central === "hq") return gapHasTerm(gap, "hq");
    return gapHasTerm(gap, "rnd") || gapHasTerm(gap, "rd");
  });
}

function hasAnyGap(
  strategy: DeckDoctrineV2StrategyDiagnostic,
  gaps: readonly string[],
): boolean {
  return strategy.supportGaps.some((gap) =>
    gaps.some((blocked) => gap === blocked),
  );
}

function gapHasTerm(gap: string, term: string): boolean {
  const termSet = new Set(gap
    .toLowerCase()
    .split(/[._:-]+/)
    .filter(Boolean));
  return termSet.has(term);
}

function goal(
  goalId: string,
  family: string,
  priority: number,
  urgency: NonNullable<TacticalGoalLike["urgency"]>,
  evidence: readonly string[],
): TacticalGoalLike {
  return {
    goalId,
    family,
    priority,
    urgency,
    source: "deck",
    evidence,
  };
}

function dedupeGoals(goals: readonly TacticalGoalLike[]): TacticalGoalLike[] {
  const byId = new Map<string, TacticalGoalLike>();
  for (const goal of goals) byId.set(goal.goalId, goal);
  return [...byId.values()].sort(
    (left, right) =>
      right.priority - left.priority || left.goalId.localeCompare(right.goalId),
  );
}
