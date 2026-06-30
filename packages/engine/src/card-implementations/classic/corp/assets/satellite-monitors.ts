import type { CardImplementationDefinition } from "../../../types";

// card name: Satellite Monitors
// text: At the start of each of your turns, you may roll a die for each run Runner made during his or her last turn. For each 1, give Runner a tag.
export const classicSatelliteMonitorsImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_021_satellite-monitors",
    corpUtility: {
      kind: "corp_start_turn_tag_roll_per_runner_run_last_turn",
      dieFaces: 6,
      tagOn: 1,
      visibility: "public",
    },
  };
