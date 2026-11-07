import type {
  AiHintEffectTargetProfile,
  AiHintStructuredEffect,
  AiHintTargetProfileV1,
} from "./hint-ontology";

type HintWithStructuredEffects = {
  readonly effects?: readonly AiHintStructuredEffect[];
};

export function runnerEffectsProvideCorpForcedDraw(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects?.some(
      (effect) =>
        effect.kind === "persistent_counter_effect" &&
        effect.scope === "corp" &&
        effect.timing === "start_of_turn" &&
        effect.resource === "cards" &&
        effect.target === "virus.corp_forced_draw_per_counter" &&
        (effect.amount ?? 0) > 0,
    ) ?? false
  );
}

export function runnerEffectsProvideEncounterIceDerez(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return effects?.some((effect) =>
    effect.kind === "rez" &&
    effect.scope === "ice" &&
    effect.target === "derez" &&
    effect.timing === "encounter_resolution",
  ) ?? false;
}

export function runnerEffectsOnlyTaxCorpIceInstalls(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects !== undefined &&
    effects.length > 0 &&
    effects.every(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "corp" &&
        effect.timing === "persistent" &&
        effect.resource === "credits" &&
        effect.target === "ice.install_cost_increase" &&
        (effect.amount ?? 0) > 0,
    )
  );
}

export function runnerEffectsProvideAccessTriggeredInstalledExpose(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return effects?.some((effect) =>
    effect.kind === "expose_info" &&
    effect.scope === "installed_card" &&
    effect.timing === "on_access" &&
    effect.target === "installed_corp_cards",
  ) ?? false;
}

export function runnerEffectsProvidePostBreakIceTrash(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects?.some(
      (effect) =>
        effect.kind === "ice_trash" &&
        effect.target === "trash_fully_broken_passed_ice" &&
        effect.timing === "encounter_resolution",
    ) ?? false
  );
}

const DAMAGE_PREVENTION_EFFECT_KINDS = new Set<AiHintStructuredEffect["kind"]>([
  "damage_prevention",
  "flatline_prevention",
  "meat_damage_prevention",
  "net_damage_prevention",
  "brain_damage_prevention",
]);

export function runnerEffectsProvideExposeInformation(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return effects?.some((effect) => effect.kind === "expose_info") ?? false;
}

export function runnerEffectsProvideTopTrashRecovery(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects?.some(
      (effect) =>
        effect.kind === "card_recovery" &&
        effect.scope === "heap" &&
        effect.target === "move_top_trash_to_grip",
    ) ?? false
  );
}

export function runnerEffectsProvideHeapRecovery(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return effects?.some((effect) =>
    effect.kind === "card_recovery" &&
    effect.scope === "heap" &&
    (effect.target === "move_top_trash_to_grip" ||
      effect.target === "search_trash_to_grip"),
  ) ?? false;
}

export function runnerEffectsProvideSearch(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return effects?.some((effect) => effect.kind === "search") ?? false;
}

export function runnerTargetProfilesProvideSearch(
  targetProfiles:
    | readonly (AiHintEffectTargetProfile | AiHintTargetProfileV1)[]
    | undefined,
): boolean {
  return (
    targetProfiles?.some(
      (targetProfile) =>
        "kind" in targetProfile &&
        targetProfile.kind === "search_install_target",
    ) ?? false
  );
}

export function runnerEffectsProvideMultiaccess(
  effects: readonly AiHintStructuredEffect[] | undefined,
  serverId?: "hq" | "rd" | "archives" | "remote",
): boolean {
  const canonicalScope = serverId === "rd" ? "rnd" : serverId;
  return (
    effects?.some(
      (effect) =>
        effect.kind === "multiaccess" &&
        (canonicalScope === undefined || effect.scope === canonicalScope),
    ) ?? false
  );
}

export function runnerEffectsProvideNonNoisyBreakerCredits(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects?.some(
      (effect) =>
        effect.kind === "recurring_economy" &&
        effect.resource === "credits" &&
        effect.target === "non_noisy_icebreaker",
    ) ?? false
  );
}

