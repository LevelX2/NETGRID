import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { createAiHintsByCard } from "../ai-hints";
import { actionCapacityProjectionForLegalAction } from "../actions/action-capacity-projection";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import {
  searchActionCapacityRoutes,
  type ActionCapacityActionCandidate,
} from "./action-capacity-route";
import { createCorpActionDemand } from "./action-demand";
import { readCorpCounterBankPreparationQuote } from "./corp-counter-bank-preparation-quote";

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
  offTargetAdvancementAmount?: number;
  offTargetCardId?: string;
  sourceOpportunityCost?: number;
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
  offTargetAdvancementAmount?: number;
  sourceCardId?: string;
  sourceOpportunityCost?: number;
  clickCost: number;
  creditCost: number;
  projected: boolean;
};

type ActionCapacity = {
  action: LegalAction;
  gain: number;
  preExistingActionCost: number;
  sourceCardId?: string;
  sourceCounterType?: string;
  sourceCounterCost: number;
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
      input,
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
  const actionCapacitySets = routedActionCapacitySets(input, actionCapacities);
  const sourceCounterBudget = visibleAdvancementCounterBudget(input);
  let best: CandidatePath | undefined;

  for (const capacitySet of actionCapacitySets) {
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
        if (replacementRouteDestroysPlanProgress(input, candidate)) return;
        if (!best || comparePaths(candidate, best) < 0) best = candidate;
      },
    });
  }
  return best;
}

function replacementRouteDestroysPlanProgress(
  input: AiDecisionInput,
  path: CandidatePath,
): boolean {
  const installIndex = path.steps.findIndex(
    (step) => step.kind === "install_score_target",
  );
  const installStep = path.steps[installIndex];
  if (!installStep?.actionId) return false;
  const installAction = input.legalActions.find(
    (action) => action.actionId === installStep.actionId,
  );
  if (
    installAction?.side !== "corp" ||
    installAction.type !== "install_card" ||
    installAction.payload?.rootReplacement !== "asset_to_agenda"
  ) {
    return false;
  }
  const serverId = stringPayload(installAction, "serverId");
  if (!serverId) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;

  const laterSourceIds = new Set(
    path.steps
      .slice(installIndex + 1)
      .map((step) => step.sourceCardId)
      .filter((cardId): cardId is string => cardId !== undefined),
  );
  if (server.root.some((card) => laterSourceIds.has(card.instanceId))) {
    return true;
  }

  const replacesProductiveCounterBank = server.root.some((card) => {
    const quote = readCorpCounterBankPreparationQuote(
      input,
      card,
      "installed_root",
      serverId,
    );
    return quote !== undefined && quote.advancementCounters > 0;
  });
  return (
    replacesProductiveCounterBank &&
    !isTerminalMatchScoreReplacement(input, path, installIndex)
  );
}

function isTerminalMatchScoreReplacement(
  input: AiDecisionInput,
  path: CandidatePath,
  installIndex: number,
): boolean {
  return (
    installIndex === 0 &&
    path.steps.at(-1)?.kind === "score_ready" &&
    input.playerView.own.agendaPoints + path.agendaPoints >=
      input.playerView.agendaPointsToWin
  );
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
        params.input,
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
  const offTargetSourceIds =
    capability.kind === "place_advancement" &&
    (capability.offTargetAdvancementAmount ?? 0) > 0
      ? [
          ...new Set(
            params.capabilities
              .slice(params.index + 1)
              .filter(
                (later) =>
                  later.kind === "move_advancement" &&
                  later.sourceCardId !== undefined &&
                  later.sourceCardId !== params.target.card.instanceId,
              )
              .map((later) => later.sourceCardId!),
          ),
        ].sort()
      : [];
  const offTargetBranches: Array<string | undefined> =
    offTargetSourceIds.length > 0 ? offTargetSourceIds : [undefined];
  for (const offTargetCardId of offTargetBranches) {
    const branchSourceCounters = { ...nextSourceCounters };
    if (offTargetCardId) {
      branchSourceCounters[offTargetCardId] =
        (branchSourceCounters[offTargetCardId] ?? 0) +
        (capability.offTargetAdvancementAmount ?? 0);
    }
    const step = conversionStep(params.target, capability, appliedAmount);
    if (offTargetCardId) {
      step.offTargetCardId = offTargetCardId;
      step.evidence.push(`score_conversion_off_target_card:${offTargetCardId}`);
    }
    visitCapabilityCombinations({
      ...params,
      index: params.index + 1,
      remaining: Math.max(0, params.remaining - appliedAmount),
      clicks: params.clicks - clickCost,
      credits: params.credits - creditCost,
      sourceCounters: branchSourceCounters,
      usedActionIds,
      steps: [...params.steps, step],
    });
  }
}

