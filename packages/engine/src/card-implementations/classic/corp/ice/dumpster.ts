import type { CardImplementationDefinition } from "../../../types";
import { deflectRunSubroutine } from "../../../helpers";

export const classicDumpsterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_009_dumpster",
  installCapabilities: [
    {
      kind: "install_not_on_archives",
      visibility: "public",
    },
  ],
  printedSubroutines: [
    deflectRunSubroutine({
      target: "archives",
      text: "*Redirect Runner to the outermost rezzed ice on Archives. The run is now on Archives.",
    }),
  ],
};
