import {
  CARD_DEFINITIONS_BY_ID,
  type GameState,
  type LegalAction,
  type ResolvedGameEffect,
} from "@netgrid/shared";
import type { AutomaticEffectCollector, RuntimeDeps } from "./runtime-shared";

type ContinuationCallbacks = {
  applyCorpStartOfTurnEffects: (
    state: GameState,
    effects: AutomaticEffectCollector,
    legalAction: LegalAction,
    rootCardStartIndex: number,
    skipPreamble: boolean,
  ) => boolean;
  openCorpStartTurnRestrictedActionOffers: (
    state: GameState,
    effects: AutomaticEffectCollector,
  ) => void;
  applyRunnerStartOfTurnEffects: (
    state: GameState,
    effects: AutomaticEffectCollector,
    resumePoint: "begin",
    legalAction: LegalAction,
    counterEffectStartIndex: number,
  ) => void;
  appendResolvedEffectsToPayload: (
    legalAction: LegalAction,
    effects: AutomaticEffectCollector,
  ) => void;
};

type ContinuationDeps = Pick<
  RuntimeDeps,
  | "definitionFor"
  | "rezzedCorpRootCardIds"
  | "runnerTraceCounterEffectDefinitions"
>;

/**
 * Resumes a suspended turn-start tag effect after its prevention window.
 * The persisted cursor and source identity are revalidated before execution;
 * this keeps continuation routing generic and deterministic.
 */
export function createTurnStartTagContinuationResolver(
  deps: ContinuationDeps,
  callbacks: ContinuationCallbacks,
): (state: GameState, legalAction: LegalAction) => void {
  return (state, legalAction) => {
    const continuation = state.pendingAddTagContinuation;
    if (!continuation)
      throw new Error("Es ist keine Start-of-turn-Tag-Fortsetzung offen.");
    if (state.pendingChoice || state.eventModificationWindow)
      throw new Error("Das Add-Tag-Fenster ist noch nicht abgeschlossen.");
    const effects: AutomaticEffectCollector = [];

    if (continuation.kind === "corp_start_turn") {
      const tagsAdded = Math.max(
        0,
        state.runner.tags - continuation.runnerTagsBefore,
      );
      const rootCardIds = deps.rezzedCorpRootCardIds(state);
      if (
        continuation.nextRootCardIndex <= 0 ||
        rootCardIds[continuation.nextRootCardIndex - 1] !==
          continuation.sourceCardId ||
        deps.definitionFor(state, continuation.sourceCardId).id !==
          continuation.sourceDefinitionId
      )
        throw new Error("Die Corp-Start-Tag-Fortsetzung ist veraltet.");
      effects.push({
        effectId: `corp.start.classic.satellite_monitors.${continuation.sourceCardId}`,
        kind: tagsAdded > 0 ? "add_tags" : "counter_change",
        visibility: "public",
        side: "runner",
        amount: tagsAdded,
        reason: "start_of_turn",
        sourceDefinitionId: continuation.sourceDefinitionId,
        sourceTitle: publicCardTitle(continuation.sourceDefinitionId),
        runAttemptsLastTurn: continuation.runAttemptsLastTurn,
        dieSize: 6,
        dieRolls: continuation.dieRolls.join(","),
        tagsAdded,
        runnerTagsAfter: state.runner.tags,
        randomCounterAfter: state.randomCounter,
      });
      delete state.pendingAddTagContinuation;
      const suspended = callbacks.applyCorpStartOfTurnEffects(
        state,
        effects,
        legalAction,
        continuation.nextRootCardIndex,
        true,
      );
      if (!suspended)
        callbacks.openCorpStartTurnRestrictedActionOffers(state, effects);
      callbacks.appendResolvedEffectsToPayload(legalAction, effects);
      return;
    }

    if (continuation.kind === "runner_start_turn") {
      const tagsAdded = Math.max(
        0,
        state.runner.tags - continuation.runnerTagsBefore,
      );
      const counterEffect =
        deps.runnerTraceCounterEffectDefinitions()[
          continuation.nextCounterEffectIndex - 1
        ];
      if (
        !counterEffect ||
        counterEffect.sourceDefinitionId !== continuation.sourceDefinitionId ||
        counterEffect.counterType !== continuation.counterType ||
        counterEffect.startOfRunnerTurn?.kind !== "add_tags"
      )
        throw new Error("Die Runner-Start-Tag-Fortsetzung ist veraltet.");
      if (tagsAdded > 0)
        effects.push({
          effectId: `runner.start.${continuation.counterType}`,
          kind: "add_tags",
          visibility: "public",
          side: "runner",
          amount: tagsAdded,
          reason: "start_of_turn",
          sourceDefinitionId: continuation.sourceDefinitionId,
          sourceTitle: publicCardTitle(continuation.sourceDefinitionId),
        });
      delete state.pendingAddTagContinuation;
      callbacks.applyRunnerStartOfTurnEffects(
        state,
        effects,
        "begin",
        legalAction,
        continuation.nextCounterEffectIndex,
      );
      callbacks.appendResolvedEffectsToPayload(legalAction, effects);
      return;
    }

    throw new Error("Die Add-Tag-Fortsetzung gehoert nicht zum Turn-Start.");
  };
}

function publicCardTitle(definitionId: string): string {
  return CARD_DEFINITIONS_BY_ID[definitionId]?.title ?? definitionId;
}
