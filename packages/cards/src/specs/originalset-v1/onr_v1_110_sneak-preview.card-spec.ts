import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const installProgram = capabilityKey("install_program_from_stack_or_trash");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_110_sneak-preview"),
    title: "Sneak Preview",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Choose a program from your trash or search your stack for a program. Install that program, at no cost. Shuffle your stack afterwards. At the end of the turn, take the program into your hand.",
    capabilityText: [
      {
        capabilityKey: installProgram,
        actionLabel: "Programm aus Stack oder Trash installieren",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      { source: "card_text", reference: "onr_v1_110_sneak-preview" },
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
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: { kind: "fixed", credits: 3 },
      strength: { kind: "not_applicable" },
    },
    abilities: [
      {
        capabilityKey: installProgram,
        addressability: ["plan", "action", "choice", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "choose_stack_or_trash_program_install",
            installCost: "free",
            shuffleStackAfterwards: true,
            returnInstalledCardToGripAtEndOfTurn: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "line_support",
        lineKey: "runner.search.breaker",
        support: "supports",
      },
      { kind: "strategic_role", role: "enabler" },
      { kind: "strategic_exchange", exchange: "temporary_resource" },
      { kind: "plan_role", role: "build_rig" },
      { kind: "plan_role", role: "recover_rig" },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
      },
    ],
    capabilities: [
      {
        capabilityKey: installProgram,
        annotations: [
          {
            kind: "target_preference",
            purpose: "temporary_program_install",
            preferences: [
              "program_repairs_missing_coverage",
              "program_preserves_run_goal",
            ],
            avoid: [],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_110_sneak-preview",
      setId: "originalset-v1",
      collectorNumber: "110",
      rarity: "rare",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
