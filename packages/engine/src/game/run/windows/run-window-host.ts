import type { CorpServer, GameState, ServerId } from "@netgrid/shared";

export type ActiveRun = NonNullable<GameState["run"]>;

export type RunWindowHost = {
  state: GameState;
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
  };
};

export type RunWindowTimingContext = {
  run: ActiveRun;
  server: CorpServer;
};
