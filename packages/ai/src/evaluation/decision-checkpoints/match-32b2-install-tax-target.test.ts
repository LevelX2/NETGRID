import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerInstallTaxTarget } from "../../runner/hand-development/ice-install-tax-target";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const capture = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-32b2-d45-ice-install-tax-target.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

afterEach(resetResidentPlanPortfolioMemory);

describe("match 32b2 D45 ICE install-tax target", () => {
  it("binds the legal HQ install instead of the equally priced Archives install", () => {
    const { input, runtime, validation } = structuredClone(capture);
    expect(Object.values(validation).every(Boolean)).toBe(true);
    expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );

    const decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (offer) => offer.actionId === decision.actionId,
    );
    expect(action).toMatchObject({
      type: "install_card",
      payload: {
        cardId: "runner_onr_v1_173_restrictive-net-zoning_1",
        selectedServerId: "hq",
      },
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.develop_board_and_hand");
    expect(decision.fallbackUsed).toBe(false);
  });

  it.each([false, true])(
    "treats Archives as a worthwhile tax target only with a visible agenda (%s)",
    (visibleAgenda) => {
      const { input } = structuredClone(capture);
      const archives = input.playerView.servers.find(
        (server) => server.id === "archives",
      )!;
      if (visibleAgenda) {
        archives.root.push({
          instanceId: "faceup-archives-agenda",
          known: true,
          type: "agenda",
          agendaPoints: 2,
        });
        input.playerView.opponent.discardCount! += 1;
      }
      const source = "runner_onr_v1_173_restrictive-net-zoning_1";
      const candidates = buildActionSemanticCandidates(input).filter(
        (entry) =>
          entry.actionType === "install_card" &&
          entry.sourceCardInstanceId === source,
      );
      const archivesOffer = input.legalActions.find(
        (offer) =>
          offer.source === source &&
          offer.payload?.selectedServerId === "archives",
      )!;
      const archivesOnly = candidates.filter(
        (entry) => entry.actionId === archivesOffer.actionId,
      );
      expect(
        runnerInstallTaxTarget(
          input,
          "onr_v1_173_restrictive-net-zoning",
          archivesOnly,
          [],
        ),
      ).toEqual(
        visibleAgenda
          ? {
              target: {
                actionId: archivesOffer.actionId,
                serverId: "archives",
              },
            }
          : {},
      );
      expect(
        runnerInstallTaxTarget(
          input,
          "onr_v1_173_restrictive-net-zoning",
          candidates,
          [],
        )?.target?.serverId,
      ).toBe(visibleAgenda ? "archives" : "hq");
    },
  );

  it("prefers a visible scoring remote over the open central server", () => {
    const { input } = structuredClone(capture);
    const remote = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!;
    remote.root.push({
      instanceId: "faceup-remote-agenda",
      known: true,
      type: "agenda",
      agendaPoints: 2,
    });
    const definitionId = "onr_v1_173_restrictive-net-zoning";
    const candidates = buildActionSemanticCandidates(input).filter(
      (entry) =>
        entry.actionType === "install_card" &&
        entry.sourceCardInstanceId ===
          "runner_onr_v1_173_restrictive-net-zoning_1",
    );
    const result = runnerInstallTaxTarget(input, definitionId, candidates, []);
    const offer = input.legalActions.find(
      (action) => action.actionId === result?.target?.actionId,
    );
    expect(offer?.payload?.selectedServerId).toBe("remote_1");
  });
});
