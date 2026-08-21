import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  EffectCommand,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import {
  icebreakerAbilityHasSpecialEffect,
  type RuntimeIcebreakerAbility,
} from "../../ability-engine/icebreaker-abilities";
import { addTemporaryBreakerStrengthModifierUntilEndOfTurn } from "../state/temporary-breaker-strength";
import type { RunnerRunCreditSpendResult } from "./run-duration-payment";
import {
  subroutineIsUnavailable,
  trodeSetIgnoresSubroutine,
} from "./trode-set";

type ActiveRun = NonNullable<GameState["run"]>;
type Subroutine = NonNullable<CardDefinition["subroutines"]>[number];

export type RunnerBreakerActionExecutionHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    effectiveSubtypesForCard: (
      cardId: CardInstanceId,
      definition: CardDefinition,
    ) => readonly string[];
  };
  run: {
    currentRun: () => ActiveRun;
    currentEncounterSubroutines: (
      iceDefinition: CardDefinition,
    ) => NonNullable<CardDefinition["subroutines"]>;
    runRemainderStrengthBonusForBreaker: (
      run: GameState["run"],
      breakerId: CardInstanceId,
    ) => number;
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
  };
  breaker: {
    pumpAbilityForLegalAction: (
      legalAction: LegalAction,
    ) => RuntimeIcebreakerAbility | undefined;
    pumpAmountForLegalAction: (legalAction: LegalAction) => number;
    pumpDurationForLegalAction: (
      legalAction: LegalAction,
    ) => "current_encounter" | "current_run" | "current_turn";
    breakAbilityForLegalAction: (
      legalAction: LegalAction,
    ) => RuntimeIcebreakerAbility | undefined;
    assertCurrentSubroutineMatchesLegalAction: (
      iceDefinition: CardDefinition,
      subroutineIndex: number,
      legalAction: LegalAction,
    ) => Subroutine;
    assertBreakSubroutineCostQuoteValid: (
      breakerId: CardInstanceId | undefined,
      legalAction: LegalAction,
      subroutine: Subroutine,
    ) => void;
    resolveMultiBreakSubroutinesAction: (
      breakerId: CardInstanceId,
      legalAction: LegalAction,
      options?: {
        costAlreadyPaid?: boolean;
        skipAardvarkInterception?: boolean;
      },
    ) => {
      paid: boolean;
      resolved: boolean;
      suspended: boolean;
    };
    resolveBlinkBreakSubroutineAction: (
      breakerId: CardInstanceId,
      subroutineIndex: number,
      legalAction: LegalAction,
    ) => void;
  };
  payment: {
    spendRunnerRunCredits: (
      amount: number,
      breakerId?: CardInstanceId | undefined,
      legalAction?: LegalAction,
    ) => RunnerRunCreditSpendResult;
  };
  fort: {
    shouldOpenAardvarkInterception: (breakerId: CardInstanceId) => boolean;
    startAardvarkInterceptionChoice: (
      breakerId: CardInstanceId,
      actionType: "pump_breaker" | "break_subroutine",
      legalAction: LegalAction,
    ) => void;
    applyPostBreakStealthLoss: (
      breakerId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    applyOncePerRunBreakTagAndAllStealthLoss?: (
      breakerId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
  };
  effects: {
    executeEffectCommands: (commands: EffectCommand[]) => void;
    addRunnerFutureActionDebt: (amount: number) => void;
  };
  turn: {
    ensureRunnerTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  tracking: {
    recordBartmossEncounterUsage: (breakerId: CardInstanceId) => void;
    recordFortBoundBreakerUsage: (
      breakerId: CardInstanceId,
      awardsRunEndCounter: boolean,
    ) => void;
    recordSnowballBreakUsage: (breakerId: CardInstanceId) => void;
    recordRunEndTrashBreakerUsage?: (breakerId: CardInstanceId) => void;
  };
};

export type RunnerBreakerActionExecutionResult = {
  handled: boolean;
};

type RunnerBreakerActionExecutionOptions = {
  costAlreadyPaid?: boolean;
  skipAardvarkInterception?: boolean;
  skipInitialUseTracking?: boolean;
};

export function handleRunnerBreakerActionExecution(
  host: RunnerBreakerActionExecutionHost,
  legalAction: LegalAction,
): RunnerBreakerActionExecutionResult {
  return handleRunnerBreakerActionExecutionWithOptions(host, legalAction, {});
}

export function resumePaidRunnerBreakerAction(
  host: RunnerBreakerActionExecutionHost,
  legalAction: LegalAction,
): void {
  const result = handleRunnerBreakerActionExecutionWithOptions(
    host,
    legalAction,
    {
      costAlreadyPaid: true,
      skipAardvarkInterception: true,
      skipInitialUseTracking: true,
    },
  );
  if (!result.handled)
    throw new Error("Aardvark-Fortsetzung ist keine Breaker-Aktion.");
}

function handleRunnerBreakerActionExecutionWithOptions(
  host: RunnerBreakerActionExecutionHost,
  legalAction: LegalAction,
  options: RunnerBreakerActionExecutionOptions,
): RunnerBreakerActionExecutionResult {
  switch (legalAction.type) {
    case "pump_breaker":
      executePumpBreakerAction(host, legalAction, options);
      return { handled: true };
    case "break_subroutine":
      executeBreakSubroutineAction(host, legalAction, options);
      return { handled: true };
    default:
      return { handled: false };
  }
}

function executePumpBreakerAction(
  host: RunnerBreakerActionExecutionHost,
  legalAction: LegalAction,
  options: RunnerBreakerActionExecutionOptions,
): void {
  const breakerId =
    typeof legalAction.payload?.breakerId === "string"
      ? (String(legalAction.payload.breakerId) as CardInstanceId)
      : undefined;
  const pumpAbility = host.breaker.pumpAbilityForLegalAction(legalAction);
  const pumpAmount = host.breaker.pumpAmountForLegalAction(legalAction);
  const isVariablePump =
    pumpAbility?.variableStrength !== undefined ||
    legalAction.payload?.pumpAmount !== undefined;
  if (isVariablePump) {
    const expectedCost = pumpAmount;
    if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
      throw new Error(
        "Variable Icebreaker-Pump-Kosten sind nicht mehr gueltig.",
      );
  }
  if (!options.costAlreadyPaid) {
    const payment = host.payment.spendRunnerRunCredits(
      legalAction.costs[0]?.credits ?? 1,
      breakerId,
      legalAction,
    );
    if (payment.handled && payment.paid === false) return;
  }
  if (breakerId && !options.skipInitialUseTracking) {
    recordFortBoundBreakerUse(host, breakerId, pumpAbility, false);
    recordNoisyIcebreakerUse(host, breakerId, legalAction);
  }
  if (
    breakerId &&
    !options.skipAardvarkInterception &&
    host.fort.shouldOpenAardvarkInterception(breakerId)
  ) {
    host.fort.startAardvarkInterceptionChoice(
      breakerId,
      "pump_breaker",
      legalAction,
    );
    return;
  }
  if (
    breakerId &&
    host.breaker.pumpDurationForLegalAction(legalAction) === "current_run" &&
    host.state.run
  ) {
    const run = host.run.currentRun();
    const breakerState = run.breakerState ?? {
      strengthModifiersByBreakerInstanceId: {},
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [],
    };
    const previous = host.run.runRemainderStrengthBonusForBreaker(
      run,
      breakerId,
    );
    run.breakerState = {
      ...breakerState,
      strengthModifiersByBreakerInstanceId: {
        ...breakerState.strengthModifiersByBreakerInstanceId,
        [breakerId]: [
          ...(breakerState.strengthModifiersByBreakerInstanceId[breakerId] ??
            []),
          { amount: pumpAmount, duration: "current_run", source: "paid_pump" },
        ],
      },
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runRemainderStrengthBonusApplied: true,
      runRemainderStrengthBonusAfter: previous + pumpAmount,
    };
    if (pumpAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
    return;
  }
  if (
    breakerId &&
    host.breaker.pumpDurationForLegalAction(legalAction) === "current_turn"
  ) {
    const strengthBonusAfter =
      addTemporaryBreakerStrengthModifierUntilEndOfTurn(host.state, {
        sourceCardInstanceId: breakerId,
        targetBreakerId: breakerId,
        amount: pumpAmount,
      });
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      turnStrengthBonusApplied: true,
      turnStrengthBonusAfter: strengthBonusAfter,
    };
    if (pumpAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
    return;
  }
  if (breakerId && isVariablePump) {
    host.effects.executeEffectCommands([
      { type: "change_breaker_strength", breakerId, amount: pumpAmount },
    ]);
    host.effects.addRunnerFutureActionDebt(pumpAmount);
    const pendingDebt = Math.max(
      0,
      Math.floor(
        host.turn.ensureRunnerTurnFlags().forgoNextActionsPending ?? 0,
      ),
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility: "variable_pump_future_action_debt",
      futureActionDebtAdded: pumpAmount,
      futureActionDebtPending: pendingDebt,
      breakerStrengthAfter:
        (host.cards.definitionFor(breakerId).strength ?? 0) +
        host.cards.cardInstanceFor(breakerId).strengthModifier,
    };
    if (pumpAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
    return;
  }
  host.effects.executeEffectCommands([
    {
      type: "change_breaker_strength",
      breakerId: String(legalAction.payload?.breakerId) as CardInstanceId,
      amount: pumpAmount,
    },
  ]);
  if (breakerId && pumpAbility?.onUseEndRun)
    host.run.finishRun(false, legalAction);
}

function executeBreakSubroutineAction(
  host: RunnerBreakerActionExecutionHost,
  legalAction: LegalAction,
  options: RunnerBreakerActionExecutionOptions,
): void {
  const breakerId =
    typeof legalAction.payload?.breakerId === "string"
      ? (String(legalAction.payload.breakerId) as CardInstanceId)
      : undefined;
  const breakAbility = host.breaker.breakAbilityForLegalAction(legalAction);
  if (
    breakerId &&
    (breakAbility?.breakAllMatchingSubroutines ||
      (breakAbility?.count ?? 1) > 1)
  ) {
    const multiBreak = host.breaker.resolveMultiBreakSubroutinesAction(
      breakerId,
      legalAction,
      {
        ...(options.costAlreadyPaid ? { costAlreadyPaid: true } : {}),
        ...(options.skipAardvarkInterception
          ? { skipAardvarkInterception: true }
          : {}),
      },
    );
    if (multiBreak.paid && !options.skipInitialUseTracking) {
      recordNoisyIcebreakerUse(host, breakerId, legalAction);
      recordFortBoundBreakerUse(host, breakerId, breakAbility, false);
    }
    if (!multiBreak.resolved || multiBreak.suspended) return;
    for (const subroutineIndex of String(
      legalAction.payload?.subroutineIndexes ?? "",
    )
      .split(",")
      .map((value) => Number(value))) {
      recordBrokenSubroutineBreaker(host, breakerId, subroutineIndex);
    }
    recordFortBoundBreakerUse(host, breakerId, breakAbility, true);
    recordBreakerSpecialEffects(host, breakerId, breakAbility, legalAction);
    recordNextSentryFreeBreakIfEarned(host, breakerId, breakAbility);
    if (breakAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
    return;
  }
  if (!host.state.run?.encounteredIceId)
    throw new Error("Subroutine kann nur im ICE-Encounter gebrochen werden.");
  if (host.state.run.noBreakSubroutinesActive)
    throw new Error(
      "Subroutinen koennen in diesem Encounter nicht gebrochen werden.",
    );
  const iceDefinition = host.cards.definitionFor(
    host.state.run.encounteredIceId,
  );
  const currentSubroutine =
    host.breaker.assertCurrentSubroutineMatchesLegalAction(
      iceDefinition,
      Number(legalAction.payload?.subroutineIndex),
      legalAction,
    );
  if (legalAction.payload?.nextSentryFreeBreak === true) {
    resolveNextSentryFreeBreakAction(
      host,
      breakerId,
      Number(legalAction.payload?.subroutineIndex),
      currentSubroutine,
      legalAction,
    );
    if (breakerId) recordNoisyIcebreakerUse(host, breakerId, legalAction);
    if (breakerId)
      recordFortBoundBreakerUse(host, breakerId, breakAbility, true);
    return;
  }
  host.breaker.assertBreakSubroutineCostQuoteValid(
    breakerId,
    legalAction,
    currentSubroutine,
  );
  if (!options.costAlreadyPaid) {
    const payment = host.payment.spendRunnerRunCredits(
      legalAction.costs[0]?.credits ?? 1,
      breakerId,
      legalAction,
    );
    if (payment.handled && payment.paid === false) return;
  }
  if (breakerId && !options.skipInitialUseTracking) {
    recordFortBoundBreakerUse(host, breakerId, breakAbility, false);
    recordNoisyIcebreakerUse(host, breakerId, legalAction);
  }
  if (
    breakerId &&
    !options.skipAardvarkInterception &&
    host.fort.shouldOpenAardvarkInterception(breakerId)
  ) {
    host.fort.startAardvarkInterceptionChoice(
      breakerId,
      "break_subroutine",
      legalAction,
    );
    return;
  }
  if (breakerId) {
    if (
      icebreakerAbilityHasSpecialEffect(breakAbility, "random_break_or_damage")
    ) {
      host.breaker.resolveBlinkBreakSubroutineAction(
        breakerId,
        Number(legalAction.payload?.subroutineIndex),
        legalAction,
      );
      if (breakAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
      return;
    }
  }
  host.effects.executeEffectCommands([
    {
      type: "break_subroutine",
      subroutineIndex: Number(legalAction.payload?.subroutineIndex),
    },
  ]);
  if (breakerId) {
    recordBrokenSubroutineBreaker(
      host,
      breakerId,
      Number(legalAction.payload?.subroutineIndex),
    );
    recordFortBoundBreakerUse(host, breakerId, breakAbility, true);
    host.fort.applyPostBreakStealthLoss(breakerId, legalAction);
    recordBreakerSpecialEffects(host, breakerId, breakAbility, legalAction);
    recordNextSentryFreeBreakIfEarned(host, breakerId, breakAbility);
    if (breakAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
  }
}

function recordBrokenSubroutineBreaker(
  host: RunnerBreakerActionExecutionHost,
  breakerId: CardInstanceId,
  subroutineIndex: number,
): void {
  const run = host.state.run;
  if (!run || !Number.isSafeInteger(subroutineIndex) || subroutineIndex < 0)
    return;
  const breakerState = run.breakerState ?? {
    strengthModifiersByBreakerInstanceId: {},
    brokenSubroutineCountByBreakerInstanceId: {},
    pendingFreeBreaks: [],
  };
  run.breakerState = {
    ...breakerState,
    brokenSubroutineBreakerByIndex: {
      ...breakerState.brokenSubroutineBreakerByIndex,
      [subroutineIndex]: breakerId,
    },
  };
}

function recordBreakerSpecialEffects(
  host: RunnerBreakerActionExecutionHost,
  breakerId: CardInstanceId,
  breakAbility: RuntimeIcebreakerAbility | undefined,
  legalAction: LegalAction,
): void {
  for (const effect of breakAbility?.specialEffects ?? []) {
    switch (effect.kind) {
      case "post_encounter_self_trash_check":
        host.tracking.recordBartmossEncounterUsage(breakerId);
        break;
      case "strength_bonus_per_successful_break_this_run":
        host.tracking.recordSnowballBreakUsage(breakerId);
        break;
      case "once_per_run_break_tag_and_all_stealth_loss":
        host.fort.applyOncePerRunBreakTagAndAllStealthLoss?.(
          breakerId,
          legalAction,
        );
        break;
      case "run_end_trash_source_if_used":
        host.tracking.recordRunEndTrashBreakerUsage?.(breakerId);
        break;
      default:
        break;
    }
  }
}

function recordFortBoundBreakerUse(
  host: RunnerBreakerActionExecutionHost,
  breakerId: CardInstanceId,
  ability: RuntimeIcebreakerAbility | undefined,
  successfulBreak: boolean,
): void {
  const resetsOnFortChange = ability?.onUseEffects?.some(
    (effect) => effect.kind === "reset_source_counter_on_fort_change",
  );
  const awardsRunEndCounter =
    successfulBreak &&
    ability?.onSuccessfulBreakEffects?.some(
      (effect) => effect.kind === "mark_run_end_source_counter_award",
    );
  if (resetsOnFortChange || awardsRunEndCounter)
    host.tracking.recordFortBoundBreakerUsage(
      breakerId,
      awardsRunEndCounter === true,
    );
}

function recordNoisyIcebreakerUse(
  host: RunnerBreakerActionExecutionHost,
  breakerId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const run = host.state.run;
  if (!run) return;
  const definition = host.cards.definitionFor(breakerId);
  if (
    !host.cards
      .effectiveSubtypesForCard(breakerId, definition)
      .includes("noisy")
  )
    return;
  run.usedNoisyIcebreakerThisRun = true;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    noisyIcebreakerUsedThisRun: true,
    noisyIcebreakerDefinitionId: definition.id,
  };
}

function resolveNextSentryFreeBreakAction(
  host: RunnerBreakerActionExecutionHost,
  breakerId: CardInstanceId | undefined,
  subroutineIndex: number,
  subroutine: Subroutine,
  legalAction: LegalAction,
): void {
  const run = host.run.currentRun();
  if (!breakerId) throw new Error("Free-Break-Quelle fehlt.");
  if (run.phase !== "encounter_ice" || !run.encounteredIceId)
    throw new Error("Free-Break kann nur im ICE-Encounter genutzt werden.");
  if (!host.state.runner.rig.programs.includes(breakerId))
    throw new Error("Der Icebreaker ist nicht installiert.");
  const pending = run.breakerState?.pendingFreeBreaks.find(
    (entry) =>
      entry.sourceBreakerInstanceId === breakerId &&
      entry.iceSubtype === "sentry" &&
      entry.remainingUses > 0 &&
      entry.targetIceId === run.encounteredIceId,
  );
  if (!pending)
    throw new Error("Der Free-Break-Effekt gilt nur für das nächste ICE.");
  const iceDefinition = host.cards.definitionFor(run.encounteredIceId);
  if (
    !host.cards
      .effectiveSubtypesForCard(run.encounteredIceId, iceDefinition)
      .includes("sentry")
  )
    throw new Error("Der Free-Break-Effekt gilt nur für das nächste Sentry.");
  if (
    subroutineIsUnavailable(run, subroutineIndex) ||
    trodeSetIgnoresSubroutine(host.state, iceDefinition, subroutine)
  )
    throw new Error("Diese Subroutine ist bereits erledigt.");
  if ((legalAction.costs[0]?.credits ?? 0) !== 0)
    throw new Error("Free-Break-Kosten sind nicht mehr gueltig.");
  host.effects.executeEffectCommands([
    { type: "break_subroutine", subroutineIndex },
  ]);
  recordBrokenSubroutineBreaker(host, breakerId, subroutineIndex);
  run.breakerState = {
    ...(run.breakerState ?? {
      strengthModifiersByBreakerInstanceId: {},
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [],
    }),
    pendingFreeBreaks: (run.breakerState?.pendingFreeBreaks ?? []).flatMap(
      (entry) =>
        entry === pending
          ? entry.remainingUses > 1
            ? [{ ...entry, remainingUses: entry.remainingUses - 1 }]
            : []
          : [entry],
    ),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    nextSentryFreeBreakConsumed: true,
    sourceDefinitionId: host.cards.definitionFor(breakerId).id,
    subroutineId: subroutine.id,
  };
}

function recordNextSentryFreeBreakIfEarned(
  host: RunnerBreakerActionExecutionHost,
  breakerId: CardInstanceId,
  breakAbility: RuntimeIcebreakerAbility | undefined,
): void {
  if (
    !breakAbility ||
    !icebreakerAbilityHasSpecialEffect(
      breakAbility,
      "set_next_sentry_free_break_after_fully_breaking_wall",
    )
  )
    return;
  const run = host.state.run;
  if (!run?.encounteredIceId) return;
  const iceDefinition = host.cards.definitionFor(run.encounteredIceId);
  if (
    !host.cards
      .effectiveSubtypesForCard(run.encounteredIceId, iceDefinition)
      .includes("wall")
  )
    return;
  const subroutineCount =
    host.run.currentEncounterSubroutines(iceDefinition).length;
  if (subroutineCount === 0) return;
  for (let index = 0; index < subroutineCount; index += 1) {
    if (run.breakerState?.brokenSubroutineBreakerByIndex?.[index] !== breakerId)
      return;
  }
  const breakerState = run.breakerState ?? {
    strengthModifiersByBreakerInstanceId: {},
    brokenSubroutineCountByBreakerInstanceId: {},
    pendingFreeBreaks: [],
  };
  run.breakerState = {
    ...breakerState,
    pendingFreeBreaks: [
      ...breakerState.pendingFreeBreaks,
      {
        sourceBreakerInstanceId: breakerId,
        sourceAbilityId: breakAbility.id,
        iceSubtype: "sentry",
        remainingUses: 1,
        mustBeNextEncounteredIce: true,
      },
    ],
  };
}
