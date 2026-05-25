import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { CardRunEncounterInterventionImplementation } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID } from "../../mechanics/longtail-card-effects";
import { buildLegalAction } from "../turn/action-builders";
import {
  payEncounterTaxForFutureIce,
  runDurationPaymentHost,
} from "./run-duration-payment";

type ActiveRun = NonNullable<GameState["run"]>;

export type EncounterEntryHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    runnerInstalledCardIds: () => CardInstanceId[];
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote"> | string) => CorpServer;
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  run: {
    corpRootRezActionsAvailable: () => boolean;
  };
  choices: {
    selectedChoiceIds: (selectedChoices: PlayerAction["selectedChoices"]) => string[];
  };
  callbacks: {
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    resolveCorpRootRezEffect: (
      rezzedCardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => boolean;
  };
};

export type EncounterEntryResult = {
  handled: boolean;
  encounterStarted?: boolean;
  runShouldEnd?: boolean;
  iceId?: CardInstanceId;
  sourceDefinitionId?: string;
  temporaryTraceCredits?: number;
  resolvedPayload?: NonNullable<LegalAction["payload"]> | undefined;
  stateChanged?: boolean;
};

export type ApproachExposeResult = EncounterEntryResult & {
  exposeWindowOpen?: boolean;
  viewingWindowOpen?: boolean;
  sourceCardId?: CardInstanceId;
};

export type SpeedTrapResult = EncounterEntryResult & {
  choiceOpened?: boolean;
  runnerJackedOut?: boolean;
  sourceCardId?: CardInstanceId;
  successfulRunWithoutAccess?: boolean;
};

export function beginEncounter(
  host: EncounterEntryHost,
  encounteredIceId: CardInstanceId,
  legalAction?: LegalAction,
): EncounterEntryResult {
  const run = mustRun(host.state);
  run.phase = "encounter_ice";
  run.encounteredIceId = encounteredIceId;
  run.brokenSubroutineIndexes = [];
  run.resolvedSubroutineIndexes = [];
  run.traceSuccessBySubroutineIndex = {};
  delete run.encounterTemporaryTraceCredits;
  delete run.encounterAdditionalSubroutines;
  run.bartmossUsedBreakerIdsThisEncounter = [];
  run.blinkUsedSubroutinesByBreakerThisEncounter = {};
  if (run.nextEncounterNoBreakSubroutines) {
    run.noBreakSubroutinesActive = true;
    run.nextEncounterNoBreakSubroutines = false;
  } else {
    run.noBreakSubroutinesActive = false;
  }
  if (run.nextEncounterJackOutLock) {
    run.jackOutLockedUntilEncounterEnds = true;
    run.nextEncounterJackOutLock = false;
  } else {
    run.jackOutLockedUntilEncounterEnds = false;
  }
  const queuedFatalDamage = Math.max(
    0,
    Math.floor(run.nextEncounterFatalDamage ?? 0),
  );
  run.fatalDamageActiveForEncounter = queuedFatalDamage > 0;
  if (queuedFatalDamage > 0)
    run.fatalDamageAmountForEncounter = queuedFatalDamage;
  else delete run.fatalDamageAmountForEncounter;
  run.nextEncounterFatalDamage = 0;
  const encounterTaxPayment = payEncounterTaxForFutureIce(
    runDurationPaymentHost(host.state),
    legalAction,
  );
  if (encounterTaxPayment.runShouldEnd) {
    host.callbacks.finishRun(false, legalAction);
    return {
      handled: true,
      runShouldEnd: true,
      iceId: encounteredIceId,
      stateChanged: true,
      resolvedPayload: legalAction?.payload,
    };
  }
  const encounteredDefinition = host.cards.definitionFor(encounteredIceId);
  const temporaryTraceCredits = grantEncounterTemporaryTraceCredits(
    host,
    run,
    encounteredIceId,
    encounteredDefinition,
    legalAction,
  );
  host.state.timingPoint = "run.encounter_ice";
  host.state.activeSide = "runner";
  return {
    handled: true,
    encounterStarted: true,
    iceId: encounteredIceId,
    sourceDefinitionId: encounteredDefinition.id,
    ...(temporaryTraceCredits > 0 ? { temporaryTraceCredits } : {}),
    resolvedPayload: legalAction?.payload,
    stateChanged: true,
  };
}

