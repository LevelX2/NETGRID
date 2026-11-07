import type { AiDecisionInput } from "@netgrid/shared";
import { expect } from "vitest";

/** Declare exact current costs for a hand-built board; never infer missing facts
 * in a captured input. The fixture author supplies every known agenda's cost. */
export function bindSyntheticAgendaStealQuotes(
  input: AiDecisionInput,
  serverId: string,
  minimumCreditCost: number,
  agendaCreditCosts: Readonly<Record<string, number>>,
): void {
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  )!;
  expect(server).toBeDefined();
  const agendas = server.root.filter(
    (card) => card.known && card.type === "agenda",
  );
  expect(agendas.map((card) => card.instanceId).sort()).toEqual(
    Object.keys(agendaCreditCosts).sort(),
  );
  server.runnerAgendaStealCostQuote = {
    stateVersion: input.playerView.stateVersion,
    serverId: server.id,
    minimumCreditCost,
    complete: true,
  };
  for (const agenda of agendas) {
    agenda.effectiveStealCostQuote = {
      stateVersion: input.playerView.stateVersion,
      serverId: server.id,
      agendaInstanceId: agenda.instanceId,
      creditCost: agendaCreditCosts[agenda.instanceId]!,
      complete: true,
    };
  }
}
