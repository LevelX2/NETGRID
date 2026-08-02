import {
  type CardDefinitionId,
  type CardInstanceId,
  type CorpDrawContinuation,
  type GameState,
  type LegalAction,
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
import { startCorpHqAgendaRevealChoice } from "../hidden-zone/corp-zone-choice-handlers";
import { startScoredAgendaStartDrawChoice } from "../corp/scored-agenda-flow";
import {
  clearActivityGatedFortRunMarkers,
  isFortTraceBitPoolSource,
  fortTraceBitPoolCapacityForCard,
} from "../run/fort-run-side-families";
import {
  CASCADE_ID,
  SKIVVISS_ID,
} from "../../compatibility/runtime-compatibility";
import { executeCardImplementationStartOfCorpTurnEffects } from "../../ability-engine/card-implementation-runtime";
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
  | "applyPurgeableRunnerVirusCorpStartEffects"
  | "openCorpStartTurnRestrictedActionOffers"
  | "virusCounterDrawsAtCorpStart"
  | "skivvissCounterTotal"
  | "virusCounterCascadeTrashAtCorpStart"
  | "trashFaceupRdCardsForCascade"
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
        ...(skivvissCardCount > 0 ? [SKIVVISS_ID] : []),
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
              SKIVVISS_ID,
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
    ensureCorpTurnFlags(state).pdcaUsedSourceIdsThisTurn =
      clearAbilityUsageSourceIds();
    applyFutureExtraActionGrantsAtTurnStart(state, "corp", effects);
    applyScoredAgendaCreditEconomyAtCorpStart(state, effects);
    applyScoredAgendaActionEconomyAtCorpStart(state, effects);
    applyInstalledIceCounterLifecycle(state);
    if (applyCorpStartOfTurnEffects(state, effects, legalAction)) return;
    openCorpStartTurnRestrictedActionOffers(state, effects);
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
        const trashed = trashFaceupRdCardsForCascade(
          state,
          cascadeTrash.amount,
        );
        if (trashed.length > 0) {
          effects?.push({
            effectId: "corp.start.cascade.trash_faceup_rd",
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
      executeCardImplementationStartOfCorpTurnEffects(
        deps.cardImplementationRuntimeDeps,
        state,
        effects,
      );
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
      if (deps.isCorpInstalledEconomyCreditSource(state, cardId)) {
        if (cardCounter(state, cardId, "recurring_credit") > 0) {
          spendCardCounter(state, cardId, "recurring_credit", 1);
          credits(state, "corp", 1, {
            kind: "turn_effect",
            sourceDefinitionId: definitionId,
            sourceCardId: cardId,
            reason: "installed_economy_start_of_corp_turn",
          });
          const remainingCounters = cardCounter(
            state,
            cardId,
            "recurring_credit",
          );
          effects?.push(
            links.automaticGainCreditsEffect(
              `corp.start.installed_economy_credit.${cardId}`,
              "corp",
              1,
              definitionId,
            ),
          );
          effects?.push({
            effectId: `corp.start.installed_economy_credit.counter.${cardId}`,
            kind: "counter_change",
            visibility: "public",
            side: "corp",
            amount: remainingCounters,
            reason: "start_of_turn",
            counterType: "recurring_credit",
            removedCounterAmount: 1,
            remainingCounters,
            sourceDefinitionId: definitionId,
            sourceTitle: links.publicCardTitle(definitionId),
          });
        }
        continue;
      }
    }
    if (!state.pendingChoice)
      startCorpHqAgendaRevealChoice(
        deps.corpZoneChoiceHandlerHost(state, {
          side: "corp",
          payload: {},
        } as LegalAction),
      );
    if (!state.pendingChoice)
      startScoredAgendaStartDrawChoice(deps.scoredAgendaFlowHost(state));
    return false;
  }

  function applyPurgeableRunnerVirusCorpStartEffects(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    const corpCounters = state.purgeableRunnerVirusCounters?.corp;
    const scaldanCounters = purgeableRunnerVirusCounterAmount(
      corpCounters,
      "scaldan",
    );
    for (let index = 0; index < scaldanCounters; index += 1) {
      const randomPurpose = `proteus.scaldan.corp_start.${state.stateVersion}.${index}`;
      const dieRoll = rollDeterministicDie(state, randomPurpose);
      const badPublicityAdded = dieRoll >= 5 ? 1 : 0;
      if (badPublicityAdded > 0) state.corp.badPublicity += badPublicityAdded;
      effects?.push({
        effectId: `corp.start.proteus.scaldan.${index}`,
        kind: badPublicityAdded > 0 ? "add_bad_publicity" : "counter_change",
        visibility: "public",
        side: "corp",
        amount: badPublicityAdded,
        reason: "start_of_turn",
        counterType: "scaldan",
        remainingCounters: scaldanCounters,
        sourceDefinitionId: deps.PROTEUS_SCALDAN_ID,
        sourceTitle: links.publicCardTitle(deps.PROTEUS_SCALDAN_ID),
        randomPurpose,
        dieSize: 6,
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
    const taxCounters = purgeableRunnerVirusCounterAmount(corpCounters, "tax");
    const taxLoss = Math.min(state.corp.credits, Math.floor(taxCounters / 2));
    if (taxLoss > 0) {
      state.corp.credits -= taxLoss;
      effects?.push(
        links.automaticLoseCreditsEffect(
          "corp.start.proteus.taxman",
          "corp",
          taxLoss,
          deps.PROTEUS_TAXMAN_ID,
        ),
      );
    }

    const pipeCounters = purgeableRunnerVirusCounterAmount(
      corpCounters,
      "pipe",
    );
    if (pipeCounters <= 0) return;
    addCorpActionDebt(state, {
      amount: pipeCounters,
      reason: "pipe_counter",
      source: "start_of_turn_effect",
    });
    effects?.push({
      effectId: "corp.start.pipe_counter",
      kind: "counter_change",
      visibility: "public",
      side: "corp",
      amount: pipeCounters,
      reason: "start_of_turn",
      counterType: "pipe",
      remainingCounters: pipeCounters,
    });
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
    return Object.keys(state.cardInstances).reduce((sum, cardId) => {
      const implementation = deps.virusCounterImplementationForCard(
        state,
        cardId,
      );
      const start = implementation?.startOfCorpTurn;
      if (start?.kind !== "draw_extra_cards_per_counter") return sum;
      return sum + cardCounter(state, cardId, "virus") * start.amountPerCounter;
    }, 0);
  }

  function skivvissCounterTotal(state: GameState): number {
    return Object.keys(state.cardInstances).reduce((sum, cardId) => {
      if (definitionFor(state, cardId).id !== SKIVVISS_ID) return sum;
      return sum + cardCounter(state, cardId, "virus");
    }, 0);
  }

  function virusCounterCascadeTrashAtCorpStart(state: GameState): {
    amount: number;
    sourceDefinitionId?: CardDefinitionId;
  } {
    const corpCascadeCounters = purgeableRunnerVirusCounterAmount(
      state.purgeableRunnerVirusCounters?.corp,
      "cascade",
    );
    const corpCascadeTrash = Math.floor(corpCascadeCounters / 2);
    return Object.keys(state.cardInstances).reduce(
      (result, cardId) => {
        const implementation = deps.virusCounterImplementationForCard(
          state,
          cardId,
        );
        const start = implementation?.startOfCorpTurn;
        if (start?.kind !== "trash_faceup_rd_cards_per_two_counters")
          return result;
        const amount =
          Math.floor(cardCounter(state, cardId, "virus") / start.perCounters) *
          start.countPerGroup;
        return {
          amount: result.amount + amount,
          sourceDefinitionId:
            result.sourceDefinitionId ?? definitionFor(state, cardId).id,
        };
      },
      {
        amount: corpCascadeTrash,
        sourceDefinitionId: corpCascadeCounters > 0 ? CASCADE_ID : undefined,
      } as { amount: number; sourceDefinitionId?: CardDefinitionId },
    );
  }

  function trashFaceupRdCardsForCascade(
    state: GameState,
    maxCount: number,
  ): CardInstanceId[] {
    const selected = state.corp.rd
      .filter((cardId) => state.cardInstances[cardId]?.faceup === true)
      .slice(0, Math.max(0, Math.floor(maxCount)));
    for (const cardId of selected) {
      removeFromAllZones(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: true,
        rezzed: true,
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
    applyPurgeableRunnerVirusCorpStartEffects,
    openCorpStartTurnRestrictedActionOffers,
    virusCounterDrawsAtCorpStart,
    skivvissCounterTotal,
    virusCounterCascadeTrashAtCorpStart,
    trashFaceupRdCardsForCascade,
  };
}
