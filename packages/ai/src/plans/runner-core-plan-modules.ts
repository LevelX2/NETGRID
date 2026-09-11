import { rolesForDeckDoctrineCard } from "../deck-doctrine-card-roles";
import { createRunnerCreditBankModule } from "../runner/credit-bank/credit-bank-plan-module";
import { createRunnerDefenseModule } from "../runner/defense-recovery/defense-plan-module";
import { createRunnerEconomyModule } from "../runner/economy/economy-plan-module";
import { createRunnerInstalledAgendaScoreModule } from "../runner/installed-agenda/installed-agenda-plan-module";
import { createRunnerRecurringEconomyModule } from "../runner/recurring-economy/recurring-economy-plan-module";
import { createRunnerResourceLifecycleModule } from "../runner/resource-lifecycle/resource-lifecycle-plan-module";
import { createRunnerCoverageModule } from "../runner/rig-coverage/coverage-plan-module";
import { createRunnerShellTradersPipelineModule } from "../runner/shell-traders/shell-traders-plan-module";
import type { PlanModule } from "./plan-scheduler";

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
