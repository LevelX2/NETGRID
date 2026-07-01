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
import { COUNTER_GAIN_PROGRAM_SOURCE } from "../../mechanics/agenda-operation-effects";
import {
  SUCCESSFUL_RUN_FORCE_REZ_PROGRAM_SOURCE,
  ICE_ORDER_REVERSAL_PROGRAM_SOURCE,
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
    mustServer: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => GameState["corp"]["servers"][number];
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
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
    selectedChoiceIds: (
      selectedChoices: PlayerAction["selectedChoices"],
    ) => string[];
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
    addCardCounter: (
      cardId: CardInstanceId,
      type: string,
      amount: number,
    ) => void;
  };
  runnerCards: {
    shuffleGripIntoStack: (purpose: string) => number;
    drawCards: (amount: number) => {
      drawnCount: number;
      drawTaxSourceCount: number;
      drawTaxCreditsPaid: number;
      drawTaxTagsAdded: number;
    };
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
    finishSuccessfulRun: (legalAction?: LegalAction) => void;
  };
};

function hqCorpLoseCreditsBeforeAccessEffect(
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

function remoteTrashFortBeforeAccessEffect(
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
      followup.effect.include === "root_and_ice" &&
      followup.source === "installed_hidden_runner_resource" &&
      followup.cost.kind === "reveal_and_trash_source",
  );
}

