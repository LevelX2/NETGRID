import type { CardImplementationDefinition } from "../../../types";

// card name: The Shell Traders
// text: A: Choose a program or hardware card from your hand. Set that card aside, and put a number of Shell counters on it equal to its installation cost. When the last Shell counter on that card has been removed, install that card, at no cost. Remove one Shell counter from one card at the start of each of your turns. [1]: Remove one Shell counter from a card.
export const theShellTradersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_176_the-shell-traders",
  hiddenReplacementLongtail: {
    kind: "shell_traders_delayed_install",
    visibility: "hidden_info_barrier",
  },
};
