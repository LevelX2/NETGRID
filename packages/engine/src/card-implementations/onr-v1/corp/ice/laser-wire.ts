import { endTheRunSubroutine, netDamageSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Laser Wire
// text: *Do 1 Net damage. *End the run.
export const laserWireImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_253_laser-wire",
  printedSubroutines: [netDamageSubroutine(1), endTheRunSubroutine()],
};
