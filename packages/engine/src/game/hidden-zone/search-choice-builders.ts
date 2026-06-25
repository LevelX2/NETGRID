import type {
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
} from "@netgrid/shared";

type HiddenZonePayload = Record<string, string | number | boolean>;
type ChoiceOptions = ChoiceRequest["options"];
type SearchToGripFilter = "program" | "any_card";
type InstallSourceZone = "heap" | "stack";
type SearchCardType =
  | "program"
  | "event"
  | "hardware"
  | "resource";

export function buildSearchTrashToGripChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  filter: SearchToGripFilter;
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `p3_37_search_trash_to_grip_${nextStateVersion}`,
    side: "runner",
    source: `p3_37.search_trash_to_grip:${input.sourceCardId}:${input.sourceDefinitionId}:${input.filter}:${nextStateVersion}`,
    prompt: "Heap durchsuchen",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
    cardSearchPresentation: {
      sourceZone: "heap",
      selectableFilter: input.filter,
      reveal: "hidden",
      destination: "grip",
      shuffleAfter: false,
      showNonMatchingCards: true,
    },
  };
}

export function buildSearchTrashToGripPayload(input: {
  sourceDefinitionId: CardDefinitionId;
  filter: SearchToGripFilter;
}): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_37_search_trash_to_grip",
    sourceDefinitionId: input.sourceDefinitionId,
    searchedZone: "runner_heap",
    searchFilter: input.filter,
  };
}

export function buildSearchStackToGripChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  filter: SearchToGripFilter;
  revealToCorp: boolean;
  shuffleAfterwards: true;
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `p3_37_search_stack_to_grip_${nextStateVersion}`,
    side: "runner",
    source: `p3_37.search_stack_to_grip:${input.sourceCardId}:${input.sourceDefinitionId}:${input.filter}:${input.revealToCorp ? "reveal" : "private"}:${input.shuffleAfterwards ? "shuffle" : "no_shuffle"}:${nextStateVersion}`,
    prompt: "Stack durchsuchen",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
    cardSearchPresentation: {
      sourceZone: "stack",
      selectableFilter: input.filter,
      reveal: input.revealToCorp ? "public" : "hidden",
      destination: "grip",
      shuffleAfter: input.shuffleAfterwards,
      showNonMatchingCards: true,
      ...(input.revealToCorp ? { publicRevealKind: "reveal" } : {}),
    },
  };
}

export function buildSearchStackToGripPayload(input: {
  sourceDefinitionId: CardDefinitionId;
  filter: SearchToGripFilter;
  revealToCorp: boolean;
}): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_37_search_stack_to_grip",
    sourceDefinitionId: input.sourceDefinitionId,
    searchedZone: "runner_stack",
    searchFilter: input.filter,
    searchRevealToCorp: input.revealToCorp,
    shufflePerformed: false,
  };
}

export function buildLookTopStackTakeMatchingChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  count: number;
  allowedTypes: readonly SearchCardType[];
  costPerTaken: number;
  revealTakenToCorp: true;
  shuffleRemainder: true;
  options: ChoiceOptions;
  maxSelections: number;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `p3_37_look_top_stack_take_matching_${nextStateVersion}`,
    side: "runner",
    source: `p3_37.look_top_stack_take_matching:${input.sourceCardId}:${input.sourceDefinitionId}:${input.count}:${input.allowedTypes.join(",")}:${input.costPerTaken}:${input.revealTakenToCorp ? "reveal" : "private"}:${input.shuffleRemainder ? "shuffle" : "no_shuffle"}:${nextStateVersion}`,
    prompt: "Stack-Spitze ansehen und Karten nehmen",
    kind: "select_cards",
    options: input.options,
    minSelections: 0,
    maxSelections: input.maxSelections,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
    stackSearchResolution: {
      reveal: "public",
      destination: "grip",
      shuffleAfter: true,
      publicRevealKind: "reveal",
    },
    cardSearchPresentation: {
      sourceZone: "stack",
      selectableFilter: "matching_cards",
      reveal: "public",
      destination: "grip",
      shuffleAfter: true,
      publicRevealKind: "reveal",
      showNonMatchingCards: true,
    },
  };
}

export function buildLookTopStackTakeMatchingPayload(input: {
  sourceDefinitionId: CardDefinitionId;
  privateLookCount: number;
  costPerTaken: number;
}): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_37_look_top_stack_take_matching",
    sourceDefinitionId: input.sourceDefinitionId,
    privateLookCount: input.privateLookCount,
    searchedZone: "runner_stack",
    costPerTaken: input.costPerTaken,
  };
}

export function buildSearchStackInstallChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  filter: "program";
  installCost: "normal" | "free";
  shuffleAfterwards: true;
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `p3_38_search_stack_install_${nextStateVersion}`,
    side: "runner",
    source: `p3_38.search_stack_install:${input.sourceCardId}:${input.sourceDefinitionId}:${input.filter}:${input.installCost}:${input.shuffleAfterwards ? "shuffle" : "no_shuffle"}:${nextStateVersion}`,
    prompt: "Stack durchsuchen und Programm installieren",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
    stackSearchResolution: {
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
      publicRevealKind: "reveal",
    },
    cardSearchPresentation: {
      sourceZone: "stack",
      selectableFilter: input.filter,
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
      publicRevealKind: "reveal",
      showNonMatchingCards: true,
    },
  };
}

