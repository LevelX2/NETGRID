import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { type RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import type { RunnerHandDevelopmentEvaluation } from "./hand-development-evaluation";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import {
  type RunnerRestrictedProgramInstallSequenceCommitment,
  type RunnerRestrictedProgramInstallSequenceStep,
} from "./development-types";

export function runnerRestrictedProgramInstallSequenceCommitment(
  input: AiDecisionInput,
  source: ActionSemanticCandidate,
  _candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  economy: RunnerEconomyPosture,
): RunnerRestrictedProgramInstallSequenceCommitment | undefined {
  const projection = source.actionCapacityProjection;
  if (
    projection?.kind !== "immediate_restricted_gain" ||
    projection.restriction !== "program_install_only" ||
    projection.reliability !== "guaranteed" ||
    projection.followupActionCapacity <= 0 ||
    !projection.allowedActionTypes.includes("install_card") ||
    !projection.allowedCardTypes?.includes("program") ||
    !source.sourceCardInstanceId ||
    !source.sourceDefinitionId
  ) {
    return undefined;
  }
  const sourceAction = input.legalActions.find(
    (action) => action.actionId === source.actionId,
  );
  if (!sourceAction) {
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [source.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind Valu-Pak preflight projection to the exact current LegalAction.",
    });
  }
  const rawTemporaryInstallCredits =
    sourceAction.payload?.actionCapacityTemporaryCredits;
  if (
    typeof rawTemporaryInstallCredits !== "number" ||
    !Number.isFinite(rawTemporaryInstallCredits) ||
    rawTemporaryInstallCredits < 0
  ) {
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [source.actionId],
      owner: "rules_contract",
      removalCondition:
        "Define finite non-negative temporary program-install credits for Valu-Pak.",
    });
  }
  const temporaryInstallCredits = Math.max(
    0,
    Math.floor(projection.temporaryCredits ?? 0),
  );
  if (temporaryInstallCredits <= 0) return undefined;

  const options = handDevelopment
    .flatMap((evaluation) => {
      const install = evaluation.persistentInstallEvaluation;
      if (
        install?.cardType === "program" &&
        (!Number.isFinite(install.installCost) ||
          install.installCost < 0 ||
          typeof install.memoryCost !== "number" ||
          !Number.isFinite(install.memoryCost) ||
          install.memoryCost < 0)
      ) {
        throw new PlanResolutionFailure("missing_card_definition", {
          side: input.side,
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          legalActionTypes: input.legalActions.map((action) => action.type),
          unresolvedActionIds: [
            evaluation.legalActionId ?? evaluation.cardInstanceId,
          ],
          owner: "rules_contract",
          removalCondition: `Define finite non-negative install cost and MU for Valu-Pak program target ${evaluation.cardInstanceId}.`,
        });
      }
      const availabilityEligible =
        evaluation.availability === "legal_now" ||
        (evaluation.availability === "missing_credits" &&
          evaluation.fundingNeed !== undefined &&
          evaluation.fundingNeed.missingCredits <= temporaryInstallCredits);
      const deferEligible = [
        "none",
        "missing_credits",
        "preserve_credit_floor",
      ].includes(evaluation.deferReason);
      const memoryCost = Math.max(0, install?.memoryCost ?? 0);
      const currentlyMeaningful =
        evaluation.currentNeed === "acute" ||
        evaluation.currentNeed === "useful_now" ||
        evaluation.currentNeed === "setup";
      if (
        !evaluation.definitionId ||
        !availabilityEligible ||
        !deferEligible ||
        !currentlyMeaningful ||
        evaluation.strategicFit === "blocked" ||
        evaluation.priority <= 0 ||
        !install ||
        install.cardType !== "program" ||
        install.duplicateRole === "redundant_duplicate" ||
        install.finalInstallFit <= 0 ||
        install.installCost < 0
      ) {
        return [];
      }
      return [
        {
          evaluation,
          install,
          installCost: install.installCost,
          memoryCost,
          utility:
            evaluation.priority +
            Math.max(0, install.finalInstallFit) +
            runnerDevelopmentNeedSequenceValue(evaluation.currentNeed),
        },
      ];
    })
    .sort(
      (left, right) =>
        runnerDevelopmentNeedSequenceValue(right.evaluation.currentNeed) -
          runnerDevelopmentNeedSequenceValue(left.evaluation.currentNeed) ||
        right.utility - left.utility ||
        left.evaluation.cardInstanceId.localeCompare(
          right.evaluation.cardInstanceId,
        ),
    );
  if (options.length === 0 || options.length > 20) return undefined;

  const availableMemory = Math.max(
    0,
    (input.playerView.own.memoryLimit ?? 0) -
      (input.playerView.own.memoryUsed ?? 0),
  );
  const minimumHandBuffer =
    runnerDamageThreatAssessment(input).flatlineRisk.recommendedHandFloor;
  const gripCountAfterOpening = Math.max(
    0,
    input.playerView.own.gripOrHq.length - 1,
  );
  const maxTargets = Math.min(
    projection.followupActionCapacity,
    options.length,
  );
  let best:
    | {
        indices: number[];
        count: number;
        utility: number;
        totalCost: number;
        totalMemory: number;
      }
    | undefined;
  for (let mask = 1; mask < 2 ** options.length; mask += 1) {
    const indices: number[] = [];
    for (let index = 0; index < options.length; index += 1) {
      if ((mask & (2 ** index)) !== 0) indices.push(index);
    }
    if (indices.length < 2 || indices.length > maxTargets) continue;
    const totalCost = indices.reduce(
      (sum, index) => sum + options[index]!.installCost,
      0,
    );
    const totalMemory = indices.reduce(
      (sum, index) => sum + options[index]!.memoryCost,
      0,
    );
    const normalCreditsSpent = Math.max(0, totalCost - temporaryInstallCredits);
    if (
      input.playerView.own.credits - normalCreditsSpent <
        economy.minimumCreditFloor ||
      totalMemory > availableMemory ||
      gripCountAfterOpening - indices.length < minimumHandBuffer
    ) {
      continue;
    }
    const utility = indices.reduce(
      (sum, index) => sum + options[index]!.utility,
      0,
    );
    if (
      !best ||
      indices.length > best.count ||
      (indices.length === best.count && utility > best.utility) ||
      (indices.length === best.count &&
        utility === best.utility &&
        totalCost < best.totalCost)
    ) {
      best = {
        indices,
        count: indices.length,
        utility,
        totalCost,
        totalMemory,
      };
    }
  }

  let admissionReason: RunnerRestrictedProgramInstallSequenceCommitment["admissionReason"];
  let selected = best?.indices.map((index) => options[index]!) ?? [];
  if (selected.length >= 2) {
    admissionReason = "multiple_productive_programs";
  } else {
    const acuteBridge = options.find(
      ({ evaluation, installCost, memoryCost }) =>
        evaluation.currentNeed === "acute" &&
        input.playerView.own.credits < installCost &&
        input.playerView.own.credits + temporaryInstallCredits >= installCost &&
        memoryCost <= availableMemory &&
        input.playerView.own.credits -
          Math.max(0, installCost - temporaryInstallCredits) >=
          economy.minimumCreditFloor &&
        gripCountAfterOpening - 1 >= minimumHandBuffer,
    );
    if (!acuteBridge) return undefined;
    selected = [acuteBridge];
    admissionReason = "acute_temporary_credit_bridge";
  }

  let normalCredits = input.playerView.own.credits;
  let temporaryCredits = temporaryInstallCredits;
  let memoryAvailable = availableMemory;
  let gripCount = gripCountAfterOpening;
  const targetSteps: RunnerRestrictedProgramInstallSequenceStep[] =
    selected.map(({ evaluation, install, installCost, memoryCost }, index) => {
      const temporarySpent = Math.min(temporaryCredits, installCost);
      temporaryCredits -= temporarySpent;
      normalCredits -= installCost - temporarySpent;
      memoryAvailable -= memoryCost;
      gripCount -= 1;
      return {
        order: index + 1,
        cardInstanceId: evaluation.cardInstanceId,
        definitionId: evaluation.definitionId!,
        installCost,
        memoryCost,
        projectedRunnerCreditsAfter: normalCredits,
        projectedMemoryAvailableAfter: memoryAvailable,
        projectedGripCountAfter: gripCount,
        purposeCode: `${evaluation.developmentRole}:${evaluation.currentNeed}`,
        evidenceCode:
          evaluation.evidence[0] ?? "runner_program_install_sequence_target",
      };
    });

  return {
    kind: "restricted_program_install_sequence",
    sourceActionId: source.actionId,
    sourceCardInstanceId: source.sourceCardInstanceId,
    sourceDefinitionId: source.sourceDefinitionId,
    plannedAtStateVersion: input.playerView.stateVersion,
    runnerCreditsBeforeOpening: input.playerView.own.credits,
    grantedActionCount: projection.followupActionCapacity,
    temporaryInstallCredits,
    minimumCreditFloor: economy.minimumCreditFloor,
    minimumHandBuffer,
    ordinaryClicksAfterOpening: Math.max(
      0,
      input.playerView.own.clicks - projection.preExistingActionCost,
    ),
    targetSteps,
    admissionReason,
    evidenceCodes: [
      `runner_restricted_program_sequence:${admissionReason}`,
      `runner_restricted_program_sequence_targets:${targetSteps
        .map((step) => step.definitionId)
        .join(",")}`,
      `runner_restricted_program_sequence_total_install_cost:${targetSteps.reduce(
        (sum, step) => sum + step.installCost,
        0,
      )}`,
      `runner_restricted_program_sequence_temporary_credits:${temporaryInstallCredits}`,
      `runner_restricted_program_sequence_credit_floor:${economy.minimumCreditFloor}`,
      `runner_restricted_program_sequence_hand_floor:${minimumHandBuffer}`,
      `runner_restricted_program_sequence_ordinary_clicks_after_opening:${Math.max(
        0,
        input.playerView.own.clicks - projection.preExistingActionCost,
      )}`,
    ],
  };
}

