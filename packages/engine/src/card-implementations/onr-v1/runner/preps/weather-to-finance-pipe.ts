import type { CardImplementationDefinition } from "../../../types";

// card name: Weather-to-Finance Pipe
// text: Make a run on HQ. If run is successful, do not access cards from HQ; instead, the Corp loses [4].
export const weatherToFinancePipeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_118_weather-to-finance-pipe",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          successfulRunAccessReplacement: "corp_lose_credits",
          successfulRunCreditLoss: 4,
          visibility: "public",
        },
      ],
    },
  ],
};
