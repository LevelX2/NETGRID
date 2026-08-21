import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_099_viral-pipeline"),
    title: "Viral Pipeline",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each successful run on Archives, HQ, or R&D, put a Socket counter in that data fort. Socket counter from Archives, Socket counter from HQ, and Socket counter from R&D: Give the Corp a Pipe counter. Each Pipe counter causes the Corp to forgo an action at the start of each of its turns. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("convert_socket_set_to_pipe_counter"),
        actionLabel: "Viral Pipeline: Socket-Counter in Pipe umwandeln",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_099_viral-pipeline",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["virus"],
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
    virusCounter: {
      capabilityKey: capabilityKey("central_success_add_socket_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "pipe",
      addOnSuccessfulRun: {
        server: "central",
        counterScope: { kind: "attacked_central_server_pool" },
        amount: 1,
        visibility: "public",
      },
      startOfCorpTurn: {
        kind: "forgo_actions_per_counter",
        counterSource: "corp_purgeable_runner_virus_counter",
        amountPerCounter: 1,
        visibility: "public",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("convert_socket_set_to_pipe_counter"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_paid",
        costs: [
          {
            kind: "corp_purgeable_runner_virus_counter",
            counterType: "socket_archives",
            server: "archives",
            amount: 1,
          },
          {
            kind: "corp_purgeable_runner_virus_counter",
            counterType: "socket_hq",
            server: "hq",
            amount: 1,
          },
          {
            kind: "corp_purgeable_runner_virus_counter",
            counterType: "socket_rd",
            server: "rd",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "add_corp_purgeable_runner_virus_counter",
            counterType: "pipe",
            amount: 1,
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
        role: "multi_central_virus_pressure",
      },
      {
        kind: "plan_role",
        role: "corp_action_denial",
      },
      { kind: "strategic_role", role: "engine_piece" },
      {
        kind: "risk_interpretation",
        risk: "virus_purge_risk",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_099_viral-pipeline",
      setId: "proteus",
      collectorNumber: "P099",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
