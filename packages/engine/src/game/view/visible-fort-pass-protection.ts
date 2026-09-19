import type { VisibleCard } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

/** Static rules facts for a visible source; installation still requires a LegalAction. */
export function visibleFortPassProtection(card: VisibleCard):
  | { complete: true; kind: "none" }
  | {
      complete: true;
      kind: "end_run_on_pass";
      dieFaces: number;
      endingFaces: number;
      activeOnInstall: boolean;
    }
  | { complete: false; reason: string } {
  if (!card.known || !card.definitionId)
    return { complete: false, reason: "unknown_fort_source" };
  const windows =
    cardImplementationForDefinitionId(card.definitionId)?.fortRunWindows ?? [];
  const effects = windows.filter(
    (window) => window.kind === "roll_die_on_pass_rezzed_ice_on_same_fort",
  );
  if (effects.length === 0) return { complete: true, kind: "none" };
  // The executable pass window rolls one d6 and ends on 1. Other contracts
  // require matching Engine support before a consumer may quote them.
  if (
    effects.length !== 1 ||
    effects[0]?.dieFaces !== 6 ||
    effects[0]?.endRunOn !== 1
  )
    return { complete: false, reason: "unsupported_pass_end_run_contract" };
  return {
    complete: true,
    kind: "end_run_on_pass",
    dieFaces: 6,
    endingFaces: 1,
    activeOnInstall: card.subtypes?.includes("region") === true,
  };
}
