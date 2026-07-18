import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard, RUNTIME_CARDS } from "../ai-hints";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type CorpScoreConversionStepKind =
  | "gain_action_capacity"
  | "install_score_target"
  | "place_advancement"
  | "move_advancement"
  | "basic_advance"
  | "score_ready";

export type CorpScoreConversionStep = {
  kind: CorpScoreConversionStepKind;
  actionId?: string;
  sourceCardId?: string;
  targetCardId: string;
  targetServerId: string;
  advancementAmount: number;
  clickCost: number;
  creditCost: number;
  generatedClicks: number;
  evidence: string[];
};

export type CorpScoreConversionPath = {
  agendaCardId: string;
  agendaPoints: number;
  targetServerId: string;
  advancementRequirement: number;
  initialAdvancementCounters: number;
  desiredAdvancementCounters: number;
  clicksRequired: number;
  clicksGenerated: number;
  creditsRequired: number;
  reservedAdvancementCounters: Record<string, number>;
  overadvanceReason?: string;
  sameTurnGuaranteed: true;
  steps: CorpScoreConversionStep[];
  evidence: string[];
};

type ScoreTarget = {
  card: VisibleCard;
  serverId: string;
  installAction?: LegalAction;
};

type ConversionCapability = {
  kind: "place_advancement" | "move_advancement";
  action?: LegalAction;
  capabilityId: string;
  amount: number;
  sourceCardId?: string;
  clickCost: number;
  creditCost: number;
  projected: boolean;
};

type ActionCapacity = {
  action: LegalAction;
  gain: number;
  sourceCardId?: string;
  sourceAdvancementCounterCost: number;
};

type CandidatePath = CorpScoreConversionPath & {
  overadvance: number;
  rewardedOveradvance: boolean;
};

export function corpSameTurnScoreConversionPaths(
  input: AiDecisionInput,
): CorpScoreConversionPath[] {
  if (input.side !== "corp") return [];
  return scoreTargets(input)
    .flatMap((target) => conversionPathForTarget(input, target) ?? [])
    .sort(comparePaths);
}

export function bestCorpSameTurnScoreConversionPath(
  input: AiDecisionInput,
): CorpScoreConversionPath | undefined {
  return corpSameTurnScoreConversionPaths(input)[0];
}

function conversionPathForTarget(
  input: AiDecisionInput,
  target: ScoreTarget,
): CandidatePath | undefined {
  const requirement = advancementRequirement(target.card);
  if (requirement === undefined) return undefined;
  const initialCounters = Math.max(0, target.card.advancementCounters ?? 0);
  const desiredTargets = [
    requirement,
    ...(target.card.overadvanceThreshold && target.card.overadvanceReward
      ? [requirement + target.card.overadvanceThreshold]
      : []),
  ];
  return desiredTargets
    .map((desiredCounters) =>
      conversionPathForDesiredTarget(
        input,
        target,
        requirement,
        desiredCounters,
        initialCounters,
      ),
    )
    .filter((path): path is CandidatePath => path !== undefined)
    .sort(comparePaths)[0];
}

function conversionPathForDesiredTarget(
  input: AiDecisionInput,
  target: ScoreTarget,
  requirement: number,
  desiredCounters: number,
  initialCounters: number,
): CandidatePath | undefined {
  const deficit = Math.max(0, desiredCounters - initialCounters);
  if (deficit === 0) {
    const scoreAction = scoreActionForCard(input, target.card.instanceId);
    if (!scoreAction) return undefined;
    return completedPath(
      target,
      requirement,
      desiredCounters,
      initialCounters,
      [scoreStep(target, scoreAction)],
    );
  }

  const installStep = target.installAction
    ? installTargetStep(target, target.installAction)
    : undefined;
  const advancementCapabilities = conversionCapabilities(input, target);
  const actionCapacities = actionCapacityCapabilities(input);
  const sourceCounterBudget = visibleAdvancementCounterBudget(input);
  let best: CandidatePath | undefined;

  for (const capacitySet of powerSet(actionCapacities)) {
    const capacityResult = applyActionCapacitySet(
      input,
      target,
      capacitySet,
      sourceCounterBudget,
    );
    if (!capacityResult) continue;
    let clicks = capacityResult.clicks;
    let credits = capacityResult.credits;
    const steps = [...capacityResult.steps];
    const sourceCounters = { ...capacityResult.sourceCounters };
    if (installStep) {
      if (installStep.clickCost > clicks || installStep.creditCost > credits)
        continue;
      clicks -= installStep.clickCost;
      credits -= installStep.creditCost;
      steps.push(installStep);
    }

    visitCapabilityCombinations({
      capabilities: advancementCapabilities,
      index: 0,
      remaining: deficit,
      clicks,
      credits,
      sourceCounters,
      usedActionIds: new Set(),
      steps,
      target,
      input,
      requirement,
      desiredCounters,
      initialCounters,
      onCandidate: (candidate) => {
        if (!best || comparePaths(candidate, best) < 0) best = candidate;
      },
    });
  }
  return best;
}

