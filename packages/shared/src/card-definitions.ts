import type {
  CardDefinition,
  CardDefinitionId,
  CardType,
  ResolvedCardDefinition,
  SubroutineDefinition,
} from "./index";

const DEFINITION_NUMERIC_FIELDS = [
  "cost",
  "installCost",
  "memoryCost",
  "strength",
  "rezCost",
  "trashCost",
  "advancementRequirement",
  "agendaPoints",
] as const;

export const CARD_DEFINITIONS: CardDefinition[] = [
  {
    id: "v098_runner_identity",
    title: "Identity Lab Runner",
    side: "runner",
    type: "identity",
    subtypes: [],
    implementationStatus: "playable_mvp",
    abilityEnabled: true,
    baseLink: 1,
    rulesText: "Setup: Gain 1 credit. Static: +1 memory limit.",
    modifiers: [
      {
        modifierId: "v098_runner_identity_setup_credit",
        kind: "starting_credits",
        side: "runner",
        amount: 1,
        duration: "setup",
        sourceAbilityId: "v098_runner_identity_setup",
      },
      {
        modifierId: "v098_runner_identity_memory",
        kind: "memory_limit",
        side: "runner",
        amount: 1,
        duration: "static",
        sourceAbilityId: "v098_runner_identity_static",
      },
    ],
    mechanics: [
      "identity_setup",
      "identity_ability",
      "static_modifier",
      "base_link",
      "modify_memory_limit",
      "v098_local_original",
    ],
  },
  {
    id: "v098_corp_identity",
    title: "Identity Lab Corp",
    side: "corp",
    type: "identity",
    subtypes: [],
    implementationStatus: "playable_mvp",
    abilityEnabled: true,
    rulesText: "Setup: Gain 1 credit.",
    modifiers: [
      {
        modifierId: "v098_corp_identity_setup_credit",
        kind: "starting_credits",
        side: "corp",
        amount: 1,
        duration: "setup",
        sourceAbilityId: "v098_corp_identity_setup",
      },
    ],
    mechanics: [
      "identity_setup",
      "identity_ability",
      "setup_modifier",
      "v098_local_original",
    ],
  },
  {
    id: "v111_core_damage_operation",
    title: "Core Damage Harness",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Do 1 Core Damage.",
    mechanics: [
      "play_operation",
      "damage",
      "core_damage",
      "flatline",
      "v111_local_original",
    ],
  },
  {
    id: "v094_neural_sentry_ice",
    title: "Neural Sentry ICE",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    strength: 2,
    rulesText: "Do 1 net damage. End the run.",
    subroutines: [
      {
        id: "v094_neural_sentry_ice_net_damage",
        type: "do_damage",
        amount: 1,
        damageType: "net",
      },
      { id: "v094_neural_sentry_ice_etr", type: "end_the_run" },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "damage",
      "flatline",
      "end_the_run",
      "v094_local_original",
    ],
  },
  {
    id: "v095_safehouse_resource",
    title: "Safehouse Resource",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 2,
    rulesText: "Einfache offene Runner-Resource ohne aktive Fähigkeit.",
    mechanics: [
      "install_resource",
      "resource",
      "trash_resource",
      "tag_interaction",
      "v095_local_original",
    ],
  },
  {
    id: "v096_trace_probe_ice",
    title: "Trace Probe ICE",
    side: "corp",
    type: "ice",
    subtypes: ["sentry"],
    implementationStatus: "playable_mvp",
    rezCost: 3,
    strength: 2,
    rulesText: "Trace 2. If successful, give the Runner 1 tag.",
    subroutines: [
      {
        id: "v096_trace_probe_ice_trace",
        type: "initiate_trace",
        traceLimit: 2,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ],
    mechanics: [
      "install_ice",
      "rez_ice",
      "encounter_ice",
      "trace",
      "link",
      "bid_amount",
      "add_tag",
      "v096_local_original",
    ],
  },
  {
    id: "v097_deep_dive_event",
    title: "Deep Dive Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 1,
    rulesText:
      "Make a run. If successful, access 1 additional card during the breach.",
    mechanics: [
      "play_event",
      "start_run",
      "breach",
      "multiaccess",
      "v097_local_original",
    ],
  },
  {
    id: "v098_stack_search_event",
    title: "Stack Search Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Search your stack for a program, add it to your grip, then shuffle your stack.",
    mechanics: [
      "play_event",
      "search",
      "shuffle",
      "hidden_zone_tool",
      "v098_local_original",
    ],
  },
  {
    id: "v098_stack_arrange_event",
    title: "Stack Arrange Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText:
      "Look at the top 2 cards of your stack and arrange them in any order.",
    mechanics: [
      "play_event",
      "look",
      "arrange",
      "hidden_zone_tool",
      "v098_local_original",
    ],
  },
  {
    id: "v098_reveal_top_event",
    title: "Public Reveal Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Reveal the top card of your stack.",
    mechanics: ["play_event", "reveal", "v098_local_original"],
  },
  {
    id: "v098_expose_event",
    title: "Expose Event",
    side: "runner",
    type: "event",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Expose an unrezzed installed Corp card in the chosen server.",
    mechanics: ["play_event", "expose", "reveal", "v098_local_original"],
  },
  {
    id: "v098_hq_rd_swap_operation",
    title: "HQ R&D Swap Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Swap the top card of R&D with a card in HQ.",
    mechanics: [
      "play_operation",
      "swap",
      "hidden_zone_tool",
      "v098_local_original",
    ],
  },
  {
    id: "v099_host_resource",
    title: "Host Resource",
    side: "runner",
    type: "resource",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText: "When installed, host a program from your grip.",
    mechanics: [
      "install_resource",
      "resource",
      "hosting",
      "hidden_zone_choice",
      "v099_local_original",
    ],
  },
  {
    id: "v099_virus_program",
    title: "Virus Program",
    side: "runner",
    type: "program",
    subtypes: ["virus"],
    implementationStatus: "playable_mvp",
    installCost: 1,
    memoryCost: 1,
    rulesText: "When installed, place 1 virus counter on this program.",
    mechanics: [
      "install_program",
      "memory",
      "counter",
      "virus",
      "purge",
      "v099_local_original",
    ],
  },
  {
    id: "v099_recurring_chip",
    title: "Recurring Chip",
    side: "runner",
    type: "hardware",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    recurringCredits: 1,
    rulesText: "1 recurring credit. Use this credit to install a program.",
    mechanics: [
      "install_hardware",
      "counter",
      "recurring_credit",
      "v099_local_original",
    ],
  },
  {
    id: "v099_bad_publicity_operation",
    title: "Bad Publicity Operation",
    side: "corp",
    type: "operation",
    subtypes: [],
    implementationStatus: "playable_mvp",
    cost: 0,
    rulesText: "Gain 3 credits and take 1 bad publicity.",
    mechanics: [
      "play_operation",
      "gain_credits",
      "bad_publicity",
      "v099_local_original",
    ],
  },
];

export const CARD_DEFINITIONS_BY_ID: Record<
  CardDefinitionId,
  ResolvedCardDefinition
> = Object.fromEntries(
  CARD_DEFINITIONS.map((card) => {
    const resolved = resolveCardDefinition(card);
    return [resolved.id, resolved] as const;
  }),
);

function resolveCardDefinition(card: CardDefinition): ResolvedCardDefinition {
  validateDefinitionNumericContract(card);
  const { variableStrength, ...cardWithoutVariableStrength } = card;
  const numeric = {
    cost: card.cost ?? null,
    installCost: card.installCost ?? null,
    memoryCost: card.memoryCost ?? null,
    strength: card.strength ?? null,
    rezCost: card.rezCost ?? null,
    trashCost: card.trashCost ?? null,
    advancementRequirement: card.advancementRequirement ?? null,
    agendaPoints: card.agendaPoints ?? null,
  };
  const strengthModel =
    card.strength !== undefined
      ? ({ kind: "fixed", value: card.strength } as const)
      : variableStrength
        ? { ...variableStrength }
        : ({ kind: "not_applicable" } as const);
  const type = card.type;
  if (type !== "event" && type !== "operation") {
    if (card.playCost !== undefined) {
      throw new Error(
        `${card.id}: only events and operations may define playCost.`,
      );
    }
    return {
      ...cardWithoutVariableStrength,
      type,
      playCost: null,
      numeric,
      strengthModel,
    };
  }
  if (card.playCost !== undefined && card.cost !== undefined) {
    throw new Error(
      `${card.id}: event/operation defines both fixed and variable play cost.`,
    );
  }
  const playCost =
    card.playCost ??
    (card.cost !== undefined
      ? {
          kind: "fixed" as const,
          credits: card.cost,
        }
      : undefined);
  if (playCost === undefined) {
    throw new Error(`${card.id}: event/operation play cost is unresolved.`);
  }
  if (playCost.kind === "fixed") {
    if (
      !hasExactKeys(playCost, ["kind", "credits"]) ||
      !Number.isInteger(playCost.credits) ||
      !Number.isFinite(playCost.credits) ||
      playCost.credits < 0
    ) {
      throw new Error(`${card.id}: invalid fixed play cost.`);
    }
  } else if (
    !hasExactKeys(playCost, ["kind", "minimumX", "creditsPerX", "maximumX"]) ||
    !Number.isInteger(playCost.minimumX) ||
    playCost.minimumX < 1 ||
    !Number.isInteger(playCost.creditsPerX) ||
    playCost.creditsPerX <= 0 ||
    playCost.maximumX.kind !== "context" ||
    !hasExactKeys(playCost.maximumX, ["kind"])
  ) {
    throw new Error(`${card.id}: invalid variable-X play cost.`);
  }
  return {
    ...cardWithoutVariableStrength,
    type,
    playCost,
    numeric,
    strengthModel,
  };
}

function validateDefinitionNumericContract(card: CardDefinition): void {
  for (const key of DEFINITION_NUMERIC_FIELDS) {
    const value = card[key];
    if (
      value !== undefined &&
      (!Number.isFinite(value) || !Number.isInteger(value) || value < 0)
    ) {
      throw new Error(`${card.id}: ${key} must be a non-negative integer.`);
    }
  }

  const requiredFields: Partial<
    Record<CardType, readonly (typeof DEFINITION_NUMERIC_FIELDS)[number][]>
  > = {
    program: ["installCost", "memoryCost"],
    hardware: ["installCost"],
    resource: ["installCost"],
    agenda: ["advancementRequirement", "agendaPoints"],
    asset: ["rezCost", "trashCost"],
    upgrade: ["rezCost", "trashCost"],
    ice: ["rezCost"],
  };
  const allowedFields: Partial<
    Record<CardType, readonly (typeof DEFINITION_NUMERIC_FIELDS)[number][]>
  > = {
    identity: [],
    event: ["cost"],
    operation: ["cost"],
    program: ["installCost", "memoryCost", "strength"],
    hardware: ["installCost"],
    resource: ["installCost"],
    agenda: ["advancementRequirement", "agendaPoints"],
    asset: ["rezCost", "trashCost"],
    upgrade: ["rezCost", "trashCost"],
    ice: ["rezCost", "strength"],
  };

  for (const key of requiredFields[card.type] ?? []) {
    if (card[key] === undefined) {
      throw new Error(`${card.id}: ${card.type} requires ${key}.`);
    }
  }
  const allowed = new Set(allowedFields[card.type] ?? []);
  for (const key of DEFINITION_NUMERIC_FIELDS) {
    if (card[key] !== undefined && !allowed.has(key)) {
      throw new Error(`${card.id}: ${card.type} cannot define ${key}.`);
    }
  }

  const strengthRequired =
    card.type === "ice" ||
    (card.type === "program" && card.subtypes.includes("icebreaker"));
  const hasFixedStrength = card.strength !== undefined;
  const hasVariableStrength = card.variableStrength !== undefined;
  if (strengthRequired && hasFixedStrength === hasVariableStrength) {
    throw new Error(
      `${card.id}: strength-relevant ${card.type} requires exactly one fixed or variable strength model.`,
    );
  }
  if (!strengthRequired && (hasFixedStrength || hasVariableStrength)) {
    throw new Error(
      `${card.id}: ${card.type}/${card.subtypes.join(",")} cannot define strength.`,
    );
  }
  if (card.variableStrength) {
    validateVariableStrength(card.id, card.variableStrength);
  }
}

function validateVariableStrength(
  cardId: string,
  strength: NonNullable<CardDefinition["variableStrength"]>,
): void {
  if (strength.kind === "paid_x") {
    if (
      !hasExactKeys(strength, ["kind", "minimumStrength", "maximumStrength"]) ||
      !Number.isInteger(strength.minimumStrength) ||
      strength.minimumStrength < 0 ||
      !Number.isInteger(strength.maximumStrength) ||
      strength.maximumStrength < strength.minimumStrength
    ) {
      throw new Error(`${cardId}: invalid paid-X strength model.`);
    }
    return;
  }
  if (
    !hasExactKeys(strength, ["kind", "dieSides"]) ||
    !Number.isInteger(strength.dieSides) ||
    strength.dieSides < 2
  ) {
    throw new Error(`${cardId}: invalid random-die strength model.`);
  }
}

function hasExactKeys(value: object, expectedKeys: readonly string[]): boolean {
  const expected = [...expectedKeys].sort();
  const actual = Object.keys(value).sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}
