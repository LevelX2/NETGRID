import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  validateGameState,
} from "@netgrid/engine";
import type {
  GameState,
  LegalAction,
  CorpTemporaryIceStrengthPulseQuote,
} from "@netgrid/shared";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { assessCorpTemporaryIceStrengthPulse } from "./corp-temporary-ice-strength-pulse";
afterEach(resetResidentPlanPortfolioMemory);
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../evaluation/decision-checkpoints/fixtures/meta-ten-repairs/507-pulse.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const fresh = (): GameState => structuredClone(fixture.state);
const source = "corp_onr_classic_024_sterdroid_2",
  target = "corp_onr_classic_013_puzzle_1";
const input = (s: GameState) =>
  buildAiDecisionInput(s, "corp", {
    difficulty: "hard",
    decisionId: `pulse:${s.stateVersion}`,
    ownDeckSnapshot: fixture.corpSnapshot,
  });
const quote = (a: LegalAction): CorpTemporaryIceStrengthPulseQuote =>
  JSON.parse(a.payload!.corpTemporaryIceStrengthPulseQuoteJson as string);
const apply = (s: GameState, a: LegalAction) => {
  expect(a.expiresAtStateVersion).toBe(s.stateVersion);
  const r = applyAction(s, {
    matchId: s.matchId,
    side: a.side,
    actionId: a.actionId,
    clientKnownStateVersion: s.stateVersion,
  });
  if (!r.ok) throw Error(r.error.message);
  expect(validateGameState(r.state)).toEqual({ ok: true, errors: [] });
  return r;
};
const sourceRez = (s: GameState) =>
  getLegalActions(s, "corp").find(
    (a) => a.type === "rez_card" && a.source === source,
  )!;
