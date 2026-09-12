import {
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type CorpOptionalRezChoiceQuote,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import {
  selectedCorpAccessPaymentOptionsFromAmbushPlan,
  selectedCorpAccessProgramBounceOptionIdsFromResidentAmbushPlan,
} from "../corp/ambush/ambush-choice-binding";
import {
  selectedCorpAgendaPurgeInstallTargetOptionIds,
  selectedCorpClassicDeflectorOptionId,
  selectedCorpRezOrTrashIceOptionId,
} from "../corp/defense/defense-choice-binding";
import type {
  CorpEconomyDevelopmentSignal,
  CorpEconomyStartRezChoiceSignal,
} from "../corp/economy/economy-types";
import type { CorpHandManagementSignal } from "../corp/hand-management/hand-management-types";
import { isExactScoreRecoveryChoiceOwner } from "../corp/score/score-recovery-choice-owner";
import {
  residentCorpScoreChoiceBinding,
  residentCorpScoredAgendaHqShuffleBinding,
  selectedCorpDelayedSuccessOptionId,
  selectedCorpSatelliteMonitorsStartOptionId,
  selectedCorpScoredAgendaFreeRezOptionId,
  selectedCorpScoredAgendaIceMarkOptionId,
  selectedCorpScoredAgendaStartDrawChoiceOptionId,
  selectedCorpScoredAgendaSubtypeRevealOptionIds,
} from "../corp/score/score-choice-binding";
import type { AiHintStructuredEffect } from "../hint-ontology";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import type { RequiredCapabilityKind } from "../plans/tactical-plan-types";
import { selectedRunnerExposeInstalledCardChoiceOptionIds } from "../runner/expose-information/expose-installed-card-choice";
import type { RunnerDevelopmentSignal } from "../runner/hand-development/development-types";
import {
  selectedRunnerAccessProgramInstallMemoryOptionIds,
  selectedRunnerBrokenIceVirusCounterOptionIds,
  selectedRunnerHiddenDrawReplacementOptionId,
  selectedRunnerPostBreakStealthLossOptionIds,
  selectedRunnerTraceBaseLinkOptionId,
  selectedRunnerTraceSuccessCancelOptionId,
  selectedRunnerVacuumLinkRewindOptionId,
} from "../runner/run-window/run-window-choice-binding";
import { selectedShellTradersStartTurnChoiceOptionId } from "../runner/shell-traders/shell-traders-choice-option";
import { getStrategicIntentMemorySnapshot } from "../strategic-intent-memory";
import type { StrategicIntentState } from "../strategic-intent-state";
import { selectedBidChoiceOptionId } from "./bid-choice-option";
import { selectableChoiceOptions } from "./choice-option";
import { selectedCorpAdvancementCounterChoiceOptionId } from "./corp-advancement-counter-choice";
import { corpInstalledHardwareTrashOperationProfile } from "./corp-canonical-card-facts";
import { selectedCorpHardwareTrashChoiceOptionIds } from "./corp-hardware-trash-choice";
import { selectedCorpHqRetainPaymentOptionIds } from "./corp-hq-retain-payment-choice";
import { selectedCorpProgramTrashChoiceOptionIds } from "./corp-program-trash-choice";
import { selectedCorpStartOfTurnOrderChoiceOptionId } from "./corp-start-of-turn-order-choice";
import {
  runnerDamagePreventionChoiceResolution,
  type RunnerOptionalChoiceResolution,
} from "./damage-prevention-choice-option";
import { type DiscardChoiceKeepScore } from "./discard-choice-selection";
import {
  PendingChoice,
  PendingChoiceOptions,
  unresolvedChoiceFailure,
} from "./plan-bound-choice-contract";
import { selectedPlayfulAiChoiceOptionId } from "./playful-ai-choice-option";
import { selectedPostBidLinkChoiceOptionId } from "./post-bid-link-choice-option";
import { selectedRunnerRunStartOrderChoiceOptionId } from "../runner/run-window/runner-run-start-order-choice";
import { selectedRunnerStartOfTurnOrderChoiceOptionId } from "./runner-start-of-turn-order-choice";
import {
  isRunnerTargetedBypassChoice,
  isRunnerTargetedBypassHideChoice,
  selectedRunnerTargetedBypassChoiceOptionId,
  selectedRunnerTargetedBypassHideChoiceOptionId,
} from "../runner/run-window/runner-targeted-bypass-choice";
import {
  isRunnerTargetedIceTrashChoice,
  selectedRunnerTargetedIceTrashChoiceOptionId,
} from "../runner/run-window/runner-targeted-ice-trash-choice";
import {
  selectedSearchChoiceOptionIds,
  type SearchChoiceFeatureSnapshot,
} from "./search-choice-option";
import { selectedForcedChoiceOptionIds } from "./select-card-choice-option";
import { selectedSetupMulliganChoiceOptionId } from "./setup-mulligan-choice-option";
import { runnerTagAvoidanceChoiceResolution } from "./tag-avoidance-choice-option";
import { latestTraceContext } from "./trace-context";

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
    (executor?.moduleId === "corp.hand_and_agenda_management" ||
      isExactScoreRecoveryChoiceOwner(
        executor,
        origin,
        portfolio.stateVersion,
      )) &&
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

function selectedCorpStartRezOptionIdFromEconomyPlan(
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
      instance.executionState === "executor" &&
      instance.moduleId === "corp.economy",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: CorpEconomyDevelopmentSignal | CorpEconomyStartRezChoiceSignal;
      }
    | undefined;
  const startRezPassSignal = moduleState?.signal;
  if (startRezPassSignal?.kind === "resolve_start_rez_choice") {
    const [requirement] = action.choiceRequirements ?? [];
    const passOptionIds = startRezPassSignal.optionIds;
    const passOption = selectableOptions.find(
      (option) =>
        option.id === "pass" &&
        option.value === "pass" &&
        option.selectable !== false,
    );
    const exactPassBinding =
      input.side === "corp" &&
      choice.side === "corp" &&
      choice.kind === "select_option" &&
      choice.source.startsWith("corp_start.rez:") &&
      choice.stateVersion === input.playerView.stateVersion &&
      portfolio?.stateVersion === input.playerView.stateVersion &&
      moduleState?.kind === "economy" &&
      startRezPassSignal.actionIds.length === 1 &&
      startRezPassSignal.actionIds[0] === action.actionId &&
      startRezPassSignal.choiceId === choice.choiceId &&
      startRezPassSignal.selectedOptionId === "pass" &&
      startRezPassSignal.observedAtStateVersion ===
        input.playerView.stateVersion &&
      passOptionIds.length === choice.options.length &&
      choice.options.every((option) => passOptionIds.includes(option.id)) &&
      action.side === "corp" &&
      action.type === "resolve_choice" &&
      action.source === "game_rule" &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.choiceRequirements?.length === 1 &&
      requirement?.choiceId === choice.choiceId &&
      requirement.minSelections === 1 &&
      requirement.maxSelections === 1 &&
      requirement.optionIds.length === choice.options.length &&
      choice.options.every((option) =>
        requirement.optionIds.includes(option.id),
      ) &&
      passOption !== undefined;
    if (!exactPassBinding || !passOption) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "The Corp economy plan must bind an exact pass decision to the current start-of-turn rez choice when no reviewed campaign is admitted.",
      );
    }
    return [passOption.id];
  }
  const signal =
    moduleState?.signal?.kind === "develop_campaign" &&
    moduleState.signal.phase === "rez"
      ? moduleState.signal
      : undefined;
  const binding = signal?.startRezChoiceBinding;
  const selectedOption = binding
    ? selectableOptions.find(
        (option) =>
          option.id === binding.selectedOptionId &&
          option.value === signal?.sourceInstanceId &&
          option.card?.instanceId === signal?.sourceInstanceId &&
          option.card?.definitionId === signal?.sourceDefinitionId &&
          option.metadata?.creditCost === signal?.payback.setupCreditCost,
      )
    : undefined;
  const [requirement] = action.choiceRequirements ?? [];
  const sourceStillInstalled = input.playerView.servers.some((server) =>
    server.root.some(
      (card) =>
        card.instanceId === signal?.sourceInstanceId &&
        card.definitionId === signal?.sourceDefinitionId &&
        card.rezzed === false,
    ),
  );
  const exactBinding =
    input.side === "corp" &&
    choice.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("corp_start.rez:") &&
    choice.stateVersion === input.playerView.stateVersion &&
    portfolio?.stateVersion === input.playerView.stateVersion &&
    moduleState?.kind === "economy" &&
    binding?.actionId === action.actionId &&
    binding.choiceId === choice.choiceId &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choice.options.length &&
    choice.options.every((option) =>
      requirement.optionIds.includes(option.id),
    ) &&
    selectedOption !== undefined &&
    sourceStillInstalled &&
    signal !== undefined &&
    input.playerView.own.credits >= signal.payback.setupCreditCost;
  if (!exactBinding || !selectedOption || !signal) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Corp economy plan must select and bind the exact affordable start-of-turn rez option, source card and current Engine choice contract before payload resolution.",
    );
  }
  return [selectedOption.id];
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
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("corp_start.order:")
  ) {
    const selectedOptionId = selectedCorpStartOfTurnOrderChoiceOptionId(
      input,
      action,
      choice,
      selectableOptions,
    );
    if (!selectedOptionId) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Resolve Corp start-of-turn ordering only from the exact current rule window and equivalent complete canonical source-effect profiles.",
      );
    }
    return resolved([selectedOptionId], "corp_start_of_turn_order");
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
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.continuation?.family === "runner_post_break_stealth_loss"
  ) {
    return resolved(
      selectedRunnerPostBreakStealthLossOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_runner_post_break_stealth_loss",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("broken_ice.virus_counter:")
  ) {
    return resolved(
      selectedRunnerBrokenIceVirusCounterOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_runner_broken_ice_virus_counter",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_option" &&
    choice.source === "card_implementation.vacuum_link_rewind"
  ) {
    return resolved(
      selectedRunnerVacuumLinkRewindOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_runner_vacuum_link_rewind",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("corp_start.rez:")
  ) {
    return resolved(
      selectedCorpStartRezOptionIdFromEconomyPlan(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_corp_start_rez_economy",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("proteus.return_runner_programs:")
  ) {
    return resolved(
      selectedCorpAccessProgramBounceOptionIdsFromResidentAmbushPlan(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_corp_ambush_program_bounce",
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
      selectedRunnerPlanBoundProgramTrashOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "runner_program_trash_before_install",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner.program_install_memory:hidden_search:")
  ) {
    return resolved(
      selectedRunnerCoverageBoundProgramInstallMemoryOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "runner_coverage_bound_program_install_memory",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith(
      "card_implementation.pro018_stack_install_run_cleanup:",
    )
  ) {
    return resolved(
      selectedRunnerDelayedProgramSearchChoiceOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
        dependencies,
      ),
      "resident_runner_delayed_program_search_choice",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner.program_install_memory:nonsearch:")
  ) {
    return resolved(
      selectedRunnerEventInstallMemoryOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_runner_event_install_memory",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner.program_install_memory:access:")
  ) {
    return resolved(
      selectedRunnerAccessProgramInstallMemoryOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        dependencies.selectedRunnerProgramInstallTrashOptionIds,
      ),
      "runner_access_program_install_memory",
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
      undefined,
      scoreBinding.move,
      scoreBinding.placement,
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
    choice.kind === "select_cards" &&
    choice.source.startsWith("scored_agenda.subtype_reveal:")
  ) {
    return resolved(
      selectedCorpScoredAgendaSubtypeRevealOptionIds(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_corp_scored_agenda_subtype_reveal",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("card_implementation.scored_agenda_free_rez:")
  ) {
    return resolved(
      selectedCorpScoredAgendaFreeRezOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_corp_scored_agenda_free_rez",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.source.startsWith(
      "card_implementation_primitive.select_rezzed_ice_mark_modifier:",
    )
  ) {
    return resolved(
      selectedCorpScoredAgendaIceMarkOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_corp_scored_agenda_ice_mark",
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
    choice.source.startsWith("p3_54.delayed_success:")
  ) {
    return resolved(
      selectedCorpDelayedSuccessOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_corp_delayed_success",
    );
  }
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("classic.satellite_monitors:")
  ) {
    return resolved(
      [
        selectedCorpSatelliteMonitorsStartOptionId(
          input,
          action,
          choice,
          selectableOptions,
        ),
      ],
      "corp_satellite_monitors_start",
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
    input.side === "runner" &&
    choice.kind === "select_cards" &&
    isRunnerTargetedIceTrashChoice(choice)
  ) {
    return resolved(
      [
        selectedRunnerTargetedIceTrashChoiceOptionId(
          input,
          action,
          choice,
          selectableOptions,
        ),
      ],
      "runner_targeted_ice_trash",
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
    return resolved(
      selectedCorpAccessPaymentOptionsFromAmbushPlan(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "corp_access_payment",
    );
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
    const developmentBinding = coverageBinding
      ? undefined
      : runnerDevelopmentSearchChoiceBinding(input, action, choice);
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
          : developmentBinding
            ? {
                ...(developmentBinding.targetCardInstanceId
                  ? {
                      preferredCardInstanceId:
                        developmentBinding.targetCardInstanceId,
                    }
                  : {}),
                preferredCardDefinitionId:
                  developmentBinding.targetDefinitionId,
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
  if (
    input.side === "runner" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("trace_base_link:")
  ) {
    return resolved(
      selectedRunnerTraceBaseLinkOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_runner_trace_base_link",
    );
  }
  if (
    input.side === "runner" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("trace_success_cancel:")
  ) {
    return resolved(
      selectedRunnerTraceSuccessCancelOptionId(
        input,
        action,
        choice,
        selectableOptions,
        currentPortfolio,
      ),
      "resident_runner_trace_success_cancel",
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
  if (choice.source.endsWith(":corp_payment")) {
    const selectedOptionId = choice.options
      .map((option) => {
        if (typeof option.value !== "string") {
          throw unresolvedChoiceFailure(
            input,
            action,
            "The Engine-quoted Corp Trace payment allocation is not serialized.",
          );
        }
        let allocation: unknown;
        try {
          allocation = JSON.parse(option.value);
        } catch {
          throw unresolvedChoiceFailure(
            input,
            action,
            "The Engine-quoted Corp Trace payment allocation is malformed.",
          );
        }
        if (!Array.isArray(allocation)) {
          throw unresolvedChoiceFailure(
            input,
            action,
            "The Engine-quoted Corp Trace payment allocation is not an array.",
          );
        }
        const specializedTotal = allocation.reduce((sum, entry) => {
          if (
            !entry ||
            typeof entry !== "object" ||
            !Number.isSafeInteger((entry as { amount?: unknown }).amount) ||
            Number((entry as { amount: number }).amount) < 0
          ) {
            throw unresolvedChoiceFailure(
              input,
              action,
              "The Engine-quoted Corp Trace payment amount is invalid.",
            );
          }
          const total = sum + Number((entry as { amount: number }).amount);
          if (!Number.isSafeInteger(total)) {
            throw unresolvedChoiceFailure(
              input,
              action,
              "The Engine-quoted Corp Trace payment total is invalid.",
            );
          }
          return total;
        }, 0);
        return { id: option.id, specializedTotal };
      })
      .sort(
        (left, right) =>
          right.specializedTotal - left.specializedTotal ||
          left.id.localeCompare(right.id),
      )[0]?.id;
    if (!selectedOptionId) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "The Trace resolution must bind one current Engine-quoted Corp payment allocation.",
      );
    }
    return resolved([selectedOptionId], "corp_trace_payment_sources");
  }
  if (choice.source.startsWith("trace_runner_bid_payment:")) {
    const selectedOptionId = choice.options
      .flatMap((option) =>
        Number.isSafeInteger(option.value)
          ? [{ id: option.id, amount: Number(option.value) }]
          : [],
      )
      .sort(
        (left, right) =>
          right.amount - left.amount || left.id.localeCompare(right.id),
      )[0]?.id;
    if (!selectedOptionId) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "The Runner Trace payment source Choice has no current numeric allocation.",
      );
    }
    return resolved([selectedOptionId], "runner_trace_payment_source");
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
  if (
    input.side === "corp" &&
    choice.kind === "select_option" &&
    choice.source.startsWith("damage_replacement:")
  ) {
    return resolved(
      [
        selectedCorpDamageReplacementChoiceOptionId(
          input,
          action,
          choice,
          selectableOptions,
        ),
      ],
      "corp_damage_replacement",
    );
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

function selectedCorpDamageReplacementChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string {
  const sourceMatch = /^damage_replacement:([^:]+):(.+)$/.exec(choice.source);
  const sourceCardId = sourceMatch?.[1];
  const sourceCard = sourceCardId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.instanceId === sourceCardId &&
          card.known &&
          card.definitionId === "onr_proteus_006_please-dont-choke-anyone" &&
          card.type === "agenda",
      )
    : undefined;
  const replacementOptions = selectableOptions
    .map((option) => ({
      option,
      amount:
        typeof option.value === "string" && /^\d+$/.test(option.value)
          ? Number(option.value)
          : Number.NaN,
    }))
    .sort((left, right) => left.amount - right.amount);
  const amounts = replacementOptions.map((entry) => entry.amount);
  const exactOptionSet =
    replacementOptions.length >= 2 &&
    amounts.every(
      (amount, index) => Number.isSafeInteger(amount) && amount === index,
    ) &&
    replacementOptions.every(
      ({ option, amount }) =>
        option.id === `replace_${sourceCardId}_${amount}` &&
        option.selectable !== false,
    );
  const [requirement] = action.choiceRequirements ?? [];
  const exactBinding =
    input.side === "corp" &&
    sourceCard !== undefined &&
    sourceMatch?.[2] !== undefined &&
    sourceMatch[2].length > 0 &&
    choice.side === "corp" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    exactOptionSet &&
    action.side === "corp" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === replacementOptions.length &&
    replacementOptions.every(({ option }) =>
      requirement.optionIds.includes(option.id),
    );
  const preserveDamage = replacementOptions.find((entry) => entry.amount === 0);
  if (!exactBinding || !preserveDamage) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Resolve Corp damage replacement only from the exact scored source, current public contiguous replacement amounts and matching Engine choice action.",
    );
  }
  return preserveDamage.option.id;
}

function selectedRunnerPlanBoundProgramTrashOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceMatch =
    /^runner_program_trash_before_install:([^:\s]+):([0-9]+)(?::payment=ids=[^:\s;]*;amounts=[^:\s]*)?(?::valu_pak)?$/.exec(
      choice.source,
    );
  const sourceCardInstanceId = sourceMatch?.[1];
  const originStateVersion = Number(sourceMatch?.[2]);
  const choiceContinuation = choice.continuation;
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const origin = portfolio?.selectedActionOrigin;
  const bound =
    origin?.immediateChoicePolicy ===
    "resolve_runner_program_trash_before_install";
  const executor = portfolio?.instances.find(
    (instance) => instance.instanceId === origin?.executorInstanceId,
  );
  const root = portfolio?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const selectedCards = bound ? origin.selectedCards : undefined;
  const installedRig = input.playerView.own.rig ?? [];
  const optionsByCardId = new Map(
    selectableOptions.flatMap((option) =>
      typeof option.value === "string" ? [[option.value, option] as const] : [],
    ),
  );
  const selectedOptionIds =
    selectedCards?.flatMap((card) => {
      const option =
        typeof card.cardInstanceId === "string"
          ? optionsByCardId.get(card.cardInstanceId)
          : undefined;
      return option ? [option.id] : [];
    }) ?? [];
  const requiredMemoryToFree = bound ? origin.requiredMemoryToFree : undefined;
  const memoryFreed =
    selectedCards?.reduce(
      (total, card) =>
        total +
        (typeof card.memoryCost === "number" &&
        Number.isInteger(card.memoryCost)
          ? card.memoryCost
          : 0),
      0,
    ) ?? 0;
  const requirement = action.choiceRequirements?.[0];
  const exactBinding =
    input.side === "runner" &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === selectableOptions.length &&
    requirement.optionIds.every((optionId) =>
      selectableOptions.some((option) => option.id === optionId),
    ) &&
    choice.side === "runner" &&
    choice.stateVersion === input.playerView.stateVersion &&
    sourceCardInstanceId !== undefined &&
    Number.isInteger(originStateVersion) &&
    originStateVersion === input.playerView.stateVersion &&
    choiceContinuation?.family === "runner_program_trash_before_install" &&
    choiceContinuation.originActionId === origin?.selectedActionId &&
    choiceContinuation.sourceCardInstanceId === sourceCardInstanceId &&
    choiceContinuation.createdAtStateVersion === originStateVersion &&
    portfolio?.side === "runner" &&
    portfolio.stateVersion + 1 === input.playerView.stateVersion &&
    bound &&
    executor !== undefined &&
    root !== undefined &&
    portfolio.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    portfolio.executorInstanceId === origin.executorInstanceId &&
    executor.executionState === "executor" &&
    typeof origin.selectedActionId === "string" &&
    origin.selectedActionId.length > 0 &&
    /(?:^|\.)runner_program_trash_before_install(?:\.|$)/.test(
      origin.selectedActionId,
    ) &&
    origin.selectedAtStateVersion === portfolio.stateVersion &&
    origin.sourceCardInstanceId === sourceCardInstanceId &&
    typeof requiredMemoryToFree === "number" &&
    Number.isInteger(requiredMemoryToFree) &&
    requiredMemoryToFree > 0 &&
    selectedCards !== undefined &&
    selectedCards.length > 0 &&
    selectedCards.length === selectedOptionIds.length &&
    new Set(selectedOptionIds).size === selectedOptionIds.length &&
    selectedCards.every(
      (card) =>
        typeof card.cardInstanceId === "string" &&
        typeof card.memoryCost === "number" &&
        Number.isInteger(card.memoryCost) &&
        card.memoryCost > 0 &&
        installedRig.some(
          (installed) =>
            installed.instanceId === card.cardInstanceId &&
            installed.type === "program",
        ),
    ) &&
    memoryFreed >= requiredMemoryToFree;
  if (!exactBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize a program-trash install only from the immediately preceding Runner plan executor and its exact prebound acceptable sacrifice set.",
    );
  }
  return selectedOptionIds;
}

function selectedRunnerCoverageBoundProgramInstallMemoryOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceParts = choice.source.split(":");
  const targetCardInstanceId = sourceParts[2];
  const automaticFreedMemory = Number(sourceParts[3]);
  const originalChoiceSource = decodeChoiceSourcePart(sourceParts[5]);
  const originalChoiceId = decodeChoiceSourcePart(sourceParts[4]);
  const delayedSearch =
    sourceParts[1] === "nonsearch" &&
    originalChoiceSource?.startsWith(
      "card_implementation.pro018_stack_install_run_cleanup:",
    ) === true;
  const originalSourceBinding = originalChoiceSource
    ? runnerHiddenSearchProgramInstallSourceBinding(originalChoiceSource)
    : undefined;
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.rig_and_coverage" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        selectedSearchActionId?: unknown;
        selectedSearchStateVersion?: unknown;
        gap?: {
          requesterPlanInstanceId?: unknown;
          requesterNeedId?: unknown;
          directSearchChoiceBindings?: Array<{
            actionId?: unknown;
            sourceCardInstanceId?: unknown;
            sourceDefinitionId?: unknown;
            resolvedSearchChoice?: {
              choiceId?: unknown;
              choiceSource?: unknown;
              stateVersion?: unknown;
            };
            targetCardInstanceId?: unknown;
            targetDefinitionId?: unknown;
            installMemorySacrificeBinding?: {
              targetCardInstanceId?: unknown;
              targetMemoryCost?: unknown;
              requiredMemoryToFree?: unknown;
              selectedCards?: Array<{
                cardInstanceId?: unknown;
                memoryCost?: unknown;
              }>;
            };
          }>;
        };
      }
    | undefined;
  const bindings = moduleState?.gap?.directSearchChoiceBindings?.filter(
    (binding) =>
      binding.actionId === moduleState.selectedSearchActionId &&
      (delayedSearch
        ? binding.resolvedSearchChoice?.choiceId === originalChoiceId &&
          binding.resolvedSearchChoice?.choiceSource === originalChoiceSource &&
          binding.resolvedSearchChoice?.stateVersion === portfolio?.stateVersion
        : binding.sourceCardInstanceId ===
            originalSourceBinding?.sourceCardInstanceId &&
          binding.sourceDefinitionId ===
            originalSourceBinding?.sourceDefinitionId) &&
      binding.targetCardInstanceId === targetCardInstanceId &&
      binding.installMemorySacrificeBinding?.targetCardInstanceId ===
        targetCardInstanceId,
  );
  const binding = bindings?.length === 1 ? bindings[0] : undefined;
  const sacrifice = binding?.installMemorySacrificeBinding;
  const selectedCards = sacrifice?.selectedCards;
  const optionsByCardId = new Map(
    selectableOptions.flatMap((option) =>
      typeof option.value === "string" ? [[option.value, option] as const] : [],
    ),
  );
  const selectedOptionIds =
    selectedCards?.flatMap((card) => {
      const option =
        typeof card.cardInstanceId === "string"
          ? optionsByCardId.get(card.cardInstanceId)
          : undefined;
      return option ? [option.id] : [];
    }) ?? [];
  const visibleTarget = targetCardInstanceId
    ? input.playerView.own.heapOrArchives.find(
        (card) =>
          card.known !== false &&
          card.type === "program" &&
          card.instanceId === targetCardInstanceId &&
          card.definitionId === binding?.targetDefinitionId,
      )
    : undefined;
  const targetMemoryCost =
    sacrifice?.targetMemoryCost ?? visibleTarget?.memoryCost;
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  const requiredMemoryToFree =
    typeof targetMemoryCost === "number" &&
    Number.isInteger(targetMemoryCost) &&
    typeof memoryUsed === "number" &&
    Number.isInteger(memoryUsed) &&
    typeof memoryLimit === "number" &&
    Number.isInteger(memoryLimit) &&
    Number.isInteger(automaticFreedMemory)
      ? Math.max(
          0,
          memoryUsed + targetMemoryCost - memoryLimit - automaticFreedMemory,
        )
      : undefined;
  const memoryFreed =
    selectedCards?.reduce(
      (total, card) =>
        total +
        (typeof card.memoryCost === "number" &&
        Number.isInteger(card.memoryCost)
          ? card.memoryCost
          : 0),
      0,
    ) ?? 0;
  const requirement = action.choiceRequirements?.[0];
  const root = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.rootForegroundInstanceId &&
      instance.portfolioRole === "foreground",
  );
  const exactCoverageExecutorOwnership =
    portfolio?.rootForegroundInstanceId === executor?.instanceId ||
    (root !== undefined &&
      executor?.parentInstanceId === root.instanceId &&
      typeof executor.parentNeedId === "string" &&
      root.openNeedIds.includes(executor.parentNeedId) &&
      moduleState?.gap?.requesterPlanInstanceId === root.instanceId &&
      moduleState.gap.requesterNeedId === executor.parentNeedId);
  const exactBinding =
    sourceParts.length === 6 &&
    (delayedSearch
      ? portfolio?.stateVersion === input.playerView.stateVersion - 1
      : sourceParts[1] === "hidden_search" &&
        originalSourceBinding !== undefined &&
        originalSourceBinding.selectedAtStateVersion + 1 ===
          input.playerView.stateVersion) &&
    Number.isInteger(automaticFreedMemory) &&
    automaticFreedMemory >= 0 &&
    input.side === "runner" &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === selectableOptions.length &&
    requirement.optionIds.every((optionId) =>
      selectableOptions.some((option) => option.id === optionId),
    ) &&
    choice.side === "runner" &&
    choice.stateVersion === input.playerView.stateVersion &&
    portfolio?.side === "runner" &&
    portfolio.executorInstanceId === executor?.instanceId &&
    exactCoverageExecutorOwnership &&
    moduleState?.kind === "coverage" &&
    moduleState.phase === "search_answer" &&
    typeof moduleState.selectedSearchActionId === "string" &&
    typeof moduleState.selectedSearchStateVersion === "number" &&
    moduleState.selectedSearchStateVersion === portfolio.stateVersion &&
    binding !== undefined &&
    typeof binding.targetDefinitionId === "string" &&
    typeof targetCardInstanceId === "string" &&
    binding.targetCardInstanceId === targetCardInstanceId &&
    sacrifice?.targetCardInstanceId === targetCardInstanceId &&
    typeof targetMemoryCost === "number" &&
    Number.isInteger(targetMemoryCost) &&
    targetMemoryCost > 0 &&
    typeof requiredMemoryToFree === "number" &&
    requiredMemoryToFree > 0 &&
    sacrifice?.requiredMemoryToFree === requiredMemoryToFree &&
    selectedCards !== undefined &&
    selectedCards.length > 0 &&
    selectedCards.length === selectedOptionIds.length &&
    new Set(selectedOptionIds).size === selectedOptionIds.length &&
    selectedCards.every(
      (card) =>
        typeof card.cardInstanceId === "string" &&
        typeof card.memoryCost === "number" &&
        Number.isInteger(card.memoryCost) &&
        card.memoryCost > 0 &&
        (input.playerView.own.rig ?? []).some(
          (installed) =>
            installed.known !== false &&
            installed.type === "program" &&
            installed.instanceId === card.cardInstanceId &&
            installed.memoryCost === card.memoryCost,
        ),
    ) &&
    memoryFreed >= requiredMemoryToFree;
  if (!exactBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Resolve hidden-search program-install memory only from the exact coverage executor, selected search action, visible target and prebound acceptable sacrifice set.",
    );
  }
  return selectedOptionIds;
}

function decodeChoiceSourcePart(value: string | undefined): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function runnerHiddenSearchProgramInstallSourceBinding(source: string):
  | {
      sourceCardInstanceId: string;
      sourceDefinitionId: string;
      selectedAtStateVersion: number;
    }
  | undefined {
  const stackOrTrash =
    /^p3_38\.stack_or_trash_program_install:([^:]+):([^:]+):(stack|heap):([0-9]+)$/.exec(
      source,
    );
  if (stackOrTrash) {
    return {
      sourceCardInstanceId: stackOrTrash[1]!,
      sourceDefinitionId: stackOrTrash[2]!,
      selectedAtStateVersion: Number(stackOrTrash[4]),
    };
  }
  const directStack =
    /^p3_38\.search_stack_install:([^:]+):([^:]+):program:(normal|free):(shuffle|no_shuffle):([0-9]+)$/.exec(
      source,
    );
  if (!directStack) return undefined;
  return {
    sourceCardInstanceId: directStack[1]!,
    sourceDefinitionId: directStack[2]!,
    selectedAtStateVersion: Number(directStack[5]),
  };
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
          eventInstallChoiceCommitment?: {
            selectedAtStateVersion?: unknown;
            engineContinuationAtStateVersion?: unknown;
          };
          eventInstallChoiceBinding?: Record<string, unknown>;
        };
      }
    | undefined;
  const binding = moduleState?.signal?.eventInstallChoiceBinding;
  const commitment = moduleState?.signal?.eventInstallChoiceCommitment;
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
      commitment?.selectedAtStateVersion &&
    (commitment?.selectedAtStateVersion === input.playerView.stateVersion - 1 ||
      commitment?.engineContinuationAtStateVersion ===
        input.playerView.stateVersion - 1) &&
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

function selectedRunnerEventInstallMemoryOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  if (
    portfolio?.instances.some(
      (instance) =>
        instance.instanceId === portfolio.executorInstanceId &&
        instance.moduleId === "runner.rig_and_coverage" &&
        instance.executionState === "executor",
    )
  ) {
    return selectedRunnerCoverageBoundProgramInstallMemoryOptionIds(
      input,
      action,
      choice,
      selectableOptions,
      portfolio,
    );
  }
  const sourceParts = choice.source.split(":");
  const targetCardInstanceId = sourceParts[2];
  const automaticFreedMemory = Number(sourceParts[3]);
  const originalChoiceId = decodeURIComponent(sourceParts[4] ?? "");
  const originalChoiceSource = decodeURIComponent(sourceParts[5] ?? "");
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
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const signal = moduleState?.signal;
  const commitment = signal?.eventInstallChoiceCommitment;
  const binding = signal?.eventInstallChoiceBinding;
  const delayedBinding = signal?.delayedProgramSearchChoiceBinding;
  const activeBinding = binding ?? delayedBinding;
  const sacrifice =
    commitment?.installMemorySacrificeBinding ??
    delayedBinding?.installMemorySacrificeBinding;
  const boundTargetCardInstanceId =
    commitment?.targetCardInstanceId ?? delayedBinding?.targetCardInstanceId;
  const optionIds = new Set(selectableOptions.map((option) => option.id));
  const selectedOptionIds = sacrifice?.selectedCards.map(
    (card) => `card_${card.cardInstanceId}`,
  );
  const memoryFreed = sacrifice?.selectedCards.reduce(
    (total, card) => total + card.memoryCost,
    0,
  );
  const bindingChecks: Array<readonly [string, boolean]> = [
    [
      "source_contract",
      sourceParts.length === 6 &&
        sourceParts[0] === "runner.program_install_memory" &&
        sourceParts[1] === "nonsearch" &&
        typeof targetCardInstanceId === "string" &&
        Number.isInteger(automaticFreedMemory) &&
        automaticFreedMemory >= 0,
    ],
    ["options_contract", exactOptions],
    ["action_contract", exactActionBinding],
    [
      "portfolio_contract",
      portfolio?.side === "runner" &&
        portfolio.stateVersion === input.playerView.stateVersion - 1,
    ],
    [
      "executor_contract",
      executor !== undefined &&
        moduleState?.kind === "development" &&
        (signal?.phase === "resolve_event_install_choice" ||
          signal?.phase === "resolve_delayed_program_search_choice"),
    ],
    [
      "binding_state_contract",
      activeBinding?.sourceStateVersion === input.playerView.stateVersion - 1,
    ],
    [
      "source_chain_contract",
      activeBinding?.choiceId === originalChoiceId &&
        activeBinding?.choiceSource === originalChoiceSource,
    ],
    [
      "target_chain_contract",
      activeBinding?.targetCardInstanceId === targetCardInstanceId &&
        boundTargetCardInstanceId === targetCardInstanceId &&
        sacrifice?.targetCardInstanceId === targetCardInstanceId,
    ],
    [
      "sacrifice_contract",
      Number.isInteger(sacrifice?.targetMemoryCost) &&
        Number(sacrifice?.targetMemoryCost) > 0 &&
        Number.isInteger(sacrifice?.requiredMemoryToFree) &&
        Number(sacrifice?.requiredMemoryToFree) > automaticFreedMemory,
    ],
    [
      "selection_contract",
      Array.isArray(selectedOptionIds) &&
        selectedOptionIds.length >= choice.minSelections &&
        selectedOptionIds.length <= choice.maxSelections &&
        selectedOptionIds.every((optionId) => optionIds.has(optionId)),
    ],
    [
      "memory_contract",
      typeof memoryFreed === "number" &&
        sacrifice !== undefined &&
        memoryFreed >= sacrifice.requiredMemoryToFree - automaticFreedMemory,
    ],
  ];
  const failedBindings = bindingChecks
    .filter(([, matches]) => !matches)
    .map(([name]) => name);
  if (failedBindings.length > 0 || !selectedOptionIds) {
    throw unresolvedChoiceFailure(
      input,
      action,
      `Resolve event-install memory pressure only from the current development executor and its exact prebound target and program-sacrifice set. Failed bindings: ${failedBindings.join(",") || "selection_missing"}.`,
    );
  }
  return selectedOptionIds;
}

function selectedRunnerDelayedProgramSearchChoiceOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
  dependencies?: SelectedChoicesForDecisionDependencies,
): string[] {
  const coverageBinding = runnerCoverageSearchChoiceBinding(input, choice);
  if (coverageBinding) {
    const selectedOptionIds = dependencies
      ? selectedSearchChoiceOptionIds(choice, selectableOptions, {
          features: dependencies.extractAiFeatures(input),
          rolesForCardId: dependencies.rolesForCardId,
          effectsForCardId: dependencies.effectsForCardId,
          requiredCoverage: coverageBinding.requiredCoverage,
          ...(coverageBinding.targetCardInstanceId
            ? {
                preferredCardInstanceId: coverageBinding.targetCardInstanceId,
              }
            : {}),
          ...(coverageBinding.targetDefinitionId
            ? {
                preferredCardDefinitionId: coverageBinding.targetDefinitionId,
              }
            : {}),
        })
      : undefined;
    const selectedOption =
      selectedOptionIds?.length === 1
        ? selectableOptions.find(
            (candidate) => candidate.id === selectedOptionIds[0],
          )
        : undefined;
    const requirement = action.choiceRequirements?.[0];
    const exactCoverageBinding =
      selectedOption !== undefined &&
      selectedOption.card?.known !== false &&
      selectedOption.card?.type === "program" &&
      (coverageBinding.targetCardInstanceId === undefined ||
        selectedOption.card.instanceId ===
          coverageBinding.targetCardInstanceId) &&
      (coverageBinding.targetDefinitionId === undefined ||
        selectedOption.card.definitionId ===
          coverageBinding.targetDefinitionId) &&
      choice.side === "runner" &&
      choice.kind === "select_cards" &&
      choice.visibility === "hidden_info_barrier" &&
      choice.stateVersion === input.playerView.stateVersion &&
      choice.minSelections === 1 &&
      choice.maxSelections === 1 &&
      action.side === "runner" &&
      action.type === "resolve_choice" &&
      action.source === "game_rule" &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.choiceRequirements?.length === 1 &&
      requirement?.choiceId === choice.choiceId &&
      requirement.minSelections === 1 &&
      requirement.maxSelections === 1 &&
      requirement.optionIds.length === choice.options.length &&
      choice.options.every((candidate) =>
        requirement.optionIds.includes(candidate.id),
      );
    if (!exactCoverageBinding || !selectedOptionIds) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Resolve the delayed program-search target only from the current resident Runner coverage executor and its exact source and capability target binding.",
      );
    }
    return selectedOptionIds;
  }
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const signal = moduleState?.signal;
  const binding = signal?.delayedProgramSearchChoiceBinding;
  const option = selectableOptions.find(
    (candidate) => candidate.id === binding?.selectedOptionId,
  );
  const requirement = action.choiceRequirements?.[0];
  const exactBinding =
    portfolio?.side === "runner" &&
    portfolio.stateVersion === input.playerView.stateVersion &&
    executor !== undefined &&
    moduleState?.kind === "development" &&
    signal?.phase === "resolve_delayed_program_search_choice" &&
    binding?.choiceId === choice.choiceId &&
    binding.choiceSource === choice.source &&
    binding.actionId === action.actionId &&
    binding.sourceStateVersion === input.playerView.stateVersion &&
    binding.sourceCardInstanceId === choice.sourceCardInstanceId &&
    binding.sourceDefinitionId === choice.sourceCardDefinitionId &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choice.options.length &&
    choice.options.every((candidate) =>
      requirement.optionIds.includes(candidate.id),
    ) &&
    option?.value === binding.targetCardInstanceId &&
    option.card?.instanceId === binding.targetCardInstanceId &&
    option.card.definitionId === binding.targetDefinitionId &&
    option.card.type === "program";
  if (!exactBinding || !binding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Resolve the delayed program-search target only from the current resident Runner development executor and its exact prebound visible target.",
    );
  }
  return [binding.selectedOptionId];
}

function selectedRunnerInstalledCardLiquidationOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const sourceMatch =
    /^runner\.installed_resource_trash_for_credits:([^:]+):([0-9]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceResourceInstanceId = sourceMatch?.[1];
  const gainCredits = Number(sourceMatch?.[2]);
  const sourceStateVersion = Number(sourceMatch?.[3]);
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
          selectedCardInstanceId?: unknown;
          disposition?: unknown;
          quote?: {
            gainCredits?: unknown;
            retainedCardValue?: unknown;
            netLiquidationValue?: unknown;
            expendability?: unknown;
          };
        };
      }
    | undefined;
  const signal = moduleState?.signal;
  const selectedOption = selectableOptions.find(
    (option) => option.id === signal?.selectedOptionId,
  );
  const selectsCard = typeof signal?.selectedCardInstanceId === "string";
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
    typeof signal.selectedOptionId === "string" &&
    selectedOption !== undefined &&
    signal.quote?.gainCredits === gainCredits &&
    typeof signal.quote.retainedCardValue === "number" &&
    typeof signal.quote.netLiquidationValue === "number" &&
    (selectsCard
      ? signal.disposition === "liquidate_proven_expendable" &&
        signal.quote.expendability === "proven_redundant" &&
        signal.quote.netLiquidationValue > 0 &&
        selectedOption.value === signal.selectedCardInstanceId
      : signal.selectedOptionId === "pass" &&
        ((signal.disposition === "decline_nonpositive_conversion" &&
          signal.quote.netLiquidationValue <= 0) ||
          (signal.disposition === "decline_unproven_expendability" &&
            signal.quote.expendability === "unproven")) &&
        selectedOption.value === undefined);
  if (!exactPlanBinding) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Materialize an optional installed-card liquidation only from the current runner.economy executor and its exact target-value plus expendability quote.",
    );
  }
  return [signal.selectedOptionId as string];
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

