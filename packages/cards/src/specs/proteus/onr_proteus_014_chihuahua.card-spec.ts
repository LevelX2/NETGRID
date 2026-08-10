import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_014_chihuahua"),
    title: "Chihuahua",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Trace 1-If trace is successful, do 1 Net damage. Gain [2] when you rez Chihuahua.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_014_chihuahua",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ap", "hellhound", "sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 0,
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_trace_one_net_damage"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        onSuccess: [
          {
            kind: "preventable_damage",
            recipient: "runner",
            damageType: "net",
            amount: 1,
            visibility: "public",
          },
        ],
        traceLimit: 1,
      },
    ],
    lifecycle: {
      on_rez: [
        {
          kind: "gain_credits",
          recipient: "corp",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
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
      printingId: "onr_proteus_014_chihuahua",
      setId: "proteus",
      collectorNumber: "P014",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
