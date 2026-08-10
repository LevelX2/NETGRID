import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_121_armored-fridge"),
    title: "Armored Fridge",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put seven Ablative counters on Armored Fridge when it is installed. When the last Ablative counter has been removed, trash Armored Fridge.\nAblative counter: Prevent 1 meat damage.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_121_armored-fridge",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
    lifecycle: {
      on_install: [
        {
          kind: "add_counters_to_source",
          counterType: "ablative",
          amount: 7,
          visibility: "public",
        },
      ],
    },
    damagePreventionSources: [
      {
        capabilityKey: capabilityKey(
          "damage_prevention_sources_damage_prevention",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage_prevention",
        damageTypes: ["meat"],
        amount: 1,
        cost: {
          kind: "source_counter",
          counterType: "ablative",
          amount: 1,
          trashSourceWhenEmpty: true,
        },
        priority: 120,
        visibility: "public",
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
        role: "survive_meat_damage",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_121_armored-fridge",
      setId: "originalset-v1",
      collectorNumber: "121",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
