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

const definitionId = "onr_v1_173_restrictive-net-zoning";
const instanceId = "runner_onr_v1_173_restrictive-net-zoning_1";

function taxOffers(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates(input).filter(
    (entry) =>
      entry.actionType === "install_card" &&
      entry.sourceCardInstanceId === instanceId,
  );
}

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
        cardId: instanceId,
        selectedServerId: "hq",
      },
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.develop_board_and_hand");
    expect(decision.fallbackUsed).toBe(false);
  });

  it.each([false, true])(
    "excludes Archives from the installment tax even with a visible agenda (%s)",
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
      const candidates = taxOffers(input);
      const archivesOffer = input.legalActions.find(
        (offer) =>
          offer.source === instanceId &&
          offer.payload?.selectedServerId === "archives",
      )!;
      const archivesOnly = candidates.filter(
        (entry) => entry.actionId === archivesOffer.actionId,
      );
      expect(runnerInstallTaxTarget(input, definitionId, archivesOnly)).toEqual(
        {},
      );
      expect(
        runnerInstallTaxTarget(input, definitionId, candidates)?.target
          ?.serverId,
      ).toBe("hq");
    },
  );

  it("does not let a single scoring opportunity displace the persistent HQ target", () => {
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
    expect(
      runnerInstallTaxTarget(input, definitionId, taxOffers(input))?.target
        ?.serverId,
    ).toBe("hq");
  });

  it("supports the current R&D strategy even when the recent runs favor HQ", () => {
    const { input } = structuredClone(capture);
    input.ownStrategicIntentState!.targetVector = {
      kind: "central",
      targetId: "rd",
      evidence: [],
    };
    expect(
      runnerInstallTaxTarget(input, definitionId, taxOffers(input))?.target
        ?.serverId,
    ).toBe("rd");
  });

  it("holds the card when no current strategy or repeated run identifies a target", () => {
    const { input } = structuredClone(capture);
    input.ownStrategicIntentState!.stateVersion -= 1;
    input.eventTail = [];
    input.playerView.publicEvents = [];
    expect(
      runnerInstallTaxTarget(input, definitionId, taxOffers(input)),
    ).toEqual({});
  });

  it("only taxes a planned remote after pressure in separate runner turns", () => {
    const { input } = structuredClone(capture);
    input.ownStrategicIntentState!.targetVector = {
      kind: "remote",
      targetId: "remote_1",
      evidence: [],
    };
    const candidates = taxOffers(input);
    expect(
      runnerInstallTaxTarget(input, definitionId, candidates)?.target?.serverId,
    ).toBe("hq");

    for (const event of [
      ...input.playerView.publicEvents,
      ...input.eventTail,
    ]) {
      if (
        event.type === "start_run" &&
        (event.turnSerial === 9 || event.turnSerial === 11)
      ) {
        event.publicPayload.serverId = "remote_1";
      }
    }
    expect(
      runnerInstallTaxTarget(input, definitionId, candidates)?.target?.serverId,
    ).toBe("remote_1");

    input.playerView.servers.find((server) => server.id === "remote_1")!.ice =
      [];
    expect(runnerInstallTaxTarget(input, definitionId, candidates)).toEqual({});
  });
});
