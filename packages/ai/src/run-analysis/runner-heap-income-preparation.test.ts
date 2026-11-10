import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import checkpoint from "../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g28-d378-recovery-funding.json";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import {
  runnerHeapIncomePreparation,
  runnerHeapIncomePreparationMatchesCandidate,
} from "./runner-heap-income-preparation";

function facts() {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((entry) => entry.actionId === "runner.start_run.remote_1")!;
  const action = input.legalActions.find(
    (entry) =>
      entry.payload?.cardImplementationEffectKind === "move_top_trash_to_grip",
  )!;
  return { input, candidates, target, action };
}

it("quotes all four real phases without manufacturing future LegalActions", () => {
  const { input, candidates, target, action } = facts();
  const fingerprint = () =>
    createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const before = fingerprint();
  const quote = runnerHeapIncomePreparation(input, candidates, target);
  expect(quote).toMatchObject({
    targetCredits: 26,
    routeActionIds: [action.actionId],
    routeAssessment: {
      totalClickCost: 3,
      firstStepActionId: action.actionId,
      heapIncomePreparation: {
        basicCreditCount: 1,
        projectedRunCredits: 26,
        completeKnownPathCost: 26,
      },
    },
  });
  expect(
    runnerHeapIncomePreparationMatchesCandidate(
      input,
      candidates.find((entry) => entry.actionId === action.actionId)!,
      quote!.routeAssessment.heapIncomePreparation!,
    ),
  ).toBe(true);
  expect(fingerprint()).toBe(before);
  expect(
    input.legalActions.some(
      (entry) =>
        entry.type === "install_card" &&
        entry.source === action.payload?.targetCardId,
    ),
  ).toBe(false);
});

it.each([
  "hidden_heap",
  "wrong_top",
  "stale_source",
  "wrong_definition",
  "unknown_ice",
  "wrong_server",
  "no_basic_credit",
  "nonterminal",
] as const)(
  "rejects unsupported or unbound recovery arithmetic: %s",
  (variant) => {
    const { input, candidates, target, action } = facts();
    if (variant === "hidden_heap")
      input.playerView.own.heapOrArchives.at(-1)!.known = false;
    if (variant === "wrong_top") input.playerView.own.heapOrArchives.reverse();
    if (variant === "stale_source") action.expiresAtStateVersion--;
    if (variant === "wrong_definition")
      action.payload!.targetDefinitionId = "unbound";
    if (variant === "unknown_ice") target.routeQuote!.unknownIceCount = 1;
    if (variant === "wrong_server")
      target.targetServerId = "not_the_bound_remote";
    if (variant === "nonterminal") input.playerView.opponent.agendaPoints = 0;
    const available =
      variant === "no_basic_credit"
        ? candidates.filter((entry) => entry.actionId !== "runner.gain_credit")
        : candidates;
    expect(
      runnerHeapIncomePreparation(input, available, target),
    ).toBeUndefined();
  },
);
