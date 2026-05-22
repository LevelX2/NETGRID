import type { CardImplementationDefinition } from "../../../types";

// card name: Employee Empowerment
// text: You may choose to draw an additional card at the start of each of your turns. A: Draw two cards.
export const employeeEmpowermentImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_199_employee-empowerment",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "draw_cards",
          recipient: "corp",
          amount: 2,
          visibility: "public",
        },
      ],
      label: "Employee Empowerment: 2 Karten ziehen",
    },
  ],
};
