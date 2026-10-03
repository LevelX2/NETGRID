import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { icebreakerAbilitiesForDefinition } from "@netgrid/engine";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  breakerCardBlocksAccessReachability,
  classifyBreakerCoverageFromOntology,
} from "../breaker-ontology-consumer";

export type KnownCorpCardAccessEffectProjection = {
  status: "complete" | "not_applicable" | "unknown";
  sourceDefinitionId: string;
  activationCreditCost?: number;
  corpCanPayActivation?: boolean;
  damage?: {
    type: "net" | "meat" | "core";
    amount: number;
    runnerSurvivable?: boolean;
    runnerHandBufferPreserved?: boolean;
  };
  tags?: number;
  installedProgramTrash?: number;
  runnerCoverageAtRisk?: ("wall" | "code_gate" | "sentry")[];
  installedHardwareTrash?: number;
  relevantVisibleTargetCount?: number;
  threatValue: number;
  evidenceCodes: string[];
};

const DAMAGE_VALUE_PER_POINT = 30;
const TAG_VALUE_PER_POINT = 24;
const VISIBLE_TRASH_VALUE_PER_TARGET = 28;
const REQUIRED_POST_ACCESS_HAND_BUFFER = 1;

export function projectKnownCorpCardAccessEffect(params: {
  input: AiDecisionInput;
  sourceDefinitionId: string;
  sourceCard?: VisibleCard;
}): KnownCorpCardAccessEffectProjection {
  const card = cardSpecPlanningCardByDefinitionId(params.sourceDefinitionId);
  const accessEffects = card?.planning.engine.accessEffects ?? [];
  const installedEffects = accessEffects.filter(
    (effect) =>
      effect.kind === "on_access" &&
      effect.sourceZones.includes("installed") &&
      !effect.ignoreIfAccessedFrom?.includes("installed"),
  );
  if (installedEffects.length === 0) {
    return result(params.sourceDefinitionId, "not_applicable", 0, [
      "known_corp_card_access_effect_not_applicable",
    ]);
  }

  const evidence = ["known_corp_card_access_effect_structured_card_spec"];
  const activation = (effect: (typeof installedEffects)[number]) =>
    effect.installedSourceActivation ??
    (card?.definition.type === "agenda" ? "any_rez_state" : "requires_rezzed");
  if (
    params.sourceCard?.rezzed === undefined &&
    installedEffects.some((effect) => activation(effect) !== "any_rez_state")
  ) {
    return result(params.sourceDefinitionId, "unknown", 0, [
      ...evidence,
      "known_access_effect_source_rez_state_unknown",
    ]);
  }
  const activeEffects = installedEffects.filter((effect) => {
    const requiredState = activation(effect);
    return (
      requiredState === "any_rez_state" ||
      (requiredState === "requires_rezzed" &&
        params.sourceCard?.rezzed === true) ||
      (requiredState === "unrezzed_only" && params.sourceCard?.rezzed === false)
    );
  });
  if (activeEffects.length !== 1) {
    return result(
      params.sourceDefinitionId,
      activeEffects.length === 0 ? "not_applicable" : "unknown",
      0,
      [
        ...evidence,
        activeEffects.length === 0
          ? "known_access_effect_no_active_installed_variant"
          : "known_access_effect_multiple_active_installed_variants",
      ],
    );
  }
  const accessEffect = activeEffects[0]!;
  const corpCredits =
    params.input.side === "corp"
      ? params.input.playerView.own.credits
      : params.input.playerView.opponent.credits;
  const runnerHandCount =
    params.input.side === "runner"
      ? params.input.playerView.own.gripOrHq.length
      : params.input.playerView.opponent.handCount;
  const runnerTags =
    params.input.side === "runner"
      ? params.input.playerView.own.tags
      : params.input.playerView.opponent.tags;
  const runnerRig =
    params.input.side === "runner"
      ? (params.input.playerView.own.rig ?? [])
      : (params.input.playerView.opponent.rig ?? []);
  const counters = Math.max(
    0,
    Math.floor(params.sourceCard?.advancementCounters ?? 0),
  );

  if (accessEffect.condition) {
    if (accessEffect.condition.kind === "runner_is_tagged") {
      if (runnerTags <= 0)
        return result(params.sourceDefinitionId, "not_applicable", 0, [
          ...evidence,
          "known_access_effect_runner_not_tagged",
        ]);
    } else if (accessEffect.condition.kind === "runner_tags_at_least") {
      if (runnerTags < accessEffect.condition.amount)
        return result(params.sourceDefinitionId, "not_applicable", 0, [
          ...evidence,
          "known_access_effect_runner_tag_threshold_not_met",
        ]);
    } else if (
      accessEffect.condition.kind === "source_has_advancement_counters"
    ) {
      if (counters < accessEffect.condition.minimum)
        return result(params.sourceDefinitionId, "not_applicable", 0, [
          ...evidence,
          "known_access_effect_advancement_threshold_not_met",
        ]);
    } else {
      return result(params.sourceDefinitionId, "unknown", 0, [
        ...evidence,
        "known_access_effect_condition_unknown",
      ]);
    }
  }

  let activationCreditCost: number | undefined;
  let corpCanPayActivation: boolean | undefined;
  if (accessEffect.cost?.kind === "corp_may_pay_credits") {
    activationCreditCost = accessEffect.cost.amount;
    corpCanPayActivation = corpCredits >= activationCreditCost;
    evidence.push(
      `known_access_effect_activation_credit_cost:${activationCreditCost}`,
      `known_access_effect_corp_can_pay:${corpCanPayActivation}`,
    );
    if (!corpCanPayActivation) {
      return {
        ...result(params.sourceDefinitionId, "not_applicable", 0, evidence),
        activationCreditCost,
        corpCanPayActivation,
      };
    }
  } else if (accessEffect.cost) {
    return result(params.sourceDefinitionId, "unknown", 0, [
      ...evidence,
      "known_access_effect_noncredit_cost_state_unknown",
    ]);
  }

  let damage: KnownCorpCardAccessEffectProjection["damage"];
  let tags = 0;
  let installedProgramTrash = 0;
  let installedHardwareTrash = 0;
  let relevantVisibleTargetCount = 0;
  const coverageAtRisk = new Set<"wall" | "code_gate" | "sentry">();
  let threatValue = 0;
  let unsupported = false;
  for (const effect of accessEffect.effects) {
    if (effect.kind === "damage") {
      damage = damageProjection(
        params.input,
        effect.damageType,
        effect.amount,
        runnerHandCount,
      );
      threatValue += effect.amount * DAMAGE_VALUE_PER_POINT;
      evidence.push(
        `known_access_effect_damage:${effect.damageType}:${effect.amount}`,
      );
      continue;
    }
    if (effect.kind === "damage_from_source_advancement_counters") {
      const amount = Math.max(
        effect.minimumAmount,
        counters * effect.amountPerCounter,
      );
      damage = damageProjection(
        params.input,
        effect.damageType,
        amount,
        runnerHandCount,
      );
      threatValue += amount * DAMAGE_VALUE_PER_POINT;
      evidence.push(
        `known_access_effect_advancement_damage:${effect.damageType}:${amount}`,
      );
      continue;
    }
    if (effect.kind === "add_tags") {
      tags += effect.amount;
      threatValue += effect.amount * TAG_VALUE_PER_POINT;
      evidence.push(`known_access_effect_tags:${effect.amount}`);
      continue;
    }
    if (effect.kind === "trash_installed_runner_cards") {
      const targets = runnerRig.filter((card) =>
        effect.target === "daemon"
          ? card.subtypes?.includes("daemon") === true
          : card.type === effect.target,
      );
      const targetCount = targets.length;
      const amount =
        typeof effect.amount === "number" ? effect.amount : counters;
      const materialTargets = Math.min(amount, targetCount);
      relevantVisibleTargetCount += targetCount;
      if (effect.target === "hardware")
        installedHardwareTrash += materialTargets;
      else {
        installedProgramTrash += materialTargets;
        for (const kind of threatenedInstalledCoverage(
          runnerRig,
          targets,
          materialTargets,
        ))
          coverageAtRisk.add(kind);
      }
      threatValue += materialTargets * VISIBLE_TRASH_VALUE_PER_TARGET;
      evidence.push(
        `known_access_effect_visible_${effect.target}_targets:${targetCount}`,
      );
      continue;
    }
    if (effect.kind === "trash_installed_runner_hardware_and_programs") {
      const hardwareCount = runnerRig.filter(
        (card) => card.type === "hardware",
      ).length;
      const programCount = runnerRig.filter(
        (card) => card.type === "program",
      ).length;
      installedHardwareTrash += hardwareCount;
      const programTrash = Math.min(effect.programAmount, programCount);
      installedProgramTrash += programTrash;
      for (const kind of threatenedInstalledCoverage(
        runnerRig,
        runnerRig.filter((card) => card.type === "program"),
        programTrash,
      ))
        coverageAtRisk.add(kind);
      relevantVisibleTargetCount += hardwareCount + programCount;
      threatValue +=
        (installedHardwareTrash + installedProgramTrash) *
        VISIBLE_TRASH_VALUE_PER_TARGET;
      evidence.push(
        `known_access_effect_visible_hardware_targets:${hardwareCount}`,
        `known_access_effect_visible_program_targets:${programCount}`,
      );
      continue;
    }
    unsupported = true;
    evidence.push(`known_access_effect_unsupported:${effect.kind}`);
  }

  if (
    installedProgramTrash > 0 &&
    runnerRig.some(
      (card) =>
        card.type === "program" &&
        (!card.known ||
          !card.definitionId ||
          !CARD_DEFINITIONS_BY_ID[card.definitionId]),
    )
  ) {
    unsupported = true;
    evidence.push("known_access_effect_installed_program_definition_unknown");
  }
  if (damage?.runnerSurvivable === false) {
    threatValue += DAMAGE_VALUE_PER_POINT * 4;
    evidence.push("known_access_effect_damage_lethal");
  } else if (damage?.runnerHandBufferPreserved === false) {
    threatValue += DAMAGE_VALUE_PER_POINT * 2;
    evidence.push("known_access_effect_damage_breaks_hand_buffer");
  }
  return {
    status: unsupported ? "unknown" : "complete",
    sourceDefinitionId: params.sourceDefinitionId,
    ...(activationCreditCost !== undefined ? { activationCreditCost } : {}),
    ...(corpCanPayActivation !== undefined ? { corpCanPayActivation } : {}),
    ...(damage ? { damage } : {}),
    ...(tags > 0 ? { tags } : {}),
    ...(installedProgramTrash > 0 ? { installedProgramTrash } : {}),
    ...(installedHardwareTrash > 0 ? { installedHardwareTrash } : {}),
    ...(coverageAtRisk.size > 0
      ? { runnerCoverageAtRisk: [...coverageAtRisk] }
      : {}),
    ...(relevantVisibleTargetCount > 0 ||
    accessEffect.effects.some(
      (effect) =>
        effect.kind === "trash_installed_runner_cards" ||
        effect.kind === "trash_installed_runner_hardware_and_programs",
    )
      ? { relevantVisibleTargetCount }
      : {}),
    threatValue,
    evidenceCodes: evidence,
  };
}

