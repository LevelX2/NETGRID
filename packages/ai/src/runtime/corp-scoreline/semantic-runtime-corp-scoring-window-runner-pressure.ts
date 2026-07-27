import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "../../ai-hints";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { semanticRuntimeCorpObservedRemoteReachability } from "../semantic-runtime-corp-remote-reachability";
import { visibleRunnerExposureCreditValue } from "../visible-runner-action-economy";
import type { CorpServerLike } from "./semantic-runtime-corp-scoring-window-contracts";
import { SCORING_WINDOW_AI_HINTS_BY_CARD } from "./semantic-runtime-corp-scoring-window-card-data";

function scoringWindowVisibleCardText(card: VisibleCard): string {
  const runtimeText =
    card.definitionId !== undefined
      ? (RUNTIME_CARDS[card.definitionId] as
          | {
              text?: string;
              rulesText?: string;
            }
          | undefined)
      : undefined;
  const demoText =
    card.definitionId !== undefined
      ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.rulesText
      : undefined;
  return [
    card.title,
    card.rulesText,
    runtimeText?.text,
    runtimeText?.rulesText,
    demoText,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

export function scoringWindowVisibleCardTextTokens(
  card: VisibleCard,
): string[] {
  return scoringWindowVisibleCardText(card)
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function scoringWindowAccessAssessment(
  input: AiDecisionInput,
  server: CorpServerLike | undefined,
  extraRunnerCredits = 0,
): {
  runnerCanReachAccessNow: boolean;
  agendaStealRelevantNow: boolean;
  missingVisibleBreakerCoverage: boolean;
  effectiveIceCount: number;
  unmodeledIceCount: number;
  visibleRunnerIcebreakerCount: number;
  visibleRunnerContestCredits: number;
  visibleBreakCost?: number;
  evidence: string[];
} {
  const visibleRunnerBaseContestCredits =
    input.playerView.opponent.credits +
    visibleRunnerRunCreditPool(input.playerView.opponent.rig ?? []);
  const visibleRunnerExtraCredits = Math.max(0, Math.floor(extraRunnerCredits));
  const visibleRunnerPreRunCreditBonus =
    visibleRunnerExtraCredits > 0
      ? visibleRunnerPreRunCreditBurstBonus(
          input.playerView.opponent.rig ?? [],
          visibleRunnerExtraCredits,
        )
      : 0;
  const visibleRunnerContestCredits =
    visibleRunnerBaseContestCredits +
    visibleRunnerExtraCredits +
    visibleRunnerPreRunCreditBonus;
  const runnerPathCandidates = visibleRunnerBreakerPathCandidates(
    input,
    visibleRunnerContestCredits,
    input.side === "corp" && input.playerView.activeSide === "corp",
  );
  const baseRunnerPathCandidate = runnerPathCandidates[0]!;
  const visibleRunnerIcebreakerCount =
    baseRunnerPathCandidate.visibleIcebreakerCount;
  if (!server || server.ice.length === 0) {
    return {
      runnerCanReachAccessNow: true,
      agendaStealRelevantNow: true,
      missingVisibleBreakerCoverage: false,
      effectiveIceCount: 0,
      unmodeledIceCount: 0,
      visibleRunnerIcebreakerCount,
      visibleRunnerContestCredits,
      visibleBreakCost: 0,
      evidence: [
        "remote_access:unprotected",
        `visible_runner_base_contest_credits:${visibleRunnerBaseContestCredits}`,
        `visible_runner_extra_exposure_credits:${visibleRunnerExtraCredits}`,
        `visible_runner_pre_run_credit_take_bonus:${visibleRunnerPreRunCreditBonus}`,
      ],
    };
  }
  const projectedIce = server.ice.map((ice) => ({
    ...ice,
    known: ice.known !== false,
    rezzed: true,
  }));
  const evaluatedRunnerPaths = runnerPathCandidates.map((candidate) => ({
    ...candidate,
    assessment: assessKnownRezzedIcePath(
      projectedIce,
      candidate.rig,
      candidate.creditsAfterStagedInstall,
      [...server.root],
    ),
  }));
  const selectedRunnerPath = evaluatedRunnerPaths.reduce((best, candidate) =>
    scoringWindowRunnerPathCandidateIsBetter(candidate, best)
      ? candidate
      : best,
  );
  const assessment = selectedRunnerPath.assessment;
  const effectiveVisibleRunnerIcebreakerCount =
    selectedRunnerPath.visibleIcebreakerCount;
  const unmodeledIceCount = projectedIce.filter(
    (ice) => !iceHasModeledRunImpact(ice),
  ).length;
  const unmodeledBlocksVisibleAccess =
    unmodeledIceCount > 0 && effectiveVisibleRunnerIcebreakerCount === 0;
  const observedReachability = server
    ? semanticRuntimeCorpObservedRemoteReachability(input, server.id, server)
    : undefined;
  const runnerCanReachAccessNow =
    observedReachability?.applies === true ||
    (!unmodeledBlocksVisibleAccess &&
      assessment.canReachAccess &&
      assessment.creditsAfterPath >= 0);
  const hazardPenalty = assessment.visibleIceHazardPenalty ?? 0;
  const agendaStealRelevantNow =
    observedReachability?.applies === true ||
    (runnerCanReachAccessNow &&
      hazardPenalty < 600 &&
      assessment.creditsAfterPath >= 0);
  const missingVisibleBreakerCoverage =
    assessment.knownPathBlockedByMissingCoverage ||
    assessment.noAccessReason === "missing_breaker_coverage" ||
    (assessment.missingCoverage?.length ?? 0) > 0;
  return {
    runnerCanReachAccessNow,
    agendaStealRelevantNow,
    missingVisibleBreakerCoverage,
    effectiveIceCount: assessment.assessedKnownIceCount,
    unmodeledIceCount,
    visibleRunnerIcebreakerCount: effectiveVisibleRunnerIcebreakerCount,
    visibleRunnerContestCredits,
    ...(assessment.visibleBreakCost !== undefined
      ? {
          visibleBreakCost:
            assessment.visibleBreakCost +
            selectedRunnerPath.stagedInstallCreditCost,
        }
      : {}),
    evidence: [
      `remote_access:assessed_known_ice:${assessment.assessedKnownIceCount}`,
      `remote_access:can_reach:${assessment.canReachAccess}`,
      `remote_access:credits_after_path:${assessment.creditsAfterPath}`,
      `remote_access:unmodeled_ice_count:${unmodeledIceCount}`,
      `remote_access:unmodeled_blocks_visible_access:${unmodeledBlocksVisibleAccess}`,
      `visible_runner_icebreaker_count:${effectiveVisibleRunnerIcebreakerCount}`,
      `public_staged_breaker_used:${selectedRunnerPath.stagedBreakerCount > 0}`,
      `public_staged_breaker_count:${selectedRunnerPath.stagedBreakerCount}`,
      `public_staged_breaker_install_credit_cost:${selectedRunnerPath.stagedInstallCreditCost}`,
      ...(assessment.visibleBreakCost !== undefined
        ? [
            `remote_access:visible_break_cost:${assessment.visibleBreakCost + selectedRunnerPath.stagedInstallCreditCost}`,
          ]
        : []),
      ...(assessment.noAccessReason
        ? [`remote_access:no_access_reason:${assessment.noAccessReason}`]
        : []),
      `visible_runner_base_contest_credits:${visibleRunnerBaseContestCredits}`,
      `visible_runner_extra_exposure_credits:${visibleRunnerExtraCredits}`,
      `visible_runner_pre_run_credit_take_bonus:${visibleRunnerPreRunCreditBonus}`,
      ...(observedReachability?.evidence ?? []),
    ],
  };
}

function visibleRunnerRunCreditPool(rig: readonly VisibleCard[]): number {
  return rig.reduce((sum, card) => {
    if (card.known === false) return sum;
    return (
      sum +
      (card.counterDisplays ?? []).reduce((cardSum, display) => {
        const uses = display.creditPool?.uses ?? [];
        if (
          uses.includes("using_icebreaker_during_run") ||
          uses.includes("using_icebreaker_during_run_non_noisy") ||
          uses.includes("using_killer_during_run")
        ) {
          return cardSum + Math.max(0, Math.floor(display.amount));
        }
        return cardSum;
      }, 0)
    );
  }, 0);
}

function visibleRunnerPreRunCreditBurstBonus(
  rig: readonly VisibleCard[],
  availableCreditActions: number,
): number {
  let remainingActions = Math.max(0, Math.floor(availableCreditActions));
  if (remainingActions <= 0) return 0;
  const takeAmounts = rig
    .map(visibleRunnerPreRunCreditTakeAmount)
    .filter((amount) => amount > 1)
    .sort((left, right) => right - left);
  let bonus = 0;
  for (const amount of takeAmounts) {
    if (remainingActions <= 0) break;
    bonus += amount - 1;
    remainingActions -= 1;
  }
  return bonus;
}

function visibleRunnerPreRunCreditTakeAmount(card: VisibleCard): number {
  if (card.known === false) return 0;
  const storedCredits = visibleRunnerStoredCreditCounterAmount(card);
  if (storedCredits <= 1) return 0;
  const tokens = scoringWindowVisibleCardTextTokens(card);
  const tokenSet = new Set(tokens);
  const hasCreditToken =
    tokenSet.has("credit") ||
    tokenSet.has("credits") ||
    tokenSet.has("bit") ||
    tokenSet.has("bits");
  const hasTakeAll =
    tokensIncludePhrase(tokens, ["take", "all"]) ||
    tokensIncludePhrase(tokens, ["take", "all", "the"]) ||
    tokensIncludePhrase(tokens, ["nimm", "alle"]) ||
    tokensIncludePhrase(tokens, ["nehme", "alle"]);
  return hasCreditToken && hasTakeAll ? storedCredits : 0;
}

function visibleRunnerStoredCreditCounterAmount(card: VisibleCard): number {
  const counterAmount = Object.entries(card.counters ?? {}).reduce(
    (sum, [key, value]) =>
      visibleRunnerStoredCreditCounterKey(key) && typeof value === "number"
        ? sum + Math.max(0, Math.floor(value))
        : sum,
    0,
  );
  const displayAmount = (card.counterDisplays ?? []).reduce((sum, display) => {
    if (!visibleRunnerStoredCreditCounterKey(display.counterType)) return sum;
    if (display.creditPool !== undefined) return sum;
    return sum + Math.max(0, Math.floor(display.amount));
  }, 0);
  return Math.max(counterAmount, displayAmount);
}

function visibleRunnerStoredCreditCounterKey(key: string | undefined): boolean {
  return (
    key === "bit" ||
    key === "bits" ||
    key === "credit" ||
    key === "credits" ||
    key === "stored_credit"
  );
}

function visibleRunnerInstalledIcebreakerCount(
  rig: readonly VisibleCard[],
): number {
  return rig.filter(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      (card.subtypes ?? []).some(
        (subtype) => subtype.toLocaleLowerCase("en-US") === "icebreaker",
      ),
  ).length;
}

type ScoringWindowRunnerPathCandidate = {
  rig: VisibleCard[];
  creditsAfterStagedInstall: number;
  stagedInstallCreditCost: number;
  stagedBreakerCount: number;
  visibleIcebreakerCount: number;
};

function visibleRunnerBreakerPathCandidates(
  input: AiDecisionInput,
  visibleRunnerContestCredits: number,
  futureRunnerTurnStartAvailable: boolean,
): ScoringWindowRunnerPathCandidate[] {
  const installedRig = [...(input.playerView.opponent.rig ?? [])];
  const baseCandidate: ScoringWindowRunnerPathCandidate = {
    rig: installedRig,
    creditsAfterStagedInstall: visibleRunnerContestCredits,
    stagedInstallCreditCost: 0,
    stagedBreakerCount: 0,
    visibleIcebreakerCount: visibleRunnerInstalledIcebreakerCount(installedRig),
  };
  if (!visibleRunnerHasPaidDelayedInstallSource(installedRig)) {
    return [baseCandidate];
  }
  const stagedBreakers = (input.playerView.specialZones?.setAside ?? []).filter(
    (card) =>
      visibleRunnerPublicStagedBreaker(card) &&
      visibleRunnerStagedProgramFitsMemory(input, card),
  );
  return [
    baseCandidate,
    ...stagedBreakers.flatMap((card) => {
      const installCreditCost = Math.max(
        0,
        Math.floor(card.counters?.shell ?? 0) -
          (futureRunnerTurnStartAvailable ? 1 : 0),
      );
      if (installCreditCost > visibleRunnerContestCredits) return [];
      const projectedRig = [...installedRig, card];
      return [
        {
          rig: projectedRig,
          creditsAfterStagedInstall:
            visibleRunnerContestCredits - installCreditCost,
          stagedInstallCreditCost: installCreditCost,
          stagedBreakerCount: 1,
          visibleIcebreakerCount:
            visibleRunnerInstalledIcebreakerCount(projectedRig),
        },
      ];
    }),
  ];
}

function visibleRunnerHasPaidDelayedInstallSource(
  rig: readonly VisibleCard[],
): boolean {
  return rig.some((card) => {
    if (card.known === false || !card.definitionId) return false;
    const hint = SCORING_WINDOW_AI_HINTS_BY_CARD.get(card.definitionId);
    return (
      hint?.roles?.includes("delayed_install") === true &&
      hint.effects?.some(
        (effect) =>
          effect.timing === "persistent" &&
          "target" in effect &&
          effect.target === "setup.install_countdown",
      ) === true
    );
  });
}

function visibleRunnerPublicStagedBreaker(card: VisibleCard): boolean {
  return (
    card.known === true &&
    card.owner === "runner" &&
    card.type === "program" &&
    typeof card.counters?.shell === "number" &&
    visibleRunnerInstalledIcebreakerCount([card]) === 1
  );
}

function visibleRunnerStagedProgramFitsMemory(
  input: AiDecisionInput,
  card: VisibleCard,
): boolean {
  const memoryUsed = input.playerView.opponent.memoryUsed;
  const memoryLimit = input.playerView.opponent.memoryLimit;
  if (
    typeof memoryUsed !== "number" ||
    typeof memoryLimit !== "number" ||
    typeof card.memoryCost !== "number"
  ) {
    return true;
  }
  return memoryUsed + Math.max(0, card.memoryCost) <= memoryLimit;
}

function scoringWindowRunnerPathCandidateIsBetter(
  candidate: ScoringWindowRunnerPathCandidate & {
    assessment: ReturnType<typeof assessKnownRezzedIcePath>;
  },
  current: ScoringWindowRunnerPathCandidate & {
    assessment: ReturnType<typeof assessKnownRezzedIcePath>;
  },
): boolean {
  if (
    candidate.assessment.canReachAccess !== current.assessment.canReachAccess
  ) {
    return candidate.assessment.canReachAccess;
  }
  if (
    candidate.assessment.creditsAfterPath !==
    current.assessment.creditsAfterPath
  ) {
    return (
      candidate.assessment.creditsAfterPath >
      current.assessment.creditsAfterPath
    );
  }
  const candidateTotalCost =
    (candidate.assessment.visibleBreakCost ?? Number.POSITIVE_INFINITY) +
    candidate.stagedInstallCreditCost;
  const currentTotalCost =
    (current.assessment.visibleBreakCost ?? Number.POSITIVE_INFINITY) +
    current.stagedInstallCreditCost;
  if (candidateTotalCost !== currentTotalCost) {
    return candidateTotalCost < currentTotalCost;
  }
  return candidate.stagedBreakerCount < current.stagedBreakerCount;
}

export function iceHasModeledRunImpact(ice: VisibleCard): boolean {
  if (ice.effectiveRunQuote) return true;
  const definitionId = ice.definitionId;
  if (!definitionId) return false;
  return (
    RUNTIME_CARDS[definitionId] !== undefined ||
    CARD_DEFINITIONS_BY_ID[definitionId] !== undefined
  );
}

export function tokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some(
    (token, index) =>
      token === phrase[0] &&
      phrase.every(
        (phraseToken, offset) => tokens[index + offset] === phraseToken,
      ),
  );
}

export function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}
