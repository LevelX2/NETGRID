import {
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type CorpOptionalRezChoiceQuote,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { selectedBidChoiceOptionId } from "./bid-choice-option";
import { selectableChoiceOptions } from "./choice-option";
import { selectedCorpAdvancementCounterChoiceOptionId } from "./corp-advancement-counter-choice";
import { selectedCorpAccessPaymentChoiceOptionId } from "./corp-access-payment-choice";
import { selectedCorpHqRetainPaymentOptionIds } from "./corp-hq-retain-payment-choice";
import { selectedCorpHardwareTrashChoiceOptionIds } from "./corp-hardware-trash-choice";
import { corpInstalledHardwareTrashOperationProfile } from "./corp-canonical-card-facts";
import { selectedCorpProgramTrashChoiceOptionIds } from "./corp-program-trash-choice";
import {
  selectedDiscardChoiceOptionIds,
  type DiscardChoiceKeepScore,
} from "./discard-choice-selection";
import type { CorpHandManagementSignal } from "../plans/corp-tactical-plan-modules";
import {
  runnerDamagePreventionChoiceResolution,
  type RunnerOptionalChoiceResolution,
} from "./damage-prevention-choice-option";
import { selectedPlayfulAiChoiceOptionId } from "./playful-ai-choice-option";
import { selectedPostBidLinkChoiceOptionId } from "./post-bid-link-choice-option";
import {
  selectedSearchChoiceOptionIds,
  type SearchChoiceFeatureSnapshot,
} from "./search-choice-option";
import { selectedRunnerExposeInstalledCardChoiceOptionIds } from "./runner-expose-installed-card-choice";
import { selectedForcedChoiceOptionIds } from "./select-card-choice-option";
import { selectedSetupMulliganChoiceOptionId } from "./setup-mulligan-choice-option";
import { selectedShellTradersStartTurnChoiceOptionId } from "./shell-traders-choice-option";
import { runnerTagAvoidanceChoiceResolution } from "./tag-avoidance-choice-option";
import { latestTraceContext } from "./trace-context";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { getStrategicIntentMemorySnapshot } from "../strategic-intent-memory";
import type { StrategicIntentState } from "../strategic-intent-state";
import type { RequiredCapabilityKind } from "../plans/tactical-plan-types";
import type { AiHintStructuredEffect } from "../hint-ontology";
import {
  isRunnerTargetedBypassChoice,
  isRunnerTargetedBypassHideChoice,
  selectedRunnerTargetedBypassChoiceOptionId,
  selectedRunnerTargetedBypassHideChoiceOptionId,
} from "./runner-targeted-bypass-choice";
import { selectedRunnerStartOfTurnOrderChoiceOptionId } from "./runner-start-of-turn-order-choice";
import { selectedRunnerRunStartOrderChoiceOptionId } from "./runner-run-start-order-choice";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOptions = PendingChoice["options"];

export type SelectedChoicesForDecisionDependencies = {
  readonly evaluateCorpOpeningHand: (input: AiDecisionInput) => {
    readonly decision: string;
  };
  readonly evaluateRunnerOpeningHand: (input: AiDecisionInput) => {
    readonly decision: string;
  };
  readonly discardKeepScore: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => DiscardChoiceKeepScore;
  readonly selectedRunnerProgramInstallTrashOptionIds: (
    input: AiDecisionInput,
    choice: PendingChoice,
    selectableOptions: PendingChoiceOptions,
  ) => string[];
  readonly selectedRunnerForcedProgramTrashOptionIds: (
    input: AiDecisionInput,
    selectableOptions: PendingChoiceOptions,
  ) => string[];
  readonly selectedRunnerMemoryCheckpointTrashOptionIds: (
    input: AiDecisionInput,
    selectableOptions: PendingChoiceOptions,
  ) => string[];
  readonly extractAiFeatures: (
    input: AiDecisionInput,
  ) => SearchChoiceFeatureSnapshot;
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
  readonly effectsForCardId: (
    cardId: string | undefined,
  ) => readonly AiHintStructuredEffect[];
};

function selectedCorpDiscardOptionIdsFromResidentHandPlan(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: CorpHandManagementSignal }
    | undefined;
  const binding = moduleState?.signal?.discardChoiceBinding;
  if (
    executor?.moduleId !== "corp.hand_and_agenda_management" ||
    moduleState?.kind !== "hand" ||
    moduleState.signal?.phase !== "discard_window" ||
    binding?.actionId !== action.actionId ||
    binding.choiceId !== choice.choiceId ||
    binding.observedAtStateVersion !== input.playerView.stateVersion
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp hand plan must bind the exact discard choice and legal action before the resolver completes its payload.",
    );
  }
  return [...binding.selectedOptionIds];
}

function selectedRunnerDiscardOptionIdsFromResidentDefensePlan(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        signals?: {
          discardChoiceBinding?: {
            actionId: string;
            choiceId: string;
            observedAtStateVersion: number;
            selectedOptionIds: string[];
          };
        };
      }
    | undefined;
  const binding = moduleState?.signals?.discardChoiceBinding;
  if (
    executor?.moduleId !== "runner.defense_and_recovery" ||
    moduleState?.kind !== "defense" ||
    moduleState.phase !== "discard_window" ||
    binding?.actionId !== action.actionId ||
    binding.choiceId !== choice.choiceId ||
    binding.observedAtStateVersion !== input.playerView.stateVersion
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Runner defense plan must bind the exact discard choice and LegalAction before the resolver completes its payload.",
    );
  }
  return [...binding.selectedOptionIds];
}

function selectedCorpDrawFilterOptionIdsFromResidentHandPlan(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: CorpHandManagementSignal }
    | undefined;
  const binding = moduleState?.signal?.drawFilterChoiceBinding;
  if (
    executor?.moduleId !== "corp.hand_and_agenda_management" ||
    moduleState?.kind !== "hand" ||
    moduleState.signal?.phase !== "draw_filter_window" ||
    binding?.actionId !== action.actionId ||
    binding.choiceId !== choice.choiceId ||
    binding.observedAtStateVersion !== input.playerView.stateVersion
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp hand plan must bind the exact Strategic Planning Group choice and legal action before the resolver completes its payload.",
    );
  }
  return [...binding.selectedOptionIds];
}

function selectedCorpHqShuffleOptionIdsFromResidentHandPlan(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: CorpHandManagementSignal }
    | undefined;
  const binding = moduleState?.signal?.hqShuffleChoiceBinding;
  if (
    executor?.moduleId !== "corp.hand_and_agenda_management" ||
    moduleState?.kind !== "hand" ||
    moduleState.signal?.phase !== "hq_shuffle_window" ||
    binding?.actionId !== action.actionId ||
    binding.choiceId !== choice.choiceId ||
    binding.observedAtStateVersion !== input.playerView.stateVersion
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp hand plan must bind the exact Corporate Shuffle HQ choice and legal action before the resolver completes its payload.",
    );
  }
  return [...binding.selectedOptionIds];
}

