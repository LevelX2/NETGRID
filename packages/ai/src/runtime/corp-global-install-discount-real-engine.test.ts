import { readFileSync } from "node:fs";
import { beforeEach, expect, it } from "vitest";
import { createGameAfterSetup } from "@netgrid/engine";
import type {
  AiDecisionInput,
  CorpRootRezIceInstallCostQuote,
} from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildAiDecisionInputDto } from "../input-dto";

beforeEach(() => resetResidentPlanPortfolioMemory());
it("carries the real global other-fort quote through both DTO action lists", () => {
  const d = catalog.decks.find(
    (d) => d.standardDeckId === "standard_corp_ivory_bastion",
  )!;
  const corpDeck = {
    id: d.standardDeckId,
    name: d.name,
    side: "corp" as const,
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  };
  const state = createGameAfterSetup({
    seed: "sp450-global-install-source",
    corpDeck,
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(12)
    .withCorpCardInHq("onr_v1_232_crystal-wall")
    .withCorpIceOnServer("hq", "onr_v1_237_data-wall")
    .withCorpRemoteRoot("rd", "onr_v1_324_fortress-architects");
  const input = buildAiDecisionInputDto(
    buildAiDecisionInput(state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: {
        deckSnapshotId: d.standardDeckId,
        side: "corp",
        cards: d.cards,
      },
    }),
  );
  for (const actions of [input.legalActions, input.playerView.legalActions]) {
    const rez = actions.find(
      (a) =>
        a.type === "rez_card" &&
        state.cardInstances[a.source!]?.definitionId ===
          "onr_v1_324_fortress-architects",
    )!;
    const quote = JSON.parse(
      rez.payload!.rootRezIceInstallCostQuoteJson as string,
    ) as CorpRootRezIceInstallCostQuote;
    expect(quote.sourceServerId).toBe("rd");
    expect(quote.installs).toContainEqual(
      expect.objectContaining({
        targetServerId: "hq",
        beforeCredits: 1,
        afterCredits: 0,
      }),
    );
  }
});

function checkpoint(decision: number) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../data/scenarios/ai-decision-checkpoints/cp-meta-485-sp450-g35-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInput & { ownDeckSnapshot: { deckSnapshotId: string } };
    runtime: AiRuntimeCheckpointV1;
  };
}
function choose(cp: ReturnType<typeof checkpoint>) {
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return chooseCorpAction(cp.input);
}
// Exact global modifier checked against real Engine rez -> install transitions.
// These checkpoints restore their admitted routes without injecting plan roles.
function addGlobalQuotes(input: AiDecisionInput) {
  for (const action of input.legalActions) {
    if (action.type !== "rez_card") continue;
    const server = input.playerView.servers.find((s) =>
      s.root.some(
        (c) =>
          c.instanceId === action.source &&
          c.definitionId === "onr_v1_324_fortress-architects",
      ),
    );
    if (!server) continue;
    const quote: CorpRootRezIceInstallCostQuote = {
      schemaVersion: "corp-root-rez-ice-install-cost-quote-v2",
      actionId: action.actionId,
      sourceCardInstanceId: action.source!,
      sourceServerId: server.id,
      stateVersion: input.playerView.stateVersion,
      installs: input.legalActions
        .filter(
          (a) =>
            a.type === "install_card" &&
            a.payload?.placement === "ice" &&
            a.payload.serverId !== "new_remote" &&
            Number(a.payload.iceInstallTotalCost) > 0,
        )
        .map((a) => ({
          cardInstanceId: a.source!,
          targetServerId: a.payload!.serverId as "hq" | "rd" | "archives",
          beforeCredits: Number(a.payload!.iceInstallTotalCost),
          afterCredits: Number(a.payload!.iceInstallTotalCost) - 1,
        })),
    };
    action.payload!.rootRezIceInstallCostQuoteJson = JSON.stringify(quote);
  }
  Object.assign(input, buildAiDecisionInputDto(input));
}
for (const decision of [80, 126])
  it(`preserves the actual selected installation at G35 D${decision}`, () => {
    const cp = checkpoint(decision);
    const before = choose(cp);
    const install = cp.input.legalActions.find(
      (a) => a.actionId === before.actionId,
    )!;
    expect(install.type).toBe("install_card");
    expect(install.payload?.serverId).toBe(decision === 80 ? "rd" : "hq");
    addGlobalQuotes(cp.input);
    const after = choose(cp);
    const rez = cp.input.legalActions.find(
      (a) => a.actionId === after.actionId,
    )!;
    expect(rez.type).toBe("rez_card");
    expect(rez.source).toContain("fortress-architects");
    expect(after.reasonCode).toBe("plan_first.corp.defend_servers");
    expect(after.decisionDebug?.planFirstDecision?.selectedStep).toEqual(
      before.decisionDebug?.planFirstDecision?.selectedStep,
    );
    expect(after.decisionDebug?.planFirstDecision?.priority).toEqual(
      before.decisionDebug?.planFirstDecision?.priority,
    );
    expect(after.decisionDebug?.fallbackUsed).toBe(false);
  });
