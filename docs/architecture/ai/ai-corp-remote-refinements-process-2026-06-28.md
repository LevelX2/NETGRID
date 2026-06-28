# AI Corp Remote Refinements Process 2026-06-28

## Status

`implementing`

## Quelle/Vorgabe

Freigegebene Umsetzung aus der Analyse des abgeschlossenen Matches `match_9bede45b44104402` vom 2026-06-28. Das Match endete mit Runner-Sieg über Agenda-Punkte. Die Analyse fand mehrere Korp-Schwächen: wiederholtes Scoring in contestable Remote, falsch niedrige Remote-Run-Memory, Dog-Pile-Solo-Remote-Überschätzung, zu zentralserverlastige ICE-Hints und zu niedrige Bewertung von Deferred-/Free-Rez-Operationen als Score-Remote-Unterstützung.

## Gesamtziel

Die Korp-KI soll side-safe erkennen, wenn ein Remote durch sichtbare Runner-Coverage und wiederholte Runner-Runs nicht mehr als sichere Scoreline taugt. Sie soll wirksame Remote-Härtung, Rez-Floor-Finanzierung oder Abwarten gegenüber riskantem Install/Advance bevorzugen. Kartensemantik und Hints sollen generisch genug bleiben und keine verdeckte Runner-Hand, keinen Runner-Stack und keine FullState-Daten nutzen.

## Annahmen

- Die zuletzt gemergten Scoring-Window-Fixes waren im analysierten abgeschlossenen Match noch nicht aktiv; sie bleiben Basis und werden erweitert, nicht ersetzt.
- Corp-eigene verdeckte ICE-Identität darf für Korp-Entscheidungen genutzt werden, aber nicht in öffentliche Debug-/Evidence-Kanäle gelangen.
- Proteus-ICE-Hints dürfen korrigiert werden, weil das analysierte Deck genau diese AI-Hints aktiv nutzte.
- Laufzeitdaten unter `data/runtime/` bleiben nicht versioniert.

## Nicht-Ziele

- Keine Engine-Regeländerung an `Dog Pile`, `Rent-to-Own Contract`, Agendas oder Run-Auflösung.
- Kein Parallel-Planner und keine neue Action-Erzeugung.
- Keine globale Übergewichtung von Remote-ICE-Spam.
- Keine Nutzung von verdeckten Runner-Zonen.
- Kein Push und keine PR-Erstellung.

## Controller-Invarianten

- KI wählt ausschließlich vorhandene `LegalActions`.
- `applyAction` bleibt die einzige Regelautorität.
- Alle neuen Bewertungen müssen aus Corp-PlayerView, side-filtered PublicEvents, LegalActions und erlaubter eigener Corp-Metadaten ableitbar sein.
- Debug-Evidence darf keine nicht-öffentlichen Corp-ICE-Identitäten an Gegner-/Public-Kanäle leaken.

## Sicherheitsblocker

- Wenn eine Verbesserung Runner-Hand oder Runner-Stack voraussetzt, wird sie nicht umgesetzt.
- Wenn eine LegalAction fehlt, wird kein KI-Workaround gebaut; der Punkt wird als Follow-up dokumentiert.
- Wenn Hint-Generierung unerwartete breite Drift erzeugt, wird die Drift geprüft und nicht blind committed.
- Wenn `main` im finalen Merge inkompatible neue Änderungen enthält, stoppt der Prozess mit Blocker-Report.

## State Machine

1. `preflight`
2. `evidence_documented`
3. `runtime_memory_fixed`
4. `remote_scoring_refined`
5. `hints_refined`
6. `verified`
7. `merged_to_main`

## Paketfolge

### Paket 1: Prozess- und Evidence-Basis

Ziel: Prozessartefakt und Replay-Evidence festhalten.

Arbeit:
- Dieses Prozessartefakt anlegen.
- Evidence-Report unter `docs/reviews/ai/` schreiben.
- Match-ID, Fehlergruppen, StateVersions und Nicht-Ziele dokumentieren.

Checks:
- `git diff --check`

Commit:
- `docs(ai): record corp remote refinement process`

### Paket 2: Runner-Run-Memory für Corp-Entscheidungen

Ziel: Corp-Opponent-Model soll Remote-/Central-Runs korrekt zählen und im Trace sichtbar machen.

Arbeit:
- Ursache der `runEvents > 0`, aber `remoteRuns = 0`/`centralRuns = 0`-Diskrepanz beheben.
- Remote-Pressure bei wiederholten sichtbaren Remote-Runs erhöhen.
- Regression für Remote-Run-Memory und Remote-Pressure ergänzen.

Checks:
- fokussierter AI-Test
- `git diff --check`

Commit:
- `fix(ai): count runner remote pressure for corp memory`

### Paket 3: Remote-Scoring-Window und effektive ICE-Kontextbewertung

Ziel: Scoreline-Install/Advance soll bei sichtbarer Contest-Coverage und ineffektivem Solo-ICE nicht mehr bevorzugt werden.

Arbeit:
- Scoring-Window-Assessment um sichtbare Contest-Historie und effektive ICE-Kontextschwächen erweitern.
- Solo-ICE mit position-/outer-ICE-scaling ohne tatsächlichen aktuellen Schutz nicht als durable werten.
- Remote-Härtung, Economy und Scoreline gegeneinander testen.
- Deferred-/free-Rez-Operationen nur dann stärker bewerten, wenn sie eine konkrete Remote-Scoreline-Schwäche beheben.

Checks:
- fokussierte AI-Runtime-Tests
- `git diff --check`

Commit:
- `fix(ai): penalize contestable corp remote scorelines`

### Paket 4: AI-Hints für Proteus-Remote-Schutz

Ziel: Hints sollen Remote-Schutz und Solo-/Scaling-Risiken ausdrücken, ohne generischen Remote-ICE-Spam auszulösen.

Arbeit:
- ETR-ICE im Proteus-Deck um `protect_remote` oder remote-scoring-relevante Signale ergänzen, wo die Karte tatsächlich Remote schützen kann.
- Dog Pile um Solo-/Scaling-Risikowörter ergänzen.
- 4-Advancement-Agendas um Score-Horizon-/contestable-Risiko-Hints ergänzen.
- Rent-to-Own/Emergency-Rig-Hints als Score-Remote-Rez-Unterstützung präzisieren.

Checks:
- AI-Hint-/Ontology-Gate, soweit passend
- `git diff --check`

Commit:
- `fix(ai): refine corp remote protection hints`

### Paket 5: Review, Verifikation und lokale Integration

Ziel: Final-Report, Tests, Merge nach `main`.

Arbeit:
- Final-Report unter `docs/reviews/ai/` schreiben.
- Relevante fokussierte Tests und Typecheck ausführen.
- Paketbranch sauber halten, `main` integrieren und lokal nach `main` mergen.
- Worktree entfernen, wenn sauber.

Checks:
- fokussierte AI-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- relevante AI-Hint-Gates, falls Daten geändert wurden
- `git diff --check`

Commit:
- `docs(ai): review corp remote refinement followup`

## Abschlusskriterien

- Neue Regressionen decken Remote-Run-Memory, contestable Remote-Scoreline und Dog-Pile-Solo-Schutz ab.
- Hints und Runtime-Evidence benennen die neuen Gründe side-safe.
- Arbeitsbranch ist lokal nach `main` gemergt.
- Kein Push und keine PR.
