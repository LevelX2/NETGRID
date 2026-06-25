import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { RunnerLoanRunFundingContext } from "./runner-loan-run-funding-context";

export type RunnerLoanRuntimeContext = {
  desiredCreditReserve: number;
  contestReserve: number;
  runFunding: RunnerLoanRunFundingContext;
  evidence: string[];
};

type RunnerLoanEconomyPosture = {
  desiredCreditReserve: number;
  creditReservePolicy: {
    contestReserve: number;
  };
  recommendation: string;
  creditBasePlan: {
    recommendation: string;
    usefulHandCardsBlockedByCredits: number;
  };
  fundingNeed: boolean;
};

export type RunnerLoanRuntimeContextDependencies<
  TDeckCapabilities,
  TStrategicIntent,
  THandDevelopmentEvaluation,
> = {
  deckCapabilitiesForInput: (input: AiDecisionInput) => TDeckCapabilities;
  strategicIntentForInput: (
    input: AiDecisionInput,
    deckCapabilities: TDeckCapabilities,
  ) => TStrategicIntent;
  handDevelopmentEvaluations: (params: {
    input: AiDecisionInput;
    deckCapabilities: TDeckCapabilities;
    strategicIntent: TStrategicIntent;
  }) => readonly THandDevelopmentEvaluation[];
  economyPosture: (params: {
    input: AiDecisionInput;
    deckCapabilities: TDeckCapabilities;
    strategicIntent: TStrategicIntent;
    handDevelopmentEvaluations: readonly THandDevelopmentEvaluation[];
  }) => RunnerLoanEconomyPosture;
  runTargets: (params: {
    input: AiDecisionInput;
    deckCapabilities: TDeckCapabilities;
    strategicIntent: TStrategicIntent;
    handDevelopmentEvaluations: readonly THandDevelopmentEvaluation[];
  }) => readonly RunnerRunTargetEvaluation[];
  runFundingContext: (params: {
    input: AiDecisionInput;
    runTargets: readonly RunnerRunTargetEvaluation[];
    creditsAfterLoan: number;
    desiredCreditReserve: number;
    contestReserve: number;
  }) => RunnerLoanRunFundingContext;
};

export function runnerLoanRuntimeContext<
  TDeckCapabilities,
  TStrategicIntent,
  THandDevelopmentEvaluation,
>(
  input: AiDecisionInput,
  creditsAfterLoan: number,
  dependencies: RunnerLoanRuntimeContextDependencies<
    TDeckCapabilities,
    TStrategicIntent,
    THandDevelopmentEvaluation
  >,
): RunnerLoanRuntimeContext {
  const deckCapabilities = dependencies.deckCapabilitiesForInput(input);
  const strategicIntent = dependencies.strategicIntentForInput(
    input,
    deckCapabilities,
  );
  const handDevelopmentEvaluations =
    dependencies.handDevelopmentEvaluations({
      input,
      deckCapabilities,
      strategicIntent,
    });
  const economyPosture = dependencies.economyPosture({
    input,
    deckCapabilities,
    strategicIntent,
    handDevelopmentEvaluations,
  });
  const runTargets = dependencies.runTargets({
    input,
    deckCapabilities,
    strategicIntent,
    handDevelopmentEvaluations,
  });
  const runFunding = dependencies.runFundingContext({
    input,
    runTargets,
    creditsAfterLoan,
    desiredCreditReserve: economyPosture.desiredCreditReserve,
    contestReserve: economyPosture.creditReservePolicy.contestReserve,
  });
  return {
    desiredCreditReserve: economyPosture.desiredCreditReserve,
    contestReserve: economyPosture.creditReservePolicy.contestReserve,
    runFunding,
    evidence: [
      `loanRuntimeEconomyRecommendation:${economyPosture.recommendation}`,
      `loanRuntimeCreditBase:${economyPosture.creditBasePlan.recommendation}`,
      `loanRuntimeFundingNeed:${economyPosture.fundingNeed}`,
      `loanRuntimeHandBlocked:${economyPosture.creditBasePlan.usefulHandCardsBlockedByCredits}`,
    ],
  };
}
