import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import type { buildLegalAction } from "../turn/action-builders";

type RunnerEventActionPayload = NonNullable<LegalAction["payload"]>;
export type RunnerEventResolver = {
  name: string;
  startsRun?: boolean;
  requiresServer?: boolean;
  canPlay?: (state: GameState) => boolean;
  canPlayForServer?: (state: GameState, serverId: ServerId) => boolean;
  actionPayload?: (input: {
    state: GameState;
    cardId: CardInstanceId;
    definition: CardDefinition;
  }) => RunnerEventActionPayload;
  legalActions?: (input: {
    state: GameState;
    cardId: CardInstanceId;
    definition: CardDefinition;
    buildAction: typeof buildLegalAction;
    clickCost: number;
    creditCost: number;
  }) => LegalAction[];
  resolve: (state: GameState, legalAction: LegalAction) => void;
};
