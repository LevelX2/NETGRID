import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
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
  [];

export function findScoredAgendaDirectEffectResolvers(
  scoredAgenda: CardScoredAgendaImplementation | undefined,
): readonly ScoredAgendaDirectEffectResolver[] {
  return SCORED_AGENDA_DIRECT_EFFECT_RESOLVERS.filter(
    (resolver) =>
      resolver.mode === "definition_fallback" ||
      (resolver.kind !== undefined && resolver.kind === scoredAgenda?.kind),
  );
}
