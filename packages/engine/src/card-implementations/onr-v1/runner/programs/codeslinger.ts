import type { CardImplementationDefinition } from "../../../types";

// card name: Codeslinger
// text: [1]: Break sentry subroutine.
export const codeslingerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_015_codeslinger",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      visibility: "public",
    },
  ],
};
