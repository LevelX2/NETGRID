import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_121_remote-detonator"),
    title: "Remote Detonator",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if you made a successful run on a data fort this turn. Trash all rezzed ice on that fort, and the Corp gives you three tags.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_121_remote-detonator",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sabotage"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 7,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "on_play_trash_last_run_fort_ice_add_tags",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_made_successful_run_on_server_this_turn",
          server: "any_data_fort",
        },
        effects: [
          {
            kind: "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
            tagAmount: 3,
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
        role: "remote_ice_sabotage",
      },
      {
        kind: "strategic_exchange",
        exchange: "self_tag",
      },
      {
        kind: "risk_interpretation",
        risk: "self_tag",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "credit_reserve_cost",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_121_remote-detonator",
      setId: "proteus",
      collectorNumber: "P121",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