function runnerDevelopmentNeedSequenceValue(
  need: RunnerHandDevelopmentEvaluation["currentNeed"],
): number {
  switch (need) {
    case "acute":
      return 4_000;
    case "useful_now":
      return 2_000;
    case "setup":
      return 1_000;
    case "later":
      return 200;
    default:
      return 0;
  }
}

function activeRestrictedProgramInstallActions(
  input: AiDecisionInput,
): AiDecisionInput["legalActions"] {
  return input.legalActions.filter(
    (action) =>
      action.payload?.actionCapacityRestriction === "program_install_only" &&
      action.payload?.actionCapacityAllowedActionType === "install_card" &&
      action.payload?.actionCapacityAllowedCardType === "program" &&
      action.payload?.actionCapacityReliability === "guaranteed" &&
      action.payload?.restrictedActionGrantActionType === "install_card" &&
      action.payload?.restrictedActionGrantCostProfile ===
        "temporary_credit_bundle" &&
      Number(action.payload?.restrictedActionGrantRemainingActions) > 0,
  );
}

function restrictedProgramInstallCommitmentFromPortfolio(
  previous: ResidentPlanPortfolio | undefined,
): RunnerRestrictedProgramInstallSequenceCommitment | undefined {
  if (!previous?.executorInstanceId) return undefined;
  const activeExecutors = previous.instances.filter(
    (instance) => instance.executionState === "executor",
  );
  if (
    activeExecutors.length !== 1 ||
    activeExecutors[0]?.instanceId !== previous.executorInstanceId
  ) {
    return undefined;
  }
  const executor = activeExecutors[0];
  if (
    !executor ||
    executor.moduleId !== "runner.develop_board_and_hand" ||
    executor.viability !== "ready"
  ) {
    return undefined;
  }
  const moduleState = executor.moduleState;
  if (!moduleState || typeof moduleState !== "object") return undefined;
  const signal = (
    moduleState as {
      signal?: {
        phase?: string;
        restrictedProgramInstallCommitment?: RunnerRestrictedProgramInstallSequenceCommitment;
      };
    }
  ).signal;
  if (
    !signal ||
    ![
      "open_restricted_sequence",
      "execute_restricted_sequence",
      "complete_restricted_sequence",
    ].includes(signal.phase ?? "")
  ) {
    return undefined;
  }
  const commitment = signal.restrictedProgramInstallCommitment;
  if (
    commitment?.kind !== "restricted_program_install_sequence" ||
    commitment.targetSteps.length === 0 ||
    !restrictedProgramInstallCommitmentHasFiniteResources(commitment)
  ) {
    return undefined;
  }
  return structuredClone(commitment);
}

