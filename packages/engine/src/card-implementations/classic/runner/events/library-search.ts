import type { CardImplementationDefinition } from "../../../types";

// card name: Library Search
// text: Make a run on R&D or HQ. If run is successful, access two additional cards if you used no noisy icebreakers during the run and if no trace attempts were made during the run.
export const classicLibrarySearchImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_039_library-search",
  runnerEventLongtail: {
    kind: "library_search_run",
    accessBonus: 2,
    allowedServers: ["rd", "hq"],
    condition: "no_noisy_icebreaker_or_trace",
    visibility: "public",
  },
};
