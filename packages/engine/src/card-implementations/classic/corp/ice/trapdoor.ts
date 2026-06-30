import type { CardImplementationDefinition } from "../../../types";
import { deflectRunSubroutine } from "../../../helpers";

export const classicTrapdoorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_014_trapdoor",
  installCapabilities: [
    {
      kind: "install_only_in_hq_or_rd",
      visibility: "public",
    },
  ],
  printedSubroutines: [
    deflectRunSubroutine({
      target: "subsidiary_data_fort",
      autoBreakIfNoTarget: true,
      text: "*Redirect Runner to the outermost rezzed ice on a subsidiary data fort of Corp's choice. If there are no subsidiary data forts, Runner automatically breaks this subroutine.",
    }),
  ],
};
