import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard } from "./ai-hints";
import {
  runnerHintProvidesDamagePrevention,
  runnerHintProvidesTagPrevention,
} from "./runner-canonical-hint-semantics";
import { creditsToBreakVisibleSubroutinesWithBreaker } from "./visible-run-analysis";

export type RunnerDamageDeckBeliefLevel = "none" | "suspected" | "confirmed";

export type RunnerFlatlineRiskLevel =
  | "none"
  | "suspected"
  | "confirmed"
  | "critical";

export type RunnerDamageDeckBelief = {
  level: RunnerDamageDeckBeliefLevel;
  resolvedCorpDamageEvents: number;
  attemptedCorpDamageEvents: number;
  visibleDamageSourceCount: number;
  visibleDeliverySourceCount: number;
  visibleDamagePayoffCount: number;
  visibleFallbackDamageSourceCount: number;
  independentSignalDefinitionCount: number;
  signalScore: number;
  signalKinds: string[];
  evidence: string[];
};

export type RunnerFlatlineRiskAssessment = {
  level: RunnerFlatlineRiskLevel;
  handCount: number;
  effectiveMaxHandSize: number;
  handBufferHeadroom: number;
  uncappedRecommendedHandFloor: number;
  recommendedHandFloor: number;
  recentResolvedCorpDamageEvents: number;
  recentResolvedCorpDamageAmount: number;
  turnsSinceLatestResolvedCorpDamage?: number;
  legacyStateDistanceSinceLatestResolvedCorpDamage?: number;
  activeDamageSourceCount: number;
  activeDeliverySourceCount: number;
  activeDamagePayoffCount: number;
  riskyRunServerIds: string[];
  criticalRunSuppression: boolean;
  evidence: string[];
};

export type RunnerDamageThreatAssessment = {
  deckBelief: RunnerDamageDeckBelief;
  flatlineRisk: RunnerFlatlineRiskAssessment;
  evidence: string[];
};

export type RunnerFutureEncounterDamageJackOutAssessment = {
  sourceDefinitionId: string;
  projectedDamage: number;
  damageType?: "net" | "meat" | "core";
  handCount: number;
  projectedHandAfterDamage: number;
  requiredHandFloor: number;
  evidenceCode: string;
};

export type RunnerVisibleLethalIceDamageOptions = {
  generalCredits?: number;
  runDamagePreventionRemaining?: number;
  handCount?: number;
  postPathDamage?: {
    amount: number;
    damageType: "net" | "meat" | "core";
    sourceDefinitionId: string;
  };
};

