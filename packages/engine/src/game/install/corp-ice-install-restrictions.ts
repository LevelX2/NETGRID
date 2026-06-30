import type { CardDefinition, CorpServer, ServerId } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

type CorpIceInstallTarget = Pick<CorpServer, "id" | "kind"> | {
  id: Extract<ServerId, "new_remote">;
  kind: "remote";
};

export function canInstallCorpIceInServer(
  definition: CardDefinition,
  target: CorpIceInstallTarget,
): boolean {
  if (definition.type !== "ice") return false;
  const installCapabilities =
    cardImplementationForDefinitionId(definition.id)?.installCapabilities ?? [];
  for (const capability of installCapabilities) {
    if (capability.kind === "install_not_on_archives" && target.id === "archives")
      return false;
    if (capability.kind === "install_only_in_hq" && target.id !== "hq")
      return false;
    if (
      capability.kind === "install_only_in_hq_or_rd" &&
      target.id !== "hq" &&
      target.id !== "rd"
    )
      return false;
    if (
      capability.kind === "install_only_inside_subsidiary_data_fort" &&
      target.kind !== "remote"
    )
      return false;
  }
  return true;
}

export function assertCorpIceInstallAllowed(
  definition: CardDefinition,
  target: CorpIceInstallTarget,
): void {
  if (!canInstallCorpIceInServer(definition, target))
    throw new Error("Dieses ICE darf nicht auf diesem Fort installiert werden.");
}
