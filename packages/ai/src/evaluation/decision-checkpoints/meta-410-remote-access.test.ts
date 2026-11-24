import { bindSyntheticAgendaStealQuotes } from "../../agenda-steal-quotes.test-support";
import { describe, expect, it } from "vitest";
import replacementJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-410-replaced-root-d351.json";
import trashJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-410-trash-payoff-d400.json";
import agendaJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-410-agenda-decline-d463.json";
import { reconstructBeliefState } from "../../belief-state";
import { evaluateKnownRemoteAccessPayoff } from "../../known-remote-access-payoff";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { assessRunnerAccessTrashImpact } from "../../runner/run-window/runner-access-trash-impact";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

function capture(json: unknown) {
  return structuredClone(json) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function choose(json: unknown) {
  const { input, runtime } = capture(json);
  if (json === replacementJson)
    bindSyntheticAgendaStealQuotes(input, "r1", 0, {});
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input, { runnerTurnPlannerMode: "cutover" });
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  expect(result.fallbackUsed).toBe(false);
  expect(
    result.decisionDebug?.planFirstDecision?.selectedStep?.planInstanceId,
  ).toBe(result.decisionDebug?.planFirstDecision?.selectedPlan?.instanceId);
  return result;
}

describe("meta 410 current remote identity and access purpose", () => {
  it.each([true, false])(
    "preserves shifted upgrade memory only with an observed lower prefix (%s)",
    (knownPrefix) => {
      const { input } = capture(replacementJson);
      const asset = structuredClone(
        input.eventTail.find(
          (e) => e.type === "access_card" && e.stateVersionAfter === 334,
        )!,
      );
      const replacement = structuredClone(
        input.eventTail.find(
          (e) => e.publicPayload.rootReplacement === "asset_to_agenda",
        )!,
      );
      const upgrade = {
        ...structuredClone(asset),
        eventId: 336,
        stateVersionAfter: 335,
        publicPayload: {
          ...asset.publicPayload,
          cardDefinitionId: 578,
          accessedCardPositionKey: "root:1",
          installedPositionKey: "test-upgrade-position",
        },
      };
      input.eventTail = [...(knownPrefix ? [asset] : []), upgrade, replacement];
      input.playerView.publicEvents = [];
      const roots = reconstructBeliefState(
        input,
      ).runnerOpponentModel!.knownPositionMemory.filter(
        (x) => x.zone === "r1" && x.positionKey.startsWith("root:"),
      );
      expect(roots.map((x) => [x.positionKey, x.definitionId])).toEqual(
        knownPrefix ? [["root:0", 578]] : [],
      );
    },
  );

  it("invalidates the old asset observation after the public agenda replacement", () => {
    const { input } = capture(replacementJson);
    expect(
      input.eventTail.some(
        (e) => e.publicPayload.rootReplacement === "asset_to_agenda",
      ),
    ).toBe(true);
    expect(
      input.playerView.servers.find((s) => s.id === "r1")!.root[0]!.known,
    ).toBe(false);
    const belief = reconstructBeliefState(input);
    expect(
      belief.runnerOpponentModel?.knownPositionMemory.filter(
        (x) => x.zone === "r1" && x.positionKey.startsWith("root:"),
      ),
    ).toEqual([]);
    expect(
      evaluateKnownRemoteAccessPayoff(input, "r1", belief)
        .knownNoCurrentPayoff,
    ).toBe(false);
  });

  it("lets the existing contest owner use the payable last-click threat route", () => {
    const result = choose(replacementJson);
    expect(result.actionId).toBe("rs.r1");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.contest_remote");
  });

  it("does not repeat a known trash target whose access conversion declines unchanged costs", () => {
    const result = choose(trashJson);
    expect(result.actionId).toBe("rb");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.economy");
  });

  it("does not apply trash valuation to the decline side of an agenda steal", () => {
    const { input } = capture(agendaJson);
    const decline = input.legalActions.find((a) => a.type === "decline_trash")!;
    expect(
      input.legalActions.some((a) => a.type === "trash_accessed_card"),
    ).toBe(false);
    expect(
      assessRunnerAccessTrashImpact({
        input,
        trashAction: decline,
        economyReserve: 12,
      }),
    ).toBeUndefined();
    const result = choose(agendaJson);
    expect(result.actionId).toContain("rt.");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.convert_run_window");
    expect(result.decisionDebug?.planFirstDecision?.selectedStep?.stepId).toBe(
      `${result.decisionDebug?.planFirstDecision?.selectedPlan?.instanceId}:convert`,
    );
  });
});
