import type { CardImplementationDefinition } from "../../../types";

// card name: Superserum
// text: When you score Superserum, remove all Virus counters, and avoid receiving the next two Virus counters Runner gives to you.
export const classicSuperserumImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_002_superserum",
  scoredAgenda: {
    kind: "purge_runner_virus_counters_and_prevent_next",
    preventCount: 2,
    visibility: "public",
  },
};
