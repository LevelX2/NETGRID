import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_289_edgerunner-inc-temps"),
    title: "Edgerunner, Inc., Temps",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Gain three consecutive actions, which you may use only to install cards. You are not required to take all three of these actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_289_edgerunner-inc-temps",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey(
        "corp_utility_gain_restricted_install_actions",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "gain_restricted_install_actions",
      amount: 3,
      mayStopEarly: true,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "target_preference",
        purpose: "install_best_legal_target",
        preferences: [
          "best_cards_for_current_plan",
          "central_or_remote_plan_enabler",
        ],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_289_edgerunner-inc-temps",
      setId: "originalset-v1",
      collectorNumber: "289",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
