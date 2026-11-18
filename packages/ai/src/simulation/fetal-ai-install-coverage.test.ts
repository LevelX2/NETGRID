import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import proteusDeckData from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { simulateAiGame } from "../simulation";
import { planInstanceIdForProposal } from "../plans/plan-instance";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

describe("Proteus Fetal AI install plan coverage", () => {
  const decks = proteusDeckData.decks as DeckDefinition[];
  const corpDeck = requireDeck("proteus_corp_antibody_tax_2026_05_25");

  for (const runnerDeckId of [
    "proteus_runner_hq_virus_derez_2026_05_25",
    "proteus_runner_rd_bad_publicity_2026_05_25",
  ]) {
    it(`covers both open centrals without donating a nonlethal agenda Ambush against ${runnerDeckId}`, () => {
      let opening: AiSimulationDecisionCheckpointCapture | undefined;
      const summary = simulateAiGame({
        seed: "proteus-fetal-central-coverage-21",
        maxActions: 6,
        runnerDeck: requireDeck(runnerDeckId),
        corpDeck,
        runnerControllerMode: "current_candidate",
        corpControllerMode: "current_candidate",
        aiDecisionRuntimeOptions: {
          runnerTurnPlannerMode: "legacy_compare",
        },
        testOnlyDecisionCheckpointCapture: {
          actionIndices: [3],
          capture: (snapshot) => {
            opening = snapshot;
          },
        },
      });

      expect(opening?.side).toBe("corp");
      const openingHq = opening?.input.playerView.own.gripOrHq ?? [];
      expect(openingHq.map((card) => card.definitionId)).toContain(62);
      expect(
        openingHq.filter((card) => card.type === "ice").length,
      ).toBeGreaterThanOrEqual(2);
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
      expect(firstAmbushIndex).toBe(-1);
    });
  }

  it("does not donate Fetal AI while the score remote still lacks certified defense [legacy_compare]", () => {
    const fetalAssessmentEvidence = new Set<string>();
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
      testOnlyDecisionCheckpointCapture: {
        actionIndices: Array.from({ length: 23 }, (_, index) => index),
        capture: (snapshot) => {
          if (snapshot.side !== "corp") return;
          for (const card of snapshot.input.playerView.own.gripOrHq) {
            if (card.definitionId !== 62) continue;
            const dedupeKey = `ambush:${card.instanceId}`;
            const destinations = [
              "new_remote",
              ...snapshot.input.playerView.servers.map((server) => server.id),
            ];
            for (const key of [
              dedupeKey,
              ...destinations.map((server) => `${dedupeKey}:setup:${server}`),
            ]) {
              const id = planInstanceIdForProposal({
                moduleId: "corp.ambush_and_bluff",
                dedupeKey: key,
              });
              fetalAssessmentEvidence.add(`plan_scheduler:assess:validated:${id}`);
            }
          }
        },
      },
    });

    expect(summary.terminationKind, fetalDiagnostic(summary)).toBe(
      "action_limit",
    );
    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(fetalAssessmentEvidence.size, fetalDiagnostic(summary)).toBeGreaterThan(0);
    expect(
      summary.actionSequence.some((entry) =>
        entry.evidence.some((value) => fetalAssessmentEvidence.has(value)),
      ),
      fetalDiagnostic(summary),
    ).toBe(false);
    const selectedAmbushIndex = summary.actionSequence.findIndex(
      (entry) =>
        entry.reasonCode === "plan_first.corp.score_agenda" &&
        entry.selectedActionId === "corp.install_card.new_remote",
    );
    expect(selectedAmbushIndex, fetalDiagnostic(summary)).toBe(-1);
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
