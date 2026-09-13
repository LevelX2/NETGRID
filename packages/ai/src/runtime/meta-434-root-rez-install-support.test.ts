import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  CorpRootRezIceInstallCostQuote,
} from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";

function checkpoint(game: number, decision: number) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r5-sp337-g${game}-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInput & { ownDeckSnapshot: { deckSnapshotId: string } };
    runtime: AiRuntimeCheckpointV1;
  };
}

// Exact LegalAction additions independently checked against real Engine rez →
// install transitions in root-rez-ice-install-cost-quote.test.ts.
function addCostQuotes(input: AiDecisionInput) {
  const quotes: CorpRootRezIceInstallCostQuote[] = [];
  for (const action of input.legalActions) {
    if (action.type !== "rez_card" || !action.source?.includes("chester-mix"))
      continue;
    const server = input.playerView.servers.find((s) =>
      s.root.some((c) => c.instanceId === action.source),
    )!;
    const installs = input.legalActions.filter(
      (a) =>
        a.type === "install_card" &&
        a.payload?.placement === "ice" &&
        a.payload.serverId === server.id &&
        typeof a.payload.iceInstallTotalCost === "number" &&
        a.payload.iceInstallTotalCost > 0,
    );
    const quote: CorpRootRezIceInstallCostQuote = {
      schemaVersion: "corp-root-rez-ice-install-cost-quote-v1",
      actionId: action.actionId,
      sourceCardInstanceId: action.source,
      targetServerId: server.id,
      stateVersion: input.playerView.stateVersion,
      installs: installs.map((a) => ({
        cardInstanceId: a.source!,
        beforeCredits: a.payload!.iceInstallTotalCost as number,
        afterCredits: Math.max(
          0,
          (a.payload!.iceInstallTotalCost as number) - 2,
        ),
      })),
    };
    action.payload = {
      ...action.payload,
      rootRezIceInstallCostQuoteJson: JSON.stringify(quote),
    };
    quotes.push(quote);
  }
  input.playerView.legalActions = input.legalActions;
  return quotes;
}

function choose(cp: ReturnType<typeof checkpoint>) {
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return chooseAiAction(cp.input);
}

describe("meta 434 SP-337 root rez before selected ICE installation", () => {
  for (const [game, decision] of [
    [1, 82],
    [38, 154],
  ]) {
    it(`prepares the same defense allocation at G${game} D${decision}`, () => {
      const cp = checkpoint(game!, decision!);
      const before = choose(cp);
      expect(before.actionId).toContain("corp.install_card.");
      const quotes = addCostQuotes(cp.input);
      Object.assign(cp.input, buildAiDecisionInputDto(cp.input));
      const after = choose(cp);
      expect(quotes.map((q) => q.actionId)).toContain(after.actionId);
      expect(after.reasonCode).toBe("plan_first.corp.defend_servers");
      expect(after.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
        "plan:corp.defend_servers:server-defense-portfolio",
      );
      expect(after.decisionDebug?.planFirstDecision?.selectedStep).toEqual(
        before.decisionDebug?.planFirstDecision?.selectedStep,
      );
      expect(after.decisionDebug?.planFirstDecision?.priority).toEqual(
        before.decisionDebug?.planFirstDecision?.priority,
      );
      expect(after.decisionDebug?.fallbackUsed).toBe(false);
    });
  }

  it("keeps the selected Remote allocation when the available root discount only applies to HQ", () => {
    const cp = checkpoint(5, 148);
    const before = choose(cp);
    const selected = cp.input.legalActions.find(
      (action) => action.actionId === before.actionId,
    );
    expect(selected).toMatchObject({
      type: "install_card",
      payload: { serverId: "remote_1", placement: "ice" },
    });
    const quotes = addCostQuotes(cp.input);
    expect(quotes).toHaveLength(1);
    expect(quotes[0]?.targetServerId).toBe("hq");
    Object.assign(cp.input, buildAiDecisionInputDto(cp.input));
    const after = choose(cp);
    expect(after.actionId).toBe(before.actionId);
    expect(after.reasonCode).toBe("plan_first.corp.defend_servers");
    expect(after.decisionDebug?.planFirstDecision?.selectedStep).toMatchObject({
      planInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      stepId:
        "plan:corp.defend_servers:server-defense-portfolio:improve_remote_protection_path",
      parentInstanceId:
        "plan:corp.establish_scoring_remote:strategic-score-remote",
      needId: before.decisionDebug?.planFirstDecision?.selectedStep?.needId,
    });
    expect(after.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:corp.establish_scoring_remote:strategic-score-remote",
    );
    expect(after.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );
    expect(after.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: before.actionId,
      stateVersion: cp.input.playerView.stateVersion,
    });
    expect(after.fallbackUsed).toBe(false);
  });

  for (const [name, mutate] of [
    [
      "stale state",
      (q: CorpRootRezIceInstallCostQuote) => {
        q.stateVersion--;
      },
    ],
    [
      "another fort",
      (q: CorpRootRezIceInstallCostQuote) => {
        q.targetServerId = "rd";
      },
    ],
    [
      "another action",
      (q: CorpRootRezIceInstallCostQuote) => {
        q.actionId += "-stale";
      },
    ],
    [
      "no saving",
      (q: CorpRootRezIceInstallCostQuote) => {
        q.installs.forEach((i) => {
          i.afterCredits = i.beforeCredits;
        });
      },
    ],
    [
      "wrong original cost",
      (q: CorpRootRezIceInstallCostQuote) => {
        q.installs.forEach((i) => {
          i.beforeCredits++;
        });
      },
    ],
    [
      "no bound ICE",
      (q: CorpRootRezIceInstallCostQuote) => {
        q.installs = [];
      },
    ],
  ] as const) {
    it(`does not authorize preparation with ${name}`, () => {
      const cp = checkpoint(1, 82),
        quotes = addCostQuotes(cp.input);
      for (const q of quotes) {
        const action = cp.input.legalActions.find(
          (a) => a.actionId === q.actionId,
        )!;
        mutate(q);
        action.payload!.rootRezIceInstallCostQuoteJson = JSON.stringify(q);
      }
      expect(choose(cp).actionId).toContain("corp.install_card.");
    });
  }

  it("rejects malformed quote JSON at its rules-contract boundary", () => {
    const cp = checkpoint(1, 82),
      quotes = addCostQuotes(cp.input);
    cp.input.legalActions.find(
      (a) => a.actionId === quotes[0]!.actionId,
    )!.payload!.rootRezIceInstallCostQuoteJson = "{";
    expect(() => choose(cp)).toThrow("missing_action_semantics");
  });

  it("does not replace the selected ICE with another quoted installation", () => {
    const cp = checkpoint(38, 154);
    const original = choose(cp);
    const selected = cp.input.legalActions.find(
      (a) => a.actionId === original.actionId,
    )!;
    for (const quote of addCostQuotes(cp.input)) {
      quote.installs = quote.installs.filter(
        (i) => i.cardInstanceId !== selected.source,
      );
      cp.input.legalActions.find(
        (a) => a.actionId === quote.actionId,
      )!.payload!.rootRezIceInstallCostQuoteJson = JSON.stringify(quote);
    }
    expect(choose(cp).actionId).toBe(original.actionId);
  });

  it("does not use a paid rez as the free preparation", () => {
    const cp = checkpoint(1, 82);
    const original = choose(cp);
    for (const quote of addCostQuotes(cp.input)) {
      cp.input.legalActions.find((a) => a.actionId === quote.actionId)!.costs =
        [{ credits: 1 }];
    }
    expect(choose(cp).actionId).toBe(original.actionId);
  });
});
