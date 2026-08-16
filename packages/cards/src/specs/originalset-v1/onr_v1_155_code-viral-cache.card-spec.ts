import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_155_code-viral-cache"),
    title: "Code Viral Cache",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if you made a successful run on HQ this turn. If the Corp forgoes actions to lose Virus counters, two counters of your choice are not removed. The Corp may trash Code Viral Cache by taking an action to pay [5].",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_155_code-viral-cache",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: 1,
        memoryCost: null,
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
    installCapabilities: [
      {
        kind: "runner_made_successful_run_on_server_this_turn",
        server: "hq",
        visibility: "public",
      },
    ],
    hiddenReplacementLongtail: {
      capabilityKey: capabilityKey(
        "hidden_replacement_longtail_purge_replacement_with_runner_virus_counter_cleanup",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "purge_replacement_with_runner_virus_counter_cleanup",
      visibility: "hidden_info_barrier",
    },
    corpTrashInstalledRunnerSource: {
      capabilityKey: capabilityKey(
        "corp_trash_installed_runner_source_corp_trash_installed_runner_resource",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_trash_installed_runner_resource",
      timing: "corp_main",
      cost: {
        clicks: 1,
        credits: 5,
      },
      target: "source",
      visibility: "public",
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
        kind: "plan_role",
        role: "protect_virus_counters",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "hidden_replacement_longtail_purge_replacement_with_runner_virus_counter_cleanup",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "preserve_two_high_value_virus_counters",
            preferences: [
              "virus_counter_enables_current_plan",
              "virus_counter_near_activation_threshold",
              "virus_counter_high_access_or_damage_payoff",
            ],
            avoid: ["replaceable_or_inactive_virus_counter"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_155_code-viral-cache",
      setId: "originalset-v1",
      collectorNumber: "155",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
