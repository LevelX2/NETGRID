import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
} from "@netgrid/engine";
import { expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import { corpIceRezSupportEmptyTargetDispositionEvidence } from "../corp/defense/corp-defense-rez-support-facts";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

function fixture(
  operation = "onr_proteus_051_rent-to-own-contract",
  target = "onr_proteus_024_gatekeeper",
) {
  const d = catalog.decks.find(
    (d) =>
      d.standardDeckId ===
      "standard_proteus_corp_variable_ice_gauntlet_2026_05_25",
  )!;
  let s = createGameAfterSetup({
    seed: "meta568-operation-effect",
    corpDeck: {
      id: d.standardDeckId,
      name: d.name,
      side: "corp",
      identity: d.identityCardId,
      cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
    },
  });
  const draw = getLegalActions(s, "corp").find(
    (a) => a.type === "mandatory_draw",
  )!;
  const r = applyAction(s, {
    matchId: s.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: s.stateVersion,
  });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  s = r.state;
  RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCardInHq(operation)
    .withCorpIceOnServer("rd", target)
    .withCorpCredits(1);
  const i = buildAiDecisionInput(s, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: d.standardDeckId,
      side: "corp",
      cards: d.cards.map((c) => ({ cardId: c.cardId, quantity: c.quantity })),
    },
  });
  const candidates = buildActionSemanticCandidates({
    legalActions: i.legalActions,
    observerSide: i.side,
    stateVersion: i.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      i.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const action = i.legalActions.find(
    (a) =>
      a.type === "play_operation" &&
      a.payload?.targetCardId &&
      (!a.payload.xValue || a.payload.xValue === 1),
  )!;
  return {
    s,
    i,
    action,
    candidate: candidates.find((c) => c.actionId === action.actionId)!,
  };
}
it.each([
  "onr_proteus_051_rent-to-own-contract",
  "onr_proteus_049_emergency-rig",
])(
  "dispositions the actual empty Gatekeeper result of %s through the live DTO",
  (operation) => {
    const p = fixture(operation),
      before = hashState(p.s),
      input = JSON.stringify(p.i);
    expect(
      corpIceRezSupportEmptyTargetDispositionEvidence(p.i, p.candidate),
    ).toMatch(/^corp_rez_support_empty_current_effect:rd:/);
    expect(hashState(p.s)).toBe(before);
    expect(JSON.stringify(p.i)).toBe(input);
  },
);
it.each([
  "onr_proteus_012_bug-zapper",
  "onr_proteus_014_chihuahua",
  "onr_proteus_034_riddler",
])("preserves the real stopper, income or paid effect on %s", (target) => {
  const p = fixture("onr_proteus_051_rent-to-own-contract", target);
  expect(
    corpIceRezSupportEmptyTargetDispositionEvidence(p.i, p.candidate),
  ).toBeUndefined();
});
it.each(["stale", "source", "action", "target", "cost"])(
  "does not accept a %s operation-effect binding",
  (kind) => {
    const p = fixture(),
      q = JSON.parse(p.action.payload!.operationFreeRezRunQuoteJson as string);
    if (kind === "stale") q.stateVersion--;
    if (kind === "source") q.sourceCardId = "other";
    if (kind === "action") q.operationActionId = "other";
    if (kind === "target") q.postRez.cardId = "other";
    if (kind === "cost") q.creditCost++;
    p.action.payload!.operationFreeRezRunQuoteJson = JSON.stringify(q);
    expect(() =>
      corpIceRezSupportEmptyTargetDispositionEvidence(p.i, p.candidate),
    ).toThrow(PlanResolutionFailure);
  },
);
