import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { cardLooksLikeBreaker } from "../../plans/tactical-plan-breaker-cards";
import { selectableChoiceOptions } from "../../runtime/choice-option";
import { unresolvedChoiceFailure } from "../../runtime/plan-bound-choice-contract";
import type {
  DefenseState,
  RunnerProgramTrashBackupBinding,
} from "./defense-types";

const INTERRUPT_SOURCE = "v120.event_modification.interrupt";
const TARGET_SOURCE_PREFIX = "v120.event_modification.trash_targets:";
const BACKUP_OPTION = "backup_trashed_programs";
const BACKUP_TARGET = "backup_program_target";

function backupChoiceStage(input: AiDecisionInput) {
  const choice = input.playerView.pendingChoice;
  if (!choice || input.side !== "runner") return;
  if (
    choice.source === INTERRUPT_SOURCE &&
    choice.options.some(
      (option) => option.metadata?.optionKind === BACKUP_OPTION,
    )
  )
    return "offer" as const;
  if (
    choice.source.startsWith(TARGET_SOURCE_PREFIX) &&
    choice.options.some(
      (option) => option.metadata?.optionKind === BACKUP_TARGET,
    )
  )
    return "targets" as const;
}

export function isRunnerProgramTrashBackupWindow(
  input: AiDecisionInput,
): boolean {
  return backupChoiceStage(input) !== undefined;
}

function readBackupWindow(input: AiDecisionInput, action: LegalAction) {
  const choice = input.playerView.pendingChoice;
  const stage = backupChoiceStage(input);
  if (!choice || !stage) return;
  const options = selectableChoiceOptions(choice.options);
  const optionIds = options.map((option) => option.id);
  const requirement = action.choiceRequirements?.[0];
  const stateVersion = input.playerView.stateVersion;
  const rig = input.playerView.own.rig ?? [];
  const source = (id: string | undefined) =>
    rig.find(
      (card) =>
        card.known && card.type === "hardware" && card.instanceId === id,
    );
  if (
    choice.side !== "runner" ||
    choice.stateVersion !== stateVersion ||
    action.type !== "resolve_choice" ||
    action.side !== "runner" ||
    action.source !== "game_rule" ||
    action.expiresAtStateVersion !== stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== choice.minSelections ||
    requirement.maxSelections !== choice.maxSelections ||
    requirement.optionIds.length !== optionIds.length ||
    new Set(optionIds).size !== optionIds.length ||
    optionIds.some((id) => !requirement.optionIds.includes(id))
  )
    return;
  const common = { choiceId: choice.choiceId, stateVersion, optionIds };
  if (stage === "offer") {
    if (
      choice.kind !== "select_option" ||
      choice.minSelections !== 1 ||
      choice.maxSelections !== 1
    )
      return;
    const backups = options.filter(
      (option) => option.metadata?.optionKind === BACKUP_OPTION,
    );
    if (
      !options.some(
        (option) =>
          option.id === "pass" && option.metadata?.optionKind === "allow_trash",
      ) ||
      backups.length !== options.length - 1 ||
      backups.some((option) => !source(option.metadata?.sourceCardInstanceId))
    )
      return;
    return { ...common, stage, backups };
  }
  const hardware = source(choice.sourceCardInstanceId);
  if (
    !hardware ||
    choice.kind !== "select_cards" ||
    choice.minSelections !== 0 ||
    choice.maxSelections !== options.length ||
    choice.selectionOrdering !== "ordered"
  )
    return;
  const targets = options.flatMap((option) => {
    const card = rig.find(
      (card) =>
        card.known &&
        card.type === "program" &&
        card.instanceId === option.metadata?.targetCardInstanceId &&
        card.instanceId === option.id,
    );
    return card && option.metadata?.optionKind === BACKUP_TARGET
      ? [{ optionId: option.id, card }]
      : [];
  });
  if (targets.length !== options.length) return;
  return {
    ...common,
    stage,
    targets,
    sourceCardInstanceId: hardware.instanceId,
  };
}

export function runnerProgramTrashBackupBinding(
  input: AiDecisionInput,
): RunnerProgramTrashBackupBinding | undefined {
  if (!isRunnerProgramTrashBackupWindow(input)) return;
  const action = input.legalActions.find(
    (entry) => entry.type === "resolve_choice",
  );
  if (!action) return;
  const window = readBackupWindow(input, action);
  if (!window)
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind program backup to the current Engine window, installed source and exact target options.",
    );
  const { stage, choiceId, stateVersion, optionIds } = window;
  if (stage === "offer") {
    const ordered = [...window.backups].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const choice = ordered[0];
    if (!choice?.metadata?.sourceCardInstanceId)
      throw unresolvedChoiceFailure(
        input,
        action,
        "Bind the offered backup hardware before accepting program replacement.",
      );
    return {
      stage,
      choiceId,
      stateVersion,
      optionIds,
      actionId: action.actionId,
      selectedOptionIds: [choice.id],
      sourceCardInstanceId: choice.metadata.sourceCardInstanceId,
    };
  }
  // The last item becomes the next recovery target. Keep breakers above
  // utility programs while preserving the Engine's order within each group.
  const selectedOptionIds = [...window.targets]
    .sort(
      (a, b) =>
        Number(cardLooksLikeBreaker(a.card)) -
        Number(cardLooksLikeBreaker(b.card)),
    )
    .map((target) => target.optionId);
  return {
    stage,
    choiceId,
    stateVersion,
    optionIds,
    actionId: action.actionId,
    selectedOptionIds,
    sourceCardInstanceId: window.sourceCardInstanceId,
  };
}

export function selectedRunnerProgramTrashBackup(
  input: AiDecisionInput,
  action: LegalAction,
  portfolio: ResidentPlanPortfolio | undefined,
): string[] {
  const executor = portfolio?.instances.find(
    (entry) =>
      entry.instanceId === portfolio.executorInstanceId &&
      entry.moduleId === "runner.defense_and_recovery",
  );
  const state = executor?.moduleState as DefenseState | undefined;
  const binding = state?.signals.programTrashBackupBinding;
  const window = readBackupWindow(input, action);
  const boundSource =
    window?.stage === "offer"
      ? window.backups.find(
          (option) => option.id === binding?.selectedOptionIds[0],
        )?.metadata?.sourceCardInstanceId
      : window?.sourceCardInstanceId;
  if (
    state?.phase !== "back_up_trashed_programs" ||
    !binding ||
    !window ||
    portfolio?.stateVersion !== window.stateVersion ||
    binding.stage !== window.stage ||
    binding.choiceId !== window.choiceId ||
    binding.stateVersion !== window.stateVersion ||
    binding.actionId !== action.actionId ||
    binding.sourceCardInstanceId !== boundSource ||
    binding.optionIds.length !== window.optionIds.length ||
    window.optionIds.some((id) => !binding.optionIds.includes(id)) ||
    binding.selectedOptionIds.some((id) => !window.optionIds.includes(id))
  )
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete program backup only from the exact current Runner defense plan, source and selected options.",
    );
  return binding.selectedOptionIds;
}
