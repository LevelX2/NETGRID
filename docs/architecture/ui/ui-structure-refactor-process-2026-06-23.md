# UI Structure Refactor Process 2026-06-23

## Status

`final_preflight`

## Quelle/Vorgabe

Nutzer-Handoff vom 2026-06-23: Die NETGRID-Weboberfläche soll iterativ besser wartbar, klarer gegliedert und besser erklärbar werden. Ziel ist ein behavior-preserving Refactor des Webclients, kein optischer Relaunch, kein Frontend-Rewrite und keine Änderung an Engine-, KI-, LegalAction-, Hidden-Info- oder API-Verträgen.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

- Gesamtziel: `apps/web/app/page.tsx`, `apps/web/app/globals.css` und gemischte UI-Hilfslogik deutlich entlasten.
- Reihenfolge: Strukturinventar, App-/Game-Screen-Schnitt, Session-/Matchstart-Kapselung, Board-, Action-, Card-, CSS- und Dokumentationspakete.
- In Scope: Web-UI-Struktur, Feature-Module, kleine Utility-Extraktionen, gezielte Kommentare, UI-Strukturguide.
- Nicht-Ziele: fachliche Spieländerungen, Engine-/LegalAction-/KI-Änderungen, neues State-Management, Framework-Wechsel, visuelles Redesign.
- Abnahme: Web-Typecheck, Web-Tests, Web-Build, `git diff --check`.

## Gesamtziel

`page.tsx` wird zu einem deutlich schlankeren Orchestrierungsmodul. Aktives Spiel, Spielbrett, Actions, Kartenanzeige, Matchstart/Session, Katalog, Decks, Chronicle, Settings und Debug-Oberflächen werden nachvollziehbar in Feature-Bereiche oder kleine Hilfsmodule getrennt. `globals.css` wird mindestens grob thematisch aufgeteilt. Das sichtbare Spielverhalten bleibt unverändert.

## Annahmen

- Der lokale Branch startet auf dem aktuellen `main`.
- Die vorhandenen Web-Tests sind die primäre Regressionsebene für behavior-preserving UI-Arbeit.
- Kleine unvermeidbare Import- und Typanpassungen sind erlaubt, solange sie keine fachlichen Verträge ändern.
- Wenn ein Paket zu groß wird, wird es in kleinere reine Extraktionsschritte zerlegt.

## Nicht-Ziele

- Keine Engine-Regeln ändern.
- Keine `LegalActions` erzeugen, umdeuten oder filtern, außer bestehende UI-Gruppierung/Anzeige unverändert an neue Module zu verschieben.
- Keine Hidden-Info in PlayerViews, Events, Reconnect, Debug oder UI offenlegen.
- Keine neue State-Management-Library.
- Keine CSS-Framework- oder Next-/React-Architektur-Migration.
- Kein visuelles Redesign über minimale Struktur-Nebenwirkungen hinaus.

## Controller-Invarianten

- UI ist keine Regelautorität.
- UI rendert nur `PlayerView`, `LegalActions`, `ChoiceRequests`, öffentliche oder side-gefilterte Events und lokalen Client-State.
- Normale Player-UI erhält keinen FullState.
- Debug-Ansichten dürfen keine gegnerischen verdeckten Informationen leaken.
- Die Rules Engine bleibt einzige Regelautorität.

## Automatische Fehlerbehandlung

- TypeScript- oder Testfehler werden im aktiven Paket behoben.
- Importzyklen werden durch kleinere Zielmodule oder weniger aggressive Extraktion vermieden.
- Bei riskanter State-Extraktion wird erst reine Darstellung oder reine Utility-Logik verschoben.
- Bekannte, nicht betroffene Altfehler werden nur akzeptiert, wenn sie reproduzierbar unabhängig von den Paketänderungen sind.

## Sicherheitsblocker

Stoppe und dokumentiere einen Blocker, wenn eine Änderung:

