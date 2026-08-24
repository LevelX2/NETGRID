import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { PlanModuleId } from "./plan-kernel-types";
import type { PlanActionDisposition } from "./plan-scheduler";
import {
  buildCorpTurnPlanningCoverageReport,
  type CorpTurnPlanningCoverageReport,
  type CorpTurnPlanningModuleCoverage,
} from "./corp-turn-planning-coverage";
import type {
  PlanningStateIdentity,
  TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";

export const RUNNER_TURN_PLANNING_COVERAGE_SCHEMA_VERSION =
  "runner-turn-planning-coverage-v1" as const;

export type RunnerTurnPlanningModuleCoverage = Pick<
  CorpTurnPlanningModuleCoverage,
  "moduleId" | "horizonCapability" | "semanticActionPatterns"
> & {
  ownerKind:
    | "economy"
    | "breaker"
    | "defense"
    | "development"
    | "run"
    | "multiaccess"
    | "agenda"
    | "resource"
    | "turn_completion";
};

const ECONOMY_SEMANTICS = [
  "economy.*",
  "draw.card",
  "install.card",
  "play.runner_event",
  "card_ability.*",
  "choice.resolve",
  "special_zone.*",
  "turn_flow.end_turn",
  "turn_flow.stop_restricted_action_sequence",
] as const;

const RUN_SEMANTICS = [
  "run.*",
  "access.*",
  "breaker.*",
  "icebreaker.*",
  "trace.*",
  "damage.*",
  "card_ability.*",
  "play.runner_event",
  "install.card",
  "draw.card",
  "choice.resolve",
  "economy.*",
  "turn_flow.end_turn",
  "turn_flow.stop_restricted_action_sequence",
] as const;

const DEVELOPMENT_SEMANTICS = [
  "draw.*",
  "install.card",
  "play.runner_event",
  "card_ability.*",
  "choice.resolve",
  "economy.*",
  "access.*",
  "search.*",
  "turn_flow.forgo_action",
  "turn_flow.end_turn",
  "turn_flow.stop_restricted_action_sequence",
] as const;

export const RUNNER_TURN_PLANNING_MODULE_COVERAGE: readonly RunnerTurnPlanningModuleCoverage[] =
  [
    {
      moduleId: "runner.shell_traders_pipeline",
      horizonCapability: "context_dependent",
      ownerKind: "resource",
      semanticActionPatterns: [
        "card.*",
        "card_ability.*",
        "special_zone.*",
        "choice.resolve",
      ],
    },
    {
      moduleId: "runner.resource_lifecycle",
      horizonCapability: "context_dependent",
      ownerKind: "resource",
      semanticActionPatterns: [
        ...ECONOMY_SEMANTICS,
        "trash.resources",
        "special_zone.*",
      ],
    },
    {
      moduleId: "runner.score_installed_agenda",
      horizonCapability: "campaign_capable",
      ownerKind: "agenda",
      semanticActionPatterns: [
        "score.agenda",
        "card_ability.*",
        "choice.resolve",
      ],
    },
    {
      moduleId: "runner.recurring_economy",
      horizonCapability: "context_dependent",
      ownerKind: "economy",
      semanticActionPatterns: [...ECONOMY_SEMANTICS],
    },
    {
      moduleId: "runner.credit_bank",
      horizonCapability: "context_dependent",
      ownerKind: "economy",
      semanticActionPatterns: [...ECONOMY_SEMANTICS],
    },
    {
      moduleId: "runner.economy",
      horizonCapability: "context_dependent",
      ownerKind: "economy",
      semanticActionPatterns: [...ECONOMY_SEMANTICS],
    },
    {
      moduleId: "runner.rig_and_coverage",
      horizonCapability: "context_dependent",
      ownerKind: "breaker",
      semanticActionPatterns: [...DEVELOPMENT_SEMANTICS, "tag.remove"],
    },
    {
      moduleId: "runner.defense_and_recovery",
      horizonCapability: "context_dependent",
      ownerKind: "defense",
      semanticActionPatterns: [
        ...DEVELOPMENT_SEMANTICS,
        ...RUN_SEMANTICS,
        "tag.*",
        "damage.*",
        "counter.*",
      ],
    },
    {
      moduleId: "runner.secure_terminal_win",
      horizonCapability: "campaign_capable",
      ownerKind: "run",
      semanticActionPatterns: [...RUN_SEMANTICS],
    },
    {
      moduleId: "runner.pressure_central",
      horizonCapability: "campaign_capable",
      ownerKind: "run",
      semanticActionPatterns: [...RUN_SEMANTICS],
    },
    {
      moduleId: "runner.contest_remote",
      horizonCapability: "campaign_capable",
      ownerKind: "run",
      semanticActionPatterns: [...RUN_SEMANTICS],
    },
    {
      moduleId: "runner.develop_board_and_hand",
      horizonCapability: "context_dependent",
      ownerKind: "development",
      semanticActionPatterns: [...DEVELOPMENT_SEMANTICS],
    },
    {
      moduleId: "runner.convert_run_window",
      horizonCapability: "context_dependent",
      ownerKind: "multiaccess",
      semanticActionPatterns: [...RUN_SEMANTICS],
    },
    {
      moduleId: "runner.complete_turn",
      horizonCapability: "current_turn_only",
      ownerKind: "turn_completion",
      semanticActionPatterns: ["turn_flow.end_turn"],
    },
  ] as const;

export const RUNNER_ENGINE_WINDOW_SEMANTIC_PATTERNS = [
  "choice.resolve",
  "run.*",
  "access.*",
  "breaker.*",
  "icebreaker.*",
  "trace.*",
  "damage.*",
  "turn_flow.forgo_action",
] as const;

export type RunnerTurnPlanningCoverageReport = Omit<
  CorpTurnPlanningCoverageReport,
  "schemaVersion"
> & {
  schemaVersion: typeof RUNNER_TURN_PLANNING_COVERAGE_SCHEMA_VERSION;
};

export function buildRunnerTurnPlanningCoverageReport(params: {
  input: Pick<AiDecisionInput, "side" | "playerView" | "legalActions">;
  stateIdentity: PlanningStateIdentity;
  candidates: readonly ActionSemanticCandidate[];
  heads: readonly TurnPlanningHeadCandidate[];
  dispositions: readonly PlanActionDisposition[];
  engineWindowActionIds: readonly string[];
}): RunnerTurnPlanningCoverageReport {
  const report = buildCorpTurnPlanningCoverageReport({
    ...params,
    configuration: {
      side: "runner",
      modules: RUNNER_TURN_PLANNING_MODULE_COVERAGE,
      engineWindowSemanticPatterns: RUNNER_ENGINE_WINDOW_SEMANTIC_PATTERNS,
      completeTurnModuleId: "runner.complete_turn",
    },
  });
  return {
    ...report,
    schemaVersion: RUNNER_TURN_PLANNING_COVERAGE_SCHEMA_VERSION,
  };
}

export function runnerTurnPlanningModuleCoverage(
  moduleId: PlanModuleId,
): RunnerTurnPlanningModuleCoverage | undefined {
  const coverage = RUNNER_TURN_PLANNING_MODULE_COVERAGE.find(
    (entry) => entry.moduleId === moduleId,
  );
  return coverage ? structuredClone(coverage) : undefined;
}

export function assertRunnerTurnPlanningModuleRegistry(
  registeredModuleIds: readonly PlanModuleId[],
): void {
  const declared = RUNNER_TURN_PLANNING_MODULE_COVERAGE.map(
    (entry) => entry.moduleId,
  ).sort();
  const registered = [...new Set(registeredModuleIds)].sort();
  if (
    declared.length !== registered.length ||
    declared.some((moduleId, index) => moduleId !== registered[index]) ||
    RUNNER_TURN_PLANNING_MODULE_COVERAGE.some(
      (entry) =>
        !entry.moduleId.startsWith("runner.") ||
        entry.semanticActionPatterns.length === 0 ||
        entry.semanticActionPatterns.includes("*"),
    )
  ) {
    throw new Error(
      `invalid_runner_turn_planning_module_registry:registered=${registered.join(",")}:declared=${declared.join(",")}`,
    );
  }
}
