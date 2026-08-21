import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_137_death-from-above"),
    title: "Death from Above",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Trash, at no cost, all cards installed in a subsidiary data fort, even if they cannot normally be trashed. Use this ability only when you have just successfully made a run on that fort, and before accessing cards from that fort. Hidden resources are installed face down, but are put into the trash face up.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_137_death-from-above",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["hidden", "sabotage"],
      numeric: {
        installCost: 0,
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
    successfulRunFollowups: [
      {
        capabilityKey: capabilityKey(
          "remote_success_reveal_trash_source_and_fort",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "successful_run_before_access_effect",
        timing: "immediately_after_successful_run_before_access",
        server: "remote",
        source: "installed_hidden_runner_resource",
        cost: {
          kind: "reveal_and_trash_source",
        },
        effect: {
          kind: "trash_remote_fort",
          include: "root",
        },
        visibility: "hidden_info_barrier",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_scoring_denial",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.remote_trash",
      },
      {
        kind: "line_support",
        lineKey: "runner.remote_contest",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "runner.remote_trash",
        support: "supports",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_137_death-from-above",
      setId: "proteus",
      collectorNumber: "P137",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
