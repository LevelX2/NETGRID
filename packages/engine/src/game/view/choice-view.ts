// ARCH-6 read-only View-Helfer.
// Keine State-Mutation, keine LegalAction-Erzeugung, kein Import aus index.ts,
// keine PublicPayload-Vertragsaenderung.
import {
  type CardSearchPresentation,
  type CardInstanceId,
  type ChoiceRequest,
  type GameState,
  type PlayerView,
  type VisibleCard,
} from "@netgrid/shared";
import { definitionFor, visibleOwnCard } from "./card-view";
import { sanitizeChoiceViewForSurface } from "./surface-policy";

export function visibleChoice(
  state: GameState,
  choice: ChoiceRequest,
): NonNullable<PlayerView["pendingChoice"]> {
  const stackSearchResolution =
    choice.stackSearchResolution ?? stackSearchResolutionForChoice(choice);
  const cardSearchPresentation =
    choice.cardSearchPresentation ??
    cardSearchPresentationForChoice(choice, stackSearchResolution);
  return sanitizeChoiceViewForSurface({
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => {
      const card = visibleChoiceCardForOption(state, choice, option);
      const value = visibleChoiceOptionValue(state, choice, option);
      return {
        id: option.id,
        label: option.label,
        ...(option.publicLabel ? { publicLabel: option.publicLabel } : {}),
        ...(option.selectable === false ? { selectable: false } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(card ? { card } : {}),
      };
    }),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility,
    ...(stackSearchResolution ? { stackSearchResolution } : {}),
    ...(cardSearchPresentation ? { cardSearchPresentation } : {}),
  }, "actor_private");
}

function visibleChoiceOptionValue(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceRequest["options"][number],
): ChoiceRequest["options"][number]["value"] | undefined {
  if (option.value === undefined) return undefined;
  if (
    choice.visibility === "public" &&
    option.publicLabel &&
    typeof option.value === "string" &&
    option.id.startsWith("ice_")
  )
    return undefined;
  if (choiceOptionValueIsHiddenInstalledCorpExposeTarget(state, choice, option))
    return undefined;
  return option.value;
}

function choiceOptionValueIsHiddenInstalledCorpExposeTarget(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceRequest["options"][number],
): boolean {
  if (choice.kind !== "select_cards") return false;
  if (
    !choice.source.startsWith("p3_36.expose_installed_card:") &&
    !choice.source.startsWith("p3_36.expose_installed_cards") &&
    !choice.source.startsWith("v1912.hunt_club_bbs_expose")
  )
    return false;
  if (typeof option.value !== "string") return false;
  const instance = state.cardInstances[option.value as CardInstanceId];
  if (
    !instance ||
    instance.owner !== "corp" ||
    instance.zone.side !== "corp" ||
    (instance.zone.zone !== "serverIce" && instance.zone.zone !== "serverRoot")
  )
    return false;
  return !instance.faceup && !instance.rezzed;
}

function isRunnerStackSearchChoice(choice: ChoiceRequest): boolean {
  return (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("v098.search_stack") ||
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.search_stack_card") ||
      choice.source.startsWith("v1911.search_stack") ||
      choice.source.startsWith("v1911.aujourdoui_top5") ||
      choice.source.startsWith("v1912.search_stack") ||
      choice.source.startsWith("v1911.short_circuit_search") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install") ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install"))
  );
}

function isRunnerStackArrangeChoice(choice: ChoiceRequest): boolean {
  return (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("v098.arrange_stack_top2") ||
      choice.source.startsWith("v1911.arrange_stack_top2") ||
      choice.source.startsWith("v1922.runner_stack_top5_choose_one_arrange_rest") ||
      choice.source.startsWith("p3_37.runner_stack_top5_choose_one_arrange_rest"))
  );
}

function isCorpRdArrangeChoice(choice: ChoiceRequest): boolean {
  return (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("v1911.corp_rd_arrange_top2") ||
      choice.source.startsWith("v1917.corp_rd_arrange_top2") ||
      choice.source.startsWith("v1922.corp_rd_arrange_top5"))
  );
}

function stackSearchResolutionForChoice(
  choice: ChoiceRequest,
): ChoiceRequest["stackSearchResolution"] | undefined {
  if (!isRunnerStackSearchChoice(choice)) return undefined;
  return {
    reveal:
      choice.source.startsWith("v1911.short_circuit_search") ||
      choice.source.startsWith("v1911.aujourdoui_top5") ||
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install") ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
        choice.source.includes(":stack:"))
        ? "public"
        : "hidden",
    destination:
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install") ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install")
        ? "install_program"
        : "grip",
    shuffleAfter: true,
    ...(choice.source.startsWith("v1911.self_modifying_code_install_program") ||
    choice.source.startsWith("v1911.sneak_preview_stack_install") ||
    choice.source.startsWith("p3_38.search_stack_install") ||
    choice.source.startsWith("p3_38.stack_or_trash_program_install")
      ? { publicRevealKind: "reveal" }
      : {}),
  };
}

