import type {
  CardDefinition,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { effectiveIceRunSubroutines } from "./effective-ice-run-subroutines";
import { visibleOwnCard } from "../view/card-view";
import { visibleEffectiveEncounteredIceRunQuote } from "../view/visible-run-quote";
import { visibleRunnerBreakExchangeFacts } from "../view/visible-rez-resource-exchange-quote";

/** Corp-private rule facts for the ICE offered by a temporary HQ encounter.
 * This exposes effect kinds, not a preferred choice or a utility score.
 */
export function temporaryEncounterOptionFacts(
  state: GameState,
  iceId: CardInstanceId,
  definition: CardDefinition,
) {
  const instance = state.cardInstances[iceId];
  if (
    !state.run ||
    !instance ||
    instance.definitionId !== definition.id ||
    definition.type !== "ice" ||
    !state.corp.hq.includes(iceId)
  ) {
    throw new Error(
      "Temporary encounter facts require current run and own HQ ICE.",
    );
  }
  // Match the temporary encounter's zone and current-ICE binding. Existing
  // encounter additions belong to the ICE already passed, not the new one.
  const run = {
    ...state.run,
    phase: "encounter_ice" as const,
    encounteredIceId: iceId,
    noBreakSubroutinesActive:
      state.run.nextEncounterNoBreakSubroutines === true,
  };
  delete run.encounterAdditionalSubroutines;
  delete run.encounterTemporaryIceStrengthModifiers;
  delete run.encounterTemporaryTraceCredits;
  const projected: GameState = {
    ...state,
    run,
    corp: { ...state.corp, hq: state.corp.hq.filter((id) => id !== iceId) },
    specialZones: {
      setAside: [...(state.specialZones?.setAside ?? []), iceId],
      removedFromGame: [...(state.specialZones?.removedFromGame ?? [])],
    },
    cardInstances: {
      ...state.cardInstances,
      [iceId]: {
        ...instance,
        faceup: true,
        rezzed: false,
        zone: { side: "special", zone: "set_aside", visibility: "public" },
      },
    },
  };
  const implementation = cardImplementationForDefinitionId(definition.id);
  const facts = {
    temporaryEncounterSubroutineTypes: effectiveIceRunSubroutines(
      projected,
      iceId,
      definition,
    ).map((s) => s.type),
    // Non-printed mechanical families can contribute separate effects. They
    // must not be discarded merely because the printed subroutines are future-only.
    temporaryEncounterHasAdditionalMechanics:
      implementation === undefined ||
      Object.keys(implementation).some((key) => {
        if (key === "cardDefinitionId" || key === "printedSubroutines")
          return false;
        // Temporary HQ ICE is neither installed nor rezzed. These hooks
        // cannot contribute an effect to this encounter (e.g. rez income).
        if (key === "lifecycle")
          return Object.keys(implementation.lifecycle ?? {}).some(
            (timing) => timing !== "on_rez" && timing !== "on_install",
          );
        return true;
      }),
  };
  const binding = {
    stateVersion: state.stateVersion + 1,
    runId: state.run.runId,
    cardId: iceId,
    serverId: state.run.attackedServerId,
  };
  const unmodeled = (reason: string) => ({
    ...facts,
    temporaryEncounterBreakQuoteJson: JSON.stringify({
      ...binding,
      status: "unmodeled",
      reason,
    }),
  });
  // This comparison covers only equivalent pure ETR effects, not damage,
  // traces, lifecycle value or a guarantee against every possible run ability.
  if (
    facts.temporaryEncounterHasAdditionalMechanics ||
    facts.temporaryEncounterSubroutineTypes.length === 0 ||
    facts.temporaryEncounterSubroutineTypes.some(
      (type) => type !== "end_the_run",
    ) ||
    (run.encounterTaxForFutureIce ?? 0) > 0 ||
    (run.breakSubroutineAdditionalCost ?? 0) > 0 ||
    (run.nextEncounterFatalDamage ?? 0) > 0
  )
    return unmodeled("non_equivalent_or_conditional_encounter");
  const visible = visibleOwnCard(projected, iceId);
  const quote = visibleEffectiveEncounteredIceRunQuote(
    projected,
    iceId,
    visible,
  );
  if (
    !quote ||
    !Number.isSafeInteger(visible.strength) ||
    quote.conditionalEncounterEffects ||
    quote.encounterTemporaryTraceCredits
  )
    return unmodeled("effective_encounter_not_complete");
  const response = visibleRunnerBreakExchangeFacts(
    projected,
    iceId,
    visible,
    quote,
    quote.subroutines.length,
  );
  if (!response.complete) return unmodeled(response.reason);
  return {
    ...facts,
    temporaryEncounterBreakQuoteJson: JSON.stringify({
      ...binding,
      status: response.runnerBreakUnavailable
        ? "no_visible_breaker"
        : response.runnerBreak.canPayFromCurrentCredits
          ? "breakable"
          : "unaffordable",
      ...(response.runnerBreak
        ? { requiredCredits: response.runnerBreak.requiredCredits }
        : {}),
    }),
  };
}
