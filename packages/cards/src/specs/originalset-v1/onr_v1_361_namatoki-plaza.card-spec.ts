import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_361_namatoki-plaza"),
    title: "Namatoki Plaza",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Rez Namatoki Plaza when you install it. Install Namatoki Plaza only if you can pay to rez it. Install only inside a subsidiary data fort. That fort may have an additional agenda or node installed inside it. If Namatoki Plaza leaves play while installed, and this results in the fort having too many agendas and nodes installed inside it, trash one of those agendas or nodes.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_361_namatoki-plaza",
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
        rezCost: 3,
        trashCost: 1,
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
        kind: "rez_on_install",
        installOnlyIfRezAffordable: true,
        visibility: "public",
      },
      {
        kind: "install_only_inside_subsidiary_data_fort",
        visibility: "public",
      },
    ],
    fortCapacityModifiers: [
      {
        kind: "additional_agenda_or_node_slot_inside_fort",
        amount: 1,
        activeWhile: "installed",
        visibility: "public",
      },
    ],
    leavePlayCleanup: [
      {
        kind: "trash_agenda_or_node_if_fort_over_capacity",
        target: "agenda_or_node_inside_same_fort",
        selection: "corp_choice",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_upgrade_support",
      },
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "support_tool",
        roleDetail: "remote_capacity_expansion",
        confidence: "medium",
        rationale:
          "Additional agenda/node capacity supports remote construction, but it is not itself protection.",
      },
      {
        kind: "remote_role",
        role: "remote_capacity",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_361_namatoki-plaza",
      setId: "originalset-v1",
      collectorNumber: "361",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
