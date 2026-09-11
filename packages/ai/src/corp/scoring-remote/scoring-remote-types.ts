import type {
  RemoteDoctrineProfile,
  RemoteProtectionTarget,
  RemotePurpose,
} from "../../remote-doctrine-profile";
import type { CorpRemoteMaturityAssessment } from "../../runtime/corp-remote-maturity-assessment";
export const STRATEGIC_SCORE_REMOTE_PROJECT_ID =
  "strategic-score-remote" as const;

export type CorpRemoteProjectNeed = Readonly<{
  needId: string;
  parentProjectId: typeof STRATEGIC_SCORE_REMOTE_PROJECT_ID;
  targetServerId: string;
  observedAtStateVersion: number;
  capability: "improve_remote_protection_path" | "credits";
  minimum: number;
}>;

export type ScoreConsumerSupportState =
  | Readonly<{ kind: "executable" }>
  | Readonly<{
      kind: "awaiting_remote_protection";
      agendaInstanceId: string;
      targetServerId: string;
      protectionNeedId: string;
    }>
  | Readonly<{
      kind: "awaiting_funding";
      parentNeedId: string;
      targetCredits: number;
    }>
  | Readonly<{
      kind: "replan_required";
      reasonCode: string;
    }>;

export type ScoreConsumer = Readonly<{
  projectId: string;
  serverId?: string;
  agendaInstanceId?: string;
  protectionNeed?: unknown;
  fundingGap?: number;
  fundingMilestone?: Readonly<{ targetCredits?: number }>;
  feasible?: boolean;
}>;

export type CorpRemoteProjectSignal = Readonly<{
  projectId: typeof STRATEGIC_SCORE_REMOTE_PROJECT_ID;
  purpose: "scoring_remote";
  purposes: readonly RemotePurpose[];
  target: Readonly<{
    status: "unbound" | "bound";
    serverId: string;
    targetBindingRevision: number;
  }>;
  serverId: string;
  protectionTarget: RemoteProtectionTarget;
  buildTiming: RemoteDoctrineProfile["buildTiming"];
  targetRecoveryTurns: number;
  phase:
    | "harden_to_protection_target"
    | "fund_rez_path"
    | "payload_ready"
    | "leased_to_score_project"
    | "assessment_unknown";
  maturity: CorpRemoteMaturityAssessment;
  need?: CorpRemoteProjectNeed;
  consumerSupport?: ScoreConsumerSupportState;
  scoreLeaseId?: string;
  cadence: Readonly<{
    turnKey: string;
    maximumActions: number;
    actionsUsed: number;
    open: boolean;
  }>;
  feasible: boolean;
  value: number;
  evidenceCode: string;
}>;

export type CorpRemoteOccupancyClaim = Readonly<{
  serverId: string;
  owner: "score" | "economy" | "ambush";
  ownerId: string;
}>;
