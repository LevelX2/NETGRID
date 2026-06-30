import type { CardImplementationDefinition } from "../../../types";
import {
  endTheRunSubroutine,
  netDamageSubroutine,
  noisyIcebreakerSelfRezReduction,
} from "../../../helpers";

export const classicBaskervilleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_005_baskerville",
  selfRezCostModifiers: noisyIcebreakerSelfRezReduction(5),
  printedSubroutines: [
    netDamageSubroutine(2),
    {
      kind: "trace",
      baseTraceStrength: 5,
      text: "*Trace 5-If trace is successful, give Runner a Baskerville counter.",
      onSuccess: [
        {
          kind: "add_counter",
          recipient: "runner",
          counterType: "baskerville",
          amount: 1,
          visibility: "public",
        },
      ],
    },
    endTheRunSubroutine(),
  ],
  runnerCounterEffects: [
    {
      counterType: "baskerville",
      removeCost: 3,
      runStart: {
        kind: "damage",
        damageType: "net",
        amountPerCounter: 2,
        preventable: true,
        visibility: "public",
      },
    },
  ],
};
