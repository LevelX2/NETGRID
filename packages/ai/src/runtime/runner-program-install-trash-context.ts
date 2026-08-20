import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  programSacrificeCandidate as buildProgramSacrificeCandidate,
  programSacrificeCandidateIsRedundant as buildProgramSacrificeCandidateIsRedundant,
  runnerProgramInstallDisplacementPenalty as buildRunnerProgramInstallDisplacementPenalty,
  runnerProgramInstallTrashAssessmentFromCards as buildRunnerProgramInstallTrashAssessmentFromCards,
  sacrificeCandidateLabel,
  selectedMinimalProgramSacrificeCandidates,
  type ProgramSacrificeCandidate,
  type RunnerProgramInstallTrashAssessment,
} from "./runner-program-install-trash-policy";
import { runnerProgramSacrificeExclusion as buildRunnerProgramSacrificeExclusion } from "./runner-program-sacrifice-exclusion";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOptions = PendingChoice["options"];
type PendingChoiceOption = PendingChoiceOptions[number];

export type RunnerProgramInstallTrashContextDependencies = {
  safeNonNegativeInteger: (value: number | undefined) => number;
  visibleMemoryCost: (card: VisibleCard | undefined) => number;
  visibleCardsByInstanceId: (
    playerView: AiDecisionInput["playerView"],
  ) => ReadonlyMap<string, VisibleCard>;
  visibleBreakerRoleCounts: (
    cards: VisibleCard[],
  ) => ReadonlyMap<string, number>;
  visibleBreakerRoles: (card: VisibleCard) => readonly string[];
  rolesForCardId: (definitionId: string | undefined) => readonly string[];
  isRunnerPressureRole: (role: string) => boolean;
  isRunnerEconomyRole: (role: string) => boolean;
  visibleCounterValue: (card: VisibleCard | undefined) => number;
  visibleInstallCost: (card: VisibleCard | undefined) => number;
};

