import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

type CorpAdvancementCounterPlacementProfile = {
  maxTargets: number;
  counterPerTarget: number;
  distinctTargets: boolean;
  effectOnly: boolean;
};

type CorpAdvancementCounterWitness =
  | "score_now"
  | "score_next_action"
  | "overadvance_threshold"
  | "access_net_damage_ambush"
  | "access_brain_damage_ambush"
  | "access_program_trash_ambush"
  | "access_hardware_trash_ambush"
  | "counter_cashout_credit"
  | "counter_cashout_action"
  | "counter_bank_only"
  | "transfer_destination_visible"
  | "none";

type CorpAdvancementCounterTargetClass =
  | "agenda_score_now"
  | "agenda_score_next_action"
  | "agenda_overadvance_threshold"
  | "access_net_damage_ambush"
  | "access_brain_damage_ambush"
  | "access_program_trash_ambush"
  | "access_hardware_trash_ambush"
  | "counter_cashout_credit"
  | "counter_cashout_action"
  | "counter_bank_only"
  | "counter_transfer_source"
  | "counter_transfer_destination"
  | "low_value_decoy"
  | "unknown_advanceable";

type CorpAdvancementCounterTargetAssessment = {
  card: VisibleCard;
  server: VisibleCorpServer;
  value: number;
  witness: CorpAdvancementCounterWitness;
  targetClass: CorpAdvancementCounterTargetClass;
  windowValue: number;
  weakTargetPenalty: number;
  evidence: string[];
};

export type CorpAdvancementCounterPlacementAssessment = {
  dominatedByBasicAdvance: boolean;
  selectedTargets: number;
  maxTargets: number;
  basicAdvanceEquivalentAvailable: boolean;
  secondCounterValue: number;
  bestBasicEquivalent: "advance_card" | "gain_credit" | "draw_card";
  cardSpendPenalty: number;
  compressionValue: number;
  windowValue: number;
  weakTargetPenalty: number;
  netAdvancementValue: number;
  advancementWitness: CorpAdvancementCounterWitness;
  scoreValue: number;
  evidence: string[];
};

export type SemanticRuntimeCorpAdvancementCounterDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  normalizedRulesTextForDefinition: (definitionId: string) => string;
  actionCreditCost: (action: LegalAction) => number;
  actionSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  visibleServerCard: (
    input: AiDecisionInput,
    cardId: string,
  ) => { card: VisibleCard; server: VisibleCorpServer } | undefined;
  cardType: (card: VisibleCard) => string | undefined;
  cardAdvancementRequirement: (card: VisibleCard) => number | undefined;
  teamRestructuringCardId: string;
};

