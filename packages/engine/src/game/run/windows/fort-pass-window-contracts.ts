import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  ServerId,
} from "@netgrid/shared";

/** Shared port kept below both fort-pass and rez-window implementations. */
export type FortPassWindowHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    publicInstalledCorpCardIdentityKnown: (cardId: CardInstanceId) => boolean;
  };
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
  };
  payment: {
    spendCorpCredits: (amount: number) => void;
  };
};