export function runnerVisibleLethalIceDamageAssessment(
  input: AiDecisionInput,
  remainingIce: readonly VisibleCard[],
  options: RunnerVisibleLethalIceDamageOptions = {},
): RunnerFutureEncounterDamageJackOutAssessment | undefined {
  if (input.side !== "runner") return undefined;
  const handCount = Math.max(
    0,
    Math.floor(options.handCount ?? input.playerView.own.gripOrHq.length),
  );
  const generalCredits =
    options.generalCredits ??
    input.playerView.own.credits +
      Math.max(0, input.playerView.run?.badPublicityCredits ?? 0);
  const rig = input.playerView.own.rig ?? [];
  let runPreventionRemaining = Math.max(
    0,
    options.runDamagePreventionRemaining ??
      input.playerView.run?.damagePreventionPool?.remaining ??
      0,
  );
  let netOrCorePreventionRemaining = Math.max(
    0,
    input.playerView.own.freeNetOrCoreDamagePreventionRemaining ?? 0,
  );
  let projectedDamage = 0;
  let projectedCoreDamage = 0;

  for (const ice of remainingIce.slice().reverse()) {
    const quote = ice.effectiveRunQuote;
    if (
      ice.known === false ||
      ice.rezzed !== true ||
      !ice.definitionId ||
      !quote ||
      quote.iceInstanceId !== ice.instanceId ||
      quote.iceDefinitionId !== ice.definitionId
    ) {
      continue;
    }
    for (const subroutine of quote.subroutines) {
      const amount = subroutine.amount;
      if (
        (subroutine.type !== "do_damage" &&
          subroutine.type !== "random_damage") ||
        typeof amount !== "number" ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
      ) {
        continue;
      }
      const affordableBreak = rig.some((breaker) => {
        const assessment = creditsToBreakVisibleSubroutinesWithBreaker(
          breaker,
          { ...ice, strength: quote.effectiveStrength },
          [subroutine],
          breaker.strength,
          quote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
        );
        return assessment !== undefined && assessment.cost <= generalCredits;
      });
      if (affordableBreak) continue;
      const typedPreventionAvailable =
        subroutine.damageType === "net" || subroutine.damageType === "core"
          ? netOrCorePreventionRemaining
          : 0;
      const typedPrevention = Math.min(amount, typedPreventionAvailable);
      netOrCorePreventionRemaining -= typedPrevention;
      const runPrevention = Math.min(
        amount - typedPrevention,
        runPreventionRemaining,
      );
      runPreventionRemaining -= runPrevention;
      const preventedDamage = typedPrevention + runPrevention;
      const subroutineDamage = amount - preventedDamage;
      projectedDamage += subroutineDamage;
      if (subroutine.damageType === "core") {
        projectedCoreDamage += subroutineDamage;
      }
      // Damage above the current grip flatlines immediately. Core damage can
      // also make the effective maximum hand size negative and therefore
      // flatline the Runner at the mandatory cleanup check, even when the
      // current grip can absorb every damage card exactly.
      const immediateFlatline = projectedDamage > handCount;
      const effectiveMaxHandSizeAfter =
        input.playerView.own.maxHandSize - projectedCoreDamage;
      const cleanupFlatline = effectiveMaxHandSizeAfter < 0;
      if (!immediateFlatline && !cleanupFlatline) continue;
      const sourceDefinitionId =
        subroutine.sourceDefinitionId ?? ice.definitionId;
      const projectedHandAfterDamage = handCount - projectedDamage;
      return {
        sourceDefinitionId,
        projectedDamage,
        ...(subroutine.damageType ? { damageType: subroutine.damageType } : {}),
        handCount,
        projectedHandAfterDamage,
        requiredHandFloor: 0,
        evidenceCode: [
          "runner_visible_lethal_ice_damage",
          `source:${sourceDefinitionId}`,
          `ice:${ice.instanceId}`,
          `subroutine:${subroutine.id}`,
          `damage_type:${subroutine.damageType ?? "unknown"}`,
          `subroutine_damage:${subroutineDamage}`,
          `damage:${projectedDamage}`,
          `cumulative_damage:${projectedDamage}`,
          `cumulative_core_damage:${projectedCoreDamage}`,
          `hand:${handCount}`,
          `immediate_flatline:${immediateFlatline}`,
          `cleanup_flatline:${cleanupFlatline}`,
          `effective_max_hand_after:${effectiveMaxHandSizeAfter}`,
          `subroutine_prevention:${preventedDamage}`,
          "affordable_break:false",
        ].join("|"),
      };
    }
  }
  const postPathDamage = options.postPathDamage;
  if (
    postPathDamage &&
    Number.isSafeInteger(postPathDamage.amount) &&
    postPathDamage.amount > 0
  ) {
    const typedPreventionAvailable =
      postPathDamage.damageType === "net" ||
      postPathDamage.damageType === "core"
        ? netOrCorePreventionRemaining
        : 0;
    const typedPrevention = Math.min(
      postPathDamage.amount,
      typedPreventionAvailable,
    );
    netOrCorePreventionRemaining -= typedPrevention;
    const runPrevention = Math.min(
      postPathDamage.amount - typedPrevention,
      runPreventionRemaining,
    );
    runPreventionRemaining -= runPrevention;
    const preventedDamage = typedPrevention + runPrevention;
    const resolvedPostPathDamage = postPathDamage.amount - preventedDamage;
    const pathDamage = projectedDamage;
    projectedDamage += resolvedPostPathDamage;
    if (postPathDamage.damageType === "core") {
      projectedCoreDamage += resolvedPostPathDamage;
    }
    const immediateFlatline = projectedDamage > handCount;
    const effectiveMaxHandSizeAfter =
      input.playerView.own.maxHandSize - projectedCoreDamage;
    const cleanupFlatline = effectiveMaxHandSizeAfter < 0;
    if (immediateFlatline || cleanupFlatline) {
      return {
        sourceDefinitionId: postPathDamage.sourceDefinitionId,
        projectedDamage,
        damageType: postPathDamage.damageType,
        handCount,
        projectedHandAfterDamage: handCount - projectedDamage,
        requiredHandFloor: 0,
        evidenceCode: [
          "runner_visible_lethal_ice_damage",
          `source:${postPathDamage.sourceDefinitionId}`,
          "post_path_damage:true",
          `post_path_damage_type:${postPathDamage.damageType}`,
          `post_path_damage_amount:${resolvedPostPathDamage}`,
          `visible_ice_damage:${pathDamage}`,
          `damage:${projectedDamage}`,
          `cumulative_damage:${projectedDamage}`,
          `cumulative_core_damage:${projectedCoreDamage}`,
          `hand:${handCount}`,
          `immediate_flatline:${immediateFlatline}`,
          `cleanup_flatline:${cleanupFlatline}`,
          `effective_max_hand_after:${effectiveMaxHandSizeAfter}`,
          `post_path_damage_prevention:${preventedDamage}`,
        ].join("|"),
      };
    }
  }
  return undefined;
}

export function runnerVisibleLethalIceDamageJackOutAssessment(
  input: AiDecisionInput,
  remainingIce: readonly VisibleCard[],
): RunnerFutureEncounterDamageJackOutAssessment | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.timingPoint !== "run.jack_out_window" ||
    input.playerView.run?.position?.kind !== "ice" ||
    !input.legalActions.some((action) => action.type === "jack_out") ||
    !input.legalActions.some((action) => action.type === "continue_run")
  ) {
    return undefined;
  }
  const assessment = runnerVisibleLethalIceDamageAssessment(
    input,
    remainingIce,
  );
  return assessment
    ? {
        ...assessment,
        evidenceCode: assessment.evidenceCode.replace(
          "runner_visible_lethal_ice_damage|",
          "runner_visible_lethal_ice_damage_requires_jack_out|",
        ),
      }
    : undefined;
}

export type RunnerRecentFutureEncounterDamageSafetyAbort = {
  serverId: string;
  sourceDefinitionId: string;
  evidenceCode: string;
};

export type RunnerKnownAccessDamageJackOutAssessment = {
  serverId: string;
  sourceDefinitionId: string;
  advancementCounters: number;
  damageRisk: number;
  evidenceCode: string;
};

