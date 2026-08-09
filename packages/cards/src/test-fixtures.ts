import type { CardDefinitionId } from "@netgrid/shared";
import type { CardSpec } from "./contracts";

export function minimalCardSpec(): CardSpec {
  return {
    schemaVersion: "card-spec-v1",
    identity: {
      cardDefinitionId: "test_card" as CardDefinitionId,
      title: "Test Card",
      side: "runner",
      cardType: "event",
    },
    text: {
      schemaVersion: "canonical-card-text-v1",
      rulesText: "Gain credits.",
    },
    rules: {
      schemaVersion: "card-rules-v1",
      references: [{ source: "card_text", reference: "printed" }],
    },
    engine: {
      schemaVersion: "card-mechanical-spec-v1",
      characteristics: {
        faction: "neutral_demo",
        subtypes: [],
        numeric: {
          installCost: null,
          memoryCost: null,
          rezCost: null,
          trashCost: null,
          advancementRequirement: null,
          agendaPoints: null,
        },
        playCost: { kind: "fixed", credits: 0 },
        strength: { kind: "not_applicable" },
      },
    },
    printings: [
      {
        schemaVersion: "printing-spec-v1",
        printingId: "test_card:first",
        setId: "testset",
      },
    ],
    publication: {
      schemaVersion: "card-publication-v1",
      status: "experimental",
    },
  };
}
