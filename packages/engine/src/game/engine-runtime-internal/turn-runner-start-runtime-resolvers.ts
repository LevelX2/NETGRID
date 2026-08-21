import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PurgeableRunnerVirusCounterType,
  type ResolvedGameEffect,
  type ServerId,
} from "@netgrid/shared";
import {
  definitionFor,
  runnerInstalledCardIds,
} from "../state/card-server-lookup";
import { rollDeterministicDie, nextRandom } from "../state/draw-random";
import { credits } from "../state/economy-mutation";
import { clearAbilityUsageSourceIds } from "../../ability-engine/card-implementation-ability-limits";
import {
  cardCounter,
  ensureCorpTurnFlags,
  ensureRunnerTurnFlags,
  setCardCounter,
} from "../state/turn-flags-counters";
import { removeFromAllZones } from "../state/zone-mutation";
import { applyDelayedInstallStartOfTurn } from "../abilities/runner-special-trigger-execution";
import {
  addRunnerTagsWithPrevention,
  doDamage,
  type DamageSummary,
} from "../damage/damage-core";
import { startInstalledCardTrashForCreditsChoice } from "../hidden-zone/nonsearch-choice-handlers";
import { selectedChoiceIds } from "../choices/choice-validation";
import { publicServerLabel } from "../../public-context";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import {
  executeCardImplementationStartOfRunnerTurnEffects,
  hasDueCardImplementationStartOfRunnerTurnAbility,
} from "../../ability-engine/card-implementation-runtime";
import type { CardRunnerUtilityLongtailImplementation } from "../../ability-engine/definition-types";
import type {
  AutomaticEffectCollector,
  RestrictedActionFamily,
  RuntimeDeps,
} from "./runtime-shared";
import {
  addTurnBoundExtraActionGrant,
  applyFutureExtraActionGrantsAtTurnStart,
  consumeRunnerFutureActionDebt,
  currentTurnSerial,
  expireTurnBoundExtraActionGrants,
} from "./turn-action-economy-runtime";
import {
  automaticRunnerStartSourceId,
  hasAdditionalRunnerStartOfTurnPath,
  runnerStartOrderingCandidate,
} from "./turn-runner-start-ordering";

type TurnRuntimePort = import("./turn-runtime-port").TurnRuntimePort;
type TurnRunnerStartRuntimeResolvers = Pick<
  TurnRuntimePort,
  | "startRunnerTurn"
  | "returnCorpTemporaryInstallRezCredits"
  | "untapRunnerCardsAtTurnStart"
  | "resolveDelayedAccessEffects"
  | "applyRunnerStartOfTurnEffects"
  | "applyStartTurnRandomEffectTables"
  | "applyRunnerStartTurnActionEconomyEffects"
  | "resolveRunnerStartOfTurnOrderChoice"
  | "resumeRunnerStartOfTurnOrdering"
  | "runnerForcedActionGrantForRoll"
  | "randomRunnerGripCardId"
  | "virusCounterCreditsAtRunnerStart"
  | "startVirusCounterRunnerPrivateLookAtStart"
  | "randomCorpHqCardsWithoutReplacement"
  | "startRunnerPrivateLookAtSpecificCorpCards"
  | "queueIncubatorStartOfTurnTransforms"
  | "startIncubatorTransformChoice"
>;

/**
 * Owns Runner turn-start sequencing, delayed access and random effects.
 * Cross-domain links are read only when a resolver runs, after the aggregate
 * turn runtime has been composed.
 */
