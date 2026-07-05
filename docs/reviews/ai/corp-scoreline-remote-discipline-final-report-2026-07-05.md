# Corp Scoreline Remote Discipline Final Report 2026-07-05

## Ergebnis

Die sechs freigegebenen Fehlergruppen aus `match_a7da2e5a06516b81` sind im Arbeitsbranch `codex/ai-scoreline-remote-discipline` umgesetzt.

Die Änderung bleibt auf die Corp Semantic Runtime und fokussierte AI-Tests begrenzt. Es gibt keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness-, Kartenpool- oder Hidden-Info-Vertragsänderung.

## Analysiertes Match

- Match: `match_a7da2e5a06516b81`
- Mode: `human_runner_vs_corp_ai`
- Corp-KI: `corp-ai-v0.9-hard`
- Speicher: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Evidence-Artefakt: `docs/reviews/ai/corp-scoreline-remote-discipline-evidence-2026-07-05.md`
- Einschränkung: `ai_decision_traces` hatte 0 Rows; Grundlage waren Snapshots, PublicEvents und `aiDecisionDebug` aus Events.

## Umgesetzte Anpassungen

### Aktive Remote-Agenda als Scoreline-Anker

`semantic-runtime-corp-score.ts` ergänzt `corp_active_remote_agenda_advance_clock`. Eine eigene sichtbare Agenda im Remote erhält damit einen mehrzügigen Advance-Anker, solange Funding nicht der empfohlene nächste Schritt ist und keine kritische Central-Gefahr Vorrang haben muss.

### Score-Remote-Reserve

`corp_active_score_remote_reserve_funding` bewertet Basic-Credit positiv, wenn eine aktive Remote-Agenda noch Advance- und relevante Rez-Reserve braucht. `corp_active_scoreline_off_path_spend` bestraft Install-/Rez-Aktionen außerhalb des aktiven Score-Remotes, wenn sie diese Reserve brechen.

### Remote-Pipeline statt Remote-Sprawl

`corp_existing_score_remote_pipeline` bevorzugt ein vorhandenes leeres, geicetes Scoring-Remote für Agenda-Installationen. `corp_remote_sprawl_penalty` bremst neue leere Remotes oder Neben-Remote-Entwicklung, solange diese Pipeline verfügbar ist.

### Negative Install-Deeskalation

`corp_low_value_install_defer` bremst Low-Value-Installationen, etwa zusätzliche zentrale ICE-Schichten ohne aktiven Triage-Bedarf. In der Board-Triage wird `recover_economy` außerdem strenger: nicht-economy `install_card`-Aktionen sind dort Mismatch.

### Central-Override enger gegated

Der kritische R&D-Override vor Remote-Scoring greift nur noch, wenn R&D wirklich unbeantworteten Schutzbedarf hat und eine konkrete zentrale Schutzaktion legal ist. Bereits wirksam geschütztes R&D darf aktive Scoreline-Remote-Pfade nicht mehr pauschal wegdrücken.

## Neue Regressionen

Ergänzte Tests in:

- `packages/ai/src/runtime/semantic-runtime-corp-score.test.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-board-triage.test.ts`

Abgedeckte Muster:

- Aktive `Tycho`-artige Agenda wird gegenüber Off-Path-Asset und fünftem R&D-ICE weiter advanced.
- Score-Remote-Reserve gewinnt gegen Off-Path-Rez.
- Vorbereitetes Remote wird gegenüber neuer leerer Remote genutzt.
- Low-Value-Central-Overice verliert gegen Funding.
- Kritische R&D-Signale überstimmen aktive Scoreline nicht, wenn R&D bereits effektive Stop-ICE hat.
- Gegenprobe bleibt erhalten: offenes/ungeschütztes kritisches R&D darf Remote-Protection weiterhin überstimmen.

## Verifikation

Gelaufen im Worktree `C:\Projekte\NETGRID_AI_scoreline_remote_discipline`:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-board-triage.test.ts src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose`
  - Ergebnis: 2 Dateien, 71 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`
  - Ergebnis: grün.
- `git diff --check`
  - Ergebnis: grün.

## Grenzen und Nicht-Ziele

- Keine Replay-Neuberechnung des analysierten Matches, weil die Runtime-Daten lokale Spielhistorie sind.
- Kein 100-Spiele-Benchmark in diesem Paket; die fokussierten Unit-Regressionen decken die konkrete Fehlergruppe ab.
- Keine Decklistenänderung an `Tycho Ice Stack`; das beobachtete Problem war eine Runtime-Priorisierung.
- Kein Monatslog-Eintrag in diesem Branch, weil der Hauptworkspace-Log `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md` bereits vor Beginn uncommitted verändert war und nicht überschrieben werden soll.

## Integrationsstatus

Arbeitsbranch ist nach den finalen Checks bereit für den lokalen Merge nach `main`, sofern der Hauptworkspace keine uncommitted Überschneidungen mit den Branch-Dateien hat.
