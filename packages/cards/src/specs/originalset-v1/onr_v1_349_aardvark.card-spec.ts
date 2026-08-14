import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_349_aardvark"),
    title: "Aardvark",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Runner cannot use worms during runs on this fort. If Runner uses a worm during a run on this fort before Aardvark is rezzed, you may rez Aardvark to trash that worm, and any bits spent using that worm on the current piece of ice are lost to no effect. Runner may then use further icebreakers to break the ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_349_aardvark",
      },
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
        rezCost: 0,
        trashCost: 4,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    fortRunWindows: [
      {
        capabilityKey: capabilityKey(
          "fort_run_windows_aardvark_worm_lock_and_reaction_during_run_on_this_fort",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "aardvark_worm_lock_and_reaction",
        timing: "during_run_on_this_fort",
        blocks: "runner_worm_icebreaker_use",
        reaction: "rez_to_trash_worm_and_cancel_current_use",
        visibility: "hidden_info_barrier",
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
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_349_aardvark",
      setId: "originalset-v1",
      collectorNumber: "349",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