function visitCapabilityCombinations(params: {
  capabilities: readonly ConversionCapability[];
  index: number;
  remaining: number;
  clicks: number;
  credits: number;
  sourceCounters: Record<string, number>;
  usedActionIds: Set<string>;
  steps: CorpScoreConversionStep[];
  target: ScoreTarget;
  input: AiDecisionInput;
  requirement: number;
  desiredCounters: number;
  initialCounters: number;
  onCandidate: (candidate: CandidatePath) => void;
}): void {
  const basicAdvanceCount = Math.max(0, params.remaining);
  if (
    basicAdvanceCount <= params.clicks &&
    basicAdvanceCount <= params.credits
  ) {
    const basicSteps = Array.from({ length: basicAdvanceCount }, () =>
      basicAdvanceStep(params.target),
    );
    params.onCandidate(
      completedPath(
        params.target,
        params.requirement,
        params.desiredCounters,
        params.initialCounters,
        [...params.steps, ...basicSteps, scoreStep(params.target)],
      ),
    );
  }
  if (params.index >= params.capabilities.length) return;

  visitCapabilityCombinations({ ...params, index: params.index + 1 });

  const capability = params.capabilities[params.index]!;
  if (params.usedActionIds.has(capability.capabilityId)) return;
  const clickCost = capability.clickCost;
  const creditCost = capability.creditCost;
  if (clickCost > params.clicks || creditCost > params.credits) return;
  let availableAmount = capability.amount;
  const nextSourceCounters = { ...params.sourceCounters };
  if (capability.kind === "move_advancement" && capability.sourceCardId) {
    availableAmount = Math.min(
      availableAmount,
      nextSourceCounters[capability.sourceCardId] ?? 0,
    );
  }
  if (availableAmount <= 0) return;
  const appliedAmount =
    capability.kind === "move_advancement"
      ? Math.min(availableAmount, params.remaining)
      : availableAmount;
  if (appliedAmount <= 0) return;
  if (capability.kind === "move_advancement" && capability.sourceCardId) {
    nextSourceCounters[capability.sourceCardId] =
      (nextSourceCounters[capability.sourceCardId] ?? 0) - appliedAmount;
  }
  const usedActionIds = new Set(params.usedActionIds);
  usedActionIds.add(capability.capabilityId);
  visitCapabilityCombinations({
    ...params,
    index: params.index + 1,
    remaining: Math.max(0, params.remaining - appliedAmount),
    clicks: params.clicks - clickCost,
    credits: params.credits - creditCost,
    sourceCounters: nextSourceCounters,
    usedActionIds,
    steps: [
      ...params.steps,
      conversionStep(params.target, capability, appliedAmount),
    ],
  });
}

function scoreTargets(input: AiDecisionInput): ScoreTarget[] {
  const installed = input.playerView.servers.flatMap((server) =>
    server.root
      .filter(isVisibleAgenda)
      .map((card) => ({ card, serverId: server.id })),
  );
  const hqById = new Map(
    input.playerView.own.gripOrHq
      .filter(isVisibleAgenda)
      .map((card) => [card.instanceId, card]),
  );
  const installTargets = input.legalActions
    .filter(
      (action) =>
        action.side === "corp" &&
        action.type === "install_card" &&
        action.payload?.placement !== "ice",
    )
    .map<ScoreTarget | undefined>((installAction) => {
      const cardId = actionCardId(installAction);
      const card = cardId ? hqById.get(cardId) : undefined;
      const serverId = stringPayload(installAction, "serverId");
      return card && serverId ? { card, serverId, installAction } : undefined;
    })
    .filter((target): target is ScoreTarget => target !== undefined);
  return [...installed, ...installTargets];
}

