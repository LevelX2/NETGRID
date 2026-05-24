import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type {
  CardRunnerUtilityLongtailImplementation,
  CardUniqueDirectLongtailImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { FAIT_ACCOMPLI_COUNTER_PROGRAM_ID } from "../../mechanics/agenda-operation-effects";
import {
  FALSE_ECHO_FORCE_REZ_PROGRAM_ID,
  NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID,
} from "../../mechanics/longtail-card-effects";
import type { SuccessfulRunInterventionKind } from "./run-access-transition";

type ActiveRun = NonNullable<GameState["run"]>;

export type SuccessfulRunInterventionHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => GameState["corp"]["servers"][number];
    publicServerLabel: (serverId: Exclude<ServerId, "new_remote">) => string | undefined;
  };
  actions: {
    createRunnerTriggerAction: (
      label: string,
      sourceCardId: CardInstanceId,
      costs: LegalAction["costs"],
      payload: NonNullable<LegalAction["payload"]>,
    ) => LegalAction;
  };
  choices: {
    selectedChoiceIds: (selectedChoices: PlayerAction["selectedChoices"]) => string[];
  };
  costs: {
    creditCostForAction: (legalAction: LegalAction) => number;
    rezCostForCard: (cardId: CardInstanceId) => number;
  };
  credits: {
    spend: (side: "corp" | "runner", amount: number) => void;
    gainRunner: (amount: number) => void;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, type: string) => number;
    addCardCounter: (cardId: CardInstanceId, type: string, amount: number) => void;
  };
  runner: {
    ensureTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    trashRunnerInstalledCardToHeap: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  encounter: {
    beginEncounter: (iceId: CardInstanceId, legalAction?: LegalAction) => void;
    approachOrEncounterIce: (
      iceId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  access: {
    startAccessFromSuccessfulRun: (legalAction?: LegalAction) => void;
  };
};

export type SuccessfulRunInterventionExecutionResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  serverId?: Exclude<ServerId, "new_remote">;
  selectedHqCardId?: CardInstanceId;
  temporaryEncounterIceId?: CardInstanceId;
  installedIceId?: CardInstanceId;
  installCost?: number;
  rezCostPaid?: number;
  approachStarted?: boolean;
  encounterStarted?: boolean;
  successFinalizationDelayed?: boolean;
  successFinalized?: boolean;
  accessShouldStart?: boolean;
  stateChanged?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};

export type SuccessfulRunFollowupExecutionResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  creditsGained?: number;
  counterPlaced?: boolean;
  stateChanged?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};

export function successfulRunInterventionKindForDefinition(
  definitionId: CardDefinitionId,
): SuccessfulRunInterventionKind | undefined {
  const window = cardImplementationForDefinitionId(definitionId)?.fortRunWindows?.find(
    (candidate) =>
      candidate.kind === "temporary_hq_ice_encounter_after_successful_run" ||
      candidate.kind === "install_hq_ice_innermost_after_successful_run",
  );
  return window?.kind as SuccessfulRunInterventionKind | undefined;
}

export function successfulRunInterventionCost(
  host: SuccessfulRunInterventionHost,
  kind: SuccessfulRunInterventionKind,
  serverId: Exclude<ServerId, "new_remote">,
  hqIceId: CardInstanceId,
): number {
  if (kind === "temporary_hq_ice_encounter_after_successful_run")
    return Math.max(0, Math.floor(host.costs.rezCostForCard(hqIceId) / 2));
  return Math.max(0, Math.floor(host.servers.mustServer(serverId).ice.length));
}

