import type { CardImplementationDefinition } from "../../../types";

// card name: Gypsy(TM) Schedule Analyzer
// text: Make a run on R&D. If run is successful, do not access any cards. Instead, reveal cards one at a time from R&D until you reveal an agenda card or there are no cards left in R&D. Store the agenda, if any, in HQ and shuffle the other revealed cards, if any, into R&D.
export const classicGypsytmScheduleAnalyzerImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_038_gypsytm-schedule-analyzer",
    abilities: [
      {
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: { kind: "central_server", server: "rd" },
            successfulRunAccessReplacement: "reveal_rd_until_agenda_store_in_hq",
            visibility: "public",
          },
        ],
      },
    ],
  };
