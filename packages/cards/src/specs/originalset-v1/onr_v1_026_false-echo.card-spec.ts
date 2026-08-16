import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_026_false-echo"),
    title: "False Echo",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[2]: The Corp must rez as much ice as possible on a fort, beginning with the outermost ice and working in. Use this ability only after a successful run on that fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_026_false-echo",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: 0,
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
          "successful_run_followups_force_rez_ice_outermost_inward_after_successful_run",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "force_rez_ice_outermost_inward_after_successful_run",
        cost: {
          kind: "credit",
          amount: 2,
        },
        visibility: "hidden_info_barrier",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_026_false-echo",
      setId: "originalset-v1",
      collectorNumber: "026",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
