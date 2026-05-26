import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  RunState,
  ServerId,
} from "@netgrid/shared";
import type { CardFortRunWindowImplementation } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  applyRioDeJaneiroCityGridPassedIceTrigger,
  type EncounterSpecialWindowHost,
} from "./encounter-special-windows";
import {
  clearFullyBrokenPassedIcePostPassMarker,
  clearStartupImmolatorPostPassMarker,
  consumeForcedJackOutAfterEncounter,
  handlePostPassProgramTrashChoices,
  passedIceFollowupMarkersForCurrentIce,
  type EncounterResolutionHost,
} from "./encounter-resolution";
import {
  payJackOutAdditionalCost,
  runDurationPaymentHost,
  spendRunnerRunCredits,
} from "./run-duration-payment";
import { clearEncounterTemporaryTraceCredits } from "./run-end-cleanup";

type ActiveRun = NonNullable<GameState["run"]>;

export type RunMovementHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote"> | string) => CorpServer;
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  rules: {
    isV097OrLater: () => boolean;
    corpRunRootRezActionsAvailable: () => boolean;
    approachIceExposeCanBeOfferedForCurrentIce: () => boolean;
  };
  encounter: {
    encounterResolutionHost: () => EncounterResolutionHost;
    encounterSpecialWindowHost: () => EncounterSpecialWindowHost;
    beginEncounter: (
      encounteredIceId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  access: {
    startAccessFromSuccessfulRun: (legalAction?: LegalAction) => void;
  };
  cleanup: {
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
  };
};

export type RunMovementResult = {
  handled: boolean;
  runContinues?: boolean;
  runEnded?: boolean;
  runnerJackedOut?: boolean;
  movedPastIceId?: CardInstanceId | undefined;
  nextIceId?: CardInstanceId;
  approachStarted?: boolean;
  accessShouldStart?: boolean;
  runShouldFinish?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]> | undefined;
  stateChanged?: boolean;
};

export type MovePastCurrentIceResult = RunMovementResult;
export type RunMovementActionResult = RunMovementResult;
export type PostPassIceResult = RunMovementResult & {
  postPassChoiceOpened?: boolean;
  postPassPaymentResolved?: boolean;
};

export function handleRunMovementAction(
  host: RunMovementHost,
  legalAction: LegalAction,
): RunMovementActionResult {
  if (legalAction.type === "jack_out") return jackOutRunner(host, legalAction);
  if (legalAction.type === "continue_run" && host.state.run?.phase === "movement")
    return continueFromMovement(host, legalAction);
  return { handled: false };
}

export function jackOutRunner(
  host: RunMovementHost,
  legalAction: LegalAction,
): RunMovementActionResult {
  const run = host.state.run;
  const serverLabel = run
    ? host.servers.publicServerLabel(run.attackedServerId)
    : undefined;
  const reachedServerBeforeAccess = run?.position.kind === "server";
  const jackOutPayload = {
    ...(legalAction.payload ?? {}),
    ...(serverLabel ? { serverLabel } : {}),
    ...(reachedServerBeforeAccess ? { jackOutBeforeAccess: true } : {}),
  };
  const payment = payJackOutAdditionalCost(
    runDurationPaymentHost(host.state),
    legalAction,
    jackOutPayload,
  );
  host.cleanup.finishRun(false);
  return {
    handled: true,
    runnerJackedOut: true,
    runEnded: true,
    runShouldFinish: true,
    resolvedPayload: payment.resolvedPayload,
    stateChanged: true,
  };
}

export function passApproachedIce(host: RunMovementHost): RunMovementResult {
  const run = mustRun(host.state);
  if (!run.approachedIceId) throw new Error("Kein ICE wird approached.");
  const ice = host.cards.cardInstanceFor(run.approachedIceId);
  if (ice.rezzed) {
    host.encounter.beginEncounter(run.approachedIceId);
    return {
      handled: true,
      approachStarted: true,
      nextIceId: run.approachedIceId,
      stateChanged: true,
    };
  }
  return movePastCurrentIce(host);
}

export function approachOrEncounterIce(
  host: RunMovementHost,
  approachedIceId: CardInstanceId,
  legalAction?: LegalAction,
): RunMovementResult {
  const state = host.state;
  const run = mustRun(state);
  const ice = host.cards.cardInstanceFor(approachedIceId);
  run.approachedIceId = approachedIceId;
  if (run.socialEngineeringAutoPassIceId === approachedIceId) {
    delete run.socialEngineeringAutoPassIceId;
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        autoPassChosenIce: true,
        socialEngineeringAutoPassedIce: true,
      };
    }
    return movePastCurrentIce(host);
  }
  if (run.bypassFirstIceRemaining) {
    run.bypassFirstIceRemaining = false;
    return movePastCurrentIce(host);
  }
  if (ice.rezzed) {
    if (host.rules.corpRunRootRezActionsAvailable()) {
      const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } =
        run;
      void _encounteredIceId;
      state.run = {
        ...runWithoutEncounter,
        phase: "approach_ice",
        approachedIceId,
      };
      state.timingPoint = "run.approach_ice";
      state.activeSide = "corp";
      return {
        handled: true,
        nextIceId: approachedIceId,
        approachStarted: true,
        stateChanged: true,
      };
    }
    host.encounter.beginEncounter(approachedIceId, legalAction);
    return {
      handled: true,
      nextIceId: approachedIceId,
      approachStarted: true,
      stateChanged: true,
    };
  }
  const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
  void _encounteredIceId;
  state.run = {
    ...runWithoutEncounter,
    phase: "approach_ice",
    approachedIceId,
  };
  state.timingPoint = "run.approach_ice";
  state.activeSide = host.rules.approachIceExposeCanBeOfferedForCurrentIce()
    ? "runner"
    : "corp";
  return {
    handled: true,
    nextIceId: approachedIceId,
    approachStarted: true,
    stateChanged: true,
  };
}