export function semanticRuntimeCorpAdvancementCounterPlacementAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpAdvancementCounterDependencies,
): CorpAdvancementCounterPlacementAssessment | undefined {
  if (input.side !== "corp" || action.side !== "corp") return undefined;
  const profile = corpAdvancementCounterPlacementProfileForAction(
    input,
    action,
    dependencies,
  );
  if (!profile) return undefined;
  const targets = semanticRuntimeCorpBasicAdvanceEquivalentTargets(
    input,
    dependencies,
  ).sort(
    (left, right) =>
      right.value - left.value ||
      left.card.instanceId.localeCompare(right.card.instanceId),
  );
  const meaningfulTargets = targets.filter((target) => target.value > 0);
  const selectedTargets = Math.min(
    profile.maxTargets,
    meaningfulTargets.length,
  );
  const selectedTargetAssessments = meaningfulTargets.slice(0, selectedTargets);
  const basicAdvanceEquivalentAvailable = meaningfulTargets.length > 0;
  const bestBasicEquivalent: "advance_card" | "gain_credit" | "draw_card" =
    basicAdvanceEquivalentAvailable
      ? "advance_card"
      : input.legalActions.some((candidate) => candidate.type === "gain_credit")
        ? "gain_credit"
        : "draw_card";
  const secondCounterValue =
    selectedTargets >= 2 ? (meaningfulTargets[1]?.value ?? 0) : 0;
  const bestWitness = bestCorpAdvancementCounterWitness(
    selectedTargetAssessments,
  );
  const boardDeltaValue = selectedTargetAssessments.reduce(
    (sum, target) => sum + target.value,
    0,
  );
  const windowValue = selectedTargetAssessments.reduce(
    (sum, target) => sum + target.windowValue,
    0,
  );
  const weakTargetPenalty = selectedTargetAssessments.reduce(
    (sum, target) => sum + target.weakTargetPenalty,
    0,
  );
  const compressionValue =
    selectedTargets >= 2
      ? selectedTargetAssessments.some((target) =>
          corpAdvancementCounterWitnessHasWindowValue(target.witness),
        )
        ? 150
        : 20
      : 0;
  const cardSpendPenalty = 180 + dependencies.actionCreditCost(action) * 40;
  const netAdvancementValue =
    boardDeltaValue +
    windowValue +
    compressionValue -
    cardSpendPenalty -
    weakTargetPenalty;
  const dominatedByBasicAdvance =
    profile.effectOnly &&
    profile.counterPerTarget === 1 &&
    profile.distinctTargets &&
    basicAdvanceEquivalentAvailable &&
    (selectedTargets <= 1 || netAdvancementValue <= 0);
  const scoreValue = dominatedByBasicAdvance
    ? -5200
    : netAdvancementValue > 0
      ? 1200 + Math.min(2600, netAdvancementValue * 8)
      : -1200 + netAdvancementValue * 6;
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  const evidence = [
    "advancement_counter_placement:true",
    `advancement_source:${sourceDefinitionId || "unknown"}`,
    `advancement_selected_targets:${selectedTargets}`,
    `advancement_max_targets:${profile.maxTargets}`,
    `advancement_distinct_targets:${profile.distinctTargets}`,
    `advancement_counter_per_target:${profile.counterPerTarget}`,
    `basic_advance_equivalent_available:${basicAdvanceEquivalentAvailable}`,
    `dominated_by_basic_advance:${dominatedByBasicAdvance}`,
    `card_spend_without_incremental_counter_value:${dominatedByBasicAdvance}`,
    `advancement_second_counter_value:${secondCounterValue}`,
    `best_basic_equivalent:${bestBasicEquivalent}`,
    `card_spend_penalty:${cardSpendPenalty}`,
    `compression_value:${compressionValue}`,
    `window_value:${windowValue}`,
    `weak_target_penalty:${weakTargetPenalty}`,
    `net_advancement_value:${netAdvancementValue}`,
    `advancement_witness:${bestWitness}`,
    ...selectedTargetAssessments.flatMap((target) => [
      `advancement_target_class:${target.targetClass}`,
      `advancement_target_witness:${target.witness}`,
      ...target.evidence,
    ]),
    ...(dominatedByBasicAdvance
      ? [
          "advancement_counter_placement_dominated_by_basic_advance",
          "reason:single_counter_can_be_produced_by_basic_advance_without_spending_card",
        ]
      : secondCounterValue > 0
        ? ["advancement_counter_placement_incremental_second_counter:true"]
        : ["advancement_counter_placement_incremental_second_counter:false"]),
  ];
  return {
    dominatedByBasicAdvance,
    selectedTargets,
    maxTargets: profile.maxTargets,
    basicAdvanceEquivalentAvailable,
    secondCounterValue,
    bestBasicEquivalent,
    cardSpendPenalty,
    compressionValue,
    windowValue,
    weakTargetPenalty,
    netAdvancementValue,
    advancementWitness: bestWitness,
    scoreValue,
    evidence,
  };
}

function corpAdvancementCounterPlacementProfileForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpAdvancementCounterDependencies,
): CorpAdvancementCounterPlacementProfile | undefined {
  if (action.type !== "play_operation") return undefined;
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  if (!sourceDefinitionId) return undefined;
  const text = dependencies.normalizedRulesTextForDefinition(sourceDefinitionId);
  if (
    sourceDefinitionId === dependencies.teamRestructuringCardId ||
    /\badd one advancement counter to each of up to two installed cards that can be advanced\b/.test(
      text,
    )
  ) {
    return {
      maxTargets: 2,
      counterPerTarget: 1,
      distinctTargets: true,
      effectOnly: true,
    };
  }
  return undefined;
}

