import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_063_lisa-blight"),
    title: "Lisa Blight",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1], Discard a card at random: Repeat one subroutine on a piece of ice on this fort, until the end of the run. Treat the copy of the subroutine as if it appeared immediately after the original subroutine. Use this ability only during a run.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("during_run_discard_and_copy_subroutine"),
        actionLabel: "Lisa Blight: Subroutine kopieren",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_063_lisa-blight",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sysop"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 2,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("during_run_discard_and_copy_subroutine"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_during_run",
        costs: [
          {
            kind: "credit",
            amount: 1,
          },
          {
            kind: "corp_random_discard_hq",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "copy_same_fort_ice_subroutine_for_run",
            target: "chosen_same_fort_ice_subroutine",
            append: "immediately_after_original",
            cleanup: "run_end",
            visibility: "public",
          },
        ],
      },
    ],
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
        role: "tax_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "ice_subroutine_repeat_support",
        evidenceProfile: "ice_subroutine_repeat_support",
        confidence: "high",
        rationale:
          "Repeats an ICE subroutine and increases tax/ETR/damage depending on the ICE.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
      {
        kind: "risk_interpretation",
        risk: "random_hq_discard",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "hq_plan_component_loss",
        severity: "high",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("during_run_discard_and_copy_subroutine"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "repeat_subroutine_on_fort_ice",
            preferences: [
              "repeat_high_damage_subroutine",
              "repeat_program_trash_subroutine",
              "repeat_hardware_trash_subroutine",
              "repeat_dangerous_tag_subroutine",
              "repeat_end_the_run_subroutine",
              "adds_relevant_encounter_tax",
            ],
            avoid: ["insufficient_post_payment_reserve"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_063_lisa-blight",
      setId: "proteus",
      collectorNumber: "P063",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