function conversionCapabilities(
  input: AiDecisionInput,
  target: ScoreTarget,
): ConversionCapability[] {
  const legalCapabilities = input.legalActions.flatMap<ConversionCapability>(
    (action) => {
      if (action.side !== "corp") return [];
      const capability = stringPayload(action, "scoreConversionCapability");
      if (capability === "place_advancement") {
        const amount = numberPayload(
          action,
          "scoreConversionAdvancementAmount",
        );
        const mode = stringPayload(action, "scoreConversionAdvancementMode");
        if (!amount || amount <= 0) return [];
        return [
          {
            kind: "place_advancement" as const,
            action,
            capabilityId: action.actionId,
            amount: mode === "up_to_distinct_targets_one_each" ? 1 : amount,
            clickCost: actionCost(action, "clicks"),
            creditCost: actionCost(action, "credits"),
            projected: false,
          },
        ];
      }
      if (capability !== "move_advancement") return [];
      const sourceMode = stringPayload(action, "scoreConversionSourceMode");
      const maximum = action.payload?.scoreConversionAdvancementMaximum;
      if (sourceMode === "source_card") {
        const sourceCardId = actionCardId(action);
        const source = sourceCardId
          ? visibleOwnCard(input, sourceCardId)
          : undefined;
        const amount = Math.min(
          maximum === "all"
            ? Number.MAX_SAFE_INTEGER
            : (positiveInteger(maximum) ?? 0),
          source?.advancementCounters ?? 0,
        );
        return sourceCardId &&
          sourceCardId !== target.card.instanceId &&
          amount > 0
          ? [
              {
                kind: "move_advancement" as const,
                action,
                capabilityId: action.actionId,
                amount,
                sourceCardId,
                clickCost: actionCost(action, "clicks"),
                creditCost: actionCost(action, "credits"),
                projected: false,
              },
            ]
          : [];
      }
      if (sourceMode !== "chosen_card") return [];
      const cap =
        maximum === "all"
          ? Number.MAX_SAFE_INTEGER
          : (positiveInteger(maximum) ?? 0);
      return visibleInstalledCorpCards(input)
        .filter(
          (card) =>
            card.instanceId !== target.card.instanceId &&
            (card.advancementCounters ?? 0) > 0,
        )
        .map((source) => ({
          kind: "move_advancement" as const,
          action,
          capabilityId: `${action.actionId}:${source.instanceId}`,
          amount: Math.min(cap, source.advancementCounters ?? 0),
          sourceCardId: source.instanceId,
          clickCost: actionCost(action, "clicks"),
          creditCost: actionCost(action, "credits"),
          projected: false,
        }));
    },
  );
  if (!target.installAction) return legalCapabilities;

  const legalSourceIds = new Set(
    legalCapabilities
      .map((capability) => capability.sourceCardId)
      .filter((cardId): cardId is string => cardId !== undefined),
  );
  const projectedCapabilities = input.playerView.own.gripOrHq
    .filter(
      (card) =>
        card.known !== false &&
        card.type === "operation" &&
        card.instanceId !== target.card.instanceId &&
        !legalSourceIds.has(card.instanceId),
    )
    .flatMap<ConversionCapability>((card) => {
      const hint = card.definitionId
        ? AI_HINTS_BY_CARD.get(card.definitionId)
        : undefined;
      if (
        !hint ||
        hint.aiSupportStatus !== "ai_supported" ||
        hint.quality?.hintReviewed !== true
      )
        return [];
      const amount = Math.max(
        0,
        ...(hint.effects ?? [])
          .filter(
            (effect) =>
              effect.timing === "action" &&
              effect.resource === "advancement_counters" &&
              (effect.kind === "advance_burst" ||
                effect.kind === "score_acceleration"),
          )
          .map((effect) => effect.amount ?? 0),
      );
      if (amount <= 0) return [];
      return [
        {
          kind: "place_advancement",
          capabilityId: `projected:${card.instanceId}:place_advancement`,
          amount,
          sourceCardId: card.instanceId,
          clickCost: 1,
          creditCost: visibleCardCost(card),
          projected: true,
        },
      ];
    });
  return [...legalCapabilities, ...projectedCapabilities];
}

