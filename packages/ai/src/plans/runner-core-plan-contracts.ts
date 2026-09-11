import type { RunnerCreditBankSignal } from "../runner/credit-bank/credit-bank-types";
import type { RunnerDefenseSignals } from "../runner/defense-recovery/defense-types";
import type { RunnerInstalledCardLiquidationChoiceSignal } from "../runner/economy/economy-types";
import type { RunnerInstalledAgendaScoreSignal } from "../runner/installed-agenda/installed-agenda-types";
import type { RunnerRecurringEconomySignal } from "../runner/recurring-economy/recurring-economy-types";
import type { RunnerResourceLifecycleSignal } from "../runner/resource-lifecycle/resource-lifecycle-types";
import type { RunnerShellTradersPipelineSignal } from "../runner/shell-traders/shell-traders-types";
import { type RunnerCoverageGapSignal } from "./runner-coverage-contracts";
import type { RunnerFundingNeedSignal } from "./runner-funding-contracts";

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
