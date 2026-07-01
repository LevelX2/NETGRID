import type { CardImplementationDefinition } from "../../../types";

// card name: Executive File Clerk
// text: [2],[T]: Look at all cards stored in HQ. Hidden resources are installed face down, but are put into the trash face up.
export const classicExecutiveFileClerkImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_046_executive-file-clerk",
    abilities: [
      {
        kind: "activated",
        timing: "runner_main",
        costs: [
          { kind: "credit", amount: 2 },
          { kind: "trash_source", amount: 1 },
        ],
        label: "Executive File Clerk: HQ ansehen",
        effects: [
          {
            kind: "private_look",
            zone: "hq",
            count: "all",
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  };
