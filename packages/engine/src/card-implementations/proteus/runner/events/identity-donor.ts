import type { CardImplementationDefinition } from "../../../types";

// card name: Identity Donor
// text: Do not play Identity Donor as an action; instead, play it during the Corp's turn when you would suffer meat damage. Prevent that meat damage and give the Corp 2 Bad Publicity points.
export const proteusIdentityDonorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_112_identity-donor",
  flatlineReplacementSources: [
    {
      kind: "damage_replacement_from_grip",
      replacement: "prevent_meat_damage_add_bad_publicity",
      damageType: "meat",
      activeOnlyDuring: "corp_turn",
      badPublicity: 2,
      visibility: "public",
    },
  ],
};
