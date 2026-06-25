# AI Replay AB44 Corp Fixes Final Report 2026-06-25

Status: ready_for_local_main_merge

## Analysiertes Spiel

- Match-ID: `match_ab44ac886c5dbf49`
- Speicherort: `data/runtime/multiplayer/netgrid.sqlite`
- Auswahlregel: letztes abgeschlossenes Match nach `matches.updated_at DESC`
- Modus: `human_runner_vs_corp_ai`
- KI-Seite: Corp
- Ergebnis: Runner gewann durch Agenda-Punkte
- Umfang: 512 Events, 512 State-Snapshots, 213 AI-Decision-Traces

Die Analyse und Umsetzung nutzten nur sichtbare `PlayerView`-, `LegalActions`-, PublicEvent- und redigierte AI-Trace-Daten. Es wurden keine FullState- oder Hidden-Info-Signale in die KI-Bewertung eingebaut.

## Fehlergruppen

### 1. HQ-Sicherheit durch unrezzbares ICE überschätzt

Die Corp installierte zentrale Schutz-ICE, konnte diese im relevanten HQ-Run aber nicht rezzen. Dadurch wurde Agenda-Exposure im HQ zu schwach bewertet.

Umsetzung:

- neue zentrale Rez-Reserve-Bewertung fuer HQ/R&D/Archives;
- Penalty fuer zentrale ICE-Installationen, wenn nach der Aktion die Rez-Kante nicht finanzierbar ist und Agenda-Exposure besteht;
- Economy/Draw-Fallbacks, wenn eine zentrale Rez-Floor-Finanzierung akut fehlt.

### 2. Unsichere Score-Windows in contestable Remotes

Die Corp installierte und advancete `Corporate War` in Remotes, die formal ICE hatten, aber durch sichtbare Runner-Credits und Breaker brechbar waren. Die Agenda blieb danach bis zum Runner-Zug stehlbar.

Umsetzung:

- Remote-Contestability-Assessment fuer Corp-Scorelines;
- `score_window_contestable` als Tactical-Plan-Blocker;
- harte Penalties fuer nicht sofort scorebare Scoreline-Install-/Advance-Aktionen in sichtbar contestable Remotes.

### 3. Contestable Remote-Root-Assets zu positiv

Persistent Tag-/Root-Assets wurden aufgebaut, obwohl die Remote praktisch contestable war. `ice.length > 0` reichte als Schutzsignal nicht.

Umsetzung:

- Tag-Asset-Setup-Penalty bezieht Remote-Contestability ein;
- contestable Root-Setups erhalten eine eigene Debug-Komponente;
- bestehende unprotected-Remote-Logik bleibt erhalten.

### 4. Tag-Payoffs nach erfolgreichem Tag nicht genutzt

Nach erfolgreichen Tags waren `Closed Accounts`, Hardware-Trash und Resource-Trash legal, wurden aber zugunsten von Basiscredit oder BBS-Economy liegen gelassen.

Umsetzung:

- generische `corp_tagged_runner_payoff_pressure` fuer wirtschaftliche Payoffs, Hardware-Trash und Resource-Trash;
- `corp_tagged_payoff_window_passive_penalty` fuer passive Economy/Draw/Setup-Aktionen, solange ein sichtbarer Payoff legal ist;
- sichtbare Runner-Resource-Credit-Banks mit gespeicherten Bits/Credits werden als hochwertige Trash-Ziele erkannt.

### 5. Tag-Source-Folgeplanung zu schwach

Tag-Quellen wurden nicht ausreichend als Sequenz "Tag erzeugen -> Payoff nutzen" fortgefuehrt.

Umsetzung:

- Tag-Source-Auswahl mit sichtbarem Payoff bleibt als Evidence-Spur erhalten;
- Payoff-Aktionen gegen getaggte Runner tragen `corp_tagged_payoff_followup_plan:active`;
- bestehende Tag-Punish-Funding- und Slow-Setup-Logik sieht neue unmittelbare Payoffs.

## Nicht umgesetzt

- `Schlaghund` und `Scorched Earth` wurden nicht erzwungen oder speziell bewertet, weil sie in den relevanten Replay-Fenstern nicht als LegalActions vorlagen.
- Es wurde keine Engine-Legalitaet erweitert und keine neue LegalAction erzeugt.
- Es wurden keine kartennamenspezifischen Sonderpfade fuer `Corporate War`, `City Surveillance`, `Broker` oder `R&D Interface` eingebaut.

## Geaenderte Artefakte

- `packages/ai/src/index.ts`
- `packages/ai/src/tactical-plans.ts`
- `packages/ai/src/plans/tactical-plan-types.ts`
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`
- `packages/ai/src/tactical-plans.test.ts`
- `docs/architecture/ai/ai-replay-ab44-corp-fixes-process-2026-06-25.md`
- `docs/reviews/ai/ai-replay-ab44-corp-fixes-evidence-2026-06-25.md`
- `docs/reviews/ai/ai-replay-ab44-corp-fixes-final-report-2026-06-25.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`

Die Skill-Ergaenzung liegt ausserhalb des Repos unter `C:\Users\Lui\.codex\skills\netgrid-ai-spielanalyse-worktree\SKILL.md`.

## Checks

Vor dem lokalen Main-Merge im Worktree erfolgreich:

- `corepack pnpm exec vitest run packages/ai/src/semantic-ai-runtime-cutover.test.ts packages/ai/src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm exec vitest run packages/ai/src/semantic-ai-runtime-cutover.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Ergebnis

Der Arbeitsbranch `codex/ai-replay-ab44-corp-fixes` enthaelt die freigegebenen AI-Fixes als sequenzielle Paket-Commits. Der Stand ist bereit fuer die lokale Integration nach `main`.
