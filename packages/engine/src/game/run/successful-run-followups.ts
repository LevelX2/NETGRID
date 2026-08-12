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
  CardSuccessfulRunFollowupImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardUniqueDirectLongtailImplementation,
} from "../../ability-engine/definition-types";
import {
  cardImplementationPrimitivePayload,
  type SuccessfulRunBeforeAccessEffect,
} from "../../ability-engine/card-implementation-primitives";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { hiddenRunnerResourceRevealPayload } from "../damage/damage-core";
import type { SuccessfulRunInterventionKind } from "./run-access-transition";
import type {
  ActiveRun,
  SuccessfulRunFollowupExecutionResult,
  SuccessfulRunInterventionExecutionResult,
  SuccessfulRunInterventionHost,
} from "./successful-run-contracts";

export function applyDirectSuccessfulRunTriggers(
  host: SuccessfulRunInterventionHost,
  legalAction?: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  const karlSources = host.state.runner.rig.resources
    .slice()
    .sort()
    .filter(
      (cardId) =>
        uniqueDirectLongtailKindForDefinition(
          host.cards.definitionFor(cardId).id,
        ) === "successful_run_credit_resource",
    );
  let gainedCredits = 0;
  const sourceDefinitionIds: CardDefinitionId[] = [];
  for (const sourceId of karlSources) {
    const implementation = uniqueDirectLongtailImplementationForDefinition(
      host.cards.definitionFor(sourceId).id,
    );
    if (implementation?.kind !== "successful_run_credit_resource") continue;
    host.credits.gainRunner(implementation.amount);
    gainedCredits += implementation.amount;
    sourceDefinitionIds.push(host.cards.definitionFor(sourceId).id);
  }
  if (gainedCredits > 0 && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      successfulRunRunnerCreditGain:
        Number(legalAction.payload?.successfulRunRunnerCreditGain ?? 0) +
        gainedCredits,
      gainedCredits:
        Number(legalAction.payload?.gainedCredits ?? 0) + gainedCredits,
      karlSuccessfulRunCreditGain: gainedCredits,
      karlSuccessfulRunSourceDefinitionIds: sourceDefinitionIds
        .sort()
        .join(","),
      runnerCreditsAfter: host.state.runner.credits,
    };
  }
  if (gainedCredits <= 0) return { handled: false };
  return {
    handled: true,
    ...(gainedCredits > 0 ? { creditsGained: gainedCredits } : {}),
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function resolveCorpShuffleRunnerGripAfterSuccessfulRunChoice(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): SuccessfulRunFollowupExecutionResult {
  const run = host.state.run;
  const choice = host.state.pendingChoice;
  if (
    !run ||
    !choice ||
    !choice.source.startsWith("classic.indiscriminate_response_team:")
  )
    throw new Error("Es ist keine Indiscriminate-Response-Team-Choice offen.");
  const [, sourceCardId = "", choiceRunId = ""] = choice.source.split(":");
  if (!sourceCardId || choiceRunId !== run.runId)
    throw new Error(
      "Die Indiscriminate-Response-Team-Choice passt nicht zum Run.",
    );
  const sourceId = sourceCardId as CardInstanceId;
  const instance = host.state.cardInstances[sourceId];
  if (
    !instance ||
    instance.controller !== "corp" ||
    instance.rezzed !== true ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "serverRoot" ||
    !cardImplementationForDefinitionId(
      instance.definitionId,
    )?.successfulRunFollowups?.some(
      (followup) =>
        followup.kind ===
        "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count",
    )
  )
    throw new Error(
      "Die Indiscriminate-Response-Team-Quelle ist nicht mehr legal.",
    );
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceId))
    throw new Error(
      "Diese Indiscriminate-Response-Team-Quelle wurde bereits behandelt.",
    );
  const selectedId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find(
    (candidate) => candidate.id === selectedId,
  );
  if (
    !option ||
    (option.value !== "decline" && option.value !== "shuffle_grip")
  )
    throw new Error("Die Indiscriminate-Response-Team-Auswahl ist ungueltig.");
  delete host.state.pendingChoice;
  run.successfulRunAbilityUsedSourceIds = [...used, sourceId].sort();
  const sourceDefinitionId = host.cards.definitionFor(sourceId).id;
  if (option.value === "decline") {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      classicIndiscriminateResponseTeam: true,
      interventionDecision: "decline",
      sourceCardId: sourceId,
      sourceDefinitionId,
      hiddenZoneBarrier: true,
    };
  } else {
    const shuffledCount = host.runnerCards.shuffleGripIntoStack(
      `classic.indiscriminate_response_team.${run.runId}.${sourceId}.${host.state.stateVersion}`,
    );
    const drawSummary = host.runnerCards.drawCards(shuffledCount);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      classicIndiscriminateResponseTeam: true,
      interventionDecision: "apply",
      runnerGripShuffledIntoStackCount: shuffledCount,
      runnerCardsDrawnAfterGripShuffle: drawSummary.drawnCount,
      runnerGripAfter: host.state.runner.grip.length,
      runnerStackAfter: host.state.runner.stack.length,
      sourceCardId: sourceId,
      sourceDefinitionId,
      hiddenZoneBarrier: true,
    };
  }
  host.access.startAccessFromSuccessfulRun(legalAction);
  return {
    handled: true,
    sourceCardId: sourceId,
    sourceDefinitionId,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function applySuccessfulRunExtraRunFollowup(
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
        (followup) =>
          followup.kind === "optional_make_run_after_successful_run",
      );
    });
  if (!sourceId) return { handled: false };
  const sourceDefinitionId = host.cards.definitionFor(sourceId).id;
  const flags = host.runner.ensureTurnFlags();
  if (
    flags.successfulRunExtraRunUsedThisTurn ||
    flags.successfulRunExtraRunPending
  )
    return { handled: false };
  flags.successfulRunExtraRunPending = true;
  flags.successfulRunExtraRunUsedThisTurn = false;
  flags.bonusRunPending = true;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      successfulRunExtraRunPending: true,
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

