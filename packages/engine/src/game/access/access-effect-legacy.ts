import type {
  CardDefinition,
  CardInstanceId,
  ResolvedGameEffect,
} from "@netgrid/shared";
import { cardHasImplementationAccessEffects } from "./access-effect-execution";
import {
  requireLegalAction,
  type AccessEffectHandlerHost,
} from "./access-effect-context";

export function resolveAccessAmbushAssetEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const ids = host.definitions;
  if (cardHasImplementationAccessEffects(host, definition)) return;
  if (definition.id !== ids.setup && definition.id !== ids.trap) return;
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    host.state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.17-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  const accessServerId = String(legalAction.payload?.serverId ?? "");
  const accessedFromArchives =
    accessServerId === "archives" ||
    host.cards.mustInstance(cardId).zone.zone === "archives";
  if (accessedFromArchives) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_access_ambush",
      ambushDefinitionId: definition.id,
      ambushSkippedReason: "archives",
    };
    return;
  }
  if (definition.id === ids.trap)
    throw new Error("TRAP!-Access braucht die CardImplementation-Sequenz.");
  const damageAmount = definition.id === ids.setup ? 2 : 3;
  const summary = host.damage.doDamage(
    `v1917.ambush.${host.state.run!.runId}.${cardId}.${host.state.stateVersion + 1}`,
    "net",
    damageAmount,
    definition.id,
  );
  host.damage.setDamagePayload(summary);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_access_ambush",
    ambushDefinitionId: definition.id,
    damageAmount,
    ...(accessServerId === "rd"
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
  };
}

export function resolveUpgradeAccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const ids = host.definitions;
  if (cardHasImplementationAccessEffects(host, definition)) return;
  if (
    definition.id !== ids.crybaby &&
    definition.id !== ids.taggedRunnerMeatDamageUpgrade &&
    definition.id !== ids.accessNetDamageUpgrade &&
    definition.id !== ids.oncePerRunAccessTraceUpgrade
  )
    return;
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    host.state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.18-Upgrade-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  if (!host.cards.mustInstance(cardId).rezzed) return;
  if (cardHasImplementationAccessEffects(host, definition)) return;

  if (definition.id === ids.crybaby) {
    host.counters.addCardCounter(host.state.runner.identity, "crying", 1);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_crybaby_access_counter",
      ambushDefinitionId: definition.id,
      counterType: "crying",
      addedCounterAmount: 1,
      remainingCounters: host.counters.cardCounter(
        host.state.runner.identity,
        "crying",
      ),
    };
    return;
  }

  if (definition.id === ids.oncePerRunAccessTraceUpgrade) {
    const run = host.state.run!;
    const serverId = run.attackedServerId;
    const consumed = run.turbeauAccessTraceConsumedByServer?.[serverId] ?? [];
    if (consumed.includes(cardId)) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1918_upgrade_access_trace",
        ambushDefinitionId: definition.id,
        oncePerRunConsumed: true,
        serverId,
      };
      return;
    }
    run.turbeauAccessTraceConsumedByServer = {
      ...(run.turbeauAccessTraceConsumedByServer ?? {}),
      [serverId]: [...consumed, cardId],
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), cardId };
    host.trace.startTraceFromOperation(definition.id, 4);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_upgrade_access_trace",
      ambushDefinitionId: definition.id,
      oncePerRunConsumed: true,
      baseTraceStrength: 4,
      serverId,
    };
    return;
  }

  const damageType =
    definition.id === ids.taggedRunnerMeatDamageUpgrade ? "meat" : "net";
  const damageAmount =
    definition.id === ids.taggedRunnerMeatDamageUpgrade ? 3 : 1;
  const runnerTagsBefore = host.state.runner.tags;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ambushDefinitionId: definition.id,
    damageType,
    damageAmount,
    ...(definition.id === ids.taggedRunnerMeatDamageUpgrade
      ? { runnerTagsBefore, tagConditionMet: runnerTagsBefore >= 1 }
      : {}),
  };
  if (
    definition.id === ids.taggedRunnerMeatDamageUpgrade &&
    runnerTagsBefore < 1
  ) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      damageSkippedReason: "runner_not_tagged",
    };
    return;
  }
  host.damage.resolveDamageOperation(damageType, damageAmount, definition.id);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_upgrade_access_ambush",
    ambushDefinitionId: definition.id,
    damageType,
    damageAmount,
  };
}

