# S01 Test Matrix

Status: frozen_for_implementation
Stand: 2026-05-03

| ID | Bereich | Abdeckung |
|---|---|---|
| S01-T001 | Server Result | Runner-Sieg erzeugt `winner`, `finished`, finalen StateHash und `GameResultSummary`. |
| S01-T002 | Perspektive | Actor sieht `viewerOutcome: won`; Gegenseite sieht `viewerOutcome: lost`. |
| S01-T003 | Statistik | Runs, erfolgreiche Runs, gestohlene und gescorte Agendas werden aus Eventdaten aggregiert. |
| S01-T004 | Spielziel | Matchsettings speichern `rules_match` default und akzeptieren `single_game`. |
| S01-T005 | UI Modal | Browserseite enthält `GameOverModal`, Ergebnistext und ResultSummary-Bindung. |
| S01-T006 | Audio | Browserseite enthält `AudioSettings` und `playResultSound` ohne Engine-Import. |
| S01-T007 | Visibility | ResultSummary enthält keine `cardInstances`, Tokens oder private Payloads. |
| S01-T008 | Regression | Projektweite Checks bleiben grün. |