function scoreTargets(input: AiDecisionInput): ScoreTarget[] {
  const installed = input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .flatMap((server) =>
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
        const targetAmount =
          mode === "up_to_distinct_targets_one_each" ? 1 : amount;
        const offTargetAdvancementAmount =
          mode === "up_to_distinct_targets_one_each"
            ? Math.max(0, amount - targetAmount)
            : 0;
        return [
          {
            kind: "place_advancement" as const,
            action,
            capabilityId: action.actionId,
            amount: targetAmount,
            ...(offTargetAdvancementAmount > 0
              ? { offTargetAdvancementAmount }
              : {}),
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
        const maximumAmount =
          maximum === "all"
            ? Number.MAX_SAFE_INTEGER
            : (positiveInteger(maximum) ?? 0);
        return sourceCardId &&
          source &&
          sourceCardId !== target.card.instanceId &&
          maximumAmount > 0 &&
          (source.advancementCounters ?? 0) > 0
          ? [
              {
                kind: "move_advancement" as const,
                action,
                capabilityId: action.actionId,
                amount: maximumAmount,
                sourceCardId,
                sourceOpportunityCost: advancementSourceOpportunityCost(
                  source,
                  Math.min(maximumAmount, source.advancementCounters ?? 0),
                ),
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
        .map((source) => {
          return {
            kind: "move_advancement" as const,
            action,
            capabilityId: `${action.actionId}:${source.instanceId}`,
            amount: cap,
            sourceCardId: source.instanceId,
            sourceOpportunityCost: advancementSourceOpportunityCost(
              source,
              Math.min(cap, source.advancementCounters ?? 0),
            ),
            clickCost: actionCost(action, "clicks"),
            creditCost: actionCost(action, "credits"),
            projected: false,
          };
        });
    },
  );
  if (!target.installAction)
    return legalCapabilities.sort(compareConversionCapabilities);

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
      const placement = (hint.effects ?? [])
        .filter(
          (effect) =>
            effect.timing === "action" &&
            effect.resource === "advancement_counters" &&
            (effect.kind === "advance_burst" ||
              effect.kind === "score_acceleration"),
        )
        .map((effect) => {
          const totalAmount = Math.max(0, effect.amount ?? 0);
          const targetAmount =
            effect.target === "advance.up_to_distinct_targets_one_each"
              ? Math.min(1, totalAmount)
              : totalAmount;
          return {
            targetAmount,
            offTargetAdvancementAmount:
              effect.target === "advance.up_to_distinct_targets_one_each"
                ? Math.max(0, totalAmount - targetAmount)
                : 0,
          };
        })
        .sort(
          (left, right) =>
            right.targetAmount - left.targetAmount ||
            right.offTargetAdvancementAmount - left.offTargetAdvancementAmount,
        )[0];
      const amount = placement?.targetAmount ?? 0;
      if (amount <= 0) return [];
      const creditCost = visibleCardCost(card);
      if (creditCost === undefined) return [];
      return [
        {
          kind: "place_advancement",
          capabilityId: `projected:${card.instanceId}:place_advancement`,
          amount,
          ...(placement && placement.offTargetAdvancementAmount > 0
            ? {
                offTargetAdvancementAmount:
                  placement.offTargetAdvancementAmount,
              }
            : {}),
          sourceCardId: card.instanceId,
          clickCost: 1,
          creditCost,
          projected: true,
        },
      ];
    });
  return [...legalCapabilities, ...projectedCapabilities].sort(
    compareConversionCapabilities,
  );
}

function compareConversionCapabilities(
  left: ConversionCapability,
  right: ConversionCapability,
): number {
  const kindOrder = { place_advancement: 0, move_advancement: 1 } as const;
  return (
    kindOrder[left.kind] - kindOrder[right.kind] ||
    left.capabilityId.localeCompare(right.capabilityId)
  );
}

function actionCapacityCapabilities(input: AiDecisionInput): ActionCapacity[] {
  return input.legalActions.flatMap((action) => {
    if (action.side !== "corp") return [];
    const projection = actionCapacityProjectionForLegalAction(action);
    if (
      projection.kind !== "immediate_unrestricted_gain" ||
      projection.timing !== "immediate" ||
      projection.reliability !== "guaranteed" ||
      projection.grossActionsGained <= 0
    )
      return [];
    const sourceCardId = actionCardId(action);
    return [
      {
        action,
        gain: projection.grossActionsGained,
        preExistingActionCost: projection.preExistingActionCost,
        ...(sourceCardId ? { sourceCardId } : {}),
        ...(projection.sourceCounterType
          ? { sourceCounterType: projection.sourceCounterType }
          : {}),
        sourceCounterCost: projection.sourceCounterCost ?? 0,
      },
    ];
  });
}

function routedActionCapacitySets(
  input: AiDecisionInput,
  capacities: readonly ActionCapacity[],
): ActionCapacity[][] {
  if (capacities.length === 0) return [[]];
  const candidates: ActionCapacityActionCandidate[] = capacities.map(
    (capacity) => {
      const projection = actionCapacityProjectionForLegalAction(
        capacity.action,
      );
      return {
        actionId: capacity.action.actionId,
        actionType: capacity.action.type,
        ...(capacity.sourceCardId
          ? { sourceCardInstanceId: capacity.sourceCardId }
          : {}),
        costProfile: {
          clickCost: projection.listedActionCost,
          creditCost: actionCost(capacity.action, "credits"),
          costKnownStatus: "known",
          additionalCosts: [],
        },
        actionCapacityProjection: projection,
      };
    },
  );
  const capacityByActionId = new Map(
    capacities.map((capacity) => [capacity.action.actionId, capacity]),
  );
  const visibleSourceCounterAmounts: Record<string, number> = {};
  for (const capacity of capacities) {
    if (
      !capacity.sourceCardId ||
      !capacity.sourceCounterType ||
      capacity.sourceCounterCost <= 0
    )
      continue;
    const source = visibleOwnCard(input, capacity.sourceCardId);
    if (!source) continue;
    const amount =
      capacity.sourceCounterType === "advancement"
        ? (source.advancementCounters ?? 0)
        : ((source.counters as Record<string, number> | undefined)?.[
            capacity.sourceCounterType
          ] ?? 0);
    visibleSourceCounterAmounts[
      `${capacity.sourceCardId}:${capacity.sourceCounterType}`
    ] = Math.max(0, amount);
  }
  const sets = new Map<string, ActionCapacity[]>([["", []]]);
  const currentActions = Math.max(0, input.playerView.own.clicks);
  const maximumTarget = Math.min(12, currentActions + 8);
  for (
    let targetActions = currentActions + 1;
    targetActions <= maximumTarget;
    targetActions += 1
  ) {
    const demand = createCorpActionDemand({
      demandId: `score-conversion:${targetActions}`,
      purpose: "current_score_closeout",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "before_current_plan_action",
      currentActions,
      targetActions,
      acceptedRestrictions: ["unrestricted"],
      requiredActionTypes: ["install_card", "advance_card", "score_agenda"],
    });
    const search = searchActionCapacityRoutes({
      demand,
      candidates,
      remainingActions: currentActions,
      availableCredits: input.playerView.own.credits,
      visibleSourceCounterAmounts,
      maxSteps: 8,
      maxRoutes: 16,
    });
    for (const route of search.routes) {
      if (
        route.status !== "covered_guaranteed" ||
        route.horizon !== "same_turn"
      )
        continue;
      const routed = route.steps.flatMap((step) => {
        if (step.kind !== "legal_action" || !step.actionId) return [];
        const capacity = capacityByActionId.get(step.actionId);
        return capacity ? [capacity] : [];
      });
      const signature = routed
        .map((capacity) => capacity.action.actionId)
        .sort()
        .join("+");
      if (!sets.has(signature)) sets.set(signature, routed);
    }
  }
  return [...sets.values()];
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
        right.preExistingActionCost -
        (left.gain - left.preExistingActionCost) ||
      left.action.actionId.localeCompare(right.action.actionId),
  )) {
    const clickCost = actionCost(capacity.action, "clicks");
    const creditCost = actionCost(capacity.action, "credits");
    if (capacity.preExistingActionCost > clicks || creditCost > credits)
      return undefined;
    if (capacity.sourceCardId && capacity.sourceCounterCost > 0) {
      if (capacity.sourceCounterType === "advancement") {
        const available = sourceCounters[capacity.sourceCardId] ?? 0;
        if (available < capacity.sourceCounterCost) return undefined;
        sourceCounters[capacity.sourceCardId] =
          available - capacity.sourceCounterCost;
      }
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
  input: AiDecisionInput,
  target: ScoreTarget,
  requirement: number,
  desiredCounters: number,
  initialCounters: number,
  steps: CorpScoreConversionStep[],
): CandidatePath {
  const boundSteps = bindOffTargetAdvancementSteps(input, steps);
  const advancementAdded = boundSteps.reduce(
    (sum, step) => sum + step.advancementAmount,
    0,
  );
  const reservedAdvancementCounters: Record<string, number> = {};
  for (const step of boundSteps) {
    if (step.kind !== "move_advancement" || !step.sourceCardId) continue;
    reservedAdvancementCounters[step.sourceCardId] =
      (reservedAdvancementCounters[step.sourceCardId] ?? 0) +
      step.advancementAmount;
  }
  const clicksRequired = boundSteps.reduce(
    (sum, step) => sum + step.clickCost,
    0,
  );
  const clicksGenerated = boundSteps.reduce(
    (sum, step) => sum + step.generatedClicks,
    0,
  );
  const creditsRequired = boundSteps.reduce(
    (sum, step) => sum + step.creditCost,
    0,
  );
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
  const agendaPoints = visibleAgendaPoints(input, target.card);
  return {
    agendaCardId: target.card.instanceId,
    agendaPoints,
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
    steps: boundSteps,
    evidence: [
      "corp_score_conversion_path:true",
      "corp_score_conversion_same_turn_guaranteed:true",
      `corp_score_conversion_agenda:${target.card.instanceId}`,
      `corp_score_conversion_agenda_points:${agendaPoints}`,
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

function bindOffTargetAdvancementSteps(
  input: AiDecisionInput,
  steps: readonly CorpScoreConversionStep[],
): CorpScoreConversionStep[] {
  const advanceableSourceIds = new Set(
    input.playerView.servers.flatMap((server) =>
      server.root.flatMap((card) => {
        const isAgenda = card.type === "agenda";
        const hasCounterBankQuote =
          readCorpCounterBankPreparationQuote(
            input,
            card,
            "installed_root",
            server.id,
          ) !== undefined;
        return isAgenda || hasCounterBankQuote ? [card.instanceId] : [];
      }),
    ),
  );
  const reservedSourceIds = steps
    .filter(
      (step) =>
        step.kind === "move_advancement" &&
        step.sourceCardId !== undefined &&
        advanceableSourceIds.has(step.sourceCardId),
    )
    .map((step) => step.sourceCardId!);

  return steps.map((step) => {
    if (step.kind !== "place_advancement" || !step.offTargetAdvancementAmount) {
      return step;
    }
    const offTargetCardId =
      step.offTargetCardId ??
      reservedSourceIds.find(
        (sourceCardId) => sourceCardId !== step.targetCardId,
      );
    if (offTargetCardId) {
      return {
        ...step,
        offTargetCardId,
        evidence: [
          ...step.evidence,
          `score_conversion_off_target_card:${offTargetCardId}`,
        ],
      };
    }
    const {
      offTargetAdvancementAmount: _unusedOffTargetAmount,
      ...withoutOffTarget
    } = step;
    return {
      ...withoutOffTarget,
      evidence: step.evidence.filter(
        (entry) =>
          !entry.startsWith("score_conversion_off_target_advancement_amount:"),
      ),
    };
  });
}

function visibleAgendaPoints(
  input: AiDecisionInput,
  card: VisibleCard,
): number {
  const definition = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
  const agendaPoints = card.agendaPoints ?? definition?.agendaPoints;
  if (typeof agendaPoints !== "number" || !Number.isFinite(agendaPoints))
    throw new PlanResolutionFailure("missing_card_definition", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "rules_contract",
      removalCondition: `Provide finite agenda points for ${card.definitionId ?? card.instanceId}.`,
    });
  return Math.max(0, agendaPoints);
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
    ...(capability.offTargetAdvancementAmount !== undefined
      ? {
          offTargetAdvancementAmount: capability.offTargetAdvancementAmount,
        }
      : {}),
    ...(capability.sourceOpportunityCost !== undefined
      ? { sourceOpportunityCost: capability.sourceOpportunityCost }
      : {}),
    clickCost: capability.clickCost,
    creditCost: capability.creditCost,
    generatedClicks: 0,
    evidence: [
      `score_conversion:${capability.kind}`,
      `score_conversion_advancement_amount:${amount}`,
      ...(capability.offTargetAdvancementAmount !== undefined
        ? [
            `score_conversion_off_target_advancement_amount:${capability.offTargetAdvancementAmount}`,
          ]
        : []),
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
  if (card.advancementRequirement !== undefined) {
    return nonNegativeInteger(card.advancementRequirement);
  }
  return card.definitionId
    ? positiveInteger(
        CARD_DEFINITIONS_BY_ID[card.definitionId]?.advancementRequirement,
      )
    : undefined;
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

function visibleCardCost(card: VisibleCard): number | undefined {
  if (card.type === "event" || card.type === "operation") {
    const playCost = card.playCost;
    if (playCost === undefined) return undefined;
    if (playCost.kind === "fixed") {
      return Number.isInteger(playCost.credits) && playCost.credits >= 0
        ? playCost.credits
        : undefined;
    }
    if (
      playCost.kind !== "variable_x" ||
      !Number.isInteger(playCost.minimumX) ||
      playCost.minimumX < 0 ||
      !Number.isInteger(playCost.creditsPerX) ||
      playCost.creditsPerX < 1 ||
      playCost.maximumX?.kind !== "context"
    ) {
      return undefined;
    }
    return playCost.minimumX * playCost.creditsPerX;
  }
  return Number.isInteger(card.installCost) && (card.installCost ?? -1) >= 0
    ? card.installCost
    : undefined;
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

function nonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
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
  const leftSourceOpportunityCost = left.steps.reduce(
    (sum, step) => sum + (step.sourceOpportunityCost ?? 0),
    0,
  );
  const rightSourceOpportunityCost = right.steps.reduce(
    (sum, step) => sum + (step.sourceOpportunityCost ?? 0),
    0,
  );
  const leftOffTargetAdvancement = left.steps.reduce(
    (sum, step) =>
      sum + (step.offTargetCardId ? (step.offTargetAdvancementAmount ?? 0) : 0),
    0,
  );
  const rightOffTargetAdvancement = right.steps.reduce(
    (sum, step) =>
      sum + (step.offTargetCardId ? (step.offTargetAdvancementAmount ?? 0) : 0),
    0,
  );
  return (
    right.agendaPoints - left.agendaPoints ||
    left.steps.length - right.steps.length ||
    left.creditsRequired - right.creditsRequired ||
    leftNetClicks - rightNetClicks ||
    leftSourceOpportunityCost - rightSourceOpportunityCost ||
    rightOffTargetAdvancement - leftOffTargetAdvancement ||
    rightRewarded - leftRewarded ||
    leftOveradvance - rightOveradvance ||
    left.agendaCardId.localeCompare(right.agendaCardId) ||
    left.targetServerId.localeCompare(right.targetServerId)
  );
}

function advancementSourceOpportunityCost(
  source: VisibleCard,
  amount: number,
): number {
  const countersBefore = Math.max(0, source.advancementCounters ?? 0);
  const countersAfter = Math.max(0, countersBefore - amount);
  if (!isVisibleAgenda(source)) return amount * 10;
  const requirement = advancementRequirement(source) ?? Number.MAX_SAFE_INTEGER;
  const losesScoreReadiness =
    countersBefore >= requirement && countersAfter < requirement;
  return (
    500 +
    amount * 100 +
    Math.max(0, source.agendaPoints ?? 0) * 200 +
    (losesScoreReadiness ? 10_000 : 0)
  );
}