export function movePastCurrentIce(
  host: RunMovementHost,
  legalAction?: LegalAction,
): MovePastCurrentIceResult {
  const state = host.state;
  const run = mustRun(state);
  if (run.position.kind !== "ice")
    throw new Error("Runner ist nicht an ICE positioniert.");
  const server = host.servers.mustServer(run.position.serverId);
  const nextIndex = run.position.iceIndex - 1;
  const passedIceId = run.encounteredIceId ?? run.approachedIceId;
  clearEncounterTemporaryTraceCredits(run, legalAction);
  const passedIceFollowups = passedIceFollowupMarkersForCurrentIce(
    host.encounter.encounterResolutionHost(),
  );
  if (
    passedIceId &&
    host.cards.cardInstanceFor(passedIceId).rezzed &&
    applyRioDeJaneiroCityGridPassedIceTrigger(
      host.encounter.encounterSpecialWindowHost(),
      passedIceId,
      legalAction,
    ).runShouldEnd
  ) {
    return {
      handled: true,
      runEnded: true,
      movedPastIceId: passedIceId,
      stateChanged: true,
    };
  }
  const forcedJackOut = consumeForcedJackOutAfterEncounter(
    host.encounter.encounterResolutionHost(),
    legalAction,
  );
  if (forcedJackOut.runShouldEnd) {
    host.cleanup.finishRun(false, legalAction);
    return {
      handled: true,
      runEnded: true,
      runnerJackedOut: true,
      movedPastIceId: passedIceId,
      stateChanged: true,
    };
  }
  if (nextIndex >= 0) {
    const approachedIceId = mustArrayValue(
      server.ice,
      nextIndex,
      "Naechstes ICE fehlt.",
    );
    if (host.rules.isV097OrLater()) {
      const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } =
        run;
      void _encounteredIceId;
      state.run = {
        ...runWithoutEncounter,
        phase: "movement",
        position: { kind: "ice", serverId: server.id, iceIndex: nextIndex },
        approachedIceId,
        ...passedIceFollowups,
        ...fortPassFollowupsForPassedIce(host, server, passedIceId),
        brokenSubroutineIndexes: [],
        resolvedSubroutineIndexes: [],
      };
      state.timingPoint = "run.jack_out_window";
      state.activeSide = "runner";
      return {
        handled: true,
        runContinues: true,
        movedPastIceId: passedIceId,
        nextIceId: approachedIceId,
        stateChanged: true,
      };
    }
    state.run = {
      ...run,
      phase: "approach_ice",
      position: { kind: "ice", serverId: server.id, iceIndex: nextIndex },
      approachedIceId,
      ...passedIceFollowups,
      ...fortPassFollowupsForPassedIce(host, server, passedIceId),
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    };
    const approach = approachOrEncounterIce(host, approachedIceId);
    return {
      ...approach,
      movedPastIceId: passedIceId,
      nextIceId: approachedIceId,
    };
  }
  if (host.rules.isV097OrLater()) {
    const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
    void _encounteredIceId;
    state.run = {
      ...runWithoutEncounter,
      position: { kind: "server", serverId: server.id },
      phase: "movement",
      ...passedIceFollowups,
      ...fortPassFollowupsForPassedIce(host, server, passedIceId),
    };
    state.timingPoint = "run.jack_out_window";
    state.activeSide = "runner";
    return {
      handled: true,
      runContinues: true,
      movedPastIceId: passedIceId,
      accessShouldStart: true,
      stateChanged: true,
    };
  }
  state.run = {
    ...run,
    position: { kind: "server", serverId: server.id },
    phase: "access",
  };
  host.access.startAccessFromSuccessfulRun();
  return {
    handled: true,
    movedPastIceId: passedIceId,
    accessShouldStart: true,
    stateChanged: true,
  };
}