const DAMAGE_TOKENS = new Set([
  "brain",
  "core",
  "damage",
  "flatline",
  "meat",
  "net",
]);

const RECENT_DAMAGE_STATE_DISTANCE = 8;
const RECENT_DAMAGE_TURN_DISTANCE = 1;
const AI_HINTS = createAiHintsByCard();

export function runnerDamageThreatAssessment(
  input: AiDecisionInput,
): RunnerDamageThreatAssessment {
  const handCount = input.playerView.own.gripOrHq.length;
  const effectiveMaxHandSize = Math.max(
    0,
    input.playerView.own.maxHandSize ?? 5,
  );
  const handBufferHeadroom = Math.max(0, effectiveMaxHandSize - handCount);
  const history = mergedHistory(input);
  const damageEvents = corpDamageEventEvidence(history);
  const deckSignals = visibleOpponentDamageSignals(input, history);
  const activeSignals = activeOpponentDamageSignals(input);
  const deckBelief = runnerDamageDeckBelief(damageEvents, deckSignals);
  const recentDamage = recentResolvedCorpDamageEvidence(input, damageEvents);
  const riskyRunServerIds = input.playerView.servers
    .filter((server) => serverHasRunnerExposureRisk(server))
    .map((server) => server.id)
    .sort();
  const flatlineRiskLevel = runnerFlatlineRiskLevel({
    deckBelief,
    handCount,
    effectiveMaxHandSize,
    recentResolvedCorpDamageEvents: recentDamage.events.length,
    attemptedCorpDamageEvents: damageEvents.attempted.length,
    activeSignals,
    runnerTagged: input.playerView.own.tags > 0,
  });
  const uncappedRecommendedHandFloor =
    runnerDamageThreatHandFloor(flatlineRiskLevel);
  const recommendedHandFloor = Math.min(
    uncappedRecommendedHandFloor,
    effectiveMaxHandSize,
  );
  const criticalRunSuppression =
    flatlineRiskLevel === "critical" ||
    (flatlineRiskLevel === "confirmed" && handCount <= 1);
  const flatlineRisk: RunnerFlatlineRiskAssessment = {
    level: flatlineRiskLevel,
    handCount,
    effectiveMaxHandSize,
    handBufferHeadroom,
    uncappedRecommendedHandFloor,
    recommendedHandFloor,
    recentResolvedCorpDamageEvents: recentDamage.events.length,
    recentResolvedCorpDamageAmount: recentDamage.events.reduce(
      (sum, event) => sum + publicEventDamageAmount(event),
      0,
    ),
    ...(recentDamage.turnsSinceLatest !== undefined
      ? { turnsSinceLatestResolvedCorpDamage: recentDamage.turnsSinceLatest }
      : {}),
    ...(recentDamage.legacyStateDistanceSinceLatest !== undefined
      ? {
          legacyStateDistanceSinceLatestResolvedCorpDamage:
            recentDamage.legacyStateDistanceSinceLatest,
        }
      : {}),
    activeDamageSourceCount: activeSignals.damageSourceCount,
    activeDeliverySourceCount: activeSignals.deliverySourceCount,
    activeDamagePayoffCount: activeSignals.damagePayoffCount,
    riskyRunServerIds,
    criticalRunSuppression,
    evidence: [
      `runner_flatline_risk_level:${flatlineRiskLevel}`,
      `runner_flatline_risk_hand:${handCount}`,
      `runner_flatline_risk_effective_max_hand:${effectiveMaxHandSize}`,
      `runner_flatline_risk_hand_buffer_headroom:${handBufferHeadroom}`,
      `runner_flatline_risk_uncapped_floor:${uncappedRecommendedHandFloor}`,
      `runner_flatline_risk_floor:${recommendedHandFloor}`,
      `runner_flatline_risk_recent_resolved_events:${recentDamage.events.length}`,
      `runner_flatline_risk_recent_resolved_amount:${recentDamage.events.reduce(
        (sum, event) => sum + publicEventDamageAmount(event),
        0,
      )}`,
      `runner_flatline_risk_active_damage_sources:${activeSignals.damageSourceCount}`,
      `runner_flatline_risk_active_delivery_sources:${activeSignals.deliverySourceCount}`,
      `runner_flatline_risk_active_payoffs:${activeSignals.damagePayoffCount}`,
      `runner_flatline_risk_runner_tagged:${input.playerView.own.tags > 0}`,
      `runner_flatline_risk_risky_servers:${riskyRunServerIds.join("|") || "none"}`,
      `runner_flatline_risk_critical_run_suppression:${criticalRunSuppression}`,
      ...(recentDamage.turnsSinceLatest !== undefined
        ? [
            `runner_flatline_risk_turns_since_damage:${recentDamage.turnsSinceLatest}`,
          ]
        : []),
      ...(recentDamage.legacyStateDistanceSinceLatest !== undefined
        ? [
            `runner_flatline_risk_legacy_state_distance:${recentDamage.legacyStateDistanceSinceLatest}`,
          ]
        : []),
    ],
  };
  const evidence = [...deckBelief.evidence, ...flatlineRisk.evidence];
  return {
    deckBelief,
    flatlineRisk,
    evidence,
  };
}

