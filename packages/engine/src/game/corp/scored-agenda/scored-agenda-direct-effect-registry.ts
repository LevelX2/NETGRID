import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import { markScoredAgendaInstallRezCreditAvailableOnScore } from "./scored-agenda-install-rez-credit-sequence";
import { resolveCorporateWarOnScore } from "./corporate-war-sequence";
import { applyDirectScoreEconomyEffects } from "./direct-score-economy-effects";
import { applyOveradvanceScoreEffects } from "./overadvance-score-effects";
import { applySequencePayloadPatch } from "./scored-agenda-sequence-types";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

export type ScoredAgendaDirectEffectContext = {
  host: ScoredAgendaFlowHost;
  cardId: CardInstanceId;
  definition: CardDefinition;
  instanceBefore: CardInstance;
  requiredDifficulty: number;
  legalAction: LegalAction | undefined;
  scoredAgenda: CardScoredAgendaImplementation | undefined;
};

export type ScoredAgendaDirectEffectResult = {
  bonusAgendaPoints?: number;
  overadvancedBy?: number;
};

export type ScoredAgendaDirectEffectResolver = {
  id: string;
  kind?: CardScoredAgendaImplementation["kind"];
  mode: "agenda_kind" | "definition_fallback";
  resolveOnScore: (
    context: ScoredAgendaDirectEffectContext,
  ) => ScoredAgendaDirectEffectResult | void;
};

export const SCORED_AGENDA_DIRECT_EFFECT_RESOLVERS: readonly ScoredAgendaDirectEffectResolver[] =
  [
    {
      id: "overadvance_score_effects",
      mode: "definition_fallback",
      resolveOnScore: (context) =>
        applyOveradvanceScoreEffects(
          context.host,
          context.cardId,
          context.definition,
          context.instanceBefore,
          context.requiredDifficulty,
          context.scoredAgenda,
          context.legalAction,
        ),
    },
    {
      id: "fixed_bonus_agenda_points_score_effect",
      kind: "fixed_bonus_agenda_points_on_score",
      mode: "agenda_kind",
      resolveOnScore: ({ host, cardId, legalAction, scoredAgenda }) => {
        if (scoredAgenda?.kind !== "fixed_bonus_agenda_points_on_score") return;
        host.counters.setCardCounter(cardId, "agenda", scoredAgenda.amount);
        if (legalAction) {
          applySequencePayloadPatch(legalAction, {
            fixedBonusAgendaPoints: scoredAgenda.amount,
            bonusAgendaPoints: scoredAgenda.amount,
          });
        }
        return { bonusAgendaPoints: scoredAgenda.amount };
      },
    },
    {
      id: "gain_credits_on_score_effect",
      kind: "gain_credits_on_score",
      mode: "agenda_kind",
      resolveOnScore: (context) =>
        applyDirectScoreEconomyEffects(
          context.host,
          context.cardId,
          context.definition,
          context.scoredAgenda,
          context.legalAction,
        ),
    },
    {
      id: "add_counters_on_score_effect",
      kind: "add_counters_on_score",
      mode: "agenda_kind",
      resolveOnScore: (context) =>
        applyDirectScoreEconomyEffects(
          context.host,
          context.cardId,
          context.definition,
          context.scoredAgenda,
          context.legalAction,
        ),
    },
    {
      id: "scored_agenda_install_rez_credit_score_effect",
      kind: "scored_agenda_credit_until_install_or_rez",
      mode: "agenda_kind",
      resolveOnScore: ({ host, cardId, legalAction, scoredAgenda }) => {
        if (
          scoredAgenda?.kind !== "scored_agenda_credit_until_install_or_rez"
        )
          return;
        markScoredAgendaInstallRezCreditAvailableOnScore(host, cardId, legalAction);
      },
    },
    {
      id: "score_credit_swing_threshold_effect",
      kind: "score_credit_swing_if_corp_credit_threshold_met",
      mode: "agenda_kind",
      resolveOnScore: ({ host, definition, legalAction, scoredAgenda }) => {
        if (
          scoredAgenda?.kind !==
          "score_credit_swing_if_corp_credit_threshold_met"
        )
          return;
        resolveCorporateWarOnScore(host, definition, legalAction, scoredAgenda);
      },
    },
  ];

export function findScoredAgendaDirectEffectResolvers(
  scoredAgenda: CardScoredAgendaImplementation | undefined,
): readonly ScoredAgendaDirectEffectResolver[] {
  return SCORED_AGENDA_DIRECT_EFFECT_RESOLVERS.filter(
    (resolver) =>
      resolver.mode === "definition_fallback" ||
      (resolver.kind !== undefined && resolver.kind === scoredAgenda?.kind),
  );
}

export function applyScoredAgendaDirectEffects(
  context: ScoredAgendaDirectEffectContext,
): ScoredAgendaDirectEffectResult {
  const result: ScoredAgendaDirectEffectResult = {
    bonusAgendaPoints: 0,
    overadvancedBy: 0,
  };
  for (const resolver of findScoredAgendaDirectEffectResolvers(
    context.scoredAgenda,
  )) {
    const resolverResult = resolver.resolveOnScore(context);
    if (resolverResult?.bonusAgendaPoints !== undefined) {
      result.bonusAgendaPoints =
        (result.bonusAgendaPoints ?? 0) + resolverResult.bonusAgendaPoints;
    }
    if (resolverResult?.overadvancedBy !== undefined) {
      result.overadvancedBy = resolverResult.overadvancedBy;
    }
  }
  return result;
}
