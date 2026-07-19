import {
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { selectedBidChoiceOptionId } from "./bid-choice-option";
import { selectableChoiceOptions } from "./choice-option";
import { selectedCorpAdvancementCounterChoiceOptionId } from "./corp-advancement-counter-choice";
import { selectedDiscardChoiceOptionIds } from "./discard-choice-selection";
import { selectedRunnerDamagePreventionChoiceOptionId } from "./damage-prevention-choice-option";
import { selectedPlayfulAiChoiceOptionId } from "./playful-ai-choice-option";
import { selectedPostBidLinkChoiceOptionId } from "./post-bid-link-choice-option";
import {
  selectedSearchChoiceOptionIds,
  type SearchChoiceFeatureSnapshot,
} from "./search-choice-option";
import { runnerVisibleSearchCoverageNeed } from "./runner-search-coverage-need";
import { selectedRunnerExposeInstalledCardChoiceOptionIds } from "./runner-expose-installed-card-choice";
import {
  selectedDefaultCardChoiceOptionIds,
  selectedFallbackChoiceOptionIds,
} from "./select-card-choice-option";
import { selectedSetupMulliganChoiceOptionId } from "./setup-mulligan-choice-option";
import { selectedShellTradersStartTurnChoiceOptionId } from "./shell-traders-choice-option";
import { selectedRunnerTagAvoidanceChoiceOptionId } from "./tag-avoidance-choice-option";
import { latestTraceContext } from "./trace-context";
import { getTacticalPlanMemorySnapshot } from "../plans/plan-memory";
import { getStrategicIntentMemorySnapshot } from "../strategic-intent-memory";

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
  if (choice.source === "setup.mulligan") {
    const opening =
      input.side === "corp"
        ? dependencies.evaluateCorpOpeningHand(input)
        : dependencies.evaluateRunnerOpeningHand(input);
    const selectedOptionId = selectedSetupMulliganChoiceOptionId(
      choice,
      opening.decision,
    );
    return selectedOptionId !== undefined
      ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.kind === "select_cards" && choice.source === "discard_phase") {
    const selected = selectedDiscardChoiceOptionIds(
      input,
      choice,
      selectableOptions,
      dependencies.discardKeepScore,
    );
    return { choiceId: choice.choiceId, selectedOptionIds: selected };
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner.checkpoint_memory_cleanup:")
  ) {
    return {
      choiceId: choice.choiceId,
      selectedOptionIds:
        dependencies.selectedRunnerMemoryCheckpointTrashOptionIds(
          input,
          selectableOptions,
        ),
    };
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_start.delayed_install")
  ) {
    const selectedOptionId =
      selectedShellTradersStartTurnChoiceOptionId(choice);
    return selectedOptionId !== undefined
      ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (
    choice.kind === "select_cards" &&
    choice.source.startsWith("runner_program_trash_before_install")
  ) {
    return {
      choiceId: choice.choiceId,
      selectedOptionIds:
        dependencies.selectedRunnerProgramInstallTrashOptionIds(
          input,
          choice,
          selectableOptions,
        ),
    };
  }
  if (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("p3_56.pass_ice_program_trash") ||
      choice.source.startsWith("card_implementation.active_ice_program_trash"))
  ) {
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: dependencies.selectedRunnerForcedProgramTrashOptionIds(
        input,
        selectableOptions,
      ),
    };
  }
  if (
    input.side === "corp" &&
    (choice.source.startsWith("p3_34.distribute_advancement") ||
      choice.source.startsWith("p3_34.move_advancement") ||
      choice.source.startsWith("v1919.systematic_layoffs_advancement"))
  ) {
    const planMemory = getTacticalPlanMemorySnapshot(input);
    const plannedTargetCardId =
      planMemory?.type === "corp.create_score_window" &&
      planMemory.target?.kind === "card"
        ? planMemory.target.id
        : undefined;
    const selected = selectedCorpAdvancementCounterChoiceOptionId(
      input,
      selectableOptions,
      plannedTargetCardId,
      planMemory?.scoreConversionDesiredAdvancementCounters,
    );
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selected ? [selected] : [],
    };
  }
  if (
    choice.kind === "select_cards" &&
    isHqToNewRemoteOptionalRezChoice(choice)
  ) {
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selectedAffordableOptionalRezOptionIds(
        input,
        choice,
        selectableOptions,
      ),
    };
  }
  if (
    choice.kind === "select_cards" &&
    isHqToNewRemoteInstallRezChoice(choice)
  ) {
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selectedHqToNewRemoteInstallRezOptionIds(
        input,
        choice,
        selectableOptions,
      ),
    };
  }
  if (choice.kind === "select_cards") {
    const exposeSelected = selectedRunnerExposeInstalledCardChoiceOptionIds(
      input,
      choice,
      selectableOptions,
    );
    if (exposeSelected) {
      return { choiceId: choice.choiceId, selectedOptionIds: exposeSelected };
    }
    const requiredCoverage =
      runnerVisibleSearchCoverageNeed(input)?.requiredCoverage;
    const preferredServerId = runnerSearchPreferredServerId(input);
    const searchSelected = selectedSearchChoiceOptionIds(
      choice,
      selectableOptions,
      {
        features: dependencies.extractAiFeatures(input),
        rolesForCardId: dependencies.rolesForCardId,
        ...(requiredCoverage ? { requiredCoverage } : {}),
        ...(preferredServerId ? { preferredServerId } : {}),
      },
    );
    if (searchSelected)
      return { choiceId: choice.choiceId, selectedOptionIds: searchSelected };
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selectedDefaultCardChoiceOptionIds(
        choice,
        selectableOptions,
      ),
    };
  }
  if (choice.source.startsWith("v1921.playful_ai")) {
    const selectedOptionId = selectedPlayfulAiChoiceOptionId(choice);
    return selectedOptionId !== undefined
      ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.source.startsWith("trace_post_bid_link")) {
    const selectedOptionId = selectedPostBidLinkChoiceOptionId(
      choice,
      latestTraceContext(input),
    );
    return selectedOptionId !== undefined
      ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.source.startsWith("runner_draw.draw_tax:")) {
    const selectedOptionId =
      selectableOptions.find((option) => option.id === "pay_credit")?.id ??
      selectableOptions.find((option) => option.id === "take_tag")?.id;
    return selectedOptionId !== undefined
      ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (choice.source.startsWith("runner_draw.draw_tax_rez:")) {
    const selectedOptionId =
      selectableOptions.find((option) => option.id.startsWith("rez_"))?.id ??
      selectableOptions.find((option) => option.id === "pass")?.id;
    return selectedOptionId !== undefined
      ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (
    input.side === "runner" &&
    choice.source.startsWith("successful_run.credit_loss_spend:")
  ) {
    const selectedOptionId = selectedCreditLossSpendOptionId(
      input,
      selectableOptions,
    );
    return selectedOptionId !== undefined
      ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
      : { choiceId: choice.choiceId, selectedOptionIds: [] };
  }
  if (input.side === "runner") {
    const selectedDamagePreventionOptionId =
      selectedRunnerDamagePreventionChoiceOptionId(
        input,
        choice,
        selectableOptions,
        dependencies.rolesForCardId,
      );
    if (selectedDamagePreventionOptionId !== undefined) {
      return {
        choiceId: choice.choiceId,
        selectedOptionIds: [selectedDamagePreventionOptionId],
      };
    }
    const selectedOptionId = selectedRunnerTagAvoidanceChoiceOptionId(
      choice,
      selectableOptions,
    );
    if (selectedOptionId !== undefined) {
      return {
        choiceId: choice.choiceId,
        selectedOptionIds: [selectedOptionId],
      };
    }
  }
  if (choice.kind !== "bid_amount") {
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selectedFallbackChoiceOptionIds(
        choice,
        selectableOptions,
      ),
    };
  }

  const selectedOptionId = selectedBidChoiceOptionId(
    input,
    choice,
    latestTraceContext(input),
  );
  return selectedOptionId !== undefined
    ? { choiceId: choice.choiceId, selectedOptionIds: [selectedOptionId] }
    : { choiceId: choice.choiceId, selectedOptionIds: [] };
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

function runnerSearchPreferredServerId(
  input: AiDecisionInput,
): string | undefined {
  if (input.side !== "runner") return undefined;
  const target = getStrategicIntentMemorySnapshot(input)?.state.targetVector;
  return target?.kind === "central" || target?.kind === "remote"
    ? target.targetId
    : undefined;
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
): string[] {
  const sourceParts = choice.source.split(":");
  const temporaryCredits = Number.parseInt(sourceParts.at(-2) ?? "", 10);
  if (!Number.isInteger(temporaryCredits) || temporaryCredits < 0) return [];
  let creditsRemaining = input.playerView.own.credits + temporaryCredits;
  const installedCardsById = new Map(
    input.playerView.servers.flatMap((server) =>
      [...server.ice, ...server.root].map((card) => [card.instanceId, card]),
    ),
  );
  const selected: string[] = [];
  for (const option of selectableOptions) {
    const card = installedCardsById.get(choiceCardInstanceId(option));
    const rezCost = card?.rezCost;
    if (!Number.isFinite(rezCost) || rezCost === undefined || rezCost < 0)
      continue;
    if (rezCost > creditsRemaining) continue;
    selected.push(option.id);
    creditsRemaining -= rezCost;
    if (selected.length >= choice.maxSelections) break;
  }
  return selected.length >= choice.minSelections ? selected : [];
}

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
  if (selected.length < choice.minSelections) {
    return selectedDefaultCardChoiceOptionIds(choice, selectableOptions).slice(
      0,
      choice.minSelections,
    );
  }
  return selected.map((option) => option.id);
}

function choiceCardInstanceId(option: PendingChoiceOptions[number]): string {
  if (typeof option.value === "string" && option.value.length > 0)
    return option.value;
  return option.id.startsWith("card_") ? option.id.slice(5) : option.id;
}
