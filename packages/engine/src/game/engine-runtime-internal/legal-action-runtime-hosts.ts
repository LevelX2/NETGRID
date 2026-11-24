import { type CardInstanceId, type GameState, type LegalAction, type ServerId, type Side } from "@netgrid/shared";
import { corpRootRezCreditOutcomeQuotePayload, quoteCorpRootRezCreditOutcome, quoteCorpRootRezCost } from "../payment";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import { cardCounter } from "../state/turn-flags-counters";
import { buildLegalAction as action } from "../turn/action-builders";
import { delayedInstallPreparedTargetIds } from "../abilities/runner-special-trigger-execution";
import { buildRunnerDelayedInstallRemoveCounterAction } from "../turn/runner-special-zone-install-actions";
import { buildCorpTraceDamageAbilityActionsForCard, type CorpTraceDamageAbilityHost } from "../corp/trace-damage-abilities";
import { buildRunnerAccessStartCardImplementationActions } from "../run/card-implementation-run-actions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { pushActivatedCardImplementationActions, pushActivatedCardImplementationActionsForTiming } from "../../ability-engine/card-implementation-runtime";
import type { RuntimeDeps } from "./runtime-shared";

export function createLegalActionRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps = {} as RuntimeDeps,
): Pick<
  import("./action-runtime-port").ActionRuntimePort,
  | "corpRunnerActionPaidWindowActions"
  | "runnerRunSpecialEffectActions"
  | "specialZoneHarnessActions"
  | "hasHiddenResourceAccessStartActions"
  | "pushCorpTraceDamageOrCardImplementationActions"
