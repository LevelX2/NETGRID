import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import type { AiCardHint } from "../ai-hints";
import {
  runnerLoanLiabilityAssessment,
  type RunnerLoanLiabilityAssessment,
} from "./runner-loan-liability-assessment";
import {
  runnerLoanAllowedReason,
  runnerLoanBlockedReason,
  runnerLoanDebtRepaymentRisk,
  runnerLoanLiabilityScoreValue,
  runnerLoanLiabilitySeverity,
  runnerLoanUseCase,
} from "./runner-loan-liability-policy";
import {
  runnerInstalledLoanActionSpend,
  runnerLoanProjectedSpendAfterLoan,
} from "./runner-loan-projected-spend";
import { runnerLoanRunFundingContext } from "./runner-loan-run-funding-context";
import { runnerLoanRuntimeContext } from "./runner-loan-runtime-context";
import type { RunnerLoanRuntimeContextDependencies } from "./runner-loan-runtime-context";
import {
  runnerDefinitionIsHighRiskLoan,
  runnerInstalledLoanCards,
  runnerLoanDefinitionIdForAction,
  runnerLoanSemanticEvidence,
  runnerLoanValueHint,
} from "./runner-loan-source";
import {
  runnerLoanSpendCandidateKind,
  runnerLoanSpendKindRank,
} from "./runner-loan-spend-candidate";
import {
  runnerLoanGamePhase,
  runnerLoanResourceTrashRisk,
} from "./runner-loan-state-context";
import {
  runnerLoanCriticalBreakerFundingNeed,
  runnerLoanEmergencyFundingNeed,
} from "./runner-loan-funding-need";

export type RunnerLoanContextDependencies<
  TDeckCapabilities,
  TStrategicIntent,
  THandDevelopmentEvaluation,
> = Omit<
  RunnerLoanRuntimeContextDependencies<
    TDeckCapabilities,
    TStrategicIntent,
    THandDevelopmentEvaluation
  >,
  "runFundingContext"
> & {
  highRiskLoanDefinitionId: string;
  hintForDefinitionId: (definitionId: string) => AiCardHint | undefined;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  projectedCreditGainForAction: (action: LegalAction) => number;
  actionCreditCost: (action: LegalAction) => number;
  actionClickCost: (action: LegalAction) => number;
  visibleCardPlayOrInstallCost: (card: VisibleCard) => number;
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  cardAddressesVisibleBreakerNeed: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
  isRunnerPressureRole: (role: string) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  hasKnownUnaffordableLegalRun: (input: AiDecisionInput) => boolean;
};

export type RunnerLoanContext = {
  runnerLoanLiabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerLoanLiabilityAssessment | undefined;
};

export function createRunnerLoanContext<
  TDeckCapabilities,
  TStrategicIntent,
  THandDevelopmentEvaluation,
