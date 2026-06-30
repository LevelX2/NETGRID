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
  applyPassedIceRunEndTrigger,
  type EncounterSpecialWindowHost,
} from "./encounter-special-windows";
import {
  clearFullyBrokenPassedIcePostPassMarker,
  clearFullyBrokenPassedIceTrashPostPassMarker,
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
    mustServer: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  rules: {
    isV097OrLater: () => boolean;
    corpRunRootRezActionsAvailable: () => boolean;
    approachIceExposeCanBeOfferedForCurrentIce: () => boolean;
  };
  actions?: {
    buildLegalAction: (
      side: "corp" | "runner",
      type: LegalAction["type"],
      label: string,
      source: LegalAction["source"],
      costs?: LegalAction["costs"],
      payload?: LegalAction["payload"],
    ) => LegalAction;
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
  if (
    legalAction.type === "continue_run" &&
    host.state.run?.corpPostPassIceReturnToHq
  )
    return resolveCorpPostPassIceReturnToHq(host, legalAction);
  if (
    legalAction.type === "continue_run" &&
    host.state.run?.postPassCancellableFutureIceStrength
  )
    return resolvePostPassCancellableFutureStrength(host, legalAction);
  if (legalAction.type === "jack_out") return jackOutRunner(host, legalAction);
  if (
    legalAction.type === "continue_run" &&
    host.state.run?.phase === "movement"
  )
    return continueFromMovement(host, legalAction);
  return { handled: false };
}

export function buildCorpPostPassIceReturnToHqActions(
  host: RunMovementHost,
): LegalAction[] {
  const pending = host.state.run?.corpPostPassIceReturnToHq;
  if (!pending) return [];
  const sourceTitle = host.cards.definitionFor(
    pending.sourceCardInstanceId,
  ).title;
  const serverLabel = host.servers.publicServerLabel(pending.serverId);
  const basePayload = {
    corpPostPassIceAbility: "return_passed_ice_to_hq",
    sourceCardId: pending.sourceCardInstanceId,
    sourceDefinitionId: pending.sourceDefinitionId,
    passedIceId: pending.passedIceId,
    passedIceDefinitionId: host.cards.definitionFor(pending.passedIceId).id,
    serverId: pending.serverId,
    ...(serverLabel ? { serverLabel } : {}),
  };
  const actions: LegalAction[] = [];
  if (!host.actions) throw new Error("Post-Pass-Action-Builder fehlt.");
  if (pending.mode === "required_pay_or_return") {
    const amount = Math.max(0, Math.floor(pending.paymentAmount ?? 0));
    if (host.state.corp.credits >= amount) {
      actions.push(
        makePublicPostPassIceReturnAction(
          host.actions.buildLegalAction(
            "corp",
            "continue_run",
            `${sourceTitle}: ${amount} Credit zahlen`,
            `${pending.sourceCardInstanceId}.pay`,
            amount > 0 ? [{ credits: amount }] : [],
            { ...basePayload, decision: "pay", paymentAmount: amount },
          ),
        ),
      );
    }
  } else {
    actions.push(
      makePublicPostPassIceReturnAction(
        host.actions.buildLegalAction(
          "corp",
          "continue_run",
          `${sourceTitle}: liegen lassen`,
          `${pending.sourceCardInstanceId}.decline`,
          [],
          { ...basePayload, decision: "decline" },
        ),
      ),
    );
  }
  actions.push(
    makePublicPostPassIceReturnAction(
      host.actions.buildLegalAction(
        "corp",
        "continue_run",
        `${sourceTitle}: nach HQ zurücknehmen`,
        `${pending.sourceCardInstanceId}.return_to_hq`,
        [],
        {
          ...basePayload,
          decision: "return_to_hq",
          ...(pending.gainCredits ? { gainCredits: pending.gainCredits } : {}),
        },
      ),
    ),
  );
  return actions;
}

function makePublicPostPassIceReturnAction(action: LegalAction): LegalAction {
  return { ...action, visibility: "public" };
}

export function buildRunnerPostPassFutureStrengthActions(
  host: RunMovementHost,
): LegalAction[] {
  const pending = host.state.run?.postPassCancellableFutureIceStrength;
  if (!pending) return [];
  const sourceTitle = host.cards.definitionFor(
    pending.sourceCardInstanceId,
  ).title;
  const serverLabel = host.servers.publicServerLabel(pending.serverId);
  const basePayload = {
    postPassFutureStrengthAbility: "cancel_future_ice_strength_bonus",
    sourceCardId: pending.sourceCardInstanceId,
    sourceDefinitionId: pending.sourceDefinitionId,
    passedIceId: pending.passedIceId,
    passedIceDefinitionId: host.cards.definitionFor(pending.passedIceId).id,
    serverId: pending.serverId,
    ...(serverLabel ? { serverLabel } : {}),
    strengthBonusAmount: pending.amount,
    paymentAmount: pending.paymentAmount,
  };
  const actions: LegalAction[] = [];
  if (!host.actions) throw new Error("Post-Pass-Action-Builder fehlt.");
  if (host.state.runner.credits >= pending.paymentAmount) {
    actions.push(
      host.actions.buildLegalAction(
        "runner",
        "continue_run",
        `${sourceTitle}: Strength-Bonus verhindern (${pending.paymentAmount} Credit)`,
        "game_rule",
        pending.paymentAmount > 0 ? [{ credits: pending.paymentAmount }] : [],
        { ...basePayload, decision: "pay" },
      ),
    );
  }
  actions.push(
    host.actions.buildLegalAction(
      "runner",
      "continue_run",
      `${sourceTitle}: Strength-Bonus zulassen`,
      "game_rule",
      [],
      { ...basePayload, decision: "continue" },
    ),
  );
  return actions;
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
  if (
    payment.handled &&
    payment.paid === false &&
    host.state.runnerCostPenaltySupportWindow
  ) {
    return {
      handled: true,
      resolvedPayload: payment.resolvedPayload,
      stateChanged: true,
    };
  }
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
  if (run.secretSpendGuessRunAutoPassIceId === run.approachedIceId) {
    delete run.secretSpendGuessRunAutoPassIceId;
    return movePastCurrentIce(host);
  }
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
  const secretSpendAutoPass =
    run.secretSpendGuessRunAutoPassIceId === approachedIceId;
  if (secretSpendAutoPass) {
    markSecretSpendGuessAutoPass(legalAction);
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
    if (secretSpendAutoPass) return passApproachedIce(host);
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
    applyPassedIceRunEndTrigger(
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
      state.activeSide = state.run.corpPostPassIceReturnToHq
        ? "corp"
        : "runner";
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
    state.activeSide = state.run.corpPostPassIceReturnToHq ? "corp" : "runner";
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
  clearFullyBrokenPassedIceTrashPostPassMarker(
    host.encounter.encounterResolutionHost(),
  );
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
    throw new Error(
      "Das passierte ICE passt nicht mehr zum Fort-Pass-Fenster.",
    );
  if (String(legalAction.payload?.serverId ?? "") !== pending.serverId)
    throw new Error("Der Fort-Pass-Server passt nicht mehr.");
  if (decision === "pay") {
    const payment = spendRunnerRunCredits(
      runDurationPaymentHost(host.state),
      amount,
      undefined,
      legalAction,
    );
    if (payment.handled && payment.paid === false)
      return {
        handled: true,
        postPassPaymentResolved: false,
        resolvedPayload: legalAction.payload,
        stateChanged: true,
      };
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

function resolvePostPassCancellableFutureStrength(
  host: RunMovementHost,
  legalAction: LegalAction,
): PostPassIceResult {
  const run = mustRun(host.state);
  const pending = run.postPassCancellableFutureIceStrength;
  if (!pending) return { handled: false };
  if (legalAction.side !== "runner")
    throw new Error(
      "Nur der Runner darf dieses Post-Pass-Fenster entscheiden.",
    );
  if (
    legalAction.payload?.postPassFutureStrengthAbility !==
    "cancel_future_ice_strength_bonus"
  )
    throw new Error("Die Post-Pass-Aktion passt nicht zum Strength-Fenster.");
  if (String(legalAction.payload?.passedIceId ?? "") !== pending.passedIceId)
    throw new Error("Das passierte ICE passt nicht mehr.");
  if (
    String(legalAction.payload?.sourceCardId ?? "") !==
    pending.sourceCardInstanceId
  )
    throw new Error("Die Strength-Quelle passt nicht mehr.");
  const decision = String(legalAction.payload?.decision ?? "");
  if (decision === "pay") {
    const amount = Math.max(0, Math.floor(pending.paymentAmount));
    const paid = Number(legalAction.payload?.paymentAmount ?? amount);
    if (!Number.isInteger(paid) || paid !== amount)
      throw new Error("Die Strength-Cancel-Kosten passen nicht mehr.");
    const payment = spendRunnerRunCredits(
      runDurationPaymentHost(host.state),
      amount,
      undefined,
      legalAction,
    );
    if (payment.handled && payment.paid === false)
      return { handled: true, runContinues: false, stateChanged: true };
    run.futureEncounterIceStrengthBonus = Math.max(
      0,
      Math.floor(run.futureEncounterIceStrengthBonus ?? 0) -
        Math.max(0, Math.floor(pending.amount)),
    );
    delete run.postPassCancellableFutureIceStrength;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      paidCredits: amount,
      futureEncounterIceStrengthBonus: run.futureEncounterIceStrengthBonus,
      runnerCreditsAfter: host.state.runner.credits,
    };
    return { handled: true, runContinues: true, stateChanged: true };
  }
  if (decision === "continue") {
    delete run.postPassCancellableFutureIceStrength;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      futureEncounterIceStrengthBonus: run.futureEncounterIceStrengthBonus ?? 0,
    };
    return { handled: true, runContinues: true, stateChanged: true };
  }
  throw new Error("Die Strength-Fenster-Entscheidung ist ungueltig.");
}

function resolveCorpPostPassIceReturnToHq(
  host: RunMovementHost,
  legalAction: LegalAction,
): PostPassIceResult {
  const run = mustRun(host.state);
  const pending = run.corpPostPassIceReturnToHq;
  if (!pending) return { handled: false };
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf dieses Post-Pass-Fenster entscheiden.");
  if (legalAction.payload?.corpPostPassIceAbility !== "return_passed_ice_to_hq")
    throw new Error(
      "Die Post-Pass-Aktion passt nicht zum ICE-Lifecycle-Fenster.",
    );
  if (String(legalAction.payload?.passedIceId ?? "") !== pending.passedIceId)
    throw new Error("Das passierte ICE passt nicht mehr.");
  if (
    String(legalAction.payload?.sourceCardId ?? "") !==
    pending.sourceCardInstanceId
  )
    throw new Error("Die Lifecycle-Quelle passt nicht mehr.");
  const decision = String(legalAction.payload?.decision ?? "");
  if (decision === "pay") {
    if (pending.mode !== "required_pay_or_return")
      throw new Error(
        "Diese ICE-Lifecycle-Faehigkeit hat keine Pflichtzahlung.",
      );
    const amount = Math.max(0, Math.floor(pending.paymentAmount ?? 0));
    const paid = Number(legalAction.payload?.paymentAmount ?? amount);
    if (!Number.isInteger(paid) || paid !== amount)
      throw new Error("Die ICE-Lifecycle-Kosten passen nicht mehr.");
    if (host.state.corp.credits < amount)
      throw new Error("Die Korp hat nicht genug Credits.");
    host.state.corp.credits -= amount;
    delete run.corpPostPassIceReturnToHq;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      paidCredits: amount,
      corpCreditsAfter: host.state.corp.credits,
    };
    host.state.activeSide = "runner";
    return { handled: true, runContinues: true, stateChanged: true };
  }
  if (decision === "decline") {
    if (pending.mode !== "optional_return_gain")
      throw new Error(
        "Diese ICE-Lifecycle-Faehigkeit darf nicht abgelehnt werden.",
      );
    delete run.corpPostPassIceReturnToHq;
    host.state.activeSide = "runner";
    return { handled: true, runContinues: true, stateChanged: true };
  }
  if (decision === "return_to_hq") {
    returnPassedIceToHq(host, pending.passedIceId);
    const gain = Math.max(0, Math.floor(pending.gainCredits ?? 0));
    if (gain > 0) host.state.corp.credits += gain;
    delete run.corpPostPassIceReturnToHq;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      returnedToHq: true,
      returnedCardDefinitionId: pending.sourceDefinitionId,
      ...(gain > 0 ? { gainedCredits: gain } : {}),
      corpCreditsAfter: host.state.corp.credits,
    };
    host.state.activeSide = "runner";
    return { handled: true, runContinues: true, stateChanged: true };
  }
  throw new Error("Die ICE-Lifecycle-Entscheidung ist ungueltig.");
}

function returnPassedIceToHq(
  host: RunMovementHost,
  iceId: CardInstanceId,
): void {
  const instance = host.cards.cardInstanceFor(iceId);
  if (instance.zone.zone !== "serverIce")
    throw new Error("Das ICE ist nicht mehr installiert.");
  const server = host.servers.mustServer(instance.zone.serverId);
  const index = server.ice.indexOf(iceId);
  if (index < 0) throw new Error("Das ICE liegt nicht mehr auf diesem Fort.");
  server.ice.splice(index, 1);
  host.state.corp.hq.push(iceId);
  host.state.cardInstances[iceId] = {
    ...instance,
    zone: { side: "corp", zone: "hq" },
    rezzed: false,
    faceup: false,
  };
}

function fortPassFollowupsForPassedIce(
  host: RunMovementHost,
  server: CorpServer,
  passedIceId: CardInstanceId | undefined,
): Pick<
  RunState,
  "lastPassedIceId" | "postPassPayOrEndRun" | "corpPostPassIceReturnToHq"
> {
  if (!passedIceId) return {};
  const passedIce = host.state.cardInstances[passedIceId];
  const passedIceLifecycle =
    passedIce?.rezzed === true
      ? fortRunWindowImplementationForCard(
          host,
          passedIceId,
          "corp_return_passed_ice_to_hq",
        )
      : undefined;
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
  const lifecycleFollowup = passedIceLifecycle
    ? {
        corpPostPassIceReturnToHq: {
          sourceCardInstanceId: passedIceId,
          sourceDefinitionId: host.cards.definitionFor(passedIceId).id,
          passedIceId,
          serverId: server.id,
          mode: passedIceLifecycle.mode,
          ...(passedIceLifecycle.paymentAmount !== undefined
            ? { paymentAmount: passedIceLifecycle.paymentAmount }
            : {}),
          ...(passedIceLifecycle.gainCredits !== undefined
            ? { gainCredits: passedIceLifecycle.gainCredits }
            : {}),
        },
      }
    : {};
  if (payOrEndSources.length === 0)
    return { lastPassedIceId: passedIceId, ...lifecycleFollowup };
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
    ...lifecycleFollowup,
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

function markSecretSpendGuessAutoPass(
  legalAction: LegalAction | undefined,
): void {
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    autoPassChosenIce: true,
    secretSpendGuessRunAutoPassedIce: true,
  };
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