function semanticRuntimeCorpBasicAdvanceEquivalentTargets(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpAdvancementCounterDependencies,
): CorpAdvancementCounterTargetAssessment[] {
  const locatedTargets = input.legalActions
    .filter(
      (action) => action.side === "corp" && action.type === "advance_card",
    )
    .map((action) => dependencies.actionSourceCard(input, action))
    .filter((card): card is VisibleCard => Boolean(card))
    .map((card) => {
      const located = dependencies.visibleServerCard(input, card.instanceId);
      if (!located) return undefined;
      return located;
    })
    .filter(
      (
        located,
      ): located is {
        card: VisibleCard;
        server: VisibleCorpServer;
      } => Boolean(located),
    );
  return locatedTargets
    .map((located) =>
      semanticRuntimeCorpAdvancementTargetAssessment(
        located.card,
        located.server,
        semanticRuntimeCorpHasTransferDestination(
          located.card.instanceId,
          locatedTargets,
          dependencies,
        ),
        dependencies,
      ),
    )
    .filter((target): target is CorpAdvancementCounterTargetAssessment =>
      Boolean(target),
    );
}

function semanticRuntimeCorpAdvancementTargetAssessment(
  card: VisibleCard,
  server: VisibleCorpServer,
  hasTransferDestination: boolean,
  dependencies: SemanticRuntimeCorpAdvancementCounterDependencies,
): CorpAdvancementCounterTargetAssessment | undefined {
  const definitionId = card.definitionId;
  if (!definitionId) return undefined;
  const type = dependencies.cardType(card);
  const requirement = dependencies.cardAdvancementRequirement(card);
  const counters = card.advancementCounters ?? 0;
  const remaining =
    typeof requirement === "number"
      ? Math.max(0, requirement - counters - 1)
      : 99;
  const protectedBonus = Math.min(server.ice.length, 2) * 12;
  const text = dependencies.normalizedRulesTextForDefinition(definitionId);
  const overadvanceThreshold = corpAgendaOveradvanceThresholdAssessment(
    text,
    requirement,
    counters,
  );
  if (type === "agenda") {
    const targetClass: CorpAdvancementCounterTargetClass =
      overadvanceThreshold?.hitsThreshold === true
        ? "agenda_overadvance_threshold"
        : remaining === 0
          ? "agenda_score_now"
          : remaining <= 1
            ? "agenda_score_next_action"
            : "unknown_advanceable";
    const witness: CorpAdvancementCounterWitness =
      targetClass === "agenda_overadvance_threshold"
        ? "overadvance_threshold"
        : targetClass === "agenda_score_now"
          ? "score_now"
          : targetClass === "agenda_score_next_action"
            ? "score_next_action"
            : "none";
    const windowValue =
      witness === "score_now"
        ? 260
        : witness === "score_next_action"
          ? 140
          : witness === "overadvance_threshold"
            ? 120
            : 0;
    return {
      card,
      server,
      value:
        140 +
        (remaining === 0 ? 100 : remaining <= 2 ? 45 : 0) +
        protectedBonus,
      witness,
      targetClass,
      windowValue,
      weakTargetPenalty: witness === "none" ? 80 : 0,
      evidence: overadvanceThreshold?.evidence ?? [],
    };
  }
  const ambush = corpAdvancementAmbushTargetClass(text);
  if (ambush) {
    return {
      card,
      server,
      value: 135 + protectedBonus,
      witness: ambush,
      targetClass: ambush,
      windowValue: 120,
      weakTargetPenalty: 0,
      evidence: [],
    };
  }
  if (corpAdvancementLooksLikeTransferSource(text)) {
    const targetClass: CorpAdvancementCounterTargetClass =
      hasTransferDestination ? "counter_transfer_source" : "counter_bank_only";
    return {
      card,
      server,
      value: (hasTransferDestination ? 75 : 30) + protectedBonus,
      witness: hasTransferDestination
        ? "transfer_destination_visible"
        : "counter_bank_only",
      targetClass,
      windowValue: hasTransferDestination ? 70 : 0,
      weakTargetPenalty: hasTransferDestination ? 25 : 130,
      evidence: [],
    };
  }
  const creditCashout = corpAdvancementCreditCashoutValue(text);
  if (creditCashout > 0) {
    return {
      card,
      server,
      value:
        55 +
        protectedBonus +
        creditCashout * 12 +
        (corpAdvancementCashoutScalesPerCounter(text) ? 45 : 0),
      witness: "counter_cashout_credit",
      targetClass: "counter_cashout_credit",
      windowValue: corpAdvancementCashoutScalesPerCounter(text) ? 65 : 25,
      weakTargetPenalty: 20,
      evidence: [],
    };
  }
  if (corpAdvancementLooksLikeActionCashout(text)) {
    return {
      card,
      server,
      value: 55 + protectedBonus,
      witness: "counter_cashout_action",
      targetClass: "counter_cashout_action",
      windowValue: 25,
      weakTargetPenalty: 35,
      evidence: [],
    };
  }
  if (
    /advancement counter|advance .* before|can be advanced|counter/.test(text)
  ) {
    return {
      card,
      server,
      value: 35 + protectedBonus,
      witness: "counter_bank_only",
      targetClass: "counter_bank_only",
      windowValue: 0,
      weakTargetPenalty: 125,
      evidence: [],
    };
  }
  return {
    card,
    server,
    value: 0,
    witness: "none",
    targetClass: /access|trash|damage/.test(text)
      ? "low_value_decoy"
      : "unknown_advanceable",
    windowValue: 0,
    weakTargetPenalty: 140,
    evidence: [],
  };
}

