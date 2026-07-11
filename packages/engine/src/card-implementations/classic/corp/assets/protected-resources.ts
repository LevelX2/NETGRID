import type { CardImplementationDefinition } from "../../../types";

// card name: Protected Resources
// text: [1]: Move any number of bits from your bit pool to Protected Resources. A: Move any number of bits from Protected Resources to your bit pool.
export const classicProtectedResourcesImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_053_protected-resources",
    abilities: [
      {
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "credit", amount: 1 }],
        label: "Protected Resources: Bits einlagern",
        effects: [
          {
            kind: "transfer_hosted_credits",
            direction: "controller_to_source",
            amount: { kind: "x_value", min: 1 },
            visibility: "public",
          },
        ],
      },
      {
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        condition: { kind: "source_has_hosted_credits" },
        label: "Protected Resources: Bits entnehmen",
        effects: [
          {
            kind: "transfer_hosted_credits",
            direction: "source_to_controller",
            amount: { kind: "x_value", min: 1 },
            visibility: "public",
          },
        ],
      },
    ],
  };
