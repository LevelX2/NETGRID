# AI Corp Remote Refinements Process 2026-06-28

## Status

`verified_pending_local_main_merge`

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
- `fix(ai): count labeled runner runs in corp memory`

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
- `fix(ai): refine corp remote scoring windows`

### Paket 4: AI-Hints für Proteus-Remote-Schutz

Ziel: Hints sollen Remote-Schutz und Solo-/Scaling-Risiken ausdrücken, ohne generischen Remote-ICE-Spam auszulösen.

Arbeit:
- ETR-ICE im Proteus-Deck um `protect_remote` oder remote-scoring-relevante Signale ergänzen, wo die Karte tatsächlich Remote schützen kann.
- Dog Pile um Solo-/Scaling-Risikowörter ergänzen.
- Riddler um Paid-ETR-Risikohinweis ergänzen.
- Generated Hint-Indizes neu bauen und Inspector-Regressionen ergänzen.

Checks:
- AI-Hint-/Ontology-Gate, soweit passend
- `git diff --check`

Commit:
- `fix(ai): mark Proteus ICE remote scoring roles`

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
- `fix(ai): type remote label parsing`
- `docs(ai): record corp remote verification`

## Abschlusskriterien

- Neue Regressionen decken Remote-Run-Memory, contestable Remote-Scoreline und Dog-Pile-Solo-Schutz ab.
- Hints und Runtime-Evidence benennen die neuen Gründe side-safe.
- Arbeitsbranch ist lokal nach `main` gemergt.
- Kein Push und keine PR.

## Verifizierter Umsetzungsstand

Commits:

- `d6f7d9cc4 docs(ai): record corp remote refinement process`
- `3eabd737d fix(ai): count labeled runner runs in corp memory`
- `8aea81760 fix(ai): refine corp remote scoring windows`
- `5ed998506 fix(ai): mark Proteus ICE remote scoring roles`
- `5e0bf1bb1 fix(ai): type remote label parsing`

Umgesetzte Kernpunkte:

- Corp-Run-Memory klassifiziert label-only PublicEvents fuer HQ, R&D und Remotes side-safe, ohne verdeckte Runner-Zonen zu verwenden.
- Scoring-Window-Assessment unterscheidet jetzt relevante, bezahlbare und durable relevante Remote-ICE statt reiner ICE-Anzahl.
- Cheap irrelevant ICE erfuellt den Rez-Floor nicht mehr; Economy kann dadurch vor Scoreline gewinnen, wenn Finanzierung die konkrete Schwachstelle ist.
- Solo-Position-Scaling-ICE wie `Dog Pile` kann ein temporaeres Fenster erzeugen, aber keine durable Remote-Sicherheit.
- Sichtbare Runner-Coverage plus Credits macht Solo-Dog-Pile-Scorelines unsafe.
- Central-Pressure kann label-only HQ/R&D-Runs erkennen und weiterhin Remote-Plaene ueberstimmen, wenn Zentralserver akut bedroht sind.
- Proteus-ETR-/Tax-ICE mit Remote-Schutzwert tragen `protect_remote`; `Dog Pile` und `Riddler` haben zusaetzliche Risiko-Hinweise.

Bestandene Gates:

- `corepack pnpm exec vitest run --maxWorkers=1 --testTimeout=30000 src/diagnostics/semantic-runtime-memory-debug.test.ts src/belief-state.test.ts src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts src/ai-hint-inspector-index.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm check:ai`
- `git diff --check`

Nicht als Gate genutzt:

- Ein versehentlicher breiter `@netgrid/ai`-Testlauf zeigte bestehende, fachlich nicht zu diesem Paket gehoerende Alt-Failures in Shadow-League-, Module-Boundary- und Runner-Run-Target-Suiten. Die fokussierten neuen Regressionen, Typecheck und AI-Gates sind gruen.
