import { visibleRunnerNextTurnPreparationCreditGain } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { visibleRunnerHeapBreakerPreparations } from "../../runtime/corp-public-heap-breaker-preparation";
import { assessCorpScoreProtection } from "../../runtime/corp-score-protection-assessment";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";

/**
 * Keep one affordable, visibly useful ICE option for an acute open central.
 * This is a retention scenario for the next Corp turn, not an install or rez
 * verdict. ICE cannot prevent an access before it can be installed.
 */
export function corpAcuteDefenseHandOptions(
  input: AiDecisionInput,
  allocation: CorpCentralDefenseAllocation | undefined,
): ReadonlySet<string> {
  const { own, opponent, servers } = input.playerView;
  const retained = new Set<string>();
  const preparationClicks = input.playerView.runnerNextTurnCreditClicks;
  if (
    allocation?.status !== "known" ||
    !opponent.rig ||
    preparationClicks === undefined
  )
    return retained;
  const uncovered = servers.filter(
    (server) =>
      (server.id === "hq" || server.id === "rd") &&
      (allocation.evidence[server.id].threat === "acute" ||
        allocation.evidence[server.id].threat === "terminal") &&
      server.ice.length === 0 &&
      !server.statuses?.some((status) => status.kind === "run_prohibited"),
  );
  if (uncovered.length === 0) return retained;
  const credits =
    own.credits -
    (own.installRezOnlyCredits ?? 0) -
    (own.corpEndTurnCreditObligation?.creditsDue ?? 0);
  const runnerRig = opponent.rig;
  const preparedBreakers = visibleRunnerHeapBreakerPreparations(input);
  const preparationCredits = visibleRunnerNextTurnPreparationCreditGain(
    runnerRig,
    preparationClicks,
  );
  for (const card of own.gripOrHq) {
    const definition = card.definitionId
      ? CARD_DEFINITIONS_BY_ID[card.definitionId]
      : undefined;
    if (
      !card.known ||
      definition?.type !== "ice" ||
      !Number.isSafeInteger(definition.rezCost) ||
      definition.rezCost! > credits
    )
      continue;
    if (
      uncovered.some((server) => {
        const protection = assessCorpScoreProtection({
          serverIce: [{ ...card, rezzed: true }],
          serverRoot: server.root,
          runnerRig,
          runnerDeckCount: opponent.deckCount,
          runnerSetAside: input.playerView.specialZones?.setAside ?? [],
          runnerCredits: opponent.credits,
          runnerRunOnlyCredits:
            input.playerView.runnerNextRunBadPublicityCredits ?? 0,
          runnerCreditPoolHorizon: "next_runner_turn",
          runnerPublicPreparedBreakers: preparedBreakers,
          runnerPreparationCreditClicks: preparationCredits,
          ...(opponent.memoryUsed !== undefined
            ? { runnerMemoryUsed: opponent.memoryUsed }
            : {}),
          ...(opponent.memoryLimit !== undefined
            ? { runnerMemoryLimit: opponent.memoryLimit }
            : {}),
          maximumRunnerAccessSuccessProbability: {
            numerator: 0,
            denominator: 1,
          },
        });
        return protection.knowledge === "known" && protection.protectsScore;
      })
    )
      retained.add(card.instanceId);
  }
  return retained;
}
