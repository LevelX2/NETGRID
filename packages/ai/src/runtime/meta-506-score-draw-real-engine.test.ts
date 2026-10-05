import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition, GameState, ServerId } from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../evaluation/meta-ten-standard-decks.test-support";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import { corpScorePreservesMandatoryDrawHorizon } from "../corp/score/score-mandatory-draw-horizon";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

const cp = JSON.parse(
  readFileSync(
    new URL(
      "../evaluation/decision-checkpoints/fixtures/meta-ten-repairs/506-g39-d306.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const lab = "onr_classic_003_unlisted-research-lab";
const supers = "onr_classic_002_superserum";
const data = "onr_classic_001_data-fort-remapping";
const theorem = "onr_classic_004_theorem-proof";
afterEach(resetResidentPlanPortfolioMemory);
function apply(state: GameState, actionId: string) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
function ready(
  state: GameState,
  definitionId: string,
  serverId: Exclude<ServerId, "new_remote">,
) {
  const id = [...state.corp.rd, ...state.corp.hq].find(
    (id) => state.cardInstances[id]!.definitionId === definitionId,
  )!;
  expect(id).toBeDefined();
  state.corp.rd = state.corp.rd.filter((x) => x !== id);
  state.corp.hq = state.corp.hq.filter((x) => x !== id);
  state.corp.servers.push({
    id: serverId,
    kind: "remote",
    label: serverId,
    ice: [],
    root: [id],
  });
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    advancementCounters: 5,
  };
  return getLegalActions(state, "corp").find(
    (a) => a.type === "score_agenda" && a.payload?.cardId === id,
  )!;
}
function fixture(
  scored: readonly string[],
  remaining: number,
  withSibling = false,
) {
  const deck = (side: "runner" | "corp"): DeckDefinition => {
    const d = catalog.decks.find(
      (d) =>
        d.standardDeckId ===
        (side === "runner"
          ? "standard_runner_rent_i_con_shellspiel_2026_07_17"
          : "standard_classic_corp_superserum_control_grid_2026_07_01"),
    )!;
    return {
      id: d.standardDeckId,
      name: d.name,
      side: d.side,
      identity: d.identityCardId,
      cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
    };
  };
  let state = createGameAfterSetup({
    seed: "meta506-score-draw-positive-controls",
    runnerDeck: deck("runner"),
    corpDeck: deck("corp"),
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 30;
  for (const [i, id] of scored.entries())
    state = apply(
      state,
      ready(state, id, `remote_${i + 1}` as Exclude<ServerId, "new_remote">)
        .actionId,
    );
  const score = ready(state, lab, "remote_10");
  const sibling = withSibling ? ready(state, theorem, "remote_11") : undefined;
  // Move excess unseen own cards to Archives to control the real remaining draw horizon.
  const removed = state.corp.rd.splice(remaining);
  state.corp.archives.push(...removed);
  for (const id of removed)
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "corp", zone: "archives" },
      faceup: false,
    };
  state.corp.clicks = 0;
  const raw = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: cp.input.ownDeckSnapshot,
    eventTail: state.eventLog,
  });
  const input = {
    ...raw,
    ...buildAiDecisionInputDto(raw),
  } as AiDecisionInputWithDeckCapabilities;
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  }).find((c) => c.actionId === score.actionId)!;
  const agenda = input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.instanceId === score.payload?.cardId)!;
  return { state, input, candidate, agenda, score, sibling };
}
it("keeps a funded nonwinning mandatory-draw score with enough actual R&D", () => {
  const { state, input, candidate, agenda, score } = fixture([], 2);
  const quoted = input.legalActions.find((a) => a.actionId === score.actionId)!;
  expect(quoted.payload).toMatchObject({
    corpScoreMandatoryDrawCurrentBaseCount: 1,
    corpScoreMandatoryDrawAfterBaseCount: 2,
  });
  expect(corpScorePreservesMandatoryDrawHorizon(input, candidate, agenda)).toBe(
    true,
  );
  expect(
    getLegalActions(state, "runner").some(
      (a) => a.payload?.corpScoreMandatoryDrawQuoteSchemaVersion !== undefined,
    ),
  ).toBe(false);
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(score.actionId);
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.score_agenda",
  );
  expect(apply(state, result.actionId!).corp.scoreArea).toContain(
    agenda.instanceId,
  );
});
it("keeps a current score that wins before the otherwise lethal future draw", () => {
  const { state, input, candidate, agenda, score } = fixture(
    [supers, supers, data],
    1,
  );
  expect(input.playerView.own.agendaPoints).toBe(6);
  expect(
    input.legalActions.find((a) => a.actionId === score.actionId)!.payload,
  ).toMatchObject({
    corpScoreMandatoryDrawAfterBaseCount: 2,
    corpScoreAgendaPointsAfter: 8,
  });
  expect(corpScorePreservesMandatoryDrawHorizon(input, candidate, agenda)).toBe(
    true,
  );
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(score.actionId);
  expect(apply(state, result.actionId!).phase).toBe("game_over");
});
it("keeps an exact zero-cost score sequence that wins in the same turn", () => {
  const { state, input, candidate, agenda, score, sibling } = fixture(
    [supers, data],
    1,
    true,
  );
  expect(input.playerView.own.agendaPoints).toBe(4);
  expect(
    input.legalActions.find((a) => a.actionId === score.actionId)!.payload
      ?.corpScoreAgendaPointsAfter,
  ).toBe(6);
  expect(corpScorePreservesMandatoryDrawHorizon(input, candidate, agenda)).toBe(
    true,
  );
  const afterLab = apply(state, score.actionId);
  expect(afterLab.phase).not.toBe("game_over");
  expect(
    getLegalActions(afterLab, "corp").some(
      (a) => a.actionId === sibling!.actionId,
    ),
  ).toBe(true);
  expect(apply(afterLab, sibling!.actionId).phase).toBe("game_over");
});
it("counts previously scored mandatory sources in the actual LegalAction fact", () => {
  const { input, candidate, agenda, score } = fixture([lab], 2);
  expect(
    input.legalActions.find((a) => a.actionId === score.actionId)!.payload,
  ).toMatchObject({
    corpScoreMandatoryDrawCurrentBaseCount: 2,
    corpScoreMandatoryDrawAddedCount: 1,
    corpScoreMandatoryDrawAfterBaseCount: 3,
  });
  expect(corpScorePreservesMandatoryDrawHorizon(input, candidate, agenda)).toBe(
    false,
  );
});
