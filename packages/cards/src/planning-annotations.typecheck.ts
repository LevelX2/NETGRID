import type { CardPlanningAnnotations } from "./planning-annotations";

export const validPlanningAnnotations: CardPlanningAnnotations = {
  schemaVersion: "card-planning-annotations-v1",
  card: [{ kind: "strategic_role", role: "economy" }],
};

export const mechanicalPlanningField: CardPlanningAnnotations = {
  schemaVersion: "card-planning-annotations-v1",
  card: [
    {
      kind: "strategic_role",
      role: "economy",
      // @ts-expect-error mechanical values are not planning annotations
      credits: 2,
    },
  ],
};
