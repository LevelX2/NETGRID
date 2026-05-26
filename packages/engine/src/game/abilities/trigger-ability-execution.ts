import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";

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
  delegates: {
    resolveSelfModifyingCodeAbility: (legalAction: LegalAction) => void;
    resolveCorpTrashNewDataFortCreationLockSource: (
      legalAction: LegalAction,
    ) => void;
    resolveSuccessfulRunFollowupAbility: (legalAction: LegalAction) => {
      handled: boolean;
    };
    resolveFullyBrokenPassedIceDerezAndEndRun: (
      legalAction: LegalAction,
    ) => void;
    resolveStartupImmolatorTrashIce: (legalAction: LegalAction) => void;
    handleMysteryBoxTopFiveProgramInstallActivation: (
      legalAction: LegalAction,
    ) => void;
    resolveMicrotechBackupDriveReturnTopHosted: (
      legalAction: LegalAction,
    ) => void;
    resolveFortPassAdvancementWindow: (legalAction: LegalAction) => void;
    resolveStartRunIceRepositionWindow: (legalAction: LegalAction) => void;
    resolvePreyingMantisGainAction: (legalAction: LegalAction) => void;
    resolveCorpRemoveSpyCounter: (legalAction: LegalAction) => void;
    resolveJunkyardBbsAbility: (legalAction: LegalAction) => void;
    resolveShellTradersSetAside: (legalAction: LegalAction) => void;
    resolveShellTradersRemoveCounter: (legalAction: LegalAction) => void;
    resolveRemoveRunnerTraceCounter: (legalAction: LegalAction) => void;
    resolveApproachIceExposeAbility: (legalAction: LegalAction) => void;
    resolveApproachIceExposeViewingDecision: (
      legalAction: LegalAction,
    ) => void;
    startSingaporeCityGridSwapChoice: (legalAction: LegalAction) => void;
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
  if (
    legalAction.payload?.v1911HiddenZoneAbility ===
    "self_modifying_code_install_program"
  ) {
    host.delegates.resolveSelfModifyingCodeAbility(legalAction);
    return handled(legalAction);
  }
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
  if (
    legalAction.payload?.corpAbility ===
    "trash_new_data_fort_creation_lock_source"
  ) {
    host.delegates.resolveCorpTrashNewDataFortCreationLockSource(legalAction);
    return handled(legalAction);
  }
  if (host.delegates.resolveSuccessfulRunFollowupAbility(legalAction).handled)
    return handled(legalAction);
  if (
    legalAction.payload?.runnerUtilityAbility ===
    "derez_fully_broken_passed_ice_and_end_run"
  ) {
    host.delegates.resolveFullyBrokenPassedIceDerezAndEndRun(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1922RunnerProgramAbility ===
    "startup_immolator_trash_ice"
  ) {
    host.delegates.resolveStartupImmolatorTrashIce(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1915RunnerProgramAbility ===
    "mystery_box_top5_program_install"
  ) {
    host.delegates.handleMysteryBoxTopFiveProgramInstallActivation(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1922RunnerHardwareAbility ===
    "microtech_backup_drive_return_top_hosted"
  ) {
    host.delegates.resolveMicrotechBackupDriveReturnTopHosted(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.fortRunWindowAbility ===
    "add_advancement_counters_after_passing_last_ice_on_this_fort"
  ) {
    host.delegates.resolveFortPassAdvancementWindow(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.fortRunWindowAbility ===
    "move_self_to_different_position_on_same_fort"
  ) {
    host.delegates.resolveStartRunIceRepositionWindow(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerUtilityAbility === "preying_mantis_gain_action") {
    host.delegates.resolvePreyingMantisGainAction(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.corpAbility === "remove_spy_counter") {
    host.delegates.resolveCorpRemoveSpyCounter(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.resourceAbility ===
    "junkyard_bbs_return_top_heap"
  ) {
    host.delegates.resolveJunkyardBbsAbility(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.shellTradersAbility === "set_aside_from_grip") {
    host.delegates.resolveShellTradersSetAside(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.shellTradersAbility === "remove_shell_counter") {
    host.delegates.resolveShellTradersRemoveCounter(legalAction);
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
  if (legalAction.payload?.runnerAbility === "remove_runner_trace_counter") {
    host.delegates.resolveRemoveRunnerTraceCounter(legalAction);
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
  if (legalAction.payload?.approachIceExposeDecision) {
    host.delegates.resolveApproachIceExposeAbility(legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.approachIceExposeViewDecision) {
    host.delegates.resolveApproachIceExposeViewingDecision(legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1918UpgradeAbility ===
    "singapore_city_grid_hq_ice_swap"
  ) {
    host.delegates.startSingaporeCityGridSwapChoice(legalAction);
    return handled(legalAction);
  }
  throw new Error(
    "Generische Abilities sind vorbereitet, aber in V0.93 nicht sichtbar freigeschaltet.",
  );
}

function handled(legalAction: LegalAction): TriggerAbilityExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
