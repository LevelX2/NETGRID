import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { selectedDiscardChoiceOptionIds } from "../../runtime/discard-choice-selection";
import {
  PendingChoice,
  PendingChoiceOptions,
  unresolvedChoiceFailure,
} from "../../runtime/plan-bound-choice-contract";
import type {
  RunWindowDiscardKeepScore,
  RunWindowProgramInstallTrashSelection,
} from "./run-window-services";

export function selectedRunnerHiddenDrawReplacementOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  scoreDiscardCandidate: RunWindowDiscardKeepScore,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const continuation = choice.continuation;
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const origin = portfolio?.selectedActionOrigin;
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const root = portfolio?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const [requirement] = action.choiceRequirements ?? [];
  const exactOptions =
    continuation?.family === "runner_hidden_draw_keep_or_top_replacement" &&
    selectableOptions.length === continuation.drawnCardInstanceIds.length * 2 &&
    continuation.drawnCardInstanceIds.every((cardId) => {
      const choices = selectableOptions.filter(
        (option) =>
          option.value === `${cardId}:trash` ||
          option.value === `${cardId}:top`,
      );
      return (
        choices.length === 2 &&
        choices.every(
          (option) =>
            option.card?.instanceId === cardId &&
            option.card.known !== false &&
            typeof option.card.definitionId === "string" &&
            option.card.definitionId.length > 0,
        )
      );
    });
  const exactBinding =
    input.side === "runner" &&
    continuation?.family === "runner_hidden_draw_keep_or_top_replacement" &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.sourceCardInstanceId === continuation.sourceCardInstanceId &&
    choice.sourceCardDefinitionId === continuation.sourceCardDefinitionId &&
    continuation.createdAtStateVersion === input.playerView.stateVersion &&
    continuation.originActionId.length > 0 &&
    portfolio !== undefined &&
    portfolio.side === "runner" &&
    portfolio.stateVersion < input.playerView.stateVersion &&
    origin !== undefined &&
    origin.selectedAtStateVersion === portfolio.stateVersion &&
    origin.selectedActionId === continuation.originActionId &&
    origin.immediateChoicePolicy === "trash_lowest_visible_drawn_card" &&
    portfolio.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    portfolio.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === selectableOptions.length &&
    selectableOptions.every((option) =>
      requirement.optionIds.includes(option.id),
    ) &&
    exactOptions;
  if (!exactBinding || !continuation) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The hidden draw replacement must preserve the immediately preceding Runner plan executor, exact source action, complete private drawn-card options and bound discard policy.",
    );
  }
  const discardOptions = selectableOptions
    .filter((option) =>
      continuation.drawnCardInstanceIds.some(
        (cardId) => option.value === `${cardId}:trash`,
      ),
    )
    .map((option) => ({
      ...option,
      value: option.card!.instanceId,
    }));
  const selected = selectedDiscardChoiceOptionIds(
    input,
    choice,
    discardOptions,
    scoreDiscardCandidate,
  );
  if (selected.length !== 1) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The bound hidden draw policy must select exactly one visible drawn card to trash.",
    );
  }
  return selected;
}

export function selectedRunnerPostBreakStealthLossOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const continuation = choice.continuation;
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const origin = portfolio?.selectedActionOrigin;
  const bound =
    origin?.immediateChoicePolicy === "resolve_runner_post_break_stealth_loss";
  const root = portfolio?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const [requirement] = action.choiceRequirements ?? [];
  const expectedSelections =
    continuation?.family === "runner_post_break_stealth_loss" &&
    continuation.sourceMode === "single_stealth_card"
      ? 1
      : continuation?.family === "runner_post_break_stealth_loss"
        ? continuation.requiredLoss
        : undefined;
  const exactBinding =
    input.side === "runner" &&
    continuation?.family === "runner_post_break_stealth_loss" &&
    bound &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.source ===
      `v1922.post_break_stealth_loss:${continuation.sourceMode}:${continuation.requiredLoss}:${continuation.breakerInstanceId}:${input.playerView.stateVersion}` &&
    continuation.createdAtStateVersion === input.playerView.stateVersion &&
    expectedSelections !== undefined &&
    choice.minSelections === expectedSelections &&
    choice.maxSelections === expectedSelections &&
    portfolio !== undefined &&
    portfolio.side === "runner" &&
    portfolio.stateVersion === input.playerView.stateVersion - 1 &&
    origin.selectedAtStateVersion === portfolio.stateVersion &&
    origin.selectedActionId === continuation.originActionId &&
    origin.breakerInstanceId === continuation.breakerInstanceId &&
    origin.requiredLoss === continuation.requiredLoss &&
    origin.sourceMode === continuation.sourceMode &&
    portfolio.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    portfolio.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === selectableOptions.length &&
    selectableOptions.every((option) =>
      requirement.optionIds.includes(option.id),
    );
  if (!exactBinding || expectedSelections === undefined) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The post-break Stealth-loss resolver must complete only the exact mandatory loss payload bound by the immediately preceding run-window break action and current Engine continuation.",
    );
  }
  return selectableOptions
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, expectedSelections)
    .map((option) => option.id);
}

