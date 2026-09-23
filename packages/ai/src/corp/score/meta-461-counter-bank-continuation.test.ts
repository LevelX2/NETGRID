import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
function fixture(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r5-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
afterEach(resetResidentPlanPortfolioMemory);
describe("meta 461 counter-bank current-turn conversion", () => {
  it("keeps the original funded first agenda install", () => {
    const input = fixture("g10-d138"),
      result = chooseAiAction(input);
    expect(result).toMatchObject({
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:corp.score_agenda:counter-bank%3Ahandoff%3Acorp_onr_v1_347_vapor-ops_2%3Acorp_onr_proteus_008_project-zurich_1%3Aremote_1%3Anew_remote",
        },
      },
    });
    expect(
      input.legalActions.find((a) => a.actionId === result.actionId),
    ).toMatchObject({
      type: "install_card",
      source: "corp_onr_proteus_008_project-zurich_1",
      payload: { serverId: "new_remote" },
    });
  });
  it("rezzes for the existing agenda instead of exposing a second consumer of the same counters", () => {
    const input = fixture("g10-d139"),
      rez = input.legalActions.find(
        (a) =>
          a.type === "rez_card" && a.source === "corp_onr_v1_347_vapor-ops_2",
      )!,
      result = chooseAiAction(input);
    expect(result).toMatchObject({
      actionId: rez.actionId,
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:corp.score_agenda:counter-bank%3Arez-handoff%3Acorp_onr_v1_347_vapor-ops_2%3Acorp_onr_proteus_008_project-zurich_1%3Aremote_1%3Aremote_2",
          route: {
            actionId: rez.actionId,
            stateVersion: input.playerView.stateVersion,
          },
        },
      },
    });
  });
  it("uses a funded winning handoff even when the bank cannot survive another Runner turn", () => {
    const input = fixture("g40-d203"),
      result = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === result.actionId,
    )!;
    expect(action).toMatchObject({
      type: "install_card",
      source: "corp_onr_proteus_008_project-zurich_2",
      payload: { serverId: "new_remote" },
    });
    expect(result).toMatchObject({
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:corp.score_agenda:counter-bank%3Ahandoff%3Acorp_onr_v1_347_vapor-ops_3%3Acorp_onr_proteus_008_project-zurich_2%3Aremote_1%3Anew_remote",
          priority: { effectiveClass: "P1" },
          route: {
            actionId: action.actionId,
            stateVersion: input.playerView.stateVersion,
          },
        },
      },
    });
  });
});