> {
  function corpRunnerActionPaidWindowActions(state: GameState): LegalAction[] {
    const actions: LegalAction[] = [];
    for (const server of state.corp.servers) {
      for (const id of server.root) {
        const definition = definitionFor(state, id);
        const instance = mustInstance(state.cardInstances, id);
        if (
          (definition.type !== "asset" && definition.type !== "upgrade") ||
          instance.rezzed
        )
          continue;
        const rezQuote = quoteCorpRootRezCost(state, id);
        if (!rezQuote.canPay) continue;
        const rezAction = action(
          state,
          "corp",
          "rez_card",
          `${definition.title} in ${server.label} rezzen`,
          id,
          rezQuote.costs.map((cost) => ({ ...cost })),
          {
            ...rezQuote.publicPayload,
            runnerActionPaidWindowRez: true,
          },
        );
        const creditOutcomeQuote = quoteCorpRootRezCreditOutcome(
          state,
          id,
          rezAction.actionId,
          rezQuote.finalCredits,
        );
        if (creditOutcomeQuote) {
          rezAction.payload = {
            ...(rezAction.payload ?? {}),
            ...corpRootRezCreditOutcomeQuotePayload(creditOutcomeQuote),
          };
        }
        actions.push(rezAction);
      }
      for (const id of server.root) {
        const definition = definitionFor(state, id);
        const instance = mustInstance(state.cardInstances, id);
        if (
          (definition.type !== "asset" && definition.type !== "upgrade") ||
          !instance.rezzed
        )
          continue;
        pushActivatedCardImplementationActionsForTiming(
          deps.cardImplementationRuntimeDeps,
          state,
          actions,
          "corp",
          id,
          definition,
          "corp_paid",
        );
      }
    }
    return actions;
  }

  function runnerRunSpecialEffectActions(state: GameState): LegalAction[] {
    if (
      !state.run ||
      state.activeSide !== "runner" ||
      (state.timingPoint !== "run.encounter_ice" &&
        state.timingPoint !== "run.jack_out_window") ||
      state.runner.credits < 1
    )
      return [];
    const actions: LegalAction[] = [];
    const targets = delayedInstallPreparedTargetIds(
      deps.runnerSpecialTriggerExecutionHost(state),
    );
    for (const sourceCardId of state.runner.rig.resources.slice().sort()) {
      const sourceDefinition = definitionFor(state, sourceCardId);
      if (
        cardImplementationForDefinitionId(sourceDefinition.id)
          ?.hiddenReplacementLongtail?.kind !==
        "delayed_install_with_counter_countdown"
      )
        continue;
      for (const targetCardId of targets) {
        actions.push(
          buildRunnerDelayedInstallRemoveCounterAction(state, {
            sourceCardId,
            sourceTitle: sourceDefinition.title,
            sourceDefinitionId: sourceDefinition.id,
            targetCardId,
            targetDefinitionId: definitionFor(state, targetCardId).id,
            remainingCountersBefore: cardCounter(state, targetCardId, "shell"),
          }),
        );
      }
    }
    return actions;
  }

  function specialZoneHarnessActions(
    state: GameState,
    side: Side,
  ): LegalAction[] {
    const harness = state.specialZoneHarness;
    if (
      !harness ||
      harness.actor !== side ||
      !state.cardInstances[harness.cardInstanceId]
    )
      return [];
    const cardId = harness.cardInstanceId;
    const instance = mustInstance(state.cardInstances, cardId);
    const actions: LegalAction[] = [];
    if (harness.setAside && instance.zone.side !== "special") {
      actions.push(
        action(
          state,
          side,
          "move_to_set_aside",
          "Karte testweise set-aside legen",
          "game_rule",
          [],
          {
            cardId,
            specialZone: "set_aside",
            specialZoneVisibility: harness.setAside.visibility,
            ...(harness.setAside.visibilitySide
              ? { specialZoneVisibilitySide: harness.setAside.visibilitySide }
              : {}),
            specialZoneReason: harness.setAside.reason ?? "v1.2.2_test_harness",
          },
          {
            targetRequirements: [
              { id: "card", kind: "card", visibility: "engine_only" },
            ],
          },
        ),
      );
    }
    if (harness.removedFromGame && instance.zone.side !== "special") {
      actions.push(
        action(
          state,
          side,
          "move_to_removed_from_game",
          "Karte testweise aus dem Spiel entfernen",
          "game_rule",
          [],
          {
            cardId,
            specialZone: "removed_from_game",
            specialZoneVisibility: harness.removedFromGame.visibility,
            ...(harness.removedFromGame.visibilitySide
              ? {
                  specialZoneVisibilitySide:
                    harness.removedFromGame.visibilitySide,
                }
              : {}),
            specialZoneReason:
              harness.removedFromGame.reason ?? "v1.2.2_test_harness",
          },
          {
            targetRequirements: [
              { id: "card", kind: "card", visibility: "engine_only" },
            ],
          },
        ),
      );
    }
    if (
      harness.setAside?.allowReturn &&
      instance.zone.side === "special" &&
      instance.zone.zone === "set_aside"
    ) {
      actions.push(
        action(
          state,
          side,
          "return_from_set_aside",
          "Karte testweise aus Set Aside zurückholen",
          "game_rule",
          [],
          {
            cardId,
            specialZone: "set_aside",
            specialZoneReason:
              harness.setAside.reason ?? "v1.2.2_test_harness_return",
          },
          {
            targetRequirements: [
              {
                id: "card",
                kind: "card",
                zoneScope: ["special.set_aside"],
                visibility: "engine_only",
              },
            ],
          },
        ),
      );
    }
    if (
      harness.controlChange &&
      instance.controller !== harness.controlChange.newController
    ) {
      actions.push(
        action(
          state,
          side,
          "change_card_control",
          "Kartenkontrolle testweise wechseln",
          "game_rule",
          [],
          {
            cardId,
            oldController: instance.controller,
            newController: harness.controlChange.newController,
            controlChangeVisibility:
              harness.controlChange.visibility ?? "public",
            controlChangeReason:
              harness.controlChange.reason ?? "v1.2.2_test_harness",
          },
          {
            targetRequirements: [
              { id: "card", kind: "card", visibility: "engine_only" },
              {
                id: "controller",
                kind: "side",
                allowedSides: ["corp", "runner"],
              },
            ],
          },
        ),
      );
    }
    return actions;
  }

  function hasHiddenResourceAccessStartActions(
    state: GameState,
    run: NonNullable<GameState["run"]>,
    serverId: Exclude<ServerId, "new_remote">,
  ): boolean {
    if (run.breach || run.hiddenRunnerResourceAccessStartServerId) return false;
    const previous = run.hiddenRunnerResourceAccessStartServerId;
    run.hiddenRunnerResourceAccessStartServerId = serverId;
    try {
      return (
        buildRunnerAccessStartCardImplementationActions(
          deps.runCardImplementationActionHost(state),
        ).legalActions.length > 1
      );
    } finally {
      if (previous) run.hiddenRunnerResourceAccessStartServerId = previous;
      else delete run.hiddenRunnerResourceAccessStartServerId;
    }
  }

  function pushCorpTraceDamageOrCardImplementationActions(
    state: GameState,
    actions: LegalAction[],
    cardId: CardInstanceId,
    host: CorpTraceDamageAbilityHost = runtime.corpTraceDamageAbilityHost(
      state,
    ),
  ): void {
    const traceDamageActions = buildCorpTraceDamageAbilityActionsForCard(
      host,
      cardId,
    );
    if (traceDamageActions.handled) {
      actions.push(...traceDamageActions.actions);
      return;
    }
    pushActivatedCardImplementationActions(
      deps.cardImplementationRuntimeDeps,
      state,
      actions,
      "corp",
      cardId,
      definitionFor(state, cardId),
    );
  }

  return {
    corpRunnerActionPaidWindowActions,
    runnerRunSpecialEffectActions,
    specialZoneHarnessActions,
    hasHiddenResourceAccessStartActions,
    pushCorpTraceDamageOrCardImplementationActions,
  };
}
