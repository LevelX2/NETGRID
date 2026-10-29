import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "./ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { selectedPostInstallRezCreditsFromCurrentQuote } from "../corp/defense/defense-validation";

function deck(id: string): DeckDefinition {
  const d = catalog.decks.find((d) => d.standardDeckId === id)!;
  return {
    id,
    name: d.name,
    side: d.side as "corp" | "runner",
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  };
}
const corpDeck = deck("standard_proteus_corp_variable_ice_gauntlet_2026_05_25");
const runnerDeck = deck("standard_runner_bit_denial_lock");
function apply(state: GameState, action: LegalAction): GameState {
  expect(action).toBeDefined();
  const r = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
function fixture(card: string, credits: number) {
  let s = createGameAfterSetup({
    seed: "meta568-x-strength",
    corpDeck,
    runnerDeck,
  });
  s = apply(
    s,
    getLegalActions(s, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  while (s.corp.clicks > 1)
    s = apply(
      s,
      getLegalActions(s, "corp").find((a) => a.type === "gain_credit")!,
    );
  RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCredits(credits)
    .withRunnerCredits(3)
    .withCorpCardInHq("onr_proteus_005_marked-accounts")
    .withCorpCardInHq(card);
  return s;
}
function input(s: GameState) {
  return buildAiDecisionInput(s, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([["onr_proteus_020_digiconda", 6]] as const)(
  "binds the minimum x-strength installation, Defense plan and actual rez of %s",
  (card, cost) => {
    let s = fixture(card, cost);
    const before = hashState(s),
      i = input(s),
      serialized = JSON.stringify(i);
    const decision = chooseAiAction(i),
      pf = decision.decisionDebug!.planFirstDecision!;
    const install = i.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(install.type).toBe("install_card");
    expect(install.source).toContain(card);
    expect(["hq", "rd"]).toContain(install.payload?.serverId);
    const predicted = JSON.parse(
      install.payload!.postInstallEffectiveRunQuoteJson as string,
    );
    expect(predicted.subroutines).toContainEqual(
      expect.objectContaining({ type: "end_the_run" }),
    );
    expect(install.payload).toMatchObject({
      postInstallRezQuoteVariableRezKind: "x_strength",
      postInstallRezQuoteVariableMinValue: 0,
      postInstallRezQuoteVariableMinValueFinalCredits: cost,
    });
    expect(pf).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      selectedPlan: { moduleId: "corp.defend_servers" },
      route: {
        actionId: install.actionId,
        stateVersion: i.playerView.stateVersion,
      },
    });
    expect(decision.fallbackUsed).toBe(false);
    expect(JSON.stringify(i)).toBe(serialized);
    expect(hashState(s)).toBe(before);
    s = apply(s, install);
    expect(s.corp.credits).toBe(cost);
    s = apply(
      s,
      getLegalActions(s, "corp").find((a) => a.type === "end_turn")!,
    );
    s = apply(
      s,
      getLegalActions(s, "runner").find(
        (a) =>
          a.type === "start_run" &&
          a.payload?.serverId === install.payload?.serverId,
      )!,
    );
    const rez = getLegalActions(s, "corp").find(
      (a) =>
        a.type === "rez_ice" &&
        a.source === install.source &&
        a.payload?.variableRezValue === 0,
    )!;
    expect(rez.payload?.effectiveStrengthAfterRez).toBe(0);
    s = apply(s, rez);
    expect(s.corp.credits).toBe(0);
    const actual = getPlayerView(s, "corp")
      .servers.flatMap((server) => server.ice)
      .find((ice) => ice.instanceId === install.source)!;
    expect(actual.strength).toBe(0);
    expect(actual.effectiveRunQuote).toEqual(predicted);
    expect(getPlayerView(s, "runner").opponent).not.toHaveProperty("gripOrHq");
  },
);

it.each(["onr_proteus_025_homing-missile"])(
  "does not invent an unbound variable projection for %s",
  (card) => {
    const s = fixture(card, 20),
      before = hashState(s),
      i = input(s);
    const installs = i.legalActions.filter(
      (a) => a.type === "install_card" && a.source.includes(card),
    );
    expect(installs.length).toBeGreaterThan(0);
    for (const a of installs)
      expect(a.payload?.postInstallEffectiveRunQuoteJson).toBeUndefined();
    expect(hashState(s)).toBe(before);
  },
);

it.each([
  ["onr_proteus_024_gatekeeper", 5],
  ["onr_proteus_036_sandstorm", 6],
] as const)(
  "binds the first paid stopping routine, Defense owner and actual rez of %s",
  (card, credits) => {
    let s = fixture(card, credits);
    const before = hashState(s),
      i = input(s),
      serialized = JSON.stringify(i);
    const r = chooseAiAction(i);
    const selected = i.legalActions.find((a) => a.actionId === r.actionId)!;
    expect(selected.type).toBe("install_card");
    expect(selected.source).toContain(card);
    expect(["hq", "rd"]).toContain(selected.payload?.serverId);
    expect(r.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
      "corp.defend_servers",
    );
    expect(r.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: selected.actionId,
      stateVersion: s.stateVersion,
    });
    expect(
      selectedPostInstallRezCreditsFromCurrentQuote(selected.payload!),
    ).toBe(credits);
    const predicted = JSON.parse(
      selected.payload!.postInstallEffectiveRunQuoteJson as string,
    );
    expect(predicted.subroutines).toHaveLength(1);
    expect(predicted.subroutines[0].type).toBe("end_the_run");
    expect(hashState(s)).toBe(before);
    expect(JSON.stringify(i)).toBe(serialized);
    expect(r.fallbackUsed).toBe(false);
    s = apply(s, selected);
    s = apply(
      s,
      getLegalActions(s, "corp").find((a) => a.type === "end_turn")!,
    );
    s = apply(
      s,
      getLegalActions(s, "runner").find(
        (a) =>
          a.type === "start_run" &&
          a.payload?.serverId === selected.payload?.serverId,
      )!,
    );
    const rez = getLegalActions(s, "corp").find(
      (a) =>
        a.type === "rez_ice" &&
        a.source === selected.source &&
        a.payload?.variableRezValue === 1,
    )!;
    expect(rez.payload?.effectiveSubroutineCountAfterRez).toBe(1);
    s = apply(s, rez);
    expect(s.corp.credits).toBe(0);
    expect(
      getPlayerView(s, "corp")
        .servers.flatMap((x) => x.ice)
        .find((x) => x.instanceId === selected.source)!.effectiveRunQuote,
    ).toEqual(predicted);
    expect(getPlayerView(s, "runner").opponent).not.toHaveProperty("gripOrHq");
  },
);

it("keeps the minimum-X effect quote separate from current installed rez choices", () => {
  let s = fixture("onr_proteus_020_digiconda", 6);
  const install = getLegalActions(s, "corp").find(
    (a) =>
      a.type === "install_card" &&
      a.source.includes("digiconda") &&
      a.payload?.serverId === "rd",
  )!;
  expect(
    JSON.parse(install.payload!.postInstallEffectiveRunQuoteJson as string),
  ).toMatchObject({ effectiveStrength: 0 });
  s = apply(s, install);
  expect(
    getPlayerView(s, "corp").servers.find((x) => x.id === "rd")!.ice[0]!
      .effectivePostRezRunQuote,
  ).toMatchObject({ complete: false, reason: "variable_rez_choice_required" });
});

it.each(["onr_proteus_024_gatekeeper", "onr_proteus_036_sandstorm"])(
  "does not bind a current installed paid-routine rez choice from the installation quote for %s",
  (card) => {
    let s = fixture(card, 20);
    const install = getLegalActions(s, "corp").find(
      (a) =>
        a.type === "install_card" &&
        a.source.includes(card) &&
        a.payload?.serverId === "rd",
    )!;
    expect(
      JSON.parse(install.payload!.postInstallEffectiveRunQuoteJson as string)
        .subroutines,
    ).toHaveLength(1);
    s = apply(s, install);
    expect(
      getPlayerView(s, "corp").servers.find((x) => x.id === "rd")!.ice[0]!
        .effectivePostRezRunQuote,
    ).toMatchObject({
      complete: false,
      reason: "variable_rez_choice_required",
    });
  },
);

it.each([
  ["onr_proteus_024_gatekeeper", 5],
  ["onr_proteus_036_sandstorm", 6],
] as const)(
  "keeps the first-stop qualitative installation fail-closed without the Engine effect quote for %s",
  (card, credits) => {
    const i = input(fixture(card, credits));
    for (const a of i.legalActions.filter(
      (a) => a.type === "install_card" && a.source.includes(card),
    ))
      delete a.payload!.postInstallEffectiveRunQuoteJson;
    const r = chooseAiAction(i);
    expect(
      i.legalActions.find((a) => a.actionId === r.actionId)?.source,
    ).not.toContain(card);
    expect(r.fallbackUsed).toBe(false);
  },
);

it("keeps an unfunded minimum-X installation at the existing staging milestone", () => {
  const s = fixture("onr_proteus_020_digiconda", 5),
    i = input(s),
    r = chooseAiAction(i);
  const selected = i.legalActions.find((a) => a.actionId === r.actionId)!;
  expect(selected.type).toBe("install_card");
  expect(selected.source).toContain("digiconda");
  expect(r.decisionDebug?.planFirstDecision?.selectedPlan).toMatchObject({
    moduleId: "corp.defend_servers",
    evidenceCodes: [
      expect.stringContaining("corp_qualitative_ice_staging:hq:"),
    ],
  });
  expect(
    r.decisionDebug?.planFirstDecision?.selectedPlan?.evidenceCodes[0],
  ).toContain("rez_gap_1");
  expect(apply(s, selected).corp.credits).toBe(5);
  expect(r.fallbackUsed).toBe(false);
});

it.each([
  [
    "minimum cost drift",
    { postInstallRezQuoteVariableMinValueFinalCredits: 7 },
  ],
  [
    "maximum cost drift",
    { postInstallRezQuoteVariableMaxValueFinalCredits: 99 },
  ],
  [
    "strength not certified",
    { postInstallRezQuoteVariableEffectiveStrengthFromValue: false },
  ],
  [
    "trace-dependent strength",
    { postInstallRezQuoteVariableTraceLimitFromValue: true },
  ],
  ["family contamination", { postInstallRezQuoteVariableBaseSubtypes: "wall" }],
] as const)(
  "rejects %s rather than substituting a minimum price",
  (_name, patch) => {
    const s = fixture("onr_proteus_020_digiconda", 6);
    const install = getLegalActions(s, "corp").find(
      (a) => a.type === "install_card" && a.source.includes("digiconda"),
    )!;
    expect(
      selectedPostInstallRezCreditsFromCurrentQuote(install.payload!),
    ).toBe(6);
    expect(
      selectedPostInstallRezCreditsFromCurrentQuote({
        ...install.payload,
        ...patch,
      }),
    ).toBeUndefined();
  },
);

it.each([
  "postInstallEffectiveRunQuoteJson",
  "postInstallRezQuoteExpiresAtStateVersion",
])("keeps the native owner fail-closed without %s", (key) => {
  const i = input(fixture("onr_proteus_020_digiconda", 6));
  for (const a of i.legalActions.filter(
    (a) => a.source.includes("digiconda") && a.type === "install_card",
  ))
    delete a.payload![key];
  const r = chooseAiAction(i);
  expect(
    i.legalActions.find((a) => a.actionId === r.actionId)?.source,
  ).not.toContain("digiconda");
  expect(r.fallbackUsed).toBe(false);
});
