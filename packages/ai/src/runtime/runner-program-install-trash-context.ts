import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import {
  programSacrificeCandidate as buildProgramSacrificeCandidate,
  programSacrificeCandidateIsRedundant as buildProgramSacrificeCandidateIsRedundant,
  runnerProgramInstallTrashAssessmentFromCards as buildRunnerProgramInstallTrashAssessmentFromCards,
  sacrificeCandidateLabel,
  type ProgramSacrificeCandidate,
  type RunnerProgramInstallTrashAssessment,
} from "./runner-program-install-trash-policy";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
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
  runnerProgramInstallTrashAssessment: (
    input: AiDecisionInput,
    choice: PendingChoice,
    selectableOptions: PendingChoiceOptions,
  ) => RunnerProgramInstallTrashAssessment;
  runnerProgramInstallTrashAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramInstallTrashAssessment | undefined;
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
    if (!assessment.canFreeRequiredMemory) return [];
    return assessment.selectedCandidates
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

  function runnerProgramInstallTrashAssessment(
    input: AiDecisionInput,
    choice: PendingChoice,
    selectableOptions: PendingChoiceOptions,
  ): RunnerProgramInstallTrashAssessment {
    const sourceCardId = choice.source.split(":")[1] ?? "";
    const source = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === sourceCardId,
    );
    return runnerProgramInstallTrashAssessmentFromCards(
      input,
      source,
      selectableOptions,
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
      action.payload?.runnerProgramTrashBeforeInstall !== true
    ) {
      return undefined;
    }
    const source =
      typeof action.source === "string"
        ? input.playerView.own.gripOrHq.find(
            (card) => card.instanceId === action.source,
          )
        : undefined;
    return runnerProgramInstallTrashAssessmentFromCards(input, source);
  }

  function runnerProgramInstallTrashAssessmentFromCards(
    input: AiDecisionInput,
    source: VisibleCard | undefined,
    selectableOptions?: PendingChoiceOptions,
  ): RunnerProgramInstallTrashAssessment {
    const memoryUsed = dependencies.safeNonNegativeInteger(
      input.playerView.own.memoryUsed,
    );
    const memoryLimit = dependencies.safeNonNegativeInteger(
      input.playerView.own.memoryLimit,
    );
    const sourceMemoryCost = dependencies.visibleMemoryCost(source);
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

  return {
    selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds,
    runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction,
  };
}
