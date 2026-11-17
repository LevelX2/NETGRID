import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { rolesMatch } from "../role-match";
import { runnerDebtFinancingProfile } from "../runtime/runner-canonical-card-facts";

const SHORT_TERM_CONTRACT_CARD_ID = 390;
const MRAM_HAND_SIZE_CARD_IDS = new Set([
  345,
  346,
]);

type RunnerEconomySetupDefinition = {
  type?: string;
  mechanics?: unknown;
};

type RunnerEconomySetupActionClassDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  definitionForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEconomySetupDefinition | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerCoverageSearchActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerCoverageRecoveryActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export type RunnerEconomySetupActionClass = {
  economy: boolean;
  burstEconomy: boolean;
  actionEconomy: boolean;
  finitePoolEconomy: boolean;
  loanDebtEconomy: boolean;
  recurringEconomy: boolean;
  resourceEconomy: boolean;
  hardwareEconomy: boolean;
  memoryHardware: boolean;
  handSizeSupport: boolean;
  search: boolean;
  recovery: boolean;
  downsideEconomy: boolean;
  delayedPenaltyEconomy: boolean;
};

export type RunnerEconomySubcounts = Partial<{
  runnerLegalBurstEconomyActions: number;
  runnerLegalActionEconomyActions: number;
  runnerLegalFinitePoolEconomyActions: number;
  runnerLegalLoanDebtEconomyActions: number;
  runnerLegalRecurringEconomyActions: number;
  runnerLegalResourceEconomyActions: number;
  runnerLegalHardwareEconomyActions: number;
}>;

export type RunnerEconomySkipReason =
  | "pressure"
  | "remote_contest"
  | "setup"
  | "draw"
  | "run"
  | "install_breaker"
  | "trash"
  | "end_turn"
  | "unknown_higher_priority";

export function runnerEconomySkipReasonForDiagnostics(context: {
  action: LegalAction;
  draw: boolean;
  setupAction: boolean;
  installsBreaker: boolean;
  advancedRemoteContestTaken: boolean;
  pressureAction: boolean;
  runStarted: boolean;
}): RunnerEconomySkipReason {
  if (context.advancedRemoteContestTaken) return "remote_contest";
  if (context.action.type === "trash_accessed_card") return "trash";
  if (context.installsBreaker) return "install_breaker";
  if (context.setupAction) return "setup";
  if (context.draw) return "draw";
  if (context.pressureAction) return "pressure";
  if (context.runStarted) return "run";
  if (context.action.type === "end_turn") return "end_turn";
  return "unknown_higher_priority";
}

const runnerEconomySubcountKeys = {
  burstEconomy: "runnerLegalBurstEconomyActions",
  actionEconomy: "runnerLegalActionEconomyActions",
  finitePoolEconomy: "runnerLegalFinitePoolEconomyActions",
  loanDebtEconomy: "runnerLegalLoanDebtEconomyActions",
  recurringEconomy: "runnerLegalRecurringEconomyActions",
  resourceEconomy: "runnerLegalResourceEconomyActions",
  hardwareEconomy: "runnerLegalHardwareEconomyActions",
} as const satisfies Partial<
  Record<keyof RunnerEconomySetupActionClass, keyof RunnerEconomySubcounts>
>;

export function runnerEconomySubcounts(
  classifications: readonly RunnerEconomySetupActionClass[],
): RunnerEconomySubcounts {
  const counts: RunnerEconomySubcounts = {};
  const keys = Object.keys(
    runnerEconomySubcountKeys,
  ) as (keyof typeof runnerEconomySubcountKeys)[];
  for (const classification of classifications) {
    for (const key of keys) {
      if (!classification[key]) continue;
      const countKey = runnerEconomySubcountKeys[key];
      counts[countKey] = (counts[countKey] ?? 0) + 1;
    }
  }
  return counts;
}

export function runnerEconomySetupActionClass(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerEconomySetupActionClassDependencies,
): RunnerEconomySetupActionClass {
  const definitionId = dependencies.sourceDefinitionIdForAction(input, action);
  const definition = dependencies.definitionForAction(input, action);
  const roles = dependencies.rolesForAction(input, action);
  const mechanics =
    definition &&
    "mechanics" in definition &&
    Array.isArray(definition.mechanics)
      ? (definition.mechanics as string[])
      : [];
  const isShortTermContract = definitionId === SHORT_TERM_CONTRACT_CARD_ID;
  const debtFinancing = runnerDebtFinancingProfile(definitionId) !== undefined;
  const isMramHandSize =
    definitionId !== undefined && MRAM_HAND_SIZE_CARD_IDS.has(definitionId);
  const economy = dependencies.isRunnerEconomyAction(input, action);
  const search = dependencies.runnerCoverageSearchActionForMetrics(
    input,
    action,
  );
  const recovery = dependencies.runnerCoverageRecoveryActionForMetrics(
    input,
    action,
  );
  const handSizeSupport =
    isMramHandSize ||
    rolesMatch(roles, [
      "hand_size",
      "damage_resilience",
      "damage_prevention",
    ]) ||
    rolesMatch(mechanics, ["hand", "damage_prevention"]);
  const memoryHardware =
    !handSizeSupport &&
    action.type === "install_card" &&
    (rolesMatch(roles, ["memory", "memory_support"]) ||
      rolesMatch(mechanics, ["memory"]));
  return {
    economy,
    burstEconomy: economy && action.type === "play_event",
    actionEconomy:
      economy &&
      (action.type === "gain_credit" ||
        action.type === "trigger_ability" ||
        action.type === "activated_card_ability"),
    finitePoolEconomy:
      economy &&
      (isShortTermContract ||
        rolesMatch(roles, ["finite", "pool"]) ||
        rolesMatch(mechanics, ["counter", "resource_action"])),
    loanDebtEconomy:
      economy && (debtFinancing || rolesMatch(roles, ["loan", "debt"])),
    recurringEconomy: economy && rolesMatch(roles, ["recurring", "drip"]),
    resourceEconomy: economy && definition?.type === "resource",
    hardwareEconomy: economy && definition?.type === "hardware",
    memoryHardware,
    handSizeSupport,
    search,
    recovery,
    downsideEconomy:
      economy &&
      (debtFinancing ||
        rolesMatch(roles, ["risk", "downside", "penalty", "tag"])),
    delayedPenaltyEconomy:
      economy && (debtFinancing || rolesMatch(roles, ["delayed", "penalty"])),
  };
}

export function createRunnerEconomySetupActionClassContext(
  dependencies: RunnerEconomySetupActionClassDependencies,
): (
  input: AiDecisionInput,
  action: LegalAction,
) => RunnerEconomySetupActionClass {
  return (input, action) =>
    runnerEconomySetupActionClass(input, action, dependencies);
}
