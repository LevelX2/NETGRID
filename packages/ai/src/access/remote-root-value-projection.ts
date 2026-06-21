import type { VisibleCard } from "@netgrid/shared";

export type RemoteRootValueKind =
  | "finite_economy_pool"
  | "recurring_economy"
  | "campaign_drip"
  | "persistent_engine"
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
  }[];
  valueHints?: Record<string, number | undefined>;
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
  const valueScore = Math.max(
    0,
    ...Object.values(input.valueHints ?? {}).filter(
      (value): value is number => typeof value === "number",
    ),
  );
  const hasFiniteEconomyEffect = effects.some(
    (effect) =>
      effect.kind === "economy" &&
      effect.scope === "corp" &&
      effect.finite === true,
  );
  const hasRecurringEconomyEffect = effects.some(
    (effect) =>
      effect.kind === "economy" &&
      effect.scope === "corp" &&
      effect.resource === "credit" &&
      effect.finite !== true,
  );
  const roleText = roles.join(" ");
  const kind = remoteRootValueKind({
    hasBitCounter: counters.bit !== undefined,
    hasRecurringCreditCounter: counters.recurring_credit !== undefined,
    hasFiniteEconomyEffect,
    hasRecurringEconomyEffect,
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
      ...roles.slice(0, 6).map((role) => `remote_root_value_role:${role}`),
    ],
  };
}

function remoteRootValueKind(params: {
  hasBitCounter: boolean;
  hasRecurringCreditCounter: boolean;
  hasFiniteEconomyEffect: boolean;
  hasRecurringEconomyEffect: boolean;
  roleText: string;
}): RemoteRootValueKind {
  if (
    params.hasBitCounter &&
    (params.hasFiniteEconomyEffect ||
      /campaign|finite|economy_pool|counter_bank/.test(params.roleText))
  ) {
    return "finite_economy_pool";
  }
  if (params.hasRecurringCreditCounter || params.hasRecurringEconomyEffect) {
    return "recurring_economy";
  }
  if (/campaign|drip/.test(params.roleText)) return "campaign_drip";
  if (/scoring_protection|agenda_protection/.test(params.roleText)) {
    return "scoring_protection";
  }
  if (/ambush/.test(params.roleText)) return "ambush";
  if (/engine|persistent/.test(params.roleText)) return "persistent_engine";
  if (params.hasBitCounter) return "non_economy_counter";
  return "unknown";
}
