import type { CardImplementationDefinition } from "../../../types";

// card name: Twenty-Four-Hour Surveillance
// text: During runs on this fort, Runner cannot use bits from stealth sources.
export const twentyFourHourSurveillanceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_373_twenty-four-hour-surveillance",
  fortRunWindows: [
    {
      kind: "block_stealth_bits_during_runs_on_this_fort",
      timing: "during_run_on_this_fort",
      blocks: "runner_stealth_bit_payment_sources",
      visibility: "public",
    },
  ],
};
