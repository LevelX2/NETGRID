import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_012_bug-zapper"),
    title: "Bug Zapper",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Do 2 Net damage for each rezzed piece of ice installed outside Bug Zapper. *End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_012_bug-zapper",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ap", "hellbolt", "sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 6,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 2,
      },
    },
    relativeIce: {
      capabilityKey: capabilityKey("outside_rezzed_ice_dynamic_net_damage"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "rezzed_ice_outside_this_ice",
      dynamicDamageSubroutine: {
        amountPerCount: 2,
        visibility: "public",
        subroutineCapabilityKey: capabilityKey(
          "subroutine_relative_net_damage",
        ),
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_relative_net_damage"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: {
          kind: "derived",
          source: "relative_ice_dynamic_damage",
          ownerCapabilityKey: capabilityKey(
            "outside_rezzed_ice_dynamic_net_damage",
          ),
        },
        preventable: true,
      },
      {
        capabilityKey: capabilityKey("subroutine_end_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
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
        kind: "plan_role",
        role: "protect_remote",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "line_support",
        lineKey: "corp.damage_kill",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "punish_payoff",
        roleDetail: "position_scaling_net_damage_ice",
        evidenceProfile: "position_scaling_net_damage_ice",
        confidence: "high",
        rationale:
          "v2: Net damage skaliert mit äußerem rezzed ICE; das ist ein echter Damage-Payoff.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "payoff_anchor",
        roleDetail: "deep_server_damage_payoff_ice",
        evidenceProfile: "deep_server_damage_payoff_ice",
        confidence: "medium",
        rationale:
          "v2: Die Karte belohnt tiefe/rezzed ICE-Server, aber nicht über Strength; Glacier-Bezug über Position-Scaling, nicht ice.strength_modifier.",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_012_bug-zapper",
      setId: "proteus",
      collectorNumber: "P012",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
