import type { DamageType } from "@netgrid/shared";
import { armoredFridgeImplementation } from "../card-implementations/onr-v1/runner/hardware/armored-fridge";
import { dermatechBodyplatingImplementation } from "../card-implementations/onr-v1/runner/hardware/dermatech-bodyplating";
import { fullBodyConversionImplementation } from "../card-implementations/onr-v1/runner/hardware/full-body-conversion";
import { greenKnightSurgeBuffersImplementation } from "../card-implementations/onr-v1/runner/hardware/green-knight-surge-buffers";
import { lifesaverNanosurgeonsImplementation } from "../card-implementations/onr-v1/runner/hardware/lifesaver-nanosurgeons";
import { nasukoCycleImplementation } from "../card-implementations/onr-v1/runner/hardware/nasuko-cycle";
import { techtronicaUtilitySuitImplementation } from "../card-implementations/onr-v1/runner/hardware/techtronica-utility-suit";
import { evilTwinImplementation } from "../card-implementations/onr-v1/runner/programs/evil-twin";
import { emergencySelfConstructImplementation } from "../card-implementations/onr-v1/runner/programs/emergency-self-construct";
import { forceShieldImplementation } from "../card-implementations/onr-v1/runner/programs/force-shield";
import { joanOfArcImplementation } from "../card-implementations/onr-v1/runner/programs/joan-of-arc";
import { shieldImplementation } from "../card-implementations/onr-v1/runner/programs/shield";
import { diplomaticImmunityImplementation } from "../card-implementations/onr-v1/runner/resources/diplomatic-immunity";
import { traumaTeamImplementation } from "../card-implementations/onr-v1/runner/resources/trauma-team";

export type RuntimeDamagePreventionProfile = {
  maxPerTurn: number;
  damageTypes: DamageType[];
  priority: number;
};

export const DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_SOURCE =
  diplomaticImmunityImplementation.cardDefinitionId;

export const ABLATIVE_COUNTER_HARDWARE_SOURCE =
  armoredFridgeImplementation.cardDefinitionId;

export const ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS = 7;

export const FULL_BODY_CONVERSION_DAMAGE_PREVENTION_SOURCE =
  fullBodyConversionImplementation.cardDefinitionId;

export const EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID =
  emergencySelfConstructImplementation.cardDefinitionId;

export const RUNTIME_DAMAGE_PREVENTION_PROFILES: Readonly<
  Record<string, RuntimeDamagePreventionProfile>
> = {
  [evilTwinImplementation.cardDefinitionId]: {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 90,
  },
  [forceShieldImplementation.cardDefinitionId]: {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 100,
  },
  [joanOfArcImplementation.cardDefinitionId]: {
    maxPerTurn: 1,
    damageTypes: ["net", "core"],
    priority: 120,
  },
  [ABLATIVE_COUNTER_HARDWARE_SOURCE]: {
    maxPerTurn: ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
    damageTypes: ["meat"],
    priority: 120,
  },
  [dermatechBodyplatingImplementation.cardDefinitionId]: {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 110,
  },
  [greenKnightSurgeBuffersImplementation.cardDefinitionId]: {
    maxPerTurn: 2,
    damageTypes: ["net"],
    priority: 121,
  },
  [EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID]: {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 118,
  },
  [lifesaverNanosurgeonsImplementation.cardDefinitionId]: {
    maxPerTurn: 1,
    damageTypes: ["core"],
    priority: 121,
  },
  [nasukoCycleImplementation.cardDefinitionId]: {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 122,
  },
  [techtronicaUtilitySuitImplementation.cardDefinitionId]: {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 124,
  },
  [traumaTeamImplementation.cardDefinitionId]: {
    maxPerTurn: 2,
    damageTypes: ["meat"],
    priority: 128,
  },
  [shieldImplementation.cardDefinitionId]: {
    maxPerTurn: 2,
    damageTypes: ["net"],
    priority: 131,
  },
};
