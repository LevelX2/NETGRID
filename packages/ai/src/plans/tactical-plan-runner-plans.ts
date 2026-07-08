import type { LegalAction } from "@netgrid/shared";
import { accessOutcomeMemoryPlanEvidence } from "../access/access-outcome-memory";
import { evaluateKnownCentralAccessPayoff } from "../known-central-access-payoff";
import { evaluateKnownRemoteAccessPayoff } from "../known-remote-access-payoff";
import {
  bankBuildActions,
  bankPayoutActions,
  bankToolEvidence,
  largestBankPayout,
} from "./tactical-plan-bank-tools";
import { accessCommitmentPlanEvidence } from "./tactical-plan-access-commitment";
import {
  createPlanStep,
  createTacticalPlan,
} from "./tactical-plan-builders";
import {
  missingBreakerCoverageKind,
} from "./tactical-plan-breaker-coverage";
import {
  coveragePlanStatusForRequiredCoverage,
  deckCapabilityBlockersForRequiredCoverage,
  deckCapabilityEvidenceForRequiredCoverage,
} from "./tactical-plan-deck-coverage";
import {
  runnerPressureGoalForServer,
  runnerRemoteGoalForServer,
  runnerTacticalGoalEvidence,
  tacticalGoalEvidence,
  tacticalGoalPriorityBoost,
  tacticalGoalScoreBreakdown,
} from "./tactical-plan-goal-evidence";
import {
  remoteRunHasNoRootValue,
  runNeedsBreakerCoverage,
} from "./tactical-plan-run-reachability";
import {
  actionServerId,
  isCentralServer,
  isRemoteServer,
} from "./tactical-plan-server-targets";
import type { TacticalPlanCreditValueDependencies } from "./tactical-plan-action-values";
import {
  applyRunnerDrawOverflowAdjustments,
  runnerHandBufferPlans,
} from "./tactical-plan-runner-hand-buffer";
import { runnerCreditBasePlans } from "./tactical-plan-runner-credit-base";
import { runnerBreakerCoverageStep } from "./tactical-plan-runner-breaker-coverage-step";
import {
  assessRunnerPressureBudget,
  runnerAdjustedPlanPriority,
  runnerEconomyGoalPriority,
  runnerPressureProbeAllowance,
  runnerRunTargetCurrentStep,
  runnerRunTargetPlanEvidence,
  runnerRunTargetPlanScoreBreakdown,
  runnerRunTargetStepRationale,
} from "./tactical-plan-runner-run-targets";
import { runnerHandDevelopmentPlans } from "./tactical-plan-runner-hand-development";
import { runnerHasConcreteFundingNeed } from "./tactical-plan-runner-funding-need";
import type {
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function buildRunnerTacticalPlans(
  context: TacticalPlanBuildContext,
  dependencies: TacticalPlanCreditValueDependencies,
): TacticalPlan[] {
  const input = context.input;
  const previousPlan = context.previousPlan;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  const runnerGoalEvidence = runnerTacticalGoalEvidence(context);
  const currentRunnerTags = Math.max(0, input.playerView.own.tags ?? 0);
  if (currentRunnerTags > 0) {
    plans.push(
      createTacticalPlan({
        planId: "runner.clear_tags_or_survive",
        side: "runner",
        type: "runner.clear_tags_or_survive",
        status: "active",
        priority: 990 + Math.min(3, currentRunnerTags) * 20,
        horizonTurns: 1,
        target: { kind: "capability", id: "runner_tag_clear" },
        requiredCapabilities: [
          {
            capabilityId: "runner.tag_clear",
            kind: "tag_clear",
            side: "runner",
            target: { kind: "capability", id: "runner_tag_clear" },
            evidence: [`runner_current_tags:${currentRunnerTags}`],
          },
        ],
        currentStep: createPlanStep({
          stepId: "clear_runner_tags",
          kind: "clear_tags",
          desiredActionSemantics: ["tag.remove"],
          requiredCapabilities: [
            {
              capabilityId: "runner.tag_clear",
              kind: "tag_clear",
              side: "runner",
              target: { kind: "capability", id: "runner_tag_clear" },
              evidence: [`runner_current_tags:${currentRunnerTags}`],
            },
          ],
          rationale: [
            "current Runner tags create an acute survival cleanup obligation",
            `runner_current_tags:${currentRunnerTags}`,
          ],
        }),
        evidence: [
          `runner_current_tags:${currentRunnerTags}`,
          "runner_tag_clear_plan_active:true",
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: [
          {
            key: "runner_tag_clear_survival",
            label: "Runner tag cleanup",
            value: 990 + Math.min(3, currentRunnerTags) * 20,
            reason: `runner_current_tags:${currentRunnerTags}`,
          },
        ],
        stateVersion,
      }),
    );
  }
  const successWindowActions = runnerSuccessWindowActions(context);
  if (successWindowActions.length > 0) {
    const currentRunTarget = input.playerView.run?.attackedServerId;
    plans.push(
      createTacticalPlan({
        planId: currentRunTarget
          ? `runner.convert_success_window:${currentRunTarget}`
          : "runner.convert_success_window",
        side: "runner",
        type: "runner.convert_success_window",
        status: "active",
        priority: 980,
        horizonTurns: 1,
        ...(currentRunTarget
          ? { target: { kind: "server", id: currentRunTarget } }
          : {}),
        currentStep: createPlanStep({
          stepId: currentRunTarget
            ? `convert_success_window:${currentRunTarget}`
            : "convert_success_window",
          kind: "convert_success_window",
          desiredActionSemantics: [
            "run.success_followup",
            "successful_run_before_access_effect",
            "access.payoff",
          ],
          rationale: [
            "current legal Runner action converts an already successful run window",
            ...successWindowActions
              .slice(0, 3)
              .map((action) => `success_window_action:${action.actionId}`),
          ],
        }),
        evidence: [
          "runner_success_window_plan_active:true",
          ...(currentRunTarget ? [`runner_success_window_target:${currentRunTarget}`] : []),
          ...successWindowActions
            .slice(0, 4)
            .map((action) => `success_window_action:${action.actionId}`),
        ],
        scoreBreakdown: [
          {
            key: "runner_convert_success_window",
            label: "Runner success window",
            value: 980,
            reason: currentRunTarget ?? "current_run_window",
          },
        ],
        stateVersion,
      }),
    );
  }
  const remoteRunActions = input.legalActions.filter(
    (action) => action.type === "start_run" && isRemoteServer(actionServerId(action)),
  );
  const noPayoffRemoteRunActions: LegalAction[] = [];
  const noPayoffByActionId = new Map<
    string,
    ReturnType<typeof evaluateKnownRemoteAccessPayoff>
  >();
  for (const action of remoteRunActions) {
    const serverId = actionServerId(action);
    const payoff = evaluateKnownRemoteAccessPayoff(input, serverId);
    if (!payoff.knownNoCurrentPayoff) continue;
    noPayoffRemoteRunActions.push(action);
    noPayoffByActionId.set(action.actionId, payoff);
  }
  const emptyRemoteRunActions = remoteRunActions.filter((action) =>
    !noPayoffRemoteRunActions.includes(action) &&
    remoteRunHasNoRootValue(input.playerView, actionServerId(action)),
  );
  const blockedRemoteRuns = remoteRunActions.filter((action) =>
    !noPayoffRemoteRunActions.includes(action) &&
    !emptyRemoteRunActions.includes(action) &&
    runNeedsBreakerCoverage(input.playerView, actionServerId(action)),
  );
  const centralRunActions = input.legalActions.filter(
    (action) =>
      action.type === "start_run" && isCentralServer(actionServerId(action)),
  );
  const pressureBudget = assessRunnerPressureBudget(context);
  const noPayoffCentralRunActions: LegalAction[] = [];
  const noPayoffCentralByActionId = new Map<
    string,
    ReturnType<typeof evaluateKnownCentralAccessPayoff>
  >();
  for (const action of centralRunActions) {
    const serverId = actionServerId(action);
    const payoff = evaluateKnownCentralAccessPayoff(input, serverId);
    if (!payoff.knownNoCurrentPayoff) continue;
    noPayoffCentralRunActions.push(action);
    noPayoffCentralByActionId.set(action.actionId, payoff);
  }
  const blockedCentralRuns = centralRunActions.filter((action) =>
    !noPayoffCentralRunActions.includes(action) &&
    runNeedsBreakerCoverage(input.playerView, actionServerId(action)),
  );
  for (const action of blockedRemoteRuns) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
    const deckCapabilityEvidence = deckCapabilityEvidenceForRequiredCoverage(
      context,
      missingCoverage,
    );
    const coverageStep = runnerBreakerCoverageStep(context, serverId);
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        priority: 920,
        horizonTurns: 2,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `missing_breaker_coverage:${serverId}`,
            kind: "missing_breaker_coverage",
            severity: "soft",
            target: { kind: "server", id: serverId },
            removalStepKind: coverageStep.kind,
            evidence: [
              "visible rezzed ICE path and no visible breaker coverage",
              `missing_coverage:${missingCoverage}`,
              ...deckCapabilityEvidence,
            ],
          },
          ...deckCapabilityBlockersForRequiredCoverage(
            context,
            missingCoverage,
            serverId,
          ),
        ],
        currentStep: coverageStep,
        evidence: [
          `blocked_remote_run_action:${action.actionId}`,
          ...deckCapabilityEvidence,
        ],
        scoreBreakdown: [
          {
            key: "remote_contest_blocked",
            label: "Remote contest blocked",
            value: 920,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
    plans.push(
      createTacticalPlan({
        planId: `runner.obtain_breaker_coverage:${serverId}`,
        side: "runner",
        type: "runner.obtain_breaker_coverage",
        status: coveragePlanStatusForRequiredCoverage(context, missingCoverage),
        priority: 940,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        requiredCapabilities: [
          {
            capabilityId: `breaker_coverage:${serverId}`,
            kind: missingCoverage,
            side: "runner",
            target: { kind: "server", id: serverId },
            evidence: [
              "required to resume blocked remote contest",
              `server:${serverId}`,
            ],
          },
        ],
        currentStep: coverageStep,
        nextSteps: [
          createPlanStep({
            stepId: `runner.contest_remote:${serverId}`,
            kind: "run_target",
            desiredActionSemantics: ["run.start"],
            rationale: ["return to the blocked remote after coverage improves"],
          }),
        ],
        evidence: [
          `unblocks_plan:runner.contest_remote:${serverId}`,
          ...deckCapabilityEvidence,
        ],
        scoreBreakdown: [
          {
            key: "unblocks_remote_contest",
            label: "Unblocks remote contest",
            value: 940,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of noPayoffRemoteRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const payoff = noPayoffByActionId.get(action.actionId);
    const accessCommitmentEvidence = accessCommitmentPlanEvidence(
      context.accessCommitment,
      serverId,
    );
    const noPlanBonusEvidence = accessOutcomeMemoryPlanEvidence(
      context.accessOutcomeMemory,
    );
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "abandoned",
        priority: -680,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `known_remote_no_current_payoff:${serverId}`,
            kind:
              payoff?.payoff === "trash_unaffordable"
                ? "too_expensive"
                : "target_unreachable",
            severity: "hard",
            target: { kind: "server", id: serverId },
            ...(payoff?.payoff === "trash_unaffordable"
              ? { removalStepKind: "gain_credits" as const }
              : {}),
            evidence: [
              "known remote root has no current access payoff",
              ...accessCommitmentEvidence,
              ...noPlanBonusEvidence,
              ...(payoff?.evidence ?? []),
            ],
          },
        ],
        currentStep: createPlanStep({
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "remote is known from Runner memory and currently has no payoff",
          ],
        }),
        evidence: [
          `known_no_payoff_remote_run_action:${action.actionId}`,
          ...accessCommitmentEvidence,
          ...(payoff?.reasons ?? []),
          ...noPlanBonusEvidence,
          ...(payoff?.evidence ?? []),
        ],
        scoreBreakdown: [
          {
            key: "remote_known_no_current_payoff",
            label: "Known remote has no current payoff",
            value: -680,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of emptyRemoteRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "abandoned",
        priority: -200,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: createPlanStep({
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: ["remote has no installed root card to access"],
        }),
        evidence: [`empty_remote_root_run_action:${action.actionId}`],
        scoreBreakdown: [
          {
            key: "empty_remote_no_root_value",
            label: "Empty remote has no root value",
            value: -200,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of noPayoffCentralRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const payoff = noPayoffCentralByActionId.get(action.actionId);
    plans.push(
      createTacticalPlan({
        planId: `runner.opportunistic_central_run:${serverId}`,
        side: "runner",
        type: "runner.opportunistic_central_run",
        status: "abandoned",
        priority: -640,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `known_central_no_current_payoff:${serverId}`,
            kind:
              payoff?.payoff === "trash_unaffordable"
                ? "too_expensive"
                : "target_unreachable",
            severity: "hard",
            target: { kind: "server", id: serverId },
            ...(payoff?.payoff === "trash_unaffordable"
              ? { removalStepKind: "gain_credits" as const }
              : {}),
            evidence: [
              "known central access has no current payoff",
              ...(payoff?.evidence ?? []),
            ],
          },
        ],
        currentStep: createPlanStep({
          stepId: `probe_central:${serverId}`,
          kind: "probe_central",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "central top card is known from Runner memory and currently has no payoff",
          ],
        }),
        evidence: [
          `known_no_payoff_central_run_action:${action.actionId}`,
          ...(payoff?.reasons ?? []),
          ...(payoff?.evidence ?? []),
        ],
        scoreBreakdown: [
          {
            key: "central_known_no_current_payoff",
            label: "Known central access has no current payoff",
            value: -640,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of remoteRunActions) {
    const serverId = actionServerId(action);
    if (
      !serverId ||
      blockedRemoteRuns.includes(action) ||
      emptyRemoteRunActions.includes(action) ||
      noPayoffRemoteRunActions.includes(action)
    ) continue;
    const remoteGoal = runnerRemoteGoalForServer(context, serverId);
    const strategicBoost = tacticalGoalPriorityBoost(remoteGoal);
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "active",
        priority: runnerAdjustedPlanPriority(
          context,
          action,
          820 + strategicBoost,
        ),
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: runnerRunTargetCurrentStep(context, action, {
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "remote run is legal and no visible coverage blocker was detected",
            ...runnerRunTargetStepRationale(context, action),
          ],
        }),
        evidence: [
          `remote_run_action:${action.actionId}`,
          ...runnerRunTargetPlanEvidence(context, action),
          ...tacticalGoalEvidence(remoteGoal),
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: [
          ...runnerRunTargetPlanScoreBreakdown(context, action, 820),
          ...tacticalGoalScoreBreakdown(remoteGoal, strategicBoost),
        ],
        stateVersion,
      }),
    );
  }
  for (const action of centralRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    if (noPayoffCentralRunActions.includes(action)) continue;
    if (blockedCentralRuns.includes(action)) {
      const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
      const deckCapabilityEvidence = deckCapabilityEvidenceForRequiredCoverage(
        context,
        missingCoverage,
      );
      const coverageStep = runnerBreakerCoverageStep(context, serverId);
      const basePriority = serverId === "rd" ? 760 : 740;
      plans.push(
        createTacticalPlan({
          planId: `runner.opportunistic_central_run:${serverId}`,
          side: "runner",
          type: "runner.opportunistic_central_run",
          priority: basePriority,
          horizonTurns: 1,
          target: { kind: "server", id: serverId },
          blockers: [
            {
              blockerId: `missing_breaker_coverage:${serverId}`,
              kind: "missing_breaker_coverage",
              severity: "soft",
              target: { kind: "server", id: serverId },
              removalStepKind: coverageStep.kind,
              evidence: [
                "visible rezzed ICE path and no visible breaker coverage",
                `missing_coverage:${missingCoverage}`,
                ...deckCapabilityEvidence,
              ],
            },
            ...deckCapabilityBlockersForRequiredCoverage(
              context,
              missingCoverage,
              serverId,
            ),
          ],
          currentStep: coverageStep,
          evidence: [
            `blocked_central_run_action:${action.actionId}`,
            ...deckCapabilityEvidence,
          ],
          scoreBreakdown: [
            {
              key: "central_run_blocked",
              label: "Central run blocked",
              value: basePriority,
              reason: serverId,
            },
          ],
          stateVersion,
        }),
      );
      plans.push(
        createTacticalPlan({
          planId: `runner.obtain_breaker_coverage:${serverId}`,
          side: "runner",
          type: "runner.obtain_breaker_coverage",
          status: coveragePlanStatusForRequiredCoverage(context, missingCoverage),
          priority: serverId === "rd" ? 900 : 880,
          horizonTurns: 1,
          target: { kind: "server", id: serverId },
          requiredCapabilities: [
            {
              capabilityId: `breaker_coverage:${serverId}`,
              kind: missingCoverage,
              side: "runner",
              target: { kind: "server", id: serverId },
              evidence: [
                "required to resume blocked central pressure",
                `server:${serverId}`,
              ],
            },
          ],
          currentStep: coverageStep,
          nextSteps: [
            createPlanStep({
              stepId: `runner.opportunistic_central_run:${serverId}`,
              kind: "probe_central",
              desiredActionSemantics: ["run.start"],
              rationale: ["return to the blocked central after coverage improves"],
            }),
          ],
          evidence: [
            `unblocks_plan:runner.opportunistic_central_run:${serverId}`,
            ...deckCapabilityEvidence,
          ],
          scoreBreakdown: [
            {
              key: "unblocks_central_pressure",
              label: "Unblocks central pressure",
              value: serverId === "rd" ? 900 : 880,
              reason: serverId,
            },
          ],
          stateVersion,
        }),
      );
      continue;
    }
    const pressureAllowance = runnerPressureProbeAllowance(
      pressureBudget,
      serverId,
    );
    const basePriority = serverId === "rd" ? 760 : 740;
    const pressureGoal = runnerPressureGoalForServer(context, serverId);
    const strategicBoost = tacticalGoalPriorityBoost(pressureGoal);
    plans.push(
      createTacticalPlan({
        planId: `runner.opportunistic_central_run:${serverId}`,
        side: "runner",
        type: "runner.opportunistic_central_run",
        status: "active",
        priority: runnerAdjustedPlanPriority(
          context,
          action,
          basePriority + pressureAllowance.priorityBonus + strategicBoost,
        ),
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: runnerRunTargetCurrentStep(context, action, {
          stepId: `probe_central:${serverId}`,
          kind: "probe_central",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "central pressure remains available while blocked plans wait",
            ...runnerRunTargetStepRationale(context, action),
          ],
        }),
        evidence: [
          `central_run_action:${action.actionId}`,
          ...pressureAllowance.evidence,
          ...runnerRunTargetPlanEvidence(context, action),
          ...tacticalGoalEvidence(pressureGoal),
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(pressureGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  plans.push(
    ...runnerHandBufferPlans(
      context,
      stateVersion,
      runnerGoalEvidence,
      dependencies,
    ),
  );
  plans.push(
    ...runnerHandDevelopmentPlans(context, stateVersion, runnerGoalEvidence),
  );
  plans.push(
    ...runnerCreditBasePlans(
      context,
      stateVersion,
      runnerGoalEvidence,
      dependencies,
    ),
  );
  const bankBuildActionList = bankBuildActions(context, "runner", input.legalActions);
  const runnerBankToolEvidence = bankToolEvidence(context, "runner");
  const runnerBankPayout = largestBankPayout(context, "runner");
  const runnerFundingNeed = runnerHasConcreteFundingNeed(input, [
    ...blockedRemoteRuns,
    ...blockedCentralRuns,
  ]);
  if (
    bankBuildActionList.length > 0 &&
    input.playerView.own.credits >= 4 &&
    !runnerFundingNeed
  ) {
    plans.push(
      createTacticalPlan({
        planId: "runner.build_credit_bank",
        side: "runner",
        type: "runner.build_credit_bank",
        status: "active",
        priority: runnerEconomyGoalPriority(context, 700),
        horizonTurns: 2,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:runner",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "runner.bank_capacity",
              kind: "bank_capacity",
              side: "runner",
              target: { kind: "bank", id: "runner_credit_bank" },
              evidence: runnerBankToolEvidence,
            },
          ],
          rationale: ["credits are stable enough to bank for later plan execution"],
        }),
        evidence: [
          ...bankBuildActionList.map((action) => `bank_build_action:${action.actionId}`),
          ...runnerBankToolEvidence,
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  const bankPayoutActionList = bankPayoutActions(context, "runner", input.legalActions);
  const mayCashOutBank =
    bankPayoutActionList.length > 0 &&
    (input.playerView.own.credits <= 3 || runnerFundingNeed) &&
    !(
      previousPlan?.type === "runner.build_credit_bank" &&
      input.playerView.own.credits > 3 &&
      !runnerFundingNeed
    );
  if (mayCashOutBank) {
    plans.push(
      createTacticalPlan({
        planId: "runner.cash_out_credit_bank",
        side: "runner",
        type: "runner.cash_out_credit_bank",
        status: "active",
        priority: runnerEconomyGoalPriority(context, 880),
        horizonTurns: 1,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "cash_out_bank:runner",
          kind: "cash_out_bank",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "runner.bank_payout",
              kind: "bank_payout",
              side: "runner",
              target: { kind: "bank", id: "runner_credit_bank" },
              evidence: [
                ...runnerBankToolEvidence,
                ...(runnerBankPayout !== undefined
                  ? [`bank_estimated_payout:${runnerBankPayout}`]
                  : []),
              ],
            },
          ],
          rationale: [
            runnerFundingNeed
              ? "stored credits can fund an active plan"
              : "low credits make stored bank credits immediately useful",
            ...(runnerBankPayout !== undefined
              ? [`bank_estimated_payout:${runnerBankPayout}`]
              : []),
          ],
        }),
        evidence: [
          ...bankPayoutActionList.map((action) => `bank_payout_action:${action.actionId}`),
          ...runnerBankToolEvidence,
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  return applyRunnerDrawOverflowAdjustments(context, plans);
}

function runnerSuccessWindowActions(
  context: TacticalPlanBuildContext,
): LegalAction[] {
  const legalActionsById = new Map(
    context.input.legalActions.map((action) => [action.actionId, action]),
  );
  return (context.candidates ?? [])
    .map((candidate) => ({
      candidate,
      action: legalActionsById.get(candidate.actionId),
    }))
    .filter(
      (
        entry,
      ): entry is {
        candidate: NonNullable<TacticalPlanBuildContext["candidates"]>[number];
        action: LegalAction;
      } =>
        entry.action !== undefined &&
        runnerSuccessWindowActionMatches(entry.action, entry.candidate),
    )
    .map((entry) => entry.action)
    .sort((left, right) => left.actionId.localeCompare(right.actionId));
}

function runnerSuccessWindowActionMatches(
  action: LegalAction,
  candidate: NonNullable<TacticalPlanBuildContext["candidates"]>[number],
): boolean {
  if (action.side !== "runner" || candidate.actorSide !== "runner") return false;
  if (
    action.type === "start_run" ||
    action.type === "continue_run" ||
    action.type === "jack_out" ||
    action.type === "access_card" ||
    action.type === "steal_agenda" ||
    action.type === "trash_accessed_card"
  ) {
    return false;
  }
  const supportedActionType =
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability" ||
    action.type === "play_event" ||
    action.type === "resolve_choice";
  if (!supportedActionType) return false;
  const signals = runnerSuccessWindowSignals(action, candidate);
  return signals.some(signalIsRunnerSuccessWindow);
}

function runnerSuccessWindowSignals(
  action: LegalAction,
  candidate: NonNullable<TacticalPlanBuildContext["candidates"]>[number],
): string[] {
  return [
    action.timingPoint,
    candidate.semanticActionType,
    candidate.sourceCardId,
    candidate.abilityId,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.strategySupport.map((entry) => `${entry.strategyId}:${entry.role}`),
    ...candidate.conditions.map((entry) => entry.kind),
    ...candidate.risks.map((entry) => entry.kind),
    ...candidate.constraints.map((entry) => entry.kind),
    ...candidate.costProfile.additionalCosts,
    ...(candidate.targetContext?.targetProfileMatches.flatMap((entry) => entry.evidence) ?? []),
    ...candidate.evidence,
    ...payloadStringSignals(action.payload),
  ].filter((entry): entry is string => typeof entry === "string");
}

function signalIsRunnerSuccessWindow(signal: string): boolean {
  const normalized = signal.toLocaleLowerCase("en-US");
  return (
    normalized.includes("successful_run") ||
    normalized.includes("success_followup") ||
    normalized.includes("requires_successful_run") ||
    normalized.includes("extra_run_after_success") ||
    normalized.includes("run.followup_run") ||
    normalized.includes("access.payoff") ||
    normalized.includes("ice.trash_rezzed") ||
    normalized.includes("fort.all_rezzed_ice_trash") ||
    normalized.includes("free_trash")
  );
}

function payloadStringSignals(payload: LegalAction["payload"]): string[] {
  if (!payload) return [];
  return Object.values(payload).flatMap((value): string[] => {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === "string");
    }
    return [];
  });
}
