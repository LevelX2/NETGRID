/** Declarative typed port implemented by run-flow-runtime-hosts.ts. */
import type {
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import type { StartRunOptions } from "../run/run-core-execution";

export type RunFlowRuntimePort = {
  startRun: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    pendingSuccessBonusCredits?: number,
    accessCount?: number,
    options?: StartRunOptions,
    legalAction?: LegalAction,
  ) => void;
  applyRunStartRandomStrengthBonus: (
    state: GameState,
    legalAction?: LegalAction,
  ) => void;
  continueRun: (state: GameState, legalAction?: LegalAction) => void;
  addCurrentRunAccessCount: (
    state: GameState,
    server: Extract<ServerId, "hq" | "rd">,
    amount: number,
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  passCurrentEncounteredIce: (
    state: GameState,
    legalAction: LegalAction,
    subtypeRequired?: "ap",
  ) => {
    publicPayload: Record<string, string | number | boolean>;
  };
  archivesAccessRequiresDecisionOrEffect: (
    state: GameState,
    cardId: CardInstanceId,
  ) => boolean;
};