export function buildSuccessfulRunFollowupActions(
  host: SuccessfulRunInterventionHost,
  run: ActiveRun,
): LegalAction[] {
  if (!run.successful || run.phase !== "access") return [];
  const used = new Set(run.successfulRunAbilityUsedSourceIds ?? []);
  const actions: LegalAction[] = [];
  for (const sourceCardId of host.state.runner.rig.programs.slice().sort()) {
    if (used.has(sourceCardId)) continue;
    const definition = host.cards.definitionFor(sourceCardId);
    const forceRezFollowup =
      hasSuccessfulRunForceRezFollowup(definition.id) ||
      (!cardImplementationForDefinitionId(definition.id) &&
        definition.id === FALSE_ECHO_FORCE_REZ_PROGRAM_ID);
    if (forceRezFollowup) {
      const server = host.servers.mustServer(run.attackedServerId);
      const unrezzedCount = server.ice.filter(
        (iceId) => !host.cards.cardInstanceFor(iceId).rezzed,
      ).length;
      if (unrezzedCount <= 0) continue;
      const abilityCost = successfulRunForceRezFollowupCreditCost(definition.id);
      if (host.state.runner.credits < abilityCost) continue;
      actions.push(
        host.actions.createRunnerTriggerAction(
          `${definition.title}: ICE rezzen lassen`,
          sourceCardId,
          abilityCost > 0 ? [{ credits: abilityCost }] : [],
          {
            cardId: sourceCardId,
            serverId: server.id,
            v1922RunnerProgramAbility: "false_echo_force_rez",
            falseEchoCreditCost: abilityCost,
            unrezzedIceCount: unrezzedCount,
          },
        ),
      );
    }
    const successfulRunFollowups =
      cardImplementationForDefinitionId(definition.id)?.successfulRunFollowups ??
      [];
    if (
      successfulRunFollowups.some(
        (followup) => followup.kind === "reverse_ice_on_successful_run_fort",
      ) ||
      (!cardImplementationForDefinitionId(definition.id) &&
        definition.id === NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID)
    ) {
      const server = host.servers.mustServer(run.attackedServerId);
      if (server.kind !== "archives" && server.ice.length > 1) {
        actions.push(
          host.actions.createRunnerTriggerAction(
            `${definition.title}: ICE-Reihenfolge umkehren`,
            sourceCardId,
            [],
            {
              cardId: sourceCardId,
              serverId: server.id,
              v1922RunnerProgramAbility: "netspace_inverter_reverse_ice",
              iceCount: server.ice.length,
            },
          ),
        );
      }
    }
    if (
      definition.id === FAIT_ACCOMPLI_COUNTER_PROGRAM_ID &&
      !cardImplementationForDefinitionId(definition.id)?.virusCounter
    ) {
      const server = host.servers.mustServer(run.attackedServerId);
      if (server.kind === "remote") {
        actions.push(
          host.actions.createRunnerTriggerAction(
            `${definition.title}: Remote mit Power-Counter markieren`,
            sourceCardId,
            [],
            {
              cardId: sourceCardId,
              serverId: server.id,
              v1919RunnerProgramAbility: "fait_accompli_successful_run_counter",
              counterType: "power",
              addCounterAmount: 1,
            },
          ),
        );
      }
    }
    if (
      runnerUtilityLongtailKindForDefinition(definition.id) ===
      "i_spy_successful_run_fort_counter_expose"
    ) {
      const server = host.servers.mustServer(run.attackedServerId);
      if (server.kind !== "archives") {
        actions.push(
          host.actions.createRunnerTriggerAction(
            `${definition.title}: Spy-Counter platzieren`,
            sourceCardId,
            [],
            {
              cardId: sourceCardId,
              serverId: server.id,
              runnerUtilityAbility: "i_spy_put_spy_counter",
              counterType: "spy",
            },
          ),
        );
      }
    }
  }
  return actions;
}

export function resolveSuccessfulRunFollowupAbility(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.payload?.v1922RunnerProgramAbility === "false_echo_force_rez")
    return resolveFalseEchoForceRez(host, legalAction);
  if (
    legalAction.payload?.v1922RunnerProgramAbility ===
    "netspace_inverter_reverse_ice"
  )
    return resolveNetspaceInverterReverseIce(host, legalAction);
  if (
    legalAction.payload?.v1919RunnerProgramAbility ===
    "fait_accompli_successful_run_counter"
  )
    return resolveFaitAccompliSuccessfulRunCounter(host, legalAction);
  if (legalAction.payload?.runnerUtilityAbility === "i_spy_put_spy_counter")
    return resolveISpyPutSpyCounter(host, legalAction);
  return { handled: false };
}

