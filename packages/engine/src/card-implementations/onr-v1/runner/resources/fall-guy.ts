import type { CardImplementationDefinition } from "../../../types";

// card name: Fall Guy
// text: [T]: Avoid receiving a tag.
export const fallGuyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_161_fall-guy",
  tagPreventionSources: [
    {
      kind: "avoid_tag",
      amount: 1,
      cost: { kind: "trash_source" },
      priority: 120,
      visibility: "public",
    },
  ],
};
