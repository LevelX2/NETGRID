import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_078_armageddon"),
    title: "Armageddon",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each successful run on R&D, you may choose to give the Corp a Doom counter instead of accessing cards from R&D. Each Doom counter forces the Corp to roll a die whenever it installs a card. On a 6, the card is trashed after it is installed, and the Corp removes a Doom counter. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_078_armageddon",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["random", "virus"],
      numeric: {
        installCost: 1,
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
    successfulRunFollowups: [
      {
        capabilityKey: capabilityKey(
          "successful_rd_run_skip_access_add_doom_counter",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "skip_rd_access_add_purgeable_runner_virus_counter",
        counterType: "doom",
        amount: 1,
        cost: "none",
        visibility: "public",
      },
    ],
    virusCounter: {
      capabilityKey: capabilityKey("doom_counter_corp_install_roll"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "doom",
      onCorpInstall: {
        kind: "roll_per_counter_trash_installed_card_and_remove_counter_on_success",
        counterSource: "corp_purgeable_runner_virus_counter",
        dieSize: 6,
        successDieValue: 6,
        removeCounterPerSuccess: 1,
        visibility: "public",
      },
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
        role: "safe_probe_run",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_078_armageddon",
      setId: "proteus",
      collectorNumber: "P078",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