export function buildSearchStackInstallPayload(input: {
  sourceDefinitionId: CardDefinitionId;
  filter: "program";
}): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_38_search_stack_install",
    sourceDefinitionId: input.sourceDefinitionId,
    searchedZone: "runner_stack",
    searchFilter: input.filter,
    searchDestination: "install_program",
    shufflePerformed: false,
  };
}

export function buildPaidStackProgramInstallChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `v1911_hidden_stack_program_install_${nextStateVersion}`,
    side: "runner",
    source: `v1911.hidden_stack_program_install:${input.sourceCardId}:${nextStateVersion}`,
    prompt: "Stack durchsuchen",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
    stackSearchResolution: {
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
      publicRevealKind: "reveal",
    },
    cardSearchPresentation: {
      sourceZone: "stack",
      selectableFilter: "program",
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
      publicRevealKind: "reveal",
      showNonMatchingCards: true,
    },
  };
}

export function buildTemporaryProgramInstallSourceChoice(input: {
  stateVersion: number;
  sourcePrefix: string;
  sourceCardId?: CardInstanceId | undefined;
  sourceDefinitionId: CardDefinitionId;
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `v1911_temporary_program_install_source_${nextStateVersion}`,
    side: "runner",
    source:
      input.sourcePrefix === "v1911.temporary_program_install"
        ? `v1911.temporary_program_install_source:${nextStateVersion}`
        : `${input.sourcePrefix}_source:${input.sourceCardId ?? ""}:${input.sourceDefinitionId}:${nextStateVersion}`,
    prompt: "Sneak-Preview-Quelle wählen",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
  };
}

export function buildTemporaryProgramInstallSourceChoicePayload(): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "temporary_program_install_source_choice",
    choiceVisibility: "runner_private",
  };
}

export function buildTemporaryProgramInstallChoice(input: {
  stateVersion: number;
  sourceZone: InstallSourceZone;
  sourcePrefix: string;
  sourceCardId?: CardInstanceId | undefined;
  sourceDefinitionId: CardDefinitionId;
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `v1911_temporary_program_install_${input.sourceZone}_install_${nextStateVersion}`,
    side: "runner",
    source:
      input.sourcePrefix === "v1911.temporary_program_install"
        ? `v1911.temporary_program_install_${input.sourceZone}_install:${nextStateVersion}`
        : `${input.sourcePrefix}:${input.sourceCardId ?? ""}:${input.sourceDefinitionId}:${input.sourceZone}:${nextStateVersion}`,
    prompt:
      input.sourceZone === "heap"
        ? "Programm aus dem Heap installieren"
        : "Programm aus dem Stack installieren",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
    cardSearchPresentation: {
      sourceZone: input.sourceZone,
      selectableFilter: "program",
      reveal: input.sourceZone === "stack" ? "public" : "hidden",
      destination: "install_program",
      shuffleAfter: input.sourceZone === "stack",
      ...(input.sourceZone === "stack" ? { publicRevealKind: "reveal" } : {}),
      showNonMatchingCards: true,
      temporaryReturnAtEndOfTurn: true,
    },
  };
}

export function buildRevealedStackProgramInstallChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  topCards: readonly CardInstanceId[];
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `v1915_revealed_stack_program_install_${nextStateVersion}`,
    side: "runner",
    source: `v1915.revealed_stack_program_install:${input.sourceCardId}:${input.topCards.join(",")}:${nextStateVersion}`,
    prompt: "Programm aus offengelegtem Stack installieren",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "public",
  };
}

export function buildRevealedStackProgramInstallCorpReviewChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  topCards: readonly CardInstanceId[];
  options: ChoiceOptions;
  programFound: boolean;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `p3_38_revealed_stack_program_install_corp_review_${nextStateVersion}`,
    side: "corp",
    source: `p3_38.revealed_stack_program_install_corp_review:${input.sourceCardId}:${input.sourceDefinitionId}:${input.topCards.join(",")}:${nextStateVersion}`,
    prompt: input.programFound
      ? "Stack-Spitze ansehen"
      : "Keine Programmkarte im offengelegten Stack",
    kind: "select_cards",
    options: [
      ...input.options,
      { id: "done", label: "Gesehen", value: "done" },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "public",
    cardSearchPresentation: {
      sourceZone: "stack",
      selectableFilter: "matching_cards",
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
      publicRevealKind: "reveal",
      showNonMatchingCards: true,
    },
  };
}

export function buildLookTopStackShowToCorpThenInstallMatchingChoice(input: {
  stateVersion: number;
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  topCards: readonly CardInstanceId[];
  options: ChoiceOptions;
}): ChoiceRequest {
  const nextStateVersion = input.stateVersion + 1;
  return {
    choiceId: `p3_38_stack_show_install_${nextStateVersion}`,
    side: "runner",
    source: `p3_38.look_top_stack_show_to_corp_then_install_matching:${input.sourceCardId}:${input.sourceDefinitionId}:${input.topCards.join(",")}:${nextStateVersion}`,
    prompt: "Gezeigtes Programm installieren",
    kind: "select_cards",
    options: input.options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "public",
  };
}
