import type { AiDecisionInput } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { runnerHintProvidesDamagePrevention } from "../runner-canonical-hint-semantics";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const DAMAGE_PREVENTION_CHOICE_SOURCE = "v120.event_modification.prevent";

export type RunnerOptionalChoiceResolution =
  | {
      readonly kind: "select";
      readonly optionId: string;
    }
  | {
      readonly kind: "pass";
    };

export function runnerDamagePreventionChoiceResolution(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): RunnerOptionalChoiceResolution | undefined {
  if (
    choice.source !== DAMAGE_PREVENTION_CHOICE_SOURCE ||
    choice.kind !== "select_option" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1
  ) {
    return undefined;
  }
  const preventionOptions = selectableOptions.filter(
    (option) => option.metadata?.optionKind === "prevent_damage",
  );
  const highestPrevention = preventionOptions.reduce<
    PendingChoiceOption | undefined
  >(
    (best, option) =>
      preventionAmount(option) > preventionAmount(best) ? option : best,
    undefined,
  );
  if (
    highestPrevention &&
    preventionAmount(highestPrevention) >= input.playerView.own.gripOrHq.length
  ) {
    return { kind: "select", optionId: highestPrevention.id };
  }
  const optionId = preventionOptions.find(
    (option) =>
      preventionAmount(option) > 0 &&
      isRoutineDamagePreventionOption(input, option),
  )?.id;
  return optionId ? { kind: "select", optionId } : { kind: "pass" };
}

function isRoutineDamagePreventionOption(
  input: AiDecisionInput,
  option: PendingChoiceOption,
): boolean {
  if (
    option.id.startsWith("run_damage_prevent_") ||
    option.id.startsWith("v161_damage_prevent_") ||
    option.id.startsWith("v120_damage_prevent_") ||
    option.id.startsWith("card_implementation_permanent_meat_prevent_")
  ) {
    return true;
  }
  const source = (input.playerView.own.rig ?? []).find((card) =>
    option.id.includes(`_${sanitizedChoiceSourceId(card.instanceId)}_`),
  );
  return runnerHintProvidesDamagePrevention(
    source?.definitionId
      ? AI_HINTS_BY_CARD.get(source.definitionId)
      : undefined,
  );
}

function preventionAmount(option: PendingChoiceOption | undefined): number {
  const amount = option?.metadata?.amount;
  return typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount > 0
    ? amount
    : 0;
}

function sanitizedChoiceSourceId(instanceId: string): string {
  return instanceId.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}
