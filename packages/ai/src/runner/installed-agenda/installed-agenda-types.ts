export type RunnerInstalledAgendaScoreSignal = {
  opportunityId: string;
  sourceCardInstanceId: string;
  actionIds: string[];
  observedAtStateVersion: number;
  agendaPoints: number;
  terminal: boolean;
  evidenceCode: string;
};

export type InstalledAgendaScoreState = {
  kind: "installed_agenda_score";
  phase: "score_installed_agenda";
  signal: RunnerInstalledAgendaScoreSignal;
};
