import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_073_simon-francisco"),
    title: "Simon Francisco",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install Simon Francisco only in R&D or HQ. During a run in which Simon is accessed, Runner accesses one less card stored in this fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_073_simon-francisco",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sysop"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
        trashCost: 3,
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
        kind: "install_only_in_hq_or_rd",
        visibility: "public",
      },
    ],
    accessEffects: [
      {
        capabilityKey: capabilityKey("access_reduce_stored_card_queue"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed", "hq", "rd"],
        effects: [
          {
            kind: "reduce_current_access_queue",
            target: "remaining_stored_cards_in_this_fort",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
        visibility: "hidden_info_barrier",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.central_stabilize",
      },
      {
        kind: "line_support",
        lineKey: "corp.central_stabilize",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.central_stabilize",
        role: "defensive_tool",
        roleDetail: "central_multiaccess_reduction",
        evidenceProfile: "central_multiaccess_reduction",
        confidence: "high",
        rationale:
          "Reduces central multiaccess from HQ/R&D and stabilizes central defense.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_073_simon-francisco",
      setId: "proteus",
      collectorNumber: "P073",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
