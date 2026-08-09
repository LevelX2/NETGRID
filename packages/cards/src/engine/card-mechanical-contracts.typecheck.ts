import { capabilityKey } from "../capability-identity";
import type { CardMechanicalSpec } from "./card-mechanical-contracts";

const addressability = ["action"] as const;

export const onPlayAbility: NonNullable<
  CardMechanicalSpec["abilities"]
>[number] = {
  kind: "on_play",
  costs: "printed",
  effects: [],
  capabilityKey: capabilityKey("play"),
  addressability,
};

export const activatedAbility: NonNullable<
  CardMechanicalSpec["abilities"]
>[number] = {
  kind: "activated",
  timing: "runner_main",
  costs: [{ kind: "action", amount: 1 }],
  effects: [],
  capabilityKey: capabilityKey("activate"),
  addressability,
};

export const breakAbility: NonNullable<
  CardMechanicalSpec["icebreakerAbilities"]
>[number] = {
  kind: "break_subroutine",
  cost: { kind: "credit", amount: 1 },
  matches: { kind: "any" },
  visibility: "public",
  capabilityKey: capabilityKey("break"),
  addressability,
};

export const pumpAbility: NonNullable<
  CardMechanicalSpec["icebreakerAbilities"]
>[number] = {
  kind: "increase_strength",
  cost: { kind: "credit", amount: 1 },
  amount: 1,
  duration: "current_encounter",
  visibility: "public",
  capabilityKey: capabilityKey("pump"),
  addressability,
};

export const invalidCrossVariant: NonNullable<
  CardMechanicalSpec["icebreakerAbilities"]
>[number] = {
  kind: "break_subroutine",
  cost: { kind: "credit", amount: 1 },
  matches: { kind: "any" },
  visibility: "public",
  capabilityKey: capabilityKey("invalid"),
  addressability,
  // @ts-expect-error pump-only field must not leak into the break variant
  duration: "current_encounter",
};
