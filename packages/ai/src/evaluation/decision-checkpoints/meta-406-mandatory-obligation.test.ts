import { expect, it } from "vitest";
import g10 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-406-obligation-g10.json";
import g12 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-406-obligation-g12.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";
import { currentCorpCreditObligation } from "../../plans/corp-credit-obligation";

it.each([
  ["last-click spending", g10],
  ["purge instead of funding", g12],
] as const)(
  "SP-300 prevents terminal payment failure from %s",
  (_label, checkpoint) => {
    const { input, runtime } = structuredClone(checkpoint) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe("corp.gain_credit");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      route: {
        actionId: decision.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toMatch(/^plan:corp\.economy:/);
  },
);

it("preserves only the typed current obligation in the AI input and rejects stale facts", () => {
  const input = structuredClone(
    g12.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const dto = buildAiDecisionInputDto({
    ...input,
    profileId: input.profileId!,
  });
  expect(dto.playerView.own.corpEndTurnCreditObligation).toEqual(
    input.playerView.own.corpEndTurnCreditObligation,
  );
  input.playerView.own.corpEndTurnCreditObligation!.expiresAtStateVersion--;
  expect(() =>
    buildAiDecisionInputDto({ ...input, profileId: input.profileId! }),
  ).toThrow(/obligation/);
});

it("keeps multi-obligation funding reachable and does not impose the Corp deadline in a Runner turn", () => {
  const { input, runtime } = structuredClone(g12) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  input.playerView.own.corpEndTurnCreditObligation!.creditsDue = 2;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(chooseAiAction(input).actionId).toBe("corp.gain_credit");
  input.playerView.activeSide = "runner";
  expect(currentCorpCreditObligation(input)).toBeUndefined();
});
