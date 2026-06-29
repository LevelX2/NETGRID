# AI Endgame Scoreline and Dynamic ICE Process, 2026-06-29

## Status

- Branch: `codex/ai-endgame-scoreline`
- Worktree: `C:\Projekte\NETGRID_AI_ENDGAME_SCORELINE`
- Integrationsziel: lokaler `main`
- Umsetzung: verifiziert, lokale Main-Integration folgt, ohne Push/PR

## Quelle/Vorgabe

Freigegebene Umsetzung aus der Analyse des abgeschlossenen Matches `match_28b304f024323f9d`. Das Match endete mit Runner-Sieg über Agenda-Punkte, nachdem die Corp eine spielentscheidende Agenda in eine nur scheinbar sichere Remote legte.

## Gesamtziel

Die Corp-KI soll Endgame-Scorelines strenger bewerten, wenn der Runner vor dem Score noch eine Zugriffschance erhält. `temporary_safe` darf nur entstehen, wenn die konkrete Remote mit sichtbarem Runner-Board, realistischer Credit-Entwicklung, Corp-Rezreserve und wirksamer ICE-Sequenz tatsächlich contest-resistent genug ist. Dynamische ICE dürfen Sicherheit nur erzeugen, wenn sie in der konkreten Serverposition bezahlbar und relevant wirken.

## Annahmen

- Das analysierte Match wurde vor den zuletzt gemergten Fixes gespielt; die aktuelle Re-Evaluation zeigt aber, dass die Endgame-Scoreline weiterhin gewählt würde.
- Corp-eigene verdeckte ICE-Identität darf für Corp-Entscheidungen genutzt werden, aber nicht in öffentliche Debug-/Evidence-Kanäle gelangen.
- Verdeckte Runner-Hand, Runner-Stack und verdeckte Runner-Ressourcen bleiben unberücksichtigt.
- Runtime-Debug darf neue Gründe ausgeben, solange er keine verdeckten Corp-Kartenidentitäten in öffentliche oder gegnerseitige Kanäle trägt.

## Nicht-Ziele

- Keine neue Action-Erzeugung und kein Parallel-Planner.
- Keine Engine-Regeländerung an Agenda-, Run-, Rez- oder ICE-Auflösung.
- Keine Annahme, dass der Runner bestimmte Hidden-Hand-Events wie `Inside Job` hat.
- Kein generischer Remote-ICE-Spam und keine pauschale Abwertung aller Scorelines.
- Kein Push und keine PR-Erstellung.

## Controller-Invarianten

- Die KI wählt ausschließlich vorhandene `LegalActions`.
- `applyAction` bleibt die einzige Regelautorität.
- Neue Bewertungen nutzen nur Corp-PlayerView, side-filtered PublicEvents, LegalActions und erlaubte eigene Corp-Metadaten.
- Debug-Evidence darf keine Hidden-Info-Leaks erzeugen.

## Paketfolge

### Paket 1: Prozess- und Evidence-Basis

Ziel: Replay-Befunde und Arbeitsprozess dokumentieren.

Arbeit:
- Prozessartefakt anlegen.
- Evidence-Report unter `docs/reviews/ai/` schreiben.
- StateVersions, Fehlergruppen und Nicht-Ziele festhalten.

Checks:
- `git diff --check`

Commit:
- `docs(ai): record endgame scoreline replay process`

### Paket 2: Runtime-Audit und Bewertungsdesign

Ziel: Bestehende Scoring-Window-, Remote-ICE-, Central- und Debug-Bausteine lokalisieren und die Änderung minimal anschließen.

Arbeit:
- Betroffene Runtime-Dateien und Tests prüfen.
- Vorhandene Assessment-Felder wiederverwenden, statt einen Parallel-Planner zu bauen.
- Debug-Felder für Exposure, Game-End-Risiko, Rezreserve und Dynamic-ICE-Wirkung definieren.

Checks:
- fokussierte statische Prüfung der betroffenen Dateien
- `git diff --check`

Commit:
- `docs(ai): map endgame scoreline implementation surface`

### Paket 3: Endgame-Scoreline-Assessment

Ziel: Scoreline-Install/Advance bei Runner-Exposure und spielentscheidender Agenda strenger bewerten.

Arbeit:
- Runner-Exposure vor Score als harte Risikoquelle berücksichtigen.
- Runner-Credit-Entwicklung bis zur nächsten Zugriffschance konservativ side-safe schätzen.
- Game-ending oder stark kippende Agenda-Steals stärker gewichten.
- Economy/Fortify gegenüber riskantem Install/Advance bevorzugen, wenn Rezreserve nicht trägt.

Checks:
- fokussierte AI-Runtime-Tests
- `git diff --check`

Commit:
- `fix(ai): harden corp endgame scoring windows`

### Paket 4: Dynamic-ICE- und Archives-Priorität

Ziel: Dynamische ICE und Archives-ICE-Boni nur noch bei konkreter Wirkung positiv werten.

Arbeit:
- Dynamische ICE in Remote-Scorelines nur als Schutz zählen, wenn Position, Rezreserve und sichtbare Runner-Coverage passen.
- Sequenz-/Budgetrisiken für Rez und paid abilities in der Bewertung sichtbar machen.
- Archives-ICE-Boni kappen, wenn kein konkretes Archives-Risiko besteht und R&D/HQ/Remote akut relevanter sind.