function selectedCorpArchivesToHqOptionIdsFromBoundContinuation(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
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
  const bound =
    origin?.immediateChoicePolicy === "select_bound_corp_archives_cards_to_hq";
  const selectedCardIds = bound ? origin.selectedArchiveCardInstanceIds : [];
  const eligibleCardIds = bound ? origin.eligibleArchiveCardInstanceIds : [];
  const optionCardIds = selectableOptions.map((option) => option.value);
  const exactOptionSet =
    optionCardIds.every(
      (cardId): cardId is string => typeof cardId === "string",
    ) &&
    optionCardIds.length === eligibleCardIds.length &&
    new Set(optionCardIds).size === optionCardIds.length &&
    optionCardIds.every((cardId) => eligibleCardIds.includes(cardId));
  const expectedMinimum = bound
    ? origin.selectionMode === "all"
      ? 0
      : 1
    : undefined;
  const expectedMaximum = bound
    ? origin.selectionMode === "all"
      ? eligibleCardIds.length
      : 1
    : undefined;
  const exactBinding =
    bound &&
    input.side === "corp" &&
    choice.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.choiceId ===
      `v1922_corp_archives_to_hq_${input.playerView.stateVersion}` &&
    choice.source ===
      `v1922.corp_archives_to_hq:${origin.sourceCardInstanceId}:${input.playerView.stateVersion}` &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === expectedMinimum &&
    choice.maxSelections === expectedMaximum &&
    exactOptionSet &&
    selectedCardIds.length > 0 &&
    selectedCardIds.every((cardId) => eligibleCardIds.includes(cardId)) &&
    portfolio !== undefined &&
    portfolio.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion - 1 &&
    origin.selectedAtStateVersion === portfolio.stateVersion &&
    portfolio.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    portfolio.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    root.side === "corp" &&
    executor?.moduleId === "corp.hand_and_agenda_management" &&
    action.side === "corp" &&
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
  if (!exactBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp Archives-to-HQ resolver must complete only the exact target payload bound by the immediately preceding hand-plan source action and current Engine choice contract.",
    );
  }
  const selected = selectableOptions
    .filter(
      (option) =>
        typeof option.value === "string" &&
        selectedCardIds.includes(option.value),
    )
    .map((option) => option.id);
  if (selected.length !== selectedCardIds.length) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The current Corp Archives-to-HQ option set must still contain every target card bound by the source plan action.",
    );
  }
  return selected;
}

function selectedRunnerHiddenDrawReplacementOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  scoreDiscardCandidate: SelectedChoicesForDecisionDependencies["discardKeepScore"],
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
    portfolio.stateVersion === input.playerView.stateVersion - 1 &&
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

