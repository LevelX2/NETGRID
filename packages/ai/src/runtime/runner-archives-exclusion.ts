import type { AiDecisionInput } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

type RunnerArchivesServer = AiDecisionInput["playerView"]["servers"][number];

export type RunnerArchivesExclusionDependencies = {
  definitionType: (definitionId: string) => string | undefined;
};

export function runnerArchivesExclusion(
  input: AiDecisionInput,
  server: RunnerArchivesServer | undefined,
  dependencies: RunnerArchivesExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  const root = server?.root ?? [];
  const knownRoot = root.filter(
    (card) => card.known && typeof card.definitionId === "string",
  );
  const knownAgenda = knownRoot.some((card) => {
    const definitionId = card.definitionId;
    return (
      card.type === "agenda" ||
      (definitionId !== undefined &&
        dependencies.definitionType(definitionId) === "agenda")
    );
  });
  const hiddenArchivesCount = Math.max(
    0,
    input.playerView.opponent.discardCount - knownRoot.length,
  );
  if (knownAgenda || hiddenArchivesCount > 0) return undefined;
  if (knownRoot.length === 0) {
    return {
      key: "archives_empty",
      label: "Archives leer",
      reason: "no_archives_cards",
    };
  }
  return {
    key: "archives_known_no_agenda",
    label: "Archives bekannt ohne Agenda",
    reason: `known_non_agenda:${knownRoot.length}`,
  };
}