function actionCapacityCapabilities(input: AiDecisionInput): ActionCapacity[] {
  return input.legalActions.flatMap((action) => {
    if (
      action.side !== "corp" ||
      stringPayload(action, "scoreConversionCapability") !==
        "gain_action_capacity" ||
      stringPayload(action, "scoreConversionTiming") !== "immediate"
    )
      return [];
    const gain = numberPayload(action, "scoreConversionActionGainAmount");
    if (!gain || gain <= 0) return [];
    const sourceCardId = actionCardId(action);
    return [
      {
        action,
        gain,
        ...(sourceCardId ? { sourceCardId } : {}),
        sourceAdvancementCounterCost:
          numberPayload(action, "cardImplementationAdvancementCounterCost") ??
          0,
      },
    ];
  });
}

function applyActionCapacitySet(
  input: AiDecisionInput,
  target: ScoreTarget,
  capacities: readonly ActionCapacity[],
  sourceCounterBudget: Record<string, number>,
):
  | {
      clicks: number;
      credits: number;
      steps: CorpScoreConversionStep[];
      sourceCounters: Record<string, number>;
    }
  | undefined {
  let clicks = input.playerView.own.clicks;
  let credits = input.playerView.own.credits;
  const sourceCounters = { ...sourceCounterBudget };
  const steps: CorpScoreConversionStep[] = [];
  for (const capacity of [...capacities].sort(
    (left, right) =>
      right.gain -
        actionCost(right.action, "clicks") -
        (left.gain - actionCost(left.action, "clicks")) ||
      left.action.actionId.localeCompare(right.action.actionId),
  )) {
    const clickCost = actionCost(capacity.action, "clicks");
    const creditCost = actionCost(capacity.action, "credits");
    if (clickCost > clicks || creditCost > credits) return undefined;
    if (capacity.sourceCardId && capacity.sourceAdvancementCounterCost > 0) {
      const available = sourceCounters[capacity.sourceCardId] ?? 0;
      if (available < capacity.sourceAdvancementCounterCost) return undefined;
      sourceCounters[capacity.sourceCardId] =
        available - capacity.sourceAdvancementCounterCost;
    }
    clicks = clicks - clickCost + capacity.gain;
    credits -= creditCost;
    steps.push({
      kind: "gain_action_capacity",
      actionId: capacity.action.actionId,
      ...(capacity.sourceCardId ? { sourceCardId: capacity.sourceCardId } : {}),
      targetCardId: target.card.instanceId,
      targetServerId: target.serverId,
      advancementAmount: 0,
      clickCost,
      creditCost,
      generatedClicks: capacity.gain,
      evidence: [
        "score_conversion:gain_action_capacity",
        `score_conversion_action_gain:${capacity.gain}`,
      ],
    });
  }
  return { clicks, credits, steps, sourceCounters };
}

