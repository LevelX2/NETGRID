import type { CardImplementationDefinition } from "../../../types";
import {
  agendaPointSelfRezCost,
  endTheRunSubroutines,
} from "../../../helpers";

export const classicGlacierImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_011_glacier",
  installCapabilities: [
    {
      kind: "install_only_inside_subsidiary_data_fort",
      visibility: "public",
    },
  ],
  selfRezAdditionalCosts: agendaPointSelfRezCost(1),
  printedSubroutines: endTheRunSubroutines(2),
  fortRunWindows: [
    {
      kind: "move_self_to_outermost_position_on_other_fort",
      timing: "start_of_run",
      cost: { kind: "credit", amount: 1 },
      target: "outermost_position_on_other_data_fort",
      revealIfUnrezzed: true,
      limit: "once_per_run_per_source",
      visibility: "public",
    },
  ],
};
