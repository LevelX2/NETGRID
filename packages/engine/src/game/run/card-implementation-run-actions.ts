import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type { ActivatedCardAbilityImplementation } from "../../ability-engine/definition-types";

export type RunCardImplementationActionHost = {
  state: GameState;
  cards: {
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance | undefined;
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    runnerInstalledCardIds: () => CardInstanceId[];
  };
  runtime: {
    pushActivatedActionsForTiming: (
      actions: LegalAction[],
      side: Side,
      sourceCardId: CardInstanceId,
      definition: CardDefinition,
      timing: ActivatedCardAbilityImplementation["timing"],
    ) => void;
  };
};

export type RunCardImplementationActionBuildResult = {
  handled: boolean;
  legalActions: LegalAction[];
};

export function buildRunnerDuringRunCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  if (!host.state.run) return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  for (const cardId of host.cards.runnerInstalledCardIds().slice().sort()) {
    const definition = host.cards.definitionFor(cardId);
    host.runtime.pushActivatedActionsForTiming(
      legalActions,
      "runner",
      cardId,
      definition,
      "during_run",
    );
  }
  return { handled: true, legalActions };
}

export function buildCorpEncounterCardImplementationActions(
  host: RunCardImplementationActionHost,
): RunCardImplementationActionBuildResult {
  const run = host.state.run;
  if (
    host.state.timingPoint !== "run.encounter_ice" ||
    run?.phase !== "encounter_ice" ||
    !run.encounteredIceId
  )
    return { handled: true, legalActions: [] };
  const instance = host.cards.cardInstanceFor(run.encounteredIceId);
  if (!instance?.rezzed || instance.controller !== "corp")
    return { handled: true, legalActions: [] };
  const legalActions: LegalAction[] = [];
  host.runtime.pushActivatedActionsForTiming(
    legalActions,
    "corp",
    run.encounteredIceId,
    host.cards.definitionFor(run.encounteredIceId),
    "corp_encounter",
  );
  return { handled: true, legalActions };
}
