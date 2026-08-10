import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_proteus_006_please-dont-choke-anyone",
    ),
    title: "Please Don't Choke Anyone",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "For each 1 damage you successfully do, you may choose instead to prevent that damage and put a PDCA counter on Please Don't Choke Anyone. PDCA counter: Gain an action. Use this ability only once per turn and only during your turn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_006_please-dont-choke-anyone",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["gray_ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 4,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "corp_damage_replacement_pdca_action_counter",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_damage_replacement_pdca_action_counter",
      counterType: "pdca",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "corp_score_agenda",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "line_support",
        lineKey: "corp.action_tempo",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.action_tempo",
        role: "enabler",
        roleDetail: "damage_conversion_extra_action_bank",
        evidenceProfile: "damage_conversion_extra_action_bank",
        confidence: "medium",
        rationale:
          "Successful damage can be converted into a counter bank for extra actions, making the card an action-tempo enabler.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_006_please-dont-choke-anyone",
      setId: "proteus",
      collectorNumber: "P006",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