- Engine-, `applyAction`-, LegalAction-, Replay- oder StateHash-Verträge verändern müsste;
- verdeckte Karten, private Payloads oder Debugdaten in normale UI-Pfade bringen würde;
- API-Verträge ohne vollständige server-/clientseitige Anpassung erfordern würde;
- einen fachlichen Zielkonflikt zwischen bestehender UI und Vorgabe sichtbar macht.

## State Machine

`preflight -> package_active -> package_checks -> package_commit -> next_package -> final_checks -> merge_main -> complete`

Bei Blocker: `package_active -> blocker_report -> stop`.

## Paketfolge

1. `UIREF-0`: Prozessartefakt und Strukturinventar.
2. `UIREF-1`: zentrale Storage-/Overlay-/Basis-Utilities und Feature-Verzeichnisse.
3. `UIREF-2`: `ActiveGameScreen` und aktive Spieloberfläche aus `page.tsx` herauslösen.
4. `UIREF-3`: Game-Board-Komponenten für Panels, Ressourcen, Zonen und Kartenlayout auslagern.
5. `UIREF-4`: Action-UI und Choice-Panels in `features/actions/` bündeln.
6. `UIREF-5`: Card-UI und Tooltip-/Overlay-nahe Kartenbausteine in `features/cards/` bündeln.
7. `UIREF-6`: `action-board-ui.ts` thematisch splitten, soweit risikoarm.
8. `UIREF-7`: Decks, Catalog, Chronicle, Settings und Debug-Surfaces aus `page.tsx` oder app-root-nahen Sammelflächen lösen.
9. `UIREF-8`: CSS thematisch aufteilen und UI-Strukturguide ergänzen.
10. `UIREF-9`: finale Web-Checks, Review, lokaler Merge nach `main`, Worktree entfernen.

## Paketdetails

### UIREF-0: Prozessartefakt und Strukturinventar

- Ziel: Prozess fixieren und relevante UI-Monolithen vermessen.
- Kernartefakte: dieses Dokument, optional `docs/reviews/ui/ui-structure-inventory-2026-06-23.md`.
- Checks: `git diff --check`.
- Done-Gate: Paketfolge ist dokumentiert, Worktree sauber commitbar.
- Commit: `docs: add ui structure refactor process`

### UIREF-1: Basis-Utilities

- Ziel: Storage-Keys, LocalStorage-Legacy-Zugriffe und Overlay-Positionierung auffindbarer machen.
- Kernartefakte: `apps/web/lib/storage-keys.ts`, `apps/web/lib/local-storage.ts`, `apps/web/lib/overlay-position.ts`.
- Checks: Web-Typecheck, relevante Tests oder `git diff --check`.
- Done-Gate: `page.tsx` nutzt die neuen Utilities ohne Verhaltensänderung.
- Commit: `refactor(web): extract ui storage and overlay utilities`

### UIREF-2: ActiveGameScreen

- Ziel: Aktive Spieloberfläche als Feature-Einstieg trennen.
- Kernartefakte: `apps/web/features/game/ActiveGameScreen.tsx` oder naheliegender Name.
- Checks: Web-Typecheck, Web-Tests soweit sinnvoll.
- Done-Gate: `page.tsx` entscheidet Hauptbereich; aktives Spiel liegt in eigener Komponente.
- Commit: `refactor(web): extract active game screen`

### UIREF-3: Game Board

- Ziel: Board-/Server-/Lane-/Panel-Rendering aus Root-Komponente lösen.
- Kernartefakte: `apps/web/features/game-board/*`.
- Checks: Web-Typecheck, relevante Web-Tests.
- Done-Gate: Board-Rendering ist lokalisiert; Hidden-Info-Darstellung bleibt side-safe.
- Commit: `refactor(web): split game board components`

### UIREF-4: Actions

- Ziel: LegalActions-Panel, Action-Button, Kostenchips und Choice-Panels trennen.
- Kernartefakte: `apps/web/features/actions/*`.
- Checks: Web-Typecheck, Action-/Choice-nahe Tests.
- Done-Gate: Action UI sendet weiterhin nur vorhandene Engine-LegalActions.
- Commit: `refactor(web): split action ui components`

