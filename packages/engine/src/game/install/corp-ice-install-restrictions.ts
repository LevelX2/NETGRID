import type { CardDefinition, CorpServer, ServerId } from "@netgrid/shared";
import type { CardInstallCapabilityImplementation } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

type CorpIceInstallTarget =
  | Pick<CorpServer, "id" | "kind">
  | {
      id: Extract<ServerId, "new_remote">;
      kind: "remote";
    };

type CorpIcePlacementRestriction = Extract<
  CardInstallCapabilityImplementation,
  {
    kind:
      | "install_not_on_archives"
      | "install_only_in_hq"
      | "install_only_in_hq_or_rd"
      | "install_only_inside_subsidiary_data_fort";
  }
>;

export function canInstallCorpIceInServer(
  definition: CardDefinition,
  target: CorpIceInstallTarget,
): boolean {
  if (definition.type !== "ice") return false;
  const installCapabilities =
    cardImplementationForDefinitionId(definition.id)?.installCapabilities ?? [];
  for (const capability of installCapabilities) {
    const restriction = corpIcePlacementRestriction(capability);
    if (restriction && !corpIcePlacementRestrictionAllows(restriction, target))
      return false;
  }
  return true;
}

export function assertCorpIceInstallAllowed(
  definition: CardDefinition,
  target: CorpIceInstallTarget,
): void {
  if (!canInstallCorpIceInServer(definition, target))
    throw new Error(
      `corp_ice_install_restriction_violation: ${definition.id}:${target.id}`,
    );
}

// Evaluates only static Corp ICE placement restrictions. Costs, server
// creation, uniqueness, rez effects, and replacement rules remain elsewhere.
function corpIcePlacementRestriction(
  capability: CardInstallCapabilityImplementation,
): CorpIcePlacementRestriction | undefined {
  switch (capability.kind) {
    case "install_not_on_archives":
    case "install_only_in_hq":
    case "install_only_in_hq_or_rd":
    case "install_only_inside_subsidiary_data_fort":
      return capability;
    case "rez_on_install":
    case "runner_made_successful_run_on_server_this_turn":
      return undefined;
    default:
      return assertNever(capability);
  }
}

function corpIcePlacementRestrictionAllows(
  restriction: CorpIcePlacementRestriction,
  target: CorpIceInstallTarget,
): boolean {
  switch (restriction.kind) {
    case "install_not_on_archives":
      return target.id !== "archives";
    case "install_only_in_hq":
      return target.id === "hq";
    case "install_only_in_hq_or_rd":
      return target.id === "hq" || target.id === "rd";
    case "install_only_inside_subsidiary_data_fort":
      return target.kind === "remote";
    default:
      return assertNever(restriction);
  }
}

function assertNever(value: never): never {
  throw new Error(
    `unsupported_corp_ice_install_capability: ${JSON.stringify(value)}`,
  );
}
