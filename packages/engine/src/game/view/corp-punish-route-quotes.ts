import {
  CARD_DEFINITIONS_BY_ID,
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type CorpPunishRouteIncompleteReason,
  type CorpPunishRouteQuote,
  type CorpPunishRouteQuoteRequest,
  type CorpPunishRouteQuoteResult,
  type CorpPunishRouteStepQuote,
  type EngineError,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import type {
  CardConditionImplementation,
  CardEffectImplementation,
  OnPlayCardAbilityImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { getLegalActions } from "../legal-actions";
import { fixedPlayCostCredits } from "../payment/play-cost";

type CertifiedStep = {
  quote: CorpPunishRouteStepQuote;
  effects: readonly CardEffectImplementation[];
  condition?: CardConditionImplementation;
};

/**
 * Certifies rules facts for one caller-owned Corp punish route.
 *
 * This boundary deliberately does not select a route. It accepts only exact
 * source/capability bindings, validates the current head against LegalActions
 * and projects the narrow deterministic on-play tag/damage slice supported by
 * the declarative CardImplementation vocabulary. Unsupported steps make only
 * this route incomplete; no printed rules text or AI hint is consulted.
 */
export function quoteCorpPunishRoute(
  state: GameState,
  request: CorpPunishRouteQuoteRequest,
): CorpPunishRouteQuoteResult {
  if (!isCorpPunishRouteQuoteRequest(request)) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Punish-Routen-Anfrage ist unvollständig.",
    );
  }
  if (request.matchId !== state.matchId) {
    return quoteFail(
      "ERR_INVALID_TARGET",
      "Die Punish-Routen-Anfrage gehört nicht zu diesem Spiel.",
    );
  }
  if (request.stateVersion !== state.stateVersion) {
    return quoteFail(
      "ERR_STALE_STATE",
      "Der Spielzustand der Punish-Routen-Anfrage ist veraltet.",
    );
  }
  if (request.side !== "corp") {
    return quoteFail(
      "ERR_WRONG_SIDE",
      "Nur die Corp darf eine Corp-Punish-Route quoten.",
    );
  }
  if (
    request.timingPoint !== state.timingPoint ||
    state.activeSide !== "corp" ||
    state.timingPoint !== "corp_action.main"
  ) {
    return quoteFail(
      "ERR_UNKNOWN_ACTION",
      "Die Punish-Route gehört nicht zum aktuellen Corp-Aktionsfenster.",
    );
  }

  const requestEcho = cloneRequest(request);
  const requestFingerprint = corpPunishRouteRequestFingerprint(request);
  const base = quoteBase(state, requestEcho, requestFingerprint);
  const certifiedSteps: CertifiedStep[] = [];

  for (const step of request.steps) {
    const certification = certifyStep(state, step);
    if (!certification.ok) {
      return {
        ok: true,
        quote: incompleteQuote(base, certification.reason),
      };
    }
    certifiedSteps.push(certification.step);
  }

  const head = certifiedSteps[0];
  const currentHeadAction = head
    ? exactCurrentHeadAction(state, head.quote)
    : undefined;
  const fundingOnlyHead =
    head && !currentHeadAction
      ? exactFundingOnlyHeadAvailable(state, head.quote)
      : false;
  if (!head || (!currentHeadAction && !fundingOnlyHead)) {
    return {
      ok: true,
      quote: incompleteQuote(base, "head_legal_action_unavailable"),
    };
  }
  if (currentHeadAction) {
    head.quote.currentLegalAction = structuredClone(currentHeadAction);
  }

  let projectedRunnerTags = state.runner.tags;
  let rawMeatDamage = 0;
  let rawNetDamage = 0;
  let rawCoreDamage = 0;
  let directTagStepId: string | undefined;
  for (const certified of certifiedSteps) {
    const condition = certified.condition;
    if (condition) {
      const conditionStatus = conditionStatusAfterPriorSteps(
        condition,
        projectedRunnerTags,
        certified.quote.order === 0,
      );
      if (conditionStatus !== "met") {
        return {
          ok: true,
          quote: incompleteQuote(
            base,
            conditionStatus === "unknown"
              ? "future_state_transition_unavailable"
              : "source_condition_unsatisfied",
          ),
        };
      }
    }
    for (const effect of certified.effects) {
      if (effect.kind === "add_tags") {
        projectedRunnerTags += effect.amount;
        directTagStepId ??= certified.quote.stepId;
      } else if (effect.kind === "damage") {
        if (effect.damageType === "meat") rawMeatDamage += effect.amount;
        if (effect.damageType === "net") rawNetDamage += effect.amount;
        if (effect.damageType === "core") rawCoreDamage += effect.amount;
      }
    }
  }

  if (hasVisibleDamageModifierOrPrevention(state)) {
    return {
      ok: true,
      quote: incompleteQuote(base, "damage_prevention_quote_incomplete"),
    };
  }

  const totalClicks = certifiedSteps.reduce(
    (sum, step) => sum + step.quote.clicks,
    0,
  );
  const totalActionCredits = certifiedSteps.reduce(
    (sum, step) => sum + step.quote.credits,
    0,
  );
  const rawDamage = rawMeatDamage + rawNetDamage + rawCoreDamage;
  const hasDamage = rawDamage > 0;

  return {
    ok: true,
    quote: {
      ...base,
      complete: true,
      incompleteReasons: [],
      steps: certifiedSteps.map(({ quote }) => quote),
      totalClicks,
      totalActionCredits,
      tagTrigger:
        state.runner.tags > 0
          ? {
              kind: "existing_tag",
              status: "satisfied",
              currentRunnerTags: state.runner.tags,
              requiredRunnerTags: 1,
            }
          : directTagStepId
            ? {
                kind: "direct_tag_step",
                status: "projected",
                currentRunnerTags: 0,
                requiredRunnerTags: 1,
                sourceStepId: directTagStepId,
              }
            : {
                kind: "none",
                status: "not_required",
                currentRunnerTags: 0,
                requiredRunnerTags: 0,
              },
      responsePaymentEnvelope: {
        responseKind: hasDamage ? "runner_optional" : "none",
        paymentKnowledge: hasDamage ? "unknown" : "exact_public",
        corpCreditsAvailable: state.corp.credits,
        runnerCreditsVisible: state.runner.credits,
        corpResponseCredits: { minimum: 0, maximum: 0 },
        totalCorpCredits: {
          minimum: totalActionCredits,
          maximum: totalActionCredits,
        },
        runnerResponseCredits: {
          minimum: 0,
          maximum: hasDamage ? state.runner.credits : 0,
        },
      },
      damageEnvelope: {
        runnerHandCount: state.runner.grip.length,
        rawDamage: {
          meat: rawMeatDamage,
          net: rawNetDamage,
          core: rawCoreDamage,
          total: rawDamage,
        },
        effectiveDamage: {
          minimum: rawDamage,
          maximum: rawDamage,
        },
        visiblePrevention: {
          knowledge: "none_visible",
          maximumPreventableDamage: 0,
          creditCost: { minimum: 0, maximum: 0 },
        },
        visiblePiercing: {
          knowledge: "none_visible",
          maximumBypassedDamage: 0,
          creditCost: { minimum: 0, maximum: 0 },
        },
      },
      guarantee: hasDamage ? "conditional_on_runner_response" : "guaranteed",
      responseKnowledge: hasDamage ? "unknown" : "public_exact",
    },
  };
}

