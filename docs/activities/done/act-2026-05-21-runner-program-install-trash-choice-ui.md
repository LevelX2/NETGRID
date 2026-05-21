---
activityId: act-2026-05-21-runner-program-install-trash-choice-ui
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-runner-program-install-free-mu
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web test
  - git diff --check
---

# Runner-Programminstallation: Trash-Choice verständlich bedienen

## Ziel

Der Webclient soll die Engine-Choice beim Installieren eines Runner-Programms verständlich führen: installierte Programme optional auswählen, ohne Trash fortfahren, bei MU-Mangel genug Programme freimachen oder die Installation sauber abbrechen.

## Kontext und Quellen

- Folgepaket zu `docs/activities/inbox/act-2026-05-21-runner-program-install-free-mu.md`.
- Nutzerklärung vom 2026-05-21: Beim Installieren eines Programms darf der Runner vorhandene installierte Programme freiwillig trashen; bei MU-Mangel muss genug MU freigemacht werden oder die Installation findet nicht statt.
- Verwandtes UI-Paket: `docs/activities/inbox/act-2026-05-21-generic-field-card-choice-ui.md` kann die Feldkarten-Auswahl liefern, deckt aber nicht zwingend Textführung, Skip/Abort und Installationskontext dieses Spezialflusses ab.

## Scope

- Programminstallations-Choice im Webclient mit klaren deutschen Texten darstellen:
  - freiwilliger Fall: `Programme vorher trashen?`
  - MU-Pflichtfall: `MU freimachen`
  - Bestätigung: `Installieren` oder `Auswahl bestätigen`
  - Abbruch: `Nicht installieren` oder gleichwertig.
- Bei ausreichender MU muss `ohne Trash installieren` ergonomisch erreichbar sein.
- Bei MU-Mangel muss sichtbar sein, wie viel MU frei werden muss und ob die aktuelle Auswahl reicht, sofern diese Information aus Engine/View/PendingChoice side-sicher verfügbar ist.
- Auswählbare installierte Programme sollen im Rig-Kontext erkennbar sein; falls das generische Feldkarten-Auswahlpaket bereits umgesetzt ist, diesen Pfad nutzen.
- Vor Bestätigung darf keine Karte getrasht, installiert oder aufgedeckt werden.

## Nicht im Scope

- Keine Engine-Regelentscheidung und keine Legalitätsberechnung aus Client-Heuristiken.
- Keine KI-Entscheidungslogik.
- Kein Redesign aller Choice-Dialoge.
- Keine Hidden-Info-Offenlegung.

## Akzeptanzkriterien

- [x] Bei ausreichender MU kann der Runner ein Programm installieren, ohne vorher Programme zu trashen.
- [x] Bei ausreichender MU kann der Runner freiwillig installierte Programme auswählen und dann installieren.
- [x] Bei MU-Mangel ist der Pflichtcharakter verständlich: genug Programme wählen oder Installation abbrechen.
- [x] Der Abbruchpfad verbraucht keine Aktion und keine Credits, soweit die Engine dies vorgibt.
- [x] Auswahlmarker oder Choice-Panel zeigen keine verdeckten Informationen.
- [x] Die UI nutzt ausschließlich Engine-`pendingChoice`/`LegalActions` als Legalitätsquelle.
- [x] Fokussierte Web-Tests decken freiwilliges Überspringen, MU-Pflichtauswahl und Abbruch ab.

## Umsetzungshinweise

- Nach Möglichkeit auf dem generischen Feldkarten-Auswahlmodell aufbauen, damit installierte Programme direkt im Runner-Rig gewählt werden können.
- Wenn der generische Feldkartenmodus noch nicht vorhanden ist, reicht für diesen kleinen Fix zunächst ein klarer Choice-Dialog mit Skip/Abort, solange die Engine-Autorität unangetastet bleibt.
- Text muss echtes Deutsch mit Umlauten verwenden.

## Ergebnisnotiz

Erledigt. Für `runner_program_trash_before_install` berechnet der Webclient aus side-sicheren PlayerView-Daten den optionalen bzw. verpflichtenden MU-Kontext: Titel, Frage, Hinweistext, Submit-Label und Submit-Freigabe unterscheiden jetzt `Ohne Trash installieren`, freiwillige Auswahl, unzureichende MU-Auswahl und `Nicht installieren` über leere Auswahl. Die UI bleibt bei `pendingChoice.options`/`resolve_choice` und erzeugt keine eigene Legalität.
