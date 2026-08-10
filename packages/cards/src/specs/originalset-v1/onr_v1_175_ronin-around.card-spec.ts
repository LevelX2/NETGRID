import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_175_ronin-around"),
    title: "Ronin Around",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A: Look at the top five cards of your stack. You may bring any hardware cards among them into your hand. Pay [1] for each card taken in this way, and show those cards to the Corp. Shuffle the rest back into your stack.\tA, [2]: Expose any card.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_look_top_stack_take_matching",
        ),
        actionLabel: "Ronin Around: Stack-Spitze nach Hardware durchsuchen",
      },
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_expose_installed_card",
        ),
        actionLabel: "Ronin Around: installierte Korp-Karte exposen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_175_ronin-around",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["bbs"],
      numeric: {
        installCost: 3,
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
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_look_top_stack_take_matching",
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
            kind: "look_top_stack_take_matching",
            count: 5,
            allowedTypes: ["hardware"],
            costPerTaken: 1,
            revealTakenToCorp: true,
            shuffleRemainder: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
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
          {
            kind: "credit",
            amount: 2,
          },
        ],
        effects: [
          {
            kind: "expose_installed_card",
            target: "chosen_installed_corp_card",
            scope: "any_installed",
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
        role: "safe_probe_run",
      },
      {
        kind: "target_preference",
        purpose: "top_five_hardware_choice",
        preferences: [],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_175_ronin-around",
      setId: "originalset-v1",
      collectorNumber: "175",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
