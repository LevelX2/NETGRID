# AI Endgame Scoreline and Dynamic ICE Process, 2026-06-29

## Status

- Branch: `codex/ai-endgame-scoreline`
- Worktree: `C:\Projekte\NETGRID_AI_ENDGAME_SCORELINE`
- Integrationsziel: lokaler `main`
- Umsetzung: freigegeben, sequenziell, ohne Push/PR

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

