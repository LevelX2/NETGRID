import type { CardImplementationDefinition } from "../../../types";
import { deflectRunSubroutine } from "../../../helpers";

export const classicEntrapmentImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_010_entrapment",
  printedSubroutines: [
    deflectRunSubroutine({
      target: "any_data_fort",
      cost: 2,
      text: "*If Corp pays [2], redirect Runner to the outermost rezzed ice on a data fort of Corp's choice. The run is now on that fort.",
    }),
  ],
};