export function selectedChoicesForDecision(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SelectedChoicesForDecisionDependencies,
  currentPortfolio?: ResidentPlanPortfolio,
): AiDecision["selectedChoices"] | undefined {
  const choice = input.playerView.pendingChoice;
  if (action.type !== "resolve_choice" || !choice) return undefined;
  const selectableOptions = selectableChoiceOptions(choice.options);
  const resolved = (
    selectedOptionIds: readonly string[],
    resolverId: string,
  ): NonNullable<AiDecision["selectedChoices"]> =>
    validatedChoiceSelection(
      input,
      action,
      choice,
      selectableOptions,
      selectedOptionIds,
      resolverId,
    );
  if (choice.source === "setup.mulligan") {
    const opening =
      input.side === "corp"
        ? dependencies.evaluateCorpOpeningHand(input)
        : dependencies.evaluateRunnerOpeningHand(input);
    const selectedOptionId = selectedSetupMulliganChoiceOptionId(
      choice,
      opening.decision,
    );
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "setup_mulligan",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_option" &&
    choice.continuation?.family === "runner_hidden_draw_keep_or_top_replacement"
  ) {
    return resolved(
      selectedRunnerHiddenDrawReplacementOptionId(
        input,
        action,
        choice,
        selectableOptions,
        dependencies.discardKeepScore,
        currentPortfolio,
      ),
      "resident_runner_hidden_draw_replacement",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("v1922.corp_archives_to_hq:")
  ) {
    return resolved(
      selectedCorpArchivesToHqOptionIdsFromBoundContinuation(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_corp_archives_to_hq",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith(
      "card_implementation.strategic_planning_group_draw:",
    )
  ) {
    return resolved(
      selectedCorpDrawFilterOptionIdsFromResidentHandPlan(
        input,
        action,
        choice,
        currentPortfolio,
      ),
      "resident_corp_spg_draw_filter",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("classic.corporate_shuffle_hq_to_rd:")
  ) {
    return resolved(
      selectedCorpHqShuffleOptionIdsFromResidentHandPlan(
        input,
        action,
        choice,
        currentPortfolio,
      ),
      "resident_corp_corporate_shuffle_hq",
    );
  }
  if (choice.kind === "select_cards" && choice.source === "discard_phase") {
    if (input.side === "corp") {
      return resolved(
        selectedCorpDiscardOptionIdsFromResidentHandPlan(
          input,
          action,
          choice,
          currentPortfolio,
        ),
        "resident_corp_hand_discard",
      );
    }
    return resolved(
      selectedRunnerDiscardOptionIdsFromResidentDefensePlan(
        input,
        action,
        choice,
        currentPortfolio,
      ),
      "resident_runner_defense_discard",
    );
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner.checkpoint_memory_cleanup:")
  ) {
    return resolved(
      dependencies.selectedRunnerMemoryCheckpointTrashOptionIds(
        input,
        selectableOptions,
      ),
      "runner_checkpoint_memory_cleanup",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.continuation?.family === "runner_grip_install_with_temporary_credits"
  ) {
    return resolved(
      selectedRunnerEventInstallChoiceOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_runner_event_install_choice",
    );
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_start.delayed_install")
  ) {
    const selectedOptionId = selectedShellTradersStartTurnChoiceOptionId(
      choice,
      {
        input,
        rolesForCardId: dependencies.rolesForCardId,
      },
    );
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "runner_delayed_install",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_start.order:")
  ) {
    const selectedOptionId = selectedRunnerStartOfTurnOrderChoiceOptionId(
      input,
      action,
      choice,
      selectableOptions,
    );
    if (!selectedOptionId) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Resolve Runner start-of-turn ordering only from the exact current rule window and complete canonical source-effect profiles.",
      );
    }
    return resolved([selectedOptionId], "runner_start_of_turn_order");
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_run_start.order:")
  ) {
    const selectedOptionId = selectedRunnerRunStartOrderChoiceOptionId(
      input,
      action,
      choice,
      selectableOptions,
    );
    if (!selectedOptionId) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Resolve Runner run-start ordering only from the exact current rule window and a complete canonical pure self-trash source profile.",
      );
    }
    return resolved([selectedOptionId], "runner_run_start_order");
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("v1912.delayed_install_memory:")
  ) {
    return resolved(
      dependencies.selectedRunnerProgramInstallTrashOptionIds(
        input,
        choice,
        selectableOptions,
      ),
      "runner_delayed_install_memory",
    );
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_program_trash_before_install")
  ) {
    return resolved(
      dependencies.selectedRunnerProgramInstallTrashOptionIds(
        input,
        choice,
        selectableOptions,
      ),
      "runner_program_trash_before_install",
    );
  }
  if (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("p3_56.pass_ice_program_trash") ||
      choice.source.startsWith("card_implementation.active_ice_program_trash"))
  ) {
    return resolved(
      dependencies.selectedRunnerForcedProgramTrashOptionIds(
        input,
        selectableOptions,
      ),
      "runner_forced_program_trash",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("runner.installed_resource_trash_for_credits:")
  ) {
    return resolved(
      selectedRunnerInstalledCardLiquidationOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "runner_installed_card_liquidation",
    );
  }
  if (
    input.side === "corp" &&
    (choice.continuation?.family === "corp_advancement_counter" ||
      choice.source.startsWith("p3_34.distribute_advancement:") ||
      choice.source.startsWith("p3_34.move_advancement:"))
  ) {
    const scoreBinding = residentCorpScoreChoiceBinding(
      input,
      choice,
      selectableOptions,
    );
    const selected = selectedCorpAdvancementCounterChoiceOptionId(
      input,
      selectableOptions,
      scoreBinding.targetCardId,
    );
    return resolved(
      selected ? [selected] : [],
      "resident_corp_score_advancement",
    );
  }
  if (
    input.side === "corp" &&
    (choice.continuation?.family === "corp_scored_agenda_hq_shuffle" ||
      choice.source.startsWith("scored_agenda.hq_agenda_shuffle_credits:"))
  ) {
    const binding = residentCorpScoredAgendaHqShuffleBinding(
      input,
      action,
      choice,
      selectableOptions,
    );
    return resolved(
      binding.selectedOptionIds,
      "resident_corp_scored_agenda_hq_shuffle",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("scored_agenda.start_draw_choice:")
  ) {
    return resolved(
      [
        selectedCorpScoredAgendaStartDrawChoiceOptionId(
          input,
          action,
          choice,
          selectableOptions,
        ),
      ],
      "corp_scored_agenda_start_draw",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("card_implementation.classic_deflector:")
  ) {
    return resolved(
      selectedCorpClassicDeflectorOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "corp_classic_deflector_redirect",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith(
      "card_implementation.agenda_purge_install_targets:",
    )
  ) {
    return resolved(
      selectedCorpAgendaPurgeInstallTargetOptionIds(
        input,
        action,
        choice,
        selectableOptions,
      ),
      "corp_agenda_purge_install_targets",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source === "card_implementation.runner_installed_multi_trash" &&
    corpInstalledHardwareTrashOperationProfile(choice.sourceCardDefinitionId)
  ) {
    const selected = selectedCorpHardwareTrashChoiceOptionIds(
      input,
      action,
      choice,
      selectableOptions,
    );
    if (!selected) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Preserve the exact public installed-hardware target set, variable-X cardinality, state version and resolve-choice LegalAction binding.",
      );
    }
    return resolved(selected, "corp_hardware_trash_by_counter");
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("card_implementation.trash_installed_program:")
  ) {
    const selected = selectedCorpProgramTrashChoiceOptionIds(
      input,
      action,
      choice,
      selectableOptions,
      dependencies.rolesForCardId,
    );
    if (!selected) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Preserve the exact run, encountered ICE, printed subroutine, public installed-program target set and resolve-choice LegalAction binding.",
      );
    }
    return resolved(selected, "corp_program_trash_subroutine");
  }
  if (
    choice.kind === "select_cards" &&
    isHqToNewRemoteOptionalRezChoice(choice)
  ) {
    const selected = selectedAffordableOptionalRezOptionIds(
      input,
      choice,
      selectableOptions,
    );
    if (!selected) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Expose complete temporary-credit and installed-card rez-cost data for the HQ-to-remote rez choice.",
      );
    }
    return resolved(selected, "hq_to_new_remote_optional_rez");
  }
  if (
    choice.kind === "select_cards" &&
    isHqToNewRemoteInstallRezChoice(choice)
  ) {
    return resolved(
      selectedHqToNewRemoteInstallRezOptionIds(
        input,
        choice,
        selectableOptions,
      ),
      "hq_to_new_remote_install_rez",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith(
      "card_implementation.corp_choice_rez_or_trash_ice_decision:",
    )
  ) {
    const selected = selectedCorpRezOrTrashIceOptionId(
      input,
      choice,
      selectableOptions,
    );
    return resolved(
      selected !== undefined ? [selected] : [],
      "corp_rez_or_trash_ice",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "bid_amount" &&
    isRunnerTargetedBypassHideChoice(choice)
  ) {
    return resolved(
      [
        selectedRunnerTargetedBypassHideChoiceOptionId(
          input,
          action,
          choice,
          selectableOptions,
        ),
      ],
      "runner_targeted_bypass_hide",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    isRunnerTargetedBypassChoice(choice)
  ) {
    return resolved(
      [
        selectedRunnerTargetedBypassChoiceOptionId(
          input,
          action,
          choice,
          selectableOptions,
        ),
      ],
      "runner_targeted_bypass",
    );
  }
  if (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("v1917.corp_hq_agenda_reveal:") ||
      choice.source.startsWith("p3_36.show_hq_agendas_for_credits:"))
  ) {
    return resolved(
      selectableOptions
        .slice(0, choice.maxSelections)
        .map((option) => option.id),
      "corp_hq_agenda_reveal_for_credits",
    );
  }
  if (choice.source.startsWith("p3_35.access_payment")) {
    const selectedOptionId = selectedCorpAccessPaymentChoiceOptionId(
      input,
      choice,
      selectableOptions,
    );
    if (!selectedOptionId) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Preserve the exact Corp access-payment source, accessed-card binding, state version, pay/decline contract and Engine-certified credit cost.",
      );
    }
    return resolved([selectedOptionId], "corp_access_payment");
  }
  if (choice.kind === "select_cards") {
    const retainedHqCards = selectedCorpHqRetainPaymentOptionIds(
      input,
      choice,
      selectableOptions,
      dependencies.discardKeepScore,
    );
    if (retainedHqCards) {
      return resolved(retainedHqCards, "corp_hq_retain_payment");
    }
    const exposeSelected = selectedRunnerExposeInstalledCardChoiceOptionIds(
      input,
      choice,
      selectableOptions,
    );
    if (exposeSelected) {
      return resolved(exposeSelected, "runner_expose_installed_card");
    }
    const coverageBinding = runnerCoverageSearchChoiceBinding(input, choice);
    const preferredServerId =
      coverageBinding?.serverId ?? runnerStrategicSearchTarget(input);
    const searchSelected = selectedSearchChoiceOptionIds(
      choice,
      selectableOptions,
      {
        features: dependencies.extractAiFeatures(input),
        rolesForCardId: dependencies.rolesForCardId,
        effectsForCardId: dependencies.effectsForCardId,
        ...(coverageBinding
          ? {
              requiredCoverage: coverageBinding.requiredCoverage,
              ...(coverageBinding.targetCardInstanceId
                ? {
                    preferredCardInstanceId:
                      coverageBinding.targetCardInstanceId,
                  }
                : {}),
              ...(coverageBinding.targetDefinitionId
                ? {
                    preferredCardDefinitionId:
                      coverageBinding.targetDefinitionId,
                  }
                : {}),
            }
          : {}),
        ...(preferredServerId ? { preferredServerId } : {}),
      },
    );
    if (searchSelected) {
      return resolved(searchSelected, "search_choice");
    }
  }
  if (
    choice.source.startsWith("v1921.playful_ai") ||
    choice.source.startsWith("card_implementation.random_dice_split:")
  ) {
    const selectedOptionId = selectedPlayfulAiChoiceOptionId(choice);
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "playful_ai",
    );
  }
  if (choice.source.startsWith("trace_post_bid_link")) {
    const selectedOptionId = selectedPostBidLinkChoiceOptionId(
      choice,
      latestTraceContext(input),
    );
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "post_bid_link",
    );
  }
  if (choice.source.startsWith("runner_draw.draw_tax:")) {
    const selectedOptionId =
      selectableOptions.find((option) => option.id === "pay_credit")?.id ??
      selectableOptions.find((option) => option.id === "take_tag")?.id;
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "runner_draw_tax",
    );
  }
  if (choice.source.startsWith("runner_draw.draw_tax_rez:")) {
    const selectedOptionId =
      selectableOptions.find((option) => option.id.startsWith("rez_"))?.id ??
      selectableOptions.find((option) => option.id === "pass")?.id;
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "runner_draw_tax_rez",
    );
  }
  if (
    input.side === "runner" &&
    choice.source.startsWith("successful_run.credit_loss_spend:")
  ) {
    const selectedOptionId = selectedCreditLossSpendOptionId(
      input,
      selectableOptions,
    );
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "successful_run_credit_loss_spend",
    );
  }
  if (input.side === "runner") {
    if (choice.source === "v120.event_modification.prevent") {
      const selectedDamagePreventionOptionId =
        selectedRunnerOptionalChoiceOptionId(
          input,
          action,
          runnerDamagePreventionChoiceResolution(
            input,
            choice,
            selectableOptions,
          ),
          selectableOptions,
        );
      return resolved(
        [selectedDamagePreventionOptionId],
        "runner_damage_prevention",
      );
    }
    if (choice.source === "v120.event_modification.avoid") {
      const selectedTagAvoidanceOptionId = selectedRunnerOptionalChoiceOptionId(
        input,
        action,
        runnerTagAvoidanceChoiceResolution(choice, selectableOptions),
        selectableOptions,
      );
      return resolved([selectedTagAvoidanceOptionId], "runner_tag_avoidance");
    }
  }
  if (choice.kind === "bid_amount") {
    const selectedOptionId = selectedBidChoiceOptionId(
      input,
      choice,
      latestTraceContext(input),
    );
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "bid_amount",
    );
  }

  const forcedSelection = selectedForcedChoiceOptionIds(
    choice,
    selectableOptions,
  );
  if (forcedSelection !== undefined) {
    return resolved(forcedSelection, "engine_forced_selection");
  }
  throw unresolvedChoiceFailure(
    input,
    action,
    "Register a complete domain resolver or preserve an exact resident-plan continuation for this non-forced choice.",
  );
}

function selectedRunnerEventInstallChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const continuation = choice.continuation;
  const requirement = action.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactChoiceAndAction =
    continuation?.family === "runner_grip_install_with_temporary_credits" &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    continuation.createdAtStateVersion === input.playerView.stateVersion &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          phase?: unknown;
          eventInstallChoiceBinding?: Record<string, unknown>;
        };
      }
    | undefined;
  const binding = moduleState?.signal?.eventInstallChoiceBinding;
  const selectedOptionId = binding?.selectedOptionId;
  const selectedOption = selectableOptions.find(
    (option) => option.id === selectedOptionId,
  );
  const selectedTarget =
    typeof binding?.targetCardInstanceId === "string"
      ? input.playerView.own.gripOrHq.find(
          (card) => card.instanceId === binding.targetCardInstanceId,
        )
      : undefined;
  const exactPlanBinding =
    exactChoiceAndAction &&
    continuation !== undefined &&
    portfolio?.side === "runner" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    moduleState?.kind === "development" &&
    moduleState.signal?.phase === "resolve_event_install_choice" &&
    binding?.choiceId === choice.choiceId &&
    binding.actionId === action.actionId &&
    binding.sourceCardInstanceId === continuation.sourceCardInstanceId &&
    binding.sourceDefinitionId === continuation.sourceCardDefinitionId &&
    binding.sourceCapabilityKey === continuation.sourceCapabilityKey &&
    binding.sourceStateVersion === input.playerView.stateVersion &&
    binding.originSelectedAtStateVersion ===
      input.playerView.stateVersion - 1 &&
    typeof selectedOptionId === "string" &&
    selectedOption?.value === binding.targetCardInstanceId &&
    selectedTarget?.known !== false &&
    selectedTarget?.definitionId === binding.targetDefinitionId &&
    (selectedTarget?.type === "program" ||
      selectedTarget?.type === "hardware") &&
    continuation.allowedTypes.includes(selectedTarget.type);
  if (!exactPlanBinding || typeof selectedOptionId !== "string") {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Resolve the event-install payload only from the current runner.develop_board_and_hand executor and its exact canonical source-capability and visible target binding.",
    );
  }
  return [selectedOptionId];
}

function selectedCorpRezOrTrashIceOptionId(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string | undefined {
  const rezOptionId = selectableOptions.find(
    (option) => option.id === "rez_ice",
  )?.id;
  const trashOptionId = selectableOptions.find(
    (option) => option.id === "trash_ice",
  )?.id;
  const targetMatch =
    /^card_implementation\.corp_choice_rez_or_trash_ice_decision:([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const targetCardId = targetMatch?.[1];
  const targetIce = input.playerView.servers
    .flatMap((server) => server.ice)
    .find(
      (card) =>
        card.instanceId === targetCardId &&
        card.known === true &&
        card.rezzed === false,
    );
  const rezQuote = targetIce?.effectiveRezCostQuote;
  if (
    rezOptionId !== undefined &&
    rezQuote?.complete === true &&
    rezQuote.cardId === targetCardId &&
    rezQuote.expiresAtStateVersion === input.playerView.stateVersion &&
    Number.isFinite(rezQuote.finalCredits) &&
    rezQuote.finalCredits <= input.playerView.own.credits
  ) {
    return rezOptionId;
  }
  return trashOptionId;
}

function selectedRunnerInstalledCardLiquidationOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceMatch =
    /^runner\.installed_resource_trash_for_credits:([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceResourceInstanceId = sourceMatch?.[1];
  const sourceStateVersion = Number(sourceMatch?.[2]);
  const sourceResource = (input.playerView.own.rig ?? []).find(
    (card) =>
      card.instanceId === sourceResourceInstanceId &&
      card.known &&
      card.type === "resource" &&
      typeof card.definitionId === "string",
  );
  const requirement = action.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactChoiceAndAction =
    sourceResourceInstanceId !== undefined &&
    sourceStateVersion === input.playerView.stateVersion &&
    sourceResource?.definitionId !== undefined &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.economy" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          conversionId?: unknown;
          sourceResourceInstanceId?: unknown;
          sourceResourceDefinitionId?: unknown;
          actionId?: unknown;
          choiceId?: unknown;
          sourceStateVersion?: unknown;
          selectedOptionId?: unknown;
          disposition?: unknown;
        };
      }
    | undefined;
  const signal = moduleState?.signal;
  const passOption = selectableOptions.find((option) => option.id === "pass");
  const exactPlanBinding =
    exactChoiceAndAction &&
    portfolio?.side === "runner" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    moduleState?.kind === "installed_card_liquidation_choice" &&
    signal?.conversionId === `installed-card-liquidation:${choice.choiceId}` &&
    signal.sourceResourceInstanceId === sourceResourceInstanceId &&
    signal.sourceResourceDefinitionId === sourceResource?.definitionId &&
    signal.actionId === action.actionId &&
    signal.choiceId === choice.choiceId &&
    signal.sourceStateVersion === input.playerView.stateVersion &&
    signal.selectedOptionId === "pass" &&
    signal.disposition === "decline_unpriced_conversion" &&
    passOption !== undefined &&
    passOption.value === undefined;
  if (!exactPlanBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize an optional installed-card liquidation only from the current runner.economy executor and its exact conservative pass binding.",
    );
  }
  return ["pass"];
}

function selectedCorpClassicDeflectorOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceParts = choice.source.split(":");
  const subroutineIndex = Number(sourceParts[3]);
  const creditCost = Number(sourceParts[7]);
  let decoded:
    | {
        runId: string;
        sourceIceInstanceId: string;
        sourceDefinitionId: string;
        subroutineId: string;
      }
    | undefined;
  if (
    sourceParts.length === 9 &&
    sourceParts[0] === "card_implementation.classic_deflector" &&
    sourceParts[1] &&
    sourceParts[2] &&
    sourceParts[4] &&
    sourceParts[5]
  ) {
    try {
      decoded = {
        runId: decodeURIComponent(sourceParts[1]),
        sourceIceInstanceId: decodeURIComponent(sourceParts[2]),
        sourceDefinitionId: decodeURIComponent(sourceParts[4]),
        subroutineId: decodeURIComponent(sourceParts[5]),
      };
    } catch {
      decoded = undefined;
    }
  }
  const targetProfile = sourceParts[6];
  const autoBreakIfNoTarget = sourceParts[8] === "1";
  const requirement = action.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactChoiceAndAction =
    decoded !== undefined &&
    Number.isSafeInteger(subroutineIndex) &&
    subroutineIndex >= 0 &&
    Number.isSafeInteger(creditCost) &&
    creditCost >= 0 &&
    (targetProfile === "archives" ||
      targetProfile === "any_data_fort" ||
      targetProfile === "subsidiary_data_fort") &&
    (sourceParts[8] === "0" || sourceParts[8] === "1") &&
    choice.side === "corp" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signals?: Array<{
          kind?: unknown;
          phase?: unknown;
          actionIds?: unknown;
          choiceResolution?: Record<string, unknown>;
        }>;
      }
    | undefined;
  const signal = moduleState?.signals?.find(
    (candidate) =>
      candidate.kind === "generic" &&
      candidate.phase === "resolve_run_redirect" &&
      Array.isArray(candidate.actionIds) &&
      candidate.actionIds.length === 1 &&
      candidate.actionIds[0] === action.actionId &&
      candidate.choiceResolution?.kind === "classic_deflector_redirect" &&
      candidate.choiceResolution.choiceId === choice.choiceId,
  );
  const resolution = signal?.choiceResolution;
  const selectedOptionId = resolution?.selectedOptionId;
  const selectedOption = selectableOptions.find(
    (option) => option.id === selectedOptionId,
  );
  const disposition = resolution?.disposition;
  const selectedServerId = resolution?.selectedServerId;
  const exactSelection =
    (disposition === "decline" &&
      selectedServerId === undefined &&
      selectedOptionId === "decline" &&
      selectedOption?.value === "decline" &&
      creditCost > 0) ||
    (disposition === "redirect" &&
      typeof selectedServerId === "string" &&
      selectedOptionId === `server_${selectedServerId}` &&
      selectedOption?.value === selectedServerId);
  const exactPlanBinding =
    exactChoiceAndAction &&
    portfolio?.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    moduleState?.kind === "defense" &&
    resolution !== undefined &&
    resolution.sourceStateVersion === input.playerView.stateVersion &&
    resolution.runId === decoded?.runId &&
    resolution.sourceIceInstanceId === decoded?.sourceIceInstanceId &&
    resolution.sourceDefinitionId === decoded?.sourceDefinitionId &&
    resolution.subroutineIndex === subroutineIndex &&
    resolution.subroutineId === decoded?.subroutineId &&
    resolution.targetProfile === targetProfile &&
    resolution.creditCost === creditCost &&
    resolution.autoBreakIfNoTarget === autoBreakIfNoTarget &&
    exactSelection;
  if (!exactPlanBinding || typeof selectedOptionId !== "string") {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize a Classic Deflector payload only from the current corp.defend_servers executor and its exact plan-bound redirect or decline choice.",
    );
  }
  return [selectedOptionId];
}

function selectedRunnerOptionalChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  resolution: RunnerOptionalChoiceResolution | undefined,
  selectableOptions: PendingChoiceOptions,
): string {
  if (!resolution) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Invoke the Runner optional-choice resolver only for its exact registered source, kind, and selection cardinality.",
    );
  }
  if (resolution.kind === "select") return resolution.optionId;
  const passOptionId = selectableOptions.find(
    (option) => option.id === "pass",
  )?.id;
  if (!passOptionId) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Expose the exact pass option required by the Runner resolver's intentional pass decision.",
    );
  }
  return passOptionId;
}

function validatedChoiceSelection(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  selectedOptionIds: readonly string[],
  resolverId: string,
): NonNullable<AiDecision["selectedChoices"]> {
  const selectableIds = new Set(selectableOptions.map((option) => option.id));
  const uniqueIds = new Set(selectedOptionIds);
  const selectionIsValid =
    Number.isInteger(choice.minSelections) &&
    Number.isInteger(choice.maxSelections) &&
    choice.minSelections >= 0 &&
    choice.maxSelections >= choice.minSelections &&
    selectedOptionIds.length >= choice.minSelections &&
    selectedOptionIds.length <= choice.maxSelections &&
    uniqueIds.size === selectedOptionIds.length &&
    selectedOptionIds.every((optionId) => selectableIds.has(optionId));
  if (!selectionIsValid) {
    throw unresolvedChoiceFailure(
      input,
      action,
      `Make the registered ${resolverId} resolver return a unique selectable payload within the Engine min/max contract.`,
    );
  }
  return {
    choiceId: choice.choiceId,
    selectedOptionIds: [...selectedOptionIds],
  };
}

function unresolvedChoiceFailure(
  input: AiDecisionInput,
  action: LegalAction,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("window_origin_missing", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((legalAction) => legalAction.type),
    unresolvedActionIds: [action.actionId],
    owner: "window_resolution",
    removalCondition,
  });
}

function selectedCorpScoredAgendaStartDrawChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string {
  const sourceMatch =
    /^scored_agenda\.start_draw_choice:([^:]+):([0-9]+)$/.exec(choice.source);
  const sourceCardId = sourceMatch?.[1];
  const sourceStateVersion = Number(sourceMatch?.[2]);
  const sourceCard = sourceCardId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.instanceId === sourceCardId &&
          card.known &&
          card.type === "agenda",
      )
    : undefined;
  const draw = selectableOptions.find(
    (option) => option.id === "draw" && option.value === "draw",
  );
  const skip = selectableOptions.find(
    (option) => option.id === "skip" && option.value === "skip",
  );
  const exactOptions =
    selectableOptions.length === 2 && draw !== undefined && skip !== undefined;
  const requirement = action.choiceRequirements?.[0];
  const exactActionBinding =
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === 2 &&
    requirement.optionIds.includes("draw") &&
    requirement.optionIds.includes("skip");
  const rdCount = input.playerView.own.stackOrRdCount;
  if (
    input.playerView.timingPoint !== "corp_draw.mandatory_draw" ||
    choice.side !== "corp" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.visibility !== "public" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    sourceStateVersion !== input.playerView.stateVersion ||
    !sourceCard ||
    !exactOptions ||
    !exactActionBinding ||
    !Number.isSafeInteger(rdCount) ||
    rdCount < 0
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind the optional scored-agenda start draw to its exact public source agenda, current Engine choice/action contract, and visible R&D count.",
    );
  }
  return rdCount >= 2 ? draw.id : skip.id;
}

