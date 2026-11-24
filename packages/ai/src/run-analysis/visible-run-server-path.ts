import type { AiDecisionInput } from "@netgrid/shared";
import { serverBlocksStealthBitPayments } from "../runtime/server-target";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { visibleRunnerPathTraceContext } from "./trace-rules-profile-planning";
import { runnerRunPathCreditBudgetWithVisiblePools } from "./visible-run-credit-budget";

type VisibleRunnerDecision = Pick<
  AiDecisionInput,
  "side" | "playerView" | "legalActions"
>;
type VisibleServer = AiDecisionInput["playerView"]["servers"][number];

/** Quote a prospective path without spending the Run-only pool on Trace bids. */
export function assessVisibleRunnerServerPath(
  input: VisibleRunnerDecision,
  server: VisibleServer,
  options: {
    liquidCredits?: number;
    assessKnownPath?: typeof assessKnownRezzedIcePath;
  } = {},
): ReturnType<typeof assessKnownRezzedIcePath> {
  const { own, opponent } = input.playerView;
  const rig = own.rig ?? [];
  const liquidCredits = options.liquidCredits ?? own.credits;
  const excludeStealthCredits = serverBlocksStealthBitPayments(server);
  const assessKnownPath = options.assessKnownPath ?? assessKnownRezzedIcePath;
  return assessKnownPath(
    server.ice,
    rig,
    runnerRunPathCreditBudgetWithVisiblePools(
      liquidCredits + (own.availableBadPublicityRunCredits ?? 0),
      rig,
      { liquidCredits, excludeStealthCredits },
    ),
    server.root,
    opponent.credits,
    {
      ...visibleRunnerPathTraceContext(input),
      ...(excludeStealthCredits ? { excludeStealthTraceCredits: true } : {}),
    },
  );
}