export function resolveAssetAccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const ids = host.definitions;
  if (cardHasImplementationAccessEffects(host, definition)) return;
  if (
    definition.id !== ids.hardwareTrashByAdvancementAsset &&
    definition.id !== ids.programTrashByAdvancementAsset &&
    definition.id !== ids.advancementCoreDamageAsset &&
    definition.id !== ids.advancementNetDamageAsset
  ) {
    return;
  }
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    host.state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.19-Asset-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  const accessServerId = String(legalAction.payload?.serverId ?? "");
  const accessedFromArchives =
    accessServerId === "archives" ||
    host.cards.mustInstance(cardId).zone.zone === "archives";
  if (accessedFromArchives && definition.id === ids.advancementNetDamageAsset) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: definition.id,
      ambushSkippedReason: "archives",
    };
    return;
  }

  if (
    definition.id === ids.hardwareTrashByAdvancementAsset ||
    definition.id === ids.programTrashByAdvancementAsset
  ) {
    resolveInstalledTrashAssetAccessEffect(host, cardId, definition);
    return;
  }

  const advancementCounterCount = Math.max(
    0,
    Math.floor(host.cards.mustInstance(cardId).advancementCounters),
  );
  const damageAmount =
    definition.id === ids.advancementNetDamageAsset
      ? advancementCounterCount > 0
        ? advancementCounterCount * 2
        : 1
      : advancementCounterCount;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1919_access_ambush_damage",
    ambushDefinitionId: definition.id,
    advancementCounterCount,
    damageAmount,
    ...(accessServerId === "rd"
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
  };
  if (damageAmount <= 0) return;
  const summary = host.damage.doDamage(
    `v1919.asset_access.${host.state.run!.runId}.${cardId}.${host.state.stateVersion + 1}`,
    definition.id === ids.advancementCoreDamageAsset ? "core" : "net",
    damageAmount,
    definition.id,
  );
  host.damage.setDamagePayload(summary);
}

export function resolveInstalledTrashAssetAccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
): void {
  const legalAction = requireLegalAction(host);
  const ids = host.definitions;
  const candidates =
    definition.id === ids.hardwareTrashByAdvancementAsset
      ? host.state.runner.rig.hardware
      : host.state.runner.rig.programs;
  const targetCardIds = candidates.slice().sort((left, right) => {
    const leftDefinition = host.cards.definitionFor(left);
    const rightDefinition = host.cards.definitionFor(right);
    const byInstallCost =
      (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
    return byInstallCost !== 0 ? byInstallCost : left.localeCompare(right);
  });
  const trashLimit = Math.max(
    0,
    host.cards.mustInstance(cardId).advancementCounters,
  );
  const selectedTargetIds = targetCardIds.slice(0, trashLimit);
  if (selectedTargetIds.length > 0) {
    const targetDefinitionIds = selectedTargetIds.map(
      (targetId) => host.cards.definitionFor(targetId).id,
    );
    for (const targetId of selectedTargetIds) {
      host.trash.trashRunnerInstalledCardToHeap(targetId);
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      trashedCount: selectedTargetIds.length,
      trashedCardDefinitionId: targetDefinitionIds[0] ?? "",
      trashedCardDefinitionIds: targetDefinitionIds.join(","),
    };
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1919_access_ambush_trash_installed",
    ambushDefinitionId: definition.id,
    advancementCounterCount: trashLimit,
    trashedCardType:
      definition.id === ids.hardwareTrashByAdvancementAsset
        ? "hardware"
        : "program",
    trashedCount: selectedTargetIds.length,
  };
  if (selectedTargetIds.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1919_access_ambush_no_target",
      ambushDefinitionId: definition.id,
    };
  }
}

export function resolveV199AccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  if (
    host.cards.hiddenReplacementLongtailKindForDefinition(definition.id) ===
      "delayed_agenda_access_replacement" &&
    host.state.run
  ) {
    const run = host.state.run;
    const serverId = run.breach?.serverId ?? run.attackedServerId;
    const existing = run.runDurationEffects ?? [];
    if (
      !existing.some(
        (effect) =>
          effect.kind === "delayed_agenda_access_replacement" &&
          effect.sourceCardInstanceId === cardId,
      )
    ) {
      run.runDurationEffects = [
        ...existing,
        {
          kind: "delayed_agenda_access_replacement",
          sourceCardInstanceId: cardId,
          sourceDefinitionId: definition.id,
          serverId,
          replacementWindow: "agenda_access",
          delayUntil: "runner_next_turn_start",
        },
      ];
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      delayedAgendaAccessReplacementActive: true,
    };
  }
  if (
    definition.id === host.definitions.chimera &&
    !cardHasImplementationAccessEffects(host, definition)
  ) {
    startChimeraDaemonTrashChoice(host, cardId);
  }
}

export function startChimeraDaemonTrashChoice(
  host: AccessEffectHandlerHost,
  chimeraId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const options = host.state.runner.rig.programs
    .filter((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return (
        definition.type === "program" &&
        host.cards.cardHasSubtype(definition, "daemon")
      );
    })
    .sort((left, right) => {
      const leftDefinition = host.cards.definitionFor(left);
      const rightDefinition = host.cards.definitionFor(right);
      const costCompare =
        (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      if (costCompare !== 0) return costCompare;
      const memoryCompare =
        (rightDefinition.memoryCost ?? 0) - (leftDefinition.memoryCost ?? 0);
      if (memoryCompare !== 0) return memoryCompare;
      return left.localeCompare(right);
    })
    .map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: "Daemon",
        value: cardId,
      };
    });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    chimeraAccessed: true,
    chimeraDaemonCandidateCount: options.length,
  };
  if (options.length === 0) return;
  host.state.pendingChoice = {
    choiceId: `v199_chimera_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v199.chimera_daemon_trash:${chimeraId}:${host.state.stateVersion + 1}`,
    prompt: "Daemon für Chimera trashen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
}
