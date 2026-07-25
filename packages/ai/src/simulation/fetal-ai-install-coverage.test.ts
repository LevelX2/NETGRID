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
    it(`keeps the exact preplanned Ambush install covered against ${runnerDeckId}`, () => {
      const summary = simulateAiGame({
        seed: "proteus-pilot-qualifier-02",
        maxActions: 4,
        runnerDeck: requireDeck(runnerDeckId),
        corpDeck,
        runnerControllerMode: "current_candidate",
        corpControllerMode: "current_candidate",
      });

      expect(summary.terminationKind).toBe("action_limit");
      expect(summary.errors).toEqual([]);
      expect(summary.runtimeFailures).toEqual([]);
      expect(summary.replayOk).toBe(true);
      expect(
        summary.actionSequence.find(
          (entry) => entry.stateVersionBefore === 3,
        ),
      ).toMatchObject({
        side: "corp",
        selectedActionId: "corp.install_card.new_remote",
        actionType: "install_card",
        reasonCode: "plan_first.corp.ambush_and_bluff",
        fallbackUsed: false,
        evidence: expect.arrayContaining([
          "plan_assessment_evidence:corp_ambush_preplanned_exact_install:onr_proteus_004_fetal-ai:new_remote:assigned_domain_plan",
          "plan_first_executor:plan:corp.ambush_and_bluff:ambush%3Acorp_onr_proteus_004_fetal-ai_2",
        ]),
      });
    });
  }

  it(
    "keeps the late prepared-score sibling from rejecting the exact Ambush install",
    () => {
      const summary = simulateAiGame({
        seed: "proteus-pilot-qualifier-01",
        maxActions: 171,
        runnerDeck: requireDeck(
          "proteus_runner_rd_bad_publicity_2026_05_25",
        ),
        corpDeck,
        runnerControllerMode: "current_candidate",
        corpControllerMode: "current_candidate",
      });

      expect(summary.terminationKind).toBe("action_limit");
      expect(summary.errors).toEqual([]);
      expect(summary.runtimeFailures).toEqual([]);
      expect(summary.replayOk).toBe(true);
      expect(
        summary.actionSequence.find(
          (entry) => entry.stateVersionBefore === 170,
        ),
      ).toMatchObject({
        side: "corp",
        selectedActionId: "corp.install_card.new_remote",
        actionType: "install_card",
        reasonCode: "plan_first.corp.ambush_and_bluff",
        fallbackUsed: false,
        evidence: expect.arrayContaining([
          "plan_assessment_evidence:corp_ambush_preplanned_exact_install:onr_proteus_004_fetal-ai:new_remote:assigned_domain_plan",
          "plan_first_executor:plan:corp.ambush_and_bluff:ambush%3Acorp_onr_proteus_004_fetal-ai_1",
        ]),
      });
    },
    30_000,
  );

  function requireDeck(deckId: string): DeckDefinition {
    const deck = decks.find((candidate) => candidate.id === deckId);
    if (!deck) throw new Error(`Missing Proteus test deck ${deckId}.`);
    return deck;
  }
});
