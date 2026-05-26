import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type {
  RunFortTriggerExecutionResult,
} from "./run-fort-trigger-execution";
import type {
  RunnerSpecialTriggerExecutionResult,
} from "./runner-special-trigger-execution";
import type {
  CounterUtilityTriggerExecutionResult,
} from "./counter-utility-trigger-execution";

export type TriggerAbilityExecutionHost = {
  state: GameState;
  actions: {
    spendClick: (state: GameState, side: Side) => void;
  };
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    remainingReplacementLongtailKindForCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => string | undefined;
  };
  credits: {
    spend: (state: GameState, side: Side, amount: number) => void;
  };
  runner: {
    trashInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    ensureTurnFlags: (
      state: GameState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
  };
  corp: {
    acmeSavingsAndLoanObligationCount: (state: GameState) => number;
    removeAcmeSavingsAndLoanObligation: (state: GameState) => void;
  };
  runnerSpecial: {
    handleRunnerSpecialTriggerExecution: (
      legalAction: LegalAction,
    ) => RunnerSpecialTriggerExecutionResult;
  };
  runFort: {
    handleRunFortTriggerExecution: (
      legalAction: LegalAction,
    ) => RunFortTriggerExecutionResult;
  };
  counterUtility: {
    handleCounterUtilityTriggerExecution: (
      legalAction: LegalAction,
    ) => CounterUtilityTriggerExecutionResult;
  };
  hiddenZone: {
    handleMysteryBoxTopFiveProgramInstallActivation: (
      legalAction: LegalAction,
    ) => void;
  };
  constants: {
    CODE_VIRAL_CACHE_ID: string;
  };
};

export type TriggerAbilityExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
};

export function handleTriggerAbilityExecution(
  host: TriggerAbilityExecutionHost,
  legalAction: LegalAction,
): TriggerAbilityExecutionResult {
  if (legalAction.type !== "trigger_ability") return { handled: false };

  const { state } = host;
  if (host.runnerSpecial.handleRunnerSpecialTriggerExecution(legalAction).handled)
    return handled(legalAction);
  if (legalAction.payload?.corpAbility === "trash_code_viral_cache") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf Code Viral Cache trashen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.resources.includes(sourceCardId))
      throw new Error("Code Viral Cache ist nicht installiert.");
    if (
      host.cards.definitionFor(state, sourceCardId).id !==
      host.constants.CODE_VIRAL_CACHE_ID
    )
      throw new Error("Die Code-Viral-Cache-Faehigkeit passt nicht zur Karte.");
    host.actions.spendClick(state, "corp");
    host.credits.spend(state, "corp", 5);
    host.runner.trashInstalledCardToHeap(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      trashedCardDefinitionId: host.constants.CODE_VIRAL_CACHE_ID,
      corpCreditsAfter: state.corp.credits,
    };
    return handled(legalAction);
  }
  if (host.counterUtility.handleCounterUtilityTriggerExecution(legalAction).handled)
    return handled(legalAction);
  if (host.runFort.handleRunFortTriggerExecution(legalAction).handled)
    return handled(legalAction);
  if (
    legalAction.payload?.v1915RunnerProgramAbility ===
    "mystery_box_top5_program_install"
  ) {
    host.hiddenZone.handleMysteryBoxTopFiveProgramInstallActivation(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerAbility === "wilson_gain_run_action") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Wilson nutzen.");
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error("Wilson ist nur im Runner-Zug nutzbar.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (
      !state.runner.rig.resources.includes(sourceCardId) ||
      host.cards.remainingReplacementLongtailKindForCard(
        state,
        sourceCardId,
      ) !== "wilson_run_action_spending_cap"
    )
      throw new Error("Wilson ist nicht installiert.");
    const flags = host.runner.ensureTurnFlags(state);
    const used = flags.wilsonUsedSourceIdsThisTurn ?? [];
    if (used.includes(sourceCardId))
      throw new Error("Wilson wurde diesen Zug bereits genutzt.");
    flags.wilsonUsedSourceIdsThisTurn = [...used, sourceCardId];
    flags.wilsonRunOnlyActionsRemaining =
      Math.max(0, Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0)) + 1;
    state.runner.clicks += 1;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      wilsonRunOnlyActionsRemaining: flags.wilsonRunOnlyActionsRemaining,
      runnerClicksAfter: state.runner.clicks,
    };
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1920RunnerRunLockAbility ===
    "fang_2_0_pay_to_run"
  ) {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf die Run-Sperre entfernen.");
    host.actions.spendClick(state, "runner");
    const cost = Number(legalAction.payload?.fangRunLockCreditCost ?? 0);
    const pendingCost = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.fangRunLockCreditCost ?? 0),
    );
    if (!Number.isInteger(cost) || cost <= 0 || cost !== pendingCost)
      throw new Error("Die Run-Sperre verlangt den aktuellen Betrag.");
    host.credits.spend(state, "runner", cost);
    host.runner.ensureTurnFlags(state).fangRunLockCreditCost = 0;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      fangRunLockCleared: true,
      runnerRunLockCleared: true,
      runnerCreditsAfter: state.runner.credits,
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.acmeSavingsAndLoanAbility === "remove_obligation") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf ACME Savings and Loan abloesen.");
    const obligationsBefore = host.corp.acmeSavingsAndLoanObligationCount(state);
    if (obligationsBefore <= 0)
      throw new Error(
        "Es gibt keine aktive ACME-Savings-and-Loan-Verpflichtung.",
      );
    const creditCost = Number(
      legalAction.payload?.acmeSavingsAndLoanCreditCost ?? 0,
    );
    if (!Number.isInteger(creditCost) || creditCost !== 12)
      throw new Error("ACME Savings and Loan verlangt genau 12 Credits.");
    const scorePoints = Number(
      legalAction.payload?.acmeSavingsAndLoanScoreAgendaPoints ?? 0,
    );
    if (!Number.isInteger(scorePoints) || scorePoints !== 1)
      throw new Error("ACME Savings and Loan scored genau 1 Agenda-Punkt.");
    host.actions.spendClick(state, "corp");
    host.credits.spend(state, "corp", creditCost);
    host.corp.removeAcmeSavingsAndLoanObligation(state);
    state.corpBonusAgendaPoints =
      Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0)) + scorePoints;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      acmeSavingsAndLoanObligationsBefore: obligationsBefore,
      acmeSavingsAndLoanObligationsAfter:
        host.corp.acmeSavingsAndLoanObligationCount(state),
      acmeDebtActive: host.corp.acmeSavingsAndLoanObligationCount(state) > 0,
      acmeSavingsAndLoanPaymentPaid: creditCost,
      gainedAgendaPoints: scorePoints,
      corpBonusAgendaPointsAfter: state.corpBonusAgendaPoints,
      corpCreditsAfter: state.corp.credits,
    };
    return handled(legalAction);
  }
  throw new Error(
    "Generische Abilities sind vorbereitet, aber in V0.93 nicht sichtbar freigeschaltet.",
  );
}

function handled(legalAction: LegalAction): TriggerAbilityExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
