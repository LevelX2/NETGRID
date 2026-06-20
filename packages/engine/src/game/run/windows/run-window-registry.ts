import type { CorpServer, GameState, LegalAction } from "@netgrid/shared";
import {
  buildCorpFortPassWindowActions,
  buildSingaporeCityGridRunActions,
  buildStartRunIceRepositionActions,
  type FortPassWindowHost,
} from "../fort-pass-window";

type ActiveRun = NonNullable<GameState["run"]>;

export type RunWindowId = "corp_root_rez_window" | "corp_fort_pass_window";

export type RunWindowActionResolver = {
  id: string;
  window: RunWindowId;
  buildActions: (context: {
    host: FortPassWindowHost;
    run: ActiveRun;
    server: CorpServer;
  }) => LegalAction[];
};

export const RUN_WINDOW_ACTION_RESOLVERS: readonly RunWindowActionResolver[] = [
  {
    id: "singapore_city_grid_fort_ice_swap",
    window: "corp_root_rez_window",
    buildActions: ({ host, run, server }) =>
      buildSingaporeCityGridRunActions(host, run, server),
  },
  {
    id: "start_run_ice_reposition",
    window: "corp_root_rez_window",
    buildActions: ({ host, run, server }) =>
      buildStartRunIceRepositionActions(host, run, server),
  },
  {
    id: "fort_pass_advancement_after_passing_last_ice",
    window: "corp_fort_pass_window",
    buildActions: ({ host }) => buildCorpFortPassWindowActions(host),
  },
];

export function buildRegisteredRunWindowActions(
  host: FortPassWindowHost,
  run: ActiveRun,
  server: CorpServer,
  window: RunWindowId,
): LegalAction[] {
  return RUN_WINDOW_ACTION_RESOLVERS.filter(
    (resolver) => resolver.window === window,
  ).flatMap((resolver) => resolver.buildActions({ host, run, server }));
}
