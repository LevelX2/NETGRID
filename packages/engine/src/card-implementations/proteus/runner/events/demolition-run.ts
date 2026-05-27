import type { CardImplementationDefinition } from "../../../types";

// card name: Demolition Run
// text: Make a run. If run is successful, do not access cards; instead, trash all rezzed ice on the fort on which you just made a run, and the Corp gives you three tags.
export const proteusDemolitionRunImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_105_demolition-run",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          successfulRunAccessReplacement:
            "trash_rezzed_ice_on_fort_and_tag_runner",
          successfulRunRunnerTagGain: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
