import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";

const quotedThresholds = new Map<string, number>();
const perCounterEffects = new Set([
  "roll_per_counter_trash_installed_card_and_remove_counter_on_success",
  "roll_per_counter_add_bad_publicity",
  "forgo_actions_per_counter",
  "draw_extra_cards_per_counter",
  "incubator_duplicate_virus_counter",
  "ice_strength_reduce_per_counter",
]);

function failure(counterType: string | undefined, reason: string): Error {
  return Object.assign(
    new Error(`Virus-counter effect threshold is unavailable: ${reason}.`),
    {
      code: "runner_virus_counter_effect_threshold_unavailable",
      counterType,
      reason,
    },
  );
}

function positiveCount(value: unknown, counterType: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0)
    throw failure(counterType, "invalid_mechanical_threshold");
  return value;
}

/** Static, public rule fact. Meeting it does not promise a future trigger or payoff. */
export function runnerVirusCounterEffectThreshold(
  counterType: string | undefined,
): number {
  if (!counterType) throw failure(counterType, "counter_type_missing");
  const cached = quotedThresholds.get(counterType);
  if (cached !== undefined) return cached;
  const definitions = CARD_IMPLEMENTATIONS.flatMap((implementation) => {
    const counter = implementation.virusCounter;
    return counter?.counterKind === counterType ? [counter] : [];
  });
  if (definitions.length === 0)
    throw failure(counterType, "mechanical_counter_definition_missing");
  const thresholds = definitions.map((counter) => {
    const effects = [
      counter.startOfCorpTurn,
      counter.startOfRunnerTurn,
      counter.continuousEffect,
      counter.onCorpInstall,
      counter.centralAccessCountModifier,
      counter.accessTrash,
    ];
    const active = effects.flatMap((effect) => {
      if (!effect) return [];
      if ("threshold" in effect)
        return [positiveCount(effect.threshold, counterType)];
      if ("perCounters" in effect)
        return [positiveCount(effect.perCounters, counterType)];
      if ("formula" in effect) {
        if (effect.formula === "per_counter") return [1];
        if (effect.formula === "per_counter_after_first") return [2];
        throw failure(counterType, "unsupported_counter_formula");
      }
      if ("kind" in effect && perCounterEffects.has(effect.kind)) return [1];
      throw failure(counterType, "unsupported_counter_effect");
    });
    if (active.length === 0)
      throw failure(counterType, "counter_effect_missing");
    return Math.min(...active);
  });
  const distinct = [...new Set(thresholds)];
  if (distinct.length !== 1)
    throw failure(counterType, "ambiguous_counter_threshold");
  const threshold = distinct[0]!;
  quotedThresholds.set(counterType, threshold);
  return threshold;
}
