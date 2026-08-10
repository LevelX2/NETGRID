import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_331_nevinyrral"),
    title: "Nevinyrral",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Gain an action during each of your turns. If Nevinyrral leaves play while rezzed, you lose the game.\nOnly one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_331_nevinyrral",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ai", "unique"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
        trashCost: 5,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    unique: {
      kind: "unique_by_title",
      controller: "corp",
    },
    lifecycle: {
      start_of_corp_turn: [
        {
          effects: [
            {
              kind: "gain_actions",
              recipient: "controller",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
    },
    uniqueDirectLongtail: {
      capabilityKey: capabilityKey(
        "unique_direct_longtail_rezzed_leave_action_gain_asset",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "rezzed_leave_action_gain_asset",
      actionGain: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_asset_modifier",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_331_nevinyrral",
      setId: "originalset-v1",
      collectorNumber: "331",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
