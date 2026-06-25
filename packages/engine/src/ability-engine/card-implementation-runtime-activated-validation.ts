import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime-dependency-types";
import {
  canPayActivatedCardImplementationCosts,
  validateActivatedAbilityCosts,
} from "./card-implementation-runtime-activated-costs";
import {
  copySameFortIceSubroutineEffect,
  exposeInstalledCardEffect,
  ownRezzedIceTargetIds,
  sameFortSubroutineTargetForLegalAction,
  trashOwnRezzedIceForCreditsEffect,
} from "./card-implementation-runtime-activated-targets";
import { assertActivatedCardImplementationAbilityCanResolve } from "./card-implementation-runtime-legality";
import type { ActivatedCardAbilityImplementation } from "./definition-types";

export function corpActivatedCardImplementationSourceIsAvailable(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): boolean {
  if (definition.type === "agenda")
    return state.corp.scoreArea.includes(cardId);
  return deps.rezzedCorpRootCardIds(state).includes(cardId);
}

export function activatedAbilityForLegalAction(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
):
  | {
      cardId: CardInstanceId;
      definition: CardDefinition;
      ability: ActivatedCardAbilityImplementation;
      abilityIndex: number;
    }
  | undefined {
  if (legalAction.payload?.cardImplementationAbility !== "activated")
    return undefined;
  const cardId = legalAction.payload.cardId;
  if (typeof cardId !== "string" || !state.cardInstances[cardId])
    throw new Error(
      "Die aktivierte Kartenfaehigkeit hat keine gueltige Quelle.",
    );
  const definition = deps.definitionFor(state, cardId);
  const abilityIndex = Number(
    legalAction.payload.cardImplementationAbilityIndex,
  );
  if (!Number.isInteger(abilityIndex) || abilityIndex < 0)
    throw new Error(
      "Die aktivierte Kartenfaehigkeit hat keinen gueltigen Index.",
    );
  const ability = cardImplementationForDefinitionId(definition.id)?.abilities?.[
    abilityIndex
  ];
  if (!ability || ability.kind !== "activated")
    throw new Error("Die aktivierte Kartenfaehigkeit passt nicht zur Karte.");
  return { cardId, definition, ability, abilityIndex };
}

