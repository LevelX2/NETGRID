---
activityId: act-2026-05-21-runner-program-install-free-mu
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Runner trash installed programs|cancels or rejects invalid program-trash|memory chips"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine test
  - git diff --check
---

# Runner-Programminstallation: Programme vor Installation trashen

## Ziel

Normale Runner-Programminstallationen aus dem Grip sollen die regelhafte Installationsentscheidung abbilden: Der Runner darf beim Installieren eines Programms vorher installierte Programme trashen. Wenn das neue Programm sonst das MU-Limit überschreiten würde, muss der Runner genug MU freimachen oder die Installation wird nicht durchgeführt.

## Kontext und Quellen

- Nutzerfund vom 2026-05-21: Bei `4/4 MU` und vier installierten Programmen erscheint aktuell keine Option, ein weiteres Programm zu installieren und dafür ein vorhandenes Programm zu trashen.
- Nutzerklärung vom 2026-05-21: Die Regel soll nicht nur den MU-Mangelfall abdecken. Beim Installieren eines Programms darf der Runner grundsätzlich null, eins, mehrere oder alle installierten Programme trashen; bei MU-Mangel muss die Auswahl am Ende genug MU freimachen.
- Regelreferenz `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`:
  - `3.9.3b`: Wenn die Installation eines Programms die installierte Gesamt-MU über das Limit bringen würde, muss der Runner installierte Programme trashen, sodass die Gesamt-MU inklusive neuem Programm das Limit nicht überschreitet.
  - `8.5.6c`: Beim Installieren eines Programms darf der Runner vorher beliebig installierte Programme trashen; wenn das neue Programm sonst das MU-Limit überschreiten würde, muss er das tun.
- Aktueller Engine-Stand:
  - Normale `install_card`-LegalActions für Runner-Programme aus dem Grip werden nur erzeugt, wenn `state.runner.memoryUsed + memoryCost <= runnerMemoryLimit(state)`.
  - `applyAction` revalidiert diese MU-Grenze ebenfalls.
  - `Self-Modifying Code` hat bereits einen Sonderpfad `self_modifying_code_free_mu`, der bei MU-Mangel eine `select_cards`-Choice für installierte Programme öffnet. Dieser Pfad ist nicht generisch auf normale Grip-Installationen übertragen.
- Verwandtes, aber nicht deckendes UI-Paket: `docs/activities/inbox/act-2026-05-21-generic-field-card-choice-ui.md` behandelt die Darstellung von Feldkarten-Choices, nicht die Engine-Legalität normaler Programminstallationen.

## Scope

- Normale Runner-Programminstallation aus dem Grip so erweitern, dass der Runner im Installationsablauf installierte Programme zum Trashen auswählen oder ohne Trash fortfahren kann.
- Die Choice darf installierte Runner-Programme anbieten; für den MU-Pflichtfall muss die Auswahl genug MU freimachen.
- Bei bereits ausreichender MU darf der Runner auch freiwillig keine, eins, mehrere oder alle installierten Programme trashen, bevor das neue Programm installiert wird.
- Bei MU-Mangel muss die Choice entweder eine ausreichende Trash-Auswahl bestätigen oder die Installation abbrechen, ohne Credits, Klick oder Boardzustand zu verändern.
- Nach bestätigter ausreichender Auswahl werden die gewählten Programme in den Heap getrasht und das neue Programm installiert, wenn danach Credits, Unique-Regeln, StateVersion, Timing und MU weiter legal sind.
- `applyAction` muss Side, actionId, stateVersion, Timing, Kosten, gewählte Programme, installierten Quellkartenzustand und finalen MU-Zustand erneut validieren.
- PublicEvent-/Chronik-Payloads sollen side-sicher nachvollziehbar machen, welches Programm installiert und welche öffentlichen Programme für MU getrasht wurden.
- Vorhandene Spezialpfade wie `Self-Modifying Code`, `The Shell Traders`, `Valu-Pak Software Bundle`, Hosting und `Zetatech Software Installer` dürfen nicht regressieren.

## Nicht im Scope

