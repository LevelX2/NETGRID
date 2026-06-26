import type { AiDecisionInput } from "@netgrid/shared";

import { visibleRootIsKnownAgenda } from "../runtime/visible-root-agenda";
import { definitionTypeForMetrics } from "./card-metric-lookup";

export function visibleRootIsKnownAgendaForMetrics(
  card: AiDecisionInput["playerView"]["servers"][number]["root"][number],
): boolean {
  return visibleRootIsKnownAgenda(card, definitionTypeForMetrics);
}