export function runnerFutureEncounterDamageJackOutAssessment(
  input: AiDecisionInput,
): RunnerFutureEncounterDamageJackOutAssessment | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.timingPoint !== "run.jack_out_window" ||
    input.playerView.run?.position?.kind !== "ice"
  )
    return undefined;
  const history = mergedHistory(input);
  const lastRunStartIndex = findPreviousEventIndex(
    history,
    history.length,
    (event) => event.type === "start_run",
  );
  const triggerEvent = futureEncounterDamageTrigger(
    history,
    lastRunStartIndex,
    history.length,
  );
  const sourceDefinitionId = triggerEvent?.publicPayload?.sourceDefinitionId;
  if (typeof sourceDefinitionId !== "string") return undefined;
  const hint = AI_HINTS.get(sourceDefinitionId);
  const projectedDamage = Math.max(
    0,
    ...(hint?.effects ?? [])
      .filter(
        (effect) =>
          effect.kind === "damage" &&
          (effect.timing === "encounter" || effect.timing === undefined),
      )
      .map((effect) =>
        typeof effect.amount === "number" && Number.isFinite(effect.amount)
          ? effect.amount
          : 0,
      ),
  );
  if (projectedDamage <= 0) return undefined;

  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  const requiredHandFloor = Math.max(3, flatlineRisk.recommendedHandFloor);
  const handCount = input.playerView.own.gripOrHq.length;
  const projectedHandAfterDamage = handCount - projectedDamage;
  if (projectedHandAfterDamage >= requiredHandFloor) return undefined;

  return {
    sourceDefinitionId,
    projectedDamage,
    handCount,
    projectedHandAfterDamage,
    requiredHandFloor,
    evidenceCode: [
      "runner_future_encounter_damage_requires_jack_out",
      `source:${sourceDefinitionId}`,
      `damage:${projectedDamage}`,
      `hand:${handCount}`,
      `projected_hand:${projectedHandAfterDamage}`,
      `required_floor:${requiredHandFloor}`,
    ].join("|"),
  };
}

export function runnerRecentFutureEncounterDamageSafetyAbort(
  input: AiDecisionInput,
): RunnerRecentFutureEncounterDamageSafetyAbort | undefined {
  if (input.side !== "runner") return undefined;
  const history = mergedHistory(input);
  const currentRunnerTurnStart = findPreviousEventIndex(
    history,
    history.length,
    (event) =>
      event.type === "end_turn" && event.publicPayload?.actor === "corp",
  );
  const jackOutIndex = findPreviousEventIndex(
    history,
    history.length,
    (event) => event.type === "jack_out",
  );
  if (jackOutIndex <= currentRunnerTurnStart) return undefined;
  const runStartIndex = findPreviousEventIndex(
    history,
    jackOutIndex,
    (event) => event.type === "start_run",
  );
  if (runStartIndex <= currentRunnerTurnStart) return undefined;
  const triggerEvent = futureEncounterDamageTrigger(
    history,
    runStartIndex,
    jackOutIndex,
  );
  const sourceDefinitionId = triggerEvent?.publicPayload?.sourceDefinitionId;
  const serverId = history[runStartIndex]?.publicPayload?.serverId;
  if (typeof sourceDefinitionId !== "string" || typeof serverId !== "string")
    return undefined;
  const routeChangedAfterAbort = history
    .slice(jackOutIndex + 1)
    .some(
      (event) =>
        event.publicPayload?.actor === "runner" &&
        ["activated_card_ability", "install_card", "play_event"].includes(
          event.type,
        ),
    );
  if (routeChangedAfterAbort) return undefined;
  return {
    serverId,
    sourceDefinitionId,
    evidenceCode: [
      "runner_future_encounter_damage_route_safety_aborted",
      `server:${serverId}`,
      `source:${sourceDefinitionId}`,
      "resume:runner_route_development",
    ].join("|"),
  };
}

export function runnerKnownAccessDamageScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    action.type !== "continue_run" ||
    input.playerView.timingPoint !== "run.jack_out_window"
  ) {
    return undefined;
  }
  const assessment = knownAccessDamageAmbushAssessment(input, false);
  if (!assessment) return undefined;
  return {
    key: "runner_known_access_damage_ambush",
    label: "Bekannter Access-Damage-Ambush",
    value: -2200 - assessment.damageRisk * 200,
    reason: assessment.evidenceCode,
  };
}

export function runnerKnownAccessDamageJackOutAssessment(
  input: AiDecisionInput,
): RunnerKnownAccessDamageJackOutAssessment | undefined {
  return knownAccessDamageAmbushAssessment(input, true);
}

