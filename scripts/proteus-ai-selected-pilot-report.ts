export type ProteusPilotTerminationKind =
  | "game_result"
  | "action_limit"
  | "runtime_failure";

export function proteusPilotTerminationTotals(
  games: readonly { terminationKind: ProteusPilotTerminationKind }[],
): {
  completedGames: number;
  actionLimitGames: number;
  runtimeFailureGames: number;
} {
  const completedGames = games.filter(
    (game) => game.terminationKind === "game_result",
  ).length;
  const actionLimitGames = games.filter(
    (game) => game.terminationKind === "action_limit",
  ).length;
  const runtimeFailureGames = games.filter(
    (game) => game.terminationKind === "runtime_failure",
  ).length;
  if (
    completedGames + actionLimitGames + runtimeFailureGames !==
    games.length
  ) {
    throw new Error("Proteus pilot termination totals are incomplete.");
  }
  return {
    completedGames,
    actionLimitGames,
    runtimeFailureGames,
  };
}