export function continueAfterCorpRootRezIfWindowIsComplete(
  host: EncounterEntryHost,
  legalAction?: LegalAction,
): EncounterEntryResult {
  const run = host.state.run;
  if (
    host.state.timingPoint !== "run.approach_ice" ||
    run?.phase !== "approach_ice" ||
    !run.approachedIceId ||
    host.run.corpRootRezActionsAvailable()
  )
    return { handled: false };
  const approachedIce = host.cards.cardInstanceFor(run.approachedIceId);
  if (!approachedIce.rezzed) return { handled: false };
  return beginEncounter(host, run.approachedIceId, legalAction);
}

export function isApproachIceExposeWindowOpen(
  host: EncounterEntryHost,
): boolean {
  return Boolean(
    host.state.timingPoint === "run.approach_ice" &&
      host.state.activeSide === "runner" &&
      approachIceExposeCanBeOfferedForCurrentIce(host),
  );
}

export function isApproachIceExposeViewingWindowOpen(
  host: EncounterEntryHost,
): boolean {
  return Boolean(
    host.state.timingPoint === "run.approach_ice" &&
      host.state.activeSide === "runner" &&
      host.state.run?.approachIceExposeViewingIceId &&
      host.state.run?.approachIceExposeViewingSourceCardId,
  );
}

export function approachIceExposeCanBeOfferedForCurrentIce(
  host: EncounterEntryHost,
): boolean {
  const run = host.state.run;
  const approachedIceId = run?.approachedIceId;
  if (!run || !approachedIceId) return false;
  if (run.approachIceExposeViewingIceId) return false;
  if (run.approachIceExposeSkippedIceIdsThisRun?.includes(approachedIceId))
    return false;
  if (installedApproachIceExposeSources(host).length === 0) return false;
  const ice = host.state.cardInstances[approachedIceId];
  return Boolean(ice && !ice.rezzed);
}

export function runnerApproachIceExposeActions(
  host: EncounterEntryHost,
): LegalAction[] {
  const run = mustRun(host.state);
  const approachedIceId = run.approachedIceId;
  if (!approachedIceId) return [];
  const sources = installedApproachIceExposeSources(host);
  if (sources.length === 0) return [];
  const primarySource = sources[0]!;
  const exposeActions = sources.map((sourceCardId) => {
    const definition = host.cards.definitionFor(sourceCardId);
    const abilityId = approachIceExposeAbilityIdForSource(host, sourceCardId);
    return buildLegalAction(
      host.state,
      "runner",
      "trigger_ability",
      `${definition.title}: ICE ansehen`,
      sourceCardId,
      [],
      {
        cardId: sourceCardId,
        iceId: approachedIceId,
        approachIceExposeDecision: "expose",
      },
      {
        abilityRef: { sourceCardInstanceId: sourceCardId, abilityId },
        effectRef: `effect.${abilityId}`,
        targetRequirements: [
          {
            id: "approachedIce",
            kind: "card",
            side: "corp",
            zoneScope: ["corp.servers.ice"],
            visibility: "public",
          },
        ],
      },
    );
  });
  return [
    ...exposeActions,
    buildLegalAction(
      host.state,
      "runner",
      "trigger_ability",
      `${host.cards.definitionFor(primarySource).title}: Ansehen überspringen`,
      primarySource,
      [],
      {
        cardId: primarySource,
        iceId: approachedIceId,
        approachIceExposeDecision: "decline",
      },
    ),
  ];
}

export function runnerApproachIceExposeViewingActions(
  host: EncounterEntryHost,
): LegalAction[] {
  const run = mustRun(host.state);
  const sourceCardId = run.approachIceExposeViewingSourceCardId;
  const viewedIceId = run.approachIceExposeViewingIceId;
  if (!sourceCardId || !viewedIceId) return [];
  const definition = host.cards.definitionFor(sourceCardId);
  return [
    buildLegalAction(
      host.state,
      "runner",
      "trigger_ability",
      `${definition.title}: Ansehen beenden`,
      sourceCardId,
      [],
      {
        cardId: sourceCardId,
        iceId: viewedIceId,
        approachIceExposeViewDecision: "finish",
      },
    ),
    buildLegalAction(
      host.state,
      "runner",
      "jack_out",
      "Jack-out",
      "game_rule",
      [],
      {
        cardId: sourceCardId,
        iceId: viewedIceId,
        approachIceExposeJackOut: true,
      },
    ),
  ];
}

