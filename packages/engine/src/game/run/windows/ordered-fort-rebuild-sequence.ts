import type { ServerId } from "@netgrid/shared";
import { sanitizePayloadForSurface } from "../../view/surface-policy";
import type { RunWindowSequencePayloadPatch } from "./run-window-sequence-types";

export type OrderedFortRebuildStep =
  | "capture_source_fort"
  | "select_replacement_hq_cards"
  | "validate_ordered_install_set"
  | "return_removed_cards_to_hq"
  | "install_replacements_in_order"
  | "complete";

export const ORDERED_FORT_REBUILD_STEPS = [
  "capture_source_fort",
  "select_replacement_hq_cards",
  "validate_ordered_install_set",
  "return_removed_cards_to_hq",
  "install_replacements_in_order",
  "complete",
] as const satisfies readonly OrderedFortRebuildStep[];

export type OrderedFortRebuildSequenceContract = {
  kind: "ordered_fort_rebuild_sequence";
  trigger: "on_rez";
  sourceZone: "corp_root";
  sourceType: "installed_corp_upgrade";
  targetFort: "source_fort";
  include: "root_and_ice";
  replacementZone: "hq";
  replacementCount: "same_as_removed_count";
  installCost: "free";
  installOrder: readonly ["ice_outermost_to_innermost", "root"];
  visibility: "hidden_info_barrier";
  publicPayload: {
    exposeCardIds: false;
    exposeCounts: true;
    exposeTargetServerId: true;
  };
};

export const ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT: OrderedFortRebuildSequenceContract =
  {
    kind: "ordered_fort_rebuild_sequence",
    trigger: "on_rez",
    sourceZone: "corp_root",
    sourceType: "installed_corp_upgrade",
    targetFort: "source_fort",
    include: "root_and_ice",
    replacementZone: "hq",
    replacementCount: "same_as_removed_count",
    installCost: "free",
    installOrder: ["ice_outermost_to_innermost", "root"],
    visibility: "hidden_info_barrier",
    publicPayload: {
      exposeCardIds: false,
      exposeCounts: true,
      exposeTargetServerId: true,
    },
  };

export type OrderedFortRebuildPublicPayloadInput = {
  sourceDefinitionId: string;
  targetServerId: Exclude<ServerId, "hq" | "rd" | "archives" | "new_remote">;
  removedCardCount: number;
  replacementCardCount: number;
  installedIceCount: number;
  installedRootCount: number;
};

export function orderedFortRebuildPublicPayload(
  input: OrderedFortRebuildPublicPayloadInput,
): RunWindowSequencePayloadPatch {
  return sanitizePayloadForSurface(
    {
      sequenceKind: ORDERED_FORT_REBUILD_SEQUENCE_CONTRACT.kind,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "ordered_fort_rebuild_sequence",
      sourceDefinitionId: input.sourceDefinitionId,
      targetServerId: input.targetServerId,
      removedCardCount: input.removedCardCount,
      replacementCardCount: input.replacementCardCount,
      installedIceCount: input.installedIceCount,
      installedRootCount: input.installedRootCount,
    },
    { surface: "public_event", family: "run_window_sequence" },
  );
}
