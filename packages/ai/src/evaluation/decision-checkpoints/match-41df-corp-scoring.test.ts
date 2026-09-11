import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { scoreRouteExposure } from "../../corp/score/score-route-risk";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Replay = {
  schemaVersion: string;
  stateVersion: number;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

function capture(index: number): Replay {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-41df-d${index}-score-replay.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

function decide(index: number) {
  const replay = capture(index);
  const input = replay.input;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    replay.runtime,
  );
  return { input, decision: chooseAiAction(input) };
}

describe("match 41df Corp scoring", () => {
  beforeEach(() => resetResidentPlanPortfolioMemory());

  it.each([19, 89, 91, 127, 172, 176, 210])(
    "validates actor-safe historical capture D%i",
    (index) => {
      const replay = capture(index);
      expect(replay.schemaVersion).toBe(
        "netgrid-ai-decision-checkpoint-replay-v1",
      );
      expect(Object.values(replay.validation).every(Boolean)).toBe(true);
      expect(replay.input.playerView.stateVersion).toBe(replay.stateVersion);
      expect(replay.input.side).toBe("corp");
      expect(replay.input.playerView.opponent).not.toHaveProperty("gripOrHq");
    },
  );

  it.each([19, 89, 91, 127, 172, 176, 210])(
    "records current legal selection at D%i",
    (index) => {
      const { input, decision } = decide(index);

      expect(
        input.legalActions.some(
          (action) => action.actionId === decision.actionId,
        ),
      ).toBe(true);
    },
  );

  it.each([
    [19, "rd"],
    [127, "hq"],
    [172, "hq"],
  ] as const)(
    "preserves scoring resources instead of redundant central ICE at D%i",
    (index, serverId) => {
      const { input, decision } = decide(index);
      const selected = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!;
      expect(
        selected.payload?.placement === "ice" &&
          selected.payload?.serverId === serverId,
      ).toBe(false);
    },
  );

  it("funds the known stopping ICE instead of a second non-stopping layer at D13", () => {
    const { decision } = decide(13);
    expect(decision.actionId).toBe("corp.gain_credit");
    expect(decision.reasonCode).toBe("plan_first.corp.economy");
  });

  it.each([false, true])(
    "continues the installed agenda at D91 with live commitment = %s",
    (live) => {
      const replay = capture(91);
      const input = replay.input;
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        replay.runtime,
      );
      if (live) {
        expect(
          replay.runtime.residentPlanPortfolio?.turnPlanCommitment,
        ).toBeDefined();
        restoreResidentPlanPortfolioMemorySnapshot(
          input,
          replay.runtime.residentPlanPortfolio,
        );
      }
      const decision = chooseAiAction(input);
      const selected = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!;
      expect(selected.type).toBe("advance_card");
      expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
    },
  );

  it("rejects D89's exposed install when three basic credit actions precede the next run", () => {
    const replay = capture(89);
    // Explicit counterfactual with the new Engine horizon; stored capture stays unchanged.
    const input = structuredClone(replay.input);
    input.playerView.runnerNextTurnCreditClicks = 3;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      replay.runtime,
    );
    const decision = chooseAiAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    )!;
    expect(
      selected.type === "install_card" &&
        selected.payload?.placement === "root" &&
        selected.payload?.serverId === "remote_2" &&
        input.playerView.own.gripOrHq.some(
          (card) =>
            card.instanceId === selected.source && card.type === "agenda",
        ),
    ).toBe(false);
  });
  it.each([
    [176, 9],
    [210, 23],
  ])(
    "compares unsafe emergency routes without inventing protection at D%i",
    (index, remaining) => {
      const { input, decision } = decide(index!);
      const selected = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      )!;
      const projects = residentPlanPortfolioSnapshot(input)!
        .instances.filter(
          (instance) => instance.moduleId === "corp.score_agenda",
        )
        .map(
          (instance) =>
            (instance.moduleState as { signal: CorpScoreProjectSignal }).signal,
        )
        .filter(
          (project) => project.phase === "install_agenda" && project.feasible,
        );
      expect(projects.length).toBeGreaterThan(1);
      for (const project of projects)
        expect(
          scoreRouteExposure(project, input.playerView.stateVersion),
        ).toMatchObject({
          knowledge: "known",
          probability: { numerator: 1, denominator: 1 },
        });
      const selectedProject = projects.find(
        (project) =>
          project.agendaInstanceId === selected.source &&
          project.serverId === selected.payload?.serverId,
      )!;
      expect(
        scoreRouteExposure(selectedProject, input.playerView.stateVersion),
      ).toMatchObject({
        knowledge: "known",
        runnerCreditsRemaining: remaining,
      });
      expect(selected.payload?.serverId).toBe("remote_2");
    },
  );
});
