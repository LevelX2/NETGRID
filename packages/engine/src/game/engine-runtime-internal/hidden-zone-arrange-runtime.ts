import type {
  GameState,
  HiddenZoneArrangeChoiceHandlerHost,
  LegalAction,
  PlayerAction,
  RuntimeDeps,
} from "./runtime-shared";
import type { ChoiceHiddenZoneRuntimeLinks } from "./choice-hidden-zone-runtime-links";

export function createHiddenZoneArrangeRuntime(
  deps: RuntimeDeps,
  links: ChoiceHiddenZoneRuntimeLinks,
): import("./hidden-zone-arrange-runtime-port").HiddenZoneArrangeRuntimePort {
  const {
    iceChoiceLabelForSide,
  } = links;

  function hiddenZoneArrangeChoiceHandlerHost(
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ): HiddenZoneArrangeChoiceHandlerHost {
    return {
      state,
      legalAction,
      ...(playerAction ? { playerAction } : {}),
      cards: {
        definitionFor: (cardId) => deps.definitionFor(state, cardId),
        hiddenReplacementLongtailKind: (definitionId) =>
          deps.cardImplementationForDefinitionId(definitionId)
            ?.hiddenReplacementLongtail?.kind,
        hasCorpUtilityKind: (cardId, kind) =>
          deps.hasCorpUtilityKind(
            state,
            cardId,
            kind as Parameters<typeof deps.hasCorpUtilityKind>[2],
          ),
        mustInstance: (cardId) =>
          deps.mustInstance(state.cardInstances, cardId),
      },
      zones: {
        removeFromAllZones: (cardId) => deps.removeFromAllZones(state, cardId),
      },
      servers: {
        mustServer: (serverId) => deps.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          deps.publicServerLabel(state, serverId),
      },
      choices: {
        iceChoiceLabelForSide: (cardId, visibleTo, fallback) =>
          iceChoiceLabelForSide(state, cardId, visibleTo, fallback),
      },
      callbacks: {
        runnerTurnFlags: () => deps.ensureRunnerTurnFlags(state),
      },
    };
  }

  function resolveP358HiddenReplacementChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const hiddenZoneArrangeChoice = deps.handleHiddenZoneArrangeChoice(
      hiddenZoneArrangeChoiceHandlerHost(state, legalAction, playerAction),
    );
    if (hiddenZoneArrangeChoice.handled) return;
    void legalAction;
    void playerAction;
    throw new Error("Unbekannte P3.58-Choice.");
  }

  return {
    hiddenZoneArrangeChoiceHandlerHost,
    resolveP358HiddenReplacementChoice,
  };
}
