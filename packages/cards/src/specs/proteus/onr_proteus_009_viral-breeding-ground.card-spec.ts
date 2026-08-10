import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_009_viral-breeding-ground"),
    title: "Viral Breeding Ground",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "When you score Breeding Ground, trash all cards installed in or on the fort Breeding Ground was installed in. When Runner accesses Breeding Ground, choose up to two programs for each advancement counter on Breeding Ground; Runner brings those programs into his or her hand.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_009_viral-breeding-ground",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ambush", "research", "virus"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 4,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    lifecycle: {
      on_score: [
        {
          kind: "trash_corp_installed_cards_in_source_server",
          include: "root_and_ice",
          visibility: "hidden_info_barrier",
        },
      ],
    },
    accessEffects: [
      {
        capabilityKey: capabilityKey(
          "access_return_installed_runner_programs_to_grip",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed", "hq", "rd", "archives"],
        revealIfAccessedFrom: ["rd"],
        effects: [
          {
            kind: "return_installed_runner_programs_to_grip",
            chooser: "corp",
            amount: {
              kind: "source_advancement_counter_count",
              multiplier: 2,
            },
            visibility: "hidden_info_barrier",
          },
        ],
        visibility: "hidden_info_barrier",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "corp_score_agenda",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "line_support",
        lineKey: "corp.ambush_bluff",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "program_bounce_ambush",
        evidenceProfile: "program_bounce_ambush",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Viral Breeding Ground to corp.ambush_bluff as punish_payoff/program_bounce_ambush.",
      },
      {
        kind: "target_preference",
        purpose: "bounce_high_value_runner_program",
        preferences: ["installed_icebreaker", "high_install_cost_or_memory"],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_009_viral-breeding-ground",
      setId: "proteus",
      collectorNumber: "P009",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
