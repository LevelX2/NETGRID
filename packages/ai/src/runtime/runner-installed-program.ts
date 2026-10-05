import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { VisibleCard } from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

import { type AiDecisionInput } from "@netgrid/shared";

export function runnerHasInstalledPrograms(input: AiDecisionInput): boolean {
  const rig = input.playerView.own.rig;
  if (!rig) return false;
  if (!Array.isArray(rig)) return false;
  return rig.some((card) => card.type === "program");
}

/** Visible own-rig facts for the Engine's recursive program-trash lifecycle. */
export function runnerInstalledProgramTrashLoss(
  input: AiDecisionInput,
  card: VisibleCard | undefined,
  printedMemoryCost: (card: VisibleCard) => number,
): { cards: VisibleCard[]; memoryCost: number } {
  const rig = input.playerView.own.rig ?? [];
  const byId = new Map(rig.map((entry) => [entry.instanceId, entry]));
  const fail = (reason: string, missingDefinition = false): never => {
    throw new PlanResolutionFailure(
      missingDefinition
        ? "missing_card_definition"
        : "invalid_player_view_card_projection",
      {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        owner: "rules_contract",
        removalCondition: `runner_installed_program_host_graph: ${reason}`,
      },
    );
  };
  if (byId.size !== rig.length) fail("Own rig instance IDs must be unique.");
  if (
    !card ||
    !byId.get(card.instanceId)?.known ||
    byId.get(card.instanceId)?.type !== "program"
  )
    fail(
      "A program-trash candidate must bind an actual known own installed program.",
    );
  const root = byId.get(card!.instanceId)!;
  const ancestors = new Set([root.instanceId]);
  let current = root;
  while (current.hostedOn) {
    if (ancestors.has(current.hostedOn))
      fail("Own installed program hosting is cyclic.");
    const host = byId.get(current.hostedOn);
    if (!host?.known)
      fail("An installed program's host must bind a known own rig card.");
    ancestors.add(host!.instanceId);
    current = host!;
  }
  const cards: VisibleCard[] = [];
  const visiting = new Set<string>();
  const visit = (entry: VisibleCard): void => {
    if (visiting.has(entry.instanceId))
      fail("Own installed program hosting is cyclic.");
    if (!entry.known)
      fail("A program lost with its host must be known in the own rig.");
    visiting.add(entry.instanceId);
    cards.push(entry);
    for (const child of rig) {
      if (child.type === "program" && child.hostedOn === entry.instanceId)
        visit(child);
    }
    visiting.delete(entry.instanceId);
  };
  visit(root);
  let memoryCost = printedMemoryCost(root);
  if (!Number.isSafeInteger(memoryCost) || memoryCost < 0)
    fail("Installed program MU must be a nonnegative integer.");
  if (root.hostedOn) {
    const host = byId.get(root.hostedOn)!;
    const spec = host.definitionId
      ? cardSpecPlanningCardByDefinitionId(host.definitionId)
      : undefined;
    if (!spec) fail("A bound program host needs its canonical CardSpec.", true);
    const daemon =
      spec!.definition.type === "program" &&
      spec!.definition.subtypes?.some(
        (subtype) => subtype.toLowerCase().replaceAll("-", "_") === "daemon",
      );
    const replacesTrashWithHosting =
      spec!.planning.engine.runnerUtilityLongtail?.kind ===
      "replace_installed_program_trash_with_host_on_source";
    if (daemon || replacesTrashWithHosting) memoryCost = 0;
  }
  // Current Engine memory choices quote the selectable program's own MU.
  // Descendants affect the loss value; their printed MU is never invented as
  // additional selectable capacity for this candidate.
  return { cards, memoryCost };
}