export function createTurnRunnerStartRuntimeResolvers(
  deps: RuntimeDeps,
  links: TurnRuntimePort,
): TurnRunnerStartRuntimeResolvers {
  function startRunnerTurn(
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
  ): void {
    expireTurnBoundExtraActionGrants(state);
    state.turnSerial = currentTurnSerial(state) + 1;
    returnCorpTemporaryInstallRezCredits(state, effects);
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = deps.runnerActionsPerTurn(state);
    state.runner.clicks += (
      state.runnerTurnFlags?.persistentModifiers ?? []
    ).reduce(
      (total, modifier) =>
        modifier.kind === "runner_extra_actions_per_turn"
          ? total + modifier.amount
          : total,
      0,
    );
    applyFutureExtraActionGrantsAtTurnStart(state, "runner", effects);
    state.corp.clicks = 0;
    deps.clearEdgerunnerTempsInstallFlags(state);
    const flags = ensureRunnerTurnFlags(state);
    flags.stoleAgendaThisTurn = false;
    flags.stoleAgendaLastTurn = false;
    flags.stolenAgendaIdsThisTurn = [];
    flags.stolenAgendaAdvancementCountersThisTurn = 0;
    flags.stolenAgendaAdvancementCountersLastTurn = 0;
    flags.runnerReceivedTagThisTurn = false;
    flags.stoleResearchAgendaThisTurn = false;
    flags.stoleGrayOpsAgendaThisTurn = false;
    flags.stoleBlackOpsAgendaThisTurn = false;
    flags.runAttemptsThisTurn = 0;
    flags.runAttemptsLastTurn = 0;
    flags.successfulHqRunThisTurn = false;
    flags.successfulRdRunThisTurn = false;
    flags.successfulRunThisTurn = false;
    delete flags.lastSuccessfulRunServerId;
    flags.blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn = false;
    flags.trashedAdvertisementThisTurn = false;
    flags.trashedTransactionsThisTurn = false;
    delete state.runnerDelayedEffectInstances;
    flags.damagePreventionUsage = {};
    flags.abilityUsedSourceIdsByLimitKey = {};
    flags.startOfTurnFloatingCreditsApplied = false;
    flags.bonusRunPending = false;
    flags.valuPakProgramInstallActionsRemaining = 0;
    flags.valuPakTemporaryProgramInstallCredits = 0;
    flags.delayedInstallStartTurnResolvedSourceIds = [];
    flags.runnerStartOfTurnResolvedSourceIds = [];
    flags.runOnlyActionUsedSourceIdsThisTurn = [];
    flags.successfulRunExtraRunPending = false;
    flags.successfulRunExtraRunUsedThisTurn = false;
    flags.delayedEndTurnEffects = [];
    flags.corpRezzedIceThisTurn = 0;
    delete flags.lastRezzedBlackIceThisTurn;
    ensureCorpTurnFlags(state).counterPreventionUsedSourceIdsThisTurn =
      clearAbilityUsageSourceIds();
    delete flags.incubatorPendingTransforms;
    consumeRunnerFutureActionDebt(state);
    deps.refreshRecurringCredits(state, "runner", effects);
    untapRunnerCardsAtTurnStart(state);
    applyRunnerStartOfTurnEffects(state, effects, "begin", legalAction);
  }

  function returnCorpTemporaryInstallRezCredits(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    const temporaryCredits = state.corpTemporaryInstallRezCredits;
    if (!temporaryCredits) return;
    const returned = Math.max(0, Math.floor(temporaryCredits.remaining ?? 0));
    if (returned > 0)
      state.corp.credits = Math.max(0, state.corp.credits - returned);
    effects?.push({
      effectId: `corp.end.${temporaryCredits.sourceCardInstanceId}.temporary_install_rez_credits`,
      kind: "lose_credits",
      visibility: "public",
      side: "corp",
      amount: returned,
      reason: "end_of_turn",
      sourceDefinitionId: temporaryCredits.sourceDefinitionId,
      sourceTitle: links.publicCardTitle(temporaryCredits.sourceDefinitionId),
    });
    delete state.corpTemporaryInstallRezCredits;
  }

  function untapRunnerCardsAtTurnStart(state: GameState): void {
    for (const cardId of runnerInstalledCardIds(state)) {
      const instance = state.cardInstances[cardId];
      if (!instance?.tapped) continue;
      state.cardInstances[cardId] = { ...instance, tapped: false };
    }
  }

  function resolveDelayedAccessEffects(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    for (const sourceId of delayedAgendaAccessStartSourceIds(state))
      resolveDelayedAgendaAccessStartSource(state, sourceId, effects);
  }

  function applyRunnerStartOfTurnEffects(
    state: GameState,
    effects?: AutomaticEffectCollector,
    resumePoint: "begin" | "after_delayed_install_choice" = "begin",
    legalAction?: LegalAction,
    counterEffectStartIndex = 0,
  ): void {
    if (resumePoint === "after_delayed_install_choice") {
      resumeRunnerStartOfTurnOrdering(state, effects);
      return;
    }
    if (state.delayedAccessEffects) {
      state.delayedAccessEffects = state.delayedAccessEffects.filter(
        (entry) =>
          entry.kind !== "delayed_agenda_access_replacement" ||
          entry.resolveAt !== "runner_start_turn" ||
          delayedAgendaAccessEntryIsDue(state, entry),
      );
      if (state.delayedAccessEffects.length === 0)
        delete state.delayedAccessEffects;
    }
    const flags = ensureRunnerTurnFlags(state);
    const counterEffects = deps.runnerTraceCounterEffectDefinitions();
    for (
      let counterEffectIndex = counterEffectStartIndex;
      counterEffectIndex < counterEffects.length;
      counterEffectIndex += 1
    ) {
      const counterEffect = counterEffects[counterEffectIndex]!;
      if (!counterEffect.startOfRunnerTurn) continue;
      const counterCount = cardCounter(
        state,
        state.runner.identity,
        counterEffect.counterType,
      );
      if (counterCount <= 0) continue;
      const amount =
        counterCount * counterEffect.startOfRunnerTurn.amountPerCounter;
      if (counterEffect.startOfRunnerTurn.kind === "add_tags") {
        if (!legalAction)
          throw new Error("Runner-Start-Add-Tag braucht eine LegalAction.");
        const runnerTagsBefore = state.runner.tags;
        state.pendingAddTagContinuation = {
          kind: "runner_start_turn",
          sourceDefinitionId: counterEffect.sourceDefinitionId,
          counterType: counterEffect.counterType,
          nextCounterEffectIndex: counterEffectIndex + 1,
          tagAmount: amount,
          runnerTagsBefore,
        };
        if (
          addRunnerTagsWithPrevention(
            state,
            legalAction,
            amount,
            counterEffect.sourceDefinitionId,
          )
        )
          return;
        delete state.pendingAddTagContinuation;
        const tagsAdded = Math.max(0, state.runner.tags - runnerTagsBefore);
        if (tagsAdded > 0)
          effects?.push(
            links.automaticTagEffect(
              `runner.start.${counterEffect.counterType}`,
              tagsAdded,
              counterEffect.sourceDefinitionId,
            ),
          );
      }
      if (counterEffect.startOfRunnerTurn.kind === "lose_credits") {
        const lost = Math.min(state.runner.credits, amount);
        state.runner.credits -= lost;
        effects?.push(
          links.automaticLoseCreditsEffect(
            `runner.start.${counterEffect.counterType}`,
            "runner",
            lost,
            counterEffect.sourceDefinitionId,
          ),
        );
      }
    }
    if (!flags.startOfTurnFloatingCreditsApplied) {
      const virusCredits = virusCounterCreditsAtRunnerStart(state);
      if (virusCredits.amount > 0) {
        if (!virusCredits.sourceDefinitionId)
          throw new Error("Virus-Credit-Quelle fehlt.");
        credits(state, "runner", virusCredits.amount, {
          kind: "turn_effect",
          sourceDefinitionId: virusCredits.sourceDefinitionId,
          reason: "virus_counter_start_of_runner_turn",
        });
        effects?.push(
          links.automaticGainCreditsEffect(
            "runner.start.virus_counter_credits",
            "runner",
            virusCredits.amount,
            virusCredits.sourceDefinitionId,
          ),
        );
      }
      flags.startOfTurnFloatingCreditsApplied = true;
    }
    resumeRunnerStartOfTurnOrdering(state, effects);
  }

  function resumeRunnerStartOfTurnOrdering(
    state: GameState,
    effects?: AutomaticEffectCollector,
  ): void {
    if (state.pendingChoice) return;
    const flags = ensureRunnerTurnFlags(state);
    const resolved = new Set(flags.runnerStartOfTurnResolvedSourceIds ?? []);
    const remaining = runnerStartOfTurnSourceIds(state).filter(
      (sourceId) => !resolved.has(sourceId),
    );
    const automaticSourceId = automaticRunnerStartSourceId(
      remaining.map((sourceId) =>
        runnerStartOrderingCandidate(
          deps,
          state,
          sourceId,
          delayedAgendaAccessStartSourceIds(state).includes(sourceId),
        ),
      ),
    );
    if (automaticSourceId) {
      flags.runnerStartOfTurnResolvedSourceIds = [
        ...resolved,
        automaticSourceId,
      ].sort();
      resolveRunnerStartOfTurnSource(state, automaticSourceId, effects);
      if (state.pendingChoice) return;
      resumeRunnerStartOfTurnOrdering(state, effects);
      return;
    }
    if (remaining.length > 1) {
      startRunnerStartOfTurnOrderChoice(state, remaining);
      return;
    }
    if (remaining.length === 1) {
      const sourceId = remaining[0]!;
      flags.runnerStartOfTurnResolvedSourceIds = [...resolved, sourceId].sort();
      resolveRunnerStartOfTurnSource(state, sourceId, effects);
      if (state.pendingChoice) return;
      resumeRunnerStartOfTurnOrdering(state, effects);
      return;
    }
    if (queueIncubatorStartOfTurnTransforms(state)) return;
    if (startVirusCounterRunnerPrivateLookAtStart(state)) return;
  }

  function runnerStartOfTurnSourceIds(state: GameState): CardInstanceId[] {
    return [
      ...delayedAgendaAccessStartSourceIds(state),
      ...runnerInstalledCardIds(state).filter((sourceId) => {
        if (
          hasDueCardImplementationStartOfRunnerTurnAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            sourceId,
          )
        )
          return true;
        return hasAdditionalRunnerStartOfTurnPath(deps, state, sourceId, false);
      }),
    ].sort();
  }

  function delayedAgendaAccessStartSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return (state.delayedAccessEffects ?? [])
      .filter(
        (entry) =>
          entry.kind === "delayed_agenda_access_replacement" &&
          entry.resolveAt === "runner_start_turn" &&
          delayedAgendaAccessEntryIsDue(state, entry),
      )
      .map((entry) => entry.agendaId)
      .sort();
  }

  function delayedAgendaAccessEntryIsDue(
    state: GameState,
    entry: NonNullable<GameState["delayedAccessEffects"]>[number],
  ): boolean {
    if (entry.kind !== "delayed_agenda_access_replacement") return false;
    const instance = state.cardInstances[entry.agendaId];
    const server = state.corp.servers.find(
      (candidate) => candidate.id === entry.serverId,
    );
    return Boolean(
      instance &&
      instance.zone.side === "corp" &&
      instance.zone.zone === "serverRoot" &&
      instance.zone.serverId === entry.serverId &&
      server?.root.includes(entry.agendaId) &&
      CARD_DEFINITIONS_BY_ID[instance.definitionId]?.type === "agenda",
    );
  }

  function resolveDelayedAgendaAccessStartSource(
    state: GameState,
    agendaId: CardInstanceId,
    effects?: AutomaticEffectCollector,
  ): void {
    const entry = (state.delayedAccessEffects ?? []).find(
      (candidate) =>
        candidate.kind === "delayed_agenda_access_replacement" &&
        candidate.resolveAt === "runner_start_turn" &&
        candidate.agendaId === agendaId,
    );
    if (!entry || !delayedAgendaAccessEntryIsDue(state, entry)) return;
    const instance = state.cardInstances[agendaId]!;
    const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId]!;
    state.delayedAccessEffects = (state.delayedAccessEffects ?? []).filter(
      (candidate) => candidate !== entry,
    );
    if (state.delayedAccessEffects.length === 0)
      delete state.delayedAccessEffects;
    removeFromAllZones(state, agendaId);
    state.runner.scoreArea.push(agendaId);
    state.cardInstances[agendaId] = {
      ...instance,
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "scoreArea" },
    };
    effects?.push(
      links.automaticScoreAgendaEffect(
        `runner.start.delayed_agenda_access.${agendaId}`,
        definition.id,
        entry.sourceDefinitionId,
        deps.agendaPointsForScoredCard(state, agendaId),
      ),
    );
  }

  function startRunnerStartOfTurnOrderChoice(
    state: GameState,
    sourceIds: CardInstanceId[],
  ): void {
    const nextStateVersion = state.stateVersion + 1;
    state.pendingChoice = {
      choiceId: `runner_start_order_${nextStateVersion}`,
      side: "runner",
      source: `runner_start.order:${nextStateVersion}`,
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

  function resolveRunnerStartOfTurnOrderChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: import("@netgrid/shared").PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice?.source.startsWith("runner_start.order:"))
      throw new Error("Es ist keine Runner-Startzugreihenfolge offen.");
    if (legalAction.side !== "runner" || playerAction.side !== "runner")
      throw new Error("Nur der Runner bestimmt seine Startzugreihenfolge.");
    const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0];
    const option = choice.options.find(
      (candidate) => candidate.id === selectedId,
    );
    const sourceId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    const flags = ensureRunnerTurnFlags(state);
    const resolved = new Set(flags.runnerStartOfTurnResolvedSourceIds ?? []);
    if (
      !sourceId ||
      resolved.has(sourceId) ||
      !runnerStartOfTurnSourceIds(state).includes(sourceId)
    )
      throw new Error("Der gewählte Startzugeffekt ist nicht mehr fällig.");
    delete state.pendingChoice;
    flags.runnerStartOfTurnResolvedSourceIds = [...resolved, sourceId].sort();
    const effects: ResolvedGameEffect[] = [];
    resolveRunnerStartOfTurnSource(state, sourceId, effects);
    if (!state.pendingChoice) resumeRunnerStartOfTurnOrdering(state, effects);
    links.appendResolvedEffectsToPayload(legalAction, effects);
  }

  function resolveRunnerStartOfTurnSource(
    state: GameState,
    sourceId: CardInstanceId,
    effects?: AutomaticEffectCollector,
  ): void {
    if (delayedAgendaAccessStartSourceIds(state).includes(sourceId)) {
      resolveDelayedAgendaAccessStartSource(state, sourceId, effects);
      return;
    }
    if (!runnerInstalledCardIds(state).includes(sourceId)) return;
    executeCardImplementationStartOfRunnerTurnEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      effects,
      sourceId,
    );
    if (!runnerInstalledCardIds(state).includes(sourceId)) return;
    applyRunnerStartTurnActionEconomyEffects(state, effects, sourceId);
    if (!runnerInstalledCardIds(state).includes(sourceId)) return;
    applyStartTurnRandomEffectTables(state, effects, sourceId);
    if (!runnerInstalledCardIds(state).includes(sourceId)) return;
    const implementation = cardImplementationForDefinitionId(
      definitionFor(state, sourceId).id,
    );
    if (
      implementation?.hiddenReplacementLongtail?.kind ===
      "delayed_install_with_counter_countdown"
    ) {
      applyDelayedInstallStartOfTurn(
        deps.runnerSpecialTriggerExecutionHost(state),
        effects,
        sourceId,
      );
      if (state.pendingChoice) return;
    }
    if (
      implementation?.uniqueDirectLongtail?.kind ===
      "start_turn_trash_for_credits"
    )
      startInstalledCardTrashForCreditsChoice(
        deps.hiddenZoneNonSearchChoiceHandlerHost(state, {
          side: "runner",
          payload: {},
        } as LegalAction),
        sourceId,
      );
  }

  function applyStartTurnRandomEffectTables(
    state: GameState,
    effects?: AutomaticEffectCollector,
    onlySourceCardId?: CardInstanceId,
  ): void {
    for (const sourceId of [
      ...state.runner.rig.resources,
      ...state.runner.rig.hardware,
    ]
      .slice()
      .sort()
      .filter(
        (sourceId) => !onlySourceCardId || sourceId === onlySourceCardId,
      )) {
      const sourceDefinitionId = definitionFor(state, sourceId).id;
      const implementation = deps.runnerUtilityLongtailImplementationForCard(
        state,
        sourceId,
      );
      if (implementation?.kind !== "start_turn_random_effect_table") continue;
      const randomPurpose = `start_turn_random_effect_table.${sourceDefinitionId}.runner_start.${state.stateVersion}.${sourceId}`;
      const dieRoll = rollDeterministicDie(state, randomPurpose);
      const outcome =
        implementation.outcomes.find(
          (
            candidate: Extract<
              CardRunnerUtilityLongtailImplementation,
              { kind: "start_turn_random_effect_table" }
            >["outcomes"][number],
          ) => candidate.roll === dieRoll,
        ) ?? implementation.defaultOutcome;
      const grantsAction =
        outcome.kind === "trash_source_and_grant_persistent_extra_action";
      const dealsDamage = outcome.kind === "unpreventable_damage";
      let damageSummary: DamageSummary | undefined;
      if (grantsAction) {
        const flags = ensureRunnerTurnFlags(state);
        const modifiers = (flags.persistentModifiers ??= []);
        if (
          !modifiers.some(
            (modifier) => modifier.sourceCardInstanceId === sourceId,
          )
        ) {
          modifiers.push({
            sourceCardInstanceId: sourceId,
            sourceDefinitionId,
            kind: "runner_extra_actions_per_turn",
            amount: outcome.extraActions,
          });
          state.runner.clicks += outcome.extraActions;
        }
        deps.trashRunnerInstalledCardToHeap(state, sourceId);
      } else if (dealsDamage) {
        damageSummary = doDamage(state, {
          damageId: `runner.start.${sourceDefinitionId}.${outcome.damageType}.${state.stateVersion}`,
          damageType: outcome.damageType,
          amount: outcome.amount,
          source: `runner_start:${sourceDefinitionId}`,
        });
      }
      effects?.push({
        effectId: `runner.start.random_effect_table.${sourceId}`,
        kind: grantsAction
          ? "gain_actions"
          : dealsDamage
            ? "damage"
            : "counter_change",
        visibility: "public",
        side: "runner",
        amount: grantsAction
          ? outcome.extraActions
          : (damageSummary?.amount ?? 0),
        reason: "start_of_turn",
        sourceDefinitionId,
        sourceTitle: links.publicCardTitle(sourceDefinitionId),
        dieRoll,
        randomEffectOutcome: grantsAction
          ? "permanent_action"
          : dealsDamage
            ? `${outcome.damageType}_damage`
            : "no_effect",
        randomPurpose,
        randomCounterAfter: state.randomCounter,
        ...(grantsAction
          ? {
              permanentActionGain: true,
              sourceTrashed: true,
              runnerClicksAfter: state.runner.clicks,
            }
          : {}),
        ...(damageSummary
          ? {
              damageCannotBePrevented: true,
              damageType: damageSummary.damageType,
              cardsTrashed: damageSummary.cardsTrashed,
              flatline: damageSummary.flatline,
              ...(damageSummary.coreDamageAfter !== undefined
                ? { coreDamageAfter: damageSummary.coreDamageAfter }
                : {}),
            }
          : {}),
      });
    }
  }

  function applyRunnerStartTurnActionEconomyEffects(
    state: GameState,
    effects?: AutomaticEffectCollector,
    onlySourceCardId?: CardInstanceId,
  ): void {
    for (const sourceId of state.runner.rig.hardware.slice().sort()) {
      if (onlySourceCardId && sourceId !== onlySourceCardId) continue;
      const definition = definitionFor(state, sourceId);
      const longtail = cardImplementationForDefinitionId(
        definition.id,
      )?.uniqueDirectLongtail;
      if (
        longtail?.kind !==
        "runner_start_turn_drip_counter_action_or_core_damage"
      )
        continue;
      const current = cardCounter(state, sourceId, "drip");
      if (current >= longtail.threshold) {
        setCardCounter(state, sourceId, "drip", 0);
        const damageSummary = doDamage(state, {
          damageId: `runner.start.${definition.id}.drip_core.${state.stateVersion}`,
          damageType: "core",
          amount: 1,
          source: `runner_start:${definition.id}`,
        });
        effects?.push({
          effectId: `runner.start.drip.${sourceId}`,
          kind: "damage",
          visibility: "public",
          side: "runner",
          amount: 1,
          reason: "start_of_turn",
          counterType: "drip",
          remainingCounters: 0,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          damageCannotBePrevented: true,
          damageType: "core",
          cardsTrashed: damageSummary.cardsTrashed,
          ...(damageSummary.coreDamageAfter !== undefined
            ? { coreDamageAfter: damageSummary.coreDamageAfter }
            : {}),
        });
      } else {
        setCardCounter(state, sourceId, "drip", current + 1);
        state.runner.clicks += 1;
        effects?.push({
          effectId: `runner.start.drip.${sourceId}`,
          kind: "gain_actions",
          visibility: "public",
          side: "runner",
          amount: 1,
          reason: "start_of_turn",
          counterType: "drip",
          remainingCounters: current + 1,
          addedCounterAmount: 1,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
        });
      }
    }

    for (const sourceId of state.runner.rig.resources.slice().sort()) {
      if (onlySourceCardId && sourceId !== onlySourceCardId) continue;
      const definition = definitionFor(state, sourceId);
      const longtail = cardImplementationForDefinitionId(
        definition.id,
      )?.uniqueDirectLongtail;
      if (longtail?.kind !== "runner_start_turn_forced_random_action") continue;
      const randomPurpose = `action_economy.${definition.id}.runner_start.${state.stateVersion}.${sourceId}`;
      const dieRoll = rollDeterministicDie(state, randomPurpose);
      const grant = runnerForcedActionGrantForRoll(
        state,
        sourceId,
        definition.id,
        dieRoll,
      );
      if (!grant) continue;
      addTurnBoundExtraActionGrant(state, {
        side: "runner",
        sourceCardInstanceId: sourceId,
        sourceDefinitionId: definition.id,
        restriction: grant.restriction,
        forced: true,
        dieRoll,
        randomPurpose,
        ...(grant.targetServerId
          ? { targetServerId: grant.targetServerId }
          : {}),
        ...(grant.targetCardInstanceId
          ? { targetCardInstanceId: grant.targetCardInstanceId }
          : {}),
        ...(grant.revealToCorpOnly ? { revealToCorpOnly: true } : {}),
      });
      effects?.push({
        effectId: `runner.start.forced_action.${sourceId}`,
        kind: "gain_actions",
        visibility: "public",
        side: "runner",
        amount: 1,
        reason: "start_of_turn",
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
        dieRoll,
        randomPurpose,
        randomCounterAfter: state.randomCounter,
        restrictedActionFamily: grant.restriction,
        ...(grant.targetServerId ? { serverId: grant.targetServerId } : {}),
      });
    }
  }

  function runnerForcedActionGrantForRoll(
    state: GameState,
    sourceId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    dieRoll: number,
  ):
    | {
        restriction: RestrictedActionFamily;
        targetServerId?: Exclude<ServerId, "new_remote">;
        targetCardInstanceId?: CardInstanceId;
        revealToCorpOnly?: boolean;
      }
    | undefined {
    void sourceId;
    const longtail =
      cardImplementationForDefinitionId(
        sourceDefinitionId,
      )?.uniqueDirectLongtail;
    if (longtail?.kind !== "runner_start_turn_forced_random_action")
      throw new Error("Die erzwungene Zufallsaktion besitzt keinen Vertrag.");
    if (longtail.mustTakeIfPossible !== true)
      throw new Error(
        "Die Zufallsaktion muss als verpflichtend deklariert sein.",
      );
    const outcomes = longtail.outcomes;
    if (
      outcomes.length !== 6 ||
      new Set(outcomes.map((outcome) => outcome.dieRoll)).size !== 6 ||
      outcomes.some(
        (outcome) =>
          !Number.isInteger(outcome.dieRoll) ||
          outcome.dieRoll < 1 ||
          outcome.dieRoll > 6,
      )
    )
      throw new Error("Die Zufallsaktionstabelle ist nicht vollständig.");
    const outcome = outcomes.find((entry) => entry.dieRoll === dieRoll);
    if (!outcome)
      throw new Error(
        "Die Zufallsaktionstabelle besitzt dieses Würfelergebnis nicht.",
      );
    if (outcome.action === "draw_card") return { restriction: "draw_card" };
    if (outcome.action === "gain_credit") return { restriction: "gain_credit" };
    if (outcome.action === "make_run_rd")
      return { restriction: "start_run", targetServerId: "rd" };
    if (outcome.action === "make_run_hq")
      return { restriction: "start_run", targetServerId: "hq" };
    if (outcome.action === "make_run_remote") {
      const hasRemote = state.corp.servers.some(
        (server) => server.kind === "remote",
      );
      if (!hasRemote) return undefined;
      return { restriction: "start_run_remote" };
    }
    if (
      outcome.action !== "reveal_random_grip_card_to_corp_and_play_or_install"
    )
      throw new Error(
        "Die Zufallsaktionstabelle enthält eine unbekannte Aktion.",
      );
    const target = randomRunnerGripCardId(
      state,
      "runner_forced_action.random_grip",
    );
    if (!target) return undefined;
    return {
      restriction: "play_or_install_card",
      targetCardInstanceId: target,
      revealToCorpOnly: true,
    };
  }

  function randomRunnerGripCardId(
    state: GameState,
    purpose: string,
  ): CardInstanceId | undefined {
    if (state.runner.grip.length === 0) return undefined;
    const value = nextRandom(state, `${purpose}.${state.stateVersion}`);
    return state.runner.grip[Math.floor(value * state.runner.grip.length)];
  }

  function virusCounterCreditsAtRunnerStart(state: GameState): {
    amount: number;
    sourceDefinitionId?: CardDefinitionId;
  } {
    return CARD_IMPLEMENTATIONS.reduce(
      (result, cardImplementation) => {
        const virusCounter = cardImplementation.virusCounter;
        const start = virusCounter?.startOfRunnerTurn;
        if (
          !virusCounter ||
          start?.kind !== "gain_credits_per_two_counters" ||
          virusCounter.addOnSuccessfulRun?.counterScope.kind !==
            "shared_corp_pool"
        )
          return result;
        const counterAmount = Math.max(
          0,
          Math.floor(
            state.purgeableRunnerVirusCounters?.corp?.[
              virusCounter.counterKind as PurgeableRunnerVirusCounterType
            ] ?? 0,
          ),
        );
        const amount =
          Math.floor(counterAmount / start.perCounters) * start.amountPerGroup;
        return {
          amount: result.amount + amount,
          sourceDefinitionId:
            result.sourceDefinitionId ?? cardImplementation.cardDefinitionId,
        };
      },
      { amount: 0 } as {
        amount: number;
        sourceDefinitionId?: CardDefinitionId;
      },
    );
  }

  function startVirusCounterRunnerPrivateLookAtStart(
    state: GameState,
  ): boolean {
    const boardwalk = CARD_IMPLEMENTATIONS.reduce(
      (result, cardImplementation) => {
        const virusCounter = cardImplementation.virusCounter;
        const start = virusCounter?.startOfRunnerTurn;
        if (
          !virusCounter ||
          start?.kind !== "random_reveal_hq_cards_per_two_counters" ||
          virusCounter.addOnSuccessfulRun?.counterScope.kind !==
            "shared_corp_pool"
        )
          return result;
        const counterAmount = Math.max(
          0,
          Math.floor(
            state.purgeableRunnerVirusCounters?.corp?.[
              virusCounter.counterKind as PurgeableRunnerVirusCounterType
            ] ?? 0,
          ),
        );
        const amount =
          Math.floor(counterAmount / start.perCounters) * start.countPerGroup;
        return {
          amount: result.amount + amount,
          sourceDefinitionId:
            result.sourceDefinitionId ?? cardImplementation.cardDefinitionId,
        };
      },
      { amount: 0 } as {
        amount: number;
        sourceDefinitionId?: CardDefinitionId;
      },
    );
    if (boardwalk.amount > 0 && state.corp.hq.length > 0) {
      const selected = randomCorpHqCardsWithoutReplacement(
        state,
        Math.min(boardwalk.amount, state.corp.hq.length),
        `p3_49.random.boardwalk.hq_reveal.${state.stateVersion}`,
      );
      return startRunnerPrivateLookAtSpecificCorpCards(
        state,
        boardwalk.sourceDefinitionId ??
          definitionFor(state, state.runner.identity).id,
        "hq",
        selected,
        "Boardwalk: zufällige HQ-Karten ansehen.",
      );
    }

    const privateRdLookSource = CARD_IMPLEMENTATIONS.find((implementation) => {
      const virusCounter = implementation.virusCounter;
      const start = virusCounter?.startOfRunnerTurn;
      return (
        start?.kind === "private_look_top_rd_at_threshold" &&
        virusCounter?.addOnSuccessfulRun?.counterScope.kind ===
          "shared_corp_pool" &&
        Math.max(
          0,
          Math.floor(
            state.purgeableRunnerVirusCounters?.corp?.[
              virusCounter.counterKind as PurgeableRunnerVirusCounterType
            ] ?? 0,
          ),
        ) >= start.threshold
      );
    });
    if (!privateRdLookSource || state.corp.rd.length === 0) return false;
    return startRunnerPrivateLookAtSpecificCorpCards(
      state,
      privateRdLookSource.cardDefinitionId,
      "rd",
      state.corp.rd.slice(0, 1),
      "Deep Thought: oberste R&D-Karte ansehen.",
    );
  }

  function randomCorpHqCardsWithoutReplacement(
    state: GameState,
    count: number,
    purpose: string,
  ): CardInstanceId[] {
    const pool = state.corp.hq.slice();
    const selected: CardInstanceId[] = [];
    const limit = Math.min(Math.max(0, Math.floor(count)), pool.length);
    for (let index = 0; index < limit; index += 1) {
      const value = nextRandom(state, `${purpose}.${index}`);
      const selectedIndex = Math.floor(value * pool.length);
      const [cardId] = pool.splice(selectedIndex, 1);
      if (cardId) selected.push(cardId);
    }
    return selected;
  }

  function startRunnerPrivateLookAtSpecificCorpCards(
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    zone: Extract<ServerId, "rd" | "hq">,
    cardIds: CardInstanceId[],
    prompt: string,
  ): boolean {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const visibleIds = cardIds.filter((cardId) => {
      const instance = state.cardInstances[cardId];
      return instance?.owner === "corp";
    });
    if (visibleIds.length === 0) return false;
    state.pendingChoice = {
      choiceId: `p3_49_virus_private_look_${zone}_${state.stateVersion + 1}`,
      side: "runner",
      source: `p3_33.private_look:ability:${sourceDefinitionId}:${zone}:${state.stateVersion + 1}`,
      prompt,
      kind: "select_cards",
      options: [
        ...visibleIds.map((cardId) => ({
          id: `card_${cardId}`,
          label: definitionFor(state, cardId).title,
          publicLabel: "Verdeckte Korp-Karte",
          value: cardId,
          selectable: false,
        })),
        { id: "done", label: "Fertig", publicLabel: "Fertig", value: "done" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    return true;
  }

  function queueIncubatorStartOfTurnTransforms(state: GameState): boolean {
    const flags = ensureRunnerTurnFlags(state);
    if (flags.incubatorPendingTransforms === undefined) {
      const counterTotal = deps.incubatorCounterTotal(state);
      if (counterTotal <= 0) {
        flags.incubatorPendingTransforms = 0;
        return false;
      }
      const sourceDefinitionId = uniqueVirusCounterOwnerDefinitionId(
        "incubator_duplicate_virus_counter",
      );
      let pending = 0;
      for (let index = 0; index < counterTotal; index += 1) {
        const die = rollDeterministicDie(
          state,
          `virus_counter.${sourceDefinitionId}.start_of_turn.roll.${state.stateVersion}.${index}`,
        );
        if (die === 6) pending += 1;
      }
      flags.incubatorPendingTransforms = pending;
    }
    if ((flags.incubatorPendingTransforms ?? 0) <= 0) return false;
    return startIncubatorTransformChoice(state);
  }

  function uniqueVirusCounterOwnerDefinitionId(
    startKind: "incubator_duplicate_virus_counter",
  ): CardDefinitionId {
    const ownerDefinitionIds = CARD_IMPLEMENTATIONS.filter((implementation) => {
      const virusCounter = implementation.virusCounter;
      return (
        virusCounter?.startOfRunnerTurn?.kind === startKind &&
        virusCounter.startOfRunnerTurn.rollPerCounter === true &&
        virusCounter.startOfRunnerTurn.successDieValue === 6 &&
        virusCounter.addOnSuccessfulRun?.counterScope.kind ===
          "shared_corp_pool"
      );
    }).map((implementation) => implementation.cardDefinitionId);
    if (ownerDefinitionIds.length !== 1)
      throw new Error(
        `Expected exactly one installed virus-counter owner for ${startKind}; received ${ownerDefinitionIds.length}.`,
      );
    return ownerDefinitionIds[0]!;
  }

  function startIncubatorTransformChoice(state: GameState): boolean {
    const flags = ensureRunnerTurnFlags(state);
    const pending = Math.max(
      0,
      Math.floor(flags.incubatorPendingTransforms ?? 0),
    );
    if (pending <= 0) return false;

    const cardTargets = Object.keys(state.cardInstances)
      .sort()
      .filter((cardId) => cardCounter(state, cardId, "virus") > 0)
      .filter((cardId) =>
        deps.isVisibleVirusCounterCardForRunner(state, cardId),
      )
      .map((cardId) => {
        const title = definitionFor(state, cardId).title;
        const amount = cardCounter(state, cardId, "virus");
        return {
          id: `card_${cardId}`,
          label: `${title} (${amount})`,
          publicLabel: "Virus-Counter",
          value: `card:${cardId}`,
        };
      });

    const poxTargets = state.corp.servers
      .map((server) => ({
        serverId: server.id,
        amount: deps.poxCountersForServer(state, server.id),
      }))
      .filter((entry) => entry.amount > 0)
      .map((entry) => ({
        id: `pox_${entry.serverId}`,
        label: `Pox auf ${publicServerLabel(state, entry.serverId) ?? entry.serverId} (${entry.amount})`,
        publicLabel: "Virus-Counter",
        value: `pox:${entry.serverId}`,
      }));

    const faitTargets = state.corp.servers
      .map((server) => ({
        serverId: server.id,
        amount: Math.max(
          0,
          Math.floor(state.serverAgendaCostCountersByServer?.[server.id] ?? 0),
        ),
      }))
      .filter((entry) => entry.amount > 0)
      .map((entry) => ({
        id: `fait_${entry.serverId}`,
        label: `Fait auf ${publicServerLabel(state, entry.serverId) ?? entry.serverId} (${entry.amount})`,
        publicLabel: "Virus-Counter",
        value: `fait:${entry.serverId}`,
      }));

    const sharedCorpPoolTargets = Object.entries(
      state.purgeableRunnerVirusCounters?.corp ?? {},
    )
      .filter((entry): entry is [PurgeableRunnerVirusCounterType, number] =>
        Number.isFinite(entry[1]),
      )
      .map(([counterType, rawAmount]) => ({
        counterType,
        amount: Math.max(0, Math.floor(rawAmount)),
      }))
      .filter((entry) => entry.amount > 0)
      .sort((left, right) => left.counterType.localeCompare(right.counterType))
      .map((entry) => ({
        id: `corp_pool_${entry.counterType}`,
        label: `${entry.counterType} (${entry.amount})`,
        publicLabel: "Virus-Counter",
        value: `corp_pool:${entry.counterType}`,
      }));

    const options = [
      ...cardTargets,
      ...poxTargets,
      ...faitTargets,
      ...sharedCorpPoolTargets,
    ];
    if (options.length === 0) {
      flags.incubatorPendingTransforms = 0;
      return false;
    }

    state.pendingChoice = {
      choiceId: `v191_incubator_transform_${state.stateVersion + 1}_${pending}`,
      side: "runner",
      source: `v191.incubator_transform:${state.stateVersion + 1}`,
      prompt: "Incubator: Wähle einen Virus-Counter für die Verdopplung.",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    return true;
  }

  return {
    startRunnerTurn,
    returnCorpTemporaryInstallRezCredits,
    untapRunnerCardsAtTurnStart,
    resolveDelayedAccessEffects,
    applyRunnerStartOfTurnEffects,
    applyStartTurnRandomEffectTables,
    applyRunnerStartTurnActionEconomyEffects,
    resolveRunnerStartOfTurnOrderChoice,
    resumeRunnerStartOfTurnOrdering,
    runnerForcedActionGrantForRoll,
    randomRunnerGripCardId,
    virusCounterCreditsAtRunnerStart,
    startVirusCounterRunnerPrivateLookAtStart,
    randomCorpHqCardsWithoutReplacement,
    startRunnerPrivateLookAtSpecificCorpCards,
    queueIncubatorStartOfTurnTransforms,
    startIncubatorTransformChoice,
  };
}
