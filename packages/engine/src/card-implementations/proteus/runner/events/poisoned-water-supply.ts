import type { CardImplementationDefinition } from "../../../types";

// card name: Poisoned Water Supply
// text: Play only if you have at least two connections in play. Trash two connections. Give the Corp 1 Bad Publicity point. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.
export const proteusPoisonedWaterSupplyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_117_poisoned-water-supply",
  runnerEventLongtail: {
    kind: "trash_installed_runner_connections_then_add_bad_publicity",
    count: 2,
    badPublicity: 1,
    visibility: "hidden_info_barrier",
  },
};
