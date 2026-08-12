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
import {
  hasSuccessfulRunForceRezFollowup,
  mustRun,
  resolvedPayloadFor,
  resolveSuccessfulRunForceRez,
  resolveSuccessfulRunFortCounterExpose,
  resolveCorpShuffleRunnerGripAfterSuccessfulRunChoice,
  resolveSuccessfulRunReverseIce,
  runnerUtilityLongtailKindForDefinition,
  successfulRunForceRezFollowupCreditCost,
  trashTemporaryEncounterIce,
} from "./successful-run-followups";
import type {
  ActiveRun,
  SuccessfulRunFollowupExecutionResult,
  SuccessfulRunInterventionExecutionResult,
  SuccessfulRunInterventionHost,
} from "./successful-run-contracts";
import { successfulRunServerId } from "./run-server-identities";

export function hqCorpLoseCreditsBeforeAccessEffect(
  followups: readonly CardSuccessfulRunFollowupImplementation[] | undefined,
):
  | Extract<
      SuccessfulRunBeforeAccessEffect,
      { server: "hq"; effect: { kind: "corp_lose_credits" } }
    >
  | undefined {
  return followups?.find(
    (
      followup,
    ): followup is Extract<
      SuccessfulRunBeforeAccessEffect,
      { server: "hq"; effect: { kind: "corp_lose_credits" } }
    > =>
      followup.kind === "successful_run_before_access_effect" &&
      followup.server === "hq" &&
      followup.effect.kind === "corp_lose_credits" &&
      followup.source === "installed_hidden_runner_resource" &&
      followup.cost.kind === "reveal_and_trash_source",
  );
}

export function remoteTrashFortBeforeAccessEffect(
  followups: readonly CardSuccessfulRunFollowupImplementation[] | undefined,
):
  | Extract<
      SuccessfulRunBeforeAccessEffect,
      { server: "remote"; effect: { kind: "trash_remote_fort" } }
    >
  | undefined {
  return followups?.find(
    (
      followup,
    ): followup is Extract<
      SuccessfulRunBeforeAccessEffect,
      { server: "remote"; effect: { kind: "trash_remote_fort" } }
    > =>
      followup.kind === "successful_run_before_access_effect" &&
      followup.server === "remote" &&
      followup.effect.kind === "trash_remote_fort" &&
      followup.effect.include === "root" &&
      followup.source === "installed_hidden_runner_resource" &&
      followup.cost.kind === "reveal_and_trash_source",
  );
}

export function successfulRunBeforeAccessEffectByEffectKind(
  followups: readonly CardSuccessfulRunFollowupImplementation[] | undefined,
  effectKind: SuccessfulRunBeforeAccessEffect["effect"]["kind"],
  abilityKey?: string,
): SuccessfulRunBeforeAccessEffect | undefined {
  const matches = followups?.filter(
    (followup): followup is SuccessfulRunBeforeAccessEffect =>
      followup.kind === "successful_run_before_access_effect" &&
      followup.timing === "immediately_after_successful_run_before_access" &&
      followup.source === "installed_hidden_runner_resource" &&
      followup.cost.kind === "reveal_and_trash_source" &&
      followup.effect.kind === effectKind,
  );
  if (abilityKey) {
    return matches?.find(
      (followup) => successfulRunFollowupBindingKey(followup) === abilityKey,
    );
  }
  return matches?.[0];
}

function successfulRunFollowupBinding(
  followup: SuccessfulRunBeforeAccessEffect,
): { abilityKey?: string; capabilityKey?: string } {
  const record = followup as SuccessfulRunBeforeAccessEffect & {
    capabilityKey?: unknown;
  };
  if (typeof record.capabilityKey === "string")
    return { capabilityKey: record.capabilityKey };
  return typeof followup.abilityKey === "string"
    ? { abilityKey: followup.abilityKey }
    : {};
}

function successfulRunFollowupBindingKey(
  followup: SuccessfulRunBeforeAccessEffect,
): string | undefined {
  const binding = successfulRunFollowupBinding(followup);
  return binding.capabilityKey ?? binding.abilityKey;
}

