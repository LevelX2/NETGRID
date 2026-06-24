import type { CardImplementationDefinition } from "../../../types";

// card name: Live News Feed
// text: Make a run. If run is successful, the Corp gives you two tags, and you give the Corp 1 Bad Publicity point for each black ice you encountered during the run, 1 for each Black Ops card the Corp rezzed during the run, and 1 for each Black Ops agenda you liberated during the run.
export const proteusLiveNewsFeedImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_113_live-news-feed",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          badPublicityRunAftermath: "successful_run_draw_event",
          visibility: "public",
        },
      ],
    },
  ],
};
