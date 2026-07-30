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
import { selectedDiscardChoiceOptionIds } from "./discard-choice-selection";
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
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { getStrategicIntentMemorySnapshot } from "../strategic-intent-memory";
import type { StrategicIntentState } from "../strategic-intent-state";
import type { RequiredCapabilityKind } from "../plans/tactical-plan-types";
import {
  isRunnerTargetedBypassChoice,
  isRunnerTargetedBypassHideChoice,
  selectedRunnerTargetedBypassChoiceOptionId,
  selectedRunnerTargetedBypassHideChoiceOptionId,
} from "./runner-targeted-bypass-choice";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOptions = PendingChoice["options"];

type DiscardScore = {
  readonly total: number;
};

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
  ) => DiscardScore;
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
};

export function selectedChoicesForDecision(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SelectedChoicesForDecisionDependencies,
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
  if (choice.kind === "select_cards" && choice.source === "discard_phase") {
    const selected = selectedDiscardChoiceOptionIds(
      input,
      choice,
      selectableOptions,
      dependencies.discardKeepScore,
    );
    return resolved(selected, "discard_phase");
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
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_start.delayed_install")
  ) {
    const selectedOptionId =
      selectedShellTradersStartTurnChoiceOptionId(choice);
    return resolved(
      selectedOptionId !== undefined ? [selectedOptionId] : [],
      "runner_delayed_install",
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
    choice.kind === "select_cards" &&
    choice.source.startsWith(
      "card_implementation.installed_hardware_trash_by_counter:",
    )
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
        ...(coverageBinding
          ? {
              requiredCoverage: coverageBinding.requiredCoverage,
              ...(coverageBinding.targetCardInstanceId
                ? {
                    preferredCardInstanceId:
                      coverageBinding.targetCardInstanceId,
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
  if (choice.source.startsWith("v1921.playful_ai")) {
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
            dependencies.rolesForCardId,
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
        choice.source.includes(`:${candidate.sourceCardInstanceId}:`) &&
        choice.source.includes(`:${candidate.sourceDefinitionId}:`) &&
        (candidate.targetCardInstanceId === undefined ||
          (typeof candidate.targetCardInstanceId === "string" &&
            choice.options.some(
              (option) =>
                option.card?.instanceId === candidate.targetCardInstanceId &&
                (candidate.targetDefinitionId === undefined ||
                  option.card?.definitionId === candidate.targetDefinitionId),
            ))),
    ) ?? [];
  if (bindings.length !== 1) {
    throw coverageSearchChoiceBindingFailure(
      input,
      executor.instanceId,
      "The current search choice source does not match exactly one binding for the selected coverage-search LegalAction.",
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
