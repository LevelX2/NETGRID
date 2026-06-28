import { type AiDecisionInput } from "@netgrid/shared";

import { matchingBreakerRoleNeedles } from "./breaker-role-match";
import { boundedSelectionCount } from "./choice-option";
import { rolesMatch } from "./role-match";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
type PendingChoiceOption = PendingChoice["options"][number];

export type SearchChoiceFeatureSnapshot = {
  readonly credits: number;
  readonly memoryRemaining: number;
  readonly rigRoles: ReadonlySet<string>;
  readonly rigDefinitionIds: ReadonlySet<string>;
};

export type SearchChoiceScoringContext = {
  readonly features: SearchChoiceFeatureSnapshot;
  readonly rolesForCardId: (cardId: string | undefined) => readonly string[];
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
  return selectableOptions
    .slice()
    .sort((left, right) => {
      const scoreDelta =
        scoreSearchChoiceOption(choice, right, context) -
        scoreSearchChoiceOption(choice, left, context);
      return (
        scoreDelta ||
        left.label.localeCompare(right.label, "de") ||
        left.id.localeCompare(right.id)
      );
    })
    .slice(0, count)
    .map((option) => option.id);
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
  return tokens.includes("search") || tokens.includes("stack");
}

function scoreSearchChoiceOption(
  choice: PendingChoice,
  option: PendingChoiceOption,
  context: SearchChoiceScoringContext,
): number {
  const card = option.card;
  if (!card) return 0;
  const destination =
    choice.cardSearchPresentation?.destination ??
    choice.stackSearchResolution?.destination;
  const roles = context.rolesForCardId(card.definitionId);
  const subtypes = (card.subtypes ?? []).map((subtype) =>
    subtype.toLowerCase(),
  );
  const features = context.features;
  let score = 100;

  if (card.type === "program")
    score += destination === "install_program" ? 1000 : 520;
  else if (destination === "install_program") score -= 600;

  if (destination === "install_program") {
    const memoryCost = card.memoryCost ?? 0;
    score +=
      memoryCost <= features.memoryRemaining
        ? 180
        : -260 - (memoryCost - features.memoryRemaining) * 40;
    const installCost = card.installCost ?? card.cost ?? 0;
    score +=
      installCost <= features.credits
        ? 110
        : -160 - (installCost - features.credits) * 30;
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
      score += rolesMatch(rigRoles, [roleNeedle]) ? 40 : 180;
    if (features.rigRoles.size === 0) score += 120;
  }

  if (rolesMatch(roles, ["memory"]) || (card.memoryLimitBonus ?? 0) > 0)
    score += features.memoryRemaining <= 1 ? 170 : 60;
  if (rolesMatch(roles, ["economy"]))
    score += features.credits < 4 ? 90 : 25;
  if (card.definitionId && features.rigDefinitionIds.has(card.definitionId))
    score -= 90;
  score -= Math.max(0, card.memoryCost ?? 0) * 5;
  score -= Math.max(0, card.installCost ?? card.cost ?? 0) * 2;
  return score;
}
