import type {
  AiHintEffectTargetProfile,
  AiHintStructuredEffect,
  AiHintTargetProfileV1,
} from "./hint-ontology";

type HintWithStructuredEffects = {
  readonly effects?: readonly AiHintStructuredEffect[];
};

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
          effect.target === "non_noisy_icebreaker"),
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
