import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import proteusDeckData from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { simulateAiGame } from "../simulation";

describe("Proteus Fetal AI install plan coverage", () => {
  const decks = proteusDeckData.decks as DeckDefinition[];
  const corpDeck = requireDeck("proteus_corp_antibody_tax_2026_05_25");

  for (const runnerDeckId of [
    "proteus_runner_hq_virus_derez_2026_05_25",
    "proteus_runner_rd_bad_publicity_2026_05_25",
  ]) {
    it(`covers both open centrals before optional Ambush development against ${runnerDeckId}`, () => {
      const summary = simulateAiGame({
        seed: "proteus-pilot-qualifier-02",
        maxActions: 6,
        runnerDeck: requireDeck(runnerDeckId),
        corpDeck,
        runnerControllerMode: "current_candidate",
        corpControllerMode: "current_candidate",
        aiDecisionRuntimeOptions: {
          runnerTurnPlannerMode: "legacy_compare",
        },
      });

      expect(summary.terminationKind, fetalDiagnostic(summary)).toBe(
        "action_limit",
      );
      expect(summary.errors).toEqual([]);
      expect(summary.runtimeFailures).toEqual([]);
      expect(summary.replayOk).toBe(true);
      expect(summary.actionSequence[3], fetalDiagnostic(summary)).toMatchObject(
        {
          side: "corp",
          selectedActionId: "corp.install_card.hq",
          actionType: "install_card",
          reasonCode: "plan_first.corp.defend_servers",
          fallbackUsed: false,
        },
      );
      expect(summary.actionSequence[4], fetalDiagnostic(summary)).toMatchObject(
        {
          side: "corp",
          selectedActionId: "corp.install_card.rd",
          actionType: "install_card",
          reasonCode: "plan_first.corp.defend_servers",
          fallbackUsed: false,
        },
      );
      const firstAmbushIndex = summary.actionSequence.findIndex(
        (entry) => entry.reasonCode === "plan_first.corp.ambush_and_bluff",
      );
      expect(firstAmbushIndex).toBeGreaterThan(4);
    });
  }

  it("installs the first-copy Ambush only after certified defense and economy routes", () => {
    const summary = simulateAiGame({
      seed: "proteus-pilot-qualifier-10",
      maxActions: 23,
      runnerDeck: requireDeck("proteus_runner_rd_bad_publicity_2026_05_25"),
      corpDeck,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      aiDecisionRuntimeOptions: {
        runnerTurnPlannerMode: "legacy_compare",
      },
    });

    expect(summary.terminationKind, fetalDiagnostic(summary)).toBe(
      "action_limit",
    );
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.replayOk).toBe(true);
    const admittedAmbushEvidence =
      "plan_scheduler:assess:validated:plan:corp.ambush_and_bluff:ambush%3Acorp_onr_proteus_004_fetal-ai_1%3Asetup%3Anew_remote";
    expect(
      summary.actionSequence.some((entry) =>
        entry.evidence.includes(admittedAmbushEvidence),
      ),
      fetalDiagnostic(summary),
    ).toBe(true);
    const selectedAmbushIndex = summary.actionSequence.findIndex(
      (entry) =>
        entry.reasonCode === "plan_first.corp.ambush_and_bluff" &&
        entry.selectedActionId === "corp.install_card.new_remote",
    );
    expect(selectedAmbushIndex, fetalDiagnostic(summary)).toBeGreaterThan(5);
    expect(
      summary.actionSequence[selectedAmbushIndex],
      fetalDiagnostic(summary),
    ).toMatchObject({
      reasonCode: "plan_first.corp.ambush_and_bluff",
      selectedActionId: "corp.install_card.new_remote",
    });
  }, 30_000);

  function requireDeck(deckId: string): DeckDefinition {
    const deck = decks.find((candidate) => candidate.id === deckId);
    if (!deck) throw new Error(`Missing Proteus test deck ${deckId}.`);
    return deck;
  }

  function fetalDiagnostic(summary: ReturnType<typeof simulateAiGame>): string {
    return JSON.stringify(
      {
        terminationKind: summary.terminationKind,
        errors: summary.errors,
        runtimeFailures: summary.runtimeFailures,
        actions: summary.actionSequence.map((entry, index) => ({
          index,
          side: entry.side,
          actionId: entry.selectedActionId,
          actionType: entry.actionType,
          reasonCode: entry.reasonCode,
          executor: entry.evidence.find((value) =>
            value.startsWith("plan_first_executor:"),
          ),
          ambushAssessment: entry.evidence.find((value) =>
            value.startsWith("plan_assessment_evidence:corp_ambush"),
          ),
        })),
      },
      undefined,
      2,
    );
  }
});
