import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_042_mouse"),
    title: "Mouse",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "A: Expose a card installed inside a data fort.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_expose_installed_card",
        ),
        actionLabel: "Mouse: installierte Korp-Karte exposen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_042_mouse",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["detection"],
      numeric: {
        installCost: 2,
        memoryCost: 1,
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
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_expose_installed_card",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "expose_installed_card",
            target: "chosen_installed_corp_card",
            scope: "inside_data_fort",
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
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "contest_remote",
      },
      {
        kind: "plan_role",
        role: "expose_recon",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_expose_installed_card",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "expose_installed_card",
            preferences: [
              "unknown_or_unrezzed_corp_card",
              "server_relevant_to_current_plan",
              "current_run_path_relevance",
            ],
            avoid: ["already_known_or_rezzed_card"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_042_mouse",
      setId: "originalset-v1",
      collectorNumber: "042",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