function completedPath(
  target: ScoreTarget,
  requirement: number,
  desiredCounters: number,
  initialCounters: number,
  steps: CorpScoreConversionStep[],
): CandidatePath {
  const advancementAdded = steps.reduce(
    (sum, step) => sum + step.advancementAmount,
    0,
  );
  const reservedAdvancementCounters: Record<string, number> = {};
  for (const step of steps) {
    if (step.kind !== "move_advancement" || !step.sourceCardId) continue;
    reservedAdvancementCounters[step.sourceCardId] =
      (reservedAdvancementCounters[step.sourceCardId] ?? 0) +
      step.advancementAmount;
  }
  const clicksRequired = steps.reduce((sum, step) => sum + step.clickCost, 0);
  const clicksGenerated = steps.reduce(
    (sum, step) => sum + step.generatedClicks,
    0,
  );
  const creditsRequired = steps.reduce((sum, step) => sum + step.creditCost, 0);
  const overadvance = Math.max(
    0,
    initialCounters + advancementAdded - requirement,
  );
  const rewardedOveradvance =
    desiredCounters > requirement &&
    overadvance >= desiredCounters - requirement;
  const overadvanceReason = rewardedOveradvance
    ? `visible_${target.card.overadvanceReward ?? "overadvance"}_threshold:${
        target.card.overadvanceThreshold ?? desiredCounters - requirement
      }`
    : undefined;
  return {
    agendaCardId: target.card.instanceId,
    agendaPoints: visibleAgendaPoints(target.card),
    targetServerId: target.serverId,
    advancementRequirement: requirement,
    initialAdvancementCounters: initialCounters,
    desiredAdvancementCounters: rewardedOveradvance
      ? desiredCounters
      : requirement,
    clicksRequired,
    clicksGenerated,
    creditsRequired,
    reservedAdvancementCounters,
    ...(overadvanceReason ? { overadvanceReason } : {}),
    sameTurnGuaranteed: true,
    steps,
    evidence: [
      "corp_score_conversion_path:true",
      "corp_score_conversion_same_turn_guaranteed:true",
      `corp_score_conversion_agenda:${target.card.instanceId}`,
      `corp_score_conversion_agenda_points:${visibleAgendaPoints(target.card)}`,
      `corp_score_conversion_server:${target.serverId}`,
      `corp_score_conversion_requirement:${requirement}`,
      `corp_score_conversion_desired_counters:${
        rewardedOveradvance ? desiredCounters : requirement
      }`,
      `corp_score_conversion_initial_counters:${initialCounters}`,
      `corp_score_conversion_clicks_required:${clicksRequired}`,
      `corp_score_conversion_clicks_generated:${clicksGenerated}`,
      `corp_score_conversion_credits_required:${creditsRequired}`,
      `corp_score_conversion_overadvance:${overadvance}`,
      ...(overadvanceReason
        ? [`corp_score_conversion_overadvance_reason:${overadvanceReason}`]
        : []),
    ],
    overadvance,
    rewardedOveradvance,
  };
}

function visibleAgendaPoints(card: VisibleCard): number {
  const definition = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
  return Math.max(0, card.agendaPoints ?? definition?.agendaPoints ?? 0);
}

function installTargetStep(
  target: ScoreTarget,
  action: LegalAction,
): CorpScoreConversionStep {
  const sourceCardId = actionCardId(action);
  return {
    kind: "install_score_target",
    actionId: action.actionId,
    ...(sourceCardId ? { sourceCardId } : {}),
    targetCardId: target.card.instanceId,
    targetServerId: target.serverId,
    advancementAmount: 0,
    clickCost: actionCost(action, "clicks"),
    creditCost: actionCost(action, "credits"),
    generatedClicks: 0,
    evidence: ["score_conversion:install_score_target"],
  };
}

function conversionStep(
  target: ScoreTarget,
  capability: ConversionCapability,
  amount: number,
): CorpScoreConversionStep {
  const sourceCardId =
    capability.sourceCardId ??
    (capability.action ? actionCardId(capability.action) : undefined);
  return {
    kind: capability.kind,
    ...(capability.action ? { actionId: capability.action.actionId } : {}),
    ...(sourceCardId ? { sourceCardId } : {}),
    targetCardId: target.card.instanceId,
    targetServerId: target.serverId,
    advancementAmount: amount,
    clickCost: capability.clickCost,
    creditCost: capability.creditCost,
    generatedClicks: 0,
    evidence: [
      `score_conversion:${capability.kind}`,
      `score_conversion_advancement_amount:${amount}`,
      ...(capability.projected
        ? ["score_conversion:projected_from_visible_hand"]
        : []),
    ],
  };
}

function basicAdvanceStep(target: ScoreTarget): CorpScoreConversionStep {
  return {
    kind: "basic_advance",
    targetCardId: target.card.instanceId,
    targetServerId: target.serverId,
    advancementAmount: 1,
    clickCost: 1,
    creditCost: 1,
    generatedClicks: 0,
    evidence: ["score_conversion:basic_advance"],
  };
}

function scoreStep(
  target: ScoreTarget,
  action?: LegalAction,
): CorpScoreConversionStep {
  return {
    kind: "score_ready",
    ...(action ? { actionId: action.actionId } : {}),
    targetCardId: target.card.instanceId,
    targetServerId: target.serverId,
    advancementAmount: 0,
    clickCost: 0,
    creditCost: 0,
    generatedClicks: 0,
    evidence: ["score_conversion:score_ready"],
  };
}

