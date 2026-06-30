import type {
  ActivatedCardAbilityImplementation,
  CardEffectImplementation,
  CardIcebreakerAbilityImplementation,
  CardIcebreakerBreakMatcherImplementation,
  CardLifecycleTriggeredAbilityImplementation,
  CardPrintedSubroutineImplementation,
  CardSelfRezCostModifierImplementation,
  CardTraceSuccessEffectImplementation,
  RestrictedHostedCreditSourceImplementation,
  RestrictedHostedCreditUse,
  TraceEffectImplementation,
} from "../ability-engine/definition-types";

type AddHostedCreditsEffect = Extract<
  CardEffectImplementation,
  { kind: "add_hosted_credits" }
>;
type TakeHostedCreditsEffect = Extract<
  CardEffectImplementation,
  { kind: "take_hosted_credits" }
>;
type TrashSourceWhenEmptyEffect = Extract<
  CardEffectImplementation,
  { kind: "trash_source_when_empty" }
>;

export function basicIcebreakerAbilities(input: {
  breakCost: number;
  matches: CardIcebreakerBreakMatcherImplementation;
  breakCount?: number;
  pumpCost: number;
  pumpAmount?: number;
  pumpDuration?: "current_encounter" | "current_run";
}): readonly CardIcebreakerAbilityImplementation[] {
  const breakAbility: CardIcebreakerAbilityImplementation = {
    kind: "break_subroutine",
    cost: { kind: "credit", amount: input.breakCost },
    matches: input.matches,
    visibility: "public",
  };

  if (input.breakCount !== undefined) {
    breakAbility.count = input.breakCount;
  }

  return [
    breakAbility,
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: input.pumpCost },
      amount: input.pumpAmount ?? 1,
      duration: input.pumpDuration ?? "current_encounter",
      visibility: "public",
    },
  ];
}

export function endTheRunSubroutine(): CardPrintedSubroutineImplementation {
  return {
    kind: "end_the_run",
    text: "*End the run.",
  };
}

export function endTheRunSubroutines(
  count: number
): readonly CardPrintedSubroutineImplementation[] {
  return Array.from({ length: count }, () => endTheRunSubroutine());
}

export function trashProgramSubroutine(): CardPrintedSubroutineImplementation {
  return {
    kind: "trash_program",
    text: "*Trash a program.",
  };
}

export function netDamageSubroutine(
  amount: number
): CardPrintedSubroutineImplementation {
  return {
    kind: "damage",
    damageType: "net",
    amount,
    preventable: true,
    text: `*Do ${amount} Net damage.`,
  };
}

export function brainDamageSubroutine(
  amount: number
): CardPrintedSubroutineImplementation {
  return {
    kind: "damage",
    damageType: "brain",
    amount,
    preventable: true,
    text: `*Do ${amount} brain damage.`,
  };
}

export function noisyIcebreakerSelfRezReduction(
  amount: number,
): readonly CardSelfRezCostModifierImplementation[] {
  return [
    {
      kind: "self_rez_cost_reduction_during_run_after_noisy_icebreaker",
      amount,
      visibility: "public",
    },
  ];
}

export function traceTagSuccess(
  amount = 1
): readonly CardTraceSuccessEffectImplementation[] {
  return [
    {
      kind: "add_tags",
      recipient: "runner",
      amount,
      visibility: "public",
    },
  ];
}

export function traceTagSubroutine(
  baseTraceStrength: number,
  amount = 1
): CardPrintedSubroutineImplementation {
  const tagText =
    amount === 1 ? "give Runner a tag" : `give Runner ${amount} tags`;

  return {
    kind: "trace",
    baseTraceStrength,
    text: `*Trace ${baseTraceStrength}-If trace is successful, ${tagText}.`,
    onSuccess: traceTagSuccess(amount),
  };
}

export function traceTagEffect(
  baseTraceStrength: number,
  amount = 1
): Extract<CardEffectImplementation, TraceEffectImplementation> {
  return {
    kind: "trace",
    baseTraceStrength,
    visibility: "public",
    onSuccess: traceTagSuccess(amount),
  };
}

export function addHostedCredits(amount: number): AddHostedCreditsEffect {
  return {
    kind: "add_hosted_credits",
    target: "source",
    amount,
    visibility: "public",
  };
}

export function takeHostedCredits(input: {
  amount?: number;
  mode?: "up_to_amount_if_available" | "all";
} = {}): TakeHostedCreditsEffect {
  return {
    kind: "take_hosted_credits",
    source: "source",
    recipient: "controller",
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
    visibility: "public",
  };
}

export function trashSourceWhenEmpty(): TrashSourceWhenEmptyEffect {
  return {
    kind: "trash_source_when_empty",
    source: "source",
    visibility: "public",
  };
}

export function takeHostedCreditsAndTrashWhenEmpty(input: {
  amount: number;
}): readonly CardEffectImplementation[] {
  return [
    takeHostedCredits({
      amount: input.amount,
      mode: "up_to_amount_if_available",
    }),
    trashSourceWhenEmpty(),
  ];
}

