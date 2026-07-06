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
import { selectedPlayfulAiChoiceOptionId } from "./playful-ai-choice-option";
import { selectedPostBidLinkChoiceOptionId } from "./post-bid-link-choice-option";
import {
  selectedSearchChoiceOptionIds,
  type SearchChoiceFeatureSnapshot,
} from "./search-choice-option";
import {
  selectedDefaultCardChoiceOptionIds,
  selectedFallbackChoiceOptionIds,
} from "./select-card-choice-option";
import { selectedSetupMulliganChoiceOptionId } from "./setup-mulligan-choice-option";
import { selectedShellTradersStartTurnChoiceOptionId } from "./shell-traders-choice-option";
import { latestTraceContext } from "./trace-context";

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
    choice.source.startsWith("v1912.shell_traders_start_turn")
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
      choice.source.startsWith("v1919.systematic_layoffs_advancement"))
  ) {
    const selected = selectedCorpAdvancementCounterChoiceOptionId(
      input,
      selectableOptions,
    );
    return {
      choiceId: choice.choiceId,
      selectedOptionIds: selected ? [selected] : [],
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
    const searchSelected = selectedSearchChoiceOptionIds(
      choice,
      selectableOptions,
      {
        features: dependencies.extractAiFeatures(input),
        rolesForCardId: dependencies.rolesForCardId,
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

function choiceCardInstanceId(
  option: PendingChoiceOptions[number],
): string {
  if (typeof option.value === "string" && option.value.length > 0)
    return option.value;
  return option.id.startsWith("card_") ? option.id.slice(5) : option.id;
}