function successfulRunBeforeAccessEffectByEffectKind(
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
    return matches?.find((followup) => followup.abilityKey === abilityKey);
  }
  return matches?.[0];
}

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
  serverId?: Exclude<ServerId, "new_remote">;
  creditsGained?: number;
  counterPlaced?: boolean;
  stateChanged?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};

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
  const used = new Set(run.successfulRunAbilityUsedSourceIds ?? []);
  const actions: LegalAction[] = [];
  for (const sourceCardId of [
    ...host.state.runner.rig.programs,
    ...host.state.runner.rig.resources,
  ].sort()) {
    if (used.has(sourceCardId)) continue;
    const definition = host.cards.definitionFor(sourceCardId);
    const forceRezFollowup =
      hasSuccessfulRunForceRezFollowup(definition.id) ||
      (!cardImplementationForDefinitionId(definition.id) &&
        definition.id === SUCCESSFUL_RUN_FORCE_REZ_PROGRAM_SOURCE);
    if (forceRezFollowup) {
      const server = host.servers.mustServer(run.attackedServerId);
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
      run.attackedServerId === "rd"
    ) {
      actions.push(
        host.actions.createRunnerTriggerAction(
          `${definition.title}: Doom-Counter statt Zugriff`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            serverId: run.attackedServerId,
            proteusRunnerVirusFollowup: "doom_counter_instead_of_rd_access",
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
      run.attackedServerId === "hq" &&
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
              abilityKey: hqCreditLossFollowup.abilityKey,
            }),
            cardId: sourceCardId,
            serverId: run.attackedServerId,
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
      host.servers.mustServer(run.attackedServerId).kind === "remote" &&
      host.state.runner.rig.resources.includes(sourceCardId)
    ) {
      const server = host.servers.mustServer(run.attackedServerId);
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
                abilityKey: remoteTrashFortFollowup.abilityKey,
              }),
              cardId: sourceCardId,
              serverId: run.attackedServerId,
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
      ) ||
      (!cardImplementationForDefinitionId(definition.id) &&
        definition.id === ICE_ORDER_REVERSAL_PROGRAM_SOURCE)
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
              v1922RunnerProgramAbility: "successful_run_reverse_ice",
              iceCount: server.ice.length,
            },
          ),
        );
      }
    }
    if (
      definition.id === COUNTER_GAIN_PROGRAM_SOURCE &&
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
              v1919RunnerProgramAbility: "successful_run_remote_counter",
              counterType: "power",
              addCounterAmount: 1,
            },
          ),
        );
      }
    }
    if (
      runnerUtilityLongtailKindForDefinition(definition.id) ===
      "successful_run_fort_counter_expose"
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
    legalAction.payload?.v1919RunnerProgramAbility ===
    "successful_run_remote_counter"
  )
    return resolveSuccessfulRunRemoteCounter(host, legalAction);
  if (
    legalAction.payload?.runnerUtilityAbility ===
    "successful_run_fort_counter_expose"
  )
    return resolveSuccessfulRunFortCounterExpose(host, legalAction);
  if (
    legalAction.payload?.proteusRunnerVirusFollowup ===
    "doom_counter_instead_of_rd_access"
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

function revealAndTrashHiddenResourceSource(
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

function resolveHiddenSuccessfulRunBeforeAccessEffect(
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
    legalAction.payload?.serverId ?? run.attackedServerId,
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
    if (run.attackedServerId !== "hq")
      throw new Error(
        "Credit Subversion ist nur vor HQ-Access nach erfolgreichem Run legal.",
      );
  } else {
    if (serverId !== run.attackedServerId)
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
      abilityKey: followup.abilityKey,
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

function resolveHiddenSuccessfulRunTrashRemoteFortEffect(
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
  const targets = [...server.root, ...server.ice].sort();
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
      abilityKey: followup.abilityKey,
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

function resolveArmageddonDoomCounterInsteadOfAccess(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Armageddon nutzen.");
  const run = mustRun(host);
  if (
    !run.successful ||
    run.phase !== "access" ||
    run.attackedServerId !== "rd"
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
    proteusRunnerVirusFollowup: "doom_counter_instead_of_rd_access",
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
    trashTemporaryEncounterIce(host, delayed.temporaryIceId, legalAction);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        temporaryIceSourceTitle: host.cards.definitionFor(
          delayed.interventionSourceId,
        ).title,
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
  const responseTeamResult =
    applyCorpShuffleRunnerGripAfterSuccessfulRun(host, legalAction);
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
  if (!responseTeamResult.handled && gainedCredits <= 0) return { handled: false };
  return {
    handled: true,
    ...(gainedCredits > 0 ? { creditsGained: gainedCredits } : {}),
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function applyCorpShuffleRunnerGripAfterSuccessfulRun(
  host: SuccessfulRunInterventionHost,
  legalAction?: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  const run = host.state.run;
  if (!run) return { handled: false };
  const sourceIds = host.state.corp.servers
    .flatMap((server) => server.root)
    .filter((cardId): cardId is CardInstanceId => {
      const instance = host.state.cardInstances[cardId];
      if (
        !instance ||
        instance.controller !== "corp" ||
        instance.rezzed !== true ||
        instance.zone.side !== "corp" ||
        instance.zone.zone !== "serverRoot"
      )
        return false;
      return (
        cardImplementationForDefinitionId(instance.definitionId as CardDefinitionId)
          ?.successfulRunFollowups?.some(
            (followup) =>
              followup.kind ===
              "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count",
          ) === true
      );
    })
    .sort();
  if (sourceIds.length === 0 || host.state.runner.grip.length === 0)
    return { handled: false };

  let totalShuffled = 0;
  let totalDrawn = 0;
  const sourceDefinitionIds: CardDefinitionId[] = [];
  for (const sourceId of sourceIds) {
    const gripCount = host.state.runner.grip.length;
    if (gripCount <= 0) continue;
    const sourceDefinitionId = host.cards.definitionFor(sourceId).id;
    const shuffledCount = host.runnerCards.shuffleGripIntoStack(
      `classic.indiscriminate_response_team.${run.runId}.${sourceId}.${host.state.stateVersion}`,
    );
    if (shuffledCount <= 0) continue;
    const drawSummary = host.runnerCards.drawCards(shuffledCount);
    totalShuffled += shuffledCount;
    totalDrawn += drawSummary.drawnCount;
    sourceDefinitionIds.push(sourceDefinitionId);
  }
  if (totalShuffled <= 0) return { handled: false };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      classicIndiscriminateResponseTeam: true,
      runnerGripShuffledIntoStackCount: totalShuffled,
      runnerCardsDrawnAfterGripShuffle: totalDrawn,
      runnerGripAfter: host.state.runner.grip.length,
      runnerStackAfter: host.state.runner.stack.length,
      classicIndiscriminateResponseTeamSourceDefinitionIds: sourceDefinitionIds
        .sort()
        .join(","),
    };
  }
  return {
    handled: true,
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
  flags.successfulRunExtraRunUsedThisTurn = true;
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

function resolveSuccessfulRunForceRez(
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
  if (
    !hasSuccessfulRunForceRezFollowup(sourceDefinitionId) &&
    !(
      !cardImplementationForDefinitionId(sourceDefinitionId) &&
      sourceDefinitionId === SUCCESSFUL_RUN_FORCE_REZ_PROGRAM_SOURCE
    )
  )
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

function resolveSuccessfulRunReverseIce(
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
  if (
    !reverseFollowup &&
    sourceDefinition.id !== ICE_ORDER_REVERSAL_PROGRAM_SOURCE
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

function resolveSuccessfulRunRemoteCounter(
  host: SuccessfulRunInterventionHost,
  legalAction: LegalAction,
): SuccessfulRunFollowupExecutionResult {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Fait Accompli nutzen.");
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
      "Fait Accompli ist nur direkt nach erfolgreichem Run legal.",
    );
  const server = host.servers.mustServer(serverId);
  if (server.kind !== "remote")
    throw new Error("Fait Accompli markiert nur subsidiary data forts.");
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Fait Accompli ist nicht installiert.");
  if (
    host.cards.definitionFor(sourceCardId).id !==
    COUNTER_GAIN_PROGRAM_SOURCE
  )
    throw new Error("Die Fait-Accompli-Faehigkeit passt nicht zur Karte.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Fait Accompli wurde fuer diesen Run bereits genutzt.");
  host.counters.addCardCounter(sourceCardId, "power", 1);
  host.state.serverAgendaCostCountersByServer ??= {};
  host.state.serverAgendaCostCountersByServer[serverId] =
    Math.max(
      0,
      Math.floor(host.state.serverAgendaCostCountersByServer[serverId] ?? 0),
    ) + 1;
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: COUNTER_GAIN_PROGRAM_SOURCE,
    serverLabel: host.servers.publicServerLabel(server.id) ?? server.id,
    addedCounterAmount: 1,
    remainingCounters: host.counters.cardCounter(sourceCardId, "power"),
    serverAgendaCostCounters:
      host.state.serverAgendaCostCountersByServer[serverId] ?? 0,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: COUNTER_GAIN_PROGRAM_SOURCE,
    counterPlaced: true,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function resolveSuccessfulRunFortCounterExpose(
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
    cardImplementationForDefinitionId(
      definitionId,
    )?.successfulRunFollowups?.some(
      (followup) =>
        followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
    ) ?? false
  );
}

function successfulRunForceRezFollowupCreditCost(
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
  | SuccessfulRunInterventionExecutionResult
  | SuccessfulRunFollowupExecutionResult,
  "resolvedPayload"
> {
  return legalAction?.payload ? { resolvedPayload: legalAction.payload } : {};
}
