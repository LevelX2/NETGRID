import type { AccessTargetKind } from "./access-decision-types";

export type RemoteTrashCreditSource = {
  sourceId: string;
  amount: number;
  targetKinds?: readonly AccessTargetKind[];
  freeTrash?: boolean;
};

export type RemoteTrashSpendabilityQuote = {
  trashCost: number;
  dedicatedCreditsUsable: number;
  generalCreditsRequired: number;
  freeTrashAvailable: boolean;
  technicallyAffordable: boolean;
  evidence: string[];
};

export function quoteRemoteTrashSpendability(params: {
  targetKind: AccessTargetKind;
  trashCost: number;
  availableGeneralCredits: number;
  creditSources?: readonly RemoteTrashCreditSource[];
}): RemoteTrashSpendabilityQuote {
  const trashCost = Math.max(0, Math.floor(params.trashCost));
  const matchingSources = (params.creditSources ?? []).filter((source) =>
    sourceAppliesToTarget(source, params.targetKind),
  );
  const freeTrashAvailable = matchingSources.some((source) => source.freeTrash);
  const dedicatedCreditsUsable = freeTrashAvailable
    ? 0
    : Math.min(
        trashCost,
        matchingSources.reduce(
          (sum, source) => sum + Math.max(0, Math.floor(source.amount)),
          0,
        ),
      );
  const generalCreditsRequired = freeTrashAvailable
    ? 0
    : Math.max(0, trashCost - dedicatedCreditsUsable);
  const technicallyAffordable =
    freeTrashAvailable ||
    Math.max(0, Math.floor(params.availableGeneralCredits)) >=
      generalCreditsRequired;

  return {
    trashCost,
    dedicatedCreditsUsable,
    generalCreditsRequired,
    freeTrashAvailable,
    technicallyAffordable,
    evidence: [
      `remote_trash_spendability_target:${params.targetKind}`,
      `remote_trash_spendability_cost:${trashCost}`,
      `remote_trash_spendability_dedicated_credits:${dedicatedCreditsUsable}`,
      `remote_trash_spendability_general_required:${generalCreditsRequired}`,
      `remote_trash_spendability_free_trash:${freeTrashAvailable}`,
      `remote_trash_spendability_affordable:${technicallyAffordable}`,
      ...matchingSources
        .slice(0, 6)
        .map((source) => `remote_trash_spendability_source:${source.sourceId}`),
    ],
  };
}

function sourceAppliesToTarget(
  source: RemoteTrashCreditSource,
  targetKind: AccessTargetKind,
): boolean {
  if (!source.targetKinds || source.targetKinds.length === 0) return true;
  return source.targetKinds.includes(targetKind);
}

