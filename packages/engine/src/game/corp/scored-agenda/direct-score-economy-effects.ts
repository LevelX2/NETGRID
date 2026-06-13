import type {
  CardDefinition,
  CardInstanceId,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import { applySequencePayloadPatch } from "./scored-agenda-sequence-types";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

export function applyDirectScoreEconomyEffects(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  scoredAgenda: CardScoredAgendaImplementation | undefined,
  legalAction: LegalAction | undefined,
): void {
  if (scoredAgenda?.kind === "gain_credits_on_score") {
    host.credits.gainCredits(scoredAgenda.recipient, scoredAgenda.amount);
    if (legalAction) {
      applySequencePayloadPatch(legalAction, {
        onScoreGainCredits: scoredAgenda.amount,
        gainedCredits: scoredAgenda.amount,
        corpCreditsAfter: host.state.corp.credits,
      });
      appendScoreCreditEffect(legalAction, {
        effectId: `${definition.id}.score.gain_credits`,
        kind: "gain_credits",
        amount: scoredAgenda.amount,
        definition,
      });
    }
  }
  if (scoredAgenda?.kind === "add_counters_on_score") {
    host.counters.addCardCounter(
      cardId,
      scoredAgenda.counterType,
      scoredAgenda.amount,
    );
    if (legalAction)
      applySequencePayloadPatch(legalAction, {
        counterType: scoredAgenda.counterType,
        addedCounterAmount: scoredAgenda.amount,
        remainingCounters: host.counters.cardCounter(
          cardId,
          scoredAgenda.counterType,
        ),
      });
  }
}

function appendScoreCreditEffect(
  legalAction: LegalAction,
  effect: {
    effectId: string;
    kind: Extract<ResolvedGameEffect["kind"], "gain_credits" | "lose_credits">;
    amount: number;
    definition: CardDefinition;
  },
): void {
  const resolvedEffect: ResolvedGameEffect = {
    effectId: effect.effectId,
    kind: effect.kind,
    visibility: "public",
    side: "corp",
    amount: effect.amount,
    reason: "card_resolver",
    sourceDefinitionId: effect.definition.id,
    sourceTitle: effect.definition.title,
  };
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    resolvedEffect,
  ];
}
