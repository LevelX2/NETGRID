import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Detective Agency
// text: Play only if Runner is tagged. Trash up to two resources, at no cost.
export const corporateDetectiveAgencyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_286_corporate-detective-agency",
  corpUtility: {
    kind: "trash_runner_resources_if_tagged",
    max: 2,
    visibility: "public",
  },
};
