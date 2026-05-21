import type { CardImplementationDefinition } from "../../../types";

// card name: Project Babylon
// text: Score 1 additional agenda point for every two advancement counters over Project Babylon's difficulty that are on Project Babylon when you score it.
export const projectBabylonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_214_project-babylon",
  scoredAgenda: {
    kind: "project_babylon_bonus_points",
    perExcessAdvancementCounters: 2,
    visibility: "public",
  },
};