function restrictedProgramInstallCommitmentHasFiniteResources(
  commitment: RunnerRestrictedProgramInstallSequenceCommitment,
): boolean {
  return (
    Number.isFinite(commitment.temporaryInstallCredits) &&
    commitment.temporaryInstallCredits >= 0 &&
    commitment.targetSteps.every(
      (step) =>
        Number.isFinite(step.installCost) &&
        step.installCost >= 0 &&
        Number.isFinite(step.memoryCost) &&
        step.memoryCost >= 0,
    )
  );
}

function runnerRestrictedProgramInstallSequenceProgress(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
):
  | {
      commitment: RunnerRestrictedProgramInstallSequenceCommitment;
      completedCount: number;
      candidate: ActionSemanticCandidate;
      phase: "execute_restricted_sequence" | "complete_restricted_sequence";
    }
  | undefined {
  const restrictedActions = activeRestrictedProgramInstallActions(input);
  if (restrictedActions.length === 0) return undefined;
  const commitment = restrictedProgramInstallCommitmentFromPortfolio(previous);
  if (!commitment) {
    throw runnerRestrictedSequenceFailure(
      input,
      "The active program-install bundle requires the exact preflight commitment that opened it.",
      restrictedActions.map((action) => action.actionId),
    );
  }
  if (commitment.plannedAtStateVersion >= input.playerView.stateVersion) {
    throw runnerRestrictedSequenceFailure(
      input,
      "A restricted install commitment must predate the active sequence state.",
      restrictedActions.map((action) => action.actionId),
    );
  }
  const gripIds = new Set(
    input.playerView.own.gripOrHq.map((card) => card.instanceId),
  );
  const rigIds = new Set(
    (input.playerView.own.rig ?? []).map((card) => card.instanceId),
  );
  let completedCount = 0;
  let remainingSeen = false;
  for (const step of commitment.targetSteps) {
    if (rigIds.has(step.cardInstanceId)) {
      if (remainingSeen) {
        throw runnerRestrictedSequenceFailure(
          input,
          "Committed Valu-Pak targets must be installed in their planned order.",
          restrictedActions.map((action) => action.actionId),
        );
      }
      completedCount += 1;
      continue;
    }
    if (gripIds.has(step.cardInstanceId)) {
      remainingSeen = true;
      continue;
    }
    throw runnerRestrictedSequenceFailure(
      input,
      "Every incomplete Valu-Pak target must remain visible in grip until its committed install step.",
      restrictedActions.map((action) => action.actionId),
    );
  }

  const nextStep = commitment.targetSteps[completedCount];
  const candidate = nextStep
    ? candidates.find(
        (entry) =>
          entry.actionType === "install_card" &&
          entry.sourceCardInstanceId === nextStep.cardInstanceId &&
          restrictedActions.some(
            (action) => action.actionId === entry.actionId,
          ),
      )
    : candidates.find(
        (entry) =>
          entry.actionType === "stop_restricted_action_sequence" &&
          restrictedActions.some(
            (action) => action.actionId === entry.actionId,
          ),
      );
  if (!candidate) {
    throw runnerRestrictedSequenceFailure(
      input,
      nextStep
        ? "The next committed Valu-Pak program must have an exact restricted install action."
        : "A completed Valu-Pak commitment requires an exact sequence-stop action.",
      restrictedActions.map((action) => action.actionId),
    );
  }
  return {
    commitment,
    completedCount,
    candidate,
    phase: nextStep
      ? "execute_restricted_sequence"
      : "complete_restricted_sequence",
  };
}

