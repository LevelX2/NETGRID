import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { projectVisibleIceAfterPassiveRunnerInstall } from "@netgrid/engine";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { breakerCardBlocksAccessReachability } from "../../breaker-ontology-consumer";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runnerVisibleDeckBreaker } from "../rig-coverage/coverage-card-facts";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";

/** Conditional development value, never a claim of currently spendable savings.
 * The caller owns legal installation, urgency, memory and safety admission.
 */
export function assessPassiveStrengthDevelopment(
  input: AiDecisionInput,
  definitionId: string,
  memoryCost: number,
  installCredits: number,
  installClicks: number,
  minimumCreditFloor: number,
  refreshedRig: readonly VisibleCard[],
) {
  const own = input.playerView.own;
  const enriched = input as AiDecisionInputWithDeckCapabilities;
  const capabilities = buildDeckCapabilityProfileFromInput(
    input,
    enriched.ownDeckSnapshot,
  );
  const liquid = own.credits - installCredits;
  const horizon = Math.min(
    3,
    own.stackOrRdCount,
    input.playerView.opponent.deckCount - 1,
  );
  if (horizon < 2) return undefined;
  const copies = (own.rig ?? []).filter(
    (c) => c.definitionId === definitionId,
  ).length;
  const knownServers = input.playerView.servers.filter(
    (s) =>
      ["hq", "rd"].includes(s.id) && s.ice.some((c) => c.known && c.rezzed),
  );
  const quotes = (capabilities.runner?.breakerInventory ?? []).flatMap(
    (breaker) => {
      if (
        !(breaker.pumpCost! > 0) ||
        breakerCardBlocksAccessReachability(breaker.cardId)
      )
        return [];
      const installed = refreshedRig.some(
        (c) => c.definitionId === breaker.cardId,
      );
      const inHand = own.gripOrHq.some(
        (c) => c.known && c.definitionId === breaker.cardId,
      );
      if (!installed && !inHand && breaker.quantityKnownInDeck <= 0) return [];
      const projected = runnerVisibleDeckBreaker(breaker);
      if (
        !projected ||
        !Number.isSafeInteger(projected.installCost) ||
        !Number.isSafeInteger(projected.memoryCost)
      )
        return [];
      const followupCost = installed ? 0 : projected.installCost!;
      if (
        own.memoryUsed! + memoryCost + (installed ? 0 : projected.memoryCost!) >
          own.memoryLimit! ||
        liquid - followupCost < minimumCreditFloor
      )
        return [];
      // Known deck composition supplies a likelihood, never the hidden draw order.
      let miss = 1;
      for (let draw = 0; draw < Math.min(horizon, own.stackOrRdCount); draw++) {
        miss *=
          Math.max(0, own.stackOrRdCount - breaker.quantityKnownInDeck - draw) /
          (own.stackOrRdCount - draw);
      }
      const readiness = installed ? 1 : inHand ? 0.75 : (1 - miss) * 0.75;
      const rig = installed ? refreshedRig : [...refreshedRig, projected];
      const cash = liquid - followupCost;
      const evidence = [
        "runner_passive_strength_strategic_development",
        `runner_passive_strength_consumer:${breaker.cardId}`,
        `runner_passive_strength_consumer_location:${installed ? "installed" : inHand ? "hand" : "deck"}`,
        `runner_passive_strength_readiness:${readiness}`,
        `runner_passive_strength_followup_credit_reserve:${followupCost}`,
        `runner_passive_strength_future_turns:${horizon}`,
        "runner_passive_strength_future_savings_not_spendable",
      ];
      if (!knownServers.length) {
        // Intrinsic option value of persistent cost reduction, not a fabricated
        // ICE quote. Cost, additional copies and uncertain acquisition reduce it.
        const value = Math.round(
          (120 * readiness) / (copies + 1) -
            10 * (installCredits + installClicks),
        );
        if (value <= 0 || cash < minimumCreditFloor + installCredits) return [];
        return [
          {
            admitted: true,
            value: Math.min(80, value),
            priorityClass: "P5" as const,
            evidenceCodes: [
              ...evidence,
              "runner_passive_strength_unrevealed_board_option_value",
            ],
          },
        ];
      }
      const savings = knownServers.flatMap((server) => {
        const ice = server.ice.filter((c) => c.known && c.rezzed);
        const after = ice.map((c) =>
          projectVisibleIceAfterPassiveRunnerInstall(definitionId, c),
        );
        if (after.some((c) => !c)) return [];
        const cost = (cards: readonly VisibleCard[]) => {
          const path = assessKnownRezzedIcePath(
            [...cards],
            [...rig],
            runnerRunPathCreditBudgetWithVisiblePools(cash, rig),
            server.root,
            input.playerView.opponent.credits,
          );
          if (
            !path.canReachAccess ||
            path.blocked ||
            (path.futureClicksLost ?? 0) > 0 ||
            (path.conditionalAccessReasons?.length ?? 0) ||
            (path.conditionalRiskReasons?.length ?? 0) ||
            (path.postEncounterBreakerBranches?.length ?? 0) ||
            (path.unavoidableVisibleIceHazardCount ?? 0)
          )
            return undefined;
          return cash - path.creditsAfterPath;
        };
        const beforeCost = cost(ice),
          afterCost = cost(after as VisibleCard[]);
        if (
          beforeCost === undefined ||
          afterCost === undefined ||
          cash - afterCost < minimumCreditFloor
        )
          return [];
        return [Math.max(0, beforeCost - afterCost)];
      });
      const perRun = Math.max(0, ...savings);
      const net = perRun * horizon * readiness - installCredits - installClicks;
      if (net <= 0) return [];
      return [
        {
          admitted: true,
          value: Math.min(200, Math.round(net * 100)),
          priorityClass: installed ? ("P4" as const) : ("P5" as const),
          evidenceCodes: [
            ...evidence,
            `runner_passive_strength_conditional_saving_per_run:${perRun}`,
            `runner_passive_strength_conditional_net:${net}`,
          ],
        },
      ];
    },
  );
  return quotes.sort(
    (a, b) =>
      b.value - a.value ||
      a.evidenceCodes[1]!.localeCompare(b.evidenceCodes[1]!),
  )[0];
}
