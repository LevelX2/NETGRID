import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  EffectCommand,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import type { RuntimeIcebreakerAbility } from "../../ability-engine/icebreaker-abilities";

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
    ) => "current_encounter" | "current_run";
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
    ) => void;
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
    ) => void;
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
    recordDupreBreakUsage: (breakerId: CardInstanceId) => void;
    recordSnowballBreakUsage: (breakerId: CardInstanceId) => void;
  };
};

export type RunnerBreakerActionExecutionResult = {
  handled: boolean;
};

export function handleRunnerBreakerActionExecution(
  host: RunnerBreakerActionExecutionHost,
  legalAction: LegalAction,
): RunnerBreakerActionExecutionResult {
  switch (legalAction.type) {
    case "pump_breaker":
      executePumpBreakerAction(host, legalAction);
      return { handled: true };
    case "break_subroutine":
      executeBreakSubroutineAction(host, legalAction);
      return { handled: true };
    default:
      return { handled: false };
  }
}

function executePumpBreakerAction(
  host: RunnerBreakerActionExecutionHost,
  legalAction: LegalAction,
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
      throw new Error("Variable Icebreaker-Pump-Kosten sind nicht mehr gueltig.");
  }
  host.payment.spendRunnerRunCredits(
    legalAction.costs[0]?.credits ?? 1,
    breakerId,
  );
  if (breakerId && host.fort.shouldOpenAardvarkInterception(breakerId)) {
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
    const previous = host.run.runRemainderStrengthBonusForBreaker(run, breakerId);
    run.remainderStrengthBonusByBreaker = {
      ...(run.remainderStrengthBonusByBreaker ?? {}),
      [breakerId]: previous + pumpAmount,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runRemainderStrengthBonusApplied: true,
      runRemainderStrengthBonusAfter: previous + pumpAmount,
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
      Math.floor(host.turn.ensureRunnerTurnFlags().forgoNextActionsPending ?? 0),
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility:
        "japanese_water_torture_future_action_debt",
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
    host.breaker.resolveMultiBreakSubroutinesAction(breakerId, legalAction);
    host.tracking.recordBartmossEncounterUsage(breakerId);
    host.tracking.recordDupreBreakUsage(breakerId);
    host.tracking.recordSnowballBreakUsage(breakerId);
    if (breakAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
    return;
  }
  if (!host.state.run?.encounteredIceId)
    throw new Error("Subroutine kann nur im ICE-Encounter gebrochen werden.");
  if (host.state.run.noBreakSubroutinesActive)
    throw new Error("Subroutinen koennen in diesem Encounter nicht gebrochen werden.");
  const iceDefinition = host.cards.definitionFor(host.state.run.encounteredIceId);
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
    return;
  }
  host.breaker.assertBreakSubroutineCostQuoteValid(
    breakerId,
    legalAction,
    currentSubroutine,
  );
  host.payment.spendRunnerRunCredits(
    legalAction.costs[0]?.credits ?? 1,
    breakerId,
  );
  if (breakerId && host.fort.shouldOpenAardvarkInterception(breakerId)) {
    host.fort.startAardvarkInterceptionChoice(
      breakerId,
      "break_subroutine",
      legalAction,
    );
    return;
  }
  if (breakerId) {
    if (breakAbility?.special === "blink_random_break_or_net_damage") {
      host.breaker.resolveBlinkBreakSubroutineAction(
        breakerId,
        Number(legalAction.payload?.subroutineIndex),
        legalAction,
      );
      if (breakAbility.onUseEndRun) host.run.finishRun(false, legalAction);
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
    host.fort.applyPostBreakStealthLoss(breakerId, legalAction);
    host.tracking.recordBartmossEncounterUsage(breakerId);
    host.tracking.recordDupreBreakUsage(breakerId);
    host.tracking.recordSnowballBreakUsage(breakerId);
    recordNextSentryFreeBreakIfEarned(host, breakerId, breakAbility);
    if (breakAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
  }
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
  if (!run.nextSentryFreeBreakByBreaker?.[breakerId])
    throw new Error("Es gibt keinen offenen Free-Break-Effekt.");
  if (run.nextSentryFreeBreakTargetIceByBreaker?.[breakerId] !== run.encounteredIceId)
    throw new Error("Der Free-Break-Effekt gilt nur für das nächste ICE.");
  const iceDefinition = host.cards.definitionFor(run.encounteredIceId);
  if (
    !host.cards
      .effectiveSubtypesForCard(run.encounteredIceId, iceDefinition)
      .includes("sentry")
  )
    throw new Error("Der Free-Break-Effekt gilt nur für das nächste Sentry.");
  if (
    run.brokenSubroutineIndexes.includes(subroutineIndex) ||
    run.resolvedSubroutineIndexes.includes(subroutineIndex)
  )
    throw new Error("Diese Subroutine ist bereits erledigt.");
  if ((legalAction.costs[0]?.credits ?? 0) !== 0)
    throw new Error("Free-Break-Kosten sind nicht mehr gueltig.");
  host.effects.executeEffectCommands([{ type: "break_subroutine", subroutineIndex }]);
  const pending = { ...(run.nextSentryFreeBreakByBreaker ?? {}) };
  const targetPending = { ...(run.nextSentryFreeBreakTargetIceByBreaker ?? {}) };
  delete pending[breakerId];
  delete targetPending[breakerId];
  if (Object.keys(pending).length > 0) {
    run.nextSentryFreeBreakByBreaker = pending;
    run.nextSentryFreeBreakTargetIceByBreaker = targetPending;
  } else {
    delete run.nextSentryFreeBreakByBreaker;
    delete run.nextSentryFreeBreakTargetIceByBreaker;
  }
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
    breakAbility?.special !==
    "set_next_sentry_free_break_after_fully_breaking_wall"
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
  const subroutineCount = host.run.currentEncounterSubroutines(iceDefinition).length;
  if (subroutineCount === 0) return;
  for (let index = 0; index < subroutineCount; index += 1) {
    if (!run.brokenSubroutineIndexes.includes(index)) return;
  }
  run.nextSentryFreeBreakByBreaker = {
    ...(run.nextSentryFreeBreakByBreaker ?? {}),
    [breakerId]: run.encounteredIceId,
  };
}