function selectedCorpAgendaPurgeInstallTargetOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string[] {
  const sourceMatch =
    /^card_implementation\.agenda_purge_install_targets:([^:]+):([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceAgendaId = sourceMatch?.[1];
  const revealedIds = sourceMatch?.[2]?.split(",").filter(Boolean) ?? [];
  const sourceStateVersion = Number(sourceMatch?.[3]);
  const sourceAgenda = sourceAgendaId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.instanceId === sourceAgendaId &&
          card.known &&
          card.type === "agenda",
      )
    : undefined;
  const targetServerIds = input.playerView.servers.map((server) => server.id);
  const allowedTargetServerIds = new Set([...targetServerIds, "new_remote"]);
  const revealedIdSet = new Set(revealedIds);
  const optionsByCardId = new Map<
    string,
    Map<string, PendingChoiceOptions[number]>
  >();
  let optionsAreExact = selectableOptions.length > 0;
  for (const option of selectableOptions) {
    const valueParts =
      typeof option.value === "string" ? option.value.split("|") : [];
    const [cardId, serverId] = valueParts;
    if (
      valueParts.length !== 2 ||
      !cardId ||
      !serverId ||
      !revealedIdSet.has(cardId) ||
      !allowedTargetServerIds.has(serverId) ||
      option.id !== `agenda_purge_${cardId}_${serverId}`
    ) {
      optionsAreExact = false;
      continue;
    }
    const optionsByServerId =
      optionsByCardId.get(cardId) ??
      new Map<string, PendingChoiceOptions[number]>();
    if (optionsByServerId.has(serverId)) optionsAreExact = false;
    optionsByServerId.set(serverId, option);
    optionsByCardId.set(cardId, optionsByServerId);
  }
  const expectedTargetServerIds = [...targetServerIds, "new_remote"];
  for (const optionsByServerId of optionsByCardId.values()) {
    if (
      optionsByServerId.size !== expectedTargetServerIds.length ||
      expectedTargetServerIds.some(
        (serverId) => !optionsByServerId.has(serverId),
      )
    ) {
      optionsAreExact = false;
    }
  }
  const revealedOptionsAreExact = revealedIds.every((cardId) =>
    choice.options.some(
      (option) =>
        option.id === `agenda_purge_revealed_${cardId}` &&
        option.value === cardId &&
        option.selectable === false,
    ),
  );
  const requirement = action.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactActionBinding =
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const exactChoiceContract =
    choice.side === "corp" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    sourceStateVersion === input.playerView.stateVersion &&
    choice.minSelections === choice.maxSelections &&
    choice.minSelections > 0 &&
    choice.minSelections === optionsByCardId.size &&
    revealedIds.length > 0 &&
    new Set(revealedIds).size === revealedIds.length &&
    sourceAgenda !== undefined &&
    targetServerIds.length > 0 &&
    optionsAreExact &&
    revealedOptionsAreExact &&
    exactActionBinding;
  if (!exactChoiceContract) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind Security Purge to its exact scored agenda, current hidden Corp choice/action contract, revealed-card set and complete visible target-server matrix.",
    );
  }

  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signals?: Array<{
          kind?: unknown;
          phase?: unknown;
          actionIds?: unknown;
          choiceResolution?: {
            kind?: unknown;
            choiceId?: unknown;
            sourceAgendaId?: unknown;
            sourceStateVersion?: unknown;
            revealedCardIds?: unknown;
            targets?: Array<{
              cardId?: unknown;
              serverId?: unknown;
              optionId?: unknown;
            }>;
          };
        }>;
      }
    | undefined;
  const signal = moduleState?.signals?.find(
    (candidate) =>
      candidate.kind === "generic" &&
      candidate.phase === "resolve_install_targets" &&
      Array.isArray(candidate.actionIds) &&
      candidate.actionIds.length === 1 &&
      candidate.actionIds[0] === action.actionId &&
      candidate.choiceResolution?.kind === "agenda_purge_install_targets" &&
      candidate.choiceResolution.choiceId === choice.choiceId,
  );
  const planResolution = signal?.choiceResolution;
  const planTargets = planResolution?.targets;
  const planRevealedCardIds = Array.isArray(planResolution?.revealedCardIds)
    ? planResolution.revealedCardIds
    : undefined;
  const selectedOptionIds =
    planTargets?.map((target) =>
      typeof target.optionId === "string" ? target.optionId : "",
    ) ?? [];
  const exactPlanBinding =
    portfolio?.side === "corp" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    moduleState?.kind === "defense" &&
    planResolution !== undefined &&
    planResolution.sourceAgendaId === sourceAgendaId &&
    planResolution.sourceStateVersion === input.playerView.stateVersion &&
    planRevealedCardIds !== undefined &&
    planRevealedCardIds.length === revealedIds.length &&
    revealedIds.every(
      (cardId, index) => planRevealedCardIds[index] === cardId,
    ) &&
    Array.isArray(planTargets) &&
    planTargets.length === choice.minSelections &&
    new Set(
      planTargets.map((target) =>
        typeof target.cardId === "string" ? target.cardId : "",
      ),
    ).size === planTargets.length &&
    planTargets.every((target) => {
      if (
        typeof target.cardId !== "string" ||
        typeof target.serverId !== "string" ||
        typeof target.optionId !== "string"
      ) {
        return false;
      }
      return (
        optionsByCardId.get(target.cardId)?.get(target.serverId)?.id ===
        target.optionId
      );
    });
  if (!exactPlanBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize Security Purge only from the current corp.defend_servers executor and its exact plan-bound ICE-to-server allocation.",
    );
  }
  return selectedOptionIds;
}

function residentCorpScoreChoiceBinding(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): { planInstanceId: string; targetCardId: string } {
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
        };
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const choiceContinuation = choice.continuation;
  const targetCardId =
    typeof continuation?.targetCardId === "string"
      ? continuation.targetCardId
      : undefined;
  const exactContinuation =
    portfolio !== undefined &&
    executor !== undefined &&
    moduleState?.kind === "score" &&
    typeof moduleState.signal?.agendaInstanceId === "string" &&
    moduleState.signal.agendaInstanceId === targetCardId &&
    continuation?.family === "corp_advancement_counter" &&
    typeof continuation.selectedActionId === "string" &&
    continuation.selectedActionId.length > 0 &&
    choiceContinuation?.family === "corp_advancement_counter" &&
    choiceContinuation.originActionId === continuation.selectedActionId &&
    choiceContinuation.createdAtStateVersion ===
      input.playerView.stateVersion &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    portfolio.stateVersion + 1 === input.playerView.stateVersion &&
    choice.stateVersion === input.playerView.stateVersion &&
    targetCardId !== undefined &&
    selectableOptions.some((option) =>
      advancementChoiceOptionTargetsCard(option.value, targetCardId),
    );
  if (!exactContinuation || !executor || !targetCardId) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "Bind the advancement choice to the immediately preceding resident Corp score executor, selected score-conversion action and exact agenda target.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return { planInstanceId: executor.instanceId, targetCardId };
}

function residentCorpScoredAgendaHqShuffleBinding(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): { planInstanceId: string; selectedOptionIds: string[] } {
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: { agendaInstanceId?: unknown };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
        };
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const choiceContinuation = choice.continuation;
  const knownHqAgendaIds = input.playerView.own.gripOrHq
    .filter((card) => card.known && card.type === "agenda")
    .map((card) => card.instanceId)
    .sort();
  const selectedOptionIds = selectableOptions.map((option) => option.id);
  const [choiceRequirement] = action.choiceRequirements ?? [];
  const optionAgendaIds = selectableOptions
    .map((option) =>
      typeof option.value === "string" ? option.value : undefined,
    )
    .filter((cardId): cardId is string => cardId !== undefined)
    .sort();
  const exactContinuation =
    choiceContinuation?.family === "corp_scored_agenda_hq_shuffle" &&
    choiceContinuation.createdAtStateVersion ===
      input.playerView.stateVersion &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    choiceRequirement?.choiceId === choice.choiceId &&
    choiceRequirement.minSelections === choice.minSelections &&
    choiceRequirement.maxSelections === choice.maxSelections &&
    choiceRequirement.optionIds.length === selectedOptionIds.length &&
    choiceRequirement.optionIds.every(
      (optionId, index) => optionId === selectedOptionIds[index],
    ) &&
    portfolio !== undefined &&
    executor !== undefined &&
    moduleState?.kind === "score" &&
    moduleState.signal?.agendaInstanceId ===
      choiceContinuation.agendaInstanceId &&
    continuation?.family === "corp_scored_agenda_on_score" &&
    typeof continuation.selectedActionId === "string" &&
    continuation.selectedActionId.length > 0 &&
    choiceContinuation.originActionId === continuation.selectedActionId &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    continuation.targetCardId === choiceContinuation.agendaInstanceId &&
    portfolio.stateVersion + 1 === input.playerView.stateVersion &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 0 &&
    choice.maxSelections === selectableOptions.length &&
    optionAgendaIds.length === selectableOptions.length &&
    optionAgendaIds.length === knownHqAgendaIds.length &&
    optionAgendaIds.every(
      (cardId, index) => cardId === knownHqAgendaIds[index],
    ) &&
    input.playerView.own.scoreArea.some(
      (card) =>
        card.known &&
        card.type === "agenda" &&
        card.instanceId === choiceContinuation.agendaInstanceId,
    );
  if (!exactContinuation || !executor) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "Bind the scored-agenda HQ shuffle to the immediately preceding resident Corp score executor, exact scored agenda, state version and complete visible HQ-agenda option set.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return { planInstanceId: executor.instanceId, selectedOptionIds };
}

