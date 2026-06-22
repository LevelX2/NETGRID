# Runner Hand Buffer Draw Scoring Process 2026-06-22

Status: in Umsetzung

## Quelle/Vorgabe

Nutzeranalyse und KI-Decision-Export vom 2026-06-22 zeigen, dass die Runner-KI bei 0 Handkarten `Karte ziehen` nur mit generischem `runner_low_hand` bewertet. Im konkreten Trace gewann `Run auf R&D` trotz leerer Hand und Damage-nahem Korp-Spielplan deutlich gegen `draw_card`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung:

- Gesamtziel: Runner-Draw bei leerer oder sehr niedriger Hand als eigenen Handpuffer-/Survival-Bedarf modellieren.
- Endzustand: `draw_card` gewinnt in Low-Hand-/Damage-Puffer-Lagen gegen generische Probe-Runs ohne konkreten High-Payoff.
- Relevante Module: `packages/ai/src/index.ts`, `packages/ai/src/tactical-plans.ts`, fokussierte AI-Tests.
- Sicherheitsgrenzen: LegalActions-only, keine Engine-Änderung, keine Nutzung verdeckter Korp-Hand-, R&D-, HQ- oder Deckinhalte.
- Checks: fokussierte Vitest-Dateien, `@netgrid/ai` typecheck, `git diff --check`.

## Gesamtziel

Die Semantic Runtime soll leere oder fast leere Runner-Handkarten als fachlich starken Handpuffer-Bedarf bewerten. Bei side-sicher sichtbarer oder plausibel öffentlicher Damage-/Flatline-Gefahr soll `draw_card` als Survival-/Buffer-Aktion deutlich stärker sein. Generische R&D-/HQ-Probe-Runs dürfen diesen Bedarf nur schlagen, wenn ein klarer High-Payoff-Override wie bekannte Agenda, dringender Score-Threat oder unmittelbarer Sieg vorliegt.

## Annahmen

- Handkartenanzahl des Runner ist eigene side-sichere Information.
- Sichtbare Damage-Gefahr darf aus öffentlichen Events, sichtbaren Karten, Tags, Trace-/Damage-Signalen und eigenen Runner-Risiken abgeleitet werden.
- Der konkrete Nutzerfall muss nicht das gegnerische verdeckte Deck kennen; die KI darf nur aus sichtbarer oder eigener Information schließen.
- Bestehende Blink-Sonderlogik bleibt erhalten und wird nicht entfernt.

## Nicht-Ziele

- Keine Engine-, `LegalAction`-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Offenlegung verdeckter gegnerischer Karten, Decklisten, R&D-/HQ-Reihenfolge oder Hidden-Zone-Inhalte.
- Keine allgemeine Run-Angst: konkrete High-Payoff-Runs bleiben möglich.
- Keine UI-Umgestaltung jenseits vorhandener Debug-Score-Komponenten.

## Controller-Invarianten

- Umsetzung läuft ausschließlich im Worktree `C:\Projekte\NETGRID_RUNNER_HAND_BUFFER_DRAW_SCORING` auf Branch `codex/runner-hand-buffer-draw-scoring`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge genutzt.
- Genau ein Paket ist aktiv.
- Jedes Paket endet mit Checks, `git diff --check` und Commit.

## Automatische Fehlerbehandlung

- Bei Testfehlern wird nur der aktuelle Scope debuggt.
- Bei Hidden-Info-Risiko stoppt die Umsetzung und dokumentiert einen Blocker.
- Bei Merge-Konflikten werden beide Intentionen gelesen und erhalten, sofern fachlich kompatibel.

## Sicherheitsblocker

- Eine Lösung, die gegnerische verdeckte Hand-, Stack-/R&D-/HQ- oder Deckinhalte verwendet.
- Eine Lösung, die neue LegalActions erzeugt oder Engine-Regeln ändert.
- Eine Lösung, die generische Draw-Priorität so stark macht, dass bekannte Agenda-/Score-Stopper ignoriert werden.

## State Machine

