import { CorpEconomyNeedSignal } from "../corp/economy/economy-types";
import type {
  CorpCentralDefenseAllocation,
  CorpCentralDefenseHqHoldCadence,
} from "../runtime/corp-central-defense-allocation";
import { CorpDefenseSignal } from "./corp-defense-contracts";
import type { CorpRemoteProjectSignal } from "../corp/scoring-remote/scoring-remote-types";
import { CorpScoreProjectSignal } from "./corp-score-contracts";

export type CorpCorePlanDomain = {
  scoreProjects: CorpScoreProjectSignal[];
  remoteProjects: CorpRemoteProjectSignal[];
  defenseNeeds: CorpDefenseSignal[];
  centralDefenseAllocation?: CorpCentralDefenseAllocation;
  centralDefenseHqHoldCadence?: CorpCentralDefenseHqHoldCadence;
  centralDefenseHqHoldSelection?: {
    selectedActionId: string;
    sourceCardInstanceId: string;
    selectedAtStateVersion: number;
    targetServerId: "rd";
  };
  economyNeeds: CorpEconomyNeedSignal[];
};

export type ScoreState = { kind: "score"; signal: CorpScoreProjectSignal };

export type RemoteState = { kind: "remote"; signal: CorpRemoteProjectSignal };

export type DefenseState = {
  kind: "defense";
  signals: CorpDefenseSignal[];
  centralAllocation?: CorpCentralDefenseAllocation;
  hqHoldCadence?: CorpCentralDefenseHqHoldCadence;
  hqHoldSelection?: NonNullable<
    CorpCorePlanDomain["centralDefenseHqHoldSelection"]
  >;
};
