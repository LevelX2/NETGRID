import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_074_siren"),
    title: "Siren",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Rez Siren when you install it. Install Siren only if you can pay to rez it. [1]: Runner must make a run on the fort Siren is installed in, if possible, instead of on the fort he or she was originally going to make a run on. Use this ability only at the start of a run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_074_siren",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["node"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
        trashCost: 0,
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
    ],
    corpUtility: {
      capabilityKey: capabilityKey("start_run_redirect_to_source_fort"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "start_run_redirect_to_source_fort",
      cost: {
        credits: 1,
      },
      timing: "run_start",
      redirectTarget: "source_fort",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "remote_run_control",
        evidenceProfile: "remote_run_control",
        confidence: "high",
        rationale:
          "Run redirect/control supports remote defense but adds no planner or legality behavior. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_074_siren",
      setId: "proteus",
      collectorNumber: "P074",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
