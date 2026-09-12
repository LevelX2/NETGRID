import { expect, it } from "vitest";
import { allocateCorpCentralDefenseFromAiFacts } from "../../corp/defense/corp-central-defense-facts-adapter";
import { corpTerminalCentralRezReserveSignals } from "../../corp/defense/defense-discovery-support";
import { corpDefenseReserveNeeds } from "../../corp/defense/corp-defense-funding-facts";
import { assessCorpScoreProtection } from "../../runtime/corp-score-protection-assessment";
import type { CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-terminal-hq-funding-d29.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("funds an installed blocker against a terminal multi-point HQ steal before ineffective capacity staging", () => {
  const capture = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = capture.input;
  expect(
    input.playerView.agendaPointsToWin - input.playerView.opponent.agendaPoints,
  ).toBe(3);
  expect(input.playerView.own.credits).toBe(6);
  expect(input.playerView.own.clicks).toBe(2);
  const ice = input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!;
  expect(ice.effectiveRezCostQuote).toMatchObject({
    complete: true,
    finalCredits: 8,
    expiresAtStateVersion: input.playerView.stateVersion,
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.gain_credit");
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (x) => x.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("corp.defend_servers");
  const selected = decision.decisionDebug!.planFirstDecision!;
  expect(selected.selectedPlan).toMatchObject({
    moduleId: "corp.economy",
    parentInstanceId: root.instanceId,
    parentNeedId: `terminal-central-rez-reserve:hq:${ice.instanceId}`,
  });
  expect(selected.selectedStep).toMatchObject({
    planInstanceId: selected.selectedPlan!.instanceId,
    parentInstanceId: root.instanceId,
    needId: `terminal-central-rez-reserve:hq:${ice.instanceId}`,
  });
  const basic = input.legalActions.find(
    (a) => a.actionId === "corp.gain_credit",
  )!;
  expect(basic).toMatchObject({
    type: "gain_credit",
    expiresAtStateVersion: 28,
    costs: [{ clicks: 1 }],
    payload: { gainCreditsAmount: 1 },
  });
  const rezQuote = ice.effectiveRezCostQuote;
  if (!rezQuote?.complete) throw Error("complete rez quote required");
  expect(input.playerView.own.credits + input.playerView.own.clicks).toBe(
    rezQuote.finalCredits,
  );
  const server = input.playerView.servers.find((s) => s.id === "hq")!;
  const protection = (rezzed: boolean) =>
    assessCorpScoreProtection({
      serverIce: server.ice.map((card) => ({ ...card, rezzed })),
      runnerRig: input.playerView.opponent.rig!,
      runnerCredits: input.playerView.opponent.credits,
      maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    });
  expect(protection(false)).toMatchObject({
    knowledge: "known",
    protectsScore: false,
  });
  expect(protection(true)).toMatchObject({
    knowledge: "known",
    protectsScore: true,
  });
});

function reserveInput() {
  return structuredClone(checkpointJson)
    .input as unknown as AiDecisionInputWithDeckCapabilities;
}
it("discovers the quoted terminal HQ need even when nominal central allocation selects R&D", () => {
  const input = reserveInput(),
    allocation = allocateCorpCentralDefenseFromAiFacts({ input });
  expect(allocation).toMatchObject({
    status: "known",
    selectedServerId: "rd",
    evidence: { hq: { threat: "terminal" } },
  });
  expect(corpTerminalCentralRezReserveSignals(input, allocation, [])).toEqual([
    expect.objectContaining({
      serverId: "hq",
      phase: "fund_rez_reserve",
      rezReserveNeed: expect.objectContaining({
        fundingGap: 2,
        requiredCredits: 8,
      }),
    }),
  ]);
});
it.each([
  "expired",
  "incomplete",
  "wrong_server",
  "additional_cost",
  "already_funded",
  "rezzed",
  "no_clicks",
] as const)("does not invent a reserve for %s", (kind) => {
  const input = reserveInput(),
    ice = input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!,
    quote = ice.effectiveRezCostQuote!;
  if (!quote.complete) throw Error("complete source quote required");
  if (kind === "expired") quote.expiresAtStateVersion--;
  if (kind === "incomplete")
    ice.effectiveRezCostQuote = { ...quote, complete: false };
  if (kind === "wrong_server") quote.targetServerId = "rd";
  if (kind === "additional_cost")
    quote.mandatoryAdditionalCosts.agendaPoints = 1;
  if (kind === "already_funded") input.playerView.own.credits = 8;
  if (kind === "rezzed") ice.rezzed = true;
  if (kind === "no_clicks") input.playerView.own.clicks = 0;
  expect(
    corpTerminalCentralRezReserveSignals(
      input,
      allocateCorpCentralDefenseFromAiFacts({ input }),
      [],
    ),
  ).toEqual([]);
});
it("uses the current threat facts instead of treating every central as terminal", () => {
  const input = reserveInput(),
    allocation = allocateCorpCentralDefenseFromAiFacts({ input });
  if (allocation.status !== "known") throw Error("known allocation required");
  expect(
    corpTerminalCentralRezReserveSignals(
      input,
      {
        ...allocation,
        evidence: {
          hq: { ...allocation.evidence.hq, threat: "material" },
          rd: { ...allocation.evidence.rd, threat: "material" },
        },
      },
      [],
    ),
  ).toEqual([]);
});
it("preserves funding against nominal capacity but gives genuinely productive same-band installation precedence", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  chooseAiAction(input);
  const state = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.moduleId === "corp.defend_servers",
  )!.moduleState as { signals: CorpDefenseSignal[] };
  const reserve = state.signals.find(
    (s) => s.kind === "generic" && s.phase === "fund_rez_reserve",
  )!;
  const install = state.signals.find(
    (s) => s.kind === "generic" && s.phase === "install_ice",
  )!;
  if (install.kind !== "generic" || !install.installRoute)
    throw Error("installation required");
  expect(install.installRoute.projection.effect).toBe("no_progress");
  expect(
    corpDefenseReserveNeeds(
      input,
      [reserve, install],
      ["corp.gain_credit"],
      [],
      [],
    ),
  ).toHaveLength(1);
  const productive = structuredClone(install);
  productive.installRoute = {
    ...productive.installRoute!,
    projection: { ...productive.installRoute!.projection, effect: "progress" },
  };
  expect(
    corpDefenseReserveNeeds(
      input,
      [reserve, productive],
      ["corp.gain_credit"],
      [],
      [],
    ),
  ).toEqual([]);
});
