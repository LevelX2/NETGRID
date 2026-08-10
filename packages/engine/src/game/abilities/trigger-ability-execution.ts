import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import {
  closeRunnerCostPenaltySupportWindowForPayment,
  openRunnerCostPenaltySupportWindow,
} from "../payment/runner-payment-support";
import type { RunFortTriggerExecutionResult } from "./run-fort-trigger-execution";
import type { RunnerSpecialTriggerExecutionResult } from "./runner-special-trigger-execution";
import type { CounterUtilityTriggerExecutionResult } from "./counter-utility-trigger-execution";
import type { HiddenZoneTriggerExecutionResult } from "./hidden-zone-trigger-execution";
import {
  RESTRICTED_ACTION_GRANT_KEYS,
  restrictedActionGrantRemaining,
  clearRestrictedActionGrant,
} from "../state/restricted-action-grants";

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
    activeObligationCount: (state: GameState) => number;
    removeActiveObligation: (state: GameState) => void;
  };
  actionEconomy?: {
    acceptExtraActionOffer: (
      state: GameState,
      legalAction: LegalAction,
    ) => void;
    declineExtraActionOffer: (
      state: GameState,
      legalAction: LegalAction,
    ) => void;
    resolvePdcaCounterAction: (
      state: GameState,
      legalAction: LegalAction,
    ) => void;
    resolveForcedActionNotPossible: (
      state: GameState,
      legalAction: LegalAction,
    ) => void;
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
  const runnerCreditCost = legalAction.costs[0]?.credits ?? 0;
  if (legalAction.side === "runner" && runnerCreditCost > 0) {
    if (
      openRunnerCostPenaltySupportWindow(state, legalAction, {
        amount: runnerCreditCost,
        availableWithoutSupport: state.runner.credits,
        context: "runner_pool",
      })
    )
      return handled(legalAction);
    closeRunnerCostPenaltySupportWindowForPayment(
      state,
      legalAction,
      runnerCreditCost,
    );
  }
  if (
    legalAction.payload?.actionEconomyAbility === "accept_extra_action_offer"
  ) {
    if (!host.actionEconomy) throw new Error("Action-Economy-Host fehlt.");
    host.actionEconomy.acceptExtraActionOffer(state, legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.actionEconomyAbility === "decline_extra_action_offer"
  ) {
    if (!host.actionEconomy) throw new Error("Action-Economy-Host fehlt.");
    host.actionEconomy.declineExtraActionOffer(state, legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.actionEconomyAbility ===
    "decline_edgerunner_temps_install_actions"
  ) {
    if (legalAction.side !== "corp")
      throw new Error(
        "Nur die Korp darf Edgerunner-Installationsaktionen überspringen.",
      );
    if (state.phase !== "corp_action_phase" || state.activeSide !== "corp")
      throw new Error(
        "Edgerunner-Installationsaktionen können nur im Corp-Aktionsfenster übersprungen werden.",
      );
    const flags = state.corpTurnFlags;
    const remaining = restrictedActionGrantRemaining(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
    );
    if (remaining <= 0)
      throw new Error("Es sind keine Edgerunner-Installationsaktionen offen.");
    state.corp.clicks = Math.max(0, state.corp.clicks - remaining);
    if (flags) {
      clearRestrictedActionGrant(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
      );
      flags.edgerunnerTempsInstallActionsRemaining = 0;
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      edgerunnerTempsInstallActionsSkipped: remaining,
      edgerunnerTempsInstallActionsRemaining: 0,
      corpClicksAfter: state.corp.clicks,
    };
    return handled(legalAction);
  }
  if (
    legalAction.payload?.actionEconomyAbility === "pdca_counter_gain_action"
  ) {
    if (!host.actionEconomy) throw new Error("Action-Economy-Host fehlt.");
    host.actionEconomy.resolvePdcaCounterAction(state, legalAction);
    return handled(legalAction);
  }
  if (
    legalAction.payload?.actionEconomyAbility === "forced_action_not_possible"
  ) {
    if (!host.actionEconomy) throw new Error("Action-Economy-Host fehlt.");
    host.actionEconomy.resolveForcedActionNotPossible(state, legalAction);
    return handled(legalAction);
  }
  if (
    host.runnerSpecial.handleRunnerSpecialTriggerExecution(legalAction).handled
  )
    return handled(legalAction);
  if (
    legalAction.payload?.corpAbility ===
    "trash_installed_runner_resource_source"
  ) {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Runner-Resource trashen.");
    if (
      legalAction.payload?.abilityKind !==
      "corp_trash_installed_runner_resource"
    )
      throw new Error("Die Corp-Trash-Ability ist ungueltig.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.resources.includes(sourceCardId))
      throw new Error("Die Runner-Resource ist nicht installiert.");
    const definition = host.cards.definitionFor(state, sourceCardId);
    if (definition.type !== "resource")
      throw new Error("Die Corp-Trash-Ability passt nicht zu diesem Ziel.");
    const corpTrashAbility = host.cards.cardImplementationForDefinitionId?.(
      definition.id,
    )?.corpTrashInstalledRunnerSource;
    if (
      !corpTrashAbility ||
      corpTrashAbility.kind !== "corp_trash_installed_runner_resource" ||
      corpTrashAbility.timing !== "corp_main" ||
      corpTrashAbility.target !== "source"
    )
      throw new Error(
        "Die Runner-Resource deklariert keine Corp-Trash-Ability.",
      );
    host.actions.spendClick(state, "corp");
    host.credits.spend(state, "corp", corpTrashAbility.cost.credits);
    host.runner.trashInstalledCardToHeap(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definition.id,
      trashCostPaid: corpTrashAbility.cost.credits,
      trashedCardDefinitionId: definition.id,
      corpCreditsAfter: state.corp.credits,
    };
    return handled(legalAction);
  }
  if (
    host.counterUtility.handleCounterUtilityTriggerExecution(legalAction)
      .handled
  )
    return handled(legalAction);
  if (host.runFort.handleRunFortTriggerExecution(legalAction).handled)
    return handled(legalAction);
  if (host.hiddenZone.handleHiddenZoneTriggerExecution(legalAction).handled)
    return handled(legalAction);
  if (
    legalAction.payload?.runnerAbility === "decline_successful_run_extra_run"
  ) {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf den Bodyweight-Bonus-Run ablehnen.");
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error(
        "Der Bodyweight-Bonus-Run kann nur im unmittelbaren Runner-Fenster abgelehnt werden.",
      );
    const flags = host.runner.ensureTurnFlags(state);
    if (flags.successfulRunExtraRunPending !== true)
      throw new Error("Es ist kein Bodyweight-Bonus-Run offen.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? legalAction.source ?? "",
    ) as CardInstanceId;
    if (!sourceCardId || !state.runner.rig.hardware.includes(sourceCardId))
      throw new Error("Bodyweight Data Crèche ist nicht installiert.");
    const sourceDefinitionId = host.cards.definitionFor(state, sourceCardId).id;
    const implementation = host.cards.cardImplementationForDefinitionId?.(
      sourceDefinitionId,
    );
    if (
      !implementation?.successfulRunFollowups?.some(
        (followup: { kind?: string }) =>
          followup.kind === "optional_make_run_after_successful_run",
      ) ||
      legalAction.payload?.sourceDefinitionId !== sourceDefinitionId
    )
      throw new Error("Die Quelle des Bodyweight-Fensters ist ungültig.");
    flags.successfulRunExtraRunPending = false;
    flags.bonusRunPending = false;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      successfulRunExtraRunDecision: "decline",
      successfulRunExtraRunPending: false,
      successfulRunExtraRunUsedThisTurn:
        flags.successfulRunExtraRunUsedThisTurn === true,
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerAbility === "decline_optional_bonus_run") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf den optionalen Bonus-Run ablehnen.");
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error(
        "Der optionale Bonus-Run kann nur im unmittelbaren Runner-Fenster abgelehnt werden.",
      );
    const flags = host.runner.ensureTurnFlags(state);
    if (
      flags.bonusRunPending !== true ||
      flags.successfulRunExtraRunPending === true ||
      flags.pendingSequences?.some(
        (sequence) =>
          sequence.kind === "multi_server_success_sequence" &&
          sequence.pendingServerIds.length > 0,
      )
    )
      throw new Error("Es ist kein optionaler Bonus-Run offen.");
    flags.bonusRunPending = false;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      optionalBonusRunDecision: "decline",
      optionalBonusRunPending: false,
    };
    return handled(legalAction);
  }
  if (
    legalAction.payload?.runnerAbility ===
    "multi_server_success_sequence_failed"
  ) {
    if (legalAction.side !== "runner")
      throw new Error(
        "Nur der Runner darf die offene Run-Sequenz abschliessen.",
      );
    if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
      throw new Error(
        "Die offene Run-Sequenz kann nur im Runner-Aktionsfenster scheitern.",
      );
    const flags = host.runner.ensureTurnFlags(state);
    const pendingSequence = flags.pendingSequences?.find(
      (sequence) =>
        sequence.kind === "multi_server_success_sequence" &&
        sequence.pendingServerIds.length > 0,
    );
    if (!pendingSequence)
      throw new Error("Es ist keine passende Run-Sequenz offen.");
    const remainingSequences = (flags.pendingSequences ?? []).filter(
      (sequence) => sequence !== pendingSequence,
    );
    if (remainingSequences.length > 0)
      flags.pendingSequences = remainingSequences;
    else delete flags.pendingSequences;
    flags.forgoNextActionsPending =
      Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + 1;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      multiServerSuccessSequenceFailed: true,
      actionDebtAdded: 1,
      forgoNextActionsPending: flags.forgoNextActionsPending,
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.runnerAbility === "change_icebreaker_subtype") {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf den Icebreaker-Typ ändern.");
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.runner.rig.programs.includes(sourceCardId))
      throw new Error("Der Icebreaker ist nicht installiert.");
    const definition = host.cards.definitionFor(state, sourceCardId);
    const change = host.cards.cardImplementationForDefinitionId?.(
      definition.id,
    )?.icebreakerSubtypeChange;
    const selectedSubtype = String(legalAction.payload?.selectedSubtype ?? "");
    if (!change || !change.choices.includes(selectedSubtype))
      throw new Error("Der gewählte Icebreaker-Typ ist nicht gültig.");
    if (
      change.timing === "runner_main" &&
      (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
    )
      throw new Error(
        "Der Icebreaker-Typ kann nur im Runner-Zug geändert werden.",
      );
    if (
      change.timing === "during_run" &&
      (!state.run ||
        state.run.phase !== "encounter_ice" ||
        state.activeSide !== "runner")
    )
      throw new Error(
        "Der Icebreaker-Typ kann nur im Encounter geändert werden.",
      );
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
    if (state.run.phase !== "encounter_ice")
      throw new Error(
        "Die Stärkeverstärkung ist nur während einer ICE-Begegnung erlaubt.",
      );
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
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
    const boost = host.cards.cardImplementationForDefinitionId?.(
      host.cards.definitionFor(state, sourceCardId).id,
    )?.runnerRunStrengthBoost;
    if (!boost)
      throw new Error("Die Support-Quelle hat keine Run-Verstärkung.");
    if (boost.cost.tap && state.cardInstances[sourceCardId]?.tapped)
      throw new Error("Die Support-Quelle ist bereits getappt.");
    const used = state.run.runStrengthBoostUsedSourceIds ?? [];
    if (used.includes(sourceCardId))
      throw new Error(
        "Diese Support-Quelle wurde in diesem Run bereits genutzt.",
      );
    if (boost.cost?.tap) {
      state.cardInstances[sourceCardId] = {
        ...state.cardInstances[sourceCardId]!,
        tapped: true,
      };
    }
    if (boost.cost.trashSelf) {
      host.runner.trashInstalledCardToHeap(state, sourceCardId, legalAction);
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
      ...(boost.cost.trashSelf ? { selfTrashed: true } : {}),
      targetDefinitionId: targetDefinition.id,
    };
    return handled(legalAction);
  }
  if (
    legalAction.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock"
  ) {
    if (legalAction.side !== "runner")
      throw new Error("Nur der Runner darf die Run-Sperre entfernen.");
    host.actions.spendClick(state, "runner");
    const cost = Number(legalAction.payload?.runnerRunLockCreditCost ?? 0);
    const pendingCost = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.runnerRunLockCreditCost ?? 0),
    );
    if (!Number.isInteger(cost) || cost <= 0 || cost !== pendingCost)
      throw new Error("Die Run-Sperre verlangt den aktuellen Betrag.");
    host.credits.spend(state, "runner", cost);
    host.runner.ensureTurnFlags(state).runnerRunLockCreditCost = 0;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerRunLockCleared: true,
      runnerCreditsAfter: state.runner.credits,
    };
    return handled(legalAction);
  }
  if (legalAction.payload?.obligationDebtAbility === "remove_obligation") {
    if (legalAction.side !== "corp")
      throw new Error("Nur die Korp darf ACME Savings and Loan abloesen.");
    const obligationsBefore = host.corp.activeObligationCount(state);
    if (obligationsBefore <= 0)
      throw new Error(
        "Es gibt keine aktive ACME-Savings-and-Loan-Verpflichtung.",
      );
    const creditCost = Number(
      legalAction.payload?.obligationDebtCreditCost ?? 0,
    );
    if (!Number.isInteger(creditCost) || creditCost !== 12)
      throw new Error("ACME Savings and Loan verlangt genau 12 Credits.");
    const scorePoints = Number(
      legalAction.payload?.obligationDebtScoreAgendaPoints ?? 0,
    );
    if (!Number.isInteger(scorePoints) || scorePoints !== 1)
      throw new Error("ACME Savings and Loan scored genau 1 Agenda-Punkt.");
    host.actions.spendClick(state, "corp");
    host.credits.spend(state, "corp", creditCost);
    host.corp.removeActiveObligation(state);
    state.corpBonusAgendaPoints =
      Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0)) + scorePoints;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      obligationDebtCountBefore: obligationsBefore,
      obligationDebtCountAfter: host.corp.activeObligationCount(state),
      obligationDebtActive: host.corp.activeObligationCount(state) > 0,
      obligationDebtPaymentPaid: creditCost,
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
