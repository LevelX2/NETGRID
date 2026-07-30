import { type AiDecisionInput } from "@netgrid/shared";

import { matchingBreakerRoleNeedles } from "./breaker-role-match";
import { boundedSelectionCount } from "./choice-option";
import { rolesMatch } from "./role-match";
import { visibleCardCoversRequiredCoverage } from "./runner-search-coverage-need";
import type { RequiredCapabilityKind } from "../plans/tactical-plan-types";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

export type SearchChoiceFeatureSnapshot = {
  readonly credits: number;
  readonly memoryRemaining: number;
  readonly rigRoles: ReadonlySet<string>;
  readonly rigDefinitionIds: ReadonlySet<string>;
  readonly gripDefinitionCounts?: ReadonlyMap<string, number>;
};

export type SearchChoiceScoringContext = {
  readonly features: SearchChoiceFeatureSnapshot;
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
  readonly requiredCoverage?: RequiredCapabilityKind;
  readonly preferredServerId?: string;
  readonly preferredCardInstanceId?: string;
};

export function selectedSearchChoiceOptionIds(
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
  context: SearchChoiceScoringContext,
): string[] | undefined {
  if (!isSearchChoice(choice)) return undefined;
  const count = boundedSelectionCount(
    choice.minSelections,
    choice.maxSelections,
    selectableOptions.length,
  );
  if (count <= 0) return [];
  const hasDirectCoverageAnswer = Boolean(
    context.requiredCoverage &&
    selectableOptions.some(
      (option) =>
        option.card &&
        visibleCardCoversRequiredCoverage(
          option.card,
          context.requiredCoverage,
          context.rolesForCardId,
        ),
    ),
  );
  const ranked = rankSearchChoiceOptions(
    choice,
    selectableOptions,
    context,
    hasDirectCoverageAnswer,
  );
  const preferredOption = context.preferredCardInstanceId
    ? selectableOptions.find(
        (option) => option.card?.instanceId === context.preferredCardInstanceId,
      )
    : undefined;
  if (preferredOption) {
    return [
      preferredOption,
      ...ranked.filter((option) => option.id !== preferredOption.id),
    ]
      .slice(0, count)
      .map((option) => option.id);
  }
  if (!isTakeOneArrangeRestChoice(choice)) {
    return ranked.slice(0, count).map((option) => option.id);
  }
  const firstPick = ranked[0];
  if (!firstPick) return [];
  const remainingContext = projectFirstPickIntoGrip(context, firstPick);
  const remaining = rankSearchChoiceOptions(
    choice,
    selectableOptions.filter((option) => option.id !== firstPick.id),
    remainingContext,
    hasDirectCoverageAnswer,
  );
  return [firstPick, ...remaining].slice(0, count).map((option) => option.id);
}

export function isSearchChoice(choice: PendingChoice): boolean {
  return Boolean(
    choice.cardSearchPresentation ||
    choice.stackSearchResolution ||
    choiceSourceHasSearchToken(choice.source),
  );
}

function choiceSourceHasSearchToken(source: string | undefined): boolean {
  if (!source) return false;
  const tokens = source
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
  const tokenSet = new Set(tokens);
  return tokenSet.has("search") || tokenSet.has("stack");
}

function isTakeOneArrangeRestChoice(choice: PendingChoice): boolean {
  return (
    choice.source.startsWith(
      "v1922.runner_stack_top5_choose_one_arrange_rest",
    ) ||
    choice.source.startsWith("p3_37.runner_stack_top5_choose_one_arrange_rest")
  );
}

function rankSearchChoiceOptions(
  choice: PendingChoice,
  options: readonly PendingChoiceOption[],
  context: SearchChoiceScoringContext,
  hasDirectCoverageAnswer: boolean,
): PendingChoiceOption[] {
  return options.slice().sort((left, right) => {
    const scoreDelta =
      scoreSearchChoiceOption(choice, right, context, hasDirectCoverageAnswer) -
      scoreSearchChoiceOption(choice, left, context, hasDirectCoverageAnswer);
    return (
      scoreDelta ||
      left.label.localeCompare(right.label, "de") ||
      left.id.localeCompare(right.id)
    );
  });
}

function projectFirstPickIntoGrip(
  context: SearchChoiceScoringContext,
  firstPick: PendingChoiceOption,
): SearchChoiceScoringContext {
  const definitionId = firstPick.card?.definitionId;
  if (!definitionId) return context;
  const gripDefinitionCounts = new Map(
    context.features.gripDefinitionCounts ?? [],
  );
  gripDefinitionCounts.set(
    definitionId,
    (gripDefinitionCounts.get(definitionId) ?? 0) + 1,
  );
  return {
    ...context,
    features: { ...context.features, gripDefinitionCounts },
  };
}