export function hostedCreditTakeTurnTrigger(input: {
  amount: number;
  trashWhenEmpty?: boolean;
}): CardLifecycleTriggeredAbilityImplementation {
  return {
    condition: { kind: "source_has_hosted_credits" },
    effects: input.trashWhenEmpty
      ? takeHostedCreditsAndTrashWhenEmpty({ amount: input.amount })
      : [
          takeHostedCredits({
            amount: input.amount,
            mode: "up_to_amount_if_available",
          }),
        ],
  };
}

export function hostedCreditTakeAbility(input: {
  timing: "runner_main" | "corp_main";
  label: string;
  amount?: number;
  mode?: "up_to_amount_if_available" | "all";
  trashWhenEmpty?: boolean;
  limit?: ActivatedCardAbilityImplementation["limit"];
}): ActivatedCardAbilityImplementation {
  const takeInput = {
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
  };

  return {
    kind: "activated",
    timing: input.timing,
    costs: [{ kind: "action", amount: 1 }],
    condition: { kind: "source_has_hosted_credits" },
    ...(input.limit ? { limit: input.limit } : {}),
    label: input.label,
    effects: input.trashWhenEmpty && input.amount !== undefined
      ? takeHostedCreditsAndTrashWhenEmpty({ amount: input.amount })
      : [
          takeHostedCredits(takeInput),
        ],
  };
}

export function hostedCreditAddAbility(input: {
  timing: "runner_main" | "corp_main";
  label: string;
  amount: number;
  limit?: ActivatedCardAbilityImplementation["limit"];
}): ActivatedCardAbilityImplementation {
  return {
    kind: "activated",
    timing: input.timing,
    costs: [{ kind: "action", amount: 1 }],
    ...(input.limit ? { limit: input.limit } : {}),
    label: input.label,
    effects: [addHostedCredits(input.amount)],
  };
}

export function restrictedHostedCreditSource(input: {
  capacity: number;
  usableFor: readonly RestrictedHostedCreditUse[];
  allowUseWhileOverwritingSource?: true;
  requireHostedBreakerForIcebreakerUse?: true;
}): RestrictedHostedCreditSourceImplementation {
  return {
    capacity: input.capacity,
    counterType: "bit",
    usableFor: input.usableFor,
    refresh: {
      timing: "start_of_runner_turn",
      mode: "refill_to_capacity_if_used",
    },
    ...(input.allowUseWhileOverwritingSource
      ? { allowUseWhileOverwritingSource: true }
      : {}),
    ...(input.requireHostedBreakerForIcebreakerUse
      ? { requireHostedBreakerForIcebreakerUse: true }
      : {}),
  };
}

export function searchStackToGripEffect(input: {
  filter: "program" | "any_card";
  revealToCorp: boolean;
}): Extract<CardEffectImplementation, { kind: "search_stack_to_grip" }> {
  return {
    kind: "search_stack_to_grip",
    filter: input.filter,
    revealToCorp: input.revealToCorp,
    shuffleAfterwards: true,
    visibility: "hidden_info_barrier",
  };
}

export function searchStackInstallEffect(input: {
  installCost: "normal" | "free";
}): Extract<CardEffectImplementation, { kind: "search_stack_install" }> {
  return {
    kind: "search_stack_install",
    filter: "program",
    installCost: input.installCost,
    shuffleAfterwards: true,
    visibility: "hidden_info_barrier",
  };
}

export function chooseStackOrTrashProgramInstallEffect(): Extract<
  CardEffectImplementation,
  { kind: "choose_stack_or_trash_program_install" }
> {
  return {
    kind: "choose_stack_or_trash_program_install",
    installCost: "free",
    shuffleStackIfSearched: true,
    returnInstalledCardToGripAtEndOfTurn: true,
    visibility: "hidden_info_barrier",
  };
}

export function lookTopStackShowToCorpThenInstallMatchingEffect(): Extract<
  CardEffectImplementation,
  { kind: "look_top_stack_show_to_corp_then_install_matching" }
> {
  return {
    kind: "look_top_stack_show_to_corp_then_install_matching",
    count: 5,
    allowedTypes: ["program"],
    installCost: "free",
    trashSourceIfInstalled: true,
    shuffleAfterwards: true,
    visibility: "hidden_info_barrier",
  };
}

export function lookTopStackTakeMatchingEffect(input: {
  count: number;
  allowedTypes: readonly ("program" | "event" | "hardware" | "resource")[];
  costPerTaken: number;
}): Extract<CardEffectImplementation, { kind: "look_top_stack_take_matching" }> {
  return {
    kind: "look_top_stack_take_matching",
    count: input.count,
    allowedTypes: input.allowedTypes,
    costPerTaken: input.costPerTaken,
    revealTakenToCorp: true,
    shuffleRemainder: true,
    visibility: "hidden_info_barrier",
  };
}

export function lookTopStackTakeOneArrangeRestEffect(): Extract<
  CardEffectImplementation,
  { kind: "look_top_stack_take_one_arrange_rest" }
> {
  return {
    kind: "look_top_stack_take_one_arrange_rest",
    count: 5,
    visibility: "hidden_info_barrier",
  };
}