export function corpPunishRouteRequestFingerprint(
  request: CorpPunishRouteQuoteRequest,
): string {
  return encodeParts([
    CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    request.matchId,
    request.side,
    String(request.stateVersion),
    request.timingPoint,
    request.campaignId,
    request.routeId,
    String(request.steps.length),
    ...request.steps.flatMap((step) => [
      step.stepId,
      String(step.order),
      step.kind,
      step.sourceCardInstanceId,
      step.sourceCapabilityId,
    ]),
  ]);
}

function certifyStep(
  state: GameState,
  request: CorpPunishRouteQuoteRequest["steps"][number],
):
  | { ok: true; step: CertifiedStep }
  | { ok: false; reason: CorpPunishRouteIncompleteReason } {
  const instance = state.cardInstances[request.sourceCardInstanceId];
  if (!instance) return { ok: false, reason: "source_unavailable" };
  if (
    instance.owner !== "corp" ||
    instance.controller !== "corp" ||
    instance.zone.side !== "corp"
  ) {
    return { ok: false, reason: "source_unavailable" };
  }
  if (instance.zone.zone !== "hq") {
    return { ok: false, reason: "source_zone_unsupported" };
  }

  const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
  if (!definition || definition.side !== "corp") {
    return { ok: false, reason: "source_identity_unknown" };
  }
  if (definition.type !== "operation") {
    return { ok: false, reason: "source_capability_unsupported" };
  }
  const capability = onPlayCapability(
    instance.definitionId,
    request.sourceCapabilityId,
  );
  if (!capability) {
    return { ok: false, reason: "source_capability_missing" };
  }
  if (capability.costs !== "printed") {
    return { ok: false, reason: "cost_quote_incomplete" };
  }
  const effectValidation = supportedEffects(request.kind, capability.effects);
  if (!effectValidation.ok) return effectValidation;

  const credits = fixedPlayCostCredits(definition);
  if (!Number.isSafeInteger(credits) || credits < 0) {
    return { ok: false, reason: "cost_quote_incomplete" };
  }
  return {
    ok: true,
    step: {
      quote: {
        stepId: request.stepId,
        order: request.order,
        kind: request.kind,
        sourceCardInstanceId: request.sourceCardInstanceId,
        sourceCardDefinitionId: instance.definitionId,
        sourceCapabilityId: request.sourceCapabilityId,
        clicks: 1,
        credits,
      },
      effects: capability.effects,
      ...(capability.condition ? { condition: capability.condition } : {}),
    },
  };
}