### UIREF-5: Cards

- Ziel: `CardView`, Badges, Popover, Counter und Tooltip-nahe Logik in Card-Feature bündeln.
- Kernartefakte: `apps/web/features/cards/*`.
- Checks: Web-Typecheck, Card-/Catalog-nahe Tests.
- Done-Gate: Kartenanzeige ist vom Board-Layout getrennt.
- Commit: `refactor(web): split card ui components`

### UIREF-6: action-board-ui

- Ziel: gemischte Action-/Board-/Card-Hilfslogik nur dort splitten, wo echte Klarheit entsteht.
- Kernartefakte: `apps/web/features/actions/action-labels.ts`, `apps/web/features/game-board/run-timeline-ui.ts`, `apps/web/features/cards/counter-display-ui.ts` oder begründete Teilmenge.
- Checks: `action-board-ui.test.ts`, Web-Typecheck.
- Done-Gate: keine Importzyklen; reine Funktionen bleiben testbar.
- Commit: `refactor(web): split action board helpers`

### UIREF-7: Feature-Surfaces

- Ziel: Decks, Catalog, Chronicle, Settings und Debug-Oberflächen besser auffindbar machen.
- Kernartefakte: `apps/web/features/decks/`, `catalog/`, `chronicle/`, `settings/`, `debug/`.
- Checks: Web-Typecheck, Web-Tests.
- Done-Gate: Root-nahe Sammelflächen sind reduziert oder bewusst begründet.
- Commit: `refactor(web): organize secondary ui surfaces`

### UIREF-8: CSS und Strukturguide

- Ziel: `globals.css` thematisch importierbar machen und kurze UI-Dokumentation ergänzen.
- Kernartefakte: `apps/web/app/styles/*.css`, `apps/web/README.md` oder `docs/reviews/ui/ui-structure-guide.md`.
- Checks: Web-Typecheck, Web-Build, Web-Tests, `git diff --check`.
- Done-Gate: CSS-Bereiche sind auffindbar; Guide nennt LegalAction-/Hidden-Info-Leitplanken.
- Commit: `docs(web): document ui structure`

### UIREF-9: Finalisierung

- Ziel: final verifizieren, Arbeitsbranch nach aktuellem `main` bringen, lokal mergen, Worktree entfernen.
- Checks: `corepack pnpm --filter @netgrid/web typecheck`, `corepack pnpm --filter @netgrid/web test`, `corepack pnpm --filter @netgrid/web build`, `git diff --check`.
- Done-Gate: Arbeitsbranch sauber, lokal nach `main` integriert, Hauptworkspace geprüft.

## Verifikationsregeln

- Nach jedem Paket mindestens `git diff --check`.
- Nach code-relevanten Paketen mindestens Web-Typecheck.
- Vor finalem Merge: Web-Typecheck, Web-Tests, Web-Build.
- Bei Testfehlern: Fehlerursache prüfen und nur dokumentiert weitergehen, wenn der Fehler unabhängig von den Änderungen ist.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_UI_STRUCTURE_REFACTOR`.
- Arbeitsbranch: `codex/ui-structure-refactor`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für finalen lokalen Merge nach `main`.
- Genau ein Paket ist aktiv.
- Jedes abgeschlossene Paket bekommt einen eigenen Commit.
- Kein Push und keine PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den UI Structure Refactor 2026-06-23 vollständig und sequenziell von UIREF-0 bis UIREF-9 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, apps/web/AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_UI_STRUCTURE_REFACTOR auf Branch codex/ui-structure-refactor. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Akzeptanzkriterien aus der Nutzer-Vorgabe sind erfüllt oder begründet begrenzt.
- `page.tsx` und `globals.css` sind deutlich entlastet.
- Feature-Bereiche und UI-Leitplanken sind dokumentiert.
- Finale Web-Checks wurden ausgeführt und dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
