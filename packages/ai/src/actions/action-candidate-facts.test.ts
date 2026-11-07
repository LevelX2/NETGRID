import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { legalAction } from "../semantic-ai-runtime-cutover.test-support";
import {
  candidateTargetIds,
  exactBasicLiquidCreditCandidate,
} from "./action-candidate-facts";

describe("shared action candidate facts", () => {
  it.each(["runner", "corp"] as const)(
    "accepts only exact basic liquid credits for %s",
    (side) => {
      const [candidate] = buildActionSemanticCandidates({
        legalActions: [
          legalAction(
            `${side}.gain_credit`,
            side,
            "gain_credit",
            "Credit",
            { credits: 0, clicks: 1 },
            { source: "basic_action" },
          ),
        ],
        observerSide: side,
        stateVersion: 1,
      });
      expect(exactBasicLiquidCreditCandidate(candidate!)).toBe(true);
      for (const changed of [
        { ...candidate!, sourceKind: "card" as const },
        {
          ...candidate!,
          costProfile: { ...candidate!.costProfile, creditCost: 1 },
        },
        {
          ...candidate!,
          economyProjection: {
            ...candidate!.economyProjection!,
            creditRestriction: "restricted" as const,
          },
        },
        {
          ...candidate!,
          economyProjection: {
            ...candidate!.economyProjection!,
            cardsConsumed: 1,
          },
        },
        {
          ...candidate!,
          economyProjection: {
            ...candidate!.economyProjection!,
            reliability: "conditional" as const,
          },
        },
      ])
        expect(exactBasicLiquidCreditCandidate(changed)).toBe(false);
    },
  );

  it("keeps selected targets ahead of unselected alternatives and retains the projected server", () => {
    const action = legalAction("run", "runner", "start_run", "Run", {
      credits: 0,
      clicks: 1,
    });
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: 1,
      selectedTargetsByActionId: { run: { server: "hq" } },
      availableTargetsByActionId: {
        run: [
          {
            targetId: "rd",
            targetKind: "server",
            targetSide: "corp",
            evidence: [],
          },
          {
            targetId: "archives",
            targetKind: "server",
            targetSide: "corp",
            evidence: [],
          },
        ],
      },
    });
    candidate!.runProjectionSummary = {
      serverId: "remote_1",
      source: "run_action_projection",
      evidence: [],
    };
    expect(candidateTargetIds(candidate!)).toEqual(["hq", "remote_1"]);
    candidate!.targetContext!.selectedTargets = [];
    expect(candidateTargetIds(candidate!)).toEqual([
      "rd",
      "archives",
      "remote_1",
    ]);
    delete candidate!.targetContext;
    expect(candidateTargetIds(candidate!)).toEqual(["remote_1"]);
  });
});
