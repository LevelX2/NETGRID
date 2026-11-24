import { CARD_VIRUS_COUNTER_TYPES, type CardDefinition, type CardDefinitionId, type CardInstanceId, type GameState, type Side } from "@netgrid/shared";
import { rezCostForCard } from "../payment";
import { corpInstalledCardIds, definitionFor, mustInstance, mustServer, runnerInstalledCardIds } from "../state/card-server-lookup";
import { cardCounter } from "../state/turn-flags-counters";
import { hostedCardsOn } from "../state/zone-mutation";
import { corpUtilityImplementationForDefinition } from "../play/corp-operation-resolution";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type { CardCorpUtilityImplementation, CardVirusCounterImplementation } from "../../ability-engine/definition-types";
import type { RuntimeDeps } from "./runtime-shared";

export function createLookupRuntimeServices(
  deps: RuntimeDeps,
): import("./lookup-runtime-port").LookupRuntimePort {
  function normalizeSubtypeLabel(subtype: string): string {
    return subtype
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function cardHasSubtype(
    definition: CardDefinition,
    subtype: string,
  ): boolean {
    const target = normalizeSubtypeLabel(subtype);
    return definition.subtypes.some(
      (candidate) => normalizeSubtypeLabel(candidate) === target,
    );
  }

  function stableSubtypeList(subtypes: readonly string[]): string[] {
    return [
      ...new Set(subtypes.map((subtype) => normalizeSubtypeLabel(subtype))),
    ].sort();
  }

  function effectiveSubtypesForCard(
    state: GameState,
    cardId: CardInstanceId,
    definition = definitionFor(state, cardId),
  ): string[] {
    const instance = state.cardInstances[cardId];
    const selectedSubtypes = instance?.variableIceState?.selectedSubtypes;
    if (
      definition.type === "ice" &&
      instance?.rezzed &&
      selectedSubtypes &&
      selectedSubtypes.length > 0
    )
      return stableSubtypeList(selectedSubtypes);
    return stableSubtypeList(definition.subtypes);
  }

  function rezzedIceOutsideThisIceCount(
    state: GameState,
    iceId: CardInstanceId,
  ): number {
    const instance = state.cardInstances[iceId];
    if (
      !instance ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce"
    )
      return 0;
    const server = mustServer(state, instance.zone.serverId);
    const iceIndex = server.ice.indexOf(iceId);
    if (iceIndex < 0) return 0;
    return server.ice
      .slice(iceIndex + 1)
      .filter(
        (candidateId) => state.cardInstances[candidateId]?.rezzed === true,
      ).length;
  }

  function relativeIceStrengthBonusFor(
    state: GameState,
    iceId: CardInstanceId,
  ): number {
    const relativeIce = cardImplementationForDefinitionId(
      definitionFor(state, iceId).id,
    )?.relativeIce;
    const bonusPerCount = relativeIce?.strengthBonusPerCount;
    if (!bonusPerCount) return 0;
    return rezzedIceOutsideThisIceCount(state, iceId) * bonusPerCount;
  }

  function isRegionUpgrade(definition: CardDefinition): boolean {
    return (
      definition.type === "upgrade" && cardHasSubtype(definition, "region")
    );
  }

  function isUniqueCard(definition: CardDefinition): boolean {
    return (
      cardHasSubtype(definition, "unique") ||
      cardImplementationForDefinitionId(definition.id)?.unique?.kind ===
        "unique_by_title"
    );
  }

  function rezzedBlackIceIds(state: GameState): CardInstanceId[] {
    return corpInstalledCardIds(state).filter((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return (
        instance.zone.zone === "serverIce" &&
        instance.rezzed &&
        cardHasSubtype(definitionFor(state, cardId), "black_ice")
      );
    });
  }

  function rezzedInstalledIceIds(state: GameState): CardInstanceId[] {
    return corpInstalledCardIds(state).filter((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return instance.zone.zone === "serverIce" && instance.rezzed;
    });
  }

  function affordableRezzedInstalledIceIdsForRunner(
    state: GameState,
  ): CardInstanceId[] {
    return rezzedInstalledIceIds(state).filter(
      (cardId) => state.runner.credits >= rezCostForCard(state, cardId),
    );
  }

  function unrezzedInstalledIceIds(state: GameState): CardInstanceId[] {
    return corpInstalledCardIds(state).filter((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return instance.zone.zone === "serverIce" && !instance.rezzed;
    });
  }

  function hasInstalledUniqueCardDefinition(
    state: GameState,
    side: Side,
    definitionId: CardDefinitionId,
  ): boolean {
    const installed =
      side === "runner"
        ? runnerInstalledCardIds(state)
        : corpInstalledCardIds(state);
    return installed.some(
      (cardId) => definitionFor(state, cardId).id === definitionId,
    );
  }

  function daemonHostingCapacity(definition: CardDefinition): number {
    return Math.max(
      0,
      Math.floor(
        cardImplementationForDefinitionId(definition.id)?.hostedProgramCapacity
          ?.capacityMu ?? 0,
      ),
    );
  }

  function daemonHostedMemoryUsed(
    state: GameState,
    hostId: CardInstanceId,
  ): number {
    return hostedCardsOn(state, hostId).reduce((sum, cardId) => {
      const definition = definitionFor(state, cardId);
      if (definition.type !== "program") return sum;
      return sum + (definition.memoryCost ?? 0);
    }, 0);
  }

  function canHostProgramOnDaemon(
    state: GameState,
    hostId: CardInstanceId,
    programDefinition: CardDefinition,
    programsToTrash: readonly CardInstanceId[] = [],
  ): boolean {
    if (programDefinition.type !== "program") return false;
    if (
      new Set(programsToTrash).size !== programsToTrash.length ||
      programsToTrash.some(
        (cardId) =>
          !state.runner.rig.programs.includes(cardId) ||
          state.cardInstances[cardId]?.hostedOn !== hostId ||
          definitionFor(state, cardId).type !== "program",
      )
    )
      return false;
    if (cardHasSubtype(programDefinition, "daemon")) return false;
    const hostInstance = mustInstance(state.cardInstances, hostId);
    if (hostInstance.hostedOn) return false;
    const hostDefinition = definitionFor(state, hostId);
    if (hostDefinition.type !== "program" && hostDefinition.type !== "hardware")
      return false;
    const implementation = cardImplementationForDefinitionId(hostDefinition.id);
    if (
      implementation?.hostedProgramCapacity?.hostedProgramsAreInstalled !==
        true ||
      !implementation.hostedProgramCapacity.allowedCardTypes.includes("program")
    )
      return false;
    const allowedProgramSubtypes =
      implementation.hostedProgramCapacity.allowedProgramSubtypes;
    if (
      allowedProgramSubtypes?.length &&
      !allowedProgramSubtypes.some((subtype) =>
        cardHasSubtype(programDefinition, subtype),
      )
    )
      return false;
    const maxHostedPrograms =
      implementation.hostedProgramCapacity.maxHostedPrograms;
    if (
      typeof maxHostedPrograms === "number" &&
      hostedCardsOn(state, hostId).length - programsToTrash.length >=
        maxHostedPrograms
    )
      return false;
    const capacity = daemonHostingCapacity(hostDefinition);
    if (capacity <= 0) return false;
    return (
      daemonHostedMemoryUsed(state, hostId) +
        (programDefinition.memoryCost ?? 0) -
        programsToTrash.reduce(
          (sum, cardId) => sum + (definitionFor(state, cardId).memoryCost ?? 0),
          0,
        ) <=
      capacity
    );
  }

  function hostedProgramStrengthModifier(
    state: GameState,
    cardId: CardInstanceId,
  ): number {
    const instance = state.cardInstances[cardId];
    if (!instance?.hostedOn) return 0;
    const definition = definitionFor(state, cardId);
    if (
      definition.type !== "program" ||
      !cardHasSubtype(definition, "icebreaker")
    )
      return 0;
    const hostDefinition = definitionFor(state, instance.hostedOn);
    const modifiers =
      cardImplementationForDefinitionId(hostDefinition.id)
        ?.hostedProgramModifiers ?? [];
    return modifiers.reduce((sum, modifier) => {
      if (
        modifier.appliesTo !== "hosted_icebreakers" ||
        modifier.kind !== "icebreaker_strength"
      )
        return sum;
      const amount = Math.max(0, Math.floor(modifier.amount));
      return sum + (modifier.operation === "reduce" ? -amount : amount);
    }, 0);
  }

  function icebreakerEncounterStrengthBonus(
    state: GameState,
    breakerId: CardInstanceId,
    encounteredIceId: CardInstanceId,
  ): number {
    const instance = state.cardInstances[breakerId];
    if (!instance || instance.selectedCardId !== encounteredIceId) return 0;
    const bonus = cardImplementationForDefinitionId(
      definitionFor(state, breakerId).id,
    )?.icebreakerEncounterStrengthBonus;
    if (bonus?.kind !== "against_selected_installed_ice") return 0;
    return Math.max(0, Math.floor(bonus.amount));
  }

  function rezzedCorpRootCardIds(state: GameState): CardInstanceId[] {
    const ids: CardInstanceId[] = [];
    for (const server of state.corp.servers) {
      for (const cardId of server.root) {
        if (mustInstance(state.cardInstances, cardId).rezzed) ids.push(cardId);
      }
    }
    return ids;
  }

  function visibleVirusCounterTargetIds(state: GameState): CardInstanceId[] {
    const targets = new Set<CardInstanceId>();
    for (const cardId of runnerInstalledCardIds(state)) {
      if (
        CARD_VIRUS_COUNTER_TYPES.some(
          (counterType) => cardCounter(state, cardId, counterType) > 0,
        )
      )
        targets.add(cardId);
    }
    for (const cardId of corpInstalledCardIds(state)) {
      const instance = state.cardInstances[cardId];
      if (!instance?.rezzed) continue;
      if (
        CARD_VIRUS_COUNTER_TYPES.some(
          (counterType) => cardCounter(state, cardId, counterType) > 0,
        )
      )
        targets.add(cardId);
    }
    return [...targets];
  }

  function hasInstalledRunnerApDamageReducerHardware(
    state: GameState,
  ): boolean {
    return state.runner.rig.hardware.some(
      (cardId) =>
        cardImplementationForDefinitionId(definitionFor(state, cardId).id)
          ?.runnerUtilityLongtail?.kind === "access_point_subroutine_modifier",
    );
  }

  function runnerHasInstalledCardDefinition(
    state: GameState,
    side: Side,
    definitionId: CardDefinitionId,
  ): boolean {
    const installed =
      side === "runner"
        ? runnerInstalledCardIds(state)
        : corpInstalledCardIds(state);
    return installed.some(
      (cardId) => definitionFor(state, cardId).id === definitionId,
    );
  }

  function runnerInstalledCardCountByDefinition(
    state: GameState,
    definitionId: CardDefinitionId,
  ): number {
    return runnerInstalledCardIds(state).reduce(
      (count, cardId) =>
        definitionFor(state, cardId).id === definitionId ? count + 1 : count,
      0,
    );
  }

  function installedVirusCounterTotalForDefinition(
    state: GameState,
    definitionId: CardDefinitionId,
  ): number {
    return runnerInstalledCardIds(state).reduce((sum, cardId) => {
      if (definitionFor(state, cardId).id !== definitionId) return sum;
      return sum + cardCounter(state, cardId, "virus");
    }, 0);
  }

  function virusCounterImplementationForDefinition(
    definitionId: CardDefinitionId,
  ): CardVirusCounterImplementation | undefined {
    return cardImplementationForDefinitionId(definitionId)?.virusCounter;
  }

  function virusCounterImplementationForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardVirusCounterImplementation | undefined {
    return virusCounterImplementationForDefinition(
      definitionFor(state, cardId).id,
    );
  }

  function corpUtilityImplementationForCard(
    state: GameState,
    cardId: CardInstanceId,
  ): CardCorpUtilityImplementation | undefined {
    return corpUtilityImplementationForDefinition(
      definitionFor(state, cardId).id,
    );
  }

  function hasCorpUtilityKind(
    state: GameState,
    cardId: CardInstanceId,
    kind: CardCorpUtilityImplementation["kind"],
  ): boolean {
    return corpUtilityImplementationForCard(state, cardId)?.kind === kind;
  }

  function cardInstallCapabilitiesForDefinition(
    definitionId: CardDefinitionId,
  ) {
    return (
      cardImplementationForDefinitionId(definitionId)?.installCapabilities ?? []
    );
  }

  function hasInstallCapabilityKindForDefinition(
    definitionId: CardDefinitionId,
    kind: NonNullable<
      ReturnType<typeof cardInstallCapabilitiesForDefinition>
    >[number]["kind"],
  ): boolean {
    return cardInstallCapabilitiesForDefinition(definitionId).some(
      (capability) => capability.kind === kind,
    );
  }

  function rootInstallRezzesOnInstall(definition: CardDefinition): boolean {
    return (
      isRegionUpgrade(definition) ||
      hasInstallCapabilityKindForDefinition(definition.id, "rez_on_install")
    );
  }

  function mustInstallInsideSubsidiaryDataFort(
    definition: CardDefinition,
  ): boolean {
    return hasInstallCapabilityKindForDefinition(
      definition.id,
      "install_only_inside_subsidiary_data_fort",
    );
  }

  function fortCapacityModifiersForCard(
    state: GameState,
    cardId: CardInstanceId,
  ) {
    return (
      cardImplementationForDefinitionId(definitionFor(state, cardId).id)
        ?.fortCapacityModifiers ?? []
    );
  }

  function leavePlayCleanupImplementationsForCard(
    state: GameState,
    cardId: CardInstanceId,
  ) {
    return (
      cardImplementationForDefinitionId(definitionFor(state, cardId).id)
        ?.leavePlayCleanup ?? []
    );
  }

  return {
    normalizeSubtypeLabel,
    cardHasSubtype,
    stableSubtypeList,
    effectiveSubtypesForCard,
    rezzedIceOutsideThisIceCount,
    relativeIceStrengthBonusFor,
    isRegionUpgrade,
    isUniqueCard,
    rezzedBlackIceIds,
    rezzedInstalledIceIds,
    affordableRezzedInstalledIceIdsForRunner,
    unrezzedInstalledIceIds,
    hasInstalledUniqueCardDefinition,
    daemonHostingCapacity,
    daemonHostedMemoryUsed,
    canHostProgramOnDaemon,
    hostedProgramStrengthModifier,
    icebreakerEncounterStrengthBonus,
    rezzedCorpRootCardIds,
    visibleVirusCounterTargetIds,
    hasInstalledRunnerApDamageReducerHardware,
    runnerHasInstalledCardDefinition,
    runnerInstalledCardCountByDefinition,
    installedVirusCounterTotalForDefinition,
    virusCounterImplementationForDefinition,
    virusCounterImplementationForCard,
    corpUtilityImplementationForCard,
    hasCorpUtilityKind,
    cardInstallCapabilitiesForDefinition,
    hasInstallCapabilityKindForDefinition,
    rootInstallRezzesOnInstall,
    mustInstallInsideSubsidiaryDataFort,
    fortCapacityModifiersForCard,
    leavePlayCleanupImplementationsForCard,
  };
}