>(
  dependencies: RunnerLoanContextDependencies<
    TDeckCapabilities,
    TStrategicIntent,
    THandDevelopmentEvaluation
  >,
): RunnerLoanContext {
  function loanDefinitionIdForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): string | undefined {
    return runnerLoanDefinitionIdForAction(input, action, {
      highRiskLoanDefinitionId: dependencies.highRiskLoanDefinitionId,
      hintForDefinitionId: dependencies.hintForDefinitionId,
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    });
  }

  function definitionIsHighRiskLoan(
    definitionId: string | undefined,
  ): boolean {
    return runnerDefinitionIsHighRiskLoan(definitionId, {
      highRiskLoanDefinitionId: dependencies.highRiskLoanDefinitionId,
      hintForDefinitionId: dependencies.hintForDefinitionId,
    });
  }

  function installedLoanCards(input: AiDecisionInput): VisibleCard[] {
    return runnerInstalledLoanCards(input, {
      highRiskLoanDefinitionId: dependencies.highRiskLoanDefinitionId,
      hintForDefinitionId: dependencies.hintForDefinitionId,
    });
  }

  function loanSemanticEvidence(
    definitionId: string | undefined,
  ): string[] | undefined {
    return runnerLoanSemanticEvidence(definitionId, {
      hintForDefinitionId: dependencies.hintForDefinitionId,
    });
  }

  return {
    runnerLoanLiabilityAssessment: (input, action) =>
      runnerLoanLiabilityAssessment(input, action, {
        loanDefinitionIdForAction,
        installedLoanCards,
        valueHint: (definitionId, key, fallback) =>
          runnerLoanValueHint(
            definitionId
              ? dependencies.hintForDefinitionId(definitionId)
              : undefined,
            key,
            fallback,
          ),
        projectedCreditGainForAction: dependencies.projectedCreditGainForAction,
        actionCreditCost: dependencies.actionCreditCost,
        runtimeContext: (input, creditsAfterLoan) =>
          runnerLoanRuntimeContext(input, creditsAfterLoan, {
            deckCapabilitiesForInput: dependencies.deckCapabilitiesForInput,
            strategicIntentForInput: dependencies.strategicIntentForInput,
            handDevelopmentEvaluations:
              dependencies.handDevelopmentEvaluations,
            economyPosture: dependencies.economyPosture,
            runTargets: dependencies.runTargets,
            runFundingContext: runnerLoanRunFundingContext,
          }),
        projectedSpendAfterLoan: (input, loanAction, creditsAfterLoan) =>
          runnerLoanProjectedSpendAfterLoan(
            input,
            loanAction,
            creditsAfterLoan,
            {
              actionClickCost: dependencies.actionClickCost,
              actionCreditCost: dependencies.actionCreditCost,
              projectedCreditGainForAction:
                dependencies.projectedCreditGainForAction,
              definitionIsHighRiskLoan,
              visibleCardPlayOrInstallCost:
                dependencies.visibleCardPlayOrInstallCost,
              rolesForCardId: dependencies.rolesForCardId,
              spendCandidateKind: (input, card, roles) =>
                runnerLoanSpendCandidateKind(input, card, roles, {
                  cardAddressesVisibleBreakerNeed:
                    dependencies.cardAddressesVisibleBreakerNeed,
                  isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
                  isRunnerPressureRole: dependencies.isRunnerPressureRole,
                }),
              spendKindRank: runnerLoanSpendKindRank,
            },
          ),
        installedLoanActionSpend: (action) =>
          runnerInstalledLoanActionSpend(action, {
            actionCreditCost: dependencies.actionCreditCost,
            projectedCreditGainForAction:
              dependencies.projectedCreditGainForAction,
          }),
        gamePhase: runnerLoanGamePhase,
        resourceTrashRisk: runnerLoanResourceTrashRisk,
        criticalBreakerFundingNeed: (
          input,
          creditsAfterLoan,
          remoteThreatVisible,
        ) =>
          runnerLoanCriticalBreakerFundingNeed(
            input,
            creditsAfterLoan,
            remoteThreatVisible,
            {
              rolesForCardId: dependencies.rolesForCardId,
              cardAddressesVisibleBreakerNeed:
                dependencies.cardAddressesVisibleBreakerNeed,
              visibleCardPlayOrInstallCost:
                dependencies.visibleCardPlayOrInstallCost,
            },
          ),
        emergencyFundingNeed: (input, desiredCreditReserve) =>
          runnerLoanEmergencyFundingNeed(input, desiredCreditReserve, {
            rolesForAction: dependencies.rolesForAction,
            isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
            hasKnownUnaffordableLegalRun:
              dependencies.hasKnownUnaffordableLegalRun,
          }),
        useCase: (params) =>
          runnerLoanUseCase(params, {
            projectedCreditGainForAction:
              dependencies.projectedCreditGainForAction,
            actionCreditCost: dependencies.actionCreditCost,
          }),
        debtRepaymentRisk: runnerLoanDebtRepaymentRisk,
        liabilitySeverity: runnerLoanLiabilitySeverity,
        scoreValue: (params) =>
          runnerLoanLiabilityScoreValue(params, {
            projectedCreditGainForAction:
              dependencies.projectedCreditGainForAction,
            actionCreditCost: dependencies.actionCreditCost,
          }),
        allowedReason: runnerLoanAllowedReason,
        blockedReason: runnerLoanBlockedReason,
        semanticEvidence: loanSemanticEvidence,
      }),
  };
}
