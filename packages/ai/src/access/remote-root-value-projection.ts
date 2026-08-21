import type { VisibleCard } from "@netgrid/shared";
import type { AiRuntimeValueHints } from "../ai-hints";

export type RemoteRootValueKind =
  | "finite_economy_pool"
  | "recurring_economy"
  | "campaign_drip"
  | "persistent_engine"
  | "score_acceleration"
  | "scoring_protection"
  | "ambush"
  | "non_economy_counter"
  | "unknown";

export type RemoteRootValueProjectionInput = {
  definitionId: string;
  visibleCard?: VisibleCard;
  roles?: readonly string[];
  effects?: readonly {
    finite?: boolean;
    kind?: string;
    resource?: string;
    scope?: string;
    timing?: string;
    target?: string;
  }[];
  functionSignals?: readonly string[];
  lineSupport?: readonly string[];
  strategicRoles?: readonly string[];
  valueHints?: AiRuntimeValueHints;
};

export type RemoteRootValueProjection = {
  kind: RemoteRootValueKind;
  valueScore: number;
  finitePoolValueRemaining: number;
  finitePoolDepleted: boolean;
  evidence: string[];
};

export function projectRemoteRootValue(
  input: RemoteRootValueProjectionInput,
): RemoteRootValueProjection {
  const roles = input.roles ?? [];
  const effects = input.effects ?? [];
  const counters = input.visibleCard?.counters ?? {};
  const scoreAcceleration = hasStructuredScoreAcceleration(input);
  const valueScore = Math.max(
    0,
    input.valueHints?.remoteRootValue ?? 0,
    scoreAcceleration ? 4 : 0,
  );
  const hasFiniteEconomyEffect = effects.some(
    (effect) =>
      (effect.kind === "economy" || effect.kind === "finite_economy_pool") &&
      effect.scope === "corp" &&
      effect.finite === true,
  );
  const hasRecurringEconomyEffect = effects.some(
    (effect) =>
      (effect.kind === "economy" || effect.kind === "recurring_economy") &&
      effect.scope === "corp" &&
      (effect.resource === "credit" || effect.resource === "credits") &&
      effect.finite !== true,
  );
  const roleText = roles.join(" ");
  const kind = remoteRootValueKind({
    hasBitCounter: counters.bit !== undefined,
    hasRecurringCreditCounter: counters.recurring_credit !== undefined,
    hasFiniteEconomyEffect,
    hasRecurringEconomyEffect,
    scoreAcceleration,
    roleText,
  });
  const finitePoolValueRemaining =
    kind === "finite_economy_pool" ? Math.max(0, counters.bit ?? 0) : 0;

  return {
    kind,
    valueScore,
    finitePoolValueRemaining,
    finitePoolDepleted:
      kind === "finite_economy_pool" && finitePoolValueRemaining <= 0,
    evidence: [
      `remote_root_value_kind:${kind}`,
      `remote_root_value_score:${valueScore}`,
      `remote_root_value_finite_pool_remaining:${finitePoolValueRemaining}`,
      `remote_root_value_finite_pool_depleted:${
        kind === "finite_economy_pool" && finitePoolValueRemaining <= 0
      }`,
      `remote_root_value_has_bit_counter:${counters.bit !== undefined}`,
      `remote_root_value_has_recurring_credit_counter:${
        counters.recurring_credit !== undefined
      }`,
      `remote_root_value_score_acceleration:${scoreAcceleration}`,
      ...roles.slice(0, 6).map((role) => `remote_root_value_role:${role}`),
    ],
  };
}

function remoteRootValueKind(params: {
  hasBitCounter: boolean;
  hasRecurringCreditCounter: boolean;
  hasFiniteEconomyEffect: boolean;
  hasRecurringEconomyEffect: boolean;
  scoreAcceleration: boolean;
  roleText: string;
}): RemoteRootValueKind {
  const roleTokens = tokensForRoleText(params.roleText);
  if (params.scoreAcceleration) return "score_acceleration";
  if (
    params.hasBitCounter &&
    (params.hasFiniteEconomyEffect ||
      tokensIncludeAny(roleTokens, ["campaign", "finite"]) ||
      tokensIncludePhrase(roleTokens, ["economy", "pool"]) ||
      tokensIncludePhrase(roleTokens, ["counter", "bank"]))
  ) {
    return "finite_economy_pool";
  }
  if (params.hasRecurringCreditCounter || params.hasRecurringEconomyEffect) {
    return "recurring_economy";
  }
  if (tokensIncludeAny(roleTokens, ["campaign", "drip"])) {
    return "campaign_drip";
  }
  if (
    tokensIncludePhrase(roleTokens, ["scoring", "protection"]) ||
    tokensIncludePhrase(roleTokens, ["agenda", "protection"])
  ) {
    return "scoring_protection";
  }
  if (tokensIncludeAny(roleTokens, ["ambush"])) return "ambush";
  if (tokensIncludeAny(roleTokens, ["engine", "persistent"])) {
    return "persistent_engine";
  }
  if (params.hasBitCounter) return "non_economy_counter";
  return "unknown";
}

function hasStructuredScoreAcceleration(
  input: RemoteRootValueProjectionInput,
): boolean {
  const functionSignals = new Set(input.functionSignals ?? []);
  const lineSupport = new Set(input.lineSupport ?? []);
  const strategicRoles = new Set(input.strategicRoles ?? []);
  return (
    functionSignals.has("score.fast_advance_support") ||
    functionSignals.has("advance.counter_manipulation") ||
    lineSupport.has("corp.fast_advance") ||
    strategicRoles.has("scoring_tool") ||
    (input.effects ?? []).some(
      (effect) =>
        effect.kind === "score_acceleration" ||
        (effect.kind === "advance" &&
          effect.resource === "advancement_counters" &&
          effect.target === "advance.counter_transfer"),
    )
  );
}

function tokensForRoleText(value: string): string[] {
  return value
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function tokensIncludeAny(
  tokens: readonly string[],
  accepted: readonly string[],
): boolean {
  const acceptedSet = new Set(accepted);
  return tokens.some((token) => acceptedSet.has(token));
}

function tokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((token, index) =>
    phrase.every(
      (phraseToken, offset) => tokens[index + offset] === phraseToken,
    ),
  );
}