export function assertRunnerRestrictedProgramInstallCommitment(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): void {
  runnerRestrictedProgramInstallSequenceProgress(input, candidates, previous);
}

export function runnerRestrictedProgramInstallSequenceSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): RunnerPlanDomain["developments"] {
  const progress = runnerRestrictedProgramInstallSequenceProgress(
    input,
    candidates,
    previous,
  );
  if (!progress) return [];
  const nextStep = progress.commitment.targetSteps[progress.completedCount];
  return [
    {
      developmentId: `card:${progress.commitment.sourceCardInstanceId}`,
      definitionId: progress.commitment.sourceDefinitionId,
      targetKind: "capability",
      phase: progress.phase,
      purposeCode: nextStep
        ? `install_committed_program:${nextStep.definitionId}`
        : "complete_committed_program_install_sequence",
      assignedDomainPlanIds: [],
      duplicateAlreadyInstalled: false,
      affordableOrSupportable: true,
      semanticActionTypes: [progress.candidate.semanticActionType],
      actionIds: [progress.candidate.actionId],
      priorityClass: "P3",
      value: 1_000 - progress.completedCount,
      evidenceCode: nextStep
        ? `runner_restricted_program_sequence_next:${nextStep.definitionId}`
        : "runner_restricted_program_sequence_commitment_completed",
      evidenceCodes: [
        ...progress.commitment.evidenceCodes,
        `runner_restricted_program_sequence_completed_steps:${progress.completedCount}`,
      ],
      restrictedProgramInstallCommitment: progress.commitment,
    },
  ];
}