1. `process_documented`
2. `scoring_implemented`
3. `tests_added`
4. `verified`
5. `merged_to_main`

## Paketfolge

### Paket 1: Prozessartefakt

Ziel: Prozess, Grenzen und Paketfolge dokumentieren.

Arbeit:

- Dieses Artefakt erstellen.
- Ziel, Annahmen, Nicht-Ziele und Checks festhalten.

Checks:

- `git diff --check`

Done-Gate:

- Artefakt ist versioniert und beschreibt den vollständigen Prozess.

Commit:

- `docs(ai): document runner hand buffer draw scoring process`

### Paket 2: Scoring und Planmodell

Ziel: Runner-Draw bei niedriger Hand als Handpuffer-/Survival-Bedarf bewerten.

Arbeit:

- Side-sichere Helper für Runner-Handpuffer und Damage-Kontext ergänzen.
- `draw_card` erhält gestufte Boni bei 0, 1, 2 und 3 Handkarten.
- Bei Damage-/Survival-Kontext steigt der Bonus.
- Generische Probe-Runs mit leerer Hand erhalten nur dann keinen Malus, wenn ein klarer High-Payoff-Override vorliegt.
- Optional einen TacticalPlan `runner.restore_hand_buffer` ergänzen, wenn damit die Planebene die Absicht sauberer ausdrückt.

Kernartefakte:

- `packages/ai/src/index.ts`
- `packages/ai/src/tactical-plans.ts`, falls ein Plan ergänzt wird.

Checks:

- fokussierte AI-Tests nach Implementierung
- `git diff --check`

Done-Gate:

- Der Trace-ähnliche Fall kann durch Score-Komponenten erklären, warum Draw Vorrang vor generischen Probe-Runs bekommt.

Commit:

- `fix(ai): prioritize runner hand buffer draw`

### Paket 3: Regressionstests

Ziel: Das neue Verhalten eng absichern.

Arbeit:

- Test für 0 Handkarten + Damage-Kontext: `draw_card` schlägt R&D-Probe.
- Test für 0 Handkarten ohne Damage-Kontext: Draw steigt deutlich, darf aber klare High-Payoff-Runs nicht pauschal blockieren.
- Test für bekannte Agenda oder urgent Score-Threat: Run-Override bleibt möglich.
- Test für Debug-Evidence ohne Hidden-Info.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run <fokussierte-testdateien>`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Tests grün und Verhalten nachvollziehbar.

Commit:

- `test(ai): cover runner hand buffer draw scoring`

### Paket 4: Finaler Merge

Ziel: Arbeitsbranch lokal nach `main` integrieren.

Arbeit:

- Arbeitsbranch sauber prüfen.
- Relevante finale Checks ausführen.
- `main` in Arbeitsbranch integrieren, falls nötig.
- Hauptworkspace auf `main` fast-forwarden oder defensiv mergen.
- Worktree entfernen.

Checks:

- `git status --short`
- `git diff --check`
- fokussierte AI-Tests

Done-Gate:

- `main` enthält alle Paketcommits und ist sauber.

Commit:

- Kein zusätzlicher Commit, sofern Merge fast-forward ist.

## /Goal

/Goal Arbeite den Prozess `Runner Hand Buffer Draw Scoring 2026-06-22` vollständig und sequenziell von Paket 1 bis Paket 4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, `agents/release-implementation-agent.md` und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_RUNNER_HAND_BUFFER_DRAW_SCORING` auf Branch `codex/runner-hand-buffer-draw-scoring`. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange die konservativen Annahmen automatische Fortsetzung erlauben. Arbeite immer nur am aktuellen Paket. Schreibe oder aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.

## Abschlusskriterien

- Low-Hand-Draw hat sichtbare, side-sichere Score-Komponenten.
- Damage-/Flatline-/Survival-Kontext verstärkt Draw nachvollziehbar.
- Generische Probe-Runs verlieren gegen akuten Handpufferbedarf.
- High-Payoff-Run-Overrides bleiben möglich.
- Fokussierte Tests und Typecheck sind grün.
- Arbeitsbranch ist lokal in `main` integriert.
