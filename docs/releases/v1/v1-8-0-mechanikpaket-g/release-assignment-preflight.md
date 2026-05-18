# V1.8.0 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen (Requirements-Freeze Eingang)

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- `docs/releases/v1/v1-7-1-mechanikpaket-e/plan-to-v1-8-1.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`

## Ergebnis

- Geplanter V1.8.0-Korb laut Matrix: 13 Karten
- Als V1.8.0-Kern implementiert: 6 Karten
- Deferred in V1.8.0: 7 Karten

## Kernkorb (freigabefähig)

1. `onr_v1_083_desperate-competitor`
2. `onr_v1_090_hot-tip-for-wns`
3. `onr_v1_156_corporate-ally`
4. `onr_v1_159_databroker`
5. `onr_v1_201_executive-extraction`
6. `onr_v1_214_project-babylon`

## Freigabe-Matrix je Karte

| Nr | CardId | Name | Entscheidung | Begründung |
| --- | --- | --- | --- | --- |
| 025 | onr_v1_025_fait-accompli | Fait Accompli | deferred | Explizite Counter-/Virus-/Purge-Abhängigkeit zu `V1.8.1` laut Detailplanung. |
| 083 | onr_v1_083_desperate-competitor | Desperate Competitor | freigabefähig | Agenda-/Scored-Static-Kernpfad ohne zusätzliche Counter-Pflichtmechanik. |
| 090 | onr_v1_090_hot-tip-for-wns | Hot Tip for WNS | freigabefähig | Agenda-/Scored-Static-Kernpfad ohne zusätzliche Counter-Pflichtmechanik. |
| 156 | onr_v1_156_corporate-ally | Corporate Ally | freigabefähig | Agenda-Difficulty-Modifier plus Runner-Installkostenpfad im V1.8.0-Scope. |
| 159 | onr_v1_159_databroker | Databroker | freigabefähig | Agenda-Point-to-Credits-Action als deterministischer Agenda-/ScoreArea-Kernpfad. |
| 201 | onr_v1_201_executive-extraction | Executive Extraction | freigabefähig | Scored-Agenda-Static (Gray Ops Difficulty -1) ohne Counterpflicht. |
| 214 | onr_v1_214_project-babylon | Project Babylon | freigabefähig | Overadvance-basierte Zusatzpunkte beim Scoren im V1.8.0-Scope. |
| 291 | onr_v1_291_falsified-transactions-expert | Falsified-Transactions Expert | deferred | Zusätzliche Counter-Abhängigkeit zu `V1.8.1` laut Detailplanung. |
| 292 | onr_v1_292_management-shake-up | Management Shake-Up | deferred | Zusätzliche Counter-Abhängigkeit zu `V1.8.1` laut Detailplanung. |
| 300 | onr_v1_300_project-consultants | Project Consultants | deferred | Zusätzliche Counter-Abhängigkeit zu `V1.8.1` laut Detailplanung. |
| 303 | onr_v1_303_silver-lining-recovery-protocol | Silver Lining Recovery Protocol | deferred | Zusätzliche Counter-Abhängigkeit zu `V1.8.1` laut Detailplanung. |
| 304 | onr_v1_304_systematic-layoffs | Systematic Layoffs | deferred | Zusätzliche Counter-Abhängigkeit zu `V1.8.1` laut Detailplanung. |
| 305 | onr_v1_305_team-restructuring | Team Restructuring | deferred | Zusätzliche Counter-Abhängigkeit zu `V1.8.1` laut Detailplanung. |

## Deferred-Regel

Karten außerhalb des 6er-Kernkorbs bleiben in V1.8.0 deferred, wenn mindestens eine Bedingung gilt:

- zusätzliche Abhängigkeit zu `L2_Counter_System_und_Virus_Purge_Trigger` (`V1.8.1`)
- damit verbundene Trigger-/Counter-Lifecycles außerhalb des V1.8.0-Agenda-/Scored-Static-Kernkorridors

