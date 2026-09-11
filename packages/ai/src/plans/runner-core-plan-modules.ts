import { createRunnerCoverageModule } from "../runner/rig-coverage/coverage-plan-module";
import { createRunnerEconomyModule } from "../runner/economy/economy-plan-module";
import type { RunnerInstalledCardLiquidationChoiceSignal } from "../runner/economy/economy-types";
import { createRunnerDefenseModule } from "../runner/defense-recovery/defense-plan-module";
import type { RunnerDefenseSignals } from "../runner/defense-recovery/defense-types";
import { type RunnerCoverageGapSignal } from "./runner-coverage-contracts";
import type { RunnerShellTradersPipelineSignal } from "../runner/shell-traders/shell-traders-types";
import { createRunnerShellTradersPipelineModule } from "../runner/shell-traders/shell-traders-plan-module";
import type { RunnerInstalledAgendaScoreSignal } from "../runner/installed-agenda/installed-agenda-types";
import { createRunnerInstalledAgendaScoreModule } from "../runner/installed-agenda/installed-agenda-plan-module";
import type { RunnerFundingNeedSignal } from "./runner-funding-contracts";
import type { RunnerResourceLifecycleSignal } from "../runner/resource-lifecycle/resource-lifecycle-types";
import { createRunnerResourceLifecycleModule } from "../runner/resource-lifecycle/resource-lifecycle-plan-module";
import type { RunnerRecurringEconomySignal } from "../runner/recurring-economy/recurring-economy-types";
import { createRunnerRecurringEconomyModule } from "../runner/recurring-economy/recurring-economy-plan-module";
import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import type { PlanModule } from "./plan-scheduler";
import type { RunnerCreditBankSignal } from "../runner/credit-bank/credit-bank-types";
import { createRunnerCreditBankModule } from "../runner/credit-bank/credit-bank-plan-module";
export type RunnerCorePlanDomain = {
  fundingNeeds: RunnerFundingNeedSignal[];
  coverageGaps: RunnerCoverageGapSignal[];
  defense: RunnerDefenseSignals;
  creditBanks: RunnerCreditBankSignal[];
  recurringEconomy?: RunnerRecurringEconomySignal[];
  installedCardLiquidationChoices?: RunnerInstalledCardLiquidationChoiceSignal[];
  installedAgendaScores?: RunnerInstalledAgendaScoreSignal[];
  resourceLifecycle?: RunnerResourceLifecycleSignal[];
  shellTradersPipelines?: RunnerShellTradersPipelineSignal[];
};

export type RunnerCorePlanDependencies = {
  rolesForDefinitionId?: (definitionId: string) => readonly string[];
};

export function createRunnerCorePlanModules(
  dependencies: RunnerCorePlanDependencies = {},
): PlanModule[] {
  const rolesForDefinitionId =
    dependencies.rolesForDefinitionId ?? rolesForDeckDoctrineCard;
  return [
    createRunnerInstalledAgendaScoreModule(),
    createRunnerShellTradersPipelineModule(),
    createRunnerResourceLifecycleModule(),
    createRunnerCreditBankModule(),
    createRunnerRecurringEconomyModule(),
    createRunnerEconomyModule(),
    createRunnerCoverageModule(rolesForDefinitionId),
    createRunnerDefenseModule(),
  ];
}
