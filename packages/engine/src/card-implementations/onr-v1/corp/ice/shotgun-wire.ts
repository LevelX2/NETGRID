import { endTheRunSubroutine, netDamageSubroutine } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Shotgun Wire
// text: *Do 2 Net damage. *End the run.
export const shotgunWireImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_269_shotgun-wire",
  printedSubroutines: [netDamageSubroutine(2), endTheRunSubroutine()],
};