function knownAccessDamageAmbushAssessment(
  input: AiDecisionInput,
  requireRunWindowActions: boolean,
): RunnerKnownAccessDamageJackOutAssessment | undefined {
  if (
    input.side !== "runner" ||
    input.playerView.timingPoint !== "run.jack_out_window" ||
    (requireRunWindowActions &&
      (!input.legalActions.some((action) => action.type === "continue_run") ||
        !input.legalActions.some((action) => action.type === "jack_out")))
  ) {
    return undefined;
  }
  const run = input.playerView.run;
  if (!run?.position || run.position.kind !== "server") return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.attackedServerId,
  );
  if (
    !server?.id.startsWith("remote_") ||
    server.root.length !== 1 ||
    server.root[0]?.known === false ||
    server.root[0]?.rezzed !== true
  ) {
    return undefined;
  }
  const root = server.root[0];
  const hint = root.definitionId ? AI_HINTS.get(root.definitionId) : undefined;
  const accessDamage = hint?.effects?.some(
    (effect) => effect.kind === "damage" && effect.timing === "on_access",
  );
  const accessAmbush =
    hint?.remoteRole?.kind === "ambush" ||
    hint?.effects?.some(
      (effect) => effect.kind === "ambush" && effect.timing === "on_access",
    );
  if (!accessDamage || !accessAmbush) return undefined;
  const requiresAdvancementCounter = hint?.conditions?.some(
    (condition) => condition.kind === "requires_advancement_counter",
  );
  const advancementCounters = Math.max(0, root.advancementCounters ?? 0);
  if (requiresAdvancementCounter && advancementCounters <= 0) return undefined;
  const damageRisk = requiresAdvancementCounter
    ? advancementCounters
    : Math.max(1, hint?.valueHints?.damage ?? 1);
  return {
    serverId: server.id,
    sourceDefinitionId: root.definitionId ?? root.instanceId,
    advancementCounters,
    damageRisk,
    evidenceCode: [
      "runner_known_access_damage_ambush_requires_jack_out",
      `server:${server.id}`,
      `source:${root.definitionId ?? root.instanceId}`,
      `advancement_counters:${advancementCounters}`,
      `damage_risk:${damageRisk}`,
      "sole_known_root:true",
    ].join("|"),
  };
}

export function runnerDamageLockedHandScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent[] {
  if (input.side !== "runner" || action.side !== "runner") return [];
  const assessment = runnerDamageThreatAssessment(input).flatlineRisk;
  const lockedAtThreatFloor =
    (assessment.level === "confirmed" || assessment.level === "critical") &&
    assessment.effectiveMaxHandSize <= assessment.recommendedHandFloor &&
    assessment.handCount >= assessment.effectiveMaxHandSize &&
    assessment.handBufferHeadroom === 0 &&
    input.playerView.own.clicks <= 1;
  if (!lockedAtThreatFloor) return [];
  const reason = [
    `level:${assessment.level}`,
    `hand:${assessment.handCount}`,
    `effective_max:${assessment.effectiveMaxHandSize}`,
    `floor:${assessment.recommendedHandFloor}`,
    `headroom:${assessment.handBufferHeadroom}`,
    `credits:${input.playerView.own.credits}`,
    `clicks:${input.playerView.own.clicks}`,
  ].join("|");

  if (
    action.type === "gain_credit" &&
    action.source === "basic_action" &&
    input.playerView.own.credits < 10
  ) {
    return [
      {
        key: "runner_damage_locked_hand_reaction_reserve",
        label: "Reaktionsreserve bei gesperrtem Damage-Handpuffer",
        value: input.playerView.own.credits < 8 ? 650 : 350,
        reason,
      },
    ];
  }
  if (action.type === "draw_card" && input.playerView.own.credits < 8) {
    return [
      {
        key: "runner_damage_locked_hand_last_click_draw",
        label: "Letzter Draw ohne dauerhaften Handpuffer",
        value: -450,
        reason,
      },
    ];
  }
  if (action.type !== "install_card") return [];
  const sourceId = action.source ?? String(action.payload?.cardId ?? "");
  const source = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === sourceId,
  );
  if (!source || runnerLockedHandInstallIsImmediateDefense(source)) return [];
  return [
    {
      key: "runner_damage_locked_hand_install_spend",
      label: "Installation verbraucht gesperrten Damage-Handpuffer",
      value: -1000,
      reason: `${reason}|source:${source.definitionId ?? source.instanceId}`,
    },
  ];
}

function runnerLockedHandInstallIsImmediateDefense(card: VisibleCard): boolean {
  const hint = card.definitionId ? AI_HINTS.get(card.definitionId) : undefined;
  if (!hint) return false;
  if (hint.breakerProfile) return true;
  if (hint.roles.includes("icebreaker")) {
    return true;
  }
  return (
    runnerHintProvidesDamagePrevention(hint) ||
    runnerHintProvidesTagPrevention(hint) ||
    (hint.effects ?? []).some(
      (effect) =>
        effect.kind === "remove_brain_damage" ||
        effect.kind === "hand_size_modifier",
    )
  );
}

export function runnerDamageThreatRunScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "start_run") return undefined;
  const assessment = runnerDamageThreatAssessment(input).flatlineRisk;
  if (assessment.level === "none") return undefined;
  const serverId = actionServerId(action);
  const riskyServer =
    serverId !== undefined && assessment.riskyRunServerIds.includes(serverId);
  const fullExposure =
    assessment.criticalRunSuppression &&
    (riskyServer || assessment.handCount <= 0);
  if (
    !fullExposure &&
    !(riskyServer && assessment.handCount < assessment.recommendedHandFloor)
  ) {
    return undefined;
  }
  const value = fullExposure ? -2600 : -900;
  return {
    key: "runner_damage_survival_run_risk",
    label: "Runner-Damage-Survival-Run-Risiko",
    value,
    reason: [
      `level:${assessment.level}`,
      `hand:${assessment.handCount}`,
      `floor:${assessment.recommendedHandFloor}`,
      `server:${serverId ?? "unknown"}`,
      `risky_server:${riskyServer}`,
      `full_exposure:${fullExposure}`,
    ].join("|"),
  };
}