function corpAgendaOveradvanceThresholdAssessment(
  text: string,
  requirement: number | undefined,
  counters: number,
):
  | {
      thresholdSize: number;
      currentOver: number;
      afterActionOver: number;
      hitsThreshold: boolean;
      nextThresholdDistance: number;
      evidence: string[];
    }
  | undefined {
  const thresholdSize = corpAgendaOveradvanceThresholdSize(text);
  if (!thresholdSize || typeof requirement !== "number") return undefined;
  const currentOver = Math.max(0, counters - requirement);
  const afterActionOver = Math.max(0, counters + 1 - requirement);
  const hitsThreshold =
    afterActionOver > currentOver &&
    afterActionOver > 0 &&
    afterActionOver % thresholdSize === 0;
  const nextThresholdDistance = hitsThreshold
    ? 0
    : thresholdSize - (afterActionOver % thresholdSize || thresholdSize);
  return {
    thresholdSize,
    currentOver,
    afterActionOver,
    hitsThreshold,
    nextThresholdDistance,
    evidence: [
      `overadvance_threshold_size:${thresholdSize}`,
      `overadvance_current_over:${currentOver}`,
      `overadvance_after_action_over:${afterActionOver}`,
      `overadvance_hits_threshold:${hitsThreshold}`,
      `overadvance_next_threshold_distance:${nextThresholdDistance}`,
    ],
  };
}

function corpAgendaOveradvanceThresholdSize(text: string): number | undefined {
  const tokens = corpRulesTextTokens(text);
  for (const [index, token] of tokens.entries()) {
    if (token !== "for" || tokens[index + 1] !== "every") continue;
    const threshold = corpNumberWordToNumber(tokens[index + 2]);
    if (
      threshold !== undefined &&
      tokens[index + 3] === "advancement" &&
      (tokens[index + 4] === "counter" || tokens[index + 4] === "counters") &&
      tokens[index + 5] === "over"
    ) {
      return threshold;
    }
  }
  return undefined;
}

function corpNumberWordToNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = positiveIntegerTokenValue(value);
  if (parsed !== undefined) return parsed;
  const byWord: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
  };
  return byWord[value];
}

function corpRulesTextTokens(text: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const character of text.toLocaleLowerCase("en-US")) {
    if (isAsciiLetterOrDigit(character)) {
      current += character;
    } else if (current.length > 0) {
      tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "0" && character <= "9")
  );
}

function positiveIntegerTokenValue(
  token: string | undefined,
): number | undefined {
  if (
    token === undefined ||
    token.length === 0 ||
    ![...token].every((character) => character >= "0" && character <= "9")
  ) {
    return undefined;
  }
  const parsed = Number(token);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function semanticRuntimeCorpHasTransferDestination(
  sourceCardId: string,
  targets: readonly {
    card: VisibleCard;
    server: VisibleCorpServer;
  }[],
  dependencies: SemanticRuntimeCorpAdvancementCounterDependencies,
): boolean {
  return targets.some(
    (target) =>
      target.card.instanceId !== sourceCardId &&
      semanticRuntimeCorpLooksLikeTransferDestination(
        target.card,
        dependencies,
      ),
  );
}

function semanticRuntimeCorpLooksLikeTransferDestination(
  card: VisibleCard,
  dependencies: SemanticRuntimeCorpAdvancementCounterDependencies,
): boolean {
  const definitionId = card.definitionId;
  if (!definitionId) return false;
  const type = dependencies.cardType(card);
  if (type === "agenda") return true;
  const text = dependencies.normalizedRulesTextForDefinition(definitionId);
  if (corpAdvancementLooksLikeTransferSource(text)) return false;
  return Boolean(
    corpAdvancementAmbushTargetClass(text) ||
      (corpAdvancementCreditCashoutValue(text) >= 4 &&
        corpAdvancementCashoutScalesPerCounter(text)) ||
      corpAdvancementLooksLikeActionCashout(text),
  );
}

function corpAdvancementAmbushTargetClass(
  text: string,
):
  | Extract<
      CorpAdvancementCounterTargetClass,
      | "access_net_damage_ambush"
      | "access_brain_damage_ambush"
      | "access_program_trash_ambush"
      | "access_hardware_trash_ambush"
    >
  | undefined {
  const tokens = corpRulesTextTokens(text);
  if (corpTokensIncludePhrase(tokens, ["net", "damage"])) {
    return "access_net_damage_ambush";
  }
  if (
    corpTokensIncludePhrase(tokens, ["brain", "damage"]) ||
    corpTokensIncludePhrase(tokens, ["core", "damage"])
  ) {
    return "access_brain_damage_ambush";
  }
  if (
    tokens.includes("program") &&
    corpTokensIncludeAny(tokens, ["trash", "destroy"])
  ) {
    return "access_program_trash_ambush";
  }
  if (
    tokens.includes("hardware") &&
    corpTokensIncludeAny(tokens, ["trash", "destroy"])
  ) {
    return "access_hardware_trash_ambush";
  }
  return undefined;
}

function corpTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

function corpTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((token, offset) => tokens[index + offset] === token),
  );
}

