import type { DamageType } from "@netgrid/shared";

export type RuntimeDamagePreventionProfile = {
  maxPerTurn: number;
  damageTypes: DamageType[];
  priority: number;
};

export const DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_CARD_ID =
  "onr_v1_160_diplomatic-immunity";

export const ABLATIVE_COUNTER_HARDWARE_CARD_ID = "onr_v1_121_armored-fridge";

export const ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS = 7;

export const FULL_BODY_CONVERSION_DAMAGE_PREVENTION_CARD_ID =
  "onr_v1_127_full-body-conversion";

export const EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID =
  "onr_v1_022_emergency-self-construct";

export const RUNTIME_DAMAGE_PREVENTION_PROFILES: Readonly<
  Record<string, RuntimeDamagePreventionProfile>
> = {
  "onr_v1_023_evil-twin": {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 90,
  },
  "onr_v1_028_force-shield": {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 100,
  },
  "onr_v1_038_joan-of-arc": {
    maxPerTurn: 1,
    damageTypes: ["net", "core"],
    priority: 120,
  },
  [ABLATIVE_COUNTER_HARDWARE_CARD_ID]: {
    maxPerTurn: ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
    damageTypes: ["meat"],
    priority: 120,
  },
  "onr_v1_125_dermatech-bodyplating": {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 110,
  },
  "onr_v1_128_green-knight-surge-buffers": {
    maxPerTurn: 2,
    damageTypes: ["net"],
    priority: 121,
  },
  [EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID]: {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 118,
  },
  "onr_v1_130_lifesaver-nanosurgeons": {
    maxPerTurn: 1,
    damageTypes: ["core"],
    priority: 121,
  },
  "onr_v1_135_nasuko-cycle": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 122,
  },
  "onr_v1_143_techtronica-utility-suit": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 124,
  },
  "onr_v1_161_fall-guy": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 126,
  },
  "onr_v1_170_nomad-allies": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 127,
  },
  "onr_v1_185_trauma-team": {
    maxPerTurn: 2,
    damageTypes: ["meat"],
    priority: 128,
  },
  "onr_v1_186_umbrella-policy": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat", "core"],
    priority: 129,
  },
  "onr_v1_187_wilson-weeflerunner-apprentice": {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 130,
  },
  "onr_v1_061_shield": {
    maxPerTurn: 2,
    damageTypes: ["net"],
    priority: 131,
  },
};
