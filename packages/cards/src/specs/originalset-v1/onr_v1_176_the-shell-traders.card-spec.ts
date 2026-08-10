import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_176_the-shell-traders"),
    title: "The Shell Traders",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A: Choose a program or hardware card from your hand. Set that card aside, and put a number of Shell counters on it equal to its installation cost. When the last Shell counter on that card has been removed, install that card, at no cost. Remove one Shell counter from one card at the start of each of your turns. [1]: Remove one Shell counter from a card.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_176_the-shell-traders",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
    hiddenReplacementLongtail: {
      capabilityKey: capabilityKey(
        "hidden_replacement_longtail_delayed_install_with_counter_countdown",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "delayed_install_with_counter_countdown",
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
        kind: "target_preference",
        purpose: "staged_program_or_hardware_install",
        preferences: [],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_176_the-shell-traders",
      setId: "originalset-v1",
      collectorNumber: "176",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
