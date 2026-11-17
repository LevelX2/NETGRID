import type { AiDecisionInput } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../../ai-hints";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import type { CorpFundedRemoteAccessRiskNeed } from "../corp-funded-score-protection";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
  type CorpScoreProtectionIceInput,
} from "../corp-score-protection-assessment";
import { visibleCorpCardsOutsideRd } from "./corp-ice-density";

type CorpScoreDefenseEffectSuitableIceDensity = Readonly<{
  confidence: "deck_snapshot" | "unknown";
  remainingDeckCount: number;
  remainingSuitableIceCount?: number;
  remainingSuitableIceDensity?: number;
  suitableDefinitionIds: readonly number[];
  evidence: readonly string[];
}>;

type DecisionInputWithOptionalDeckSnapshot = AiDecisionInput & {
  ownDeckSnapshot?: AiDeckStrategyDeckSnapshot;
};

export function corpScoreDefenseEffectSuitableIceDensity(
  input: AiDecisionInput,
  need: CorpFundedRemoteAccessRiskNeed,
): CorpScoreDefenseEffectSuitableIceDensity {
  const remainingDeckCount = input.playerView.own.stackOrRdCount;
  const snapshot = (input as DecisionInputWithOptionalDeckSnapshot)
    .ownDeckSnapshot;
  if (
    snapshot?.side !== "corp" ||
    !Array.isArray(snapshot.cards) ||
    !Number.isSafeInteger(remainingDeckCount) ||
    remainingDeckCount <= 0 ||
    need.baseline.knowledge !== "known" ||
    !Array.isArray(input.playerView.opponent.rig)
  ) {
    return unknownScoreDefenseDensity(
      remainingDeckCount,
      "missing_or_invalid_deck_snapshot",
    );
  }
  const selectedIceInstanceIds = new Set(
    need.baseline.selectedRezCosts.map((cost) => cost.iceInstanceId),
  );
  const currentServer = input.playerView.servers.find(
    (server) => server.id === need.targetServerId,
  );
  if (!currentServer && need.targetServerId !== "new_remote")
    return unknownScoreDefenseDensity(
      remainingDeckCount,
      "target_server_missing",
    );
  const currentFundedIce: CorpScoreProtectionIceInput[] = (
    currentServer?.ice ?? []
  ).map((card) => ({
    instanceId: card.instanceId,
    known: card.known,
    ...(card.definitionId ? { definitionId: card.definitionId } : {}),
    rezzed: card.rezzed === true || selectedIceInstanceIds.has(card.instanceId),
    ...(card.strength !== undefined ? { strength: card.strength } : {}),
    ...(card.subtypes !== undefined ? { subtypes: card.subtypes } : {}),
    ...(card.effectiveRunQuote
      ? { effectiveRunQuote: card.effectiveRunQuote }
      : {}),
  }));
  const outsideByDefinitionId = visibleCorpCardsOutsideRdByDefinition(input);
  let remainingSuitableIceCount = 0;
  const suitableDefinitionIds: number[] = [];
  const deckDefinitionIds = new Set<number>();
  for (const entry of snapshot.cards) {
    if (!Number.isSafeInteger(entry.quantity) || entry.quantity < 0) {
      return unknownScoreDefenseDensity(
        remainingDeckCount,
        "invalid_deck_snapshot_quantity",
      );
    }
    const resolvedDefinitionId = resolvedEngineDefinitionId(entry.cardId);
    if (
      resolvedDefinitionId === undefined ||
      deckDefinitionIds.has(resolvedDefinitionId)
    ) {
      return unknownScoreDefenseDensity(
        remainingDeckCount,
        "invalid_or_duplicate_deck_definition",
      );
    }
    deckDefinitionIds.add(resolvedDefinitionId);
    const remainingCopies =
      entry.quantity - (outsideByDefinitionId.get(resolvedDefinitionId) ?? 0);
    if (remainingCopies <= 0) continue;
    const definition = CARD_DEFINITIONS_BY_ID[resolvedDefinitionId];
    if (definition?.type !== "ice") continue;
    const after = assessCorpScoreProtection({
      serverIce: [
        ...currentFundedIce,
        {
          instanceId: `deck-effect-projection:${entry.cardId}`,
          known: true,
          definitionId: resolvedDefinitionId,
          rezzed: true,
          ...(definition.strength !== undefined
            ? { strength: definition.strength }
            : {}),
          ...(definition.subtypes !== undefined
            ? { subtypes: definition.subtypes }
            : {}),
        },
      ],
      runnerRig: input.playerView.opponent.rig,
      runnerCredits: input.playerView.opponent.credits,
      maximumRunnerAccessSuccessProbability:
        need.objective.maximumRunnerAccessSuccessProbability,
    });
    if (
      after.knowledge !== "known" ||
      compareExactProbabilities(
        after.runnerAccessSuccessProbability,
        need.baseline.protection.runnerAccessSuccessProbability,
      ) !== -1
    ) {
      continue;
    }
    remainingSuitableIceCount += remainingCopies;
    suitableDefinitionIds.push(resolvedDefinitionId);
  }
  if (
    !Number.isSafeInteger(remainingSuitableIceCount) ||
    remainingSuitableIceCount > remainingDeckCount
  ) {
    return unknownScoreDefenseDensity(
      remainingDeckCount,
      "outside_deck_zone_accounting_mismatch",
    );
  }
  const density = remainingSuitableIceCount / remainingDeckCount;
  suitableDefinitionIds.sort();
  return {
    confidence: "deck_snapshot",
    remainingDeckCount,
    remainingSuitableIceCount,
    remainingSuitableIceDensity: density,
    suitableDefinitionIds,
    evidence: [
      "score_defense_effect_density_confidence:deck_snapshot",
      "score_defense_effect_density_basis:exact_access_probability_reduction",
      `remaining_deck_count:${remainingDeckCount}`,
      `remaining_score_defense_effect_suitable_ice_count:${remainingSuitableIceCount}`,
      `remaining_score_defense_effect_suitable_ice_density:${density.toFixed(4)}`,
      `remaining_score_defense_effect_suitable_ice_definitions:${suitableDefinitionIds.join(",") || "none"}`,
      "score_defense_effect_density_uses_printed_rez_cost:false",
    ],
  };
}

function unknownScoreDefenseDensity(
  remainingDeckCount: number,
  reason: string,
): CorpScoreDefenseEffectSuitableIceDensity {
  return {
    confidence: "unknown",
    remainingDeckCount,
    suitableDefinitionIds: [],
    evidence: [
      "score_defense_effect_density_confidence:unknown",
      `score_defense_effect_density_unknown_reason:${reason}`,
    ],
  };
}

function resolvedEngineDefinitionId(definitionId: number): number | undefined {
  if (CARD_DEFINITIONS_BY_ID[definitionId]) return definitionId;
  const engineCardId = RUNTIME_CARDS[definitionId]?.engineCardId;
  return engineCardId && CARD_DEFINITIONS_BY_ID[engineCardId]
    ? engineCardId
    : undefined;
}

function visibleCorpCardsOutsideRdByDefinition(
  input: AiDecisionInput,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const card of visibleCorpCardsOutsideRd(input)) {
    const definitionId =
      card.definitionId && resolvedEngineDefinitionId(card.definitionId);
    if (!definitionId) continue;
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return counts;
}