function runnerRestrictedSequenceFailure(
  input: AiDecisionInput,
  removalCondition: string,
  unresolvedActionIds: string[],
): PlanResolutionFailure {
  return new PlanResolutionFailure("commitment_invalidated", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    unresolvedActionIds,
    owner: "continuation",
    removalCondition,
    planInstanceId:
      "plan:runner.develop_board_and_hand:restricted_program_install_sequence",
  });
}

export function restrictedActionCapacityHasProductiveFollowup(
  source: ActionSemanticCandidate,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  developments?: readonly RunnerPlanDomain["developments"][number][],
): boolean {
  const projection = source.actionCapacityProjection;
  if (
    projection?.kind !== "immediate_restricted_gain" ||
    projection.followupActionCapacity <= 0
  )
    return true;
  if (projection.restriction === "program_install_only") {
    return (
      developments?.some(
        (signal) =>
          signal.phase === "open_restricted_sequence" &&
          signal.actionIds.includes(source.actionId) &&
          signal.restrictedProgramInstallCommitment !== undefined,
      ) === true
    );
  }
  const allowedActionTypes = new Set(projection.allowedActionTypes);
  return candidates.some((candidate) => {
    if (
      candidate.actionId === source.actionId ||
      !allowedActionTypes.has(candidate.actionType)
    )
      return false;
    if (candidate.semanticActionType === "install.card") {
      const evaluation = handDevelopment.find(
        (entry) =>
          entry.legalActionId === candidate.actionId ||
          (entry.definitionId !== undefined &&
            entry.definitionId === candidate.sourceDefinitionId),
      );
      return (
        evaluation?.availability === "legal_now" &&
        evaluation.deferReason === "none" &&
        evaluation.priority > 0 &&
        evaluation.persistentInstallEvaluation?.duplicateRole !==
          "redundant_duplicate" &&
        (evaluation.persistentInstallEvaluation?.finalInstallFit ?? 0) >= 0
      );
    }
    if (candidate.semanticActionType === "run.start") {
      const serverId = candidate.runProjectionSummary?.serverId;
      return runTargets.some(
        (evaluation) =>
          evaluation.targetServerId === serverId &&
          evaluation.pathPassability === "reachable" &&
          evaluation.score > 0,
      );
    }
    return false;
  });
}
