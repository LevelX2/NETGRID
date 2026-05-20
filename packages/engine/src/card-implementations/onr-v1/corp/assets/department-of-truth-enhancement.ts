import type { CardImplementationDefinition } from "../../../types";

// card name: Department of Truth Enhancement
// text: A: Put [3] from the bank on Department of Truth Enhancement. A: Take all the bits from Department of Truth Enhancement.
export const departmentOfTruthEnhancementImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_318_department-of-truth-enhancement",
    abilities: [
      {
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        label: "Department of Truth Enhancement: 3 Credits auf die Karte legen",
        effects: [
          {
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
            visibility: "public",
          },
        ],
      },
      {
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        condition: { kind: "source_has_hosted_credits" },
        label: "Department of Truth Enhancement: Credits von der Karte nehmen",
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            mode: "all",
            visibility: "public",
          },
        ],
      },
    ],
  };