export type RunnerProgramInstallTrashContext = {
  selectedRunnerProgramInstallTrashOptionIds: (
    input: AiDecisionInput,
    choice: PendingChoice,
    selectableOptions: PendingChoiceOptions,
  ) => string[];
  selectedRunnerForcedProgramTrashOptionIds: (
    input: AiDecisionInput,
    selectableOptions: PendingChoiceOptions,
  ) => string[];
  selectedRunnerMemoryCheckpointTrashOptionIds: (
    input: AiDecisionInput,
    selectableOptions: PendingChoiceOptions,
  ) => string[];
  runnerProgramInstallTrashAssessment: (
    input: AiDecisionInput,
    choice: PendingChoice,
    selectableOptions: PendingChoiceOptions,
  ) => RunnerProgramInstallTrashAssessment;
  runnerProgramInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramInstallTrashAssessment | undefined;
  runnerProgramInstallDisplacementPenalty: (
    assessment: RunnerProgramInstallTrashAssessment | undefined,
  ) => number;
  runnerProgramSacrificeExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerProgramInstallTrashContext(
  dependencies: RunnerProgramInstallTrashContextDependencies,
): RunnerProgramInstallTrashContext {
  function selectedRunnerProgramInstallTrashOptionIds(
    input: AiDecisionInput,
    choice: PendingChoice,
    selectableOptions: PendingChoiceOptions,
  ): string[] {
    const assessment = runnerProgramInstallTrashAssessment(
      input,
      choice,
      selectableOptions,
    );
    if (!assessment.memoryRequired) return [];
    if (assessment.requiredMemoryToFree <= 0) return [];
    const forcedMinimalSacrifice = choice.source.startsWith(
      "runner.program_install_memory:",
    );
    if (!assessment.canFreeRequiredMemory && !forcedMinimalSacrifice) {
      throw new PlanResolutionFailure("commitment_invalidated", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: (input.legalActions ?? []).map(
          (action) => action.type,
        ),
        owner: "plan_module",
        removalCondition:
          "Select a program-trash install only when the owning Runner development plan has an acceptable sufficient sacrifice set for its exact memory deficit.",
      });
    }
    const selectedCandidates = forcedMinimalSacrifice
      ? selectedMinimalProgramSacrificeCandidates(
          assessment.candidates,
          assessment.requiredMemoryToFree,
        )
      : assessment.selectedCandidates;
    return selectedCandidates
      .map((candidate) => candidate.option?.id)
      .filter((id): id is string => typeof id === "string");
  }

  function selectedRunnerForcedProgramTrashOptionIds(
    input: AiDecisionInput,
    selectableOptions: PendingChoiceOptions,
  ): string[] {
    const installedCards = dependencies.visibleCardsByInstanceId(
      input.playerView,
    );
    const installedBreakerRoleCounts = dependencies.visibleBreakerRoleCounts(
      input.playerView.own.rig ?? [],
    );
    const selected = selectableOptions
      .map((option) => {
        const card =
          typeof option.value === "string"
            ? installedCards.get(option.value)
            : option.card;
        return programSacrificeCandidateForAi(
          input,
          card,
          installedBreakerRoleCounts,
          option,
        );
      })
      .filter((candidate) => candidate.option)
      .sort(
        (left, right) =>
          right.score - left.score ||
          sacrificeCandidateLabel(left).localeCompare(
            sacrificeCandidateLabel(right),
            "de",
          ),
      )[0];
    return selected?.option?.id ? [selected.option.id] : [];
  }

  function selectedRunnerMemoryCheckpointTrashOptionIds(
    input: AiDecisionInput,
    selectableOptions: PendingChoiceOptions,
  ): string[] {
    const assessment = runnerProgramInstallTrashAssessmentFromCards(
      input,
      undefined,
      selectableOptions,
    );
    return selectedMinimalProgramSacrificeCandidates(
      assessment.candidates,
      assessment.requiredMemoryToFree,
    )
      .map((candidate) => candidate.option?.id)
      .filter((id): id is string => typeof id === "string");
  }

  function runnerProgramInstallTrashAssessment(
    input: AiDecisionInput,
    choice: PendingChoice,
    selectableOptions: PendingChoiceOptions,
  ): RunnerProgramInstallTrashAssessment {
    const sourceParts = choice.source.split(":");
    const engineMemoryContinuation =
      choice.source.startsWith("runner.program_install_memory:") &&
      sourceParts.length === 6
        ? {
            kind: sourceParts[1],
            targetCardId: sourceParts[2] ?? "",
            automaticFreedMemory: Number(sourceParts[3]),
            originalChoiceSource: decodeURIComponent(sourceParts[5] ?? ""),
          }
        : undefined;
    const sourceCardId = choice.source.startsWith(
      "v1912.delayed_install_memory:",
    )
      ? (sourceParts[2] ?? "")
      : (engineMemoryContinuation?.targetCardId ?? sourceParts[1] ?? "");
    const source = choice.source.startsWith("v1912.delayed_install_memory:")
      ? input.playerView.specialZones?.setAside.find(
          (card) => card.instanceId === sourceCardId,
        )
      : input.playerView.own.gripOrHq.find(
          (card) => card.instanceId === sourceCardId,
        );
    const accessMemoryMatch =
      engineMemoryContinuation?.kind === "access"
        ? /^access\.agenda_install_as_runner_program:([^:]+):([0-9]+)$/.exec(
            engineMemoryContinuation.originalChoiceSource,
          )
        : undefined;
    const automaticFreedMemory =
      typeof engineMemoryContinuation?.automaticFreedMemory === "number" &&
      Number.isInteger(engineMemoryContinuation.automaticFreedMemory)
        ? engineMemoryContinuation.automaticFreedMemory
        : 0;
    const sourceMemoryCostOverride =
      accessMemoryMatch?.[1] === sourceCardId
        ? Math.max(0, Number(accessMemoryMatch[2]) - automaticFreedMemory)
        : undefined;
    return runnerProgramInstallTrashAssessmentFromCards(
      input,
      source,
      selectableOptions,
      sourceMemoryCostOverride,
    );
  }

  function runnerProgramInstallTrashAssessmentForAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerProgramInstallTrashAssessment | undefined {
    if (
      input.side !== "runner" ||
      action.side !== "runner" ||
      action.type !== "install_card" ||
      (action.payload?.runnerProgramTrashBeforeInstall !== true &&
        !action.actionId.endsWith(".runner_program_trash_before_install"))
    ) {
      return undefined;
    }
    const sourceCardInstanceId =
      typeof action.payload.cardId === "string" ? action.payload.cardId : undefined;
    const source = sourceCardInstanceId
      ? input.playerView.own.gripOrHq.find(
          (card) => card.instanceId === sourceCardInstanceId,
        )
      : undefined;
    return runnerProgramInstallTrashAssessmentFromCards(input, source);
  }

  function runnerProgramInstallTrashAssessmentFromCards(
    input: AiDecisionInput,
    source: VisibleCard | undefined,
    selectableOptions?: PendingChoiceOptions,
    sourceMemoryCostOverride?: number,
  ): RunnerProgramInstallTrashAssessment {
    const memoryUsed = dependencies.safeNonNegativeInteger(
      input.playerView.own.memoryUsed,
    );
    const memoryLimit = dependencies.safeNonNegativeInteger(
      input.playerView.own.memoryLimit,
    );
    const sourceMemoryCost =
      sourceMemoryCostOverride ?? dependencies.visibleMemoryCost(source);
    const installedCards = dependencies.visibleCardsByInstanceId(
      input.playerView,
    );
    const installedBreakerRoleCounts = dependencies.visibleBreakerRoleCounts(
      input.playerView.own.rig ?? [],
    );
    const candidates = selectableOptions
      ? selectableOptions.map((option) => {
          const card =
            typeof option.value === "string"
              ? installedCards.get(option.value)
              : undefined;
          return programSacrificeCandidateForAi(
            input,
            card,
            installedBreakerRoleCounts,
            option,
          );
        })
      : (input.playerView.own.rig ?? []).map((card) =>
          programSacrificeCandidateForAi(
            input,
            card,
            installedBreakerRoleCounts,
          ),
        );
    return buildRunnerProgramInstallTrashAssessmentFromCards({
      memoryUsed,
      memoryLimit,
      sourceMemoryCost,
      candidates,
    });
  }

  function programSacrificeCandidateForAi(
    input: AiDecisionInput,
    card: VisibleCard | undefined,
    installedBreakerRoleCounts: ReadonlyMap<string, number>,
    option?: PendingChoiceOption,
  ): ProgramSacrificeCandidate {
    return buildProgramSacrificeCandidate(
      card,
      installedBreakerRoleCounts,
      option,
      {
        visibleMemoryCost: dependencies.visibleMemoryCost,
        rolesForCardId: dependencies.rolesForCardId,
        visibleBreakerRoles: dependencies.visibleBreakerRoles,
        isRunnerPressureRole: dependencies.isRunnerPressureRole,
        isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
        visibleCounterValue: dependencies.visibleCounterValue,
        visibleInstallCost: dependencies.visibleInstallCost,
        isRedundant: (candidate, breakerRoles) =>
          programSacrificeCandidateIsRedundant(input, candidate, breakerRoles),
      },
    );
  }

  function programSacrificeCandidateIsRedundant(
    input: AiDecisionInput,
    card: VisibleCard | undefined,
    breakerRoles: readonly string[],
  ): boolean {
    const rig = input.playerView.own.rig ?? [];
    const roleCounts = dependencies.visibleBreakerRoleCounts(rig);
    return buildProgramSacrificeCandidateIsRedundant(
      card,
      breakerRoles,
      rig,
      roleCounts,
    );
  }

  function runnerProgramInstallDisplacementPenalty(
    assessment: RunnerProgramInstallTrashAssessment | undefined,
  ): number {
    return buildRunnerProgramInstallDisplacementPenalty(assessment);
  }

  function runnerProgramSacrificeExclusion(
    input: AiDecisionInput,
    action: LegalAction,
  ): SemanticRuntimeExclusion | undefined {
    const assessment = runnerProgramInstallTrashAssessmentForAction(
      input,
      action,
    );
    return buildRunnerProgramSacrificeExclusion(input, action, {
      assessmentForAction: () => assessment,
      displacementPenalty: () =>
        runnerProgramInstallDisplacementPenalty(assessment),
    });
  }

  return {
    selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds,
    selectedRunnerMemoryCheckpointTrashOptionIds,
    runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallDisplacementPenalty,
    runnerProgramSacrificeExclusion,
  };
}
