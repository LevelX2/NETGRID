import {
  type CardDefinitionId,
  type CardInstanceId,
  type CorpDrawContinuation,
  type GameState,
  type LegalAction,
  type PurgeableRunnerVirusCounterType,
  type ResolvedGameEffect,
} from "@netgrid/shared";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import { drawCorpCards, rollDeterministicDie } from "../state/draw-random";
import { credits } from "../state/economy-mutation";
import {
  abilityUsageSourceUsed,
  clearAbilityUsageSourceIds,
  markAbilityUsageSourceUsed,
} from "../../ability-engine/card-implementation-ability-limits";
import {
  addCardCounter,
  cardCounter,
  ensureCorpTurnFlags,
  ensureRunnerTurnFlags,
  setCardCounter,
  spendCardCounter,
} from "../state/turn-flags-counters";
import { removeFromAllZones } from "../state/zone-mutation";
import {
  addCorpActionDebt,
  purgeableRunnerVirusCounterAmount,
} from "../turn/turn-basic-execution";
import { addRunnerTagsWithPrevention } from "../damage/damage-core";
import { startScoredAgendaStartDrawChoice } from "../corp/scored-agenda-flow";
import {
  clearActivityGatedFortRunMarkers,
  isFortTraceBitPoolSource,
  fortTraceBitPoolCapacityForCard,
} from "../run/fort-run-side-families";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import {
  executeCardImplementationLifecycleEffects,
  executeCardImplementationStartOfCorpTurnEffects,
  hasDueCardImplementationStartOfCorpTurnAbility,
} from "../../ability-engine/card-implementation-runtime";
import { cardImplementationStartOfCorpTurnAbilities } from "../../ability-engine/card-implementation-runtime-lifecycle-start";
import { selectedChoiceIds } from "../choices/choice-validation";
import type { AutomaticEffectCollector, RuntimeDeps } from "./runtime-shared";
import {
  applyFutureExtraActionGrantsAtTurnStart,
  currentTurnSerial,
  ensureActionEconomy,
  expireTurnBoundExtraActionGrants,
  restrictedActionFamilyForRandomActionRoll,
} from "./turn-action-economy-runtime";

type TurnRuntimePort = import("./turn-runtime-port").TurnRuntimePort;
type TurnCorpStartRuntimeResolvers = Pick<
  TurnRuntimePort,
  | "resolvePdcaCounterAction"
  | "resolveCorpMandatoryDraw"
  | "resumeCorpMandatoryDrawAfterChoice"
  | "startCorpTurn"
  | "applyInstalledIceCounterLifecycle"
  | "applyCorpStartOfTurnEffects"
  | "resolveCorpStartOfTurnOrderChoice"
  | "resolveCorpStartOfTurnRezChoice"
  | "resumeCorpStartOfTurnOrdering"
  | "applyPurgeableRunnerVirusCorpStartEffects"
  | "openCorpStartTurnRestrictedActionOffers"
  | "virusCounterDrawsAtCorpStart"
  | "skivvissCounterTotal"
  | "virusCounterCascadeTrashAtCorpStart"
  | "trashTopRdCardsFaceupForCascade"
>;

type CorpMandatoryDrawSummary = {
  mandatoryCardCount: 1;
  mandatoryAgendaSources: Array<{
    cardId: CardInstanceId;
    definitionId: CardDefinitionId;
    count: number;
  }>;
  optionalAgendaSources: Array<{
    cardId: CardInstanceId;
    definitionId: CardDefinitionId;
    count: number;
  }>;
  skivvissCardCount: number;
  additionalCardCount: number;
  totalBaseDrawCount: number;
  additionalSourceDefinitionIds: CardDefinitionId[];
};

/**
 * Owns Corp turn-start sequencing and Corp-side recurring effects.
 * Cross-domain links are read only when a resolver runs, after the aggregate
 * turn runtime has been composed.
 */
