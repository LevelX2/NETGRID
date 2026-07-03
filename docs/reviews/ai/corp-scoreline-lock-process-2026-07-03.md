# Corp Scoreline Lock Paketprozess

Status: in Umsetzung

Quelle/Vorgabe: Analyse der gekippten Seeds `latest-match-baseline-013` und `latest-match-baseline-016` nach dem Korp-ICE-Placement- und Signal-Consumer-Cutover. Der neue Bewertungsstand erkennt Score-Terminal-Windows, laesst aber neue Remotes, Root-/Upgrade-Installationen, Central-ICE und Economy zu oft ueber eine laufende Scoreline gewinnen.

## Zielpruefung

Die Vorgabe ist fuer automatische Umsetzung ausreichend praezise.

- Gesamtziel: Korp-KI verfolgt eine begonnene Scoreline konsequent, solange kein konkreter Safety-, Funding- oder game-ending Central-Blocker besteht.
- Scope: `packages/ai/src/runtime` und fokussierte AI-Tests.
- Nicht-Ziele: keine Engine-Legalitaet, keine LegalAction-Erzeugung, keine Hidden-Info-Nutzung, keine grosse Hint-/Taxonomie-Migration, kein Rueckbau des neuen ICE-Placement-Moduls.
- Abnahme: Regressionstests muessen zeigen, dass Score/Advance/Agenda-Install in bestehendem Ready-Remote gegen neue Remotes, Root-/Upgrade-Setup, Central-ICE und Economy gewinnen, ausser ein echter Blocker greift.

## Gesamtziel

Eine kleine Scoreline-Lock-Logik bindet die vorhandene Board-Triage, Score-Terminal-Diagnose und ICE-Placement-Bewertung so zusammen, dass eine aktive Scoreline nicht mehr von generischen Entwicklungsaktionen verdrangt wird.

## Annahmen

- `score_agenda` ist immer der staerkste passende Abschluss, wenn LegalAction vorhanden und kein bestehender Safety-Gate blockiert.
- Ein Remote mit agendahaltiger, legal advancebarer Karte ist ein `active_score_remote`.
- Ein bereits vorbereiteter Ready-Remote soll bei Agenda im HQ vor einem neuen Remote bevorzugt werden.
- Neue Remotes sind bei aktiver Scoreline nur sinnvoll, wenn der aktive Remote objektiv ungeeignet ist oder keine Scoreline-Action legal ist.
- Central-Schutz darf ueberstimmen, wenn HQ/R&D akut bedroht und der Schutz konkret relevant und bezahlbar ist.

## Nicht-Ziele

- Kein neues Parallel-Planning.
- Keine Karten-Spezialfallliste.
- Keine Aenderung an Regeln, PlayerViews, Replays oder LegalAction-Erzeugung.
- Kein Rueckdrehen des ICE-Placement-Moduls.

## Controller-Invarianten

- Die Engine bleibt Regelautoritaet.
- Die KI bewertet nur bestehende LegalActions.
- Die KI nutzt keine verdeckten Runner-Hand-, Stack- oder Ressourcenannahmen.
- Entscheidungen muessen side-safe bleiben.
- Scoring-Window-, Effective-Defense-, Remote-Score- und Placement-Logik werden wiederverwendet, nicht ersetzt.

## Automatische Fehlerbehandlung

- Wenn ein Test rot wird, wird der Fehler im aktuellen Paket behoben, bevor das naechste Paket startet.
- Wenn die bestehende Teststruktur einen Szenariofall nicht direkt modellieren kann, wird ein kleiner Runtime-Unit-Test statt eines breiten Simulationsfixtures ergaenzt.
- Wenn ein Konflikt zwischen Scoreline-Lock und Central-Gefahr fachlich unklar ist, wird Central nur bei high/critical Evidence bevorzugt.

## Sicherheitsblocker

- Hidden-Info-Leak in Debug/Evidence oder PlayerView.
- Aenderung an Engine-Legalitaet oder LegalAction-Erzeugung.
- Nicht reproduzierbare AI-Entscheidung durch neue Zufalls- oder Zeitabhaengigkeit.
- Finaler Merge-Konflikt, bei dem `main` und Arbeitsbranch denselben AI-Vertrag widerspruechlich definieren.

## State Machine

1. `prepared`: Worktree und Prozessartefakt existieren.
2. `scoreline_lock_runtime`: Runtime-Scoring und Placement sind angepasst.
3. `tests_green`: fokussierte Tests und relevante Checks sind gruen oder dokumentiert blockiert.
4. `integrated`: Arbeitsbranch ist lokal nach `main` gemerged und Worktree entfernt.

## Paketfolge

### Paket 1: Prozessartefakt und Preflight

Ziel: Prozess, Scope und Gates versionieren.

Arbeit:
- Prozessartefakt erstellen.
- Worktree-Status pruefen.
- Paket committen.

Checks:
- `git diff --check`

Done-Gate:
- Artefakt existiert und ist committed.

