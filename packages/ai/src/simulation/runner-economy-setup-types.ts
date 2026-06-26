import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

const SHORT_TERM_CONTRACT_CARD_ID = "onr_v1_178_short-term-contract";
const LOAN_FROM_CHIBA_CARD_ID = "onr_v1_168_loan-from-chiba";
const MRAM_HAND_SIZE_CARD_IDS = new Set([
  "onr_v1_133_militech-mram-chip",
  "onr_v1_134_mram-chip",
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
  runAction: boolean;
  setupAction: boolean;
  installableBreaker: boolean;
  remoteTrashAvailable: boolean;
  advancedRemoteContestSkipped: boolean;
  freshPressureAvailable: boolean;
}): RunnerEconomySkipReason {
  if (context.advancedRemoteContestSkipped) return "remote_contest";
  if (
    context.action.type === "trash_accessed_card" ||
    context.remoteTrashAvailable
  )
    return "trash";
  if (context.installableBreaker && context.action.type === "install_card")
    return "install_breaker";
  if (context.setupAction) return "setup";
  if (context.draw) return "draw";
  if (context.runAction && context.freshPressureAvailable) return "pressure";
  if (context.runAction) return "run";
  if (context.action.type === "end_turn") return "end_turn";
  return "unknown_higher_priority";
}

export function runnerEconomySubcounts(
  classifications: RunnerEconomySetupActionClass[],
): RunnerEconomySubcounts {
  const count = (
    selector: (classification: RunnerEconomySetupActionClass) => boolean,
  ) => classifications.filter(selector).length;
  return {
    ...(count((classification) => classification.burstEconomy) > 0
      ? {
          runnerLegalBurstEconomyActions: count(
            (classification) => classification.burstEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.actionEconomy) > 0
      ? {
          runnerLegalActionEconomyActions: count(
            (classification) => classification.actionEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.finitePoolEconomy) > 0
      ? {
          runnerLegalFinitePoolEconomyActions: count(
            (classification) => classification.finitePoolEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.loanDebtEconomy) > 0
      ? {
          runnerLegalLoanDebtEconomyActions: count(
            (classification) => classification.loanDebtEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.recurringEconomy) > 0
      ? {
          runnerLegalRecurringEconomyActions: count(
            (classification) => classification.recurringEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.resourceEconomy) > 0
      ? {
          runnerLegalResourceEconomyActions: count(
            (classification) => classification.resourceEconomy,
          ),
        }
      : {}),
    ...(count((classification) => classification.hardwareEconomy) > 0
      ? {
          runnerLegalHardwareEconomyActions: count(
            (classification) => classification.hardwareEconomy,
          ),
        }
      : {}),
  };
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
  const isLoanFromChiba = definitionId === LOAN_FROM_CHIBA_CARD_ID;
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
    roles.some(
      (role) =>
        role.includes("hand_size") ||
        role.includes("damage_resilience") ||
        role.includes("damage_prevention"),
    ) ||
    mechanics.some(
      (mechanic: string) =>
        mechanic.includes("hand") || mechanic.includes("damage_prevention"),
    );
  const memoryHardware =
    !handSizeSupport &&
    action.type === "install_card" &&
    (roles.includes("memory") ||
      roles.includes("memory_support") ||
      mechanics.some((mechanic: string) => mechanic.includes("memory")));
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
        roles.some(
          (role) => role.includes("finite") || role.includes("pool"),
        ) ||
        mechanics.some(
          (mechanic: string) =>
            mechanic.includes("counter") ||
            mechanic.includes("resource_action"),
        )),
    loanDebtEconomy:
      economy &&
      (isLoanFromChiba ||
        roles.some((role) => role.includes("loan") || role.includes("debt"))),
    recurringEconomy:
      economy &&
      roles.some((role) => role.includes("recurring") || role.includes("drip")),
    resourceEconomy: economy && definition?.type === "resource",
    hardwareEconomy: economy && definition?.type === "hardware",
    memoryHardware,
    handSizeSupport,
    search,
    recovery,
    downsideEconomy:
      economy &&
      (isLoanFromChiba ||
        roles.some(
          (role) =>
            role.includes("risk") ||
            role.includes("downside") ||
            role.includes("penalty") ||
            role.includes("tag"),
        )),
    delayedPenaltyEconomy:
      economy &&
      (isLoanFromChiba ||
        roles.some(
          (role) => role.includes("delayed") || role.includes("penalty"),
        )),
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
