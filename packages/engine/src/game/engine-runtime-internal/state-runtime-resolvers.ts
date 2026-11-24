import {
  CARD_VIRUS_COUNTER_TYPES,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CounterType,
  type EffectCommand,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type ModifierKind,
  type ServerId,
  type Side,
  type TraceId,
} from "@netgrid/shared";
import {
  closeRunnerCostPenaltySupportWindowForPayment as closeRunnerCostPenaltySupportWindowForPaymentHelper,
  openRunnerCostPenaltySupportWindow as openRunnerCostPenaltySupportWindowHelper,
  runnerCostPenaltySupportCreditCapacity as runnerPaymentSupportCreditCapacity,
} from "../payment/runner-payment-support";
import { validatedEncounterTemporaryTraceCreditRemainder } from "../trace/encounter-temporary-trace-credits";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  definitionFor,
  mustInstance,
  mustRun,
  mustServer,
  runnerInstalledCardIds,
} from "../state/card-server-lookup";
import { drawCorpCards } from "../state/draw-random";
import { spendCredits } from "../state/economy-mutation";
import { applyCreditGain } from "../economy/credit-gain";
import {
  abilityUsageSourceUsed,
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
import {
  RESTRICTED_ACTION_GRANT_KEYS,
  spendRestrictedActionGrantTemporaryCredits,
} from "../state/restricted-action-grants";
import { purgeVirusCounters } from "../turn/turn-basic-execution";
import {
  createDamageImminentEvent,
  doDamage,
  openDamageResolutionWindow,
  openRunnerInstalledTrashPreventionWindow,
  createRunnerInstalledTrashImminentEvent,
  resolveDamageImminentEvent,
  resolveRunnerInstalledTrashImminentEvent,
  setDamagePayload,
} from "../damage/damage-core";
import {
  hostedPaymentCredits,
  restrictedHostedCreditSourceForDefinition,
  restrictedHostedCreditSourceIds,
  restrictedHostedCredits,
  spendHostedPaymentCredits,
  spendRestrictedHostedCredits,
} from "../run/run-duration-payment";
import {
  runnerInstallPaymentSourcePaymentsFromPayload,
  runnerProgramInstallOptionalCreditSourceIds,
  type RunnerInstallCreditSpendResult,
} from "../install/runner-program-install-payment";
import { hiddenRunnerResourceSlotId, isConcealedRunnerResource } from "../view/card-view";
import { publicServerLabel } from "../view/server-view";
import type {
  AutomaticEffectCollector,
  RuntimeDeps,
  VirusCounterPurgePreserveTarget,
  VisibleCounterPayload,
} from "./runtime-shared";
import { cloneState } from "./runtime-bootstrap-support";

export function createStateRuntimeResolvers(
  deps: RuntimeDeps,
): import("./state-runtime-resolver-port").StateRuntimeResolverPort {
  function resolveTraceHardwareWreckerSuccess(
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    sourceCardInstanceId: CardInstanceId,
    traceId: TraceId,
    damageAmount: number,
    legalAction: LegalAction,
  ): {
    payload: NonNullable<LegalAction["payload"]>;
    suspended: boolean;
  } {
    if (!Number.isInteger(damageAmount) || damageAmount <= 0)
      throw new Error("Trace-Hardware-Wrecker-Damage ist ungültig.");
    const hardwareIds = state.runner.rig.hardware.slice().sort();
    state.pendingTraceHardwareWreckerContinuation = {
      sourceDefinitionId,
      sourceCardInstanceId,
      traceId,
      damageAmount,
      stage: "select_hardware",
    };
    const payload = {
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
      sourceDefinitionId,
      trashedCardType: "hardware",
      damageCannotBePrevented: true,
      printedDamageAmount: damageAmount,
    };
    if (hardwareIds.length === 0) {
      legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
      resolveTraceHardwareWreckerDamage(state, legalAction);
      return { payload: legalAction.payload ?? payload, suspended: false };
    }
    state.pendingChoice = {
      choiceId: `trace_hardware_wrecker_${traceId}_${state.stateVersion + 1}`,
      side: "corp",
      source: `trace_success.hardware_wrecker:${traceId}`,
      prompt: "Wähle die Hardware, die getrasht wird.",
      kind: "select_cards",
      options: hardwareIds.map((cardId) => ({
        id: `hardware_${cardId}`,
        cardId,
        label: definitionFor(state, cardId).title,
        value: cardId,
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    state.activeSide = "corp";
    return {
      payload: { ...payload, hardwareTrashChoiceOpened: true },
      suspended: true,
    };
  }

  function resolveTraceHardwareWreckerTargetChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const continuation = state.pendingTraceHardwareWreckerContinuation;
    const choice = state.pendingChoice;
    if (
      !continuation ||
      continuation.stage !== "select_hardware" ||
      choice?.source !== `trace_success.hardware_wrecker:${continuation.traceId}` ||
      choice.choiceId !== `trace_hardware_wrecker_${continuation.traceId}_${choice.stateVersion}`
    )
      throw new Error("Es ist keine Trace-Hardware-Auswahl offen.");
    if (legalAction.side !== "corp" || playerAction.side !== "corp")
      throw new Error("Nur die Corp wählt die zu trashende Hardware.");
    const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0];
    const targetHardwareId = choice.options.find(
      (option) => option.id === selectedId,
    )?.value as CardInstanceId | undefined;
    if (
      !targetHardwareId ||
      !state.runner.rig.hardware.includes(targetHardwareId)
    )
      throw new Error("Die gewählte Hardware ist nicht mehr installiert.");
    const targetDefinitionId = definitionFor(state, targetHardwareId).id;
    delete state.pendingChoice;
    state.pendingTraceHardwareWreckerContinuation = {
      ...continuation,
      stage: "trash_prevention",
      targetHardwareId,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
      sourceDefinitionId: continuation.sourceDefinitionId,
      selectedHardwareDefinitionId: targetDefinitionId,
      trashedCardType: "hardware",
      damageCannotBePrevented: true,
      printedDamageAmount: continuation.damageAmount,
    };
    if (
      openRunnerInstalledTrashPreventionWindow(
        state,
        legalAction,
        [targetHardwareId],
        `trace_success:${continuation.sourceDefinitionId}`,
      )
    )
      return;
    const event = createRunnerInstalledTrashImminentEvent(
      state,
      [targetHardwareId],
      `trace_success:${continuation.sourceDefinitionId}`,
    );
    resolveRunnerInstalledTrashImminentEvent(state, event, legalAction, []);
    resolveTraceHardwareWreckerDamage(state, legalAction);
  }

  function resumeTraceHardwareWreckerAfterTrash(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const continuation = state.pendingTraceHardwareWreckerContinuation;
    if (!continuation || continuation.stage !== "trash_prevention")
      throw new Error("Es ist keine Trace-Hardware-Trash-Fortsetzung offen.");
    if (state.pendingChoice || state.eventModificationWindow)
      throw new Error(
        "Das Hardware-Trash-Fenster ist noch nicht abgeschlossen.",
      );
    resolveTraceHardwareWreckerDamage(state, legalAction);
  }

  function resolveTraceHardwareWreckerDamage(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const continuation = state.pendingTraceHardwareWreckerContinuation;
    if (!continuation)
      throw new Error("Trace-Hardware-Wrecker-Fortsetzung fehlt.");
    delete state.pendingTraceHardwareWreckerContinuation;
    const event = createDamageImminentEvent(state, {
      damageId: `${continuation.traceId}.${continuation.sourceCardInstanceId}.unpreventable_meat`,
      damageType: "meat",
      amount: continuation.damageAmount,
      source: `trace_success:${continuation.sourceDefinitionId}`,
      randomSource: ["c", continuation.sourceDefinitionId, continuation.sourceCardInstanceId],
    });
    event.payload = { ...event.payload, cannotBePrevented: true };
    if (openDamageResolutionWindow(state, event, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, event);
    setDamagePayload(legalAction, summary);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
      sourceDefinitionId: continuation.sourceDefinitionId,
      damageCannotBePrevented: true,
      printedDamageAmount: continuation.damageAmount,
    };
    if (!state.winner) state.activeSide = "runner";
  }

  function resolveTraceTrashRunnerResourceSuccess(
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    sourceCardInstanceId: CardInstanceId,
    traceId: TraceId,
    targetCardId: CardInstanceId | undefined,
  ): NonNullable<LegalAction["payload"]> {
    if (
      !targetCardId ||
      !deps.runnerLastTurnInstalledResourceIds(state).includes(targetCardId)
    )
      throw new Error(
        "Die Runner-Resource ist fuer diesen Trace nicht mehr legal.",
      );
    const hiddenResource = isConcealedRunnerResource(state, targetCardId);
    const hiddenResourceSlotId = hiddenRunnerResourceSlotId(
      state,
      targetCardId,
    );
    const targetDefinitionId = definitionFor(state, targetCardId).id;
    deps.trashRunnerInstalledCardToHeap(state, targetCardId);
    return {
      traceSuccessEffect: "trash_runner_resource_and_add_tag",
      sourceDefinitionId,
      sourceCardInstanceId,
      traceId,
      trashedCardType: "resource",
      trashedCount: 1,
      trashedCardDefinitionId: targetDefinitionId,
      ...(hiddenResource
        ? {
            hiddenResourceSlotId,
            hiddenRunnerResource: true,
            hiddenRunnerResourceRevealed: true,
            redactedKind: "hidden_runner_resource",
          }
        : {}),
    };
  }

  function encounterTemporaryTraceCreditsAvailable(
    state: GameState,
    trace: NonNullable<GameState["trace"]>,
  ): number {
    const credits = state.run?.encounterTemporaryTraceCredits;
    if (
      !credits ||
      credits.sourceIceId !== trace.sourceCardInstanceId ||
      credits.sourceIceId !== trace.encounterTemporaryTraceCreditSourceIceId
    )
      return 0;
    return validatedEncounterTemporaryTraceCreditRemainder(credits);
  }

  function spendEncounterTemporaryTraceCredits(
    state: GameState,
    trace: NonNullable<GameState["trace"]>,
    amount: number,
  ): number {
    const credits = state.run?.encounterTemporaryTraceCredits;
    if (
      !credits ||
      credits.sourceIceId !== trace.sourceCardInstanceId ||
      amount <= 0
    )
      return 0;
    const available = validatedEncounterTemporaryTraceCreditRemainder(credits);
    const spent = Math.min(Math.max(0, Math.floor(amount)), available);
    credits.remaining = available - spent;
    return spent;
  }

  function identityModifierAmount(
    state: GameState,
    side: Side,
    kind: ModifierKind,
    duration: "setup" | "static",
  ): number {
    const identity = identityDefinition(state, side);
    return (identity.modifiers ?? [])
      .filter(
        (modifier) =>
          modifier.side === side &&
          modifier.kind === kind &&
          modifier.duration === duration,
      )
      .reduce((sum, modifier) => {
        if (!Number.isInteger(modifier.amount))
          throw new Error("Identity-Modifier ist ungueltig.");
        return sum + modifier.amount;
      }, 0);
  }

  function identityDefinition(state: GameState, side: Side): CardDefinition {
    return definitionFor(
      state,
      side === "runner" ? state.runner.identity : state.corp.identity,
    );
  }

  function executeEffectCommands(
    state: GameState,
    commands: EffectCommand[],
  ): void {
    for (const [commandIndex, command] of commands.entries()) {
      switch (command.type) {
        case "gain_credits":
          assertNonNegativeAmount(command.amount);
          applyCreditGain(state, {
            side: command.side,
            baseAmount: command.amount,
            source: {
              kind: "rule_effect",
              reason: "effect_command",
            },
          });
          break;
        case "spend_credits":
          assertNonNegativeAmount(command.amount);
          spendCredits(state, command.side, command.amount);
          break;
        case "draw_card":
          if (command.side === "corp") {
            drawCorpCards(state, command.amount ?? 1);
            const remainingCommands = commands.slice(commandIndex + 1);
            if (state.pendingCorpDraw && remainingCommands.length > 0) {
              state.pendingCorpDraw.continuation = {
                kind: "effect_commands",
                remainingCommands,
              };
              return;
            }
          } else {
            deps.drawRunnerCards(state, command.amount ?? 1);
          }
          break;
        case "do_damage":
          doDamage(state, {
            damageId: `effect.${command.source ?? "unknown"}.${state.stateVersion}.${state.randomCounter}`,
            damageType: command.damageType,
            amount: command.amount,
            source: command.source ?? "effect_command",
            randomSource: command.randomSource,
          });
          break;
        case "remove_tag":
          assertNonNegativeAmount(command.amount);
          state.runner.tags = Math.max(0, state.runner.tags - command.amount);
          break;
        case "change_breaker_strength":
          mustInstance(
            state.cardInstances,
            command.breakerId,
          ).strengthModifier += command.amount;
          break;
        case "break_subroutine": {
          const run = mustRun(state);
          if (!run.brokenSubroutineIndexes.includes(command.subroutineIndex))
            run.brokenSubroutineIndexes.push(command.subroutineIndex);
          break;
        }
        case "set_pending_choice":
          if (state.pendingChoice)
            throw new Error("Es ist bereits eine Choice offen.");
          state.pendingChoice = cloneState(command.choice);
          break;
        case "complete_pending_choice":
          if (
            !state.pendingChoice ||
            state.pendingChoice.choiceId !== command.choiceId
          )
            throw new Error("Diese Choice ist nicht offen.");
          delete state.pendingChoice;
          break;
        case "emit_event":
          throw new Error(
            "Effect-Event-Emission wird in V0.93 nur spezifiziert, aber nicht vom State-Only-Executor geschrieben.",
          );
      }
    }
  }

  function assertNonNegativeAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error("Effect amount ist ungueltig.");
  }

  function assertPositiveIntegerAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Damage amount ist ungueltig.");
  }

  function withoutVariableIceState(instance: CardInstance): CardInstance {
    const { variableIceState: _variableIceState, ...rest } = instance;
    void _variableIceState;
    return rest;
  }

  function clickCostForAction(legalAction: LegalAction): number {
    return legalAction.costs.reduce(
      (sum, cost) =>
        sum + (Number.isInteger(cost.clicks) && cost.clicks ? cost.clicks : 0),
      0,
    );
  }

  function creditCostForAction(legalAction: LegalAction): number {
    return legalAction.costs.reduce(
      (sum, cost) =>
        sum +
        (Number.isInteger(cost.credits) && cost.credits ? cost.credits : 0),
      0,
    );
  }

  function runnerActionsPerTurn(state: GameState): number {
    const override = Math.floor(state.runnerActionsPerTurnOverride ?? 4);
    return Math.max(0, override);
  }

  function agendaPoints(state: GameState, side: Side): number {
    const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
    const scoredPoints = ids.reduce(
      (sum, id) => sum + deps.agendaPointsForScoredCard(state, id),
      0,
    );
    return side === "corp"
      ? scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
      : scoredPoints;
  }

  function addVirusCounterWithCounterPrevention(
    state: GameState,
    targetCardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
    legalAction?: LegalAction,
  ): number {
    if (!Number.isInteger(amount) || amount < 0)
      throw new Error("Virus-Counter amount ist ungueltig.");
    let added = 0;
    let prevented = 0;
    let creditsPaid = 0;
    let preventionChargesSpent = 0;
    for (let index = 0; index < amount; index += 1) {
      const prevention = preventOneVirusCounterWithCounterPrevention(state, {
        kind: "card",
        cardId: targetCardId,
        counterType,
      });
      if (prevention.deferred) continue;
      if (prevention.prevented) {
        prevented += 1;
        creditsPaid += prevention.creditsPaid;
        preventionChargesSpent += prevention.preventionChargesSpent;
        continue;
      }
      addCardCounter(state, targetCardId, counterType, 1);
      added += 1;
    }
    if (legalAction && prevented > 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        virusCounterAvoided: prevented,
        counterPreventionCreditsPaid: creditsPaid,
        runnerVirusCounterPreventionChargesSpent: preventionChargesSpent,
        corpRunnerVirusCounterPreventionChargesAfter:
          state.corpRunnerVirusCounterPreventionCharges ?? 0,
        corpCreditsAfter: state.corp.credits,
      };
    }
    return added;
  }

  type VirusCounterPreventionTarget = NonNullable<
    GameState["pendingVirusCounterPrevention"]
  >["targets"][number];

  function counterPreventionSourceIds(state: GameState): CardInstanceId[] {
    const flags = ensureCorpTurnFlags(state);
    return deps
      .rezzedCorpRootCardIds(state)
      .filter((cardId: CardInstanceId) => {
        const utility = deps.corpUtilityImplementationForCard(state, cardId);
        return (
          utility?.kind === "counter_prevention_replacement" &&
          utility.cost.kind === "credit" &&
          utility.cost.amount <= state.corp.credits &&
          !abilityUsageSourceUsed(
            flags.counterPreventionUsedSourceIdsThisTurn,
            cardId,
          )
        );
      })
      .sort();
  }

  function consumeStoredVirusCounterPreventionCharge(
    state: GameState,
  ): boolean {
    const storedCharges = Math.max(
      0,
      Math.floor(state.corpRunnerVirusCounterPreventionCharges ?? 0),
    );
    if (storedCharges <= 0) return false;
    const remaining = storedCharges - 1;
    if (remaining > 0)
      state.corpRunnerVirusCounterPreventionCharges = remaining;
    else delete state.corpRunnerVirusCounterPreventionCharges;
    return true;
  }

  function startVirusCounterPreventionChoice(state: GameState): void {
    const continuation = state.pendingVirusCounterPrevention;
    const target = continuation?.targets[0];
    if (!target)
      throw new Error("Der Virus-Counter-Prevention fehlt ihr Ziel.");
    if (state.pendingChoice)
      throw new Error(
        "Vor Virus-Counter-Prevention ist bereits eine Choice offen.",
      );
    const sourceIds = counterPreventionSourceIds(state);
    if (sourceIds.length === 0)
      throw new Error("Virus-Counter-Prevention hat keine legale Quelle.");
    state.pendingChoice = {
      choiceId: `virus_counter_prevention_${state.stateVersion + 1}`,
      side: "corp",
      source: "card_implementation.counter_prevention_replacement",
      prompt: "Virus-Counter vermeiden?",
      presentationKey: "counter_prevention",
      kind: "select_option",
      options: [
        {
          id: "pass",
          label: "Virus-Counter erhalten",
          publicLabel: "Virus-Counter erhalten",
          value: "pass",
        },
        ...sourceIds.map((sourceId) => {
          const definition = definitionFor(state, sourceId);
          return {
            id: `prevent_${sourceId}`,
            label: `${definition.title}: 1 Credit zahlen`,
            publicLabel: `${definition.title}: 1 Credit zahlen`,
            value: sourceId,
            metadata: { cardTitle: definition.title },
          };
        }),
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
  }

  function applyVirusCounterPreventionTarget(
    state: GameState,
    target: VirusCounterPreventionTarget,
  ): void {
    switch (target.kind) {
      case "card":
        addCardCounter(state, target.cardId, target.counterType, 1);
        return;
      case "corp_pool": {
        const bucket = ((state.purgeableRunnerVirusCounters ??= {}).corp ??=
          {});
        bucket[target.counterType] =
          Math.max(0, Math.floor(bucket[target.counterType] ?? 0)) + 1;
        return;
      }
      case "server_pool": {
        const servers = ((state.purgeableRunnerVirusCounters ??= {}).servers ??=
          {});
        const bucket = (servers[target.serverId] ??= {});
        bucket[target.counterType] =
          Math.max(0, Math.floor(bucket[target.counterType] ?? 0)) + 1;
        return;
      }
      case "pox_server":
        state.poxCountersByServer = {
          ...(state.poxCountersByServer ?? {}),
          [target.serverId]:
            Math.max(
              0,
              Math.floor(state.poxCountersByServer?.[target.serverId] ?? 0),
            ) + 1,
        };
        return;
      case "fait_server":
        state.serverAgendaCostCountersByServer = {
          ...(state.serverAgendaCostCountersByServer ?? {}),
          [target.serverId]:
            Math.max(
              0,
              Math.floor(
                state.serverAgendaCostCountersByServer?.[target.serverId] ?? 0,
              ),
            ) + 1,
        };
        return;
    }
  }

  function resumeVirusCounterPreventionQueue(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const continuation = state.pendingVirusCounterPrevention;
    if (!continuation) return;
    let automaticallyPrevented = 0;
    let added = 0;
    while (continuation.targets.length > 0) {
      if (consumeStoredVirusCounterPreventionCharge(state)) {
        continuation.targets.shift();
        automaticallyPrevented += 1;
        continue;
      }
      if (counterPreventionSourceIds(state).length > 0) {
        startVirusCounterPreventionChoice(state);
        break;
      }
      const target = continuation.targets.shift();
      if (!target) break;
      applyVirusCounterPreventionTarget(state, target);
      added += 1;
    }
    if (continuation.targets.length === 0)
      delete state.pendingVirusCounterPrevention;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      virusCounterAddedAfterChoice:
        Number(legalAction.payload?.virusCounterAddedAfterChoice ?? 0) + added,
      virusCounterAvoided:
        Number(legalAction.payload?.virusCounterAvoided ?? 0) +
        automaticallyPrevented,
      corpRunnerVirusCounterPreventionChargesAfter:
        state.corpRunnerVirusCounterPreventionCharges ?? 0,
      corpCreditsAfter: state.corp.credits,
    };
  }

  function resolveVirusCounterPreventionChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    const continuation = state.pendingVirusCounterPrevention;
    const target = continuation?.targets[0];
    if (
      !choice ||
      choice.source !== "card_implementation.counter_prevention_replacement" ||
      !continuation ||
      !target
    )
      throw new Error("Es ist keine Virus-Counter-Prevention-Choice offen.");
    const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0];
    const option = choice.options.find(
      (candidate) => candidate.id === selectedId,
    );
    if (!option || typeof option.value !== "string")
      throw new Error("Die Virus-Counter-Prevention-Auswahl ist ungueltig.");
    delete state.pendingChoice;
    continuation.targets.shift();
    if (option.value === "pass") {
      applyVirusCounterPreventionTarget(state, target);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        virusCounterPreventionDecision: "pass",
        virusCounterAddedAfterChoice: 1,
      };
    } else {
      const sourceId = option.value as CardInstanceId;
      if (!counterPreventionSourceIds(state).includes(sourceId))
        throw new Error(
          "Die Virus-Counter-Prevention-Quelle ist nicht mehr legal.",
        );
      const utility = deps.corpUtilityImplementationForCard(state, sourceId);
      if (utility?.kind !== "counter_prevention_replacement")
        throw new Error("Die Virus-Counter-Prevention-Quelle ist veraltet.");
      state.corp.credits -= utility.cost.amount;
      const flags = ensureCorpTurnFlags(state);
      flags.counterPreventionUsedSourceIdsThisTurn = markAbilityUsageSourceUsed(
        flags.counterPreventionUsedSourceIdsThisTurn,
        sourceId,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        virusCounterPreventionDecision: "prevent",
        counterPreventionSourceCardId: sourceId,
        counterPreventionSourceDefinitionId: definitionFor(state, sourceId).id,
        counterPreventionCreditsPaid: utility.cost.amount,
        virusCounterAvoided: 1,
      };
    }
    resumeVirusCounterPreventionQueue(state, legalAction);
  }

  function preventOneVirusCounterWithCounterPrevention(
    state: GameState,
    target?: VirusCounterPreventionTarget,
  ): {
    prevented: boolean;
    creditsPaid: number;
    preventionChargesSpent: number;
    deferred?: boolean;
  } {
    if (state.pendingVirusCounterPrevention && target) {
      state.pendingVirusCounterPrevention.targets.push(target);
      return {
        prevented: false,
        creditsPaid: 0,
        preventionChargesSpent: 0,
        deferred: true,
      };
    }
    if (consumeStoredVirusCounterPreventionCharge(state)) {
      return {
        prevented: true,
        creditsPaid: 0,
        preventionChargesSpent: 1,
      };
    }
    if (!target || counterPreventionSourceIds(state).length === 0)
      return { prevented: false, creditsPaid: 0, preventionChargesSpent: 0 };
    state.pendingVirusCounterPrevention = { targets: [target] };
    startVirusCounterPreventionChoice(state);
    return {
      prevented: false,
      creditsPaid: 0,
      preventionChargesSpent: 0,
      deferred: true,
    };
  }

  function addVisibleCardCounter(
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ): VisibleCounterPayload {
    addCardCounter(state, cardId, counterType, amount);
    return {
      counterType,
      addedCounterAmount: amount,
      remainingCounters: cardCounter(state, cardId, counterType),
    };
  }

  function spendVisibleCardCounter(
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ): VisibleCounterPayload {
    spendCardCounter(state, cardId, counterType, amount);
    return {
      counterType,
      removedCounterAmount: amount,
      remainingCounters: cardCounter(state, cardId, counterType),
    };
  }

  function totalCounters(state: GameState, counterType: CounterType): number {
    const cardCounterTotal = Object.keys(state.cardInstances).reduce(
      (sum, cardId) =>
        sum +
        (counterType === "virus"
          ? CARD_VIRUS_COUNTER_TYPES.reduce(
              (counterSum, cardVirusCounterType) =>
                counterSum + cardCounter(state, cardId, cardVirusCounterType),
              0,
            )
          : cardCounter(state, cardId, counterType)),
      0,
    );
    if (counterType !== "virus") return cardCounterTotal;
    let poxTotal = 0;
    for (const amount of Object.values(state.poxCountersByServer ?? {})) {
      poxTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
    }
    let faitTotal = 0;
    for (const amount of Object.values(
      state.serverAgendaCostCountersByServer ?? {},
    )) {
      faitTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
    }
    return cardCounterTotal + poxTotal + faitTotal;
  }

  function installedVirusCounterPurgePreserveSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return state.runner.rig.resources
      .filter(
        (cardId) =>
          deps.hiddenReplacementLongtailForDefinition(
            definitionFor(state, cardId),
          )?.kind === "purge_replacement_with_runner_virus_counter_cleanup",
      )
      .sort();
  }

  function virusCounterPurgePreserveTargets(
    state: GameState,
  ): Array<
    VirusCounterPurgePreserveTarget & { optionId: string; publicLabel: string }
  > {
    const targets: Array<
      VirusCounterPurgePreserveTarget & {
        optionId: string;
        publicLabel: string;
      }
    > = [];
    for (const cardId of deps.visibleVirusCounterTargetIds(state).sort()) {
      const title = definitionFor(state, cardId).title;
      for (const counterType of CARD_VIRUS_COUNTER_TYPES) {
        const amount = cardCounter(state, cardId, counterType);
        for (let index = 1; index <= amount; index += 1) {
          targets.push({
            kind: "card",
            cardId,
            counterType,
            index,
            optionId: `card:${counterType}:${cardId}:${index}`,
            publicLabel: `${title} ${counterType === "pattel" ? "Pattel" : "Virus"}-Counter ${index}`,
          });
        }
      }
    }
    for (const [serverId, rawAmount] of Object.entries(
      state.poxCountersByServer ?? {},
    ).sort(([left], [right]) => left.localeCompare(right))) {
      const amount = Math.max(0, Math.floor(Number(rawAmount ?? 0)));
      if (amount <= 0) continue;
      const typedServerId = serverId as Exclude<ServerId, "new_remote">;
      const label = publicServerLabel(state, typedServerId) ?? typedServerId;
      for (let index = 1; index <= amount; index += 1) {
        targets.push({
          kind: "pox",
          serverId: typedServerId,
          index,
          optionId: `pox:${typedServerId}:${index}`,
          publicLabel: `Pox auf ${label} ${index}`,
        });
      }
    }
    return targets;
  }

  function startVirusCounterPurgePreserveChoice(
    state: GameState,
    legalAction: LegalAction,
  ): boolean {
    const sourceIds = installedVirusCounterPurgePreserveSourceIds(state);
    if (sourceIds.length === 0) return false;
    const targets = virusCounterPurgePreserveTargets(state);
    if (targets.length === 0) return false;
    const sourceCardId = sourceIds[0];
    if (!sourceCardId)
      throw new Error(
        "Keine installierte Virus-Purge-Erhaltungsquelle gefunden.",
      );
    const maxPreserveCounters = Math.min(sourceIds.length * 2, targets.length);
    state.pendingChoice = {
      choiceId: `runner_virus_purge_replacement_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner_virus_counter_purge_replacement:${sourceIds.join(",")}:${state.stateVersion + 1}`,
      prompt: `Bis zu ${maxPreserveCounters} Virus-Counter behalten.`,
      kind: "select_cards",
      options: targets.map((target) => ({
        id: target.optionId,
        label: target.publicLabel,
        publicLabel: target.publicLabel,
        value: target.optionId,
      })),
      minSelections: 0,
      maxSelections: maxPreserveCounters,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "runner";
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
      sourceCount: sourceIds.length,
      runnerVirusCounterPurgeReplacementOpened: true,
      eligibleCounterCount: targets.length,
      maxPreserveCounters,
      purgedCounterType: "virus",
    };
    return true;
  }

  function parseVirusCounterPurgePreserveOption(
    optionId: string,
  ): VirusCounterPurgePreserveTarget | undefined {
    const parts = optionId.split(":");
    const kind = parts[0];
    if (kind === "pox") {
      const serverId = parts[1];
      const index = Number(parts[2]);
      if (
        !serverId ||
        serverId === "new_remote" ||
        !Number.isInteger(index) ||
        index <= 0
      )
        return undefined;
      return {
        kind: "pox",
        serverId: serverId as Exclude<ServerId, "new_remote">,
        index,
      };
    }
    const counterType = parts[1];
    const id = parts[2];
    const index = Number(parts[3]);
    if (!Number.isInteger(index) || index <= 0) return undefined;
    if (
      kind === "card" &&
      (counterType === "virus" || counterType === "pattel") &&
      id
    )
      return {
        kind: "card",
        cardId: id as CardInstanceId,
        counterType,
        index,
      };
    return undefined;
  }

  function restorePurgePreservedVirusCounters(
    state: GameState,
    selectedOptionIds: string[],
    maxPreserveCounters = 2,
  ): { preserved: number; preservedCardDefinitionIds: CardDefinitionId[] } {
    const selectedTargets = selectedOptionIds
      .map(parseVirusCounterPurgePreserveOption)
      .filter((target): target is VirusCounterPurgePreserveTarget =>
        Boolean(target),
      );
    if (selectedTargets.length !== selectedOptionIds.length)
      throw new Error("Die Virus-Counter-Erhaltungsauswahl ist ungueltig.");
    if (selectedTargets.length > maxPreserveCounters)
      throw new Error(
        `Die aktiven Replacement-Quellen koennen hoechstens ${maxPreserveCounters} Counter behalten.`,
      );
    const beforeCardCounts = new Map<string, number>();
    const beforePoxCounts = new Map<Exclude<ServerId, "new_remote">, number>();
    const preservedCardDefinitionIds: CardDefinitionId[] = [];
    for (const target of selectedTargets) {
      if (target.kind === "card") {
        if (!deps.visibleVirusCounterTargetIds(state).includes(target.cardId))
          throw new Error(
            "Ein Virus-Counter-Erhaltungsziel ist nicht mehr legal.",
          );
        const key = `${target.counterType}:${target.cardId}`;
        const count =
          beforeCardCounts.get(key) ??
          cardCounter(state, target.cardId, target.counterType);
        if (target.index > count)
          throw new Error(
            "Ein zu erhaltender Virus-Counter existiert nicht mehr.",
          );
        beforeCardCounts.set(key, count);
      } else {
        mustServer(state, target.serverId);
        const count =
          beforePoxCounts.get(target.serverId) ??
          Math.max(
            0,
            Math.floor(
              Number(state.poxCountersByServer?.[target.serverId] ?? 0),
            ),
          );
        if (target.index > count)
          throw new Error(
            "Ein zu erhaltender Pox-Counter existiert nicht mehr.",
          );
        beforePoxCounts.set(target.serverId, count);
      }
    }

    purgeVirusCounters(state);

    const cardPreserveCounts = new Map<
      string,
      {
        cardId: CardInstanceId;
        counterType: Extract<CounterType, "virus" | "pattel">;
        amount: number;
      }
    >();
    const poxPreserveCounts = new Map<
      Exclude<ServerId, "new_remote">,
      number
    >();
    for (const target of selectedTargets) {
      if (target.kind === "card") {
        const key = `${target.counterType}:${target.cardId}`;
        const current = cardPreserveCounts.get(key);
        cardPreserveCounts.set(key, {
          cardId: target.cardId,
          counterType: target.counterType,
          amount: (current?.amount ?? 0) + 1,
        });
      } else {
        poxPreserveCounts.set(
          target.serverId,
          (poxPreserveCounts.get(target.serverId) ?? 0) + 1,
        );
      }
    }
    for (const { cardId, counterType, amount } of cardPreserveCounts.values()) {
      setCardCounter(state, cardId, counterType, amount);
      preservedCardDefinitionIds.push(definitionFor(state, cardId).id);
    }
    for (const [serverId, amount] of poxPreserveCounts) {
      state.poxCountersByServer = {
        ...(state.poxCountersByServer ?? {}),
        [serverId]: amount,
      };
    }
    return {
      preserved: selectedTargets.length,
      preservedCardDefinitionIds: preservedCardDefinitionIds.sort(),
    };
  }

  function resolveVirusCounterPurgePreserveChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("runner_virus_counter_purge_replacement")
    )
      throw new Error("Es ist keine Virus-Counter-Erhaltungs-Choice offen.");
    const [, encodedSourceCardIds] = choice.source.split(":");
    const sourceCardIds = [...new Set(encodedSourceCardIds?.split(",") ?? [])]
      .filter(Boolean)
      .sort() as CardInstanceId[];
    const installedSourceIds = new Set(
      installedVirusCounterPurgePreserveSourceIds(state),
    );
    if (
      sourceCardIds.length === 0 ||
      sourceCardIds.some(
        (sourceCardId) => !installedSourceIds.has(sourceCardId),
      )
    )
      throw new Error("Die Replacement-Quelle ist nicht mehr installiert.");
    const selected = selectedChoiceIds(playerAction.selectedChoices);
    const legalOptionIds = new Set(choice.options.map((option) => option.id));
    if (selected.some((optionId) => !legalOptionIds.has(optionId)))
      throw new Error("Die Virus-Counter-Erhaltungsauswahl ist nicht legal.");
    const maxPreserveCounters = sourceCardIds.length * 2;
    const result = restorePurgePreservedVirusCounters(
      state,
      selected,
      maxPreserveCounters,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definitionFor(state, sourceCardIds[0]!).id,
      sourceCount: sourceCardIds.length,
      purgedCounterType: "virus",
      preservedCounterAmount: result.preserved,
      ...(result.preservedCardDefinitionIds.length > 0
        ? {
            preservedCardDefinitionIds:
              result.preservedCardDefinitionIds.join(","),
          }
        : {}),
      remainingVirusCounters: totalCounters(state, "virus"),
    };
    delete state.pendingChoice;
  }

  function availableRunnerProgramInstallCredits(state: GameState): number {
    return (
      state.runner.credits +
      restrictedHostedCredits(state, "install_programs", {
        installCardType: "program",
      }) +
      deps.valuPakTemporaryProgramInstallCredits(state)
    );
  }

  function runnerCanPayInstallCost(
    state: GameState,
    amount: number,
    cardType: CardDefinition["type"],
  ): boolean {
    if (amount <= 0) return true;
    if (cardType === "program")
      return availableRunnerProgramInstallCredits(state) >= amount;
    return state.runner.credits >= amount;
  }

  function runnerCostPenaltySupportCreditCapacity(state: GameState): number {
    return runnerPaymentSupportCreditCapacity(state);
  }

  function openRunnerCostPenaltySupportWindow(
    state: GameState,
    legalAction: LegalAction,
    amount: number,
    cardType: CardDefinition["type"],
  ): boolean {
    return openRunnerCostPenaltySupportWindowHelper(state, legalAction, {
      amount,
      availableWithoutSupport:
        cardType === "program"
          ? availableRunnerProgramInstallCredits(state)
          : state.runner.credits,
      context:
        cardType === "program" ? "runner_program_install" : "runner_install",
    });
  }

  function closeRunnerCostPenaltySupportWindowForPayment(
    state: GameState,
    legalAction: LegalAction,
    amount: number,
  ): void {
    closeRunnerCostPenaltySupportWindowForPaymentHelper(
      state,
      legalAction,
      amount,
    );
  }

  function spendRunnerInstallCredits(
    state: GameState,
    amount: number,
    cardType: CardDefinition["type"],
    paymentPayload?: LegalAction["payload"],
  ): RunnerInstallCreditSpendResult {
    const result = {
      amount: Math.max(0, Math.floor(amount)),
      normalCreditsSpent: 0,
      hostedCreditsSpent: 0,
      recurringCreditsSpent: 0,
      temporaryCreditsSpent: 0,
      sourceDefinitionIds: [] as CardDefinitionId[],
      runnerCreditsAfter: state.runner.credits,
    };
    if (amount <= 0) return result;
    if (cardType !== "program") {
      spendCredits(state, "runner", amount);
      result.normalCreditsSpent = amount;
      result.runnerCreditsAfter = state.runner.credits;
      return result;
    }
    if (availableRunnerProgramInstallCredits(state) < amount)
      throw new Error(
        "Der Runner kann die Installationskosten nicht bezahlen.",
      );
    const sourceDefinitionIds = new Set<CardDefinitionId>();
    const declaredSourcePayments =
      runnerInstallPaymentSourcePaymentsFromPayload(paymentPayload);
    if (declaredSourcePayments) {
      let remaining = amount;
      const optionalSources = new Set(
        runnerProgramInstallOptionalCreditSourceIds(state),
      );
      const seenSources = new Set<CardInstanceId>();
      for (const payment of declaredSourcePayments) {
        if (seenSources.has(payment.sourceCardId))
          throw new Error(
            "Die Programminstallations-Zahlungsaufteilung enthaelt doppelte Quellen.",
          );
        seenSources.add(payment.sourceCardId);
        if (!optionalSources.has(payment.sourceCardId))
          throw new Error(
            "Eine Zahlungsquelle ist fuer diese Programminstallation nicht legal.",
          );
        if (hostedPaymentCredits(state, payment.sourceCardId) < payment.amount)
          throw new Error(
            "Eine Zahlungsquelle hat nicht genug verfuegbare Bits.",
          );
        if (payment.amount <= 0) continue;
        if (payment.amount > remaining)
          throw new Error(
            "Die Programminstallations-Zahlungsaufteilung zahlt zu viele Bits.",
          );
        spendHostedPaymentCredits(state, payment.sourceCardId, payment.amount);
        remaining -= payment.amount;
        result.hostedCreditsSpent += payment.amount;
        sourceDefinitionIds.add(definitionFor(state, payment.sourceCardId).id);
      }
      const flags = ensureRunnerTurnFlags(state);
      const temporary = Math.min(
        deps.valuPakTemporaryProgramInstallCredits(state),
        remaining,
      );
      if (temporary > 0) {
        spendRestrictedActionGrantTemporaryCredits(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
          temporary,
        );
        flags.valuPakTemporaryProgramInstallCredits = Math.max(
          0,
          Math.floor(flags.valuPakTemporaryProgramInstallCredits ?? 0) -
            temporary,
        );
        remaining -= temporary;
        result.temporaryCreditsSpent = temporary;
      }
      spendCredits(state, "runner", remaining);
      result.normalCreditsSpent = remaining;
      result.sourceDefinitionIds = [...sourceDefinitionIds].sort(
        (left, right) => left - right,
      );
      result.runnerCreditsAfter = state.runner.credits;
      return result;
    }
    let remaining = amount;
    const flags = ensureRunnerTurnFlags(state);
    const temporary = Math.min(
      deps.valuPakTemporaryProgramInstallCredits(state),
      remaining,
    );
    if (temporary > 0) {
      spendRestrictedActionGrantTemporaryCredits(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        temporary,
      );
      flags.valuPakTemporaryProgramInstallCredits = Math.max(
        0,
        Math.floor(flags.valuPakTemporaryProgramInstallCredits ?? 0) -
          temporary,
      );
      remaining -= temporary;
      result.temporaryCreditsSpent = temporary;
    }
    const restricted = spendRestrictedHostedCredits(
      state,
      "install_programs",
      remaining,
      { installCardType: cardType },
    );
    remaining -= restricted.spent;
    result.hostedCreditsSpent += restricted.spent;
    for (const definitionId of restricted.sourceDefinitionIds)
      sourceDefinitionIds.add(definitionId);
    spendCredits(state, "runner", remaining);
    result.normalCreditsSpent = remaining;
    result.sourceDefinitionIds = [...sourceDefinitionIds].sort(
      (left, right) => left - right,
    );
    result.runnerCreditsAfter = state.runner.credits;
    return result;
  }

  function runnerTagRemovalRecurringCreditSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return [...restrictedHostedCreditSourceIds(state, "remove_tags")].sort();
  }

  function runnerTagRemovalRecurringCredits(state: GameState): number {
    return runnerTagRemovalRecurringCreditSourceIds(state).reduce(
      (sum, cardId) => sum + hostedPaymentCredits(state, cardId),
      0,
    );
  }

  function availableRunnerTagRemovalCredits(state: GameState): number {
    return state.runner.credits + runnerTagRemovalRecurringCredits(state);
  }

  function spendRunnerTagRemovalCredits(
    state: GameState,
    amount: number,
    legalAction: LegalAction,
  ): void {
    if (amount <= 0) return;
    if (availableRunnerTagRemovalCredits(state) < amount)
      throw new Error("Der Runner kann die Tag-Entfernung nicht bezahlen.");
    let remaining = amount;
    let recurringSpent = 0;
    const recurringSourceDefinitionIds: number[] = [];
    for (const cardId of runnerTagRemovalRecurringCreditSourceIds(state)) {
      if (remaining <= 0) break;
      const spent = Math.min(hostedPaymentCredits(state, cardId), remaining);
      if (spent <= 0) continue;
      spendHostedPaymentCredits(state, cardId, spent);
      const sourceDefinitionId = definitionFor(state, cardId).id;
      recurringSourceDefinitionIds.push(sourceDefinitionId);
      recurringSpent += spent;
      remaining -= spent;
    }
    spendCredits(state, "runner", remaining);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      removeTagAmount: 1,
      ...(recurringSpent > 0
        ? {
            tagRemovalRecurringCreditsSpent: recurringSpent,
            runnerCreditsSpent: remaining,
            tagRemovalCreditSourceDefinitionIds:
              recurringSourceDefinitionIds.join(","),
          }
        : {}),
    };
  }

  function refreshRecurringCredits(
    state: GameState,
    side: Side,
    effects?: AutomaticEffectCollector,
  ): void {
    if (side !== "runner") return;
    for (const cardId of runnerInstalledCardIds(state)) {
      const definition = definitionFor(state, cardId);
      const restrictedSource =
        restrictedHostedCreditSourceForDefinition(definition);
      if (restrictedSource) {
        if (
          restrictedSource.counterType !== "bit" ||
          restrictedSource.refresh.timing !== "start_of_runner_turn" ||
          restrictedSource.refresh.mode !== "refill_to_capacity_if_used"
        )
          throw new Error("Restricted hosted credit source is invalid.");
        const capacity = Math.max(0, Math.floor(restrictedSource.capacity));
        const previous = cardCounter(state, cardId, "bit");
        if (previous < capacity) {
          setCardCounter(state, cardId, "bit", capacity);
          effects?.push(
            deps.automaticCounterChangeEffect(
              `runner.start.restricted_hosted_credit.${cardId}`,
              "runner",
              definition.id,
              "bit",
              capacity,
              capacity - previous,
            ),
          );
        }
        continue;
      }
      const recurringCredits = definition.recurringCredits ?? 0;
      if (recurringCredits > 0) {
        const previous = cardCounter(state, cardId, "recurring_credit");
        setCardCounter(state, cardId, "recurring_credit", recurringCredits);
        if (previous !== recurringCredits) {
          effects?.push(
            deps.automaticCounterChangeEffect(
              `runner.start.recurring_credit.${cardId}`,
              "runner",
              definition.id,
              "recurring_credit",
              recurringCredits,
              Math.max(0, recurringCredits - previous),
            ),
          );
        }
      }
    }
  }

  return {
    resolveTraceHardwareWreckerSuccess,
    resolveTraceHardwareWreckerTargetChoice,
    resumeTraceHardwareWreckerAfterTrash,
    resolveTraceTrashRunnerResourceSuccess,
    encounterTemporaryTraceCreditsAvailable,
    spendEncounterTemporaryTraceCredits,
    identityModifierAmount,
    identityDefinition,
    executeEffectCommands,
    assertNonNegativeAmount,
    assertPositiveIntegerAmount,
    withoutVariableIceState,
    clickCostForAction,
    creditCostForAction,
    runnerActionsPerTurn,
    agendaPoints,
    addVirusCounterWithCounterPrevention,
    preventOneVirusCounterWithCounterPrevention,
    resolveVirusCounterPreventionChoice,
    addVisibleCardCounter,
    spendVisibleCardCounter,
    totalCounters,
    installedVirusCounterPurgePreserveSourceIds,
    virusCounterPurgePreserveTargets,
    startVirusCounterPurgePreserveChoice,
    parseVirusCounterPurgePreserveOption,
    restorePurgePreservedVirusCounters,
    resolveVirusCounterPurgePreserveChoice,
    availableRunnerProgramInstallCredits,
    runnerCanPayInstallCost,
    runnerCostPenaltySupportCreditCapacity,
    openRunnerCostPenaltySupportWindow,
    closeRunnerCostPenaltySupportWindowForPayment,
    spendRunnerInstallCredits,
    runnerTagRemovalRecurringCreditSourceIds,
    runnerTagRemovalRecurringCredits,
    availableRunnerTagRemovalCredits,
    spendRunnerTagRemovalCredits,
    refreshRecurringCredits,
  };
}
