import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_067_panic-button"),
    title: "Panic Button",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install Panic Button only in HQ. [1]: Draw a card. Use this ability only during a run on HQ.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("hq_run_pay_one_draw_one"),
        actionLabel: "Panic Button: 1 Credit zahlen und 1 Karte ziehen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_067_panic-button",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 4,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    installCapabilities: [
      {
        kind: "install_only_in_hq",
        visibility: "public",
      },
    ],
    abilities: [
      {
        capabilityKey: capabilityKey("hq_run_pay_one_draw_one"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_during_run",
        costs: [
          {
            kind: "credit",
            amount: 1,
          },
        ],
        condition: {
          kind: "current_run_server",
          server: "hq",
        },
        effects: [
          {
            kind: "draw_cards",
            recipient: "corp",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
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
      printingId: "onr_proteus_067_panic-button",
      setId: "proteus",
      collectorNumber: "P067",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
