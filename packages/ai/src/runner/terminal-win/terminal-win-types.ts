export type RunnerTerminalWinSignal = {
  terminalId: string;
  semanticActionTypes: string[];
  actionIds?: string[];
  terminalCondition?:
    | "corp_empty_rd_mandatory_draw"
    | "runner_immediate_agenda_point";
  evidenceCode: string;
};

export type TerminalWinState = {
  kind: "terminal_win";
  signal: RunnerTerminalWinSignal;
};