Commit:
- `docs(ai): add corp scoreline lock process`

### Paket 2: Scoreline-Lock Runtime

Ziel: Aktive Scorelines bekommen verbindlichen Vorrang vor nicht blockerlösenden Aktionen.

Arbeit:
- Bestehende Triage-/Score-Terminal-/Placement-Komponenten lesen.
- Kleine zentrale Helper oder Alignment-Erweiterung implementieren.
- Neue Remote-/Root-/Upgrade-/Central-/Economy-Mismatch-Strafen nur bei aktiver Scoreline anwenden.
- Bezahlbaren, konkreten Schutz fuer echten Blocker weiter erlauben.

Kernartefakte:
- `packages/ai/src/runtime/semantic-runtime-corp-score.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-board-triage.ts`
- `packages/ai/src/runtime/corp-ice-placement/corp-ice-placement.ts`
- angrenzende fokussierte Tests

Checks:
- fokussierte Vitests fuer geaenderte Runtime-Module
- `git diff --check`

Done-Gate:
- Neue Regressionen decken aktive Agenda-Remote-, vorhandener Ready-Remote- und Central-Blocker-Faelle ab.

Commit:
- `fix(ai): prioritize active corp scorelines`

Ergebnis:
- Commit `baa3c9c49` ergaenzt `force_scoreline_clock` fuer aktive, spielbare Scorelines und bestehende Ready-Remotes.
- Nach Seed-Pruefung zeigte `latest-match-baseline-016`, dass zusaetzlich `new_remote`-ICE und unrezzbares Central-ICE bei aktiver Remote-Agenda unterdrueckt werden muessen.
- Der Folgefix laesst `new_remote`-ICE bei aktiver bestehender Remote-Scoreline negativ werden, bewertet bankleerendes unrezzbares Central-ICE in diesem Kontext negativ und bestraft End Turn bei offenem Funding-Need und legaler Economy.
- Zwei-Seed-Check nach Folgefix: `latest-match-baseline-016` verbessert sich von 0 auf 3 Corp-Agenda-Punkte; `latest-match-baseline-013` bleibt Runner 7:2. Die Aenderung reduziert den konkreten Remote-/Central-Drift, dreht aber nicht alle gekippten Seeds zurueck.

### Paket 3: Verifikation und Integration

Ziel: Paketstand verifizieren, Arbeitsbranch lokal nach `main` integrieren und Worktree entfernen.

Arbeit:
- Relevante AI-Typechecks/Tests ausfuehren.
- Falls sinnvoll, kurzen Vergleichslauf fuer die zwei gekippten Seeds oder fokussierte Simulation ausfuehren.
- Arbeitsbranch sauber halten.
- `main` in Arbeitsbranch integrieren, finale Checks ausfuehren.
- Arbeitsbranch lokal nach `main` mergen.
- Worktree entfernen.

Checks:
- fokussierte Vitests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:
- `main` enthaelt die Paketcommits.
- Hauptworkspace ist sauber bis auf bereits ignorierte lokale Laufzeitlogs.
- Worktree ist entfernt.

Commit:
- nur falls Paket 3 eigene versionierte Artefakte erzeugt.

## Verifikationsregeln

- Tests muessen Action-Familien vergleichen, nicht nur einzelne Penalty-Werte.
- Scoreline-Lock darf `protect_score_remote` und `fund_score_remote` nicht blockieren.
- Central-Schutz bleibt erlaubt, wenn Debug/Evidence eine akute HQ/R&D-Gefahr zeigt.
- Economy bleibt erlaubt, wenn Rez-Floor/Funding ein konkreter Blocker ist.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/corp-scoreline-lock`
- Worktree: `C:\Projekte\NETGRID_CORP_SCORELINE_LOCK`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Umsetzung ausschliesslich im Worktree.
- Hauptworkspace nur fuer finalen lokalen Merge nach `main`.
- Kein Push ohne ausdruecklichen Nutzerwunsch.

## Controller-Prompt-Kern

Arbeite den Prozess `Corp Scoreline Lock` vollstaendig und sequenziell ab. Lies `AGENTS.md`, `packages/ai/AGENTS.md` und dieses Prozessartefakt. Arbeite ausschliesslich im Worktree `C:\Projekte\NETGRID_CORP_SCORELINE_LOCK` auf Branch `codex/corp-scoreline-lock`. Nutze den Hauptworkspace nur fuer den finalen Merge. Arbeite immer nur am aktuellen Paket, fuehre Paketchecks aus, committe abgeschlossene Pakete und merge am Ende lokal nach `main`.

## Abschlusskriterien

- Aktive Scoreline kann nicht mehr ohne konkreten Blocker von neuer Remote-, Root-/Upgrade-, Central-ICE- oder Economy-Entwicklung verdraengt werden.
- Bestehendes ICE-Placement-Modul bleibt aktiv und liefert weiter Placement-Qualitaet.
- Fokussierte Tests und AI-Typecheck laufen erfolgreich oder ein echter Blocker ist dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
