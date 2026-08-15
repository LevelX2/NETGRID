import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_173_restrictive-net-zoning"),
    title: "Restrictive Net Zoning",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Choose a data fort when Restrictive Net Zoning is installed. The Corp must pay [2], in addition to the normal cost, to install ice on that fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_173_restrictive-net-zoning",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: 1,
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
    installTargetBinding: {
      capabilityKey: capabilityKey(
        "install_target_binding_choose_data_fort_on_install",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "choose_data_fort_on_install",
      stores: "selectedServerId",
      visibility: "public",
    },
    modifiers: [
      {
        kind: "install_cost",
        operation: "increase",
        amount: 2,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          selectedServerAsSource: true,
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "corp_ice_install_tax",
      },
      {
        kind: "target_preference",
        purpose: "chosen_fort_ice_tax",
        preferences: [
          "high_expected_corp_rez_count",
          "server_relevant_to_current_plan",
        ],
        avoid: ["irrelevant_server_ice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_173_restrictive-net-zoning",
      setId: "originalset-v1",
      collectorNumber: "173",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
