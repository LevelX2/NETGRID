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
import { projectHqInstallRezOptionQuote } from "../payment";

export function visibleChoice(
  state: GameState,
  choice: ChoiceRequest,
): NonNullable<PlayerView["pendingChoice"]> {
  const stackSearchResolution =
    choice.stackSearchResolution ?? stackSearchResolutionForChoice(choice);
  const cardSearchPresentation =
    choice.cardSearchPresentation ??
    cardSearchPresentationForChoice(choice, stackSearchResolution);
  return sanitizeChoiceViewForSurface(
    {
      choiceId: choice.choiceId,
      side: choice.side,
      source: choice.source,
      ...(choice.sourceCardInstanceId
        ? { sourceCardInstanceId: choice.sourceCardInstanceId }
        : {}),
      ...(choice.sourceCardDefinitionId
        ? { sourceCardDefinitionId: choice.sourceCardDefinitionId }
        : {}),
      ...(choice.continuation ? { continuation: choice.continuation } : {}),
      prompt: choice.prompt,
      ...(choice.presentationKey
        ? { presentationKey: choice.presentationKey }
        : choice.kind === "select_cards"
          ? { presentationKey: "generic_select_cards" as const }
          : choice.kind === "bid_amount"
            ? { presentationKey: "generic_bid_amount" as const }
            : choice.kind === "select_option"
              ? { presentationKey: "generic_select_option" as const }
              : choice.kind === "confirm"
                ? { presentationKey: "generic_confirm" as const }
                : {}),
      kind: choice.kind,
      options: choice.options.map((option) => {
        const hqInstallRezOptionQuote = projectHqInstallRezOptionQuote(
          state,
          choice,
          option,
        );
        const card = hqInstallRezOptionQuote
          ? visibleOwnCard(state, hqInstallRezOptionQuote.cardId)
          : visibleChoiceCardForOption(state, choice, option);
        const value = visibleChoiceOptionValue(state, choice, option);
        return {
          id: option.id,
          label: option.label,
          ...(option.publicLabel ? { publicLabel: option.publicLabel } : {}),
          ...(option.selectable === false ? { selectable: false } : {}),
          ...(value !== undefined ? { value } : {}),
          ...(option.metadata ? { metadata: { ...option.metadata } } : {}),
          ...(card ? { card } : {}),
          ...(hqInstallRezOptionQuote ? { hqInstallRezOptionQuote } : {}),
        };
      }),
      minSelections: choice.minSelections,
      maxSelections: choice.maxSelections,
      ...(choice.selectionOrdering
        ? { selectionOrdering: choice.selectionOrdering }
        : {}),
      stateVersion: choice.stateVersion,
      visibility: choice.visibility,
      ...(stackSearchResolution ? { stackSearchResolution } : {}),
      ...(cardSearchPresentation ? { cardSearchPresentation } : {}),
    },
    "actor_private",
  );
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
    !choice.source.startsWith(
      "card_implementation.multi_expose_installed_corp_cards",
    )
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
      choice.source.startsWith("v1911.hidden_stack_program_install") ||
      choice.source.startsWith("v1911.search_stack_card") ||
      choice.source.startsWith("v1911.search_stack") ||
      choice.source.startsWith("v1911.aujourdoui_top5") ||
      choice.source.startsWith("v1912.search_stack") ||
      choice.source.startsWith("runner.stack_search_to_grip") ||
      choice.source.startsWith(
        "v1911.temporary_program_install_stack_install",
      ) ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install"))
  );
}