function onPlayCapability(
  definitionId: string,
  capabilityId: string,
): OnPlayCardAbilityImplementation | undefined {
  const match = /^ability:on_play:(0|[1-9]\d*)$/.exec(capabilityId);
  if (!match) return undefined;
  const index = Number(match[1]);
  const ability =
    cardImplementationForDefinitionId(definitionId)?.abilities?.[index];
  return ability?.kind === "on_play" ? ability : undefined;
}

function supportedEffects(
  requestedKind: CorpPunishRouteQuoteRequest["steps"][number]["kind"],
  effects: readonly CardEffectImplementation[],
): { ok: true } | { ok: false; reason: CorpPunishRouteIncompleteReason } {
  if (effects.length !== 1) {
    return { ok: false, reason: "source_effects_unsupported" };
  }
  const effect = effects[0];
  if (!effect || effect.visibility !== "public") {
    return { ok: false, reason: "source_effects_unsupported" };
  }
  if (effect.kind === "trace") {
    return { ok: false, reason: "response_window_unknown" };
  }
  if (
    effect.kind === "add_tags" &&
    effect.recipient === "runner" &&
    Number.isSafeInteger(effect.amount) &&
    effect.amount > 0
  ) {
    return requestedKind === "tag"
      ? { ok: true }
      : { ok: false, reason: "source_effects_unsupported" };
  }
  if (
    effect.kind === "damage" &&
    effect.recipient === "runner" &&
    effect.preventable === true &&
    Number.isSafeInteger(effect.amount) &&
    effect.amount > 0
  ) {
    return requestedKind === `${effect.damageType}_damage`
      ? { ok: true }
      : { ok: false, reason: "source_effects_unsupported" };
  }
  if (
    effect.kind === "lose_credits" &&
    effect.recipient === "runner" &&
    effect.mode === "all"
  ) {
    return requestedKind === "other_punish"
      ? { ok: true }
      : { ok: false, reason: "source_effects_unsupported" };
  }
  return { ok: false, reason: "source_effects_unsupported" };
}

