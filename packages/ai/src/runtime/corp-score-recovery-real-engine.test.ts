import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  rememberResidentPlanPortfolio,
} from "../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../plans/tactical-plan-corp-score-conversion";
import { buildAiDecisionInput } from "./ai-decision-input";
import { sanitizeCorpScoreRecoveryQuote } from "./corp-score-recovery-quote-input";

const RECOVERY = "onr_v1_296_off-site-backups";
const SUPPORT = "onr_v1_300_project-consultants";
const AGENDA = "onr_v1_196_corporate-war";
const HOSTILE = "onr_v1_203_hostile-takeover";
const extra = [RECOVERY, SUPPORT, AGENDA, HOSTILE];
const corpDeck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "score-recovery-proof",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards.filter((c) => !extra.includes(c.id)),
    ...extra.map((id) => ({ id, quantity: 3 })),
  ],
};

function apply(
  state: GameState,
  action: LegalAction,
  selectedChoices?: PlayerAction["selectedChoices"],
): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `test:${state.stateVersion}`,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}

function fixture(): GameState {
  let state = createGameAfterSetup({
    matchId: "terminal-score-recovery",
    seed: "terminal-score-recovery",
    agendaPointsToWin: 7,
    runnerDeck: DEMO_DECKS.demo_runner_001,
    corpDeck,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(27)
    .withCorpCardInHq(RECOVERY)
    .withCorpCardInHq(AGENDA)
    .withCorpCardInHq(SUPPORT);
  state.corp.clicks = 3;
  for (const definitionId of [HOSTILE, AGENDA]) {
    const id = state.corp.rd.find(
      (id) => state.cardInstances[id]!.definitionId === definitionId,
    )!;
    expect(id).toBeDefined();
    state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
    state.corp.scoreArea.push(id);
    Object.assign(state.cardInstances[id]!, {
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    });
  }
  const support = state.corp.hq.find(
    (id) => state.cardInstances[id]!.definitionId === SUPPORT,
  )!;
  state.corp.hq = state.corp.hq.filter((id) => id !== support);
  state.corp.archives.push(support);
  Object.assign(state.cardInstances[support]!, {
    zone: { side: "corp", zone: "archives" },
    faceup: true,
  });
  return state;
}

function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    decisionId: `test:${state.stateVersion}`,
    profileId: "score-recovery",
    ownDeckSnapshot: {
      deckSnapshotId: "score-recovery",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}

beforeEach(() => resetResidentPlanPortfolioMemory());

it("executes an Engine-quoted Archives recovery and exact choice under the terminal Score owner", () => {
  let state = fixture();
  const initial = inputFor(state);
  const recovery = initial.legalActions.find((a) => a.corpScoreRecoveryQuote)!;
  const quote = recovery.corpScoreRecoveryQuote!;
  expect(quote).toMatchObject({
    actionId: recovery.actionId,
    sourceCardId: recovery.source,
    stateVersion: state.stateVersion,
    options: [
      {
        definitionId: SUPPORT,
        playClicks: 1,
        playCredits: 12,
        advancementAmount: 4,
      },
    ],
  });
  expect(
    getLegalActions(state, "runner").some((a) => a.corpScoreRecoveryQuote),
  ).toBe(false);
  const actionTypes: string[] = [];
  let originalExecutor: string | undefined;
  for (let n = 0; n < 6; n++) {
    const input = inputFor(state),
      decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action).toBeDefined();
    expect(decision.fallbackUsed).toBe(false);
    if (n < 2) {
      expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
      const portfolio = residentPlanPortfolioSnapshot(input)!;
      const executor = portfolio.executorInstanceId;
      if (n === 0) {
        originalExecutor = executor;
        expect(action.actionId).toBe(recovery.actionId);
        expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
          capabilityId: "recover_score_support",
        });
        expect(portfolio.selectedActionOrigin).toMatchObject({
          selectedActionId: recovery.actionId,
          selectedAtStateVersion: input.playerView.stateVersion,
          selectedArchiveCardInstanceIds: [quote.options[0]!.cardId],
        });
      } else {
        expect(executor).toBe(originalExecutor);
        const option = input.playerView.pendingChoice!.options.find(
          (o) => o.value === quote.options[0]!.cardId,
        )!;
        expect(JSON.stringify(decision.selectedChoices)).toContain(option.id);
      }
    }
    actionTypes.push(action.type);
    state = apply(state, action, decision.selectedChoices);
  }
  expect(actionTypes).toEqual([
    "play_operation",
    "resolve_choice",
    "install_card",
    "play_operation",
    "resolve_choice",
    "score_agenda",
  ]);
  expect(state.winner).toBe("corp");
});

