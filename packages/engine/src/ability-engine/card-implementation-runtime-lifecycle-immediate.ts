import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import { executeCardImplementationEffects } from "./effect-interpreter";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import type {
  CardEffectImplementation,
  CardLifecycleImplementation,
} from "./definition-types";

export type ImmediateLifecycle = Exclude<
  keyof CardLifecycleImplementation,
  | "start_of_corp_turn"
  | "start_of_runner_turn"
  | "end_of_runner_turn"
  | "on_runner_run_start"
>;

export function cardImplementationLifecycleEffects(
  definition: CardDefinition,
  lifecycle: ImmediateLifecycle,
): readonly CardEffectImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.lifecycle?.[lifecycle] ??
    []
  );
}

export function lifecycleReason(
  lifecycle: ImmediateLifecycle,
): string | undefined {
  return lifecycle === "on_leave_play" ? "source_left_play" : undefined;
}

/**
 * Dispatches immediate lifecycle effects such as on_rez, on_install, and
 * on_score for one source card.
 *
 * These hooks are intentionally narrow lifecycle entry points, not a general
 * trigger registry. Callers choose the timing and source; this helper only
 * executes the declared effects for the current source.
 */
export function executeCardImplementationLifecycleEffects(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction | undefined,
  definition: CardDefinition,
  cardId: CardInstanceId,
  lifecycle: ImmediateLifecycle,
): void {
  const effects = cardImplementationLifecycleEffects(definition, lifecycle);
  if (effects.length === 0) return;
  const reason = lifecycleReason(lifecycle);
  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId: cardId,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      ...(typeof legalAction?.payload?.targetCardId === "string"
        ? { targetCardId: legalAction.payload.targetCardId as CardInstanceId }
        : {}),
      xValue: Math.floor(Number(legalAction?.payload?.xValue ?? 0)),
      targetRezCost: Math.floor(
        Number(legalAction?.payload?.targetRezCost ?? 0),
      ),
      controller: deps.mustInstance(state.cardInstances, cardId).controller,
      addHostedCredits: (sourceCardId, amount) =>
        deps.addHostedCredits(state, sourceCardId, amount),
      addCountersToSource: (sourceCardId, counterType, amount) =>
        deps.addCountersToSource(state, sourceCardId, counterType, amount),
      takeHostedCredits: (sourceCardId, side, amount) =>
        deps.takeHostedCredits(state, sourceCardId, side, amount),
      trashSourceWhenEmpty: (sourceCardId) =>
        deps.trashSourceWhenEmpty(state, sourceCardId),
      trashSource: (sourceCardId) =>
        deps.trashSource(state, sourceCardId, legalAction),
      shuffleSourceIntoCorpRd: (sourceCardId) =>
        deps.shuffleSourceIntoCorpRd(state, sourceCardId, definition.id),
      trashCorpInstalledCardsInSourceServer: (sourceCardId) =>
        deps.trashCorpInstalledCardsInSourceServer(
          state,
          legalAction,
          sourceCardId,
          definition.id,
        ),
      replaceFortCardsFromHq: () => {
        if (!legalAction)
          throw new Error("Source-fort replacement braucht eine LegalAction.");
        return deps.replaceFortCardsFromHq(
          state,
          legalAction,
          cardId,
          definition.id,
        );
      },
      ...(reason ? { reason } : {}),
    },
    effects,
  );
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definition.id,
    ...result.publicPayload,
  };
  deps.appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
}
