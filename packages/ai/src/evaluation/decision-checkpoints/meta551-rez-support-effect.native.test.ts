import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { corpIceRezSupportTargetHasNoCurrentEffect } from "../../corp/defense/corp-defense-rez-support-facts";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

function capture(key: string) {
  const f = JSON.parse(readFileSync(new URL("../../../../../data/scenarios/ai-decision-checkpoints/cp-meta551-rez-support-effect.json", import.meta.url), "utf8")).states[key] as {
    input: AiDecisionInputWithDeckCapabilities; runtime: AiRuntimeCheckpointV1; validation: Record<string, boolean>; observedActionId: string;
  };
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}
function hash(input: AiDecisionInputWithDeckCapabilities) {
  return createHash("sha256").update(JSON.stringify({ view: input.playerView, actions: input.legalActions, events: input.eventTail })).digest("hex");
}
function decide(key: string) {
  const f = capture(key), before = hash(f.input);
  expect(Object.values(f.validation).every(Boolean)).toBe(true);
  restoreAiRuntimeCheckpoint(f.input, f.input.ownDeckSnapshot!.deckSnapshotId, f.runtime);
  const result = chooseAiAction(f.input);
  expect(result.fallbackUsed).toBe(false);
  const action = f.input.legalActions.find(a => a.actionId === result.actionId)!;
  expect(action).toBeDefined();
  expect(action.expiresAtStateVersion).toBe(f.input.playerView.stateVersion);
  expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({actionId: action.actionId, stateVersion: f.input.playerView.stateVersion});
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBeTruthy();
  expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBeTruthy();
  expect(hash(f.input)).toBe(before);
  return { ...f, result, action };
}
describe("native action ICE rez-support current effect", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it.each(["emptyInstallment", "emptyTemporary", "emptyOuter", "emptyOverflowInstallment", "emptyOverflowTemporary"])("does not buy the complete empty target in %s", key => {
    const {input, action, result, observedActionId} = decide(key);
    const target = input.playerView.servers.flatMap(s => s.ice).find(i => i.definitionId === "onr_proteus_031_minotaur")!;
    expect(target.effectivePostRezRunQuote).toMatchObject({complete:true,effectiveRunQuote:{subroutines:[]}});
    expect(action.type === "play_operation" && action.payload?.targetCardId === target.instanceId).toBe(false);
    expect(result.decisionDebug?.planFirstDecision?.dispositions.some(d => d.actionId === observedActionId && d.ownerModuleId === "corp.defend_servers" && d.evidenceCode.startsWith("corp_rez_support_empty_current_effect:"))).toBe(true);
  });
  it.each(["stopper", "variable", "income"])("retains the original exact operation and owner in %s", key => {
    const {action, observedActionId, result} = decide(key);
    expect(action.actionId).toBe(observedActionId);
    expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(key === "income" ? /^plan:corp.hand_and_agenda_management:/ : /^plan:corp.defend_servers:/);
  });
});

// Binding-corruption variants test only the absence claim, not new LegalActions.
describe("rez-support empty-effect proof boundary", () => {
  it.each(["paid", "activeDynamic", "income", "variable"])("does not call the native %s target empty", key => {
    const {input} = capture(key);
    const targetId = key === "paid" ? "onr_proteus_034_riddler" : key === "activeDynamic" ? "onr_proteus_031_minotaur" : key === "income" ? "onr_proteus_014_chihuahua" : "onr_proteus_023_galatea";
    const server = input.playerView.servers.find(s => s.ice.some(i => i.definitionId === targetId))!;
    const ice = server.ice.find(i => i.definitionId === targetId)!;
    expect(corpIceRezSupportTargetHasNoCurrentEffect(input, ice, server.id)).toBe(false);
  });
  it.each(["missing", "stale", "source", "definition", "server", "inner_source"])("does not infer emptiness from %s binding", key => {
    const {input} = capture("emptyInstallment"), server = input.playerView.servers.find(s => s.ice.some(i => i.definitionId === "onr_proteus_031_minotaur"))!, ice = server.ice[0]!;
    expect(corpIceRezSupportTargetHasNoCurrentEffect(input, ice, server.id)).toBe(true);
    const post = ice.effectivePostRezRunQuote!;
    if (key === "missing") delete ice.effectivePostRezRunQuote;
    if (key === "stale") post.expiresAtStateVersion--;
    if (key === "source") post.cardId = "other";
    if (key === "definition") post.iceDefinitionId = "other";
    if (key === "server") post.targetServerId = "rd";
    if (key === "inner_source" && post.complete) post.effectiveRunQuote.iceInstanceId = "other";
    expect(corpIceRezSupportTargetHasNoCurrentEffect(input, ice, server.id)).toBe(false);
  });
});