Checks:
- fokussierte AI-Runtime-Tests
- `git diff --check`

Commit:
- `fix(ai): require effective dynamic ice protection`

### Paket 5: Regressionen, Reports und lokale Integration

Ziel: Tests, Final-Report, Wissenspflege und lokaler Merge nach `main`.

Arbeit:
- Fokussierte Regressionen für das Replay-Muster ergänzen.
- Final-Report unter `docs/reviews/ai/` schreiben.
- Monatslog ergänzen, wenn ein dauerhafter KI-Vertrag entstanden ist.
- Relevante Checks ausführen, Arbeitsbranch lokal nach `main` mergen.

Checks:
- fokussierte AI-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:
- `docs(ai): record endgame scoreline verification`

## Abschlusskriterien

- Die Replay-Endgame-Scoreline wird mit aktuellem Code nicht mehr als günstige `temporary_safe`-Line bewertet, wenn Corp-Rezreserve und Dynamic-ICE-Wirkung nicht reichen.
- Eine Immediate-Scoreline ohne Runner-Exposure bleibt möglich.
- Sichere, finanzierte Remote-Scorelines bleiben positiv.
- Archives-ICE wird ohne konkretes Archives-Risiko nicht mehr vor akutem R&D/HQ- oder Remote-Scoring-Bedarf bevorzugt.
- Neue Debug-Evidence erklärt die Entscheidung side-safe.
- Arbeitsbranch ist lokal nach `main` gemergt.

## Runtime-Audit, Paket 2

Die vorhandene Runtime reicht für die Umsetzung aus. Es ist kein Parallel-Planner nötig.

Betroffene Hauptflächen:

- `packages/ai/src/runtime/semantic-runtime-corp-scoring-window.ts`: zentrale Assessment-Funktion für `temporary_safe`, `durable`, Runner-Exposure, Rezbudget und Evidence. Hier wird die strengere Endgame-/Dynamic-ICE-Sicherheitslogik angeschlossen.
- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.ts`: Installationsbewertung für Remote-, Central- und Archives-ICE. Hier wird der pauschale Archives-ICE-Bonus durch eine konkrete Risikoabwägung ersetzt.
- `packages/ai/src/runtime/semantic-runtime-corp-score.ts`: Scorekomponenten konsumieren bereits `corpScoringWindowAssessment`; zusätzliche Evidence aus dem Assessment wird automatisch in Decision-Traces sichtbar.
- `packages/ai/src/runtime/semantic-runtime-corp-scoring-evidence-composition.ts`: passive Scoreline-Strafen hängen bereits an sicheren Scoring-Windows. Kein separater Eingriff nötig, solange `windowKind` korrekt ist.

Tests:

- `packages/ai/src/runtime/semantic-runtime-corp-scoring-window.test.ts`: neue Regressionen für Endgame-Exposure, Dynamic-ICE-Budget und Immediate-Gegenprobe.
- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.test.ts`: neue Regression für Archives-ICE-Kappung unter R&D/HQ-Druck.

Debug-Erweiterung:

- Das Scoring-Window soll zusätzlich side-safe ausgeben, ob die Agenda im Remote einen game-ending oder near-ending Steal darstellt.
- Dynamic-ICE-Schwächen sollen als generische Risiko-Evidence erscheinen, nicht mit verdeckten Kartendaten.
- Archives-ICE-Kappung soll über Scorekomponenten nachvollziehbar sein, ohne gegnerseitige Hidden-Info zu leaken.

## Verifizierter Umsetzungsstand

Commits:

- `b1b0f6eb1 docs(ai): record endgame scoreline replay process`
- `7e9a086dc docs(ai): map endgame scoreline implementation surface`
- `10abba876 fix(ai): harden corp endgame scoring windows`
- `f142ce71d fix(ai): require effective dynamic ice protection`
- `76e3c71e5 docs(ai): record endgame scoreline verification`

Umgesetzte Kernpunkte:

- Agenda-Install-Actions werden im Scoring-Window in den konkreten Remote-Root projiziert.
- Scoreline-Evidence enthält jetzt Agenda-Punkte-Risiko, Runner-Punkte nach Steal, Steal-Schwere, Dynamic-ICE-Reserve und durable relevante ICE.
- Game-ending oder near-winning nicht-immediate Scorelines mit Runner-Exposure und dynamischer Scheinsicherheit werden `unsafe`.
- Dynamic-only Remote-ICE erzeugt keinen vollen Scoring-Remote-Aufbauwert mehr.
- Archives-ICE-Bonus ist auf konkrete Archives-Risiken begrenzt und wird unter akutem HQ/R&D- oder HQ-Agenda-Druck abgewertet.

Bestandene Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run --maxWorkers=1 --testTimeout=30000 src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-score.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts src/runtime/semantic-runtime-corp-rez-floor.test.ts src/runtime/semantic-runtime-corp-effective-defense.test.ts src/runtime/semantic-runtime-corp-central-rez-context.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Nicht ausgeführt:

- `corepack pnpm check:ai`, weil keine AI-Hint- oder generierten AI-Daten geändert wurden.
