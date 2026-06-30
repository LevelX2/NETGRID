import type { CardImplementationDefinition } from "../../../types";
import {
  netDamageSubroutine,
  noisyIcebreakerSelfRezReduction,
} from "../../../helpers";

export const classicBolterSwarmImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_006_bolter-swarm",
  selfRezCostModifiers: noisyIcebreakerSelfRezReduction(5),
  printedSubroutines: [
    netDamageSubroutine(4),
    {
      kind: "prohibit_break_next_ice",
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run.",
    },
  ],
};