export function validateActivatedCardImplementationAbility(
  deps: CardImplementationRuntimeDependencies,
  state: GameState,
  legalAction: LegalAction,
  match: {
    cardId: CardInstanceId;
    definition: CardDefinition;
    ability: ActivatedCardAbilityImplementation;
    abilityIndex: number;
  },
): void {
  const { cardId, ability } = match;
  if (
    deps.mustInstance(state.cardInstances, cardId).controller !==
    legalAction.side
  )
    throw new Error(
      "Diese aktivierte Kartenfaehigkeit gehoert der anderen Seite.",
    );
  validateActivatedAbilityCosts(ability, legalAction);
  if (
    !canPayActivatedCardImplementationCosts(
      state,
      legalAction.side,
      cardId,
      ability,
    )
  )
    throw new Error(
      "Die aktivierte Kartenfaehigkeit kann nicht bezahlt werden.",
    );
  if (
    legalAction.payload?.cardImplementationAbilityTiming !== ability.timing ||
    legalAction.payload?.cardImplementationAbilityIndex !== match.abilityIndex
  )
    throw new Error("Die aktivierte Kartenfaehigkeit passt nicht zum Profil.");
  if (ability.timing === "runner_main") {
    if (legalAction.side !== "runner")
      throw new Error(
        "Nur der Runner darf diese aktivierte Kartenfaehigkeit nutzen.",
      );
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error(
        "Diese aktivierte Kartenfaehigkeit ist nur in der Runner-Aktionsphase nutzbar.",
      );
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error(
        "Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.",
      );
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    const exposeEffect = exposeInstalledCardEffect(ability);
    if (exposeEffect) {
      const targetCardId = String(
        legalAction.payload?.cardImplementationExposeTargetId ?? "",
      );
      if (
        targetCardId &&
        !deps
          .exposeInstalledCorpCardTargets(state, exposeEffect.scope)
          .includes(targetCardId)
      )
        throw new Error("Die zu exposende Korp-Karte ist nicht mehr gueltig.");
    }
    return;
  }
  if (ability.timing === "during_run") {
    if (legalAction.side !== "runner")
      throw new Error(
        "Nur der Runner darf diese aktivierte Kartenfaehigkeit nutzen.",
      );
    if (!state.run)
      throw new Error(
        "Diese aktivierte Kartenfaehigkeit ist nur waehrend eines Runs nutzbar.",
      );
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error(
        "Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.",
      );
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "runner_cost_penalty_support") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Kosten-/Penalty-Support nutzen.");
    if (!state.runnerCostPenaltySupportWindow)
      throw new Error("Es ist kein Kosten-/Penalty-Support-Fenster offen.");
    if (
      legalAction.payload?.costPenaltySupportWindowId !==
        state.runnerCostPenaltySupportWindow.windowId ||
      legalAction.payload?.costPenaltySupportOriginalActionId !==
        state.runnerCostPenaltySupportWindow.originalActionId ||
      legalAction.payload?.costPenaltySupportAmountDue !==
        state.runnerCostPenaltySupportWindow.amountDue ||
      legalAction.payload?.costPenaltySupportKind !==
        state.runnerCostPenaltySupportWindow.kind
    )
      throw new Error("Das Kosten-/Penalty-Support-Fenster passt nicht mehr.");
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error(
        "Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.",
      );
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "access_start") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Access-Start-Faehigkeiten nutzen.");
    if (!state.run?.hiddenRunnerResourceAccessStartServerId || state.run.breach)
      throw new Error("Es ist kein Access-Start-Fenster offen.");
    if (!deps.runnerInstalledCardIds(state).includes(cardId))
      throw new Error(
        "Die aktivierte Runner-Kartenfaehigkeit ist nicht installiert.",
      );
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "corp_encounter") {
    if (legalAction.side !== "corp")
      throw new Error(
        "Nur die Korp darf diese Encounter-Kartenfaehigkeit nutzen.",
      );
    if (
      state.timingPoint !== "run.encounter_ice" ||
      state.run?.phase !== "encounter_ice" ||
      state.run.encounteredIceId !== cardId
    )
      throw new Error(
        "Diese Kartenfaehigkeit ist nur beim Encounter mit dieser ICE nutzbar.",
      );
    const instance = deps.mustInstance(state.cardInstances, cardId);
    if (!instance.rezzed || match.definition.type !== "ice")
      throw new Error("Die Encounter-Kartenfaehigkeit braucht gerezzte ICE.");
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "corp_during_run") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Run-Kartenfaehigkeit nutzen.");
    if (!state.run)
      throw new Error(
        "Diese Kartenfaehigkeit ist nur waehrend eines Runs nutzbar.",
      );
    if (
      !corpActivatedCardImplementationSourceIsAvailable(
        deps,
        state,
        cardId,
        match.definition,
      )
    )
      throw new Error(
        "Die aktivierte Korp-Kartenfaehigkeit ist nicht verfuegbar.",
      );
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (ability.timing === "corp_trace_window") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Trace-Kartenfaehigkeit nutzen.");
    if (!state.trace)
      throw new Error(
        "Diese Kartenfaehigkeit ist nur waehrend eines Trace nutzbar.",
      );
    if (
      !corpActivatedCardImplementationSourceIsAvailable(
        deps,
        state,
        cardId,
        match.definition,
      )
    )
      throw new Error(
        "Die aktivierte Korp-Kartenfaehigkeit ist nicht verfuegbar.",
      );
    assertActivatedCardImplementationAbilityCanResolve(
      deps,
      state,
      ability,
      cardId,
    );
    return;
  }
  if (legalAction.side !== "corp")
    throw new Error(
      "Nur die Korp darf diese aktivierte Kartenfaehigkeit nutzen.",
    );
  if (state.phase !== "corp_action_phase" || state.activeSide !== "corp")
    throw new Error(
      "Diese aktivierte Kartenfaehigkeit ist nur in der Korp-Aktionsphase nutzbar.",
    );
  if (
    !corpActivatedCardImplementationSourceIsAvailable(
      deps,
      state,
      cardId,
      match.definition,
    )
  )
    throw new Error(
      "Die aktivierte Korp-Kartenfaehigkeit ist nicht verfuegbar.",
    );
  assertActivatedCardImplementationAbilityCanResolve(
    deps,
    state,
    ability,
    cardId,
  );
  const trashRezzedIceEffect = trashOwnRezzedIceForCreditsEffect(ability);
  if (trashRezzedIceEffect) {
    const targetCardId = String(legalAction.payload?.targetCardId ?? "");
    if (!ownRezzedIceTargetIds(state).includes(targetCardId as CardInstanceId))
      throw new Error("Das zu trashende ICE ist nicht mehr gueltig.");
  }
  const copySubroutineEffect = copySameFortIceSubroutineEffect(ability);
  if (copySubroutineEffect) {
    const target = sameFortSubroutineTargetForLegalAction(
      deps,
      state,
      cardId,
      legalAction,
    );
    if (!target) throw new Error("Die Ziel-Subroutine ist nicht mehr gueltig.");
  }
}
