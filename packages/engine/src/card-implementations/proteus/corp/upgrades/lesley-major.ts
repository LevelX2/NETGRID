import type { CardImplementationDefinition } from "../../../types";

// card name: Lesley Major
// text: Install Lesley Major only in a subsidiary data fort. [5]: Add two advancement counters, at no cost, to a card installed in this data fort. Use this ability only when Runner passes the last piece of ice on this fort, and only once per run.
export const proteusLesleyMajorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_062_lesley-major",
  installCapabilities: [
    {
      kind: "install_only_inside_subsidiary_data_fort",
      visibility: "public",
    },
  ],
  fortRunWindows: [
    {
      kind: "add_advancement_counters_after_passing_last_ice_on_this_fort",
      timing: "pass_last_ice_on_this_fort",
      cost: { kind: "credit", amount: 5 },
      target: "advanceable_installed_card_in_this_fort",
      amount: 2,
      limit: "once_per_run_per_source",
      visibility: "public",
    },
  ],
};