const ready = () => {
  let s = fresh();
  s = apply(s, sourceRez(s)).state;
  const ice = getLegalActions(s, "corp").find(
    (a) => a.type === "rez_ice" && a.source === target,
  )!;
  return apply(s, ice).state;
};
it("binds the real funded source-rez preparation to the current approached ICE", () => {
  const s = fresh(),
    a = sourceRez(s);
  expect(quote(a)).toMatchObject({
    complete: true,
    kind: "prepare_rez",
    stateVersion: 402,
    sourceCardInstanceId: source,
    targetIceInstanceId: target,
    pulseCredits: 3,
    sourceRezCredits: 0,
    iceRezCredits: 2,
    corpCreditsAfterDefense: 2,
  });
  expect(assessCorpTemporaryIceStrengthPulse(input(s), a)).toMatchObject({
    productive: true,
    serverId: "archives",
    value: 1000,
  });
  const selected = chooseAiAction(input(s));
  expect(selected.fallbackUsed).toBe(false);
  expect(
    selected.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
});
it("selects and executes the native pulse through the defense plan, step and exact route", () => {
  const s = ready(),
    i = input(s),
    d = chooseAiAction(i),
    pf = d.decisionDebug!.planFirstDecision!;
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).toBe(false);
  expect(pf.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(pf.route).toMatchObject({
    actionId: d.actionId,
    stateVersion: s.stateVersion,
    planInstanceId: pf.selectedStep!.planInstanceId,
    stepId: pf.selectedStep!.stepId,
  });
  const a = i.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(a).toMatchObject({
    type: "activated_card_ability",
    source,
    payload: { targetCardId: target },
  });
  expect(quote(a)).toMatchObject({
    complete: true,
    kind: "activate",
    corpCreditsAfterDefense: 2,
    beforeIce: { effectiveRunQuote: { effectiveStrength: 5 } },
    afterIce: { effectiveRunQuote: { effectiveStrength: 10 } },
  });
  const r = apply(s, a);
  expect(r.state.corp.credits).toBe(2);
  expect(r.state.corp.archives).toContain(source);
  expect(
    getPlayerView(r.state, "corp")
      .servers.find((s) => s.id === "archives")!
      .ice.find((c) => c.instanceId === target)!.effectiveRunQuote!
      .effectiveStrength,
  ).toBe(10);
  expect(
    JSON.stringify(
      r.state.eventLog.slice(s.eventLog.length).map((e) => e.publicPayload),
    ),
  ).not.toContain("corpTemporaryIceStrengthPulseQuoteJson");
  expect(
    getLegalActions(r.state, "runner").some(
      (a) => a.payload?.corpTemporaryIceStrengthPulseQuoteJson,
    ),
  ).toBe(false);
});
it("rejects unfunded preparation, a rich Runner and a target that cannot gain strength", () => {
  let s = fresh();
  s.corp.credits = 3;
  let a = sourceRez(s);
  expect(quote(a)).toMatchObject({
    complete: false,
    reason: "defense_sequence_not_funded",
  });
  expect(assessCorpTemporaryIceStrengthPulse(input(s), a)?.productive).toBe(
    false,
  );
  s = ready();
  s.runner.credits = 100;
  let i = input(s);
  a = i.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.source === source &&
      a.payload?.targetCardId === target,
  )!;
  expect(assessCorpTemporaryIceStrengthPulse(i, a)?.productive).toBe(false);
  s = ready();
  s.cardInstances[target]!.strengthModifier += 5;
  i = input(s);
  a = i.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.source === source &&
      a.payload?.targetCardId === target,
  )!;
  expect(quote(a)).toMatchObject({
    complete: true,
    beforeIce: { effectiveRunQuote: { effectiveStrength: 10 } },
    afterIce: { effectiveRunQuote: { effectiveStrength: 10 } },
  });
  expect(assessCorpTemporaryIceStrengthPulse(i, a)?.productive).toBe(false);
});
it("fails closed for absent or stale current-action bindings", () => {
  const s = ready(),
    i = input(s),
    a = i.legalActions.find(
      (a) =>
        a.type === "activated_card_ability" &&
        a.source === source &&
        a.payload?.targetCardId === target,
    )!;
  const { corpTemporaryIceStrengthPulseQuoteJson: omitted, ...withoutQuote } =
    a.payload!;
  expect(omitted).toBeDefined();
  expect(() =>
    assessCorpTemporaryIceStrengthPulse(i, { ...a, payload: withoutQuote }),
  ).toThrow();
  const q = quote(a);
  expect(() =>
    assessCorpTemporaryIceStrengthPulse(i, {
      ...a,
      payload: {
        ...a.payload,
        corpTemporaryIceStrengthPulseQuoteJson: JSON.stringify({
          ...q,
          stateVersion: q.stateVersion - 1,
        }),
      },
    }),
  ).toThrow();
});
it("keeps a different ICE target and a nonterminal archive explicit nonproductive defense", () => {
  let s = ready(),
    i = input(s);
  const different = i.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.source === source &&
      a.payload?.targetCardId !== target,
  )!;
  expect(different).toBeDefined();
  expect(quote(different)).toMatchObject({
    complete: false,
    reason: "not_current_approached_target",
  });
  expect(assessCorpTemporaryIceStrengthPulse(i, different)?.productive).toBe(
    false,
  );
  const agendas = getPlayerView(s, "corp")
    .own.heapOrArchives.filter((c) => c.type === "agenda")
    .map((c) => c.instanceId);
  for (const id of agendas) {
    s.corp.archives = s.corp.archives.filter((x) => x !== id);
    s.corp.hq.push(id);
    s.cardInstances[id]!.zone = { side: "corp", zone: "hq" };
  }
  expect(validateGameState(s)).toEqual({ ok: true, errors: [] });
  i = input(s);
  const pulse = i.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.source === source &&
      a.payload?.targetCardId === target,
  )!;
  expect(assessCorpTemporaryIceStrengthPulse(i, pulse)?.productive).toBe(false);
});
it("does not claim complete terminal-path evidence while another inner ICE remains", () => {
  const s = fresh(),
    archives = s.corp.servers.find((x) => x.id === "archives")!,
    other = s.corp.servers.find((x) => x.id === "hq")!.ice[0]!;
  s.corp.servers.find((x) => x.id === "hq")!.ice = s.corp.servers
    .find((x) => x.id === "hq")!
    .ice.filter((x) => x !== other);
  archives.ice.unshift(other);
  s.cardInstances[other]!.zone = {
    side: "corp",
    zone: "serverIce",
    serverId: "archives",
  };
  if (s.run?.position.kind !== "ice")
    throw Error("native_ice_position_required");
  s.run.position.iceIndex = 1;
  const a = sourceRez(s);
  expect(quote(a)).toMatchObject({
    complete: false,
    reason: "additional_remaining_ice_projection_required",
  });
  expect(assessCorpTemporaryIceStrengthPulse(input(s), a)?.productive).toBe(
    false,
  );
});
