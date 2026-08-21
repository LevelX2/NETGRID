import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const selectBreakerSubtype = capabilityKey("select_breaker_subtype");
const changeBreakerSubtype = capabilityKey("change_breaker_subtype");
const breakSelectedSubtype = capabilityKey("break_selected_subtype");
const increaseStrength = capabilityKey("increase_strength");

const coveragePreferences = [
  "type_blocking_relevant_run_path",
  "type_with_known_problem_ice",
  "type_missing_in_current_rig",
] as const;
const coverageAvoid = [
  "unknown_low_information_target",
  "hidden_info_dependent_choice",
] as const;

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_092_morphing-tool"),
    title: "Morphing Tool",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[2]: Break a subroutine of the type last chosen for Morphing Tool. [1]: +1 strength. [1], A: Choose whether Morphing Tool breaks code gates, sentries, or walls. When you install Morphing Tool, choose whether it breaks code gates, sentries, or walls.",
    capabilityText: [
      {
        capabilityKey: selectBreakerSubtype,
        actionLabel: "Breaker-Subtype wählen",
      },
      {
        capabilityKey: changeBreakerSubtype,
        actionLabel: "Breaker-Subtype ändern",
      },
      {
        capabilityKey: breakSelectedSubtype,
        actionLabel: "Subroutine des gewählten Subtyps brechen",
      },
      { capabilityKey: increaseStrength, actionLabel: "+1 Stärke" },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      { source: "card_text", reference: "onr_proteus_092_morphing-tool" },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["icebreaker"],
      numeric: {
        installCost: 10,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "fixed", value: 4 },
    },
    installTargetBinding: {
      capabilityKey: selectBreakerSubtype,
      addressability: ["plan", "choice", "quote", "debug"],
      kind: "choose_icebreaker_subtype_on_install",
      stores: "selectedSubtype",
      choices: ["code_gate", "sentry", "wall"],
      visibility: "public",
    },
    icebreakerSubtypeChange: {
      capabilityKey: changeBreakerSubtype,
      addressability: ["plan", "action", "choice", "quote", "debug"],
      timing: "runner_main",
      cost: { clicks: 1, credits: 1 },
      choices: ["code_gate", "sentry", "wall"],
      visibility: "public",
    },
    icebreakerAbilities: [
      {
        capabilityKey: breakSelectedSubtype,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 2 },
        matches: { kind: "selected_ice_subtype" },
        visibility: "public",
      },
      {
        capabilityKey: increaseStrength,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "increase_strength",
        cost: { kind: "credit", amount: 1 },
        amount: 1,
        duration: "current_encounter",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "plan_role", role: "build_rig" },
      { kind: "plan_role", role: "safe_probe_run" },
      {
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
    ],
    capabilities: [
      {
        capabilityKey: selectBreakerSubtype,
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_current_breaker_coverage",
            preferences: coveragePreferences,
            avoid: coverageAvoid,
          },
        ],
      },
      {
        capabilityKey: changeBreakerSubtype,
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_current_breaker_coverage",
            preferences: coveragePreferences,
            avoid: coverageAvoid,
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_092_morphing-tool",
      setId: "proteus",
      collectorNumber: "P092",
      rarity: "uncommon",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