export function resolveSuccessfulRunForceRez(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf False Echo nutzen.");
  const run = mustRun(host);
  const sourceCardId = String(
    legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (
    !run.successful ||
    run.phase !== "access" ||
    serverId !== run.attackedServerId
  )
    throw new Error("False Echo ist nur direkt nach erfolgreichem Run legal.");
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("False Echo ist nicht installiert.");
  const sourceDefinitionId = host.cards.definitionFor(sourceCardId).id;
  if (!hasSuccessfulRunForceRezFollowup(sourceDefinitionId))
    throw new Error("Die False-Echo-Faehigkeit passt nicht zur Karte.");
  const abilityCost =
    successfulRunForceRezFollowupCreditCost(sourceDefinitionId);
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
    successfulRunForceRezCreditCost: abilityCost,
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

export function resolveSuccessfulRunReverseIce(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Netspace Inverter nutzen.");
  const run = mustRun(host);
  const sourceCardId = String(
    legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (
    !run.successful ||
    run.phase !== "access" ||
    serverId !== run.attackedServerId
  )
    throw new Error(
      "Netspace Inverter ist nur direkt nach erfolgreichem Run legal.",
    );
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Netspace Inverter ist nicht installiert.");
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  const reverseFollowup =
    cardImplementationForDefinitionId(
      sourceDefinition.id,
    )?.successfulRunFollowups?.some(
      (followup) => followup.kind === "reverse_ice_on_successful_run_fort",
    ) ?? false;
  if (!reverseFollowup)
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

export function resolveSuccessfulRunFortCounterExpose(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf I Spy nutzen.");
  const run = mustRun(host);
  if (!run.successful || run.phase !== "access")
    throw new Error("I Spy ist nur direkt nach einem erfolgreichen Run legal.");
  const sourceCardId = String(
    legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("I Spy ist nicht installiert.");
  if (
    runnerUtilityLongtailKindForDefinition(
      host.cards.definitionFor(sourceCardId).id,
    ) !== "successful_run_fort_counter_expose"
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

export function trashTemporaryEncounterIce(
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

export function hasSuccessfulRunForceRezFollowup(
  definitionId: CardDefinitionId,
): boolean {
  return (
    cardImplementationForDefinitionId(
      definitionId,
    )?.successfulRunFollowups?.some(
      (followup) =>
        followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
    ) ?? false
  );
}

export function successfulRunForceRezFollowupCreditCost(
  definitionId: CardDefinitionId,
): number {
  const implementation = cardImplementationForDefinitionId(
    definitionId,
  )?.successfulRunFollowups?.find(
    (followup) =>
      followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
  );
  if (
    implementation?.kind !==
    "force_rez_ice_outermost_inward_after_successful_run"
  )
    return 0;
  return implementation.cost.amount;
}

export function runnerUtilityLongtailKindForDefinition(
  definitionId: CardDefinitionId,
): CardRunnerUtilityLongtailImplementation["kind"] | undefined {
  return cardImplementationForDefinitionId(definitionId)?.runnerUtilityLongtail
    ?.kind;
}

export function uniqueDirectLongtailImplementationForDefinition(
  definitionId: CardDefinitionId,
): CardUniqueDirectLongtailImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)?.uniqueDirectLongtail;
}

export function uniqueDirectLongtailKindForDefinition(
  definitionId: CardDefinitionId,
): CardUniqueDirectLongtailImplementation["kind"] | undefined {
  return uniqueDirectLongtailImplementationForDefinition(definitionId)?.kind;
}

export function spyCountersForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return Math.max(0, Math.floor(state.spyCountersByServer?.[serverId] ?? 0));
}

export function mustRun(host: SuccessfulRunInterventionHost): ActiveRun {
  if (!host.state.run) throw new Error("Es laeuft kein Run.");
  return host.state.run;
}

export function resolvedPayloadFor(
  legalAction: LegalAction | undefined,
): Pick<
  | SuccessfulRunInterventionExecutionResult
  | SuccessfulRunFollowupExecutionResult,
  "resolvedPayload"
> {
  return legalAction?.payload ? { resolvedPayload: legalAction.payload } : {};
}
