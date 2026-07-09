import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { runnerBasicActionPenaltyScoreComponents } from "./runner-basic-action-penalty-score";
import {
  runnerCreditNeedScoreComponents,
  type RunnerCreditNeedScoreDependencies,
} from "./runner-credit-need-score";
import {
  runnerCreditYieldScoreComponent,
  type RunnerCreditYieldScoreDependencies,
} from "./runner-credit-yield-score";
import { runnerDamageThreatRunScoreComponent } from "../runner-damage-threat-assessment";
import { runnerEncounterBreakScoreComponents } from "./runner-encounter-break-score";
import {
  runnerFollowupScoreComponents,
  type RunnerFollowupScoreDependencies,
} from "./runner-followup-score";
import {
  runnerInstallScoreComponents,
  type RunnerInstallScoreDependencies,
} from "./runner-install-score";
import {
  runnerLoanLiabilityScoreComponent,
  type RunnerLoanLiabilityScoreAssessment,
} from "./runner-loan-liability-score";
import {
  runnerRecoveryCommitmentScoreComponents,
  type RunnerRecoveryCommitmentScoreDependencies,
} from "./runner-recovery-commitment-score";
import {
  runnerSemanticGoalFitScoreComponent,
  type RunnerGoalFitScoreDependencies,
} from "./runner-goal-fit-score";
import {
  runnerStartRunScoreComponents,
  type RunnerStartRunScoreDependencies,
} from "./runner-start-run-score";
import {
  runnerDirectTagCleanupFallbackScoreComponent,
  runnerTagCleanupScoreComponent,
} from "./runner-tag-cleanup-score";

export type RunnerScoreComponentsDependencies = {
  loanLiabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerLoanLiabilityScoreAssessment | undefined;
  creditYield: RunnerCreditYieldScoreDependencies;
  goalFit: RunnerGoalFitScoreDependencies;
  handFundingTarget: RunnerCreditNeedScoreDependencies["handFundingTarget"];
  recoveryCommitment: RunnerRecoveryCommitmentScoreDependencies;
  install: RunnerInstallScoreDependencies;
  startRun: RunnerStartRunScoreDependencies;
  followup: RunnerFollowupScoreDependencies;
};

export type RunnerScoreComponentsContext = {
  semanticRuntimeRunnerScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => AiDecisionScoreComponent[];
};

export function createRunnerScoreComponentsContext(
  dependencies: RunnerScoreComponentsDependencies,
): RunnerScoreComponentsContext {
  function semanticRuntimeRunnerScoreComponents(
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ): AiDecisionScoreComponent[] {
    return runnerScoreComponents(
      input,
      action,
      scopeId,
      actionSemanticCandidate,
      dependencies,
    );
  }

  return { semanticRuntimeRunnerScoreComponents };
}

export function runnerScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: RunnerScoreComponentsDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const loanLiabilityAssessment = dependencies.loanLiabilityAssessment(
    input,
    action,
  );
  const loanLiabilityComponent = runnerLoanLiabilityScoreComponent(
    loanLiabilityAssessment,
  );
  if (loanLiabilityComponent) components.push(loanLiabilityComponent);
  const tagCleanup = runnerTagCleanupScoreComponent(
    input,
    action,
    actionSemanticCandidate,
  );
  if (tagCleanup) components.push(tagCleanup);
  const goalFit = runnerSemanticGoalFitScoreComponent(
    input,
    action,
    scopeId,
    actionSemanticCandidate,
    dependencies.goalFit,
  );
  if (goalFit) components.push(goalFit);
  const tagCleanupFallback = runnerDirectTagCleanupFallbackScoreComponent(
    input,
    action,
    tagCleanup,
  );
  if (tagCleanupFallback) components.push(tagCleanupFallback);
  const creditYield = runnerCreditYieldScoreComponent(
    input,
    action,
    dependencies.creditYield,
  );
  if (creditYield) components.push(creditYield);
  components.push(
    ...runnerCreditNeedScoreComponents(input, action, {
      handFundingTarget: dependencies.handFundingTarget,
    }),
  );
  components.push(
    ...runnerRecoveryCommitmentScoreComponents(
      input,
      action,
      dependencies.recoveryCommitment,
    ),
  );
  components.push(
    ...runnerInstallScoreComponents(
      input,
      action,
      {
        loanInstallAction: loanLiabilityAssessment?.loanInstallAction === true,
      },
      dependencies.install,
    ),
  );
  const damageThreatRunRisk = runnerDamageThreatRunScoreComponent(
    input,
    action,
  );
  if (damageThreatRunRisk) components.push(damageThreatRunRisk);
  components.push(
    ...runnerStartRunScoreComponents(input, action, dependencies.startRun),
  );
  components.push(...runnerEncounterBreakScoreComponents(input, action));
  components.push(
    ...runnerFollowupScoreComponents(input, action, dependencies.followup),
  );
  components.push(
    ...runnerBasicActionPenaltyScoreComponents(input, action, scopeId),
  );
  return components;
}
