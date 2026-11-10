import { expect, it } from "vitest";
import original from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-g37-d305-bank-original.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterGuaranteedBankCashouts,
} from "../../runner-run-target-evaluation";
import {
  runnerRunHasExactUrgency,
  runnerRunRequiredPostRunReserve,
} from "../../run-analysis/runner-plan-run-funding";
import {
  runnerTerminalRemoteContestIsDirectlyMandatory,
  runnerTerminalRemoteContestVisibleHazardFundingGap,
  runnerTerminalRemoteLastChanceKnownPathFundingGap,
} from "../remote-contest/remote-contest-admission";
import { runnerCreditBankSignals } from "./credit-bank-signals";

// Canonical hints, capabilities and LegalActions from the native input. Only
// the returned funding quote is varied to test rejection at this consumer.
it.each([
  "wrong_action",
  "wrong_server",
  "unpaid",
  "blocked_reserve",
  "trace",
  "damage",
  "no_payoff",
] as const)(
  "rejects the bank provider when the funded quote is %s",
  (fault) => {
    const input = structuredClone(
      original.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const params = {
      input,
      deckCapabilities: input.ownDeckCapabilities!,
      actionCandidates: candidates,
      strategicIntent: input.ownRunnerStrategicIntent,
    };
    const economy = buildRunnerEconomyPosture(params);
    const targets = evaluateRunnerRunTargets(params);
    const quote = (
      target: (typeof targets)[number],
      ids: readonly string[],
    ) => {
      const funded = quoteRunnerRunAfterGuaranteedBankCashouts({
        input,
        deckCapabilities: input.ownDeckCapabilities!,
        fundingCandidates: ids.map(
          (id) => candidates.find((candidate) => candidate.actionId === id)!,
        ),
        runActionId: target.actionId,
        targetServerId: target.targetServerId,
      });
      if (!funded) return undefined;
      if (fault === "wrong_action") funded.actionId = "different-run";
      if (fault === "wrong_server") funded.targetServerId = "hq";
      if (fault === "unpaid") funded.routeQuote!.fundingGap = 1;
      if (fault === "blocked_reserve")
        funded.prerunReserveQuote!.status = "blocked";
      if (fault === "trace") funded.visibleTraceTagHazardUnavoidable = true;
      if (fault === "damage") funded.unavoidableVisibleIceHazardCount = 1;
      if (fault === "no_payoff")
        funded.knownAccessState = "known_no_current_payoff";
      return funded;
    };
    const signals = runnerCreditBankSignals(
      input,
      candidates,
      input.ownDeckCapabilities!,
      economy,
      targets,
      [],
      2,
      {
        turnLiquidityFundingNeeds: [],
        hasExactRunUrgency: (target) => runnerRunHasExactUrgency(input, target),
        requiredPostRunReserve: (target) =>
          runnerRunRequiredPostRunReserve(input, candidates, economy, target),
        terminalVisibleHazardFundingGap: (target) =>
          runnerTerminalRemoteContestVisibleHazardFundingGap(input, target),
        isDirectlyMandatoryRun: (target) =>
          runnerTerminalRemoteContestIsDirectlyMandatory(input, target),
        terminalKnownPathFundingGap: (target) =>
          runnerTerminalRemoteLastChanceKnownPathFundingGap(input, target),
        quoteRunAfterCashout: (target, id) => quote(target, [id]),
        quoteRunAfterCashoutRoute: quote,
        developmentFundingRoute: () => ({ actionIds: [], evidenceCodes: [] }),
      },
    );
    expect(
      signals.some(
        (signal) => signal.runFunding?.needId === "run-support:remote:remote_1",
      ),
    ).toBe(false);
  },
);
