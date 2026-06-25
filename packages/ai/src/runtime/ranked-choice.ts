import type { LegalAction } from "@netgrid/shared";

export type RankedChoice = {
  action: LegalAction | undefined;
  reasonCode: string;
  explanation: string;
  score: number;
  evidence: string[];
  confidence?: number;
};