function damageProjection(
  input: AiDecisionInput,
  type: "net" | "meat" | "core",
  amount: number,
  runnerHandCount: number,
): NonNullable<KnownCorpCardAccessEffectProjection["damage"]> {
  const visiblePrevention =
    input.side === "runner" && type !== "meat"
      ? Math.max(
          0,
          input.playerView.own.freeNetOrCoreDamagePreventionRemaining ?? 0,
        )
      : undefined;
  const survivalCapacity = runnerHandCount + (visiblePrevention ?? 0);
  return {
    type,
    amount,
    ...(input.side === "runner"
      ? {
          runnerSurvivable: amount <= survivalCapacity,
          runnerHandBufferPreserved:
            survivalCapacity - amount >= REQUIRED_POST_ACCESS_HAND_BUFFER,
        }
      : {
          runnerSurvivable: amount <= runnerHandCount,
          runnerHandBufferPreserved:
            runnerHandCount - amount >= REQUIRED_POST_ACCESS_HAND_BUFFER,
        }),
  };
}

function result(
  sourceDefinitionId: string,
  status: KnownCorpCardAccessEffectProjection["status"],
  threatValue: number,
  evidenceCodes: string[],
): KnownCorpCardAccessEffectProjection {
  return { status, sourceDefinitionId, threatValue, evidenceCodes };
}

