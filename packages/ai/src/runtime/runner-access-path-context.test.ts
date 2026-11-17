import { describe, expect, it } from "vitest";
import { withEffectiveRunQuote } from "../effective-run-quote.test-support";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { currentEncounteredIceCard } from "./current-encounter";
import { createRunnerAccessPathContext } from "./runner-access-path-context";
import { isRemoteServerTarget } from "./server-target";

const context = createRunnerAccessPathContext({
  breakSubroutineIndexesForAction: (action) =>
    new Set(
      typeof action.payload?.subroutineIndex === "number"
        ? [action.payload.subroutineIndex]
        : [],
    ),
  currentEncounteredIceCard,
  actionCreditCost: (action) =>
    action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
  assessKnownRezzedIcePath,
  knownIcePathReason: () => "path",
  isRemoteServerTarget,
  definitionType: (id) =>
    id === "onr_v1_366_red-herrings" ? "upgrade" : "asset",
  remoteRootTrashCost: (card) => card.trashCost,
});

describe("Runner encounter remote payoff", () => {
  it("checks remaining access credits after paying all current mandatory breaks", () => {
    const first = legalAction(
      "break-first",
      "runner",
      "break_subroutine",
      "Break",
      {
        credits: 1,
      },
      { payload: { subroutineIndex: 0 } },
    );
    const second = legalAction(
      "break-second",
      "runner",
      "break_subroutine",
      "Break",
      {
        credits: 3,
      },
      { payload: { subroutineIndex: 1 } },
    );
    const cont = legalAction(
      "continue",
      "runner",
      "continue_run",
      "Continue",
      {
        credits: 0,
      },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 2,
          encounterSubroutineIds: "first,second",
        },
      },
    );
    const input = aiInput("runner", [first, second, cont]);
    input.playerView.own.credits = 6;
    input.playerView.traceRulesProfile = "modern_open";
    const ice = withEffectiveRunQuote(
      visibleCard("wall", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezzed: true,
      }),
      {
        effectiveStrength: 0,
        subroutines: [
          { id: "first", type: "end_the_run" },
          { id: "second", type: "end_the_run" },
        ],
      },
    );
    input.playerView.servers = [
      server(
        "remote_1",
        [ice],
        [
          visibleCard("campaign", "corp", "asset", {
            definitionId: "onr_v1_326_holovid-campaign",
            counters: { bit: 5 },
            rezzed: true,
            trashCost: 4,
          }),
        ],
      ),
    ];
    input.playerView.run = {
      runId: "run_1",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      encounteredIce: ice,
      successful: false,
    };

    expect(context.breakAccessPathAssessment(input, first)).toMatchObject({
      canPreserveAccessPath: false,
      evidence: expect.arrayContaining([
        "encounter_credits_after_access_path:2",
      ]),
    });
  });

  it("uses the independently quoted cheaper breaker for a remaining mandatory break", () => {
    const first = legalAction(
      "costly-break",
      "runner",
      "break_subroutine",
      "Break",
      { credits: 3 },
      {
        source: "costly-breaker",
        payload: { subroutineIndex: 0, breakerId: "costly-breaker" },
      },
    );
    const second = legalAction(
      "cheap-break",
      "runner",
      "break_subroutine",
      "Break",
      { credits: 1 },
      {
        source: "cheap-breaker",
        payload: { subroutineIndex: 1, breakerId: "cheap-breaker" },
      },
    );
    const cont = legalAction(
      "after-breaks",
      "runner",
      "continue_run",
      "Continue",
      { credits: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 2,
          encounterSubroutineIds: "first,second",
        },
      },
    );
    const input = aiInput("runner", [first, second, cont]);
    const ice = withEffectiveRunQuote(
      visibleCard("wall", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezzed: true,
      }),
      {
        effectiveStrength: 0,
        subroutines: [
          { id: "first", type: "end_the_run" },
          { id: "second", type: "end_the_run" },
        ],
      },
    );
    input.playerView.traceRulesProfile = "modern_open";
    input.playerView.own.credits = 4;
    input.playerView.servers = [server("rd", [ice])];
    input.playerView.run = {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: ice,
      successful: false,
    };
    expect(context.breakAccessPathAssessment(input, first)).toMatchObject({
      canPreserveAccessPath: true,
      evidence: expect.arrayContaining(["break_credits_after:0"]),
    });
  });

  it("keeps reachable access when a different visible root has a payoff", () => {
    const input = aiInput("runner", []);
    input.playerView.own.credits = 18;
    expect(
      context.encounterRemotePayoffAfterBreakAssessment(
        input,
        server(
          "remote_1",
          [],
          [
            visibleCard("empty-campaign", "corp", "asset", {
              definitionId: "onr_v1_326_holovid-campaign",
              counters: { bit: 0 },
              rezzed: true,
              trashCost: 4,
            }),
            visibleCard("tax", "corp", "upgrade", {
              definitionId: "onr_v1_366_red-herrings",
              rezzed: true,
              trashCost: 5,
            }),
          ],
        ),
        [{ id: "etr", type: "end_the_run" }],
        18,
        0,
      ).blocksBreak,
    ).toBe(false);
  });
});
