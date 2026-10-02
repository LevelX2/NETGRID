import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-471-r4-g4-d44.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import { corpGenericDefensePriorityClass } from "../../plans/corp-defense-funding-contract";

const signals = checkpoint.runtime.residentPlanPortfolio.instances.find(
  (p) => p.moduleId === "corp.defend_servers",
)!.moduleState as unknown as { signals: CorpGenericDefenseSignal[] };
const remote = signals.signals.find((s) => s.parentKind === "remote")!;
const hq = signals.signals.find((s) => s.serverId === "hq")!;

it("keeps ordinary parent-bound remote staging at normal progress priority", () => {
  expect(remote.immediateInstallSupport).toBe(true);
  expect(corpGenericDefensePriorityClass([remote])).toBe("P6");
  expect(corpGenericDefensePriorityClass([{ ...remote, value: 10000 }])).toBe(
    "P6",
  );
});

it("preserves concrete material and terminal central protection priorities", () => {
  expect(corpGenericDefensePriorityClass([hq])).toBe("P3");
  expect(
    corpGenericDefensePriorityClass([
      { ...hq, urgent: true, centralPressure: "terminal" },
    ]),
  ).toBe("P2");
  expect(
    corpGenericDefensePriorityClass([{ ...hq, immediateInstallSupport: true }]),
  ).toBe("P3");
});

it("allocates the fully funded HQ stop before ordinary empty-remote prebuild in the real decision", () => {
  expect(Object.values(checkpoint.validation).every((v) => v === true)).toBe(
    true,
  );
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(checkpoint.runtime) as unknown as AiRuntimeCheckpointV1,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(hq.actionIds![0]);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:corp.defend_servers:server-defense-portfolio",
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe("plan:corp.defend_servers:server-defense-portfolio");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
});
