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
import type {
  HiddenZoneTriggerExecutionResult,
} from "./hidden-zone-trigger-execution";

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
    cardImplementationForDefinitionId?: (definitionId: string) => any;
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
  actionEconomy?: {
    acceptExtraActionOffer: (state: GameState, legalAction: LegalAction) => void;
    declineExtraActionOffer: (state: GameState, legalAction: LegalAction) => void;
    resolvePdcaCounterAction: (state: GameState, legalAction: LegalAction) => void;
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
    handleHiddenZoneTriggerExecution: (
      legalAction: LegalAction,
    ) => HiddenZoneTriggerExecutionResult;
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
  if (legalAction.payload?.actionEconomyAbility === "accept_extra_action_offer") {
    if (!host.actionEconomy) throw new Error("Action-Economy-Host fehlt.");
    host.actionEconomy.acceptExtraActionOffer(state, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.actionEconomyAbility === "decline_extra_action_offer") {
    if (!host.actionEconomy) throw new Error("Action-Economy-Host fehlt.");
    host.actionEconomy.declineExtraActionOffer(state, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.actionEconomyAbility === "pdca_counter_gain_action") {
    if (!host.actionEconomy) throw new Error("Action-Economy-Host fehlt.");
    host.actionEconomy.resolvePdcaCounterAction(state, legalAction);
    return handled(legalAction);
  }
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
  if (host.hiddenZone.handleHiddenZoneTriggerExecution(legalAction).handled)
    return handled(legalAction);
  if (legalAction.payload?.runnerAbility === "pirate_broadcast_sequence_failed") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf die Pirate-Broadcast-Sequenz abschließen.");
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error("Pirate Broadcast kann nur im Runner-Aktionsfenster scheitern.");
    const flags = host.runner.ensureTurnFlags(state);
    if (!flags.pirateBroadcastPending)
      throw new Error("Es ist keine Pirate-Broadcast-Sequenz offen.");
    delete flags.pirateBroadcastPending;
    flags.forgoNextActionsPending =
      Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + 1;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      pirateBroadcastFailed: true,
      pirateBroadcastSequenceFailed: true,
      actionDebtAdded: 1,
      forgoNextActionsPending: flags.forgoNextActionsPending,
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerAbility === "change_icebreaker_subtype") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf den Icebreaker-Typ ändern.");
    const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
    if (!state.runner.rig.programs.includes(sourceCardId))
      throw new Error("Der Icebreaker ist nicht installiert.");
    const definition = host.cards.definitionFor(state, sourceCardId);
    const change =
      host.cards.cardImplementationForDefinitionId?.(definition.id)
        ?.icebreakerSubtypeChange;
    const selectedSubtype = String(legalAction.payload?.selectedSubtype ?? "");
    if (!change || !change.choices.includes(selectedSubtype))
      throw new Error("Der gewählte Icebreaker-Typ ist nicht gültig.");
    if (
      change.timing === "runner_main" &&
      (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
    )
      throw new Error("Der Icebreaker-Typ kann nur im Runner-Zug geändert werden.");
    if (
      change.timing === "during_run" &&
      (!state.run || state.run.phase !== "encounter_ice" || state.activeSide !== "runner")
    )
      throw new Error("Der Icebreaker-Typ kann nur im Encounter geändert werden.");
    if (
      change.limit === "once_until_selected" &&
      state.cardInstances[sourceCardId]?.selectedSubtype
    )
      throw new Error("Der Icebreaker-Typ wurde bereits gewählt.");
    if (change.cost.clicks > 0) host.actions.spendClick(state, "runner");
    if (change.cost.credits > 0)
      host.credits.spend(state, "runner", change.cost.credits);
    state.cardInstances[sourceCardId] = {
      ...state.cardInstances[sourceCardId]!,
      selectedSubtype,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      selectedSubtype,
      runnerCreditsAfter: state.runner.credits,
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerAbility === "boost_icebreaker_for_run") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf den Icebreaker verstärken.");
    if (!state.run)
      throw new Error("Die Stärkeverstärkung gilt nur während eines Runs.");
    const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
    const targetCardId = String(
      legalAction.payload?.targetCardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.programs.includes(sourceCardId))
      throw new Error("Die Support-Quelle ist nicht installiert.");
    if (!state.runner.rig.programs.includes(targetCardId))
      throw new Error("Das Ziel-Icebreaker-Programm ist nicht installiert.");
    const targetDefinition = host.cards.definitionFor(state, targetCardId);
    if (!targetDefinition.subtypes.includes("icebreaker"))
      throw new Error("Das Ziel ist kein Icebreaker.");
    const boost =
      host.cards.cardImplementationForDefinitionId?.(
        host.cards.definitionFor(state, sourceCardId).id,
      )?.runnerRunStrengthBoost;
    if (!boost) throw new Error("Die Support-Quelle hat keine Run-Verstärkung.");
    if (state.cardInstances[sourceCardId]?.tapped)
      throw new Error("Die Support-Quelle ist bereits getappt.");
    const used = state.run.runStrengthBoostUsedSourceIds ?? [];
    if (used.includes(sourceCardId))
      throw new Error("Diese Support-Quelle wurde in diesem Run bereits genutzt.");
    if (boost.cost?.tap) {
      state.cardInstances[sourceCardId] = {
        ...state.cardInstances[sourceCardId]!,
        tapped: true,
      };
    }
    state.run.runStrengthBoostUsedSourceIds = [...used, sourceCardId].sort();
    state.run.remainderStrengthBonusByBreaker = {
      ...(state.run.remainderStrengthBonusByBreaker ?? {}),
      [targetCardId]:
        Math.max(
          0,
          Math.floor(
            state.run.remainderStrengthBonusByBreaker?.[targetCardId] ?? 0,
          ),
        ) + boost.amount,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      strengthBonusApplied: boost.amount,
      targetDefinitionId: targetDefinition.id,
    };
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
