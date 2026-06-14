import type { LegalAction } from "@netgrid/shared";
import { sanitizePayloadForSurface } from "../../view/surface-policy";

export type RunWindowSequencePayloadValue = string | number | boolean;
export type RunWindowSequencePayloadPatch = Record<
  string,
  RunWindowSequencePayloadValue
>;

export function applyRunWindowPayloadPatch(
  legalAction: LegalAction,
  payloadPatch: RunWindowSequencePayloadPatch,
): NonNullable<LegalAction["payload"]> {
  const sanitizedPatch = sanitizePayloadForSurface(payloadPatch, {
    surface: "public_event",
    family: "run_window_sequence",
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...sanitizedPatch,
  };
  return legalAction.payload;
}