function runnerDevelopmentSearchChoiceBinding(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
):
  | {
      planInstanceId: string;
      targetCardInstanceId?: string;
      targetDefinitionId: string;
    }
  | undefined {
  if (input.side !== "runner") return undefined;
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand",
  );
  if (!executor) return undefined;
  const moduleState = executor.moduleState as
    | {
        kind?: unknown;
        signal?: {
          phase?: unknown;
          targetKind?: unknown;
          actionIds?: unknown;
          programSearchCommitment?: {
            sourceCardInstanceId?: unknown;
            sourceDefinitionId?: unknown;
            targetDefinitionId?: unknown;
            plannedAtStateVersion?: unknown;
            selectedActionId?: unknown;
            selectedAtStateVersion?: unknown;
            engineContinuationAtStateVersion?: unknown;
          };
          recoverySearchCommitment?: {
            sourceCardInstanceId?: unknown;
            sourceDefinitionId?: unknown;
            searchFilter?: unknown;
            targetCardInstanceId?: unknown;
            targetDefinitionId?: unknown;
            plannedAtStateVersion?: unknown;
            selectedActionId?: unknown;
            selectedAtStateVersion?: unknown;
            engineContinuationAtStateVersion?: unknown;
          };
        };
      }
    | undefined;
  const signal = moduleState?.signal;
  const programCommitment = signal?.programSearchCommitment;
  const recoveryCommitment = signal?.recoverySearchCommitment;
  if (!programCommitment && !recoveryCommitment) return undefined;
  const commitment = recoveryCommitment ?? programCommitment;
  const matchingTargetOptions =
    typeof recoveryCommitment?.targetCardInstanceId === "string"
      ? choice.options.filter(
          (option) =>
            option.selectable !== false &&
            option.card?.instanceId ===
              recoveryCommitment.targetCardInstanceId &&
            option.card?.definitionId === recoveryCommitment.targetDefinitionId,
        )
      : typeof commitment?.targetDefinitionId === "string"
        ? choice.options.filter(
            (option) =>
              option.selectable !== false &&
              option.card?.definitionId === commitment.targetDefinitionId,
          )
        : [];
  const exactBinding =
    portfolio !== undefined &&
    moduleState?.kind === "development" &&
    signal?.phase === "execute" &&
    signal.targetKind === "capability" &&
    Array.isArray(signal.actionIds) &&
    typeof commitment?.sourceCardInstanceId === "string" &&
    typeof commitment.sourceDefinitionId === "string" &&
    typeof commitment.targetDefinitionId === "string" &&
    typeof commitment.selectedActionId === "string" &&
    signal.actionIds.includes(commitment.selectedActionId) &&
    commitment.plannedAtStateVersion === commitment.selectedAtStateVersion &&
    (commitment.engineContinuationAtStateVersion === undefined
      ? commitment.selectedAtStateVersion === portfolio.stateVersion
      : commitment.engineContinuationAtStateVersion ===
          portfolio.stateVersion &&
        typeof commitment.selectedAtStateVersion === "number" &&
        commitment.selectedAtStateVersion < portfolio.stateVersion) &&
    input.playerView.stateVersion === portfolio.stateVersion + 1 &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.sourceCardInstanceId === commitment.sourceCardInstanceId &&
    choice.sourceCardDefinitionId === commitment.sourceDefinitionId &&
    choice.kind === "select_cards" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    (programCommitment === undefined ||
      choice.cardSearchPresentation?.selectableFilter === "program") &&
    (recoveryCommitment === undefined ||
      (choice.cardSearchPresentation?.sourceZone === "heap" &&
        choice.cardSearchPresentation.destination === "grip" &&
        choice.cardSearchPresentation.selectableFilter ===
          recoveryCommitment.searchFilter)) &&
    matchingTargetOptions.length > 0;
  if (!exactBinding || !commitment || !portfolio) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The resident Runner development plan must preserve the exact search purpose, source, selected action, state version and useful target.",
    );
  }
  return {
    planInstanceId: executor.instanceId,
    ...(typeof recoveryCommitment?.targetCardInstanceId === "string"
      ? { targetCardInstanceId: recoveryCommitment.targetCardInstanceId }
      : {}),
    targetDefinitionId: commitment.targetDefinitionId as string,
  };
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
    if (
      !quote.complete ||
      !quote.affordable ||
      !quote.mandatoryContinuationComplete ||
      !quote.rezAndMandatoryContinuationExecutable
    )
      continue;
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
    quote.affordable ===
      (quote.creditPayable && quote.additionalCostsPayable) &&
    typeof quote.mandatoryContinuationComplete === "boolean" &&
    typeof quote.rezAndMandatoryContinuationExecutable === "boolean" &&
    (!quote.rezAndMandatoryContinuationExecutable ||
      quote.mandatoryContinuationComplete)
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
  "mandatoryContinuationComplete",
  "rezAndMandatoryContinuationExecutable",
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