/** Risk projection at the public canonical base price; never a future LegalAction. */
export function projectKnownCorpCardProspectiveAccessEffect(params: {
  input: AiDecisionInput;
  sourceDefinitionId: string;
  sourceCard?: VisibleCard;
}): KnownCorpCardAccessEffectProjection {
  const current = projectKnownCorpCardAccessEffect(params);
  if (params.input.side !== "runner" || params.sourceCard?.rezzed !== false)
    return current;
  const card = cardSpecPlanningCardByDefinitionId(params.sourceDefinitionId);
  if (
    !card ||
    (card.definition.type !== "asset" && card.definition.type !== "upgrade") ||
    !card.planning.engine.accessEffects?.some(
      (effect) =>
        effect.kind === "on_access" &&
        effect.sourceZones.includes("installed") &&
        !effect.ignoreIfAccessedFrom?.includes("installed") &&
        (effect.installedSourceActivation ?? "requires_rezzed") ===
          "requires_rezzed",
    )
  )
    return current;
  const cost = card.definition.rezCost;
  if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0)
    return result(params.sourceDefinitionId, "unknown", 0, [
      "known_access_effect_prospective_rez_base_cost_unavailable",
    ]);
  const credits = params.input.playerView.opponent.credits;
  if (credits < cost) return current;
  const prospective = projectKnownCorpCardAccessEffect({
    ...params,
    input: {
      ...params.input,
      playerView: {
        ...params.input.playerView,
        opponent: {
          ...params.input.playerView.opponent,
          credits: credits - cost,
        },
      },
    },
    sourceCard: { ...params.sourceCard, rezzed: true },
  });
  if (
    prospective.status !== "unknown" &&
    prospective.threatValue <= current.threatValue
  )
    return current;
  return {
    ...prospective,
    evidenceCodes: [
      ...prospective.evidenceCodes,
      "known_access_effect_prospective_rez_public_base_price_risk",
      "known_access_effect_prospective_rez_cost:" + cost,
      "known_access_effect_prospective_post_rez_credits:" + (credits - cost),
      "known_access_effect_future_engine_quote_not_claimed",
    ],
  };
}

