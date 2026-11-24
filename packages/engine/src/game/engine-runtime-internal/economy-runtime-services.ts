import { type CardDefinition, type CardInstanceId, type GameState, type LegalAction } from "@netgrid/shared";
import { definitionFor } from "../state/card-server-lookup";
import { ensureCorpTurnFlags, ensureRunnerTurnFlags, setCardCounter } from "../state/turn-flags-counters";
import { RESTRICTED_ACTION_GRANT_KEYS, clearRestrictedActionGrant, consumeRestrictedActionGrant, restrictedActionGrant, restrictedActionGrantRemaining, restrictedActionGrantTemporaryCredits } from "../state/restricted-action-grants";
import { type RunnerDrawActionContext } from "../turn/runner-draw-actions";
import { runnerMemoryLimit } from "../../ability-engine/effective-values";
import type { RuntimeDeps } from "./runtime-shared";

export function createEconomyRuntimeServices(
  deps: RuntimeDeps,
): import("./economy-runtime-port").EconomyRuntimePort {
  function expireScoredAgendaInstallRezCreditAbilities(state: GameState): void {
    for (const agendaId of state.corp.scoreArea) {
      const definition = definitionFor(state, agendaId);
      if (
        deps.scoredAgendaKindForDefinition(definition) ===
        "scored_agenda_credit_until_install_or_rez"
      )
        setCardCounter(state, agendaId, "mark", 0);
    }
  }

  function isCorpInstallableCardType(definition: CardDefinition): boolean {
    return (
      definition.side === "corp" &&
      (definition.type === "ice" ||
        definition.type === "agenda" ||
        definition.type === "asset" ||
        definition.type === "upgrade")
    );
  }

  function edgerunnerTempsInstallActionsRemaining(state: GameState): number {
    const grant = restrictedActionGrant(
      state.corpTurnFlags,
      RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
    );
    if (grant)
      return restrictedActionGrantRemaining(
        state.corpTurnFlags,
        RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
      );
    return Math.max(
      0,
      Math.floor(
        state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining ?? 0,
      ),
    );
  }

  function clearEdgerunnerTempsInstallFlags(state: GameState): void {
    const flags = ensureCorpTurnFlags(state);
    clearRestrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
    );
    flags.edgerunnerTempsInstallActionsRemaining = 0;
  }

  function consumeEdgerunnerTempsInstallAction(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (
      legalAction.side !== "corp" ||
      legalAction.type !== "install_card" ||
      legalAction.payload?.v1922EdgerunnerTempsInstallAction !== true
    )
      return;
    const flags = ensureCorpTurnFlags(state);
    const remainingBefore = edgerunnerTempsInstallActionsRemaining(state);
    if (remainingBefore <= 0)
      throw new Error(
        "Edgerunner, Inc., Temps hat keine Installationsaktionen mehr.",
      );
    const remainingAfter = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
    )
      ? consumeRestrictedActionGrant(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
        )
      : Math.max(0, remainingBefore - 1);
    flags.edgerunnerTempsInstallActionsRemaining = remainingAfter;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922CorpOperationAbility: "install_action_bundle",
      edgerunnerTempsInstallActionSpent: true,
      edgerunnerTempsInstallActionsRemaining:
        flags.edgerunnerTempsInstallActionsRemaining,
    };
  }

  function valuPakProgramInstallActionsRemaining(state: GameState): number {
    const flags = ensureRunnerTurnFlags(state);
    const grant = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    );
    if (grant)
      return restrictedActionGrantRemaining(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      );
    return Math.max(
      0,
      Math.floor(flags.valuPakProgramInstallActionsRemaining ?? 0),
    );
  }

  function valuPakTemporaryProgramInstallCredits(state: GameState): number {
    const flags = ensureRunnerTurnFlags(state);
    const grant = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    );
    if (grant)
      return restrictedActionGrantTemporaryCredits(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      );
    return Math.max(
      0,
      Math.floor(flags.valuPakTemporaryProgramInstallCredits ?? 0),
    );
  }

  function runnerInstallableProgramIdsForValuPak(
    state: GameState,
  ): CardInstanceId[] {
    const activeBundle = valuPakProgramInstallActionsRemaining(state) > 0;
    const prospectiveTemporaryCredit = activeBundle ? 0 : 1;
    return state.runner.grip.filter((cardId) => {
      const definition = definitionFor(state, cardId);
      const uniqueBlocked =
        deps.isUniqueCard(definition) &&
        deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id);
      return (
        definition.type === "program" &&
        !uniqueBlocked &&
        deps.availableRunnerProgramInstallCredits(state) +
          prospectiveTemporaryCredit >=
          (definition.installCost ?? 0) &&
        runnerProgramInstallMemoryReachableAfterTrash(state, definition)
      );
    });
  }

  function installedRunnerProgramTrashOptionsForInstall(
    state: GameState,
  ): CardInstanceId[] {
    return state.runner.rig.programs.slice().sort();
  }

  function runnerProgramInstallMemoryReachableAfterTrash(
    state: GameState,
    definition: CardDefinition,
  ): boolean {
    const memoryCost = definition.memoryCost ?? 0;
    if (state.runner.memoryUsed + memoryCost <= runnerMemoryLimit(state))
      return true;
    const maximumFreedMemory = installedRunnerProgramTrashOptionsForInstall(
      state,
    ).reduce((sum, cardId) => {
      if (!deps.runnerProgramUsesMemory(state, cardId)) return sum;
      return sum + (definitionFor(state, cardId).memoryCost ?? 0);
    }, 0);
    return (
      state.runner.memoryUsed + memoryCost - maximumFreedMemory <=
      runnerMemoryLimit(state)
    );
  }

  function shouldOfferRunnerProgramTrashBeforeInstall(
    state: GameState,
    definition: CardDefinition,
  ): boolean {
    return (
      definition.type === "program" &&
      installedRunnerProgramTrashOptionsForInstall(state).length > 0 &&
      runnerProgramInstallMemoryReachableAfterTrash(state, definition)
    );
  }

  function clearValuPakProgramInstallFlags(state: GameState): void {
    const flags = ensureRunnerTurnFlags(state);
    clearRestrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    );
    flags.valuPakProgramInstallActionsRemaining = 0;
    flags.valuPakTemporaryProgramInstallCredits = 0;
  }

  function stopValuPakProgramInstallSequence(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (
      legalAction.side !== "runner" ||
      legalAction.type !== "stop_restricted_action_sequence" ||
      legalAction.payload?.v1922ValuPakSequenceStop !== true
    ) {
      throw new Error(
        "Nur die aktive Valu-Pak-Installationssequenz kann beendet werden.",
      );
    }
    const remainingActions = valuPakProgramInstallActionsRemaining(state);
    if (remainingActions <= 0) {
      throw new Error(
        "Valu-Pak Software Bundle hat keine aktive Installationssequenz.",
      );
    }
    if (state.runner.clicks < remainingActions) {
      throw new Error(
        "Die verbleibenden Valu-Pak-Aktionen überschreiten die Runner-Aktionen.",
      );
    }
    const returnedTemporaryCredits =
      valuPakTemporaryProgramInstallCredits(state);
    state.runner.clicks -= remainingActions;
    clearValuPakProgramInstallFlags(state);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "program_install_action_bundle",
      valuPakSequenceStopped: true,
      valuPakRestrictedActionsForgone: remainingActions,
      valuPakTemporaryCreditsReturned: returnedTemporaryCredits,
      runnerClicksAfter: state.runner.clicks,
    };
  }

  function consumeValuPakProgramInstallAction(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (
      legalAction.side !== "runner" ||
      (legalAction.type !== "install_card" &&
        !(
          legalAction.type === "resolve_choice" &&
          legalAction.payload?.runnerProgramTrashBeforeInstallResolved === true
        )) ||
      legalAction.payload?.v1922ValuPakInstallAction !== true
    )
      return;
    const flags = ensureRunnerTurnFlags(state);
    const remainingBefore = valuPakProgramInstallActionsRemaining(state);
    if (remainingBefore <= 0)
      throw new Error(
        "Valu-Pak Software Bundle hat keine Installationsaktionen mehr.",
      );
    const remainingAfter = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    )
      ? consumeRestrictedActionGrant(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        )
      : Math.max(0, remainingBefore - 1);
    flags.valuPakProgramInstallActionsRemaining = remainingAfter;
    if (remainingAfter <= 0) flags.valuPakTemporaryProgramInstallCredits = 0;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "program_install_action_bundle",
      valuPakInstallActionSpent: true,
      valuPakProgramInstallActionsRemaining:
        flags.valuPakProgramInstallActionsRemaining,
      valuPakTemporaryProgramInstallCreditsAfter:
        valuPakTemporaryProgramInstallCredits(state),
    };
  }

  function runnerDrawActionContext(state: GameState): RunnerDrawActionContext {
    return {
      drawTaxSourceCount: deps.drawTaxSourceIds(state).length,
      projectedDrawCount: deps.activeCrashEverettSourceId(state) ? 2 : 1,
    };
  }

  return {
    expireScoredAgendaInstallRezCreditAbilities,
    isCorpInstallableCardType,
    edgerunnerTempsInstallActionsRemaining,
    clearEdgerunnerTempsInstallFlags,
    consumeEdgerunnerTempsInstallAction,
    valuPakProgramInstallActionsRemaining,
    valuPakTemporaryProgramInstallCredits,
    runnerInstallableProgramIdsForValuPak,
    installedRunnerProgramTrashOptionsForInstall,
    runnerProgramInstallMemoryReachableAfterTrash,
    shouldOfferRunnerProgramTrashBeforeInstall,
    stopValuPakProgramInstallSequence,
    clearValuPakProgramInstallFlags,
    consumeValuPakProgramInstallAction,
    runnerDrawActionContext,
  };
}
