/** Declarative typed port implemented by lookup-runtime-services. */
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  GameState,
  Side,
} from "@netgrid/shared";
import type {
  CardCorpUtilityImplementation,
  CardFortCapacityModifierImplementation,
  CardInstallCapabilityImplementation,
  CardLeavePlayCleanupImplementation,
  CardVirusCounterImplementation,
} from "../../ability-engine/definition-types";

export type LookupRuntimePort = {
  normalizeSubtypeLabel: (subtype: string) => string;
  cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
  stableSubtypeList: (subtypes: readonly string[]) => string[];
  effectiveSubtypesForCard: (
    state: GameState,
    cardId: CardInstanceId,
    definition?: CardDefinition,
  ) => string[];
  rezzedIceOutsideThisIceCount: (
    state: GameState,
    iceId: CardInstanceId,
  ) => number;
  relativeIceStrengthBonusFor: (
    state: GameState,
    iceId: CardInstanceId,
  ) => number;
  isRegionUpgrade: (definition: CardDefinition) => boolean;
  isUniqueCard: (definition: CardDefinition) => boolean;
  rezzedBlackIceIds: (state: GameState) => CardInstanceId[];
  rezzedInstalledIceIds: (state: GameState) => CardInstanceId[];
  affordableRezzedInstalledIceIdsForRunner: (
    state: GameState,
  ) => CardInstanceId[];
  unrezzedInstalledIceIds: (state: GameState) => CardInstanceId[];
  hasInstalledUniqueCardDefinition: (
    state: GameState,
    side: Side,
    definitionId: CardDefinitionId,
  ) => boolean;
  daemonHostingCapacity: (definition: CardDefinition) => number;
  daemonHostedMemoryUsed: (state: GameState, hostId: CardInstanceId) => number;
  canHostProgramOnDaemon: (
    state: GameState,
    hostId: CardInstanceId,
    programDefinition: CardDefinition,
  ) => boolean;
  hostedProgramStrengthModifier: (
    state: GameState,
    cardId: CardInstanceId,
  ) => number;
  icebreakerEncounterStrengthBonus: (
    state: GameState,
    breakerId: CardInstanceId,
    encounteredIceId: CardInstanceId,
  ) => number;
  rezzedCorpRootCardIds: (state: GameState) => CardInstanceId[];
  visibleVirusCounterTargetIds: (state: GameState) => CardInstanceId[];
  hasInstalledRunnerApDamageReducerHardware: (state: GameState) => boolean;
  runnerHasInstalledCardDefinition: (
    state: GameState,
    side: Side,
    definitionId: CardDefinitionId,
  ) => boolean;
  runnerInstalledCardCountByDefinition: (
    state: GameState,
    definitionId: CardDefinitionId,
  ) => number;
  installedVirusCounterTotalForDefinition: (
    state: GameState,
    definitionId: CardDefinitionId,
  ) => number;
  virusCounterImplementationForDefinition: (
    definitionId: CardDefinitionId,
  ) => CardVirusCounterImplementation | undefined;
  virusCounterImplementationForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardVirusCounterImplementation | undefined;
  corpUtilityImplementationForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardCorpUtilityImplementation | undefined;
  hasCorpUtilityKind: (
    state: GameState,
    cardId: CardInstanceId,
    kind: CardCorpUtilityImplementation["kind"],
  ) => boolean;
  cardInstallCapabilitiesForDefinition: (
    definitionId: CardDefinitionId,
  ) => readonly CardInstallCapabilityImplementation[];
  hasInstallCapabilityKindForDefinition: (
    definitionId: CardDefinitionId,
    kind: CardInstallCapabilityImplementation["kind"],
  ) => boolean;
  rootInstallRezzesOnInstall: (definition: CardDefinition) => boolean;
  mustInstallInsideSubsidiaryDataFort: (definition: CardDefinition) => boolean;
  fortCapacityModifiersForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => readonly CardFortCapacityModifierImplementation[];
  leavePlayCleanupImplementationsForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => readonly CardLeavePlayCleanupImplementation[];
};
