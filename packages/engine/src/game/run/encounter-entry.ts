import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import type { CardRunEncounterInterventionImplementation } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
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
  callbacks: {
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
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
  if (
    installedApproachIceExposeSources(host).length === 0 &&
    !run.eventApproachIceExposeBeforeRez
  )
    return false;
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
  if (sources.length === 0 && run.eventApproachIceExposeBeforeRez) {
    const sourceCardId = run.successfulRunSourceCardId;
    if (!sourceCardId) return [];
    const definition = host.cards.definitionFor(sourceCardId);
    return [
      buildLegalAction(
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
          eventApproachIceExpose: true,
        },
      ),
      buildLegalAction(
        host.state,
        "runner",
        "trigger_ability",
        `${definition.title}: Ansehen überspringen`,
        sourceCardId,
        [],
        {
          cardId: sourceCardId,
          iceId: approachedIceId,
          approachIceExposeDecision: "decline",
          eventApproachIceExpose: true,
        },
      ),
    ];
  }
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
    if (
      !availableSources.includes(sourceCardId) &&
      !(run.eventApproachIceExposeBeforeRez && run.successfulRunSourceCardId === sourceCardId)
    )
      throw new Error("Die Approach-Expose-Quelle ist nicht installiert.");
    const definition = host.cards.definitionFor(approachedIceId);
    if (!run.eventApproachIceExposeBeforeRez)
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
