export type CorpVirusPressureSignal = {
  pressureId: string;
  actionId: string;
  stateVersion: number;
  actionCost: number;
  virusCounters: number;
  strategicDamage: number;
  critical: boolean;
  purgeUseful: boolean;
  evidenceCode: string;
};

export type VirusState = { kind: "virus"; signal: CorpVirusPressureSignal };
