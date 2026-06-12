import type { CardInstanceId } from "@netgrid/shared";
import { sanitizeCardImplementationSurfacePayload } from "../../view/surface-sanitizer";

export type CorpSequencePayloadValue = string | number | boolean;

/**
 * @contract Shared payload context for corp scored-agenda sequence steps.
 * The context may contain public counts, public definition IDs, server IDs and
 * credit totals, but not hidden-zone card lists or actor-private labels.
 */
export type CorpSequenceContext = {
  step: string;
  sourceAgendaId?: CardInstanceId | string;
  sourceDefinitionId?: string;
  selectedCount?: number;
  revealedCount?: number;
  shownCount?: number;
  installedCount?: number;
  installedIceCount?: number;
  installedRootCount?: number;
  rezzedCount?: number;
  rezzedIceCount?: number;
  rezzedRootCount?: number;
  trashedCount?: number;
  pendingTrashCount?: number;
  createdServerId?: string;
  cardImplementationSequenceCreatedServerId?: string;
  cardImplementationTemporaryCreditBudget?: number;
  temporaryCreditsProvided?: number;
  temporaryCreditsSpent?: number;
  temporaryCreditsRemaining?: number;
  temporaryCreditsReturned?: number;
  corpCreditsSpent?: number;
  corpCreditsAfter?: number;
} & Record<string, CorpSequencePayloadValue | CardInstanceId | undefined>;

export function corpSequenceContextPayload(
  context: CorpSequenceContext,
): Record<string, CorpSequencePayloadValue> {
  const { step: _step, ...payload } = context;
  const entries = Object.entries(payload).filter(
    (entry): entry is [string, CorpSequencePayloadValue] =>
      typeof entry[1] === "string" ||
      typeof entry[1] === "number" ||
      typeof entry[1] === "boolean",
  );
  return sanitizeCardImplementationSurfacePayload(Object.fromEntries(entries));
}
