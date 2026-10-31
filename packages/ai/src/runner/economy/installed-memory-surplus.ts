import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

export type InstalledMemorySurplusQuote = Readonly<{
  stateVersion: number;
  targetInstanceId: string;
  memoryLimitAfterRemoval: number;
  wholeOwnDeckProgramMemory: number;
}>;

/** A marginal capacity value, not an assertion that hardware has no function. */
export function installedMemorySurplusQuote(
  input: AiDecisionInput,
  card: VisibleCard,
): InstalledMemorySurplusQuote | undefined {
  const deck = (input as AiDecisionInputWithDeckCapabilities).ownDeckSnapshot;
  const own = input.playerView.own;
  const rig = own.rig ?? [];
  if (
    input.side !== "runner" ||
    !deck ||
    !("immutable" in deck) ||
    deck.immutable !== true ||
    deck.side !== "runner" ||
    !card.known ||
    !card.definitionId ||
    card.type !== "hardware" ||
    !rig.some((entry) => entry.instanceId === card.instanceId) ||
    card.owner !== "runner" ||
    card.controller !== "runner" ||
    !Number.isSafeInteger(own.memoryLimit) ||
    !Number.isSafeInteger(own.memoryUsed) ||
    !Number.isSafeInteger(card.memoryLimitBonus) ||
    card.memoryLimitBonus! <= 0 ||
    Object.values(card.counters ?? {}).some((count) => count !== 0) ||
    (card.lifecycleMarkers?.length ?? 0) !== 0 ||
    rig.some((entry) => entry.hostedOn === card.instanceId)
  )
    return undefined;

  const canonical = cardSpecPlanningCardByDefinitionId(card.definitionId);
  const engine = canonical?.planning.engine;
  const modifier = engine?.modifiers?.[0];
  // Additional abilities, hooks or modifiers retain their own value. A role
  // annotation such as build_rig does not add an effect to a pure MU provider.
  if (
    !engine ||
    Object.keys(engine).some(
      (key) => !["schemaVersion", "characteristics", "modifiers"].includes(key),
    ) ||
    engine.modifiers?.length !== 1 ||
    modifier?.kind !== "memory_units" ||
    modifier.operation !== "increase" ||
    modifier.amount !== card.memoryLimitBonus ||
    modifier.activeWhile !== "installed" ||
    modifier.sourceZone !== "runner_installed" ||
    modifier.side !== "runner" ||
    modifier.visibility !== "public"
  )
    return undefined;

  const programs = new Map<string, { quantity: number; memory: number }>();
  const seen = new Set<string>();
  let wholeOwnDeckProgramMemory = 0;
  for (const entry of deck.cards) {
    const definition = cardSpecPlanningCardByDefinitionId(entry.cardId);
    if (
      !definition ||
      definition.definition.side !== "runner" ||
      seen.has(entry.cardId) ||
      !Number.isSafeInteger(entry.quantity) ||
      entry.quantity <= 0
    )
      return undefined;
    seen.add(entry.cardId);
    if (definition.definition.type !== "program") continue;
    const memory =
      definition.planning.engine.characteristics.numeric.memoryCost;
    if (!Number.isSafeInteger(memory) || memory! < 0) return undefined;
    programs.set(entry.cardId, { quantity: entry.quantity, memory: memory! });
    wholeOwnDeckProgramMemory += entry.quantity * memory!;
  }
  if (
    !seen.has(card.definitionId) ||
    !Number.isSafeInteger(wholeOwnDeckProgramMemory)
  )
    return undefined;
  const installedCounts = new Map<string, number>();
  for (const program of rig.filter((entry) => entry.type === "program")) {
    const bound = program.definitionId
      ? programs.get(program.definitionId)
      : undefined;
    if (
      !program.known ||
      !program.definitionId ||
      program.owner !== "runner" ||
      program.controller !== "runner" ||
      !bound ||
      program.memoryCost !== bound.memory
    )
      return undefined;
    const count = (installedCounts.get(program.definitionId) ?? 0) + 1;
    if (count > bound.quantity) return undefined;
    installedCounts.set(program.definitionId, count);
  }
  const memoryLimitAfterRemoval = own.memoryLimit! - card.memoryLimitBonus!;
  if (
    own.memoryUsed! < 0 ||
    own.memoryUsed! > wholeOwnDeckProgramMemory ||
    memoryLimitAfterRemoval < wholeOwnDeckProgramMemory
  )
    return undefined;
  return {
    stateVersion: input.playerView.stateVersion,
    targetInstanceId: card.instanceId,
    memoryLimitAfterRemoval,
    wholeOwnDeckProgramMemory,
  };
}
