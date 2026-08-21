import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_145_mercenary-subcontract"),
    title: "Mercenary Subcontract",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[4], [T]: Trash, at no cost, one or more cards that you are currently accessing, even if those cards cannot normally be trashed. Hidden resources are installed face down, but are put into the trash face up.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_145_mercenary-subcontract",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["hidden", "sabotage"],
      numeric: {
        installCost: 0,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    runnerUtilityLongtail: {
      capabilityKey: capabilityKey(
        "current_access_pay_and_trash_source_free_trash",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "hidden_resource_current_access_free_trash",
      cost: {
        kind: "credit_and_trash_source",
        amount: 4,
      },
      target: "current_accessed_cards",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "safe_probe_run",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "current_access_pay_and_trash_source_free_trash",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "currently_accessed_cards_free_trash",
            preferences: [
              "high_value_accessed_card",
              "denies_corp_agenda_or_combo_piece",
              "normally_untrashable_payoff",
              "current_access_only",
            ],
            avoid: ["low_value_accessed_card", "access_goal_blocked_after_use"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_145_mercenary-subcontract",
      setId: "proteus",
      collectorNumber: "P145",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
