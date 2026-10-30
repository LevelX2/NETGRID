import type { AiDecisionInput } from "@netgrid/shared";
import { quoteAgendaDefinitionSelfStealCreditCost } from "@netgrid/engine";
import { expect } from "vitest";

/** Explicit synthetic companions of old captures: their public board has no
 * steal-cost modifier. These assignments model the current Engine contract;
 * the original native files and their validation hashes remain unchanged.
 * Never use this setup to repair productive inputs or active-run snapshots. */
export function bindExplicitZeroPublicStealQuotes(
  input: AiDecisionInput,
  expectedRezzedInstalledDefinitions: readonly string[],
): void {
  expect(input.playerView.run).toBeUndefined();
  const rezzed = input.playerView.servers
    .filter((s) => s.id !== "archives")
    .flatMap((s) =>
      s.root.filter((c) => c.known && c.rezzed).map((c) => c.definitionId),
    );
  expect(rezzed.slice().sort()).toEqual(
    expectedRezzedInstalledDefinitions.slice().sort(),
  );
  // The callers explicitly pin either no installed source or Olivia Salazar,
  // Chester Mix or BBS; their canonical effects discount installation/rez or
  // provide income and add no agenda steal fee.
  expect(
    rezzed.every((id) =>
      [
        "onr_v1_363_olivia-salazar",
        "onr_v1_352_chester-mix",
        "onr_v1_309_bbs-whispering-campaign",
      ].includes(id!),
    ),
  ).toBe(true);
  for (const server of input.playerView.servers) {
    server.runnerAgendaStealCostQuote = {
      stateVersion: input.playerView.stateVersion,
      serverId: server.id,
      minimumCreditCost: 0,
      complete: true,
    };
    for (const card of server.root.filter(
      (c) => c.known && c.type === "agenda",
    )) {
      expect(card.definitionId).toBeDefined();
      const selfCost = quoteAgendaDefinitionSelfStealCreditCost(
        card.definitionId!,
        server.id,
      );
      expect(Number.isSafeInteger(selfCost)).toBe(true);
      if (selfCost === undefined)
        throw new Error("missing_canonical_fixture_self_steal_cost");
      card.effectiveStealCostQuote = {
        stateVersion: input.playerView.stateVersion,
        serverId: server.id,
        agendaInstanceId: card.instanceId,
        creditCost: selfCost,
        complete: true,
      };
    }
  }
}