function corpAdvancementLooksLikeTransferSource(text: string): boolean {
  return /move any number of advancement counters|move .*advancement counters.*another installed card/.test(
    text,
  );
}

function corpAdvancementCreditCashoutValue(text: string): number {
  const tokens = corpRulesTextTokens(text);
  for (const [index, token] of tokens.entries()) {
    if (token !== "gain") continue;
    const amount = positiveIntegerTokenValue(tokens[index + 1]);
    if (amount === undefined) continue;
    const nextToken = tokens[index + 2];
    if (
      nextToken === "credit" ||
      nextToken === "credits" ||
      corpAdvancementTokensStartCounterScale(tokens, index + 2)
    ) {
      return amount;
    }
  }
  return 0;
}

function corpAdvancementCashoutScalesPerCounter(text: string): boolean {
  return corpAdvancementTokensIncludeCounterScale(corpRulesTextTokens(text));
}

function corpAdvancementTokensIncludeCounterScale(
  tokens: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    corpAdvancementTokensStartCounterScale(tokens, index),
  );
}

function corpAdvancementTokensStartCounterScale(
  tokens: readonly string[],
  index: number,
): boolean {
  const first = tokens[index];
  const second = tokens[index + 1];
  const third = tokens[index + 2];
  const fourth = tokens[index + 3];
  return (
    (first === "for" &&
      (second === "each" || second === "every") &&
      third === "advancement" &&
      (fourth === "counter" || fourth === "counters")) ||
    (first === "per" &&
      second === "advancement" &&
      (third === "counter" || third === "counters"))
  );
}

function corpAdvancementLooksLikeActionCashout(text: string): boolean {
  return /advancement counter.*:\s*|counter.*action|spend .*advancement counter|remove .*advancement counter/.test(
    text,
  );
}

function corpAdvancementCounterWitnessHasWindowValue(
  witness: CorpAdvancementCounterWitness,
): boolean {
  return (
    witness === "score_now" ||
    witness === "score_next_action" ||
    witness === "overadvance_threshold" ||
    witness === "access_net_damage_ambush" ||
    witness === "access_brain_damage_ambush" ||
    witness === "access_program_trash_ambush" ||
    witness === "access_hardware_trash_ambush" ||
    witness === "transfer_destination_visible"
  );
}

function bestCorpAdvancementCounterWitness(
  targets: readonly CorpAdvancementCounterTargetAssessment[],
): CorpAdvancementCounterWitness {
  const rank: Record<CorpAdvancementCounterWitness, number> = {
    score_now: 11,
    score_next_action: 10,
    overadvance_threshold: 9,
    access_brain_damage_ambush: 8,
    access_net_damage_ambush: 7,
    access_program_trash_ambush: 6,
    access_hardware_trash_ambush: 6,
    transfer_destination_visible: 5,
    counter_cashout_credit: 4,
    counter_cashout_action: 3,
    counter_bank_only: 2,
    none: 1,
  };
  return (
    targets
      .map((target) => target.witness)
      .sort((left, right) => rank[right] - rank[left])[0] ?? "none"
  );
}