function isRunnerStackArrangeChoice(choice: ChoiceRequest): boolean {
  return (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("v098.arrange_stack_top2") ||
      choice.source.startsWith("v1911.arrange_stack_top2") ||
      choice.source.startsWith(
        "v1922.runner_stack_top5_choose_one_arrange_rest",
      ) ||
      choice.source.startsWith(
        "p3_37.runner_stack_top5_choose_one_arrange_rest",
      ))
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

function isStrategicPlanningGroupDrawChoice(choice: ChoiceRequest): boolean {
  return (
    choice.kind === "select_cards" &&
    choice.source.startsWith(
      "card_implementation.strategic_planning_group_draw:",
    )
  );
}

function stackSearchResolutionForChoice(
  choice: ChoiceRequest,
): ChoiceRequest["stackSearchResolution"] | undefined {
  if (!isRunnerStackSearchChoice(choice)) return undefined;
  return {
    reveal:
      choice.source.startsWith("runner.stack_search_to_grip") ||
      choice.source.startsWith("v1911.aujourdoui_top5") ||
      choice.source.startsWith("v1911.hidden_stack_program_install") ||
      choice.source.startsWith(
        "v1911.temporary_program_install_stack_install",
      ) ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
        choice.source.includes(":stack:"))
        ? "public"
        : "hidden",
    destination:
      choice.source.startsWith("v1911.hidden_stack_program_install") ||
      choice.source.startsWith(
        "v1911.temporary_program_install_stack_install",
      ) ||
      choice.source.startsWith("p3_38.search_stack_install") ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install")
        ? "install_program"
        : "grip",
    shuffleAfter: true,
    ...(choice.source.startsWith("v1911.hidden_stack_program_install") ||
    choice.source.startsWith("v1911.temporary_program_install_stack_install") ||
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
      ...(isTemporaryProgramInstallChoiceSource(choice.source) ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install")
        ? { temporaryReturnAtEndOfTurn: true }
        : {}),
    };
  }
  if (
    choice.source.startsWith("p3_37.search_trash_to_grip") ||
    choice.source.startsWith("v1911.temporary_program_install_heap_install") ||
    (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
      choice.source.includes(":heap:"))
  ) {
    const temporaryInstall =
      isTemporaryProgramInstallChoiceSource(choice.source) ||
      choice.source.startsWith("p3_38.stack_or_trash_program_install");
    return {
      sourceZone: "heap",
      selectableFilter: choice.source.includes(":any_card:")
        ? "any_card"
        : "program",
      reveal: "hidden",
      destination: temporaryInstall ? "install_program" : "grip",
      shuffleAfter: choice.source.startsWith(
        "p3_38.stack_or_trash_program_install",
      ),
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

function isTemporaryProgramInstallChoiceSource(source: string): boolean {
  return source.startsWith("v1911.temporary_program_install_");
}

export function visibleChoiceCardForOption(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceRequest["options"][number],
): VisibleCard | undefined {
  if (typeof option.value !== "string") return undefined;
  const agendaPurgeCardId = agendaPurgeChoiceCardIdForOption(
    state,
    choice,
    option,
  );
  if (agendaPurgeCardId) return visibleOwnCard(state, agendaPurgeCardId);
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
  const isCorpDrawChoice = isStrategicPlanningGroupDrawChoice(choice);
  const isRunnerHiddenDrawReplacementChoice =
    choice.continuation?.family ===
    "runner_hidden_draw_keep_or_top_replacement";
  const isTemporaryHeapInstallChoice =
    choice.source.startsWith("v1911.temporary_program_install_heap_install") ||
    (choice.source.startsWith("p3_38.stack_or_trash_program_install") &&
      choice.source.includes(":heap:"));
  const isScoredAgendaFreeRezChoice = choice.source.startsWith(
    "card_implementation.scored_agenda_free_rez",
  );
  const isP333PrivateLookChoice =
    choice.source.startsWith("p3_33.private_look");
  if (
    !cardSearchPresentation &&
    !isStackChoice &&
    !isRunnerArrangeChoice &&
    !isCorpArrangeChoice &&
    !isCorpDrawChoice &&
    !isRunnerHiddenDrawReplacementChoice &&
    !isTemporaryHeapInstallChoice &&
    !isScoredAgendaFreeRezChoice &&
    !isP333PrivateLookChoice
  )
    return undefined;
  if (isP333PrivateLookChoice) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.owner !== "corp") return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (isScoredAgendaFreeRezChoice) {
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
    (cardSearchPresentation?.sourceZone === "heap" ||
      isTemporaryHeapInstallChoice) &&
    !state.runner.heap.includes(cardId)
  )
    return undefined;
  const instance = state.cardInstances[cardId];
  if (isCorpArrangeChoice) {
    if (!instance || instance.owner !== "corp") return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (isCorpDrawChoice) {
    if (
      !instance ||
      instance.owner !== "corp" ||
      !state.pendingCorpDraw?.drawnCardIds.includes(cardId) ||
      !(state.specialZones?.setAside ?? []).includes(cardId)
    )
      return undefined;
    return visibleOwnCard(state, cardId);
  }
  if (isRunnerHiddenDrawReplacementChoice) {
    const hiddenDrawContinuation = choice.continuation;
    if (
      hiddenDrawContinuation?.family !==
      "runner_hidden_draw_keep_or_top_replacement"
    )
      return undefined;
    const [drawnCardId, disposition] = option.value.split(":");
    if (
      !drawnCardId ||
      (disposition !== "trash" && disposition !== "top") ||
      !hiddenDrawContinuation.drawnCardInstanceIds.includes(drawnCardId) ||
      !state.runner.grip.includes(drawnCardId as CardInstanceId)
    )
      return undefined;
    const drawnInstance = state.cardInstances[drawnCardId];
    if (!drawnInstance || drawnInstance.owner !== "runner") return undefined;
    return visibleOwnCard(state, drawnCardId as CardInstanceId);
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

function agendaPurgeChoiceCardIdForOption(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceRequest["options"][number],
): CardInstanceId | undefined {
  if (
    !choice.source.startsWith(
      "card_implementation.agenda_purge_install_targets:",
    ) &&
    !choice.source.startsWith("card_implementation.agenda_purge_runner_review:")
  )
    return undefined;
  if (typeof option.value !== "string") return undefined;
  const candidateId = option.value.split("|")[0] as CardInstanceId | undefined;
  if (!candidateId) return undefined;
  const [, , revealedText] = choice.source.split(":");
  const revealedIds = new Set(
    (revealedText ?? "")
      .split(",")
      .filter(Boolean)
      .map((id) => id as CardInstanceId),
  );
  if (!revealedIds.has(candidateId)) return undefined;
  const instance = state.cardInstances[candidateId];
  if (!instance || instance.owner !== "corp") return undefined;
  if (!state.corp.rd.slice(0, 3).includes(candidateId)) return undefined;
  return candidateId;
}