export function successfulRunInterventionKindForDefinition(
  definitionId: CardDefinitionId,
): SuccessfulRunInterventionKind | undefined {
  const window = cardImplementationForDefinitionId(
    definitionId,
  )?.fortRunWindows?.find(
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
  const successfulServerId = successfulRunServerId(run);
  const used = new Set(run.successfulRunAbilityUsedSourceIds ?? []);
  const actions: LegalAction[] = [];
  for (const sourceCardId of [
    ...host.state.runner.rig.programs,
    ...host.state.runner.rig.resources,
  ].sort()) {
    if (used.has(sourceCardId)) continue;
    const definition = host.cards.definitionFor(sourceCardId);
    const forceRezFollowup = hasSuccessfulRunForceRezFollowup(definition.id);
    if (forceRezFollowup) {
      const server = host.servers.mustServer(successfulServerId);
      const unrezzedCount = server.ice.filter(
        (iceId) => !host.cards.cardInstanceFor(iceId).rezzed,
      ).length;
      if (unrezzedCount <= 0) continue;
      const abilityCost = successfulRunForceRezFollowupCreditCost(
        definition.id,
      );
      if (host.state.runner.credits < abilityCost) continue;
      actions.push(
        host.actions.createRunnerTriggerAction(
          `${definition.title}: ICE rezzen lassen`,
          sourceCardId,
          abilityCost > 0 ? [{ credits: abilityCost }] : [],
          {
            cardId: sourceCardId,
            serverId: server.id,
            v1922RunnerProgramAbility: "successful_run_force_rez",
            successfulRunForceRezCreditCost: abilityCost,
            unrezzedIceCount: unrezzedCount,
          },
        ),
      );
    }
    const successfulRunFollowups =
      cardImplementationForDefinitionId(definition.id)
        ?.successfulRunFollowups ?? [];
    if (
      successfulRunFollowups.some(
        (followup) =>
          followup.kind === "skip_rd_access_add_purgeable_runner_virus_counter",
      ) &&
      successfulServerId === "rd" &&
      !run.accessedCardId
    ) {
      actions.push(
        host.actions.createRunnerTriggerAction(
          `${definition.title}: Doom-Counter statt Zugriff`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            serverId: successfulServerId,
            successfulRunAccessReplacement:
              "skip_access_add_purgeable_runner_virus_counter",
            counterSide: "corp",
            counterType: "doom",
            counterDelta: 1,
          },
        ),
      );
    }
    const hqCreditLossFollowup = hqCorpLoseCreditsBeforeAccessEffect(
      successfulRunFollowups,
    );
    if (
      hqCreditLossFollowup &&
      successfulServerId === "hq" &&
      host.state.runner.rig.resources.includes(sourceCardId)
    ) {
      actions.push(
        host.actions.createRunnerTriggerAction(
          `${definition.title}: Korp verliert Credits`,
          sourceCardId,
          [],
          {
            ...cardImplementationPrimitivePayload({
              sourceCardId,
              sourceDefinitionId: definition.id,
              primitiveKind: hqCreditLossFollowup.kind,
              effectKind: hqCreditLossFollowup.effect.kind,
              ...successfulRunFollowupBinding(hqCreditLossFollowup),
            }),
            cardId: sourceCardId,
            serverId: successfulServerId,
            proteusHiddenSuccessfulRunFollowup: "corp_lose_credits",
            creditLoss: hqCreditLossFollowup.effect.amount,
          },
        ),
      );
    }
    const remoteTrashFortFollowup = remoteTrashFortBeforeAccessEffect(
      successfulRunFollowups,
    );
    if (
      remoteTrashFortFollowup &&
      host.servers.mustServer(successfulServerId).kind === "remote" &&
      host.state.runner.rig.resources.includes(sourceCardId)
    ) {
      const server = host.servers.mustServer(successfulServerId);
      const targetCount = server.root.length + server.ice.length;
      if (targetCount > 0) {
        actions.push(
          host.actions.createRunnerTriggerAction(
            `${definition.title}: Remote-Fort trashen`,
            sourceCardId,
            [],
            {
              ...cardImplementationPrimitivePayload({
                sourceCardId,
                sourceDefinitionId: definition.id,
                primitiveKind: remoteTrashFortFollowup.kind,
                effectKind: remoteTrashFortFollowup.effect.kind,
                ...successfulRunFollowupBinding(remoteTrashFortFollowup),
              }),
              cardId: sourceCardId,
              serverId: successfulServerId,
              proteusHiddenSuccessfulRunFollowup: "trash_remote_fort",
              targetCount,
            },
          ),
        );
      }
    }
    if (
      successfulRunFollowups.some(
        (followup) => followup.kind === "reverse_ice_on_successful_run_fort",
      )
    ) {
      const server = host.servers.mustServer(successfulServerId);
      if (server.kind !== "archives" && server.ice.length > 1) {
        actions.push(
          host.actions.createRunnerTriggerAction(
            `${definition.title}: ICE-Reihenfolge umkehren`,
            sourceCardId,
            [],
            {
              cardId: sourceCardId,
              serverId: server.id,
              v1922RunnerProgramAbility: "successful_run_reverse_ice",
              iceCount: server.ice.length,
            },
          ),
        );
      }
    }
    if (
      runnerUtilityLongtailKindForDefinition(definition.id) ===
      "successful_run_fort_counter_expose"
    ) {
      const server = host.servers.mustServer(successfulServerId);
      if (server.kind !== "archives") {
        actions.push(
          host.actions.createRunnerTriggerAction(
            `${definition.title}: Spy-Counter platzieren`,
            sourceCardId,
            [],
            {
              cardId: sourceCardId,
              serverId: server.id,
              runnerUtilityAbility: "successful_run_fort_counter_expose",
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
  if (
    legalAction.payload?.v1922RunnerProgramAbility ===
    "successful_run_force_rez"
  )
    return resolveSuccessfulRunForceRez(host, legalAction);
  if (
    legalAction.payload?.v1922RunnerProgramAbility ===
    "successful_run_reverse_ice"
  )
    return resolveSuccessfulRunReverseIce(host, legalAction);
  if (
    legalAction.payload?.runnerUtilityAbility ===
    "successful_run_fort_counter_expose"
  )
    return resolveSuccessfulRunFortCounterExpose(host, legalAction);
  if (
    legalAction.payload?.successfulRunAccessReplacement ===
    "skip_access_add_purgeable_runner_virus_counter"
  )
    return resolveArmageddonDoomCounterInsteadOfAccess(host, legalAction);
  if (
    legalAction.payload?.cardImplementationPrimitiveKind ===
      "successful_run_before_access_effect" &&
    legalAction.payload?.cardImplementationEffectKind === "corp_lose_credits"
  )
    return resolveHiddenSuccessfulRunBeforeAccessEffect(
      host,
      legalAction,
      "corp_lose_credits",
    );
  if (
    legalAction.payload?.cardImplementationPrimitiveKind ===
      "successful_run_before_access_effect" &&
    legalAction.payload?.cardImplementationEffectKind === "trash_remote_fort"
  )
    return resolveHiddenSuccessfulRunBeforeAccessEffect(
      host,
      legalAction,
      "trash_remote_fort",
    );
  if (
    legalAction.payload?.proteusHiddenSuccessfulRunFollowup ===
    "corp_lose_credits"
  )
    return resolveHiddenSuccessfulRunBeforeAccessEffect(
      host,
      legalAction,
      "corp_lose_credits",
    );
  if (
    legalAction.payload?.proteusHiddenSuccessfulRunFollowup ===
    "trash_remote_fort"
  )
    return resolveHiddenSuccessfulRunBeforeAccessEffect(
      host,
      legalAction,
      "trash_remote_fort",
    );
  return { handled: false };
}

export function revealAndTrashHiddenResourceSource(
  host: SuccessfulRunInterventionHost,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): Record<string, unknown> {
  const instance = host.cards.cardInstanceFor(sourceCardId);
  if (
    !host.state.runner.rig.resources.includes(sourceCardId) ||
    instance.controller !== "runner"
  )
    throw new Error("Die Hidden-Resource-Quelle ist nicht installiert.");
  const payload = hiddenRunnerResourceRevealPayload(host.state, sourceCardId);
  host.zones.trashRunnerInstalledCardToHeap(sourceCardId, legalAction);
  return {
    ...payload,
    sourceTrashed: true,
    trashedCardDefinitionId: host.cards.definitionFor(sourceCardId).id,
  };
}

export function resolveHiddenSuccessfulRunBeforeAccessEffect(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
  effectKind: SuccessfulRunBeforeAccessEffect["effect"]["kind"],
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf diese Hidden Resource nutzen.");
  const run = mustRun(host);
  const sourceCardId = String(
    legalAction.payload?.sourceCardId ?? legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  const serverId = String(
    legalAction.payload?.serverId ?? successfulRunServerId(run),
  ) as Exclude<ServerId, "new_remote">;
  if (!run.successful || run.phase !== "access")
    throw new Error(
      "Diese Hidden Resource ist nur vor Access nach erfolgreichem Run legal.",
    );
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  const followup = successfulRunBeforeAccessEffectByEffectKind(
    cardImplementationForDefinitionId(sourceDefinition.id)
      ?.successfulRunFollowups,
    effectKind,
    typeof legalAction.payload?.cardImplementationAbilityKey === "string"
      ? legalAction.payload.cardImplementationAbilityKey
      : undefined,
  );
  if (!followup)
    throw new Error("Die Hidden-Resource-Faehigkeit passt nicht zur Karte.");
  if (followup.server === "hq") {
    if (successfulRunServerId(run) !== "hq")
      throw new Error(
        "Credit Subversion ist nur vor HQ-Access nach erfolgreichem Run legal.",
      );
  } else {
    if (serverId !== successfulRunServerId(run))
      throw new Error(
        "Death from Above muss das gerade erfolgreiche Remote treffen.",
      );
    const server = host.servers.mustServer(serverId);
    if (server.kind !== "remote")
      throw new Error(
        "Death from Above kann nur subsidiary data forts treffen.",
      );
  }
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Diese Successful-Run-Faehigkeit wurde bereits genutzt.");
  const revealPayload = revealAndTrashHiddenResourceSource(
    host,
    sourceCardId,
    legalAction,
  );
  if (
    followup.server === "remote" &&
    followup.effect.kind === "trash_remote_fort"
  ) {
    return resolveHiddenSuccessfulRunTrashRemoteFortEffect(
      host,
      legalAction,
      sourceCardId,
      sourceDefinition.id,
      serverId,
      followup,
      used,
      revealPayload,
    );
  }
  if (followup.effect.kind !== "corp_lose_credits")
    throw new Error("Die Hidden-Resource-Faehigkeit passt nicht zur Karte.");
  const creditLoss = Math.min(host.state.corp.credits, followup.effect.amount);
  host.state.corp.credits -= creditLoss;
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId].sort();
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...cardImplementationPrimitivePayload({
      sourceCardId,
      sourceDefinitionId: sourceDefinition.id,
      primitiveKind: followup.kind,
      effectKind: followup.effect.kind,
      ...successfulRunFollowupBinding(followup),
    }),
    ...revealPayload,
    cardId: sourceCardId,
    creditLoss,
    creditsLost: creditLoss,
    corpCreditsAfter: host.state.corp.credits,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "proteus_hidden_successful_hq_run_credit_subversion",
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: sourceDefinition.id,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function resolveHiddenSuccessfulRunTrashRemoteFortEffect(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  serverId: Exclude<ServerId, "new_remote">,
  followup: Extract<
    SuccessfulRunBeforeAccessEffect,
    { effect: { kind: "trash_remote_fort" } }
  >,
  used: readonly CardInstanceId[],
  revealPayload: Record<string, unknown>,
): SuccessfulRunFollowupExecutionResult {
  const run = mustRun(host);
  const server = host.servers.mustServer(serverId);
  const targets = server.root.slice().sort();
  if (targets.length === 0)
    throw new Error("Death from Above braucht ein nicht-leeres Remote-Fort.");
  const trashedDefinitionIds: CardDefinitionId[] = [];
  for (const targetId of targets) {
    trashedDefinitionIds.push(host.cards.definitionFor(targetId).id);
    host.zones.trashCorpInstalledCardToArchives(targetId, legalAction);
  }
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId].sort();
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...cardImplementationPrimitivePayload({
      sourceCardId,
      sourceDefinitionId,
      primitiveKind: followup.kind,
      effectKind: followup.effect.kind,
      ...successfulRunFollowupBinding(followup),
    }),
    ...revealPayload,
    cardId: sourceCardId,
    serverId,
    trashedCount: targets.length,
    trashedCardDefinitionIds: trashedDefinitionIds.sort().join(","),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "proteus_hidden_successful_remote_run_trash_fort",
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId,
    serverId,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function resolveArmageddonDoomCounterInsteadOfAccess(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Armageddon nutzen.");
  const run = mustRun(host);
  if (
    !run.successful ||
    run.phase !== "access" ||
    successfulRunServerId(run) !== "rd"
  )
    throw new Error(
      "Armageddon ist nur statt Zugriff nach erfolgreichem R&D-Run legal.",
    );
  const sourceCardId = String(
    legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Armageddon ist nicht installiert.");
  const implementation = cardImplementationForDefinitionId(
    host.cards.definitionFor(sourceCardId).id,
  );
  if (
    !implementation?.successfulRunFollowups?.some(
      (followup) =>
        followup.kind === "skip_rd_access_add_purgeable_runner_virus_counter" &&
        followup.counterType === "doom",
    )
  )
    throw new Error("Die Armageddon-Faehigkeit passt nicht zur Karte.");
  const counters = (host.state.purgeableRunnerVirusCounters ??= {});
  const corpCounters = (counters.corp ??= {});
  const before = Math.max(0, Math.floor(corpCounters.doom ?? 0));
  corpCounters.doom = before + 1;
  host.access.finishSuccessfulRun(legalAction);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    successfulRunAccessReplacement:
      "skip_access_add_purgeable_runner_virus_counter",
    counterSide: "corp",
    counterType: "doom",
    counterDelta: 1,
    counterTotalAfter: before + 1,
    sourceCardDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverId: "rd",
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

export function resolveSuccessfulRunInterventionChoice(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): SuccessfulRunInterventionExecutionResult {
  const choice = host.state.pendingChoice;
  if (choice?.source.startsWith("classic.indiscriminate_response_team:"))
    return resolveCorpShuffleRunnerGripAfterSuccessfulRunChoice(
      host,
      legalAction,
      playerAction,
    );
  if (!choice || !choice.source.startsWith("p3_54.delayed_success"))
    throw new Error("Es ist keine Delayed-Success-Choice offen.");
  const [, sourceCardId = "", kind = "", serverId = ""] =
    choice.source.split(":");
  if (
    kind !== "temporary_hq_ice_encounter_after_successful_run" &&
    kind !== "install_hq_ice_innermost_after_successful_run"
  )
    throw new Error("Die Delayed-Success-Choice ist ungueltig.");
  const run = mustRun(host);
  if (
    !sourceCardId ||
    !host.state.cardInstances[sourceCardId] ||
    successfulRunServerId(run) !== serverId ||
    run.position.kind !== "server" ||
    run.delayedSuccessfulRun
  )
    throw new Error("Der Delayed-Success-Kontext ist nicht mehr gueltig.");
  const server = host.servers.mustServer(successfulRunServerId(run));
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

  const selectedId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find(
    (candidate) => candidate.id === selectedId,
  );
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
      serverId: successfulRunServerId(run),
      hiddenZoneAction: "successful_run_intervention_declined",
      interventionDecision: "decline",
    };
    host.access.startAccessFromSuccessfulRun(legalAction);
    return {
      handled: true,
      sourceCardId: sourceCardId as CardInstanceId,
      sourceDefinitionId: definition.id,
      serverId: successfulRunServerId(run),
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
      selectedIceDefinitionId: host.cards.definitionFor(
        hqIceId as CardInstanceId,
      ).id,
      rezCostPaid: cost,
      serverId: server.id,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "successful_run_temporary_encounter",
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
    hiddenZoneAction: "successful_run_install_approach",
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
    delayed.temporaryIceId === passedIceId ||
    delayed.installedIceId === passedIceId;
  if (!matched) return { handled: false };
  if (delayed.temporaryIceId) {
    const temporaryIceDefinitionId = host.cards.definitionFor(
      delayed.temporaryIceId,
    ).id;
    trashTemporaryEncounterIce(host, delayed.temporaryIceId, legalAction);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        temporaryIceSourceTitle: host.cards.definitionFor(
          delayed.interventionSourceId,
        ).title,
        temporaryIceDefinitionId,
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
      sourceDefinitionId: host.cards.definitionFor(delayed.interventionSourceId)
        .id,
      serverId: delayed.originalServerId,
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

export {
  applySuccessfulRunEndCreditTriggers,
  applySuccessfulRunExtraRunFollowup,
} from "./successful-run-followups";
export type {
  SuccessfulRunFollowupExecutionResult,
  SuccessfulRunInterventionExecutionResult,
  SuccessfulRunInterventionHost,
} from "./successful-run-contracts";
