import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r7-g4-d143.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([false, true])(
  "keeps other install modes classified when handing development to Sentry coverage (resume=%s)",
  (resume) => {
    const input = structuredClone(
      checkpoint.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const runtime = structuredClone(
      checkpoint.runtime,
    ) as unknown as AiRuntimeCheckpointV1;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    if (resume)
      restoreResidentPlanPortfolioMemorySnapshot(
        input,
        runtime.residentPlanPortfolio!,
      );
    const decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(decision.fallbackUsed).toBe(false);
    expect(action.type).toBe("start_run");
    expect(
      decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toBe("pa90fufw9vc5bkshp96ztlryxl");
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: 142,
      stepId: "pa90fufw9vc5bkshp96ztlryxl:pressure:rd",
    });
    const modes = input.legalActions.filter(
      (a) =>
        a.type === "install_card" &&
        a.payload?.cardId === "cxd" &&
        !a.payload.runnerProgramTrashBeforeInstall,
    );
    expect(modes).toHaveLength(3);
    const development = residentPlanPortfolioSnapshot(input)!.instances.find(
      (instance) =>
        instance.instanceId ===
        "pdyonmjhtxxvvyqdpb1jw71txs",
    );
    expect(development?.moduleState).toMatchObject({
      kind: "development",
      signal: {
        assignedDomainPlanIds: [],
        actionIds: modes
          .filter((a) => a.payload?.selectedSubtype !== "sentry")
          .map((a) => a.actionId),
      },
    });
  },
);
