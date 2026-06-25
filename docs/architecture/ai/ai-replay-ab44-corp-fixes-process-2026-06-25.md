# AI Replay AB44 Corp Fixes Process 2026-06-25

Status: done

Quelle/Vorgabe: Freigegebene Analyse des letzten gespeicherten Spiels `match_ab44ac886c5dbf49` aus `data/runtime/multiplayer/netgrid.sqlite`. Die Corp-KI verlor als Corp gegen den menschlichen Runner durch drei gestohlene `Corporate War`.

## Gesamtziel

Die eindeutigen Corp-KI-Fehler aus `match_ab44ac886c5dbf49` werden generisch und side-safe behoben: zentrale Rez-Reserve, contestable Remote-Score-Window, contestable Remote-Root-Assets, Tagged-Runner-Payoffs und Tag-Source-Folgeplanung. Der Arbeitsbranch wird lokal nach `main` integriert.

## Annahmen

- Die KI darf nur `PlayerView`, `LegalActions`, side-safe PublicEvents und redigierte Decision-Traces nutzen.
- Keine neue Engine-Legalität, keine neuen Kartenfreigaben und keine Hidden-Info-Projektion.
- `Schlaghund` und `Scorched Earth` waren im analysierten Spiel nicht als LegalActions sichtbar und bleiben außerhalb dieses Prozesses.
- Frühe fehlende Tag-Source-Boni im Replay gelten als bereits über spätere Traces/für den aktuellen Stand validiert, nicht als neuer Fixpunkt.

## Nicht-Ziele

- Keine Änderung an `applyAction`, StateHash, Replay-Format oder Zufallsmodell.
- Keine Kartennamen-Sonderlogik für exakt `Corporate War`, `City Surveillance`, `Broker` oder `R&D Interface`, wenn ein generischer Signalweg genügt.
- Kein Push und kein PR.

## Controller-Invarianten

- LegalActions bleiben einzige Aktionsbasis.
- Debug-Evidence darf keine verdeckten Zonen, FullState-Daten oder private Payloads leaken.
- Jede Paketänderung wird fokussiert getestet, mit `git diff --check` geprüft und separat committed.

## Paketfolge

### Paket 1: Preflight und Prozessartefakt

Ziel: Worktree, Branch und Prozesskontrakt dokumentieren.

Kernartefakte:

- `docs/architecture/ai/ai-replay-ab44-corp-fixes-process-2026-06-25.md`

Checks:

- `git status --short --branch`
- `git diff --check`

Done-Gate:

- Prozessartefakt committed.

Commit: `docs: add AI replay AB44 process`

### Paket 2: Spiel-Evidence und Fehlergruppen

Ziel: Analysebasis und freigegebene Fehlerpunkte dauerhaft dokumentieren.

Kernartefakte:

- `docs/reviews/ai/ai-replay-ab44-corp-fixes-evidence-2026-06-25.md`

Checks:

- `git diff --check`

Done-Gate:

- Evidence enthält Match-ID, Speicherort, Zugriffsmethode, Fehlergruppen und Nicht-Ziele.

Commit: `docs: record AI replay AB44 evidence`

### Paket 3: Remote-Safety und zentrale Rez-Reserve

Ziel: Scoreline-Installs/Advances in contestable Remotes und unrezzbare zentrale Schutz-ICE generisch schlechter bewerten.

Kernartefakte:

- `packages/ai/src/index.ts`
- `packages/ai/src/tactical-plans.ts`
- passende AI-Regressionstests

Checks:

- fokussierte Vitest-Regressionen
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Die KI bevorzugt Economy/Draw/Schutz statt nicht scorebarer Agenda-Entwicklung hinter sichtbar contestable Remote.
- Zentrale Schutz-ICE ohne Rez-Reserve zählen nicht als belastbarer Schutz, wenn Agenda-Exposure vorliegt.

Commit: `fix(ai): guard corp remote score and central rez safety`

### Paket 4: Tagged-Runner-Payoffs und Folgeplanung

Ziel: Sichtbare wirtschaftliche, Hardware- und Resource-Payoffs gegen getaggte Runner vor Economy/BBS bevorzugen und Tag-Source-Auswahl als Follow-up-Plan sichtbar machen.

Kernartefakte:

- `packages/ai/src/index.ts`
- `packages/ai/src/tactical-plans.ts`
- passende AI-Regressionstests

Checks:

- fokussierte Vitest-Regressionen
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- `Closed Accounts`, Hardware-Trash-Payoff und hochwertiger Resource-Trash gewinnen gegen Basiscredit/BBS, sobald der Runner sichtbar getaggt ist und der Payoff legal ist.
- Tag-Source-Entscheidungen erzeugen nachvollziehbare Plan-/Evidence-Spuren für anschließende Payoffs.

Commit: `fix(ai): prioritize tagged runner payoff windows`

### Paket 5: Abschlussdokumentation, Skill-Ergänzung und lokale Integration

Ziel: Final-Report, Wissenslog und Skill-Ergänzung schreiben, final verifizieren und lokal nach `main` mergen.

Kernartefakte:

- `docs/reviews/ai/ai-replay-ab44-corp-fixes-final-report-2026-06-25.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`
- `C:\Users\Lui\.codex\skills\netgrid-ai-spielanalyse-worktree\SKILL.md`

Checks:

- fokussierte Vitest-Regressionen
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- finaler `git status --short --branch`

Done-Gate:

- Arbeitsbranch ist lokal in `main` gemerged.
- Worktree ist sauber oder entfernt.
- Skill dokumentiert den konkreten lokalen Zugriff auf gespeicherte Spiele.

Commit: `docs: finalize AI replay AB44 fixes`

## Sicherheitsblocker

- Eine Umsetzung würde verdeckte Runner-Zonen oder FullState benötigen.
- LegalActions für den gewünschten Payoff fehlen.
- Tests zeigen eine Regression in Engine-Korrektheit, Side-Safety oder Replay.
- `main` ist am Integrationspunkt nicht kollisionsfrei mergebar.