function exactCurrentHeadAction(
  state: GameState,
  step: CorpPunishRouteStepQuote,
): LegalAction | undefined {
  return getLegalActions(state, "corp").find(
    (action) =>
      action.side === "corp" &&
      action.type === "play_operation" &&
      action.source === step.sourceCardInstanceId &&
      action.payload?.cardId === step.sourceCardInstanceId &&
      action.timingPoint === state.timingPoint &&
      action.expiresAtStateVersion === state.stateVersion &&
      action.targetRequirements.length === 0 &&
      (action.choiceRequirements?.length ?? 0) === 0 &&
      sumActionCost(action, "clicks") === step.clicks &&
      sumActionCost(action, "credits") === step.credits,
  );
}

/**
 * Proves that the current head is blocked only by a fixed credit shortfall.
 *
 * The hypothetical state changes no rules fact except the Corp credit pool.
 * LegalAction projection remains the authority for every other condition,
 * timing, click, target and choice requirement. The projected action is not
 * exposed as a current LegalAction; it only certifies the funding horizon.
 */
function exactFundingOnlyHeadAvailable(
  state: GameState,
  step: CorpPunishRouteStepQuote,
): boolean {
  if (
    step.credits <= state.corp.credits ||
    step.clicks > state.corp.clicks ||
    step.credits < 1
  ) {
    return false;
  }
  const fundedProbe = structuredClone(state);
  fundedProbe.corp.credits = step.credits;
  return exactCurrentHeadAction(fundedProbe, step) !== undefined;
}

function conditionStatusAfterPriorSteps(
  condition: CardConditionImplementation,
  projectedRunnerTags: number,
  isCurrentHead: boolean,
): "met" | "unmet" | "unknown" {
  if (isCurrentHead) return "met";
  if (condition.kind === "runner_is_tagged")
    return projectedRunnerTags > 0 ? "met" : "unmet";
  if (condition.kind === "runner_tags_at_least")
    return projectedRunnerTags >= condition.amount ? "met" : "unmet";
  return "unknown";
}

function hasVisibleDamageModifierOrPrevention(state: GameState): boolean {
  for (const instance of Object.values(state.cardInstances)) {
    if (!instance.faceup) continue;
    if (instance.zone.side !== "runner" || instance.zone.zone !== "rig") {
      if (
        instance.zone.side === "corp" &&
        instance.zone.zone === "serverRoot" &&
        instance.rezzed &&
        cardImplementationForDefinitionId(instance.definitionId)?.corpUtility
          ?.kind === "meat_damage_boost"
      ) {
        return true;
      }
      continue;
    }
    if (
      (
        cardImplementationForDefinitionId(instance.definitionId)
          ?.damagePreventionSources ?? []
      ).length > 0
    ) {
      return true;
    }
  }
  return false;
}

function quoteBase(
  state: GameState,
  requestEcho: CorpPunishRouteQuoteRequest,
  requestFingerprint: string,
): Pick<
  CorpPunishRouteQuote,
  | "schemaVersion"
  | "visibility"
  | "matchId"
  | "side"
  | "routeId"
  | "campaignId"
  | "campaignIdOrigin"
  | "stateVersion"
  | "timingPoint"
  | "requestFingerprint"
  | "requestEcho"
> {
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    visibility: "private_to_actor",
    matchId: state.matchId,
    side: "corp",
    routeId: requestEcho.routeId,
    campaignId: requestEcho.campaignId,
    campaignIdOrigin: "request_binding",
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    requestFingerprint,
    requestEcho,
  };
}