export function createTurnCorpStartRuntimeResolvers(
  deps: RuntimeDeps,
  links: TurnRuntimePort,
): TurnCorpStartRuntimeResolvers {
  function applyScoredAgendaActionEconomyAtCorpStart(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    for (const cardId of state.corp.scoreArea.slice().sort()) {
      const definition = definitionFor(state, cardId);
      const implementation =
        deps.scoredAgendaImplementationForDefinition(definition);
      if (implementation?.kind !== "overadvance_start_of_corp_turn_actions")
        continue;
      const amount = cardCounter(state, cardId, "mark");
      if (amount <= 0) continue;
      state.corp.clicks += amount;
      effects?.push({
        effectId: `corp.start.scored_agenda.action.${cardId}`,
        kind: "gain_actions",
        visibility: "public",
        side: "corp",
        amount,
        reason: "start_of_turn",
        sourceDefinitionId: definition.id,
        sourceTitle: links.publicCardTitle(definition.id),
      });
    }
  }

  function applyScoredAgendaCreditEconomyAtCorpStart(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    for (const cardId of state.corp.scoreArea.slice().sort()) {
      const definition = definitionFor(state, cardId);
      const implementation =
        deps.scoredAgendaImplementationForDefinition(definition);
      if (implementation?.kind !== "overadvance_start_of_corp_turn_credits")
        continue;
      const amount = cardCounter(state, cardId, "mark");
      if (amount <= 0) continue;
      credits(state, "corp", amount, {
        kind: "turn_effect",
        sourceDefinitionId: definition.id,
        sourceCardId: cardId,
        reason: "scored_agenda_start_of_corp_turn",
      });
      effects?.push(
        links.automaticGainCreditsEffect(
          `corp.start.scored_agenda.credit.${cardId}`,
          "corp",
          amount,
          definition.id,
        ),
      );
    }
  }

  function corpMandatoryDrawSummary(
    state: GameState,
  ): CorpMandatoryDrawSummary {
    const mandatoryAgendaSources: CorpMandatoryDrawSummary["mandatoryAgendaSources"] =
      [];
    for (const cardId of state.corp.scoreArea.slice().sort()) {
      const definition = definitionFor(state, cardId);
      const implementation =
        deps.scoredAgendaImplementationForDefinition(definition);
      if (implementation?.kind !== "corp_start_turn_mandatory_draw") continue;
      mandatoryAgendaSources.push({
        cardId,
        definitionId: definition.id,
        count: implementation.drawCount,
      });
    }
    const selectedOptionalIds = new Set(
      ensureCorpTurnFlags(state).scoredAgendaStartDrawChoiceSelectedSourceIds ??
        [],
    );
    const optionalAgendaSources: CorpMandatoryDrawSummary["optionalAgendaSources"] =
      [];
    for (const cardId of state.corp.scoreArea.slice().sort()) {
      if (!selectedOptionalIds.has(cardId)) continue;
      const definition = definitionFor(state, cardId);
      const implementation =
        deps.scoredAgendaImplementationForDefinition(definition);
      if (implementation?.kind !== "corp_start_turn_optional_draw")
        throw new Error("Die gewählte Start-Draw-Quelle ist veraltet.");
      optionalAgendaSources.push({
        cardId,
        definitionId: definition.id,
        count: implementation.drawCount,
      });
    }
    const skivvissCardCount = virusCounterDrawsAtCorpStart(state);
    const mandatoryAgendaCardCount = mandatoryAgendaSources.reduce(
      (sum, source) => sum + source.count,
      0,
    );
    const optionalAgendaCardCount = optionalAgendaSources.reduce(
      (sum, source) => sum + source.count,
      0,
    );
    const additionalCardCount =
      mandatoryAgendaCardCount + optionalAgendaCardCount + skivvissCardCount;
    return {
      mandatoryCardCount: 1,
      mandatoryAgendaSources,
      optionalAgendaSources,
      skivvissCardCount,
      additionalCardCount,
      totalBaseDrawCount: 1 + additionalCardCount,
      additionalSourceDefinitionIds: [
        ...mandatoryAgendaSources.map((source) => source.definitionId),
        ...optionalAgendaSources.map((source) => source.definitionId),
        ...(skivvissCardCount > 0
          ? [
              uniqueVirusCounterOwnerDefinitionId(
                "draw_extra_cards_per_counter",
              ),
            ]
          : []),
      ],
    };
  }

  function mandatoryDrawContinuation(
    summary: CorpMandatoryDrawSummary,
  ): Extract<CorpDrawContinuation, { kind: "corp_mandatory_draw" }> {
    return {
      kind: "corp_mandatory_draw",
      mandatoryCardCount: 1,
      additionalCardCount: summary.additionalCardCount,
      totalBaseDrawCount: summary.totalBaseDrawCount,
      mandatoryAgendaCardCount: summary.mandatoryAgendaSources.reduce(
        (sum, source) => sum + source.count,
        0,
      ),
      optionalAgendaCardCount: summary.optionalAgendaSources.reduce(
        (sum, source) => sum + source.count,
        0,
      ),
      skivvissCardCount: summary.skivvissCardCount,
      additionalSourceDefinitionIds: summary.additionalSourceDefinitionIds,
    };
  }

  function applyMandatoryDrawPayload(
    legalAction: LegalAction,
    continuation: Extract<
      CorpDrawContinuation,
      { kind: "corp_mandatory_draw" }
    >,
  ): void {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      corpMandatoryDraw: true,
      corpMandatoryCardCount: continuation.mandatoryCardCount,
      corpMandatoryAdditionalCardCount: continuation.additionalCardCount,
      corpMandatoryTotalBaseDrawCount: continuation.totalBaseDrawCount,
      corpMandatoryAgendaCardCount: continuation.mandatoryAgendaCardCount,
      corpMandatoryOptionalAgendaCardCount:
        continuation.optionalAgendaCardCount,
      corpMandatorySkivvissCardCount: continuation.skivvissCardCount,
      corpMandatoryAdditionalSourceCount:
        continuation.additionalSourceDefinitionIds.length,
      corpMandatoryAdditionalSourceDefinitionIds:
        continuation.additionalSourceDefinitionIds.join(","),
      drawnCards: continuation.totalBaseDrawCount,
    };
  }

  function completeCorpMandatoryDraw(state: GameState): void {
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.activeSide = "corp";
  }

  function resolveCorpMandatoryDraw(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (
      state.phase !== "corp_draw_phase" ||
      state.timingPoint !== "corp_draw.mandatory_draw" ||
      state.activeSide !== "corp"
    )
      throw new Error("Der Korp-Pflichtzug ist jetzt nicht zulässig.");
    const summary = corpMandatoryDrawSummary(state);
    const continuation = mandatoryDrawContinuation(summary);
    const effects: ResolvedGameEffect[] = [
      ...summary.mandatoryAgendaSources.map((source) =>
        links.automaticDrawCardsEffect(
          `corp.start.scored_agenda.mandatory_draw.${source.cardId}`,
          "corp",
          source.count,
          source.definitionId,
        ),
      ),
      ...summary.optionalAgendaSources.map((source) =>
        links.automaticDrawCardsEffect(
          `corp.start.scored_agenda.optional_draw.${source.cardId}`,
          "corp",
          source.count,
          source.definitionId,
        ),
      ),
      ...(summary.skivvissCardCount > 0
        ? [
            links.automaticDrawCardsEffect(
              "corp.start.skivviss",
              "corp",
              summary.skivvissCardCount,
              uniqueVirusCounterOwnerDefinitionId(
                "draw_extra_cards_per_counter",
              ),
            ),
          ]
        : []),
    ];
    applyMandatoryDrawPayload(legalAction, continuation);
    links.appendResolvedEffectsToPayload(legalAction, effects);
    drawCorpCards(state, summary.totalBaseDrawCount, continuation);
    if (state.winner || state.pendingCorpDraw) return;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      corpMandatoryDrawCompleted: true,
    };
    completeCorpMandatoryDraw(state);
  }

  function resumeCorpMandatoryDrawAfterChoice(
    state: GameState,
    legalAction: LegalAction,
    continuation: Extract<
      CorpDrawContinuation,
      { kind: "corp_mandatory_draw" }
    >,
  ): void {
    if (
      state.pendingChoice ||
      state.pendingCorpDraw ||
      state.phase !== "corp_draw_phase" ||
      state.timingPoint !== "corp_draw.mandatory_draw"
    )
      throw new Error("Der Korp-Pflichtzug ist noch nicht abgeschlossen.");
    applyMandatoryDrawPayload(legalAction, continuation);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      corpMandatoryDrawCompleted: true,
    };
    completeCorpMandatoryDraw(state);
  }

  function resolvePdcaCounterAction(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf PDCA-Counter nutzen.");
    if (state.phase !== "corp_action_phase" || state.activeSide !== "corp")
      throw new Error("PDCA-Counter sind nur im Korp-Zug nutzbar.");
    const sourceId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.corp.scoreArea.includes(sourceId))
      throw new Error("PDCA-Counter-Quelle ist nicht gescort.");
    const definition = definitionFor(state, sourceId);
    if (
      deps.scoredAgendaImplementationForDefinition(definition)?.kind !==
      "corp_damage_replacement_pdca_action_counter"
    )
      throw new Error("Die PDCA-Fähigkeit passt nicht zur Quelle.");
    const flags = ensureCorpTurnFlags(state);
    if (abilityUsageSourceUsed(flags.pdcaUsedSourceIdsThisTurn, sourceId))
      throw new Error("Diese PDCA-Fähigkeit wurde diesen Zug bereits genutzt.");
    if (cardCounter(state, sourceId, "pdca") <= 0)
      throw new Error("Es ist kein PDCA-Counter vorhanden.");
    spendCardCounter(state, sourceId, "pdca", 1);
    flags.pdcaUsedSourceIdsThisTurn = markAbilityUsageSourceUsed(
      flags.pdcaUsedSourceIdsThisTurn,
      sourceId,
    );
    state.corp.clicks += 1;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      gainedActions: 1,
      removedCounterAmount: 1,
      remainingCounters: cardCounter(state, sourceId, "pdca"),
      corpClicksAfter: state.corp.clicks,
    };
  }

  function startCorpTurn(
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
  ): void {
    expireTurnBoundExtraActionGrants(state);
    state.turnSerial = currentTurnSerial(state) + 1;
    state.activeSide = "corp";
    state.phase = "corp_draw_phase";
    state.timingPoint = "corp_draw.mandatory_draw";
    state.corp.clicks = 3;
    state.runner.clicks = 0;
    deps.clearValuPakProgramInstallFlags(state);
    clearActivityGatedFortRunMarkers(
      deps.fortRunSideFamiliesHostForState(state),
    );
    ensureRunnerTurnFlags(state).damagePreventionUsage = {};
    ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = false;
    ensureRunnerTurnFlags(state).corpRezzedIceThisTurn = 0;
    ensureCorpTurnFlags(state).counterPreventionUsedSourceIdsThisTurn =
      clearAbilityUsageSourceIds();
    ensureCorpTurnFlags(state).scoredAgendaStartDrawChoiceResolvedSourceIds =
      [];
    ensureCorpTurnFlags(state).scoredAgendaStartDrawChoiceSelectedSourceIds =
      [];
    ensureCorpTurnFlags(state).corpStartOfTurnResolvedSourceIds = [];
    ensureCorpTurnFlags(state).pdcaUsedSourceIdsThisTurn =
      clearAbilityUsageSourceIds();
    applyFutureExtraActionGrantsAtTurnStart(state, "corp", effects);
    applyScoredAgendaCreditEconomyAtCorpStart(state, effects);
    applyScoredAgendaActionEconomyAtCorpStart(state, effects);
    applyInstalledIceCounterLifecycle(state);
    if (openCorpStartOfTurnRezChoice(state)) return;
    continueCorpStartAfterRezWindow(state, effects, legalAction);
  }

  function continueCorpStartAfterRezWindow(
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
  ): void {
    if (applyCorpStartOfTurnEffects(state, effects, legalAction)) return;
    openCorpStartTurnRestrictedActionOffers(state, effects);
  }

  function affordableUnrezzedCorpStartSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return state.corp.servers
      .flatMap((server) => server.root)
      .filter((cardId) => {
        const instance = state.cardInstances[cardId];
        if (!instance || instance.rezzed) return false;
        const definition = definitionFor(state, cardId);
        return (
          cardImplementationForDefinitionId(definition.id)?.lifecycle
            ?.can_rez_at_start_of_corp_turn === true &&
          cardImplementationStartOfCorpTurnAbilities(definition).length > 0 &&
          state.corp.credits >= deps.rezCostForCard(state, cardId)
        );
      })
      .sort();
  }

  function openCorpStartOfTurnRezChoice(state: GameState): boolean {
    const sourceIds = affordableUnrezzedCorpStartSourceIds(state);
    if (sourceIds.length === 0) return false;
    const nextStateVersion = state.stateVersion + 1;
    state.pendingChoice = {
      choiceId: `corp_start_rez_${nextStateVersion}`,
      side: "corp",
      source: `corp_start.rez:${nextStateVersion}`,
      prompt: "Karte am Beginn des Zuges rezzen?",
      presentationKey: "corp_start_rez",
      kind: "select_option",
      options: [
        ...sourceIds.map((sourceId) => ({
          id: `rez_${sourceId}`,
          label: `${definitionFor(state, sourceId).title} für ${deps.rezCostForCard(state, sourceId)} Credits rezzen`,
          value: sourceId,
          metadata: {
            cardTitle: definitionFor(state, sourceId).title,
            creditCost: deps.rezCostForCard(state, sourceId),
          },
        })),
        { id: "pass", label: "Nicht rezzen", value: "pass" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: nextStateVersion,
      visibility: "hidden_info_barrier",
    };
    return true;
  }

  function resolveCorpStartOfTurnRezChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: import("@netgrid/shared").PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice?.source.startsWith("corp_start.rez:"))
      throw new Error("Es ist kein Rezfenster am Korp-Zugbeginn offen.");
    if (legalAction.side !== "corp" || playerAction.side !== "corp")
      throw new Error("Nur die Korp darf am eigenen Zugbeginn rezzen.");
    const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0];
    if (!choice.options.some((option) => option.id === selectedId))
      throw new Error("Die Rez-Auswahl am Korp-Zugbeginn ist ungültig.");
    delete state.pendingChoice;
    if (selectedId === "pass") {
      continueCorpStartAfterRezWindow(state, undefined, legalAction);
      return;
    }
    const sourceId = selectedId?.startsWith("rez_")
      ? (selectedId.slice("rez_".length) as CardInstanceId)
      : undefined;
    if (
      !sourceId ||
      !affordableUnrezzedCorpStartSourceIds(state).includes(sourceId)
    )
      throw new Error(
        "Die gewählte Startzugquelle kann nicht mehr gerezzt werden.",
      );
    const instance = mustInstance(state.cardInstances, sourceId);
    const definition = definitionFor(state, sourceId);
    const rezCost = deps.rezCostForCard(state, sourceId);
    deps.spendCredits(state, "corp", rezCost);
    state.cardInstances[sourceId] = {
      ...instance,
      faceup: true,
      rezzed: true,
    };
    executeCardImplementationLifecycleEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      sourceId,
      "on_rez",
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definition.id,
      rezCostPaid: rezCost,
      corpCreditsAfter: state.corp.credits,
    };
    if (!openCorpStartOfTurnRezChoice(state))
      continueCorpStartAfterRezWindow(state, undefined, legalAction);
  }

  function applyInstalledIceCounterLifecycle(state: GameState): void {
    for (const server of state.corp.servers) {
      for (const iceId of server.ice.slice().sort()) {
        const instance = state.cardInstances[iceId];
        if (!instance || instance.controller !== "corp") continue;
        const kludge = cardCounter(state, iceId, "kludge");
        if (kludge > 0) {
          const remaining = kludge - 1;
          setCardCounter(state, iceId, "kludge", remaining);
          if (remaining <= 0)
            deps.trashCorpInstalledCardToArchives(state, iceId);
        }
        const term = cardCounter(state, iceId, "term");
        if (term > 0) {
          if (state.corp.credits >= 2) {
            state.corp.credits -= 2;
            setCardCounter(state, iceId, "term", term - 1);
          } else {
            addCardCounter(state, iceId, "term", 1);
          }
        }
      }
    }
  }

  function applyCorpStartOfTurnEffects(
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
    rootCardStartIndex = 0,
    skipPreamble = false,
  ): boolean {
    if (!skipPreamble) {
      applyPurgeableRunnerVirusCorpStartEffects(state, effects);
      const cascadeTrash = virusCounterCascadeTrashAtCorpStart(state);
      if (cascadeTrash.amount > 0) {
        if (!cascadeTrash.sourceDefinitionId)
          throw new Error("Cascade-Virus-Quelle fehlt.");
        const trashed = trashTopRdCardsFaceupForCascade(
          state,
          cascadeTrash.amount,
        );
        if (trashed.length > 0) {
          effects?.push({
            effectId: "corp.start.cascade.trash_top_rd_faceup",
            kind: "trash_card",
            visibility: "hidden_info_barrier",
            side: "corp",
            amount: trashed.length,
            reason: "start_of_turn",
            sourceDefinitionId: cascadeTrash.sourceDefinitionId,
            sourceTitle: links.publicCardTitle(cascadeTrash.sourceDefinitionId),
            cardDefinitionId: definitionFor(state, trashed[0]!).id,
            cardTitle: links.publicCardTitle(
              definitionFor(state, trashed[0]!).id,
            ),
          });
        }
      }
      resumeCorpStartOfTurnOrdering(state, effects, legalAction);
      return true;
    }
    const rootCardIds = deps.rezzedCorpRootCardIds(state);
    for (
      let rootCardIndex = rootCardStartIndex;
      rootCardIndex < rootCardIds.length;
      rootCardIndex += 1
    ) {
      const cardId = rootCardIds[rootCardIndex]!;
      const definitionId = definitionFor(state, cardId).id;
      const recurringTracePool = deps.corpUtilityImplementationForCard(
        state,
        cardId,
      );
      if (
        recurringTracePool?.kind === "recurring_trace_credit_pool" &&
        recurringTracePool.counterType === "bit" &&
        recurringTracePool.spendWindow === "trace" &&
        recurringTracePool.refresh === "start_of_corp_turn_after_use" &&
        cardCounter(state, cardId, recurringTracePool.counterType) <
          recurringTracePool.amount
      ) {
        setCardCounter(
          state,
          cardId,
          recurringTracePool.counterType,
          recurringTracePool.amount,
        );
        effects?.push(
          links.automaticCounterChangeEffect(
            `corp.start.recurring_trace_credit_pool.${cardId}`,
            "corp",
            definitionId,
            recurringTracePool.counterType,
            recurringTracePool.amount,
            recurringTracePool.amount,
          ),
        );
      }
      if (
        isFortTraceBitPoolSource(
          deps.fortRunSideFamiliesHostForState(state),
          cardId,
        )
      ) {
        const capacity = fortTraceBitPoolCapacityForCard(
          deps.fortRunSideFamiliesHostForState(state),
          cardId,
        );
        if (cardCounter(state, cardId, "bit") < capacity)
          setCardCounter(state, cardId, "bit", capacity);
      }
      if (
        recurringTracePool?.kind ===
        "corp_start_turn_tag_roll_per_runner_run_last_turn"
      ) {
        const runCount = Math.max(
          0,
          Math.floor(state.runnerTurnFlags?.runAttemptsLastTurn ?? 0),
        );
        if (recurringTracePool.optional && runCount > 0) {
          if (!legalAction)
            throw new Error(
              "Corp-Start-Satellite-Choice braucht eine LegalAction.",
            );
          if (state.pendingChoice || state.pendingAddTagContinuation)
            throw new Error("Es ist bereits eine Corp-Start-Choice offen.");
          state.pendingAddTagContinuation = {
            kind: "corp_start_turn_satellite_choice",
            sourceCardId: cardId,
            sourceDefinitionId: definitionId,
            nextRootCardIndex: rootCardIndex + 1,
            runAttemptsLastTurn: runCount,
          };
          state.pendingChoice = {
            choiceId: `classic_satellite_monitors_${state.stateVersion + 1}`,
            side: "corp",
            source: `classic.satellite_monitors:${cardId}:${state.stateVersion + 1}`,
            prompt: `${links.publicCardTitle(definitionId)}: Würfelserie ausführen?`,
            presentationKey: "satellite_monitors",
            kind: "select_option",
            options: [
              { id: "use", label: "Würfelserie ausführen", value: "use" },
              { id: "decline", label: "Nicht ausführen", value: "decline" },
            ],
            minSelections: 1,
            maxSelections: 1,
            stateVersion: state.stateVersion + 1,
            visibility: "public",
          };
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            satelliteMonitorsChoiceOpened: true,
            sourceDefinitionId: definitionId,
            runAttemptsLastTurn: runCount,
          };
          return true;
        }
        let tagsAdded = 0;
        const dieRolls: number[] = [];
        for (let index = 0; index < runCount; index += 1) {
          const randomPurpose = `classic.satellite_monitors.corp_start.${state.stateVersion}.${cardId}.${index}`;
          const dieRoll = rollDeterministicDie(state, randomPurpose);
          dieRolls.push(dieRoll);
          if (dieRoll === recurringTracePool.tagOn) tagsAdded += 1;
        }
        if (tagsAdded > 0) {
          if (!legalAction)
            throw new Error("Corp-Start-Add-Tag braucht eine LegalAction.");
          const runnerTagsBefore = state.runner.tags;
          state.pendingAddTagContinuation = {
            kind: "corp_start_turn",
            sourceCardId: cardId,
            sourceDefinitionId: definitionId,
            nextRootCardIndex: rootCardIndex + 1,
            runAttemptsLastTurn: runCount,
            dieRolls,
            tagAmount: tagsAdded,
            runnerTagsBefore,
          };
          if (
            addRunnerTagsWithPrevention(
              state,
              legalAction,
              tagsAdded,
              definitionId,
            )
          )
            return true;
          delete state.pendingAddTagContinuation;
          tagsAdded = Math.max(0, state.runner.tags - runnerTagsBefore);
        }
        if (runCount > 0) {
          effects?.push({
            effectId: `corp.start.classic.satellite_monitors.${cardId}`,
            kind: tagsAdded > 0 ? "add_tags" : "counter_change",
            visibility: recurringTracePool.visibility,
            side: "runner",
            amount: tagsAdded,
            reason: "start_of_turn",
            sourceDefinitionId: definitionId,
            sourceTitle: links.publicCardTitle(definitionId),
            runAttemptsLastTurn: runCount,
            dieSize: recurringTracePool.dieFaces,
            dieRolls: dieRolls.join(","),
            tagsAdded,
            runnerTagsAfter: state.runner.tags,
            randomCounterAfter: state.randomCounter,
          });
        }
      }
    }
    return state.pendingChoice !== undefined;
  }

  function corpStartOfTurnSourceIds(state: GameState): CardInstanceId[] {
    return [...deps.rezzedCorpRootCardIds(state), ...state.corp.scoreArea]
      .filter((sourceId) => {
        if (
          hasDueCardImplementationStartOfCorpTurnAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            sourceId,
          )
        )
          return true;
        if (
          deps.isCorpInstalledEconomyCreditSource(state, sourceId) &&
          cardCounter(state, sourceId, "recurring_credit") > 0
        )
          return true;
        const definition = definitionFor(state, sourceId);
        return (
          deps.scoredAgendaImplementationForDefinition(definition)?.kind ===
          "corp_start_turn_optional_draw"
        );
      })
      .filter((sourceId, index, all) => all.indexOf(sourceId) === index)
      .sort();
  }

  function startCorpStartOfTurnOrderChoice(
    state: GameState,
    sourceIds: CardInstanceId[],
  ): void {
    const nextStateVersion = state.stateVersion + 1;
    state.pendingChoice = {
      choiceId: `corp_start_order_${nextStateVersion}`,
      side: "corp",
      source: `corp_start.order:${nextStateVersion}`,
      prompt: "Wähle den nächsten Effekt am Beginn deines Zuges.",
      kind: "select_cards",
      options: sourceIds.map((sourceId) => ({
        id: `source_${sourceId}`,
        label: definitionFor(state, sourceId).title,
        value: sourceId,
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: nextStateVersion,
      visibility: "hidden_info_barrier",
    };
  }

  function resolveCorpStartOfTurnSource(
    state: GameState,
    sourceId: CardInstanceId,
    effects?: AutomaticEffectCollector,
  ): void {
    if (
      deps.isCorpInstalledEconomyCreditSource(state, sourceId) &&
      cardCounter(state, sourceId, "recurring_credit") > 0
    ) {
      const definition = definitionFor(state, sourceId);
      spendCardCounter(state, sourceId, "recurring_credit", 1);
      credits(state, "corp", 1, {
        kind: "turn_effect",
        sourceDefinitionId: definition.id,
        sourceCardId: sourceId,
        reason: "installed_economy_start_of_corp_turn",
      });
      const remainingCounters = cardCounter(
        state,
        sourceId,
        "recurring_credit",
      );
      effects?.push({
        ...links.automaticGainCreditsEffect(
          `corp.start.installed_economy_credit.${sourceId}`,
          "corp",
          1,
          definition.id,
          sourceId,
        ),
        reason: "installed_economy_start_of_corp_turn",
      });
      effects?.push({
        effectId: `corp.start.installed_economy_credit.counter.${sourceId}`,
        kind: "counter_change",
        visibility: "public",
        side: "corp",
        amount: remainingCounters,
        reason: "installed_economy_start_of_corp_turn",
        counterType: "recurring_credit",
        removedCounterAmount: 1,
        remainingCounters,
        sourceDefinitionId: definition.id,
        sourceCardInstanceId: sourceId,
        sourceTitle: links.publicCardTitle(definition.id),
      });
    }
    executeCardImplementationStartOfCorpTurnEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      effects,
      sourceId,
    );
    if (state.pendingChoice) return;
    const definition = definitionFor(state, sourceId);
    if (
      state.corp.scoreArea.includes(sourceId) &&
      deps.scoredAgendaImplementationForDefinition(definition)?.kind ===
        "corp_start_turn_optional_draw"
    )
      startScoredAgendaStartDrawChoice(
        deps.scoredAgendaFlowHost(state),
        sourceId,
      );
  }

  function resumeCorpStartOfTurnOrdering(
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
  ): void {
    if (state.pendingChoice) return;
    const flags = ensureCorpTurnFlags(state);
    const resolved = new Set(flags.corpStartOfTurnResolvedSourceIds ?? []);
    const remaining = corpStartOfTurnSourceIds(state).filter(
      (sourceId) => !resolved.has(sourceId),
    );
    if (remaining.length > 1) {
      startCorpStartOfTurnOrderChoice(state, remaining);
      return;
    }
    if (remaining.length === 1) {
      const sourceId = remaining[0]!;
      flags.corpStartOfTurnResolvedSourceIds = [...resolved, sourceId].sort();
      resolveCorpStartOfTurnSource(state, sourceId, effects);
      if (!state.pendingChoice)
        resumeCorpStartOfTurnOrdering(state, effects, legalAction);
      return;
    }
    applyCorpStartOfTurnEffects(state, effects, legalAction, 0, true);
    if (!state.pendingChoice)
      openCorpStartTurnRestrictedActionOffers(state, effects);
  }

  function resolveCorpStartOfTurnOrderChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: import("@netgrid/shared").PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice?.source.startsWith("corp_start.order:"))
      throw new Error("Es ist keine Korp-Startzugreihenfolge offen.");
    if (legalAction.side !== "corp" || playerAction.side !== "corp")
      throw new Error("Nur die Korp bestimmt ihre Startzugreihenfolge.");
    const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0];
    const option = choice.options.find(
      (candidate) => candidate.id === selectedId,
    );
    const sourceId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    const flags = ensureCorpTurnFlags(state);
    const resolved = new Set(flags.corpStartOfTurnResolvedSourceIds ?? []);
    if (
      !sourceId ||
      resolved.has(sourceId) ||
      !corpStartOfTurnSourceIds(state).includes(sourceId)
    )
      throw new Error(
        "Der gewählte Korp-Startzugeffekt ist nicht mehr fällig.",
      );
    delete state.pendingChoice;
    flags.corpStartOfTurnResolvedSourceIds = [...resolved, sourceId].sort();
    const effects: ResolvedGameEffect[] = [];
    resolveCorpStartOfTurnSource(state, sourceId, effects);
    if (!state.pendingChoice)
      resumeCorpStartOfTurnOrdering(state, effects, legalAction);
    links.appendResolvedEffectsToPayload(legalAction, effects);
  }

  function applyPurgeableRunnerVirusCorpStartEffects(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    const corpCounters = state.purgeableRunnerVirusCounters?.corp;
    for (const implementation of CARD_IMPLEMENTATIONS) {
      const virusCounter = implementation.virusCounter;
      const start = virusCounter?.startOfCorpTurn;
      if (
        !virusCounter ||
        !start ||
        !("counterSource" in start) ||
        start.counterSource !== "corp_purgeable_runner_virus_counter"
      )
        continue;
      const counterType =
        virusCounter.counterKind as PurgeableRunnerVirusCounterType;
      const counterAmount = purgeableRunnerVirusCounterAmount(
        corpCounters,
        counterType,
      );
      if (counterAmount <= 0) continue;
      const sourceDefinitionId = implementation.cardDefinitionId;
      const sourceTitle = links.publicCardTitle(sourceDefinitionId);
      if (start.kind === "roll_per_counter_add_bad_publicity") {
        for (let index = 0; index < counterAmount; index += 1) {
          const randomPurpose = `virus.${sourceDefinitionId}.corp_start.${state.stateVersion}.${index}`;
          const dieRoll = rollDeterministicDie(state, randomPurpose);
          const badPublicityAdded = start.successDieValues.includes(
            dieRoll as 5 | 6,
          )
            ? start.amountPerSuccess
            : 0;
          if (badPublicityAdded > 0)
            state.corp.badPublicity += badPublicityAdded;
          effects?.push({
            effectId: `corp.start.virus.${sourceDefinitionId}.${index}`,
            kind:
              badPublicityAdded > 0 ? "add_bad_publicity" : "counter_change",
            visibility: start.visibility,
            side: "corp",
            amount: badPublicityAdded,
            reason: "start_of_turn",
            counterType,
            remainingCounters: counterAmount,
            sourceDefinitionId,
            sourceTitle,
            randomPurpose,
            dieSize: start.dieSize,
            dieRoll,
            randomCounterAfter: state.randomCounter,
            ...(badPublicityAdded > 0
              ? {
                  badPublicityAdded,
                  corpBadPublicityAfter: state.corp.badPublicity,
                }
              : {}),
          });
        }
        continue;
      }
      if (start.kind === "lose_credits_per_counter_group") {
        const requestedLoss =
          Math.floor(counterAmount / start.perCounters) * start.amountPerGroup;
        const creditLoss = Math.min(state.corp.credits, requestedLoss);
        if (creditLoss <= 0) continue;
        state.corp.credits -= creditLoss;
        effects?.push(
          links.automaticLoseCreditsEffect(
            `corp.start.virus.${sourceDefinitionId}`,
            "corp",
            creditLoss,
            sourceDefinitionId,
          ),
        );
        continue;
      }
      if (start.kind === "forgo_actions_per_counter") {
        const actionDebt = counterAmount * start.amountPerCounter;
        addCorpActionDebt(state, {
          amount: actionDebt,
          reason: "pipe_counter",
          source: "start_of_turn_effect",
        });
        effects?.push({
          effectId: `corp.start.virus.${sourceDefinitionId}`,
          kind: "counter_change",
          visibility: start.visibility,
          side: "corp",
          amount: actionDebt,
          reason: "start_of_turn",
          counterType,
          remainingCounters: counterAmount,
          sourceDefinitionId,
          sourceTitle,
        });
      }
    }
  }

  function openCorpStartTurnRestrictedActionOffers(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    if (state.actionEconomy?.pendingOffer) return;
    for (const sourceId of state.corp.scoreArea.slice().sort()) {
      const definition = definitionFor(state, sourceId);
      if (
        deps.scoredAgendaImplementationForDefinition(definition)?.kind !==
        "corp_start_turn_random_restricted_optional_action"
      )
        continue;
      const randomPurpose = `action_economy.${definition.id}.corp_start.${state.stateVersion}.${sourceId}`;
      const dieRoll = rollDeterministicDie(state, randomPurpose);
      const restriction = restrictedActionFamilyForRandomActionRoll(dieRoll);
      ensureActionEconomy(state).pendingOffer = {
        side: "corp",
        sourceCardInstanceId: sourceId,
        sourceDefinitionId: definition.id,
        restriction,
        optional: true,
        dieRoll,
        randomPurpose,
        createdAtStateVersion: state.stateVersion,
      };
      effects?.push({
        effectId: `corp.start.action_economy.offer.${sourceId}`,
        kind: "counter_change",
        visibility: "public",
        side: "corp",
        amount: 0,
        reason: "start_of_turn",
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
        dieRoll,
        randomPurpose,
        restrictedActionFamily: restriction,
        randomCounterAfter: state.randomCounter,
      });
      return;
    }
  }

  function virusCounterDrawsAtCorpStart(state: GameState): number {
    return CARD_IMPLEMENTATIONS.reduce((sum, implementation) => {
      const virusCounter = implementation.virusCounter;
      const start = virusCounter?.startOfCorpTurn;
      if (
        !virusCounter ||
        start?.kind !== "draw_extra_cards_per_counter" ||
        virusCounter.addOnSuccessfulRun?.counterScope.kind !==
          "shared_corp_pool"
      )
        return sum;
      return (
        sum +
        purgeableRunnerVirusCounterAmount(
          state.purgeableRunnerVirusCounters?.corp,
          virusCounter.counterKind as PurgeableRunnerVirusCounterType,
        ) *
          start.amountPerCounter
      );
    }, 0);
  }

  function skivvissCounterTotal(state: GameState): number {
    return CARD_IMPLEMENTATIONS.reduce((sum, implementation) => {
      const virusCounter = implementation.virusCounter;
      if (
        virusCounter?.startOfCorpTurn?.kind !==
          "draw_extra_cards_per_counter" ||
        virusCounter.addOnSuccessfulRun?.counterScope.kind !==
          "shared_corp_pool"
      )
        return sum;
      return (
        sum +
        purgeableRunnerVirusCounterAmount(
          state.purgeableRunnerVirusCounters?.corp,
          virusCounter.counterKind as PurgeableRunnerVirusCounterType,
        )
      );
    }, 0);
  }

  function virusCounterCascadeTrashAtCorpStart(state: GameState): {
    amount: number;
    sourceDefinitionId?: CardDefinitionId;
  } {
    const sourceDefinitionId = uniqueVirusCounterOwnerDefinitionId(
      "trash_top_rd_cards_faceup_per_two_counters",
    );
    const implementation = CARD_IMPLEMENTATIONS.find(
      (candidate) => candidate.cardDefinitionId === sourceDefinitionId,
    );
    const virusCounter = implementation?.virusCounter;
    const start = virusCounter?.startOfCorpTurn;
    if (
      !virusCounter ||
      start?.kind !== "trash_top_rd_cards_faceup_per_two_counters" ||
      virusCounter.addOnSuccessfulRun?.counterScope.kind !== "shared_corp_pool"
    )
      throw new Error("Der gemeinsame R&D-Trash-Counter-Vertrag fehlt.");
    const counterAmount = purgeableRunnerVirusCounterAmount(
      state.purgeableRunnerVirusCounters?.corp,
      virusCounter.counterKind as PurgeableRunnerVirusCounterType,
    );
    const trashAmount =
      Math.floor(counterAmount / start.perCounters) * start.countPerGroup;
    return {
      amount: trashAmount,
      ...(counterAmount > 0 ? { sourceDefinitionId } : {}),
    };
  }

  function uniqueVirusCounterOwnerDefinitionId(
    startKind:
      | "draw_extra_cards_per_counter"
      | "trash_top_rd_cards_faceup_per_two_counters",
  ): CardDefinitionId {
    const ownerDefinitionIds = CARD_IMPLEMENTATIONS.filter((implementation) => {
      const virusCounter = implementation.virusCounter;
      return (
        virusCounter?.startOfCorpTurn?.kind === startKind &&
        virusCounter.addOnSuccessfulRun?.counterScope.kind ===
          "shared_corp_pool"
      );
    }).map((implementation) => implementation.cardDefinitionId);
    if (ownerDefinitionIds.length !== 1)
      throw new Error(
        `Expected exactly one virus-counter owner for ${startKind}; received ${ownerDefinitionIds.length}.`,
      );
    return ownerDefinitionIds[0]!;
  }

  function trashTopRdCardsFaceupForCascade(
    state: GameState,
    maxCount: number,
  ): CardInstanceId[] {
    const selected = state.corp.rd.slice(0, Math.max(0, Math.floor(maxCount)));
    for (const cardId of selected) {
      removeFromAllZones(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: true,
        rezzed: false,
        zone: { side: "corp", zone: "archives" },
      };
    }
    return selected;
  }

  return {
    resolvePdcaCounterAction,
    resolveCorpMandatoryDraw,
    resumeCorpMandatoryDrawAfterChoice,
    startCorpTurn,
    applyInstalledIceCounterLifecycle,
    applyCorpStartOfTurnEffects,
    resolveCorpStartOfTurnOrderChoice,
    resolveCorpStartOfTurnRezChoice,
    resumeCorpStartOfTurnOrdering,
    applyPurgeableRunnerVirusCorpStartEffects,
    openCorpStartTurnRestrictedActionOffers,
    virusCounterDrawsAtCorpStart,
    skivvissCounterTotal,
    virusCounterCascadeTrashAtCorpStart,
    trashTopRdCardsFaceupForCascade,
  };
}