function threatenedInstalledCoverage(
  rig: readonly VisibleCard[],
  targets: readonly VisibleCard[],
  trashCount: number,
): ("wall" | "code_gate" | "sentry")[] {
  if (trashCount <= 0) return [];
  const targetIds = new Set(targets.map((card) => card.instanceId));
  const providers = rig
    .filter(
      (card) =>
        card.known &&
        card.rezzed === true &&
        card.type === "program" &&
        !breakerCardBlocksAccessReachability(card.definitionId),
    )
    .map((card) => ({ card, coverage: installedCoverage(card) }));
  return (["wall", "code_gate", "sentry"] as const).filter((kind) => {
    const current = providers.filter(
      (p) => p.coverage.includes(kind) || p.coverage.includes("universal"),
    );
    return (
      current.length > 0 &&
      current.length <= trashCount &&
      current.every((p) => targetIds.has(p.card.instanceId))
    );
  });
}
function installedCoverage(card: VisibleCard): string[] {
  const definition = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
  if (!definition) return [];
  const abilities = icebreakerAbilitiesForDefinition(definition);
  if (
    !abilities.some(
      (ability) =>
        ability.type === "break_subroutine" &&
        ability.selectedIceSubtypeFromBreaker,
    )
  )
    return classifyBreakerCoverageFromOntology(card.definitionId);
  return abilities.flatMap((ability) =>
    ability.type !== "break_subroutine"
      ? []
      : ability.selectedIceSubtypeFromBreaker
        ? card.selectedSubtype
          ? [card.selectedSubtype]
          : []
        : [ability.iceSubtype, ...(ability.iceSubtypes ?? [])].filter(
            (subtype): subtype is string => typeof subtype === "string",
          ),
  );
}