export function resolveApproachIceExposeAbility(
  host: EncounterEntryHost,
  legalAction: LegalAction,
): ApproachExposeResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Approach-Expose nutzen.");
  const run = mustRun(host.state);
  const approachedIceId = run.approachedIceId;
  if (
    !approachedIceId ||
    String(legalAction.payload?.iceId) !== approachedIceId
  )
    throw new Error("Approach-Expose passt nicht zum aktuellen ICE.");
  if (!isApproachIceExposeWindowOpen(host))
    throw new Error("Approach-Expose ist in diesem Fenster nicht legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const availableSources = installedApproachIceExposeSources(host);
  const decision = String(legalAction.payload?.approachIceExposeDecision ?? "");
  if (decision === "expose") {
    if (!availableSources.includes(sourceCardId))
      throw new Error("Die Approach-Expose-Quelle ist nicht installiert.");
    const definition = host.cards.definitionFor(approachedIceId);
    markApproachIceExposeUsedForSource(run, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "approach_ice_expose",
      publicRevealKind: "expose",
      publicRevealDefinitionId: definition.id,
      exposedCardDefinitionId: definition.id,
    };
  } else if (decision === "decline") {
    markApproachIceExposeSkippedForIce(run, approachedIceId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "approach_ice_expose_decline",
    };
  } else {
    throw new Error("Approach-Expose-Entscheidung ist ungueltig.");
  }

  if (decision === "expose") {
    run.approachIceExposeViewingIceId = approachedIceId;
    run.approachIceExposeViewingSourceCardId = sourceCardId;
    host.state.activeSide = "runner";
  } else {
    host.state.activeSide = "corp";
  }
  host.state.timingPoint = "run.approach_ice";
  return {
    handled: true,
    exposeWindowOpen: decision === "expose",
    iceId: approachedIceId,
    sourceCardId,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

export function resolveApproachIceExposeViewingDecision(
  host: EncounterEntryHost,
  legalAction: LegalAction,
): ApproachExposeResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf das Ansehen beenden.");
  if (!isApproachIceExposeViewingWindowOpen(host))
    throw new Error("Es ist kein Ansehen-Fenster offen.");
  const run = mustRun(host.state);
  const viewedIceId = run.approachIceExposeViewingIceId;
  const sourceCardId = run.approachIceExposeViewingSourceCardId;
  if (
    String(legalAction.payload?.iceId) !== viewedIceId ||
    String(legalAction.payload?.cardId) !== sourceCardId
  )
    throw new Error("Das Ansehen passt nicht mehr zum aktuellen ICE.");
  if (legalAction.payload?.approachIceExposeViewDecision !== "finish")
    throw new Error("Die Ansehen-Entscheidung ist ungueltig.");
  delete run.approachIceExposeViewingIceId;
  delete run.approachIceExposeViewingSourceCardId;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "approach_ice_expose_finish",
  };
  host.state.activeSide = "corp";
  host.state.timingPoint = "run.approach_ice";
  return {
    handled: true,
    viewingWindowOpen: false,
    iceId: viewedIceId,
    sourceCardId,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

export function startSpeedTrapRezInterruptChoice(
  host: EncounterEntryHost,
  rezzedCardId: string,
  legalAction?: LegalAction,
): SpeedTrapResult {
  const run = host.state.run;
  if (!run) return { handled: false };
  const rezzedCardInstanceId = rezzedCardId as CardInstanceId;
  const definition = host.cards.definitionFor(rezzedCardInstanceId);
  if (definition.type !== "asset" && definition.type !== "upgrade")
    return { handled: false };
  const speedTrapId = installedSpeedTrapIds(host)[0];
  if (!speedTrapId) return { handled: false };
  if (
    !host.servers
      .mustServer(run.attackedServerId)
      .root.includes(rezzedCardInstanceId)
  )
    return { handled: false };
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  run.speedTrapPendingRezCardId = rezzedCardInstanceId;
  run.speedTrapPendingRezTimingPoint = host.state.timingPoint;
  run.speedTrapPendingRezActiveSide = host.state.activeSide;
  host.state.pendingChoice = {
    choiceId: `v1922_speed_trap_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.speed_trap:${speedTrapId}:${rezzedCardId}:${host.state.stateVersion + 1}`,
    prompt: "Speed Trap: Nach dem Rez jack out?",
    kind: "select_option",
    options: [
      {
        id: "jack_out",
        label: "Jack out",
        publicLabel: "Speed Trap nutzen",
        value: "jack_out",
      },
      {
        id: "pass",
        label: "Nicht nutzen",
        publicLabel: "Speed Trap nicht nutzen",
        value: "pass",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  host.state.activeSide = "runner";
  if (legalAction) {
    const serverLabel = host.servers.publicServerLabel(run.attackedServerId);
    const speedTrapDefinitionId = host.cards.definitionFor(speedTrapId).id;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt_choice",
      sourceDefinitionId: speedTrapDefinitionId,
      speedTrapSourceCardId: speedTrapId,
      rezzedCardDefinitionId: definition.id,
      ...(serverLabel ? { serverLabel } : {}),
      speedTrapChoiceOpened: true,
    };
  }
  return {
    handled: true,
    choiceOpened: true,
    sourceDefinitionId: host.cards.definitionFor(speedTrapId).id,
    sourceCardId: speedTrapId,
    resolvedPayload: legalAction?.payload,
    stateChanged: true,
  };
}

export function resolveSpeedTrapRezInterruptChoice(
  host: EncounterEntryHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): SpeedTrapResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.speed_trap"))
    throw new Error("Speed-Trap-Choice ist nicht offen.");
  const [, speedTrapId, rezzedCardId] = choice.source.split(":");
  if (
    !speedTrapId ||
    !host.state.runner.rig.programs.includes(speedTrapId as CardInstanceId)
  )
    throw new Error("Speed Trap ist nicht mehr installiert.");
  const speedTrapCardId = speedTrapId as CardInstanceId;
  const speedTrapDefinitionId = host.cards.definitionFor(speedTrapCardId).id;
  if (
    !hasRunEncounterInterventionKind(
      host,
      speedTrapCardId,
      "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
    ) &&
    (cardImplementationForDefinitionId(speedTrapDefinitionId) ||
      speedTrapDefinitionId !== SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID)
  )
    throw new Error("Speed Trap ist nicht mehr installiert.");
  const run = mustRun(host.state);
  if (
    !rezzedCardId ||
    run.speedTrapPendingRezCardId !== rezzedCardId ||
    !host.servers
      .mustServer(run.attackedServerId)
      .root.includes(rezzedCardId as CardInstanceId)
  )
    throw new Error("Das Speed-Trap-Rezziel ist nicht mehr gueltig.");
  const rezzedCardInstanceId = rezzedCardId as CardInstanceId;
  const rezzedDefinition = host.cards.definitionFor(rezzedCardInstanceId);
  if (rezzedDefinition.type !== "asset" && rezzedDefinition.type !== "upgrade")
    throw new Error("Speed Trap reagiert nur auf Nodes oder Upgrades.");
  if (!host.cards.cardInstanceFor(rezzedCardInstanceId).rezzed)
    throw new Error("Das Speed-Trap-Rezziel ist nicht gerezzt.");
  const selectedId = host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const useSpeedTrap = selectedId === "jack_out";
  const pass = selectedId === "pass";
  if (!useSpeedTrap && !pass)
    throw new Error("Die Speed-Trap-Auswahl ist ungueltig.");
  const successfulRunWithoutAccess =
    useSpeedTrap && run.position.kind === "server";
  const serverLabel = host.servers.publicServerLabel(run.attackedServerId);
  const pendingTimingPoint = run.speedTrapPendingRezTimingPoint;
  const pendingActiveSide = run.speedTrapPendingRezActiveSide;
  delete run.speedTrapPendingRezCardId;
  delete run.speedTrapPendingRezTimingPoint;
  delete run.speedTrapPendingRezActiveSide;
  delete host.state.pendingChoice;

  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerProgramAbility: "speed_trap_rez_interrupt",
    sourceDefinitionId: speedTrapDefinitionId,
    speedTrapSourceCardId: speedTrapCardId,
    rezzedCardDefinitionId: rezzedDefinition.id,
    ...(serverLabel ? { serverLabel } : {}),
    speedTrapUsed: useSpeedTrap,
    successfulRunWithoutAccess,
  };

  if (useSpeedTrap) {
    host.callbacks.finishRun(successfulRunWithoutAccess, legalAction);
    return {
      handled: true,
      runnerJackedOut: true,
      successfulRunWithoutAccess,
      resolvedPayload: legalAction.payload,
      stateChanged: true,
    };
  }

  host.callbacks.resolveCorpRootRezEffect(rezzedCardInstanceId, legalAction);
  if (host.state.run) {
    host.state.timingPoint =
      (pendingTimingPoint as GameState["timingPoint"] | undefined) ??
      "run.jack_out_window";
    host.state.activeSide = pendingActiveSide ?? "runner";
  }
  return {
    handled: true,
    successfulRunWithoutAccess,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

function grantEncounterTemporaryTraceCredits(
  host: EncounterEntryHost,
  run: ActiveRun,
  encounteredIceId: CardInstanceId,
  encounteredDefinition: CardDefinition,
  legalAction?: LegalAction,
): number {
  const iceEncounter = cardImplementationForDefinitionId(
    encounteredDefinition.id,
  )?.iceEncounter;
  if (iceEncounter?.kind !== "add_encounter_temporary_credits") return 0;
  const amount = Math.max(0, Math.floor(iceEncounter.amount));
  if (
    amount <= 0 ||
    iceEncounter.side !== "corp" ||
    iceEncounter.usableFor !== "this_ice_printed_trace_subroutines"
  )
    return 0;
  run.encounterTemporaryTraceCredits = {
    sourceIceId: encounteredIceId,
    sourceDefinitionId: encounteredDefinition.id,
    remaining: amount,
    usableFor: iceEncounter.usableFor,
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      temporaryTraceCredits: amount,
      temporaryTraceCreditsSourceDefinitionId: encounteredDefinition.id,
    };
  }
  return amount;
}

function installedApproachIceExposeSources(
  host: EncounterEntryHost,
): CardInstanceId[] {
  const used = new Set(host.state.run?.approachIceExposeUsedSourceIdsThisRun ?? []);
  return host.cards
    .runnerInstalledCardIds()
    .slice()
    .sort()
    .filter((cardId) => {
      if (used.has(cardId)) return false;
      const definition = host.cards.definitionFor(cardId);
      if (
        hasRunEncounterInterventionKind(
          host,
          cardId,
          "approach_ice_expose_then_jack_out_before_rez",
        )
      )
        return true;
      if (cardImplementationForDefinitionId(definition.id)) return false;
      return definition.abilities?.some(
        (ability) =>
          ability.type === "approach_ice_expose" &&
          ability.timingPoint === "run.approach_ice" &&
          ability.publicActionType === "trigger_ability",
      );
    });
}

function approachIceExposeAbilityIdForSource(
  host: EncounterEntryHost,
  sourceCardId: CardInstanceId,
): string {
  const definition = host.cards.definitionFor(sourceCardId);
  if (
    hasRunEncounterInterventionKind(
      host,
      sourceCardId,
      "approach_ice_expose_then_jack_out_before_rez",
    )
  )
    return `card_implementation.${definition.id}.approach_ice_expose`;
  const ability = definition.abilities?.find(
    (candidate) =>
      candidate.type === "approach_ice_expose" &&
      candidate.timingPoint === "run.approach_ice",
  );
  if (!ability)
    throw new Error("Diese Karte hat keine Approach-Expose-Faehigkeit.");
  return ability.id;
}

function installedSpeedTrapIds(host: EncounterEntryHost): CardInstanceId[] {
  return host.state.runner.rig.programs
    .filter((cardId) => {
      const definitionId = host.cards.definitionFor(cardId).id;
      if (
        hasRunEncounterInterventionKind(
          host,
          cardId,
          "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
        )
      )
        return true;
      return (
        !cardImplementationForDefinitionId(definitionId) &&
        definitionId === SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID
      );
    })
    .sort();
}

function markApproachIceExposeSkippedForIce(
  run: ActiveRun,
  approachedIceId: CardInstanceId,
): void {
  const skipped = run.approachIceExposeSkippedIceIdsThisRun ?? [];
  if (!skipped.includes(approachedIceId))
    run.approachIceExposeSkippedIceIdsThisRun = [...skipped, approachedIceId];
}

function markApproachIceExposeUsedForSource(
  run: ActiveRun,
  sourceCardId: CardInstanceId,
): void {
  const used = run.approachIceExposeUsedSourceIdsThisRun ?? [];
  if (!used.includes(sourceCardId))
    run.approachIceExposeUsedSourceIdsThisRun = [...used, sourceCardId];
}

function runEncounterInterventionsForDefinition(
  definitionId: string,
): readonly CardRunEncounterInterventionImplementation[] {
  return cardImplementationForDefinitionId(definitionId)?.runEncounterInterventions ?? [];
}

function hasRunEncounterInterventionKind(
  host: EncounterEntryHost,
  cardId: CardInstanceId,
  kind: CardRunEncounterInterventionImplementation["kind"],
): boolean {
  return runEncounterInterventionsForDefinition(
    host.cards.definitionFor(cardId).id,
  ).some((intervention) => intervention.kind === kind);
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}
