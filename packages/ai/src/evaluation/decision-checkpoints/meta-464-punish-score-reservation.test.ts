import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpPunishPreparationConflictsScoreServer } from "../../corp/punish/punish-preparation";
import { afterEach, expect, it } from "vitest";
import cp184 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-464-r1-g29-d184.json";
import cp185 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-464-r1-g29-d185.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
it.each([cp184, cp185])(
  "does not prepare a persistent punish asset in the reserved score root at state $stateVersion",
  (cp) => {
    const x = structuredClone(
      cp.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const rt = structuredClone(cp.runtime) as unknown as AiRuntimeCheckpointV1;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(x, x.ownDeckSnapshot!.deckSnapshotId, rt);
    restoreResidentPlanPortfolioMemorySnapshot(x, rt.residentPlanPortfolio!);
    const blocked = x.legalActions.filter(
      (a) =>
        a.source?.includes("city-surveillance") &&
        a.payload?.serverId === "remote_1" &&
        ["install_card", "rez_card"].includes(a.type),
    );
    expect(blocked.length).toBeGreaterThan(0);
    const decision = chooseAiAction(x);
    expect(blocked.map((a) => a.actionId)).not.toContain(decision.actionId);
    expect(
      x.legalActions.some(
        (a) =>
          a.actionId === decision.actionId &&
          a.expiresAtStateVersion === x.playerView.stateVersion,
      ),
    ).toBe(true);
    expect(decision.fallbackUsed).toBe(false);
    for (const p of residentPlanPortfolioSnapshot(x)!.instances.filter(
      (p) => p.moduleId === "corp.punish_campaign",
    )) {
      const s = p.moduleState as { signal?: { actionIds?: string[] } };
      if (
        s.signal?.actionIds?.some((id) =>
          blocked.some((a) => a.actionId === id),
        )
      ) {
        expect(p.viability).toBe("dormant");
        expect(p.executionState).toBe("idle");
      }
    }
  },
);

it("limits the root-slot reservation to conflicting persistent asset placement", () => {
  const x = structuredClone(
    cp184.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const candidates = buildActionSemanticCandidates({
    legalActions: x.legalActions,
    observerSide: "corp",
    stateVersion: x.playerView.stateVersion,
  });
  const city = candidates.filter(
    (c) =>
      c.sourceCardInstanceId?.includes("city-surveillance") &&
      c.semanticActionType === "install.card",
  );
  expect(city.length).toBeGreaterThan(1);
  for (const c of city) {
    const a = x.legalActions.find((a) => a.actionId === c.actionId)!;
    expect(
      corpPunishPreparationConflictsScoreServer(x, c, new Set(["remote_1"])),
    ).toBe(a.payload?.serverId === "remote_1");
    expect(corpPunishPreparationConflictsScoreServer(x, c, new Set())).toBe(
      false,
    );
  }
  const other = candidates.filter(
    (c) =>
      c.semanticActionType !== "install.card" &&
      c.semanticActionType !== "corp_window.rez",
  );
  expect(other.length).toBeGreaterThan(0);
  for (const c of other)
    expect(
      corpPunishPreparationConflictsScoreServer(x, c, new Set(["remote_1"])),
    ).toBe(false);
});
