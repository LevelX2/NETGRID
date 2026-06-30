import type { CardImplementationDefinition } from "../../../types";
import {
  addHostedCredits,
  restrictedHostedCreditSource,
} from "../../../helpers";

// card name: Zetatech Portastation
// text: Put [1] from the bank on Zetatech Portastation when it is installed. Use this bit only to pay for playing preps. If you use the bit, replace it from the bank at the start of your next turn.
export const classicZetatechPortastationImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_052_zetatech-portastation",
    lifecycle: {
      on_install: [addHostedCredits(1)],
    },
    restrictedHostedCreditSource: restrictedHostedCreditSource({
      capacity: 1,
      usableFor: ["play_events"],
    }),
  };
