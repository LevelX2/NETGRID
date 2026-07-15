import type { AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type ChoiceOption = PendingChoice["options"][number];
type Server = AiDecisionInput["playerView"]["servers"][number];
type InstalledArea = "ice" | "root";

export type RunnerExposeInstalledPosition = {
  serverId: string;
  area: InstalledArea;
  index: number;
  hidden: boolean;
  advanced: boolean;
  exactExposed: boolean;
  legacyServerExposed: boolean;
};

export type RunnerExposeInstalledOpportunity = {
  positions: RunnerExposeInstalledPosition[];
  unseenPositions: RunnerExposeInstalledPosition[];
};

export function selectedRunnerExposeInstalledCardChoiceOptionIds(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: PendingChoice["options"],
): string[] | undefined {
  if (
    input.side !== "runner" ||
    choice.kind !== "select_cards" ||
    !choice.source.includes("expose_installed_card")
  ) {
    return undefined;
  }

  const history = exposeHistory(input);
  const ranked = selectableOptions
    .map((option, order) => {
      const position = optionPosition(input, option, history);
      return {
        option,
        order,
        score: position ? exposePositionScore(position) : -20_000,
      };
    })
    .sort(
      (left, right) => right.score - left.score || left.order - right.order,
    );
  const selectionCount = Math.min(
    choice.maxSelections,
    Math.max(choice.minSelections, 1),
  );
  return ranked.slice(0, selectionCount).map((entry) => entry.option.id);
}

export function runnerExposeInstalledOpportunity(
  input: AiDecisionInput,
): RunnerExposeInstalledOpportunity {
  const history = exposeHistory(input);
  const positions = input.playerView.servers.flatMap((server) => [
    ...installedPositions(server, "ice", history),
    ...installedPositions(server, "root", history),
  ]);
  return {
    positions,
    unseenPositions: positions.filter((position) => !position.exactExposed),
  };
}

function optionPosition(
  input: AiDecisionInput,
  option: ChoiceOption,
  history: ExposeHistory,
): RunnerExposeInstalledPosition | undefined {
  const visibleIds = new Set([
    option.id.startsWith("card_") ? option.id.slice("card_".length) : option.id,
    ...(typeof option.value === "string" ? [option.value] : []),
  ]);
  for (const server of input.playerView.servers) {
    for (const area of ["ice", "root"] as const) {
      const index = server[area].findIndex((card) =>
        visibleIds.has(card.instanceId),
      );
      if (index < 0) continue;
      return positionFor(server, area, index, history);
    }
  }
  return undefined;
}

function installedPositions(
  server: Server,
  area: InstalledArea,
  history: ExposeHistory,
): RunnerExposeInstalledPosition[] {
  return server[area].flatMap((card, index) => {
    if (card.rezzed === true || (card.known && card.definitionId)) return [];
    return [positionFor(server, area, index, history)];
  });
}

function positionFor(
  server: Server,
  area: InstalledArea,
  index: number,
  history: ExposeHistory,
): RunnerExposeInstalledPosition {
  const card = server[area][index]!;
  const key = positionKey(server.id, area, index);
  return {
    serverId: server.id,
    area,
    index,
    hidden: !card.known || !card.definitionId,
    advanced: (card.advancementCounters ?? 0) > 0,
    exactExposed: history.exactPositions.has(key),
    legacyServerExposed: history.legacyServers.has(server.id),
  };
}

function exposePositionScore(position: RunnerExposeInstalledPosition): number {
  let score = 0;
  if (position.serverId.startsWith("remote_") && position.area === "root")
    score += 1_000;
  else if (position.serverId.startsWith("remote_") && position.area === "ice")
    score += 550;
  else if (position.area === "ice") score += 250;
  else score += 100;
  if (position.advanced) score += 300;
  if (position.hidden) score += 50;
  if (position.legacyServerExposed) score -= 120;
  if (position.exactExposed) score -= 10_000;
  return score;
}

type ExposeHistory = {
  exactPositions: Set<string>;
  legacyServers: Set<string>;
};

function exposeHistory(input: AiDecisionInput): ExposeHistory {
  const exactPositions = new Set<string>();
  const legacyServers = new Set<string>();
  for (const event of [
    ...(input.playerView.publicEvents ?? []),
    ...(input.eventTail ?? []),
  ]) {
    const serverId = stringValue(event.publicPayload.exposedServerId);
    if (!serverId) continue;
    const area = stringValue(event.publicPayload.exposedArea);
    const index = numberValue(event.publicPayload.exposedIndex);
    if ((area === "ice" || area === "root") && index !== undefined) {
      exactPositions.add(positionKey(serverId, area, index));
    } else {
      legacyServers.add(serverId);
    }
  }
  return { exactPositions, legacyServers };
}

function positionKey(
  serverId: string,
  area: InstalledArea,
  index: number,
): string {
  return `${serverId}:${area}:${index}`;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}
