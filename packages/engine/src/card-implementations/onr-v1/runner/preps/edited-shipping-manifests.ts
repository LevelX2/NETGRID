import type { CardImplementationDefinition } from "../../../types";

// card name: Edited Shipping Manifests
// text: Make a run on HQ. If run is successful, and the Corp has any bits when you would access HQ, do not access cards from HQ; instead, the Corp loses [1] and gives you a tag, and you gain [10].
export const editedShippingManifestsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_084_edited-shipping-manifests",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          successfulRunAccessReplacement: "corp_lose_credits",
          successfulRunCreditLoss: 1,
          successfulRunRunnerTagGain: 1,
          successfulRunRunnerCreditGain: 10,
          successfulRunRequiresCorpCredits: true,
          visibility: "public",
        },
      ],
    },
  ],
};