function advancementChoiceOptionTargetsCard(
  value: PendingChoiceOptions[number]["value"],
  targetCardId: string,
): boolean {
  if (typeof value !== "string") return false;
  const moveParts = value.split("|");
  if (moveParts.length === 3 && !value.includes(":")) {
    return moveParts[1] === targetCardId;
  }
  return value.split("|").some((placement) => {
    const [cardId, amount] = placement.split(":");
    return (
      cardId === targetCardId &&
      Number.isFinite(Number(amount)) &&
      Number(amount) > 0
    );
  });
}

function runnerStrategicSearchTarget(
  input: AiDecisionInput,
): "hq" | "rd" | undefined {
  if (input.side !== "runner") return undefined;
  const enriched = input as AiDecisionInput & {
    ownStrategicIntentState?: StrategicIntentState;
    ownDeckSnapshot?: { deckSnapshotId?: string };
  };
  const target =
    enriched.ownStrategicIntentState?.targetVector ??
    getStrategicIntentMemorySnapshot(
      input,
      enriched.ownDeckSnapshot?.deckSnapshotId,
    )?.state.targetVector;
  return target?.kind === "central" &&
    (target.targetId === "hq" || target.targetId === "rd")
    ? target.targetId
    : undefined;
}

function runnerCoverageSearchChoiceBinding(
  input: AiDecisionInput,
  choice: PendingChoice,
):
  | {
      planInstanceId: string;
      actionId: string;
      requiredCoverage: RequiredCapabilityKind;
      serverId?: string;
      targetCardInstanceId?: string;
      targetDefinitionId?: string;
    }
  | undefined {
  if (input.side !== "runner") return undefined;
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.rig_and_coverage",
  );
  if (!executor) return undefined;
  const moduleState = executor.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        selectedSearchActionId?: unknown;
        selectedSearchStateVersion?: unknown;
        gap?: {
          requiredRole?: unknown;
          targetServerId?: unknown;
          directSearchChoiceBindings?: Array<{
            actionId?: unknown;
            sourceCardInstanceId?: unknown;
            sourceDefinitionId?: unknown;
            targetCardInstanceId?: unknown;
            targetDefinitionId?: unknown;
          }>;
        };
      }
    | undefined;
  if (
    moduleState?.kind !== "coverage" ||
    moduleState.phase !== "search_answer" ||
    typeof moduleState.selectedSearchActionId !== "string" ||
    typeof moduleState.selectedSearchStateVersion !== "number" ||
    moduleState.selectedSearchStateVersion !== portfolio?.stateVersion ||
    moduleState.selectedSearchStateVersion > input.playerView.stateVersion ||
    typeof moduleState.gap?.requiredRole !== "string"
  ) {
    throw coverageSearchChoiceBindingFailure(
      input,
      executor.instanceId,
      "The resident coverage executor lacks the exact selected search action and state-version binding.",
    );
  }
  const bindings =
    moduleState.gap.directSearchChoiceBindings?.filter(
      (candidate) =>
        candidate.actionId === moduleState.selectedSearchActionId &&
        typeof candidate.sourceCardInstanceId === "string" &&
        typeof candidate.sourceDefinitionId === "string" &&
        choice.sourceCardInstanceId === candidate.sourceCardInstanceId &&
        choice.sourceCardDefinitionId === candidate.sourceDefinitionId,
    ) ?? [];
  if (bindings.length !== 1) {
    throw coverageSearchChoiceBindingFailure(
      input,
      executor.instanceId,
      "The current structured search-choice source does not match exactly one binding for the selected coverage-search LegalAction.",
    );
  }
  const binding = bindings[0];
  if (!binding || typeof binding.actionId !== "string") {
    throw coverageSearchChoiceBindingFailure(
      input,
      executor.instanceId,
      "The exact coverage-search binding is incomplete.",
    );
  }
  return {
    planInstanceId: executor.instanceId,
    actionId: binding.actionId,
    requiredCoverage: moduleState.gap.requiredRole as RequiredCapabilityKind,
    ...(typeof moduleState.gap.targetServerId === "string"
      ? { serverId: moduleState.gap.targetServerId }
      : {}),
    ...(typeof binding.targetCardInstanceId === "string"
      ? { targetCardInstanceId: binding.targetCardInstanceId }
      : {}),
    ...(typeof binding.targetDefinitionId === "string"
      ? { targetDefinitionId: binding.targetDefinitionId }
      : {}),
  };
}

function coverageSearchChoiceBindingFailure(
  input: AiDecisionInput,
  planInstanceId: string,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("invalid_support_graph", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "support_graph",
    planInstanceId,
    removalCondition,
  });
}

function selectedCreditLossSpendOptionId(
  input: AiDecisionInput,
  selectableOptions: PendingChoiceOptions,
): string | undefined {
  const ownCredits = Math.max(0, input.playerView.own.credits);
  const opponentCredits = Math.max(0, input.playerView.opponent.credits);
  const strategicReserve = Math.min(3, Math.floor(ownCredits / 2));
  const maximumUsefulSpend = Math.min(
    opponentCredits,
    Math.max(0, ownCredits - strategicReserve),
  );
  return selectableOptions
    .map((option) => ({ option, amount: choiceNumericValue(option) }))
    .filter(
      (
        entry,
      ): entry is { option: PendingChoiceOptions[number]; amount: number } =>
        entry.amount !== undefined && entry.amount <= maximumUsefulSpend,
    )
    .sort(
      (left, right) =>
        right.amount - left.amount ||
        left.option.id.localeCompare(right.option.id),
    )[0]?.option.id;
}

function choiceNumericValue(
  option: PendingChoiceOptions[number],
): number | undefined {
  const value =
    typeof option.value === "number"
      ? option.value
      : typeof option.value === "string"
        ? Number.parseInt(option.value, 10)
        : Number.parseInt(option.id.replace(/^pay_/, ""), 10);
  return Number.isInteger(value) && value >= 0 ? value : undefined;
}

function isHqToNewRemoteOptionalRezChoice(choice: PendingChoice): boolean {
  return (
    choice.source.startsWith(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:",
    ) ||
    choice.source.startsWith(
      "card_implementation.hq_to_new_remote_install_rez.rez:",
    )
  );
}

