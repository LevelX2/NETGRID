import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  validateGameState,
} from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS } from "@netgrid/shared";
import { removeEverywhere } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";
import { corpStartRunRedirectInstallSignal } from "./start-run-redirect-install";

function board(credits: number) {
  const cards = [
    { id: 132, quantity: 2 },
    { id: 5, quantity: 5 },
    { id: 560, quantity: 5 },
    { id: 573, quantity: 1 },
  ];
  const state = createGameAfterSetup({
    seed: "exposed-hq-start-run-redirect",
    runnerDeck: ORIGINALSET_DEFAULT_DECKS.runner,
    corpDeck: { ...ORIGINALSET_DEFAULT_DECKS.corp, cards },
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.turnSerial = 6;
  state.corp.clicks = 1;
  state.corp.credits = credits;
  const agendas = Object.values(state.cardInstances).filter(
    (c) => c.owner === "corp" && c.definitionId === 5,
  );
  const sources = Object.values(state.cardInstances).filter(
    (c) => c.owner === "corp" && c.definitionId === 132,
  );
  for (const c of Object.values(state.cardInstances).filter(
    (c) => c.owner === "corp" && cards.some((d) => d.id === c.definitionId),
  )) {
    removeEverywhere(state, c.instanceId);
    if (agendas.slice(0, 3).includes(c)) {
      c.zone = { side: "runner", zone: "scoreArea" };
      c.faceup = true;
      state.runner.scoreArea.push(c.instanceId);
    } else if (agendas.includes(c) || c === sources[0]) {
      c.zone = { side: "corp", zone: "hq" };
      state.corp.hq.push(c.instanceId);
    } else {
      c.zone = { side: "corp", zone: "rd" };
      state.corp.rd.push(c.instanceId);
    }
  }
  expect(validateGameState(state)).toEqual({ ok: true, errors: [] });
  function readInput() {
    const raw = buildAiDecisionInput(state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: {
        deckSnapshotId: "redirect-install-test",
        side: "corp",
        cards: cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
      },
    });
    return { ...raw, ...buildAiDecisionInputDto(raw) };
  }
  return { state, readInput, source: sources[0]!, spare: sources[1]!, agendas };
}

function placement(
  input: ReturnType<ReturnType<typeof board>["readInput"]>,
  serverId = "new_remote",
) {
  const source = input.playerView.own.gripOrHq.find(
    (c) => c.definitionId === 132,
  )!;
  const action = input.legalActions.find(
    (a) =>
      a.type === "install_card" &&
      a.source === source.instanceId &&
      a.payload?.serverId === serverId,
  )!;
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [source.instanceId]: source.definitionId!,
    },
  });
  const allocation = allocateCorpCentralDefenseFromAiFacts({ input });
  return {
    action,
    candidate: candidate!,
    allocation,
    signal: corpStartRunRedirectInstallSignal(
      input,
      candidate!,
      allocation,
      [],
    ),
  };
}

afterEach(resetResidentPlanPortfolioMemory);
describe("funded run redirection from an agenda-free fort", () => {
  it("assigns the exact native install to Defense when HQ contains match-winning agendas", () => {
    const { state, readInput, source } = board(4),
      input = readInput();
    const { signal, action } = placement(input);
    expect(signal).toMatchObject({
      phase: "install_defense_support",
      protectedCentralServerId: "hq",
      actionIds: [action.actionId],
    });
    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: action.actionId,
      fallbackUsed: false,
      timeoutUsed: false,
      decisionDebug: {
        planFirstDecision: {
          selectedPlan: { moduleId: "corp.defend_servers" },
          route: {
            actionId: action.actionId,
            stateVersion: state.stateVersion,
            semanticActionType: "install.card",
          },
        },
      },
    });
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.rootPlanInstanceId).toBe(plan.leafExecutorInstanceId);
    expect(plan.route!.stepId).toBe(plan.selectedStep!.stepId);
    const installed = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "funded-redirect-install",
    });
    if (!installed.ok) throw Error(JSON.stringify(installed.error));
    expect(installed.state.cardInstances[source.instanceId]!.rezzed).toBe(true);
    expect(installed.state.corp.credits).toBe(1);
  });
  it("requires enough money for the first redirect and a current, known access risk", () => {
    const { readInput } = board(3);
    expect(placement(readInput()).signal).toBeUndefined();
    const input = board(4).readInput(),
      { candidate, allocation } = placement(input);
    expect(
      corpStartRunRedirectInstallSignal(
        input,
        candidate,
        { status: "unknown", reason: "incomplete_or_invalid_facts" },
        [],
      ),
    ).toBeUndefined();
    expect(
      corpStartRunRedirectInstallSignal(
        input,
        { ...candidate, stateVersion: candidate.stateVersion! + 1 },
        allocation,
        [],
      ),
    ).toBeUndefined();
  });
  it("leaves an active diversion in place and avoids a legal second slot next to an agenda", () => {
    const { state, readInput, spare, agendas } = board(7);
    removeEverywhere(state, spare.instanceId);
    const server = {
      id: "r1" as const,
      kind: "remote" as const,
      label: "Remote 1",
      ice: [],
      root: [spare.instanceId],
    };
    state.corp.servers.push(server);
    spare.zone = { side: "corp", zone: "serverRoot", serverId: "r1" };
    spare.rezzed = true;
    spare.faceup = true;
    expect(placement(readInput()).signal).toBeUndefined();
    const agenda = agendas.at(-1)!;
    const plaza = Object.values(state.cardInstances).find(
      (c) => c.definitionId === 573,
    )!;
    removeEverywhere(state, agenda.instanceId);
    removeEverywhere(state, spare.instanceId);
    removeEverywhere(state, plaza.instanceId);
    spare.zone = { side: "corp", zone: "archives" };
    state.corp.archives.push(spare.instanceId);
    agenda.zone = { side: "corp", zone: "serverRoot", serverId: "r1" };
    plaza.zone = { side: "corp", zone: "serverRoot", serverId: "r1" };
    plaza.rezzed = true;
    plaza.faceup = true;
    server.root = [agenda.instanceId, plaza.instanceId];
    expect(validateGameState(state)).toEqual({ ok: true, errors: [] });
    expect(placement(readInput(), "r1").signal).toBeUndefined();
  });
});
