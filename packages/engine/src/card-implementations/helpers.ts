import type {
  CardEffectImplementation,
  CardIcebreakerAbilityImplementation,
  CardIcebreakerBreakMatcherImplementation,
  CardPrintedSubroutineImplementation,
  CardTraceSuccessEffectImplementation,
  TraceEffectImplementation,
} from "../ability-engine/definition-types";

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
