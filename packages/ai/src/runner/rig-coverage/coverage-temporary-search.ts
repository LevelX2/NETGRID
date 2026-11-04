import {
  runPurposeForEvaluation,
  runnerInformationProbeKnownPathIsAdmitted,
} from "../../plans/runner-run-purpose";
import { runnerTerminalRemoteContestIsDirectlyMandatory } from "../remote-contest/remote-contest-admission";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import type { DeckCapabilityProfile } from "../../deck-capabilities";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterHandBufferDraws,
} from "../../runner-run-target-evaluation";
import { runnerDefenseHandBufferFacts } from "../defense-recovery/defense-signals";
import { runnerVisibleDeckBreaker } from "./coverage-card-facts";
import type { RunnerCoverageServices } from "./coverage-services";

/** Prospective own-resource quote only. No action is created or executed here. */
export function runnerTemporaryCoverageSearchHorizonBinding(
  input: AiDecisionInput,
  gap: RunnerCoverageGapSignal,
  candidates: readonly ActionSemanticCandidate[],
  deckCapabilities: DeckCapabilityProfile,
  services: RunnerCoverageServices,
  strategicIntent: RunnerStrategicIntentProfile,
): RunnerCoverageGapSignal {
  const rejected = new Map<string, string>();
  for (const candidate of candidates) {
    const temporary =
      candidate.functionalEffects?.some(
        (e) =>
          e.kind === "delayed_penalty" &&
          e.timing === "runner_turn" &&
          e.target === "end_of_turn_bounce",
      ) === true;
    const terminalRunNeed =
      gap.priorityClass === "P2" &&
      gap.requesterModuleId === "runner.contest_remote";
    if (
      !gap.directSearchActionIds.includes(candidate.actionId) ||
      (!temporary && !terminalRunNeed)
    )
      continue;
    const fail = (reason: string) => rejected.set(candidate.actionId, reason);
    const source = input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    const run = input.legalActions.find(
      (a) => a.actionId === gap.targetRunActionId,
    );
    const binding = gap.directSearchChoiceBindings?.find(
      (b) => b.actionId === candidate.actionId,
    );
    const breaker = deckCapabilities.runner?.breakerInventory.find(
      (b) => b.cardId === binding?.targetDefinitionId,
    );
    const heapCard = binding?.targetCardInstanceId
      ? input.playerView.own.heapOrArchives.find(
          (c) =>
            c.instanceId === binding.targetCardInstanceId &&
            c.known &&
            c.definitionId === binding.targetDefinitionId,
        )
      : undefined;
    const canonicalAnswer = breaker
      ? runnerVisibleDeckBreaker(breaker)
      : undefined;
    const answer =
      canonicalAnswer && (!binding?.targetCardInstanceId || heapCard)
        ? {
            ...canonicalAnswer,
            ...(heapCard ? { instanceId: heapCard.instanceId } : {}),
          }
        : undefined;
    const modes = new Set(
      (candidate.functionalEffects ?? [])
        .filter(
          (e) =>
            e.kind === "install" &&
            e.scope === "installed_card" &&
            e.target === "program",
        )
        .map((e) => e.installCost),
    );
    const acquireThenInstall =
      !temporary &&
      modes.size === 0 &&
      (source?.payload?.cardImplementationEffectKind ===
        "search_stack_to_grip" ||
        source?.payload?.cardImplementationEffectKind ===
          "search_trash_to_grip" ||
        source?.payload?.cardImplementationEffectKind ===
          "move_top_trash_to_grip");
    if (
      !source ||
      !run ||
      !binding ||
      !answer ||
      source.expiresAtStateVersion !== input.playerView.stateVersion ||
      run.expiresAtStateVersion !== input.playerView.stateVersion ||
      (!acquireThenInstall &&
        (modes.size !== 1 || (!modes.has("free") && !modes.has("normal"))))
    ) {
      fail("missing_exact_source_run_or_install_quote");
      continue;
    }
    const installCost = modes.has("free") ? 0 : answer.installCost;
    // A to-grip recovery still needs the standard program install action.
    const sourceClicks =
      source.costs.reduce((n, c) => n + (c.clicks ?? 0), 0) +
      (acquireThenInstall ? 1 : 0);
    const runClicks = run.costs.reduce((n, c) => n + (c.clicks ?? 0), 0);
    const sourceCredits = source.costs.reduce(
      (n, c) => n + (c.credits ?? 0),
      0,
    );
    if (
      !Number.isSafeInteger(installCost) ||
      (installCost ?? -1) < 0 ||
      !Number.isSafeInteger(answer.memoryCost) ||
      !Number.isSafeInteger(input.playerView.own.memoryUsed) ||
      !Number.isSafeInteger(input.playerView.own.memoryLimit)
    ) {
      fail("missing_payable_install_and_memory_quote");
      continue;
    }
    const memory = services.assessProgramInstallTarget(input, answer);
    const sacrifices = memory.memoryRequired
      ? memory.selectedCandidates.filter(
          (c) => c.acceptable && c.card?.type === "program",
        )
      : [];
    const sacrificedIds = new Set(sacrifices.map((c) => c.card!.instanceId));
    const memoryFreed = sacrifices.reduce((n, c) => n + c.memoryCost, 0);
    if (
      memory.memoryRequired &&
      (!memory.canFreeRequiredMemory ||
        sacrifices.length === 0 ||
        memoryFreed < memory.requiredMemoryToFree ||
        memoryFreed !== memory.memoryFreedBySelectedCandidates)
    ) {
      fail("no_exact_acceptable_memory_sacrifice");
      continue;
    }
    if (sourceClicks + runClicks > input.playerView.own.clicks) {
      fail("search_and_run_clicks_do_not_fit");
      continue;
    }
    const consumed =
      source.type === "play_event"
        ? input.playerView.own.gripOrHq.find(
            (c) => c.instanceId === source.source,
          )
        : undefined;
    if (source.type === "play_event" && !consumed) {
      fail("missing_source_hand_binding");
      continue;
    }
    const projected: AiDecisionInput = {
      ...input,
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          credits: input.playerView.own.credits - sourceCredits - installCost!,
          clicks: input.playerView.own.clicks - sourceClicks,
          gripOrHq: input.playerView.own.gripOrHq.filter(
            (c) => c.instanceId !== consumed?.instanceId,
          ),
          rig: [
            ...(input.playerView.own.rig ?? []).filter(
              (c) => !sacrificedIds.has(c.instanceId),
            ),
            answer,
          ],
          memoryUsed:
            input.playerView.own.memoryUsed! - memoryFreed + answer.memoryCost!,
        },
      },
    };
    if (projected.playerView.own.credits < 0) {
      fail("source_install_not_payable");
      continue;
    }
    const targets = evaluateRunnerRunTargets({
      input: projected,
      deckCapabilities,
      strategicIntent,
    });
    const target = targets.find(
      (t) =>
        t.actionId === run.actionId && t.targetServerId === gap.targetServerId,
    );
    if (
      !target ||
      target.pathPassability === "blocked_missing_coverage" ||
      target.pathPassability === "blocked_unbreakable"
    ) {
      fail("no_convertible_run_after_search");
      continue;
    }
    const buffer = runnerDefenseHandBufferFacts(projected, targets);
    const drawGap = Math.max(
      0,
      buffer.minimumHandBuffer - buffer.handSize,
      target.prerunReserveQuote?.handBufferGap ?? 0,
    );
    const draw = input.legalActions.find(
      (a) =>
        a.type === "draw_card" &&
        a.expiresAtStateVersion === input.playerView.stateVersion &&
        a.payload?.projectedNetHandDelta === 1 &&
        a.payload?.visibleDrawTaxSourceCount === 0 &&
        a.costs.reduce((n, c) => n + (c.clicks ?? 0), 0) === 1 &&
        a.costs.every((c) => (c.credits ?? 0) === 0),
    );
    const reservedClicks =
      sourceClicks + runClicks + drawGap + (target.futureClicksLost ?? 0);
    if (
      reservedClicks > input.playerView.own.clicks ||
      (drawGap > 0 &&
        (!draw ||
          drawGap > input.playerView.own.stackOrRdCount ||
          buffer.handSize + drawGap > buffer.maxHandSize))
    ) {
      fail("search_run_and_hand_preparation_do_not_fit");
      continue;
    }
    const preparedTarget =
      (target.prerunReserveQuote?.handBufferGap ?? 0) > 0
        ? quoteRunnerRunAfterHandBufferDraws(projected, target)
        : target;
    if (!preparedTarget) {
      fail("missing_reserved_hand_preparation_quote");
      continue;
    }
    // Feasibility alone does not make an information run an admitted consumer.
    // Use the same existing purpose and known-path boundary as its Remote owner.
    if (
      temporary &&
      gap.requesterModuleId === "runner.contest_remote" &&
      runPurposeForEvaluation(preparedTarget) === "information" &&
      !runnerTerminalRemoteContestIsDirectlyMandatory(
        projected,
        preparedTarget,
      ) &&
      !runnerInformationProbeKnownPathIsAdmitted(preparedTarget)
    ) {
      fail("remote_information_consumer_rejects_known_path");
      continue;
    }
    const economy = buildRunnerEconomyPosture({
      input: projected,
      deckCapabilities,
      strategicIntent,
    });
    if (
      services.runnerRunTargetCanConvertNow(
        projected,
        economy,
        preparedTarget,
        candidates,
      )
    )
      continue;
    const fundingInput: AiDecisionInput = {
      ...projected,
      playerView: {
        ...projected.playerView,
        own: {
          ...projected.playerView.own,
          clicks:
            projected.playerView.own.clicks -
            drawGap -
            (target.futureClicksLost ?? 0),
        },
      },
    };
    const support = services.runnerRunFundingSupport(
      fundingInput,
      economy,
      preparedTarget,
      targets,
      candidates,
      {
        acceptFundedRun: (fundedInput, fundedTarget) =>
          services.runnerRunTargetCanConvertNow(
            fundedInput,
            buildRunnerEconomyPosture({
              input: fundedInput,
              deckCapabilities,
              strategicIntent,
            }),
            fundedTarget,
            candidates,
          ),
      },
    );
    if (
      !support ||
      support.gap <= 0 ||
      support.routeActionIds.length === 0 ||
      support.routeAssessment.status !== "covered_guaranteed" ||
      services.runnerExactFundingRouteContract(input, candidates, {
        demandId: gap.gapId + ":temporary-search-horizon",
        sourcePlanId: "runner.rig_and_coverage:" + gap.gapId,
        purpose: "breaker_for_current_plan",
        priority: "current_foreground_plan",
        hardness: "hard",
        deadline: "end_of_current_turn",
        targetCredits: input.playerView.own.credits + support.gap,
        remainingClicks: input.playerView.own.clicks - reservedClicks,
        requiredEndTurnHandBuffer: Math.max(
          0,
          buffer.minimumHandBuffer + (consumed ? 1 : 0) - drawGap,
        ),
        evidence: [
          "temporary_search_exact_run:" + run.actionId,
          "temporary_search_reserved_clicks:" + reservedClicks,
          support.evidenceCode,
        ],
      }).routeActionIds.length === 0
    )
      fail("no_complete_same_turn_funding_route");
  }
  if (!rejected.size) return gap;
  return {
    ...gap,
    directSearchActionIds: gap.directSearchActionIds.filter(
      (id) => !rejected.has(id),
    ),
    ...(gap.directSearchChoiceBindings !== undefined
      ? {
          directSearchChoiceBindings: gap.directSearchChoiceBindings.filter(
            (b) => !rejected.has(b.actionId),
          ),
        }
      : {}),
    rejectedSearchActionIds: [
      ...new Set([...(gap.rejectedSearchActionIds ?? []), ...rejected.keys()]),
    ],
    recoveryEvidenceCodes: [
      ...(gap.recoveryEvidenceCodes ?? []),
      ...[...rejected].map(
        ([id, reason]) =>
          "temporary_search_incomplete_horizon:" + id + ":" + reason,
      ),
    ],
  };
}
