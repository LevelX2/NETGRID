import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { persistentDevelopmentActionProjection } from "../actions/persistent-development-action";
import {
  runnerBasicActionPenaltyScoreComponents,
  type RunnerBasicActionPenaltyScoreDependencies,
} from "./runner-basic-action-penalty-score";
import { runnerActivatedAgendaScoreComponents } from "./runner-activated-agenda-score";
import {
  runnerDamageLockedHandScoreComponents,
  runnerDamageThreatRunScoreComponent,
  runnerKnownAccessDamageScoreComponent,
} from "../runner-damage-threat-assessment";
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
import { runnerDrawTaxLiabilityScoreComponent } from "./runner-draw-tax-liability-score";
import { runnerTerminalRemoteToolScoreComponent } from "./runner-terminal-remote-tool-score";
import {
  runnerRunLockReleaseScoreComponent,
  runnerSpeculativeRunLockReleaseScoreComponent,
} from "./runner-run-lock-release-score";
import { runnerDrawOverflowScoreComponent } from "./runner-draw-overflow-score";
import { runnerHandOverflowReliefScoreComponent } from "./runner-hand-overflow-relief-score";
import { runnerHostedInstallScoreComponent } from "./runner-hosted-install-score";
import { economyRuntimeScoreComponents } from "./economy-score-components";
import type { CreditDemand } from "../plans/credit-demand";

export type RunnerScoreComponentsDependencies = {
  loanLiabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerLoanLiabilityScoreAssessment | undefined;
  goalFit: RunnerGoalFitScoreDependencies;
  recoveryCommitment: RunnerRecoveryCommitmentScoreDependencies;
  install: RunnerInstallScoreDependencies;
  startRun: RunnerStartRunScoreDependencies;
  followup: RunnerFollowupScoreDependencies;
  encounterActionIsViable: RunnerBasicActionPenaltyScoreDependencies["encounterActionIsViable"];
};

export type RunnerScoreComponentsContext = {
  semanticRuntimeRunnerScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
    creditDemands?: readonly CreditDemand[],
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
    creditDemands: readonly CreditDemand[] = [],
  ): AiDecisionScoreComponent[] {
    return runnerScoreComponents(
      input,
      action,
      scopeId,
      actionSemanticCandidate,
      dependencies,
      creditDemands,
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
  creditDemands: readonly CreditDemand[] = [],
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  components.push(
    ...economyRuntimeScoreComponents(actionSemanticCandidate, creditDemands),
  );
  components.push(...runnerActivatedAgendaScoreComponents(input, action));
  const runLockRelease = runnerRunLockReleaseScoreComponent(input, action);
  if (runLockRelease) components.push(runLockRelease);
  const speculativeRunLockRelease =
    runnerSpeculativeRunLockReleaseScoreComponent(input, action);
  if (speculativeRunLockRelease) components.push(speculativeRunLockRelease);
  const terminalRemoteTool = runnerTerminalRemoteToolScoreComponent(
    input,
    action,
    actionSemanticCandidate,
  );
  if (terminalRemoteTool) components.push(terminalRemoteTool);
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
  const drawTaxLiability = runnerDrawTaxLiabilityScoreComponent(input, action);
  if (drawTaxLiability) components.push(drawTaxLiability);
  const drawOverflow = runnerDrawOverflowScoreComponent(
    input,
    action,
    actionSemanticCandidate,
  );
  if (drawOverflow) components.push(drawOverflow);
  const handOverflowRelief = runnerHandOverflowReliefScoreComponent(
    input,
    action,
    actionSemanticCandidate,
  );
  if (handOverflowRelief) components.push(handOverflowRelief);
  components.push(
    ...runnerRecoveryCommitmentScoreComponents(
      input,
      action,
      dependencies.recoveryCommitment,
    ),
  );
  const hostedInstall = runnerHostedInstallScoreComponent(input, action);
  if (hostedInstall) components.push(hostedInstall);
  components.push(
    ...runnerInstallScoreComponents(
      input,
      action,
      {
        loanInstallAction: loanLiabilityAssessment?.loanInstallAction === true,
        semanticRiskKinds:
          actionSemanticCandidate?.risks.map((risk) => risk.kind) ?? [],
      },
      dependencies.install,
    ),
  );
  const persistentDevelopment = persistentDevelopmentActionProjection(action);
  if (
    action.type !== "install_card" &&
    persistentDevelopment?.appliesInstallFitNow === true
  ) {
    const delayedInstallFit =
      dependencies.install.persistentInstallFitScoreComponent(input, action);
    if (delayedInstallFit) components.push(delayedInstallFit);
  }
  const damageThreatRunRisk = runnerDamageThreatRunScoreComponent(
    input,
    action,
  );
  if (damageThreatRunRisk) components.push(damageThreatRunRisk);
  components.push(...runnerDamageLockedHandScoreComponents(input, action));
  const knownAccessDamage = runnerKnownAccessDamageScoreComponent(
    input,
    action,
  );
  if (knownAccessDamage) components.push(knownAccessDamage);
  components.push(
    ...runnerStartRunScoreComponents(input, action, dependencies.startRun),
  );
  components.push(...runnerEncounterBreakScoreComponents(input, action));
  components.push(
    ...runnerFollowupScoreComponents(input, action, dependencies.followup),
  );
  components.push(
    ...runnerBasicActionPenaltyScoreComponents(input, action, scopeId, {
      encounterActionIsViable: dependencies.encounterActionIsViable,
    }),
  );
  return components;
}
