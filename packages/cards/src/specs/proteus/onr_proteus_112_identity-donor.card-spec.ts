import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_112_identity-donor"),
    title: "Identity Donor",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Do not play Identity Donor as an action; instead, play it during the Corp's turn when you would suffer meat damage. Prevent that meat damage and give the Corp 2 Bad Publicity points. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_112_identity-donor",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["bad_publicity"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    flatlineReplacementSources: [
      {
        capabilityKey: capabilityKey(
          "grip_meat_damage_to_bad_publicity_replacement",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage_replacement_from_grip",
        replacement: "prevent_meat_damage_add_bad_publicity",
        damageType: "meat",
        activeOnlyDuring: "corp_turn",
        badPublicity: 2,
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_rig",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_112_identity-donor",
      setId: "proteus",
      collectorNumber: "P112",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
