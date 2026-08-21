import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_062_lesley-major"),
    title: "Lesley Major",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install Lesley Major only in a subsidiary data fort. [5]: Add two advancement counters, at no cost, to a card installed in this data fort. Use this ability only when Runner passes the last piece of ice on this fort, and only once per run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_062_lesley-major",
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
        kind: "install_only_inside_subsidiary_data_fort",
        visibility: "public",
      },
    ],
    fortRunWindows: [
      {
        capabilityKey: capabilityKey("pass_last_ice_advance_same_fort_card"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "add_advancement_counters_after_passing_last_ice_on_this_fort",
        timing: "pass_last_ice_on_this_fort",
        cost: {
          kind: "credit",
          amount: 5,
        },
        target: "installed_card_in_this_fort",
        amount: 2,
        limit: "once_per_run_per_source",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "ambush_advancement_support",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "line_support",
        lineKey: "corp.ambush_bluff",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "enabler",
        roleDetail: "access_window_advancement_enabler",
        evidenceProfile: "access_window_advancement_enabler",
        confidence: "medium",
        rationale:
          "Counters are added after the Runner has passed the last ICE, which is more relevant as surprise support for advanceable ambushes or remote traps than as normal remote scoring.",
      },
      {
        kind: "target_preference",
        purpose: "place_advancement_counters_in_fort",
        preferences: [
          "advanceable_ambush_with_access_payoff",
          "advancement_target_in_current_plan",
        ],
        avoid: [
          "nonconverting_advancement_target",
          "insufficient_post_payment_reserve",
        ],
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
      printingId: "onr_proteus_062_lesley-major",
      setId: "proteus",
      collectorNumber: "P062",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
