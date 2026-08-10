import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_144_lucidrinetm-drip-feed"),
    title: "Lucidrine™ Drip Feed",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "At the start of each of your turns, if there are two Drip counters on Drip Feed, remove all Drip counters from it and take 1 brain damage, which cannot be prevented; otherwise, put a Drip counter on Drip Feed and gain an action.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_144_lucidrinetm-drip-feed",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: [],
      numeric: {
        installCost: 8,
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
    uniqueDirectLongtail: {
      capabilityKey: capabilityKey(
        "start_turn_drip_counter_action_or_core_damage",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "runner_start_turn_drip_counter_action_or_core_damage",
      counterType: "drip",
      threshold: 2,
      visibility: "public",
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
      {
        kind: "strategic_exchange",
        exchange: "self_damage",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_144_lucidrinetm-drip-feed",
      setId: "proteus",
      collectorNumber: "P144",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