- Keine KI-Strategieänderung zur Bewertung, wann ein Programm geopfert werden soll.
- Keine UI-Neugestaltung des Choice-Dialogs; falls das vorhandene `select_cards`-Panel genutzt wird, reicht das für diesen Engine-Fix.
- Kein neuer Kartenpool, keine neue Kartenpromotion und keine Änderung an Decklegalität.
- Keine Hidden-Info-Offenlegung in PlayerViews, PublicEvents, WebSocket-Payloads, Reconnect oder Replay.
- Keine Client-Regelautorität: Die UI darf nur aus Engine-`LegalActions` und `pendingChoice` bedienen.

## Akzeptanzkriterien

- [x] Bei `4/4 MU` und mindestens einem installierten MU-belegenden Programm erscheint für ein bezahlbares 1-MU-Programm im Grip ein legaler Installationspfad.
- [x] Bei ausreichender freier MU kann der Runner das Programm ohne Trash installieren oder optional installierte Programme vorher trashen.
- [x] Die Trash-Choice enthält nur installierte Runner-Programme und keine Hardware, Resources oder verdeckten/irrelevanten Karten.
- [x] Eine Auswahl, die nach Trashen nicht genug MU freimacht, wird durch `applyAction` abgelehnt oder durch die Choice-Regeln verhindert.
- [x] Wenn der Runner bei MU-Mangel keine ausreichende Auswahl bestätigt, wird die Installation nicht durchgeführt und der Zustand bleibt für Klick, Credits, Quelle und Rig konsistent.
- [x] Nach erfolgreicher Auswahl liegen die geopferten Programme im Heap, das neue Programm liegt im Rig, `memoryUsed` ist korrekt und `validateGameState` bleibt grün.
- [x] Wrong-side-, stale-state-, falsche Zielkarten- und entfernte-Quellkarte-Fälle sind abgedeckt.
- [x] Replay und StateHash bleiben deterministisch.
- [x] PublicEvents/Chronik bleiben side-sicher und zeigen keine verdeckten Informationen.
- [x] Bestehende Tests für `Self-Modifying Code`, `The Shell Traders`, `Valu-Pak Software Bundle`, Hosting und `Zetatech Software Installer` bleiben grün.

## Umsetzungshinweise

- Der bestehende `Self-Modifying Code`-MU-Freimachpfad kann als Muster dienen, sollte aber nicht unreflektiert kopiert werden: normale Installationen starten aus dem Grip und kosten weiterhin eine Runner-Aktion.
- Ein möglicher enger Schnitt:
  - Install-`LegalAction` für Programme aus dem Grip erzeugen, wenn Credits/Timing/Unique passen und entweder genug MU frei ist oder durch Trash installierter Programme genug MU erreichbar ist.
  - Bei Ausführung zunächst eine `pendingChoice.kind === "select_cards"` für optionalen Programm-Trash öffnen; im MU-Mangelfall klar als Pflicht zum Freimachen oder Abbruch.
  - Die finale `resolve_choice` trasht die gewählten Programme und installiert die ursprüngliche Grip-Karte.
- Die Implementierung soll alle Prüfungen in `applyAction`/Choice-Resolution erneut durchführen, nicht nur bei LegalAction-Erzeugung.
- Falls die UI keinen expliziten Abbruchpfad für die Choice hat, muss der Engine-/Web-Schnitt einen sicheren Weg für "nicht installieren" vorsehen, statt den Runner in einer nicht lösbaren Pflichtauswahl festzuhalten.

## Ergebnisnotiz

Umgesetzt. Normale Runner-Programminstallationen aus dem Grip haben jetzt einen generischen `select_cards`-Pfad für Programmtrash vor der Installation. Bei MU-Mangel bleibt ein legaler Pfad sichtbar, die finale Choice revalidiert Quelle, Seite, Timing, Klick, Credits, Unique-Regeln, Zielkarten und finalen MU-Zustand. Leere Auswahl bei MU-Mangel bricht ohne Klick-/Credit-/Boardkosten ab; erfolgreiche Auswahl trasht öffentliche installierte Programme in den Heap und installiert danach das Grip-Programm. Abgedeckt durch fokussierte Regressionen, Engine-Typecheck, vollständige Engine-Tests und `git diff --check`.
