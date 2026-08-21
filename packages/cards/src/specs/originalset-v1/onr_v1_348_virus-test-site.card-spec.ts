import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const installedUnrezzedDamage = capabilityKey("installed_unrezzed_damage");
const installedCounterDamage = capabilityKey("installed_counter_damage");
const centralCounterDamage = capabilityKey("central_counter_damage");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_348_virus-test-site"),
    title: "Virus Test Site",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance Virus Test Site before and after you rez it. When Runner accesses Test Site, it does 2 Net damage per advancement counter on it, or 1 Net damage if it has no counters, even if it is not installed or rezzed. Ignore this effect if Runner accesses it from the Archives. If Test Site is accessed from R&D, Runner must show it to you.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      { source: "card_text", reference: "onr_v1_348_virus-test-site" },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ambush"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 0,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "not_applicable" },
    },
    advanceable: { while: "installed_before_and_after_rez" },
    accessEffects: [
      {
        capabilityKey: installedUnrezzedDamage,
        addressability: ["plan", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed"],
        installedSourceActivation: "unrezzed_only",
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "net",
            amount: 1,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
      {
        capabilityKey: installedCounterDamage,
        addressability: ["plan", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage_from_source_advancement_counters",
            recipient: "runner",
            damageType: "net",
            amountPerCounter: 2,
            minimumAmount: 1,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
      {
        capabilityKey: centralCounterDamage,
        addressability: ["plan", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["hq", "rd", "archives"],
        ignoreIfAccessedFrom: ["archives"],
        revealIfAccessedFrom: ["rd"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage_from_source_advancement_counters",
            recipient: "runner",
            damageType: "net",
            amountPerCounter: 2,
            minimumAmount: 1,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "strategy_anchor", strategyKey: "corp.ambush_bluff" },
      {
        kind: "line_support",
        lineKey: "corp.ambush_bluff",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.damage_kill",
        support: "supports",
      },
      { kind: "strategic_role", role: "punish_payoff" },
      { kind: "plan_role", role: "remote_asset_trap" },
      {
        kind: "tactic_interpretation",
        signal: "access.punish",
        use: "access.punish",
      },
      {
        kind: "tactic_interpretation",
        signal: "remote.ambush",
        use: "remote.ambush",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "access_net_damage_payoff",
        confidence: "high",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "punish_payoff",
        roleDetail: "access_net_damage_payoff",
        confidence: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_348_virus-test-site",
      setId: "originalset-v1",
      collectorNumber: "348",
      rarity: "uncommon",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