function runnerDamageDeckBelief(
  damageEvents: CorpDamageEventEvidence,
  signals: VisibleOpponentDamageSignals,
): RunnerDamageDeckBelief {
  const independentSignalDefinitionCount = signals.signalDefinitionIds.size;
  const independentDeliveryAndPayoff =
    signals.deliveryDefinitionIds.size > 0 &&
    signals.payoffDefinitionIds.size > 0 &&
    new Set([...signals.deliveryDefinitionIds, ...signals.payoffDefinitionIds])
      .size >= 2;
  const confirmed =
    damageEvents.resolved.length > 0 ||
    independentDeliveryAndPayoff ||
    signals.damageDefinitionIds.size >= 2 ||
    (signals.score >= 4 && independentSignalDefinitionCount >= 2);
  const suspected =
    damageEvents.attempted.length > 0 ||
    signals.signalDefinitionIds.size > 0 ||
    signals.fallbackDamageSourceCount > 0;
  const level: RunnerDamageDeckBeliefLevel = confirmed
    ? "confirmed"
    : suspected
      ? "suspected"
      : "none";
  return {
    level,
    resolvedCorpDamageEvents: damageEvents.resolved.length,
    attemptedCorpDamageEvents: damageEvents.attempted.length,
    visibleDamageSourceCount: signals.damageSourceCount,
    visibleDeliverySourceCount: signals.deliverySourceCount,
    visibleDamagePayoffCount: signals.damagePayoffCount,
    visibleFallbackDamageSourceCount: signals.fallbackDamageSourceCount,
    independentSignalDefinitionCount,
    signalScore: signals.score,
    signalKinds: signals.kinds,
    evidence: [
      `runner_damage_deck_belief_level:${level}`,
      `runner_damage_deck_resolved_corp_events:${damageEvents.resolved.length}`,
      `runner_damage_deck_attempted_corp_events:${damageEvents.attempted.length}`,
      `runner_damage_deck_visible_damage_sources:${signals.damageSourceCount}`,
      `runner_damage_deck_visible_delivery_sources:${signals.deliverySourceCount}`,
      `runner_damage_deck_visible_payoffs:${signals.damagePayoffCount}`,
      `runner_damage_deck_fallback_sources:${signals.fallbackDamageSourceCount}`,
      `runner_damage_deck_independent_definitions:${independentSignalDefinitionCount}`,
      `runner_damage_deck_signal_score:${signals.score}`,
      `runner_damage_deck_signal_kinds:${signals.kinds.join("|") || "none"}`,
    ],
  };
}

function runnerFlatlineRiskLevel(params: {
  deckBelief: RunnerDamageDeckBelief;
  handCount: number;
  effectiveMaxHandSize: number;
  recentResolvedCorpDamageEvents: number;
  attemptedCorpDamageEvents: number;
  activeSignals: VisibleOpponentDamageSignals;
  runnerTagged: boolean;
}): RunnerFlatlineRiskLevel {
  const activeSignalScore = params.activeSignals.score;
  const activeDamageSources = params.activeSignals.damageSourceCount;
  const activePunishSources = params.activeSignals.signalDefinitionIds.size;
  const recentResolvedDamage = params.recentResolvedCorpDamageEvents > 0;
  const hasDamageEvidence =
    params.deckBelief.level !== "none" ||
    recentResolvedDamage ||
    params.attemptedCorpDamageEvents > 0 ||
    activePunishSources > 0;
  if (!hasDamageEvidence) return "none";
  if (
    (params.handCount <= 0 &&
      (recentResolvedDamage ||
        params.attemptedCorpDamageEvents > 0 ||
        activeDamageSources > 0 ||
        params.deckBelief.level === "confirmed")) ||
    (params.handCount <= 1 &&
      (recentResolvedDamage || activeSignalScore >= 3)) ||
    (params.runnerTagged && activeDamageSources > 0)
  ) {
    return "critical";
  }
  if (
    recentResolvedDamage ||
    activeSignalScore >= 4 ||
    (activeDamageSources > 0 && params.effectiveMaxHandSize <= 3) ||
    (params.runnerTagged &&
      (activePunishSources > 0 || params.deckBelief.level === "confirmed")) ||
    (params.deckBelief.level === "confirmed" && params.handCount <= 2) ||
    (params.deckBelief.level === "confirmed" &&
      params.effectiveMaxHandSize <= 3)
  ) {
    return "confirmed";
  }
  return "suspected";
}

function runnerDamageThreatHandFloor(level: RunnerFlatlineRiskLevel): number {
  switch (level) {
    case "critical":
      return 3;
    case "confirmed":
      return 3;
    case "suspected":
      return 2;
    case "none":
      return 1;
  }
}

function mergedHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [
    ...(input.playerView.publicEvents ?? []),
    ...(input.eventTail ?? []),
  ]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(
    (left, right) => eventVersion(left) - eventVersion(right),
  );
}

function findPreviousEventIndex(
  history: readonly PublicGameEvent[],
  beforeExclusive: number,
  predicate: (event: PublicGameEvent) => boolean,
): number {
  for (
    let index = Math.min(beforeExclusive, history.length) - 1;
    index >= 0;
    index -= 1
  ) {
    const event = history[index];
    if (event && predicate(event)) return index;
  }
  return -1;
}