function cardSearchPresentationForChoice(
  choice: ChoiceRequest,
  stackSearchResolution: ChoiceRequest["stackSearchResolution"] | undefined,
): CardSearchPresentation | undefined {
  if (choice.kind !== "select_cards") return undefined;
  if (stackSearchResolution) {
    return {
      ...stackSearchResolution,
      sourceZone: "stack",
      selectableFilter: stackSearchSelectableFilter(choice),
      showNonMatchingCards: true,
      ...(choice.source.includes("sneak_preview") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install")
        ? { temporaryReturnAtEndOfTurn: true }
        : {}),
    };
  }
  if (
    choice.source.startsWith("p3_37.search_trash_to_grip") ||
    choice.source.startsWith("v1911.sneak_preview_heap_install") ||
    (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
      choice.source.includes(":heap:"))
  ) {
    const temporaryInstall =
      choice.source.includes("sneak_preview") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install");
    return {
      sourceZone: "heap",
      selectableFilter: choice.source.includes(":any_card:")
        ? "any_card"
        : "program",
      reveal: "hidden",
      destination: temporaryInstall ? "install_program" : "grip",
      shuffleAfter: false,
      showNonMatchingCards: true,
      ...(temporaryInstall ? { temporaryReturnAtEndOfTurn: true } : {}),
    };
  }
  return undefined;
}

function stackSearchSelectableFilter(
  choice: ChoiceRequest,
): CardSearchPresentation["selectableFilter"] {
  if (choice.source.includes(":any_card:")) return "any_card";
  if (choice.source.startsWith("p3_37.look_top_stack_take_matching"))
    return "matching_cards";
  return "program";
}

export function visibleChoiceCardForOption(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceRequest["options"][number],
): VisibleCard | undefined {
  if (typeof option.value !== "string") return undefined;
  const cardId = option.value as CardInstanceId;
  const cardSearchPresentation =
    choice.cardSearchPresentation ??
    cardSearchPresentationForChoice(
      choice,
      choice.stackSearchResolution ?? stackSearchResolutionForChoice(choice),
    );
  const isStackChoice = isRunnerStackSearchChoice(choice);
  const isRunnerArrangeChoice = isRunnerStackArrangeChoice(choice);
  const isCorpArrangeChoice = isCorpRdArrangeChoice(choice);
  const isSneakHeapChoice =
    choice.source.startsWith("v1911.sneak_preview_heap_install") ||
    (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
      choice.source.includes(":heap:"));
  const isPriorityRequisitionChoice = choice.source.startsWith(
    "v162.priority_requisition",
  );
  const isP333PrivateLookChoice = choice.source.startsWith(
    "p3_33.private_look",
  );
  if (
    !cardSearchPresentation &&
    !isStackChoice &&
    !isRunnerArrangeChoice &&
    !isCorpArrangeChoice &&
    !isSneakHeapChoice &&
    !isPriorityRequisitionChoice &&
    !isP333PrivateLookChoice
  )
    return undefined;
  if (isP333PrivateLookChoice) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.owner !== "corp") return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (isPriorityRequisitionChoice) {
    const instance = state.cardInstances[cardId];
    if (
      !instance ||
      instance.owner !== "corp" ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce" ||
      instance.rezzed ||
      definitionFor(state, cardId).type !== "ice"
    )
      return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (
    (cardSearchPresentation?.sourceZone === "stack" ||
      isStackChoice ||
      isRunnerArrangeChoice) &&
    !state.runner.stack.includes(cardId)
  )
    return undefined;
  if (isCorpArrangeChoice && !state.corp.rd.includes(cardId)) return undefined;
  if (
    (cardSearchPresentation?.sourceZone === "heap" || isSneakHeapChoice) &&
    !state.runner.heap.includes(cardId)
  )
    return undefined;
  const instance = state.cardInstances[cardId];
  if (isCorpArrangeChoice) {
    if (!instance || instance.owner !== "corp") return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (!instance || instance.owner !== "runner") return undefined;
  if (
    !cardSearchPresentation &&
    !isStackChoice &&
    !isRunnerArrangeChoice &&
    definitionFor(state, cardId).type !== "program"
  )
    return undefined;
  return visibleOwnCard(state, cardId);
}
