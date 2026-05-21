---
activityId: act-2026-05-21-runner-program-install-trash-choice-ui
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-runner-program-install-free-mu
resultArtifacts: []
checks: []
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

- [ ] Bei ausreichender MU kann der Runner ein Programm installieren, ohne vorher Programme zu trashen.
- [ ] Bei ausreichender MU kann der Runner freiwillig installierte Programme auswählen und dann installieren.
- [ ] Bei MU-Mangel ist der Pflichtcharakter verständlich: genug Programme wählen oder Installation abbrechen.
- [ ] Der Abbruchpfad verbraucht keine Aktion und keine Credits, soweit die Engine dies vorgibt.
- [ ] Auswahlmarker oder Choice-Panel zeigen keine verdeckten Informationen.
- [ ] Die UI nutzt ausschließlich Engine-`pendingChoice`/`LegalActions` als Legalitätsquelle.
- [ ] Fokussierte Web-Tests decken freiwilliges Überspringen, MU-Pflichtauswahl und Abbruch ab.

## Umsetzungshinweise

- Nach Möglichkeit auf dem generischen Feldkarten-Auswahlmodell aufbauen, damit installierte Programme direkt im Runner-Rig gewählt werden können.
- Wenn der generische Feldkartenmodus noch nicht vorhanden ist, reicht für diesen kleinen Fix zunächst ein klarer Choice-Dialog mit Skip/Abort, solange die Engine-Autorität unangetastet bleibt.
- Text muss echtes Deutsch mit Umlauten verwenden.

## Ergebnisnotiz

Noch offen.
