import type {
  CardDefinition,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import type { ScoredAgendaFlowHost } from "../scored-agenda-flow";

type CorporateWarScoredAgenda = Extract<
  CardScoredAgendaImplementation,
  { kind: "corporate_war_credit_swing" }
>;

export function resolveCorporateWarOnScore(
  host: ScoredAgendaFlowHost,
  definition: CardDefinition,
  legalAction: LegalAction | undefined,
  scoredAgenda: CorporateWarScoredAgenda,
): void {
  const corpCreditsBefore = host.state.corp.credits;
  const threshold = scoredAgenda.threshold;
  const gainAmount = scoredAgenda.gainAmount;
  const thresholdMet = corpCreditsBefore >= threshold;
  if (thresholdMet) {
    host.credits.gainCredits("corp", gainAmount);
  } else {
    host.credits.setCorpCredits(0);
  }
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922CorporateWarThreshold: threshold,
      corpCreditsBeforeCorporateWar: corpCreditsBefore,
      corporateWarThresholdMet: thresholdMet,
      onScoreGainCredits: thresholdMet ? gainAmount : 0,
      onScoreLostAllCredits: !thresholdMet,
      corpCreditsAfter: host.state.corp.credits,
    };
    if (thresholdMet) {
      appendScoreCreditEffect(legalAction, {
        effectId: `${definition.id}.score.corporate_war.gain_credits`,
        kind: "gain_credits",
        amount: gainAmount,
        definition,
      });
    } else if (corpCreditsBefore > 0) {
      appendScoreCreditEffect(legalAction, {
        effectId: `${definition.id}.score.corporate_war.lose_credits`,
        kind: "lose_credits",
        amount: corpCreditsBefore,
        definition,
      });
    }
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