function incompleteQuote(
  base: ReturnType<typeof quoteBase>,
  reason: CorpPunishRouteIncompleteReason,
): CorpPunishRouteQuote {
  return {
    ...base,
    complete: false,
    incompleteReasons: [reason],
    steps: [],
    totalClicks: 0,
    totalActionCredits: 0,
    tagTrigger: {
      kind: "unknown",
      status: "unknown",
      currentRunnerTags: 0,
      requiredRunnerTags: 0,
    },
    responsePaymentEnvelope: {
      responseKind: "unknown",
      paymentKnowledge: "unknown",
      corpCreditsAvailable: 0,
      runnerCreditsVisible: 0,
      corpResponseCredits: { minimum: 0, maximum: 0 },
      totalCorpCredits: { minimum: 0, maximum: 0 },
      runnerResponseCredits: { minimum: 0, maximum: 0 },
    },
    damageEnvelope: {
      runnerHandCount: 0,
      rawDamage: { meat: 0, net: 0, core: 0, total: 0 },
      effectiveDamage: { minimum: 0, maximum: 0 },
      visiblePrevention: {
        knowledge: "unknown",
        maximumPreventableDamage: 0,
        creditCost: { minimum: 0, maximum: 0 },
      },
      visiblePiercing: {
        knowledge: "unknown",
        maximumBypassedDamage: 0,
        creditCost: { minimum: 0, maximum: 0 },
      },
    },
    guarantee: "unknown",
    responseKnowledge: "unknown",
  };
}

function isCorpPunishRouteQuoteRequest(request: unknown): boolean {
  if (!request || typeof request !== "object") return false;
  const record = request as Partial<CorpPunishRouteQuoteRequest>;
  if (
    record.schemaVersion !== CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION ||
    !nonblank(record.matchId) ||
    (record.side !== "corp" && record.side !== "runner") ||
    !nonNegativeSafeInteger(record.stateVersion) ||
    !nonblank(record.timingPoint) ||
    !nonblank(record.campaignId) ||
    !nonblank(record.routeId) ||
    !Array.isArray(record.steps) ||
    record.steps.length < 1 ||
    record.steps.length > 6
  ) {
    return false;
  }
  const steps = record.steps;
  return (
    new Set(steps.map((step) => step.stepId)).size === steps.length &&
    new Set(
      steps.map(
        (step) =>
          `${step.sourceCardInstanceId}\u0000${step.sourceCapabilityId}`,
      ),
    ).size === steps.length &&
    new Set(steps.map((step) => step.sourceCardInstanceId)).size ===
      steps.length &&
    steps.every(
      (step, index) =>
        step !== null &&
        typeof step === "object" &&
        nonblank(step.stepId) &&
        step.order === index &&
        validStepKind(step.kind) &&
        nonblank(step.sourceCardInstanceId) &&
        nonblank(step.sourceCapabilityId),
    )
  );
}

function validStepKind(
  value: CorpPunishRouteQuoteRequest["steps"][number]["kind"],
): boolean {
  return (
    value === "tag" ||
    value === "trace_tag" ||
    value === "meat_damage" ||
    value === "net_damage" ||
    value === "core_damage" ||
    value === "other_punish"
  );
}

function cloneRequest(
  request: CorpPunishRouteQuoteRequest,
): CorpPunishRouteQuoteRequest {
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    matchId: request.matchId,
    side: "corp",
    stateVersion: request.stateVersion,
    timingPoint: request.timingPoint,
    campaignId: request.campaignId,
    routeId: request.routeId,
    steps: request.steps.map((step) => ({ ...step })),
  };
}

function sumActionCost(action: LegalAction, key: "clicks" | "credits"): number {
  return action.costs.reduce((sum, cost) => sum + (cost[key] ?? 0), 0);
}

function nonblank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function encodeParts(parts: readonly string[]): string {
  return `${parts.length};${parts
    .map((part) => `${part.length}:${part}`)
    .join("")}`;
}

function quoteFail(
  code: EngineError["code"],
  message: string,
): CorpPunishRouteQuoteResult {
  return { ok: false, error: { code, message } };
}