function futureEncounterDamageTrigger(
  history: readonly PublicGameEvent[],
  afterExclusive: number,
  beforeExclusive: number,
): PublicGameEvent | undefined {
  for (
    let index = Math.min(beforeExclusive, history.length) - 1;
    index > afterExclusive;
    index -= 1
  ) {
    const event = history[index];
    if (!event || event.type !== "continue_run") continue;
    const sourceDefinitionId = event.publicPayload?.sourceDefinitionId;
    if (typeof sourceDefinitionId !== "string") continue;
    const hint = AI_HINTS.get(sourceDefinitionId);
    if (
      hint?.side === "corp" &&
      hint.effects?.some(
        (effect) => effect.kind === "future_encounter_effect",
      ) === true
    ) {
      return event;
    }
  }
  return undefined;
}

function publicEventDamageAmount(event: PublicGameEvent): number {
  const amount = event.publicPayload?.damageAmount;
  return typeof amount === "number" && Number.isFinite(amount)
    ? Math.max(0, amount)
    : 0;
}

type CorpDamageEventEvidence = {
  resolved: PublicGameEvent[];
  attempted: PublicGameEvent[];
};

function corpDamageEventEvidence(
  history: readonly PublicGameEvent[],
): CorpDamageEventEvidence {
  const resolved: PublicGameEvent[] = [];
  const attempted: PublicGameEvent[] = [];
  for (const event of history) {
    if (!publicEventCanBeCorpDamage(event)) continue;
    if (
      publicEventDamageAmount(event) > 0 ||
      event.publicPayload?.flatline === true
    ) {
      resolved.push(event);
    } else {
      attempted.push(event);
    }
  }
  return { resolved, attempted };
}

function publicEventCanBeCorpDamage(event: PublicGameEvent): boolean {
  const payload = event.publicPayload ?? {};
  if (payload.actor === "runner") return false;
  if (payload.actor !== "corp" && payload.actor !== undefined) return false;
  const sourceDefinitionId =
    typeof payload.sourceDefinitionId === "string"
      ? payload.sourceDefinitionId
      : undefined;
  if (
    payload.actor === undefined &&
    sourceDefinitionId &&
    AI_HINTS.get(sourceDefinitionId)?.side === "runner"
  ) {
    return false;
  }
  if (payload.flatline === true || publicEventDamageAmount(event) > 0)
    return true;
  if (payload.damageResolved === true) return true;
  const damageType = payload.damageType;
  if (
    damageType === "brain" ||
    damageType === "core" ||
    damageType === "meat" ||
    damageType === "net"
  ) {
    return true;
  }
  return damageTokensIncludeAny(damageTokens([event.type, payload.actionType]));
}

function recentResolvedCorpDamageEvidence(
  input: AiDecisionInput,
  damageEvents: CorpDamageEventEvidence,
): {
  events: PublicGameEvent[];
  turnsSinceLatest?: number;
  legacyStateDistanceSinceLatest?: number;
} {
  const latest = damageEvents.resolved.at(-1);
  if (!latest) return { events: [] };
  const currentTurnSerial = finiteTurnSerial(input.playerView.turnSerial);
  const latestTurnSerial = finiteTurnSerial(latest.turnSerial);
  if (currentTurnSerial !== undefined && latestTurnSerial !== undefined) {
    const turnsSinceLatest = Math.max(0, currentTurnSerial - latestTurnSerial);
    return {
      events: damageEvents.resolved.filter((event) => {
        const eventTurnSerial = finiteTurnSerial(event.turnSerial);
        return (
          eventTurnSerial !== undefined &&
          currentTurnSerial - eventTurnSerial >= 0 &&
          currentTurnSerial - eventTurnSerial <= RECENT_DAMAGE_TURN_DISTANCE
        );
      }),
      turnsSinceLatest,
    };
  }
  const legacyStateDistanceSinceLatest = Math.max(
    0,
    input.playerView.stateVersion - eventVersion(latest),
  );
  return {
    events: damageEvents.resolved.filter((event) => {
      const distance = input.playerView.stateVersion - eventVersion(event);
      return distance >= 0 && distance <= RECENT_DAMAGE_STATE_DISTANCE;
    }),
    legacyStateDistanceSinceLatest,
  };
}

function finiteTurnSerial(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : undefined;
}

type VisibleOpponentDamageSignals = {
  damageSourceCount: number;
  deliverySourceCount: number;
  damagePayoffCount: number;
  fallbackDamageSourceCount: number;
  score: number;
  kinds: string[];
  signalDefinitionIds: Set<string>;
  damageDefinitionIds: Set<string>;
  deliveryDefinitionIds: Set<string>;
  payoffDefinitionIds: Set<string>;
};

function visibleOpponentDamageSignals(
  input: AiDecisionInput,
  history: readonly PublicGameEvent[],
): VisibleOpponentDamageSignals {
  const visibleCards = visibleOpponentCards(input);
  const definitionIds = new Set(
    visibleCards
      .map((card) => card.definitionId)
      .filter((definitionId): definitionId is string => Boolean(definitionId)),
  );
  for (const event of history) {
    for (const definitionId of publicEventDefinitionIds(event)) {
      const hint = AI_HINTS.get(definitionId);
      if (hint?.side === "corp") definitionIds.add(definitionId);
    }
  }
  return damageSignalsForKnownSources(visibleCards, definitionIds);
}

function activeOpponentDamageSignals(
  input: AiDecisionInput,
): VisibleOpponentDamageSignals {
  const visibleCards = activeOpponentCards(input);
  return damageSignalsForKnownSources(
    visibleCards,
    new Set(
      visibleCards
        .map((card) => card.definitionId)
        .filter((definitionId): definitionId is string =>
          Boolean(definitionId),
        ),
    ),
  );
}