function scoreSearchChoiceOption(
  choice: PendingChoice,
  option: PendingChoiceOption,
  context: SearchChoiceScoringContext,
  hasDirectCoverageAnswer: boolean,
): number {
  const card = option.card;
  if (!card) return 0;
  const destination =
    choice.cardSearchPresentation?.destination ??
    choice.stackSearchResolution?.destination ??
    (isTakeOneArrangeRestChoice(choice) ? "grip" : undefined);
  const roles = context.rolesForCardId(card.definitionId);
  const subtypes = (card.subtypes ?? []).map((subtype) =>
    subtype.toLowerCase(),
  );
  const features = context.features;
  let score = 100;
  const coversRequiredCoverage = visibleCardCoversRequiredCoverage(
    card,
    context.requiredCoverage,
    context.rolesForCardId,
  );

  if (card.type === "program")
    score += destination === "install_program" ? 1000 : 520;
  else if (destination === "install_program") score -= 600;

  if (context.requiredCoverage) {
    if (coversRequiredCoverage) {
      score += 1450;
    } else if (hasDirectCoverageAnswer && card.type === "program") {
      score -= 650;
    }
  }

  if (destination === "install_program") {
    const memoryCost = card.memoryCost ?? 0;
    score +=
      memoryCost <= features.memoryRemaining
        ? 180
        : -260 - (memoryCost - features.memoryRemaining) * 40;
    const installCost = visibleSearchCardCreditCost(card);
    if (installCost !== undefined) {
      score +=
        installCost <= features.credits
          ? 110
          : -160 - (installCost - features.credits) * 30;
    }
  }
  if (destination === "grip" && card.type === "program") {
    const memoryCost = card.memoryCost ?? 0;
    score +=
      memoryCost <= features.memoryRemaining
        ? 90
        : -220 - (memoryCost - features.memoryRemaining) * 40;
    const installCost = visibleSearchCardCreditCost(card);
    if (installCost !== undefined) {
      score +=
        installCost <= features.credits
          ? 100
          : -120 - (installCost - features.credits) * 30;
    }
  }
  if (destination === "grip" && card.type !== "program") {
    const playOrInstallCost = visibleSearchCardCreditCost(card);
    if (playOrInstallCost !== undefined) {
      score +=
        playOrInstallCost <= features.credits
          ? 80
          : -100 - (playOrInstallCost - features.credits) * 25;
    }
  }

  if (
    context.preferredServerId === "hq" &&
    rolesMatch(roles, ["pressure_hq"])
  ) {
    score += 350;
  } else if (
    context.preferredServerId === "rd" &&
    rolesMatch(roles, ["pressure_rnd"])
  ) {
    score += 350;
  }

  const breakerRoleNeedles = matchingBreakerRoleNeedles(roles);
  if (
    breakerRoleNeedles.length > 0 ||
    subtypes.some((subtype) =>
      ["icebreaker", "breaker", "decoder", "fracter", "killer"].includes(
        subtype,
      ),
    )
  ) {
    score += 220;
    const rigRoles = [...features.rigRoles];
    for (const roleNeedle of breakerRoleNeedles)
      score += rolesMatch(rigRoles, [roleNeedle]) ? -70 : 180;
    if (features.rigRoles.size === 0) score += 120;
  }

  if (rolesMatch(roles, ["memory"]) || (card.memoryLimitBonus ?? 0) > 0)
    score += features.memoryRemaining <= 1 ? 170 : 60;
  if (rolesMatch(roles, ["economy"])) score += features.credits < 4 ? 90 : 25;
  if (card.definitionId) {
    const gripCopies =
      features.gripDefinitionCounts?.get(card.definitionId) ?? 0;
    if (features.rigDefinitionIds.has(card.definitionId)) score -= 360;
    if (gripCopies > 0) score -= 520 + (gripCopies - 1) * 220;
  }
  score -= Math.max(0, card.memoryCost ?? 0) * 5;
  const visibleCreditCost = visibleSearchCardCreditCost(card);
  if (visibleCreditCost !== undefined) score -= visibleCreditCost * 2;
  return score;
}

function visibleSearchCardCreditCost(
  card: NonNullable<PendingChoiceOption["card"]>,
): number | undefined {
  if (card.type === "event" || card.type === "operation") {
    const playCost = card.playCost;
    if (playCost === undefined) {
      throw new Error(
        "Invalid visible play-cost projection for a known event or operation search option.",
      );
    }
    if (playCost.kind === "fixed") {
      if (Number.isInteger(playCost.credits) && playCost.credits >= 0) {
        return playCost.credits;
      }
      throw new Error(
        "Invalid visible play-cost projection for a known event or operation search option.",
      );
    }
    if (
      playCost.kind !== "variable_x" ||
      !Number.isInteger(playCost.minimumX) ||
      playCost.minimumX < 1 ||
      !Number.isInteger(playCost.creditsPerX) ||
      playCost.creditsPerX < 1 ||
      playCost.maximumX?.kind !== "context"
    ) {
      throw new Error(
        "Invalid visible play-cost projection for a known event or operation search option.",
      );
    }
    return playCost.minimumX * playCost.creditsPerX;
  }
  return Number.isInteger(card.installCost) && (card.installCost ?? -1) >= 0
    ? card.installCost
    : undefined;
}