function selectedAffordableOptionalRezOptionIds(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string[] | undefined {
  const quotedOptions = selectableOptions.map((option) => ({
    option,
    quote: option.hqInstallRezOptionQuote,
  }));
  if (
    quotedOptions.some(
      ({ option, quote }) =>
        !isExactOptionalRezChoiceQuoteBinding(input, choice, option, quote),
    )
  )
    return undefined;

  const selected: string[] = [];
  for (const { option, quote } of quotedOptions) {
    if (!quote) return undefined;
    if (!quote.complete || !quote.affordable) continue;
    selected.push(option.id);
    if (selected.length >= choice.maxSelections) break;
  }
  return selected.length >= choice.minSelections ? selected : [];
}

function isExactOptionalRezChoiceQuoteBinding(
  input: AiDecisionInput,
  choice: PendingChoice,
  option: PendingChoiceOptions[number],
  quote: CorpOptionalRezChoiceQuote | undefined,
): quote is CorpOptionalRezChoiceQuote {
  const sourceAgenda = quote
    ? input.playerView.own.scoreArea.find(
        (card) => card.instanceId === quote.sourceAgendaId,
      )
    : undefined;
  const boundServer = quote
    ? input.playerView.servers.find(
        (server) => server.id === quote.targetServerId,
      )
    : undefined;
  const boundServerCard =
    quote?.installedZone === "serverIce"
      ? boundServer?.ice.find((card) => card.instanceId === quote.cardId)
      : quote?.installedZone === "serverRoot"
        ? boundServer?.root.find((card) => card.instanceId === quote.cardId)
        : undefined;
  if (
    input.side !== "corp" ||
    choice.side !== "corp" ||
    !quote ||
    quote.schemaVersion !== CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION ||
    quote.kind !== CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND ||
    quote.context !== "hq_to_new_remote_optional_rez" ||
    quote.choiceId !== choice.choiceId ||
    quote.optionId !== option.id ||
    quote.stateVersion !== choice.stateVersion ||
    quote.stateVersion !== input.playerView.stateVersion ||
    !nonEmptyString(quote.sourceAgendaId) ||
    !nonEmptyString(quote.cardId) ||
    !nonEmptyString(quote.cardDefinitionId) ||
    option.value !== quote.cardId ||
    option.card?.known !== true ||
    option.card.instanceId !== quote.cardId ||
    option.card.definitionId !== quote.cardDefinitionId ||
    option.card.rezzed !== false ||
    sourceAgenda?.known !== true ||
    sourceAgenda.type !== "agenda" ||
    !nonEmptyString(quote.targetServerId) ||
    !/^remote_[1-9][0-9]*$/.test(quote.targetServerId) ||
    !boundServer ||
    boundServerCard?.known !== true ||
    boundServerCard.definitionId !== quote.cardDefinitionId ||
    boundServerCard.rezzed !== false ||
    (quote.installedZone !== "serverIce" &&
      quote.installedZone !== "serverRoot") ||
    !nonNegativeSafeInteger(quote.sequencePosition) ||
    quote.sequencePosition < 1
  )
    return false;
  if (!quote.complete) {
    const value = quote as unknown as Record<string, unknown>;
    return !OPTIONAL_REZ_COMPLETE_QUOTE_FIELDS.some((field) => field in value);
  }
  return (
    ((quote.cardType === "ice" && quote.installedZone === "serverIce") ||
      ((quote.cardType === "asset" || quote.cardType === "upgrade") &&
        quote.installedZone === "serverRoot")) &&
    quote.cardType === option.card.type &&
    nonNegativeSafeInteger(quote.baseCredits) &&
    nonNegativeSafeInteger(quote.finalCredits) &&
    nonNegativeSafeInteger(quote.mandatoryAdditionalCosts.agendaPoints) &&
    validDefinitionIdList(quote.reductionSourceDefinitionIds) &&
    validDefinitionIdList(quote.increaseSourceDefinitionIds) &&
    modifierDefinitionIdListsAreDisjoint(
      quote.reductionSourceDefinitionIds,
      quote.increaseSourceDefinitionIds,
    ) &&
    nonNegativeSafeInteger(quote.temporaryCreditsAvailable) &&
    nonNegativeSafeInteger(quote.temporaryCreditsApplied) &&
    nonNegativeSafeInteger(quote.regularCreditsAvailable) &&
    nonNegativeSafeInteger(quote.regularCreditsRequired) &&
    quote.temporaryCreditsApplied ===
      Math.min(quote.temporaryCreditsAvailable, quote.finalCredits) &&
    quote.regularCreditsRequired ===
      quote.finalCredits - quote.temporaryCreditsApplied &&
    quote.regularCreditsAvailable === input.playerView.own.credits &&
    quote.creditPayable ===
      quote.regularCreditsAvailable >= quote.regularCreditsRequired &&
    quote.additionalCostsPayable ===
      input.playerView.own.agendaPoints >=
        quote.mandatoryAdditionalCosts.agendaPoints &&
    quote.affordable === (quote.creditPayable && quote.additionalCostsPayable)
  );
}

function modifierDefinitionIdListsAreDisjoint(
  reductionIds: readonly string[] | undefined,
  increaseIds: readonly string[] | undefined,
): boolean {
  if (!reductionIds || !increaseIds) return true;
  const reductions = new Set(reductionIds);
  return increaseIds.every((id) => !reductions.has(id));
}

function validDefinitionIdList(value: readonly string[] | undefined): boolean {
  return (
    value === undefined ||
    (value.every(nonEmptyString) &&
      new Set(value).size === value.length &&
      value.every((entry, index) => index === 0 || value[index - 1]! < entry))
  );
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

const OPTIONAL_REZ_COMPLETE_QUOTE_FIELDS = [
  "cardType",
  "baseCredits",
  "finalCredits",
  "mandatoryAdditionalCosts",
  "reductionSourceDefinitionIds",
  "increaseSourceDefinitionIds",
  "temporaryCreditsAvailable",
  "temporaryCreditsApplied",
  "regularCreditsAvailable",
  "regularCreditsRequired",
  "creditPayable",
  "additionalCostsPayable",
  "affordable",
] as const;

function isHqToNewRemoteInstallRezChoice(choice: PendingChoice): boolean {
  return (
    choice.source.startsWith(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez:",
    ) ||
    choice.source.startsWith(
      "card_implementation.hq_to_new_remote_install_rez:",
    )
  );
}

function selectedHqToNewRemoteInstallRezOptionIds(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string[] {
  const handByInstanceId = new Map(
    input.playerView.own.gripOrHq.map((card) => [card.instanceId, card]),
  );
  const iceOptions: PendingChoiceOptions = [];
  const upgradeOptions: PendingChoiceOptions = [];
  const assetOptions: PendingChoiceOptions = [];
  for (const option of selectableOptions) {
    const card = handByInstanceId.get(choiceCardInstanceId(option));
    if (!card) continue;
    if (card.type === "ice") {
      iceOptions.push(option);
      continue;
    }
    if (card.type === "upgrade") {
      upgradeOptions.push(option);
      continue;
    }
    if (card.type === "asset") {
      assetOptions.push(option);
    }
  }
  const rootMain = assetOptions[0];
  const maxSelections = Math.max(0, choice.maxSelections);
  if (maxSelections === 0) return [];
  const selected: PendingChoiceOptions = [];
  const reserveRootSlot = rootMain ? 1 : 0;
  for (const option of iceOptions) {
    if (selected.length >= maxSelections - reserveRootSlot) break;
    selected.push(option);
  }
  if (rootMain && selected.length < maxSelections) selected.push(rootMain);
  for (const option of upgradeOptions) {
    if (selected.length >= maxSelections) break;
    selected.push(option);
  }
  return selected.map((option) => option.id);
}

function choiceCardInstanceId(option: PendingChoiceOptions[number]): string {
  if (typeof option.value === "string" && option.value.length > 0)
    return option.value;
  return option.id.startsWith("card_") ? option.id.slice(5) : option.id;
}