export function resolveSuccessfulRunInterventionChoice(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): SuccessfulRunInterventionExecutionResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_54.delayed_success"))
    throw new Error("Es ist keine Delayed-Success-Choice offen.");
  const [, sourceCardId = "", kind = "", serverId = ""] = choice.source.split(":");
  if (
    kind !== "temporary_hq_ice_encounter_after_successful_run" &&
    kind !== "install_hq_ice_innermost_after_successful_run"
  )
    throw new Error("Die Delayed-Success-Choice ist ungueltig.");
  const run = mustRun(host);
  if (
    !sourceCardId ||
    !host.state.cardInstances[sourceCardId] ||
    run.attackedServerId !== serverId ||
    run.position.kind !== "server" ||
    run.delayedSuccessfulRun
  )
    throw new Error("Der Delayed-Success-Kontext ist nicht mehr gueltig.");
  const server = host.servers.mustServer(run.attackedServerId);
  if (
    !server.root.includes(sourceCardId as CardInstanceId) ||
    !host.cards.cardInstanceFor(sourceCardId as CardInstanceId).rezzed
  )
    throw new Error("Die Delayed-Success-Quelle ist nicht mehr gueltig.");
  const interventionKind = kind as SuccessfulRunInterventionKind;
  if (
    successfulRunInterventionKindForDefinition(
      host.cards.definitionFor(sourceCardId as CardInstanceId).id,
    ) !== interventionKind
  )
    throw new Error("Die Delayed-Success-Quelle passt nicht zur Karte.");
  const used = run.successfulRunInterventionUsedSourceIds ?? [];
  if (used.includes(sourceCardId as CardInstanceId))
    throw new Error("Diese Delayed-Success-Quelle wurde bereits genutzt.");

  const selectedId = host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selectedId);
  if (!option) throw new Error("Die Delayed-Success-Auswahl ist ungueltig.");
  const definition = host.cards.definitionFor(sourceCardId as CardInstanceId);
  if (option.value === "decline") {
    run.successfulRunInterventionWindowClosed = true;
    delete host.state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      delayedSuccessfulRun: false,
      fortWindowSourceTitle: definition.title,
      sourceDefinitionId: definition.id,
      sourceCardId,
      serverId: run.attackedServerId,
    };
    host.access.startAccessFromSuccessfulRun(legalAction);
    return {
      handled: true,
      sourceCardId: sourceCardId as CardInstanceId,
      sourceDefinitionId: definition.id,
      serverId: run.attackedServerId,
      accessShouldStart: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }

  const hqIceId = typeof option.value === "string" ? option.value : "";
  if (!hqIceId || !host.state.corp.hq.includes(hqIceId as CardInstanceId))
    throw new Error("Das gewaehlte HQ-ICE ist nicht mehr in HQ.");
  if (host.cards.definitionFor(hqIceId as CardInstanceId).type !== "ice")
    throw new Error("Delayed Success darf nur ICE aus HQ waehlen.");
  const cost = successfulRunInterventionCost(
    host,
    interventionKind,
    server.id,
    hqIceId as CardInstanceId,
  );
  host.credits.spend("corp", cost);
  host.zones.removeFromAllZones(hqIceId as CardInstanceId);
  server.ice.unshift(hqIceId as CardInstanceId);
  run.successfulRunInterventionUsedSourceIds = [
    ...used,
    sourceCardId as CardInstanceId,
  ];
  run.successfulRunInterventionWindowClosed = true;
  delete host.state.pendingChoice;

  if (kind === "temporary_hq_ice_encounter_after_successful_run") {
    host.state.cardInstances[hqIceId] = {
      ...host.cards.cardInstanceFor(hqIceId as CardInstanceId),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverIce", serverId: server.id },
    };
    host.state.run = {
      ...run,
      phase: "encounter_ice",
      position: { kind: "ice", serverId: server.id, iceIndex: 0 },
      approachedIceId: hqIceId as CardInstanceId,
      delayedSuccessfulRun: {
        originalServerId: server.id,
        interventionSourceId: sourceCardId as CardInstanceId,
        pendingMode: "temporary_hq_ice_encounter",
        temporaryIceId: hqIceId as CardInstanceId,
      },
    };
    host.encounter.beginEncounter(hqIceId as CardInstanceId, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      delayedSuccessfulRun: true,
      temporaryEncounter: true,
      temporaryIceSourceTitle: definition.title,
      fortWindowSourceTitle: definition.title,
      sourceDefinitionId: definition.id,
      sourceCardId,
      selectedIceDefinitionId: host.cards.definitionFor(hqIceId as CardInstanceId).id,
      rezCostPaid: cost,
      serverId: server.id,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_54_dr_dreff_temporary_encounter",
    };
    return {
      handled: true,
      sourceCardId: sourceCardId as CardInstanceId,
      sourceDefinitionId: definition.id,
      serverId: server.id,
      selectedHqCardId: hqIceId as CardInstanceId,
      temporaryEncounterIceId: hqIceId as CardInstanceId,
      rezCostPaid: cost,
      encounterStarted: true,
      successFinalizationDelayed: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }

  host.state.cardInstances[hqIceId] = {
    ...host.cards.cardInstanceFor(hqIceId as CardInstanceId),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverIce", serverId: server.id },
  };
  host.state.run = {
    ...run,
    phase: "approach_ice",
    position: { kind: "ice", serverId: server.id, iceIndex: 0 },
    approachedIceId: hqIceId as CardInstanceId,
    delayedSuccessfulRun: {
      originalServerId: server.id,
      interventionSourceId: sourceCardId as CardInstanceId,
      pendingMode: "installed_ice_immediate_approach",
      installedIceId: hqIceId as CardInstanceId,
    },
  };
  host.encounter.approachOrEncounterIce(hqIceId as CardInstanceId, legalAction);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    delayedSuccessfulRun: true,
    installedInnermost: true,
    fortWindowSourceTitle: definition.title,
    sourceDefinitionId: definition.id,
    sourceCardId,
    installCostPaid: cost,
    serverId: server.id,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_54_jenny_jett_install_approach",
  };
  return {
    handled: true,
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: definition.id,
    serverId: server.id,
    selectedHqCardId: hqIceId as CardInstanceId,
    installedIceId: hqIceId as CardInstanceId,
    installCost: cost,
    approachStarted: true,
    successFinalizationDelayed: true,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function finalizeDelayedSuccessfulRunAfterPassedIce(
  host: SuccessfulRunInterventionHost,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): SuccessfulRunInterventionExecutionResult {
  const run = host.state.run;
  const delayed = run?.delayedSuccessfulRun;
  if (!run || !delayed) return { handled: false };
  const matched =
    delayed.temporaryIceId === passedIceId || delayed.installedIceId === passedIceId;
  if (!matched) return { handled: false };
  if (delayed.temporaryIceId) {
    trashTemporaryEncounterIce(host, delayed.temporaryIceId, legalAction);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        temporaryIceSourceTitle: host.cards.definitionFor(delayed.interventionSourceId)
          .title,
      };
    }
  }
  const { delayedSuccessfulRun: _delayed, ...runWithoutDelayed } = run;
  void _delayed;
  host.state.run = {
    ...runWithoutDelayed,
    successfulRunInterventionWindowClosed: true,
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      successfulRunFinalizedAfterIntervention: true,
      delayedSuccessfulRun: false,
    };
  }
  return {
    handled: true,
    successFinalized: true,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function cleanupDelayedSuccessfulRunTemporaryIce(
  host: SuccessfulRunInterventionHost,
  run: ActiveRun | undefined,
  legalAction?: LegalAction,
): SuccessfulRunInterventionExecutionResult {
  const temporaryIceId = run?.delayedSuccessfulRun?.temporaryIceId;
  if (!temporaryIceId) return { handled: false };
  const trashed = trashTemporaryEncounterIce(host, temporaryIceId, legalAction);
  return {
    handled: trashed,
    temporaryEncounterIceId: temporaryIceId,
    stateChanged: trashed,
    ...resolvedPayloadFor(legalAction),
  };
}

export function applyDirectSuccessfulRunTriggers(
  host: SuccessfulRunInterventionHost,
  legalAction?: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  const karlSources = host.state.runner.rig.resources
    .slice()
    .sort()
    .filter(
      (cardId) =>
        uniqueDirectLongtailKindForDefinition(host.cards.definitionFor(cardId).id) ===
        "karl_successful_run_credit",
    );
  if (karlSources.length === 0) return { handled: false };
  let gainedCredits = 0;
  const sourceDefinitionIds: CardDefinitionId[] = [];
  for (const sourceId of karlSources) {
    const implementation = uniqueDirectLongtailImplementationForDefinition(
      host.cards.definitionFor(sourceId).id,
    );
    if (implementation?.kind !== "karl_successful_run_credit") continue;
    host.credits.gainRunner(implementation.amount);
    gainedCredits += implementation.amount;
    sourceDefinitionIds.push(host.cards.definitionFor(sourceId).id);
  }
  if (gainedCredits <= 0) return { handled: false };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      successfulRunRunnerCreditGain:
        Number(legalAction.payload?.successfulRunRunnerCreditGain ?? 0) +
        gainedCredits,
      gainedCredits: Number(legalAction.payload?.gainedCredits ?? 0) + gainedCredits,
      karlSuccessfulRunCreditGain: gainedCredits,
      karlSuccessfulRunSourceDefinitionIds: sourceDefinitionIds.sort().join(","),
      runnerCreditsAfter: host.state.runner.credits,
    };
  }
  return {
    handled: true,
    creditsGained: gainedCredits,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function applyBodyweightDataCrecheSuccessfulRun(
  host: SuccessfulRunInterventionHost,
  legalAction?: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  const sourceId = host.state.runner.rig.hardware
    .slice()
    .sort()
    .find((cardId) => {
      const implementation = cardImplementationForDefinitionId(
        host.cards.definitionFor(cardId).id,
      );
      return implementation?.successfulRunFollowups?.some(
        (followup) => followup.kind === "optional_make_run_after_successful_run",
      );
    });
  if (!sourceId) return { handled: false };
  const sourceDefinitionId = host.cards.definitionFor(sourceId).id;
  const flags = host.runner.ensureTurnFlags();
  if (
    flags.bodyweightDataCrecheExtraRunUsedThisTurn ||
    flags.bodyweightDataCrecheExtraRunPending
  )
    return { handled: false };
  flags.bodyweightDataCrecheExtraRunPending = true;
  flags.bodyweightDataCrecheExtraRunUsedThisTurn = true;
  flags.allNighterBonusRunPending = true;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      bodyweightDataCrecheExtraRunPending: true,
      sourceDefinitionId,
    };
  }
  return {
    handled: true,
    sourceCardId: sourceId,
    sourceDefinitionId,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function resolveFalseEchoForceRez(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf False Echo nutzen.");
  const run = mustRun(host);
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (!run.successful || run.phase !== "access" || serverId !== run.attackedServerId)
    throw new Error("False Echo ist nur direkt nach erfolgreichem Run legal.");
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("False Echo ist nicht installiert.");
  const sourceDefinitionId = host.cards.definitionFor(sourceCardId).id;
  if (
    !hasSuccessfulRunForceRezFollowup(sourceDefinitionId) &&
    !(
      !cardImplementationForDefinitionId(sourceDefinitionId) &&
      sourceDefinitionId === FALSE_ECHO_FORCE_REZ_PROGRAM_ID
    )
  )
    throw new Error("Die False-Echo-Faehigkeit passt nicht zur Karte.");
  const abilityCost = successfulRunForceRezFollowupCreditCost(sourceDefinitionId);
  if (host.costs.creditCostForAction(legalAction) !== abilityCost)
    throw new Error("False Echo hat nicht mehr die erwarteten Kosten.");
  if (host.state.runner.credits < abilityCost)
    throw new Error("Runner kann False Echo nicht bezahlen.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("False Echo wurde fuer diesen Run bereits genutzt.");
  const server = host.servers.mustServer(serverId);
  if (abilityCost > 0) host.credits.spend("runner", abilityCost);
  const checkedIceIds = server.ice.slice();
  let rezzedCount = 0;
  let rezCostPaid = 0;
  for (const iceId of checkedIceIds) {
    const instance = host.cards.cardInstanceFor(iceId);
    if (instance.rezzed) continue;
    const cost = host.costs.rezCostForCard(iceId);
    if (host.state.corp.credits < cost) continue;
    host.credits.spend("corp", cost);
    host.state.cardInstances[iceId] = {
      ...instance,
      rezzed: true,
      faceup: true,
    };
    rezzedCount += 1;
    rezCostPaid += cost;
  }
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId,
    falseEchoCreditCost: abilityCost,
    serverLabel: host.servers.publicServerLabel(server.id) ?? server.id,
    checkedIceCount: checkedIceIds.length,
    rezzedIceCount: rezzedCount,
    rezCostPaid,
    corpCreditsAfter: host.state.corp.credits,
    runnerCreditsAfter: host.state.runner.credits,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function resolveNetspaceInverterReverseIce(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Netspace Inverter nutzen.");
  const run = mustRun(host);
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (!run.successful || run.phase !== "access" || serverId !== run.attackedServerId)
    throw new Error(
      "Netspace Inverter ist nur direkt nach erfolgreichem Run legal.",
    );
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Netspace Inverter ist nicht installiert.");
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  const reverseFollowup =
    cardImplementationForDefinitionId(sourceDefinition.id)?.successfulRunFollowups?.some(
      (followup) => followup.kind === "reverse_ice_on_successful_run_fort",
    ) ?? false;
  if (
    !reverseFollowup &&
    sourceDefinition.id !== NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID
  )
    throw new Error("Die Netspace-Inverter-Faehigkeit passt nicht zur Karte.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Netspace Inverter wurde fuer diesen Run bereits genutzt.");
  const server = host.servers.mustServer(serverId);
  if (server.kind === "archives" || server.ice.length <= 1)
    throw new Error("Dieses Remote kann nicht umgekehrt werden.");
  server.ice.reverse();
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: sourceDefinition.id,
    serverLabel: host.servers.publicServerLabel(server.id) ?? server.id,
    iceCount: server.ice.length,
    serverIceOrderReversed: true,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: sourceDefinition.id,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function resolveFaitAccompliSuccessfulRunCounter(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Fait Accompli nutzen.");
  const run = mustRun(host);
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (!run.successful || run.phase !== "access" || serverId !== run.attackedServerId)
    throw new Error("Fait Accompli ist nur direkt nach erfolgreichem Run legal.");
  const server = host.servers.mustServer(serverId);
  if (server.kind !== "remote")
    throw new Error("Fait Accompli markiert nur subsidiary data forts.");
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Fait Accompli ist nicht installiert.");
  if (host.cards.definitionFor(sourceCardId).id !== FAIT_ACCOMPLI_COUNTER_PROGRAM_ID)
    throw new Error("Die Fait-Accompli-Faehigkeit passt nicht zur Karte.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Fait Accompli wurde fuer diesen Run bereits genutzt.");
  host.counters.addCardCounter(sourceCardId, "power", 1);
  host.state.faitAccompliCountersByServer ??= {};
  host.state.faitAccompliCountersByServer[serverId] =
    Math.max(0, Math.floor(host.state.faitAccompliCountersByServer[serverId] ?? 0)) +
    1;
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: FAIT_ACCOMPLI_COUNTER_PROGRAM_ID,
    serverLabel: host.servers.publicServerLabel(server.id) ?? server.id,
    addedCounterAmount: 1,
    remainingCounters: host.counters.cardCounter(sourceCardId, "power"),
    faitAccompliServerCounters:
      host.state.faitAccompliCountersByServer[serverId] ?? 0,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: FAIT_ACCOMPLI_COUNTER_PROGRAM_ID,
    counterPlaced: true,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function resolveISpyPutSpyCounter(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf I Spy nutzen.");
  const run = mustRun(host);
  if (!run.successful || run.phase !== "access")
    throw new Error("I Spy ist nur direkt nach einem erfolgreichen Run legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("I Spy ist nicht installiert.");
  if (
    runnerUtilityLongtailKindForDefinition(host.cards.definitionFor(sourceCardId).id) !==
    "i_spy_successful_run_fort_counter_expose"
  )
    throw new Error("Die I-Spy-Faehigkeit passt nicht zur Karte.");
  if (serverId !== run.attackedServerId)
    throw new Error("I Spy kann nur den gerade erfolgreichen Fort markieren.");
  const server = host.servers.mustServer(serverId);
  if (server.kind === "archives")
    throw new Error("I Spy kann nur einen Data Fort markieren.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("I Spy wurde fuer diesen Run bereits genutzt.");
  host.zones.trashRunnerInstalledCardToHeap(sourceCardId, legalAction);
  host.state.spyCountersByServer = {
    ...(host.state.spyCountersByServer ?? {}),
    [server.id]: spyCountersForServer(host.state, server.id) + 1,
  };
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId].sort();
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverId: server.id,
    serverLabel: host.servers.publicServerLabel(server.id) ?? server.id,
    counterType: "spy",
    addedCounterAmount: 1,
    spyCounterFort: server.id,
    spyCountersAfter: spyCountersForServer(host.state, server.id),
    exposedServerId: server.id,
    exposedCount: server.ice.length + server.root.length,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    counterPlaced: true,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function trashTemporaryEncounterIce(
  host: SuccessfulRunInterventionHost,
  temporaryIceId: CardInstanceId,
  legalAction?: LegalAction,
): boolean {
  const instance = host.state.cardInstances[temporaryIceId];
  if (instance?.zone.side !== "corp" || instance.zone.zone !== "serverIce")
    return false;
  host.zones.trashCorpInstalledCardToArchives(temporaryIceId, legalAction);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      temporaryEncounterTrashed: true,
    };
  }
  return true;
}

function hasSuccessfulRunForceRezFollowup(
  definitionId: CardDefinitionId,
): boolean {
  return (
    cardImplementationForDefinitionId(definitionId)?.successfulRunFollowups?.some(
      (followup) =>
        followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
    ) ?? false
  );
}

function successfulRunForceRezFollowupCreditCost(
  definitionId: CardDefinitionId,
): number {
  const implementation =
    cardImplementationForDefinitionId(definitionId)?.successfulRunFollowups?.find(
      (followup) =>
        followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
    );
  if (implementation?.kind !== "force_rez_ice_outermost_inward_after_successful_run")
    return 0;
  return implementation.cost.amount;
}

function runnerUtilityLongtailKindForDefinition(
  definitionId: CardDefinitionId,
): CardRunnerUtilityLongtailImplementation["kind"] | undefined {
  return cardImplementationForDefinitionId(definitionId)?.runnerUtilityLongtail
    ?.kind;
}

function uniqueDirectLongtailImplementationForDefinition(
  definitionId: CardDefinitionId,
): CardUniqueDirectLongtailImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)?.uniqueDirectLongtail;
}

function uniqueDirectLongtailKindForDefinition(
  definitionId: CardDefinitionId,
): CardUniqueDirectLongtailImplementation["kind"] | undefined {
  return uniqueDirectLongtailImplementationForDefinition(definitionId)?.kind;
}

function spyCountersForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return Math.max(0, Math.floor(state.spyCountersByServer?.[serverId] ?? 0));
}

function mustRun(host: SuccessfulRunInterventionHost): ActiveRun {
  if (!host.state.run) throw new Error("Es laeuft kein Run.");
  return host.state.run;
}

function resolvedPayloadFor(
  legalAction: LegalAction | undefined,
): Pick<
  SuccessfulRunInterventionExecutionResult | SuccessfulRunFollowupExecutionResult,
  "resolvedPayload"
> {
  return legalAction?.payload ? { resolvedPayload: legalAction.payload } : {};
}