export function runnerEffectsProvideBreakerCredits(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects?.some(
      (effect) =>
        effect.kind === "recurring_economy" &&
        effect.resource === "credits" &&
        (effect.target === "icebreaker" ||
          effect.target === "non_noisy_icebreaker" ||
          effect.target === "killer" ||
          effect.target === "fracter" ||
          effect.target === "decoder"),
    ) ?? false
  );
}

export function runnerEffectsProvideDamagePrevention(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects?.some((effect) =>
      DAMAGE_PREVENTION_EFFECT_KINDS.has(effect.kind),
    ) ?? false
  );
}

export type RunnerPreventableDamageType = "net" | "meat" | "core";

export function runnerEffectsDamagePreventionTypes(
  effects: readonly AiHintStructuredEffect[] | undefined,
): RunnerPreventableDamageType[] {
  const types = new Set<RunnerPreventableDamageType>();
  for (const effect of effects ?? []) {
    if (!DAMAGE_PREVENTION_EFFECT_KINDS.has(effect.kind)) continue;
    if (
      effect.kind === "flatline_prevention" ||
      effect.target === "run.damage_prevention_pool"
    ) {
      types.add("net");
      types.add("meat");
      types.add("core");
    } else if (effect.target === "prevent.core_and_net_damage") {
      types.add("core");
      types.add("net");
    } else if (
      effect.kind === "meat_damage_prevention" ||
      effect.target === "prevent.meat_damage" ||
      effect.target === "meat_damage"
    ) {
      types.add("meat");
    } else if (
      effect.kind === "net_damage_prevention" ||
      effect.target === "prevent.net_damage" ||
      effect.target === "ap_net_damage_reduction"
    ) {
      types.add("net");
    } else if (
      effect.kind === "brain_damage_prevention" ||
      effect.target === "prevent.core_damage"
    ) {
      types.add("core");
    } else {
      throw new Error(
        `runner_damage_prevention_scope_missing:${effect.kind}:${effect.target}`,
      );
    }
  }
  return [...types].sort();
}

export function runnerEffectsProvideProgramTrashPrevention(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return (
    effects?.some(
      (effect) =>
        effect.kind === "program_trash_prevention" &&
        effect.scope === "runner" &&
        effect.target === "installed_program",
    ) ?? false
  );
}

export function runnerEffectsProvideTagPrevention(
  effects: readonly AiHintStructuredEffect[] | undefined,
): boolean {
  return effects?.some((effect) => effect.kind === "tag_prevention") ?? false;
}

export function runnerHintProvidesExposeInformation(
  hint: HintWithStructuredEffects | undefined,
): boolean {
  return runnerEffectsProvideExposeInformation(hint?.effects);
}

export function runnerHintProvidesTopTrashRecovery(
  hint: HintWithStructuredEffects | undefined,
): boolean {
  return runnerEffectsProvideTopTrashRecovery(hint?.effects);
}

export function runnerHintProvidesSearch(
  hint: HintWithStructuredEffects | undefined,
): boolean {
  return runnerEffectsProvideSearch(hint?.effects);
}

export function runnerHintProvidesMultiaccess(
  hint: HintWithStructuredEffects | undefined,
  serverId?: "hq" | "rd" | "archives" | "remote",
): boolean {
  return runnerEffectsProvideMultiaccess(hint?.effects, serverId);
}

export function runnerHintProvidesNonNoisyBreakerCredits(
  hint: HintWithStructuredEffects | undefined,
): boolean {
  return runnerEffectsProvideNonNoisyBreakerCredits(hint?.effects);
}

export function runnerHintProvidesDamagePrevention(
  hint: HintWithStructuredEffects | undefined,
): boolean {
  return runnerEffectsProvideDamagePrevention(hint?.effects);
}

export function runnerHintProvidesTagPrevention(
  hint: HintWithStructuredEffects | undefined,
): boolean {
  return runnerEffectsProvideTagPrevention(hint?.effects);
}
