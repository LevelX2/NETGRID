import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_069_succubus"),
    title: "Succubus",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Succubus can host up to 3 MU of programs. If Succubus leaves play, trash all hosted programs.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_069_succubus",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["daemon"],
      numeric: {
        installCost: 3,
        memoryCost: 1,
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
    hostedProgramCapacity: {
      capacityMu: 3,
      allowedCardTypes: ["program"],
      hostedProgramsAreInstalled: true,
      hostLeavesPlayTrashesHosted: true,
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
        purpose: "choose_hosted_program",
        preferences: [
          "maximize_total_hosted_mu_value_within_capacity_three",
          "free_normal_mu_for_current_rig_route",
          "preserve_required_breaker_coverage",
          "prefer_replaceable_program_when_host_risk_is_equal",
        ],
        avoid: [
          "target_would_break_host_limit",
          "concentrate_irreplaceable_rig_on_single_host",
        ],
      },
      {
        kind: "risk_interpretation",
        risk: "host_leaves_play_trashes_hosted_programs",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_069_succubus",
      setId: "originalset-v1",
      collectorNumber: "069",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