function scoreActionForCard(
  input: AiDecisionInput,
  cardId: string,
): LegalAction | undefined {
  return input.legalActions.find(
    (action) =>
      action.side === "corp" &&
      action.type === "score_agenda" &&
      actionCardId(action) === cardId,
  );
}

function visibleAdvancementCounterBudget(
  input: AiDecisionInput,
): Record<string, number> {
  return Object.fromEntries(
    visibleInstalledCorpCards(input).map((card) => [
      card.instanceId,
      Math.max(0, card.advancementCounters ?? 0),
    ]),
  );
}

function visibleOwnCard(
  input: AiDecisionInput,
  cardId: string,
): VisibleCard | undefined {
  return [
    input.playerView.own.identity,
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...visibleInstalledCorpCards(input),
  ].find((card) => card.instanceId === cardId);
}

function visibleInstalledCorpCards(input: AiDecisionInput): VisibleCard[] {
  return input.playerView.servers.flatMap((server) => [
    ...server.ice,
    ...server.root,
  ]);
}

function advancementRequirement(card: VisibleCard): number | undefined {
  return (
    positiveInteger(card.advancementRequirement) ??
    (card.definitionId
      ? positiveInteger(
          CARD_DEFINITIONS_BY_ID[card.definitionId]?.advancementRequirement,
        )
      : undefined)
  );
}

function isVisibleAgenda(card: VisibleCard): boolean {
  return (
    card.known !== false &&
    (card.type === "agenda" ||
      (card.definitionId
        ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.type === "agenda"
        : false))
  );
}

function actionCardId(action: LegalAction): string | undefined {
  const payloadCardId = action.payload?.cardId;
  if (typeof payloadCardId === "string" && payloadCardId.length > 0)
    return payloadCardId;
  return typeof action.source === "string" && action.source !== "game_rule"
    ? action.source
    : undefined;
}

function actionCost(action: LegalAction, key: "clicks" | "credits"): number {
  return (action.costs ?? []).reduce(
    (sum, cost) => sum + Math.max(0, Number(cost[key] ?? 0)),
    0,
  );
}

function visibleCardCost(card: VisibleCard): number {
  const runtimeNumeric = card.definitionId
    ? (
        RUNTIME_CARDS[card.definitionId] as
          | { numeric?: { cost?: number | null; installCost?: number | null } }
          | undefined
      )?.numeric
    : undefined;
  const demoCost = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]?.cost
    : undefined;
  return Math.max(
    0,
    card.cost ??
      runtimeNumeric?.cost ??
      runtimeNumeric?.installCost ??
      demoCost ??
      0,
  );
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberPayload(action: LegalAction, key: string): number | undefined {
  return positiveInteger(action.payload?.[key]);
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function powerSet<T>(items: readonly T[]): T[][] {
  if (items.length > 12) return [[]];
  return Array.from({ length: 2 ** items.length }, (_, mask) =>
    items.filter((_, index) => (mask & (1 << index)) !== 0),
  );
}

function comparePaths(
  left: CorpScoreConversionPath | CandidatePath,
  right: CorpScoreConversionPath | CandidatePath,
): number {
  const leftNetClicks = left.clicksRequired - left.clicksGenerated;
  const rightNetClicks = right.clicksRequired - right.clicksGenerated;
  const leftOveradvance = "overadvance" in left ? left.overadvance : 0;
  const rightOveradvance = "overadvance" in right ? right.overadvance : 0;
  const leftRewarded =
    "rewardedOveradvance" in left && left.rewardedOveradvance ? 1 : 0;
  const rightRewarded =
    "rewardedOveradvance" in right && right.rewardedOveradvance ? 1 : 0;
  return (
    right.agendaPoints - left.agendaPoints ||
    left.steps.length - right.steps.length ||
    left.creditsRequired - right.creditsRequired ||
    leftNetClicks - rightNetClicks ||
    rightRewarded - leftRewarded ||
    leftOveradvance - rightOveradvance ||
    left.agendaCardId.localeCompare(right.agendaCardId) ||
    left.targetServerId.localeCompare(right.targetServerId)
  );
}
