import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type { CardScoredAgendaImplementation } from "../../../ability-engine/definition-types";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

export type ScoredAgendaScoreTimeContext = {
  host: ScoredAgendaFlowHost;
  cardId: CardInstanceId;
  definition: CardDefinition;
  instanceBefore: CardInstance;
  legalAction: LegalAction;
  scoredAgenda: CardScoredAgendaImplementation;
};

export type ScoredAgendaScoreTimeResolver = {
  id: string;
  kind: CardScoredAgendaImplementation["kind"];
  mode: "choice_start" | "immediate_effect" | "delegated_host_choice";
  resolveOnScore: (context: ScoredAgendaScoreTimeContext) => void;
};