it.each([
  "cash",
  "clicks",
  "nonterminal",
  "missing_quote",
  "stale_quote",
  "wrong_source",
  "missing_archive",
] as const)(
  "does not publish a recovery win without complete current evidence: %s",
  (variant) => {
    const input = inputFor(fixture());
    const recovery = input.legalActions.find((a) => a.corpScoreRecoveryQuote)!;
    if (variant === "cash") input.playerView.own.credits = 11;
    if (variant === "clicks") input.playerView.own.clicks = 2;
    if (variant === "nonterminal") input.playerView.own.agendaPoints = 3;
    if (variant === "missing_quote") delete recovery.corpScoreRecoveryQuote;
    if (variant === "stale_quote")
      recovery.corpScoreRecoveryQuote = {
        ...recovery.corpScoreRecoveryQuote!,
        stateVersion: 0,
      };
    if (variant === "wrong_source")
      recovery.corpScoreRecoveryQuote = {
        ...recovery.corpScoreRecoveryQuote!,
        sourceCardId: "wrong",
      };
    if (variant === "missing_archive") input.playerView.own.heapOrArchives = [];
    expect(
      corpSameTurnScoreConversionPaths(input).some(
        (p) => p.steps[0]?.kind === "recover_score_support",
      ),
    ).toBe(false);
  },
);

it.each(["origin", "state", "target", "source"] as const)(
  "fails closed for a changed recovery continuation: %s",
  (variant) => {
    let state = fixture();
    const initial = inputFor(state),
      decision = chooseAiAction(initial);
    const portfolio = residentPlanPortfolioSnapshot(initial)!;
    if (variant === "origin") delete portfolio.selectedActionOrigin;
    else if (variant === "state")
      portfolio.selectedActionOrigin = {
        ...portfolio.selectedActionOrigin!,
        selectedAtStateVersion:
          portfolio.selectedActionOrigin!.selectedAtStateVersion - 1,
      };
    else {
      const executor = portfolio.instances.find(
        (p) => p.instanceId === portfolio.executorInstanceId,
      )!;
      const signal = (
        executor.moduleState as {
          signal: {
            recoveryChoiceBinding: {
              recoveredCardId: string;
              sourceCardId: string;
            };
          };
        }
      ).signal;
      if (variant === "target")
        signal.recoveryChoiceBinding.recoveredCardId = "wrong";
      if (variant === "source")
        signal.recoveryChoiceBinding.sourceCardId = "wrong";
    }
    rememberResidentPlanPortfolio(initial, portfolio);
    state = apply(
      state,
      initial.legalActions.find((a) => a.actionId === decision.actionId)!,
    );
    expect(() => chooseAiAction(inputFor(state))).toThrow();
  },
);

it("rejects a malformed DTO quote instead of dropping its binding", () => {
  const recovery = inputFor(fixture()).legalActions.find(
    (a) => a.corpScoreRecoveryQuote,
  )!;
  recovery.corpScoreRecoveryQuote = {
    ...recovery.corpScoreRecoveryQuote!,
    actionId: "wrong",
  };
  expect(() => sanitizeCorpScoreRecoveryQuote(recovery)).toThrow(
    "invalid_corp_score_recovery_quote_binding",
  );
});
