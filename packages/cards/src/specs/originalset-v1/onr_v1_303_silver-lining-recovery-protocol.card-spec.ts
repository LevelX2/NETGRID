import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_v1_303_silver-lining-recovery-protocol",
    ),
    title: "Silver Lining Recovery Protocol",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "If any agendas were stolen during Runner's last turn, gain bits equal to three times the number of advancement counters those agendas had.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_303_silver-lining-recovery-protocol",
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
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey(
        "corp_utility_gain_credits_from_stolen_agenda_advancement_history",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "gain_credits_from_stolen_agenda_advancement_history",
      multiplierPerAdvancementCounter: 3,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "plan_role",
        role: "recover_economy",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_303_silver-lining-recovery-protocol",
      setId: "originalset-v1",
      collectorNumber: "303",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
