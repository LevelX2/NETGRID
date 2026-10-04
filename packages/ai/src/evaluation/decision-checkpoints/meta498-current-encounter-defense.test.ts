import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

describe("native current encounter defense (SP-528)", () => {
  it("replaces the restored zero-effect rez with the exact legal defense pass", () => {
    resetResidentPlanPortfolioMemory();
    const native = JSON.parse(
      readFileSync(
        new URL("./fixtures/meta498-sp527-control-d21.json", import.meta.url),
        "utf8",
      ),
    ) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
      validation: Record<string, boolean>;
    };
    expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
    const input = { ...native.input, ...buildAiDecisionInputDto(native.input) };
    const source = input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!;
    expect(source.effectivePostRezRunQuote).toMatchObject({
      complete: true,
      expiresAtStateVersion: input.playerView.stateVersion,
      effectiveRunQuote: { subroutines: [] },
    });
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      native.runtime,
    );
    const decision = chooseAiAction(input);
    const decline = input.legalActions.find((a) => a.type === "decline_rez")!;
    expect(decision.actionId).toBe(decline.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      leafExecutorInstanceId:
        "plan:corp.defend_servers:server-defense-portfolio",
    });
  });
});
