import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const selectIceTarget = capabilityKey("select_ice_target");
const breakSentrySubroutine = capabilityKey("break_sentry_subroutine");
const increaseStrength = capabilityKey("increase_strength");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_080_black-widow"),
    title: "Black Widow",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Break sentry subroutine. [2]: +1 strength. Choose an installed piece of ice when you install Black Widow. Black Widow gets +5 strength during each encounter with that piece of ice.",
    capabilityText: [
      { capabilityKey: selectIceTarget, actionLabel: "ICE auswählen" },
      {
        capabilityKey: breakSentrySubroutine,
        actionLabel: "Sentry-Subroutine brechen",
      },
      { capabilityKey: increaseStrength, actionLabel: "+1 Stärke" },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      { source: "card_text", reference: "onr_proteus_080_black-widow" },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["icebreaker", "killer"],
      numeric: {
        installCost: 9,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "fixed", value: 2 },
    },
    installTargetBinding: {
      capabilityKey: selectIceTarget,
      addressability: ["plan", "choice", "quote", "debug"],
      kind: "choose_installed_ice_on_install",
      stores: "selectedCardId",
      visibility: "public",
    },
    icebreakerEncounterStrengthBonus: {
      kind: "against_selected_installed_ice",
      amount: 5,
      visibility: "public",
    },
    icebreakerAbilities: [
      {
        capabilityKey: breakSentrySubroutine,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: { kind: "credit", amount: 1 },
        matches: { kind: "ice_subtype", subtype: "sentry" },
        visibility: "public",
      },
      {
        capabilityKey: increaseStrength,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "increase_strength",
        cost: { kind: "credit", amount: 2 },
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
        capabilityKey: selectIceTarget,
        annotations: [
          {
            kind: "target_preference",
            purpose: "strength_bonus_vs_chosen_ice",
            preferences: [
              "known_or_rezzed_ice",
              "known_sentry",
              "high_strength_ice",
              "high_break_cost_without_bonus",
              "relevant_server_ice",
            ],
            avoid: [
              "unknown_low_information_target",
              "irrelevant_server_ice",
              "already_cheap_to_break",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_080_black-widow",
      setId: "proteus",
      collectorNumber: "P080",
      rarity: "uncommon",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