export function selectedRunnerAccessProgramInstallMemoryOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  selectProgramIds: RunWindowProgramInstallTrashSelection,
): string[] {
  const sourceParts = choice.source.split(":");
  const targetCardId = sourceParts[2];
  const automaticFreedMemory = Number(sourceParts[3]);
  const originalChoiceId = decodeURIComponent(sourceParts[4] ?? "");
  const originalChoiceSource = decodeURIComponent(sourceParts[5] ?? "");
  const originalSourceMatch =
    /^access\.agenda_install_as_runner_program:([^:]+):([0-9]+)$/.exec(
      originalChoiceSource,
    );
  const installedRigCardIds = new Set(
    (input.playerView.own.rig ?? []).map((card) => card.instanceId),
  );
  const exactOptions =
    selectableOptions.length > 0 &&
    selectableOptions.every(
      (option) =>
        typeof option.value === "string" &&
        option.id === `card_${option.value}` &&
        installedRigCardIds.has(option.value),
    );
  const requirement = action.choiceRequirements?.[0];
  const exactActionBinding =
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === selectableOptions.length &&
    requirement.optionIds.every(
      (optionId, index) => optionId === selectableOptions[index]?.id,
    );
  const exactWindow =
    sourceParts.length === 6 &&
    sourceParts[0] === "runner.program_install_memory" &&
    sourceParts[1] === "access" &&
    targetCardId !== undefined &&
    Number.isInteger(automaticFreedMemory) &&
    automaticFreedMemory >= 0 &&
    originalChoiceId.startsWith(`runner.steal_agenda.${targetCardId}.`) &&
    originalSourceMatch?.[1] === targetCardId &&
    Number(originalSourceMatch[2]) > 0 &&
    choice.side === "runner" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === 1 &&
    choice.maxSelections === selectableOptions.length &&
    exactOptions;
  if (!exactActionBinding || !exactWindow) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete accessed-agenda program installation only from the exact Engine continuation, current installed-program option set and matching resolve-choice action.",
    );
  }
  const selectedOptionIds = selectProgramIds(input, choice, selectableOptions);
  if (selectedOptionIds.length === 0) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The accessed-agenda memory continuation must select the minimal installed-program set that satisfies its encoded memory deficit.",
    );
  }
  return selectedOptionIds;
}

export function selectedRunnerBrokenIceVirusCounterOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        brokenIceVirusCounterChoiceBinding?: {
          choiceId?: unknown;
          actionId?: unknown;
          selectedOptionIds?: unknown;
          observedAtStateVersion?: unknown;
        };
      }
    | undefined;
  const binding = executorState?.brokenIceVirusCounterChoiceBinding;
  const selectedOptionIds = Array.isArray(binding?.selectedOptionIds)
    ? binding.selectedOptionIds.filter(
        (optionId): optionId is string => typeof optionId === "string",
      )
    : [];
  const optionIds = selectableOptions.map((option) => option.id);
  const sourceIds = new Set(
    selectedOptionIds.flatMap((optionId) => {
      const option = selectableOptions.find((entry) => entry.id === optionId);
      return typeof option?.metadata?.sourceCardInstanceId === "string"
        ? [option.metadata.sourceCardInstanceId]
        : [];
    }),
  );
  const [requirement] = action.choiceRequirements ?? [];
  const exactBinding =
    portfolio?.side === "runner" &&
    executor !== undefined &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    binding?.choiceId === choice.choiceId &&
    binding.actionId === action.actionId &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    selectedOptionIds.length === choice.minSelections &&
    sourceIds.size === choice.minSelections &&
    choice.source ===
      `broken_ice.virus_counter:${input.playerView.stateVersion}` &&
    choice.choiceId ===
      `broken_ice_virus_counter_${input.playerView.stateVersion}` &&
    choice.side === "runner" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "public" &&
    choice.minSelections > 0 &&
    choice.maxSelections === choice.minSelections &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete broken-ICE virus counters only from the exact resident Runner run-plan binding and matching Engine choice payload.",
    );
  }
  return selectedOptionIds;
}

export function selectedRunnerVacuumLinkRewindOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        vacuumLinkChoiceBinding?: {
          choiceId?: unknown;
          actionId?: unknown;
          selectedOptionId?: unknown;
          sourceCardInstanceId?: unknown;
          sourceCardDefinitionId?: unknown;
          observedAtStateVersion?: unknown;
        };
      }
    | undefined;
  const binding = executorState?.vacuumLinkChoiceBinding;
  const resume = selectableOptions.find(
    (option) =>
      option.id === "resume_from_rezzed_ice_back" &&
      option.value === "resume_from_rezzed_ice_back",
  );
  const jackOut = selectableOptions.find(
    (option) => option.id === "jack_out" && option.value === "jack_out",
  );
  const [requirement] = action.choiceRequirements ?? [];
  const exactChoiceId =
    /^card_implementation\.vacuum_link_rewind:[^:]+:([0-9]+)$/.exec(
      choice.choiceId,
    )?.[1] === String(input.playerView.stateVersion);
  const exactBinding =
    portfolio?.side === "runner" &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    binding?.choiceId === choice.choiceId &&
    binding.actionId === action.actionId &&
    binding.selectedOptionId === resume?.id &&
    binding.sourceCardInstanceId === choice.sourceCardInstanceId &&
    binding.sourceCardDefinitionId === choice.sourceCardDefinitionId &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    exactChoiceId &&
    choice.side === "runner" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "public" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selectableOptions.length === 2 &&
    resume !== undefined &&
    jackOut !== undefined &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === 2 &&
    requirement.optionIds.includes(resume.id) &&
    requirement.optionIds.includes(jackOut.id);
  if (!exactBinding || !resume) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete Vacuum Link only from the exact resident Runner run-plan continuation and matching Engine choice payload.",
    );
  }
  return [resume.id];
}

export function selectedRunnerTraceBaseLinkOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        traceBaseLinkChoiceBinding?: {
          choiceId?: unknown;
          actionId?: unknown;
          selectedOptionId?: unknown;
          sourceCardInstanceId?: unknown;
          observedAtStateVersion?: unknown;
        };
      }
    | undefined;
  const binding = executorState?.traceBaseLinkChoiceBinding;
  const selectedOption = selectableOptions.find(
    (option) => option.id === binding?.selectedOptionId,
  );
  const traceId = choice.source.slice("trace_base_link:".length);
  const selectedSourceId =
    selectedOption?.id === "pass"
      ? undefined
      : typeof selectedOption?.value === "string"
        ? selectedOption.value
        : undefined;
  const [requirement] = action.choiceRequirements ?? [];
  const optionIds = selectableOptions.map((option) => option.id);
  const exactBinding =
    portfolio?.side === "runner" &&
    executor !== undefined &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    binding?.choiceId === choice.choiceId &&
    binding.actionId === action.actionId &&
    binding.selectedOptionId === selectedOption?.id &&
    binding.sourceCardInstanceId === selectedSourceId &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    input.playerView.trace?.traceId === traceId &&
    input.playerView.trace.phase === "base_link" &&
    choice.side === "runner" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selectedOption !== undefined &&
    (selectedOption.id === "pass" ||
      (selectedSourceId !== undefined &&
        (input.playerView.own.rig ?? []).some(
          (card) => card.known && card.instanceId === selectedSourceId,
        ))) &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !selectedOption) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete Trace Base-Link only from the exact current Runner run-plan binding and Engine choice payload.",
    );
  }
  return [selectedOption.id];
}

export function selectedRunnerTraceSuccessCancelOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        traceSuccessCancelChoiceBinding?: {
          choiceId?: unknown;
          actionId?: unknown;
          selectedOptionId?: unknown;
          sourceCardInstanceId?: unknown;
          observedAtStateVersion?: unknown;
        };
      }
    | undefined;
  const binding = executorState?.traceSuccessCancelChoiceBinding;
  const selectedOption = selectableOptions.find(
    (option) => option.id === binding?.selectedOptionId,
  );
  const traceId = choice.source.slice("trace_success_cancel:".length);
  const selectedSourceId =
    selectedOption?.id === "pass"
      ? undefined
      : typeof selectedOption?.value === "string"
        ? selectedOption.value
        : undefined;
  const selectedSupport =
    selectedSourceId === undefined
      ? undefined
      : input.playerView.own.runnerTraceSupportQuote?.traceSuccessCancelOptions.find(
          (entry) =>
            entry.sourceCardInstanceId === selectedSourceId &&
            entry.activationCost <= input.playerView.own.credits,
        );
  const [requirement] = action.choiceRequirements ?? [];
  const optionIds = selectableOptions.map((option) => option.id);
  const exactBinding =
    portfolio?.side === "runner" &&
    executor !== undefined &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    binding?.choiceId === choice.choiceId &&
    binding.actionId === action.actionId &&
    binding.selectedOptionId === selectedOption?.id &&
    binding.sourceCardInstanceId === selectedSourceId &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    input.playerView.trace?.traceId === traceId &&
    input.playerView.trace.phase === "trace_success_cancel" &&
    choice.side === "runner" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    selectedOption !== undefined &&
    (selectedOption.id === "pass" ||
      (selectedSourceId !== undefined &&
        selectedSupport !== undefined &&
        (input.playerView.own.rig ?? []).some(
          (card) => card.known && card.instanceId === selectedSourceId,
        ))) &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !selectedOption) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete Trace success-cancel only from the exact current Runner run-plan binding, installed quoted support source and Engine choice payload.",
    );
  }
  return [selectedOption.id];
}
