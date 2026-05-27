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
  };
  run: {
    currentRun: () => ActiveRun;
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
    (breakAbility?.count ?? 1) > 1 &&
    typeof legalAction.payload?.subroutineIndexes === "string"
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
    if (breakAbility?.onUseEndRun) host.run.finishRun(false, legalAction);
  }
}
