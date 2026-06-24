import type { DamageType } from "@netgrid/shared";
import {
  ABLATIVE_COUNTER_HARDWARE_SOURCE,
  CORE_DAMAGE_PREVENTION_HARDWARE_SOURCE,
  CORE_REPLACEMENT_DAMAGE_PREVENTION_SOURCE,
  DUAL_DAMAGE_BUFFER_PROGRAM_SOURCE,
  MEAT_ARMOR_HARDWARE_SOURCE,
  MEAT_DAMAGE_PREVENTION_RESOURCE_SOURCE,
  NET_DAMAGE_PREVENTION_PROGRAM_SOURCE,
  NET_MEAT_DAMAGE_PREVENTION_HARDWARE_SOURCE,
  NET_MEAT_UTILITY_HARDWARE_SOURCE,
  NET_SURGE_BUFFER_HARDWARE_SOURCE,
  RUNNER_DAMAGE_PREVENTION_RESOURCE_SOURCE,
  SELF_REPAIR_DAMAGE_PREVENTION_PROGRAM_SOURCE,
  SINGLE_DAMAGE_PREVENTION_PROGRAM_SOURCE,
  TWO_DAMAGE_PREVENTION_PROGRAM_SOURCE,
} from "../compatibility/runtime-compatibility";

export type RuntimeDamagePreventionProfile = {
  maxPerTurn: number;
  damageTypes: DamageType[];
  priority: number;
};

export {
  ABLATIVE_COUNTER_HARDWARE_SOURCE,
  CORE_REPLACEMENT_DAMAGE_PREVENTION_SOURCE,
  RUNNER_DAMAGE_PREVENTION_RESOURCE_SOURCE,
  SELF_REPAIR_DAMAGE_PREVENTION_PROGRAM_SOURCE,
};

export const ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS = 7;

export const RUNTIME_DAMAGE_PREVENTION_PROFILES: Readonly<
  Record<string, RuntimeDamagePreventionProfile>
> = {
  [DUAL_DAMAGE_BUFFER_PROGRAM_SOURCE]: {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 90,
  },
  [TWO_DAMAGE_PREVENTION_PROGRAM_SOURCE]: {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 100,
  },
  [SINGLE_DAMAGE_PREVENTION_PROGRAM_SOURCE]: {
    maxPerTurn: 1,
    damageTypes: ["net", "core"],
    priority: 120,
  },
  [ABLATIVE_COUNTER_HARDWARE_SOURCE]: {
    maxPerTurn: ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
    damageTypes: ["meat"],
    priority: 120,
  },
  [MEAT_ARMOR_HARDWARE_SOURCE]: {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 110,
  },
  [NET_SURGE_BUFFER_HARDWARE_SOURCE]: {
    maxPerTurn: 2,
    damageTypes: ["net"],
    priority: 121,
  },
  [SELF_REPAIR_DAMAGE_PREVENTION_PROGRAM_SOURCE]: {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 118,
  },
  [CORE_DAMAGE_PREVENTION_HARDWARE_SOURCE]: {
    maxPerTurn: 1,
    damageTypes: ["core"],
    priority: 121,
  },
  [NET_MEAT_DAMAGE_PREVENTION_HARDWARE_SOURCE]: {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 122,
  },
  [NET_MEAT_UTILITY_HARDWARE_SOURCE]: {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 124,
  },
  [MEAT_DAMAGE_PREVENTION_RESOURCE_SOURCE]: {
    maxPerTurn: 2,
    damageTypes: ["meat"],
    priority: 128,
  },
  [NET_DAMAGE_PREVENTION_PROGRAM_SOURCE]: {
    maxPerTurn: 2,
    damageTypes: ["net"],
    priority: 131,
  },
};
