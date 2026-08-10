import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_026_hunting-pack"),
    title: "Hunting Pack",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      'For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one subroutine as follows: "*Trace 5-If trace is successful, give Runner a tag."',
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_026_hunting-pack",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["bloodhound", "sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 4,
      },
    },
    relativeIce: {
      capabilityKey: capabilityKey("outside_rezzed_ice_dynamic_trace"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "rezzed_ice_outside_this_ice",
      dynamicTraceSubroutines: {
        traceSuccessEffect: {
          type: "add_tag",
          amount: 1,
        },
        visibility: "public",
        traceLimit: 5,
      },
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
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.tag_trace_punish",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "position_scaling_trace_tag_tax_ice",
        evidenceProfile: "position_scaling_trace_tag_tax_ice",
        confidence: "medium",
        rationale:
          "v2: Mehr Trace-Tag-Subroutinen erhöhen Break-/Risk-Druck in tiefen Servern; kein Strength-Modifier.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "enabler",
        roleDetail: "position_scaling_trace_tag_source",
        evidenceProfile: "position_scaling_trace_tag_source",
        confidence: "medium",
        rationale:
          "v2: Mehrere Trace-5-Tag-Subroutinen sind deutlich stärker als ein einfacher Hunter/Fetch-Trace und tragen die Tag/Trace-Linie als Enabler.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_026_hunting-pack",
      setId: "proteus",
      collectorNumber: "P026",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
