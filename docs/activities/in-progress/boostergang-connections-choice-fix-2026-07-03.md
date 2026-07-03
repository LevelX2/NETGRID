# Boostergang Connections Choice Fix

Status: in_progress

Quelle/Vorgabe: Nutzerfund vom 2026-07-03: Beim Ausspielen von `Boostergang Connections` erhielt der Runner automatisch Karten statt eine Stack-Auswahl treffen zu können.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

- Gesamtziel: `Boostergang Connections` soll nach dem Trashen der Runner-Hand eine private Runner-Choice öffnen, mit der der Runner bis zur Zahl der erfolgreich getrashten Karten konkrete Stack-Karten auswählt; danach wird der Stack gemischt.
- Endzustand: keine automatische Top-of-Stack-Auswahl mehr; Choice-Auflösung validiert Stack-Zone, Auswahlzahl und Hidden-Info-Barriere.
- In Scope: Engine-Resolver, Hidden-Zone-Choice-Auflösung, gezielte Regressionstests, kurzes Prozessartefakt.
- Nicht-Ziele: UI-Redesign, KI-Bewertungsänderungen, Kartenpool-/Manifest-Erweiterungen, Remote-Push oder PR.
- Relevante Artefakte: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts`, Hidden-Zone-Search-Choice-Helfer, `packages/engine/src/index-tests/mechanics/classic-runner-rest-cards.test.ts`.
- Abnahmekriterien: Regressionstest zeigt `pendingChoice` nach dem Ausspielen; gewählte Stack-Karten landen im Grip; nicht gewählte Karten bleiben im Stack; Shuffle findet erst nach Auswahl statt; `validateGameState`, gezielter Vitest-Lauf und `git diff --check` bestehen.

## Gesamtziel

`Boostergang Connections` wird regelkonform als Hand-to-stack-Tutor umgesetzt: Hand trashen, private Stack-Suche mit echter Kartenauswahl öffnen, Auswahl anwenden, Stack deterministisch mischen und öffentliche Payloads ohne Hidden-Info-Leak halten.

## Annahmen

- Der Runner darf höchstens so viele Karten nehmen, wie durch den Effekt erfolgreich aus dem Grip getrasht wurden.
- Wenn der Stack weniger Karten enthält, ist die maximale Auswahl auf die Stackgröße begrenzt.
- Die Auswahl bleibt Runner-privat; öffentliche Events nennen Counts und keine ausgewählten Definitionen.
- Der bestehende `hidden_info_barrier`-Suchdialog ist die passende UI-Oberfläche.

## Nicht-Ziele

- Keine Änderung an Kosten, Spielbarkeit oder Decklegalität von `Boostergang Connections`.
- Keine Änderung an allgemeiner KI-Auswahlstrategie.
- Keine Umstellung anderer Stack-Search-Karten.

## Controller-Invarianten

- Engine bleibt alleinige Regelautorität.
- UI, Server, Mensch und KI dürfen nur vorhandene `LegalActions` und offene Choices bedienen.
- `applyAction` muss Side, `actionId`, `stateVersion`, Choice-ID und Auswahl erneut prüfen.
- Keine verdeckten Stack-, Grip- oder Heap-Inhalte dürfen öffentlich leaken.
- Replay, StateHash, Seed und RandomCounter bleiben deterministisch.

## Automatische Fehlerbehandlung

- Bei rotem gezieltem Test wird eng auf Resolver, Choice-Quelle oder Testfixture debuggt.
- Bei Hidden-Info-Payload-Leak wird der Prozess gestoppt und ein Blocker dokumentiert.
- Bei Git-Konflikten werden beide fachlichen Intentionen gelesen und erhalten, sofern kompatibel.

## Sicherheitsblocker

- Eine Lösung, die Kartennamen aus dem privaten Stack im öffentlichen Event veröffentlicht.
- Eine Lösung, die Stack-Karten ohne offene Choice bewegt.
- Eine Lösung, die die Auswahl nicht gegen den aktuellen Stack revalidiert.

## State Machine

1. `ready`: Worktree auf `codex/boostergang-connections-choice-fix` ist angelegt.
2. `process_artifact`: Dieses Prozessartefakt ist erstellt und committed.
3. `engine_fix`: Regressionstest und Engine-Fix sind umgesetzt.
4. `verified`: gezielte Checks bestehen.
5. `merged`: Arbeitsbranch ist lokal nach `main` gemerged und Worktree entfernt.

## Paketfolge

### BC-CHOICE-1 Prozessartefakt

Ziel: Prozess und `/Goal` festhalten.

Eingangsvoraussetzungen: sauberer Hauptworkspace, eigener Worktree und Branch.

Konkrete Arbeit: dieses Artefakt anlegen.

Kernartefakte: `docs/activities/in-progress/boostergang-connections-choice-fix-2026-07-03.md`.

Tests/Checks: `git diff --check`.

Done-Gate: Artefakt ist committed.

Commit-Message: `docs: add boostergang choice fix process`

### BC-CHOICE-2 Engine-Fix und Regressionstest

Ziel: `Boostergang Connections` öffnet eine private Stack-Auswahl statt automatische Stack-Karten zu bewegen.

Eingangsvoraussetzungen: BC-CHOICE-1 committed.

Konkrete Arbeit:

- Regressionstest für Choice-Erzeugung und Auflösung ergänzen.
- Resolver so ändern, dass nach dem Hand-Trash eine private `pendingChoice` mit `minSelections = maxSelections = min(trashedCount, stack.length)` entsteht.
- Choice-Auflösung vorhandene Stack-Search-to-Grip-Mechanik wiederverwenden oder eng ergänzen.
- Öffentliche Payloads nur mit Counts und Hidden-Zone-Metadaten befüllen.

Kernartefakte:

- `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts`
- `packages/engine/src/game/hidden-zone/search-choice-handlers.ts`
- `packages/engine/src/index-tests/mechanics/classic-runner-rest-cards.test.ts`

Tests/Checks:

- gezielter Vitest-Lauf für `classic-runner-rest-cards.test.ts`
- `git diff --check`

Done-Gate: Test und Diff-Check bestehen; Commit ist erstellt.

Commit-Message: `fix(engine): require boostergang stack choice`

## Verifikationsregeln

- Mindestens ein Engine-Test muss die offene Choice direkt nach dem Ausspielen prüfen.
- Mindestens ein Engine-Test muss eine konkrete andere Karte als die ursprüngliche Stack-Spitze wählen können.
- `validateGameState` muss nach Play und nach Choice-Auflösung erfolgreich sein.
- `git diff --check` ist nach jedem Paket Pflicht.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_BOOSTERGANG_CONNECTIONS_CHOICE_FIX`
- Arbeitsbranch: `codex/boostergang-connections-choice-fix`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Der Hauptworkspace wird nur für den finalen lokalen Merge nach `main` genutzt.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

```text
/Goal Arbeite Boostergang Connections Choice Fix vollständig und sequenziell von BC-CHOICE-1 bis BC-CHOICE-2 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_BOOSTERGANG_CONNECTIONS_CHOICE_FIX auf Branch codex/boostergang-connections-choice-fix.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Beide Pakete sind committed.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist auf `main`.
- `git status --short` und `git diff --check` auf `main` sind sauber.
- Arbeits-Worktree ist entfernt.