function damageSignalsForKnownSources(
  visibleCards: readonly VisibleCard[],
  definitionIds: ReadonlySet<string>,
): VisibleOpponentDamageSignals {
  let score = 0;
  const kinds = new Set<string>();
  const signalDefinitionIds = new Set<string>();
  const damageDefinitionIds = new Set<string>();
  const deliveryDefinitionIds = new Set<string>();
  const payoffDefinitionIds = new Set<string>();
  for (const definitionId of definitionIds) {
    const hint = AI_HINTS.get(definitionId);
    if (hint?.side !== "corp") continue;
    const effectKinds = new Set(
      (hint.effects ?? []).map((effect) => effect.kind),
    );
    const directDamage = effectKinds.has("damage");
    const traceTag =
      (effectKinds.has("trace") ||
        effectKinds.has("tag") ||
        effectKinds.has("tag_source")) &&
      (hint.lineSupport ?? []).includes("corp.tag_trace_punish");
    const punishPayoff = effectKinds.has("tag_punish_payoff");
    if (!directDamage && !traceTag && !punishPayoff) continue;
    signalDefinitionIds.add(definitionId);
    if (directDamage) {
      damageDefinitionIds.add(definitionId);
      score += 2;
      kinds.add("damage_source");
    }
    if (traceTag) {
      deliveryDefinitionIds.add(definitionId);
      score += 1;
      kinds.add("trace_tag_source");
    }
    if (punishPayoff) {
      payoffDefinitionIds.add(definitionId);
      score += 2;
      kinds.add("punish_payoff");
    }
  }

  const fallbackSignalIds = new Set<string>();
  for (const card of visibleCards) {
    if (!visibleCardShowsDamageSourceFallback(card)) continue;
    const hint = card.definitionId
      ? AI_HINTS.get(card.definitionId)
      : undefined;
    if (hint?.effects?.some((effect) => effect.kind === "damage")) continue;
    fallbackSignalIds.add(card.definitionId ?? card.instanceId);
  }
  if (fallbackSignalIds.size > 0) {
    score += fallbackSignalIds.size;
    kinds.add("text_damage_fallback");
    for (const signalId of fallbackSignalIds) {
      signalDefinitionIds.add(`fallback:${signalId}`);
    }
  }
  if (damageDefinitionIds.size > 0 && deliveryDefinitionIds.size > 0) {
    score += 1;
    kinds.add("damage_delivery_combo");
  }
  return {
    damageSourceCount: damageDefinitionIds.size,
    deliverySourceCount: deliveryDefinitionIds.size,
    damagePayoffCount: payoffDefinitionIds.size,
    fallbackDamageSourceCount: fallbackSignalIds.size,
    score,
    kinds: [...kinds].sort(),
    signalDefinitionIds,
    damageDefinitionIds,
    deliveryDefinitionIds,
    payoffDefinitionIds,
  };
}

function visibleOpponentCards(input: AiDecisionInput): VisibleCard[] {
  return [
    input.playerView.opponent.identity,
    ...(input.playerView.opponent.discardCards ?? []),
    ...(input.playerView.opponent.scoreArea ?? []),
    ...(input.playerView.opponent.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
    ...(input.playerView.specialZones?.setAside ?? []),
    ...(input.playerView.specialZones?.removedFromGame ?? []),
  ].filter((card) => card.known !== false);
}

function activeOpponentCards(input: AiDecisionInput): VisibleCard[] {
  return [
    input.playerView.opponent.identity,
    ...(input.playerView.opponent.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ].filter((card) => card.known !== false);
}

function publicEventDefinitionIds(event: PublicGameEvent): string[] {
  const payload = event.publicPayload ?? {};
  return [
    payload.sourceDefinitionId,
    payload.cardDefinitionId,
    payload.rezzedCardDefinitionId,
  ].filter((value): value is string => typeof value === "string");
}

function visibleCardShowsDamageSourceFallback(card: VisibleCard): boolean {
  if (card.known === false) return false;
  const text = `${card.title ?? ""} ${card.rulesText ?? ""} ${
    card.definitionId ?? ""
  }`.toLowerCase();
  if (/\b(?:prevent|avoid|reduce)\b.{0,48}\bdamage\b/.test(text)) return false;
  return damageTokensIncludeAny(
    damageTokens([card.title, card.rulesText, card.definitionId]),
  );
}

function serverHasRunnerExposureRisk(
  server: AiDecisionInput["playerView"]["servers"][number],
): boolean {
  return (
    server.ice.some((ice) => ice.known === false || ice.rezzed !== true) ||
    (server.id.startsWith("remote_") &&
      server.root.some((card) => card.known === false))
  );
}

function actionServerId(action: LegalAction): string | undefined {
  const payload = action.payload ?? {};
  for (const key of ["serverId", "server", "targetServerId"]) {
    const value = payload[key];
    if (typeof value === "string") return value;
  }
  return undefined;
}

function eventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number"
    ? event.stateVersionAfter
    : typeof event.stateVersionBefore === "number"
      ? event.stateVersionBefore
      : 0;
}

function damageTokens(values: readonly unknown[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) =>
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    );
}

function damageTokensIncludeAny(tokens: readonly string[]): boolean {
  return tokens.some((token) => DAMAGE_TOKENS.has(token));
}
