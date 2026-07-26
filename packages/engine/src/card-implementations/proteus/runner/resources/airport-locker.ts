import type { CardImplementationDefinition } from "../../../types";
import { searchStackInstallEffect } from "../../../helpers";

const sharedCosts = [
  { kind: "credit", amount: 5 },
  { kind: "trash_source", amount: 1 },
] as const;

const sharedEffects = [
  searchStackInstallEffect({ installCost: "normal" }),
] as const;

export const proteusAirportLockerImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_128_airport-locker",
    abilities: [
      {
        kind: "activated",
        timing: "runner_main",
        costs: sharedCosts,
        label: "Airport Locker: Programm aus dem Stack installieren",
        effects: sharedEffects,
      },
      {
        kind: "activated",
        timing: "during_run",
        costs: sharedCosts,
        condition: { kind: "current_encounter_ice" },
        label: "Airport Locker: Programm aus dem Stack installieren",
        effects: sharedEffects,
      },
    ],
  };
