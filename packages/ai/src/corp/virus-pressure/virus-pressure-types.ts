export type CorpVirusPressureSignal = {
  pressureId: string;
  virusCounters: number;
  strategicDamage: number;
  critical: boolean;
  purgeUseful: boolean;
  evidenceCode: string;
};

export type VirusState = { kind: "virus"; signal: CorpVirusPressureSignal };