export function continueFromMovement(
  host: RunMovementHost,
  legalAction?: LegalAction,
): PostPassIceResult {
  const state = host.state;
  const run = mustRun(state);
  const postPassPayment = resolvePostPassPayOrEndRun(host, legalAction);
  if (postPassPayment.handled) return postPassPayment;
  if (
    handlePostPassProgramTrashChoices(
      host.encounter.encounterResolutionHost(),
      legalAction,
    ).choiceOpened
  )
    return { handled: true, postPassChoiceOpened: true, stateChanged: true };
  clearStartupImmolatorPostPassMarker(host.encounter.encounterResolutionHost());
  clearFullyBrokenPassedIcePostPassMarker(
    host.encounter.encounterResolutionHost(),
  );
  if (run.position.kind === "ice") {
    const server = host.servers.mustServer(run.position.serverId);
    const approachedIceId =
      run.approachedIceId ??
      mustArrayValue(server.ice, run.position.iceIndex, "Naechstes ICE fehlt.");
    state.run = { ...run, phase: "approach_ice", approachedIceId };
    const approach = approachOrEncounterIce(host, approachedIceId);
    return {
      ...approach,
      nextIceId: approachedIceId,
      runContinues: true,
    };
  }
  host.access.startAccessFromSuccessfulRun(legalAction);
  return {
    handled: true,
    accessShouldStart: true,
    stateChanged: true,
  };
}

function resolvePostPassPayOrEndRun(
  host: RunMovementHost,
  legalAction: LegalAction | undefined,
): PostPassIceResult {
  const run = mustRun(host.state);
  const pending = run.postPassPayOrEndRun;
  if (!pending) return { handled: false };
  if (!legalAction)
    throw new Error("Fort-Pass-Zahlungsfenster braucht eine LegalAction.");
  if (
    legalAction.payload?.fortRunWindowAbility !==
    "runner_pay_or_end_run_after_passing_ice_on_this_fort"
  )
    throw new Error("Die Fort-Pass-Aktion passt nicht zum offenen Fenster.");
  const decision = String(legalAction.payload?.decision ?? "");
  const amount = Math.max(0, Math.floor(pending.amount));
  const actionAmount = Number(legalAction.payload?.paymentAmount ?? amount);
  if (!Number.isInteger(actionAmount) || actionAmount !== amount)
    throw new Error("Die Fort-Pass-Kosten passen nicht mehr.");
  if (String(legalAction.payload?.passedIceId ?? "") !== pending.passedIceId)
    throw new Error("Das passierte ICE passt nicht mehr zum Fort-Pass-Fenster.");
  if (String(legalAction.payload?.serverId ?? "") !== pending.serverId)
    throw new Error("Der Fort-Pass-Server passt nicht mehr.");
  if (decision === "pay") {
    spendRunnerRunCredits(runDurationPaymentHost(host.state), amount);
    delete run.postPassPayOrEndRun;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      paidCredits: amount,
      endedRun: false,
      runnerCreditsAfter: host.state.runner.credits,
    };
    return {
      handled: true,
      postPassPaymentResolved: true,
      runContinues: true,
      resolvedPayload: legalAction.payload,
      stateChanged: true,
    };
  }
  if (decision === "end_run") {
    delete run.postPassPayOrEndRun;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      paidCredits: 0,
      endedRun: true,
    };
    host.cleanup.finishRun(false, legalAction);
    return {
      handled: true,
      postPassPaymentResolved: true,
      runEnded: true,
      resolvedPayload: legalAction.payload,
      stateChanged: true,
    };
  }
  throw new Error("Die Fort-Pass-Entscheidung ist ungueltig.");
}

function fortPassFollowupsForPassedIce(
  host: RunMovementHost,
  server: CorpServer,
  passedIceId: CardInstanceId | undefined,
): Pick<RunState, "lastPassedIceId" | "postPassPayOrEndRun"> {
  if (!passedIceId) return {};
  const payOrEndSources = server.root
    .filter((cardId) => {
      const instance = host.state.cardInstances[cardId];
      if (instance?.rezzed !== true) return false;
      const implementation = fortRunWindowImplementationForCard(
        host,
        cardId,
        "runner_pay_or_end_run_after_passing_ice_on_this_fort",
      );
      return Boolean(implementation);
    })
    .sort();
  if (payOrEndSources.length === 0) return { lastPassedIceId: passedIceId };
  const amount = payOrEndSources.reduce((sum, cardId) => {
    const implementation = fortRunWindowImplementationForCard(
      host,
      cardId,
      "runner_pay_or_end_run_after_passing_ice_on_this_fort",
    );
    return sum + Math.max(0, Math.floor(implementation?.amount ?? 0));
  }, 0);
  if (amount <= 0) return { lastPassedIceId: passedIceId };
  return {
    lastPassedIceId: passedIceId,
    postPassPayOrEndRun: {
      sourceCardInstanceIds: payOrEndSources,
      sourceDefinitionIds: payOrEndSources.map(
        (cardId) => host.cards.definitionFor(cardId).id,
      ),
      passedIceId,
      serverId: server.id,
      amount,
    },
  };
}

function fortRunWindowImplementationForCard<
  K extends CardFortRunWindowImplementation["kind"],
>(
  host: RunMovementHost,
  cardId: CardInstanceId,
  kind: K,
): Extract<CardFortRunWindowImplementation, { kind: K }> | undefined {
  return cardImplementationForDefinitionId(
    host.cards.definitionFor(cardId).id,
  )?.fortRunWindows?.find(
    (window): window is Extract<CardFortRunWindowImplementation, { kind: K }> =>
      window.kind === kind,
  );
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}

function mustArrayValue<T>(values: T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}
