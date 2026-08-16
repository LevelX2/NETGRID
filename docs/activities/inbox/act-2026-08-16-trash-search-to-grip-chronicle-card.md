---
activityId: act-2026-08-16-trash-search-to-grip-chronicle-card
status: inbox
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-16
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Aus dem Heap zurückgeholte Karte in der Spielchronik nennen

## Ziel

Wenn ein Runner mit einer öffentlich nachvollziehbaren Trash-/Heap-Suche eine
Karte in den Grip zurückholt, nennt die Spielchronik nach der Auswahl sowohl
die Quellkarte als auch die tatsächlich zurückgeholte Karte. Der konkrete
Playtest-Fund betrifft **Gideon’s Pawnshop**.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-08-16: Die Runner-KI spielte die vom Nutzer als
  „Gillian's Pan Shop“ erinnerte Karte mit dem Text „Search your trash for a
  card and bring it into your hand.“ In der Spielchronik blieb offen, welche
  Karte aus dem Trash zurückgeholt wurde.
- Die kanonische Karte ist **Gideon’s Pawnshop**
  (`onr_v1_089_gideons-pawnshop`) mit dem Effekt
  `search_trash_to_grip` und dem Filter `any_card`.
- Der gemeinsame Engine-Pfad löst Trash-Suchen über
  `hiddenZoneAction: p3_37_search_trash_to_grip` auf. Der interne
  Bewegungsausgang kennt Quellkarte, ausgewählte Kartendefinition sowie die
  Bewegung von `runner_heap` nach `runner_grip` und markiert die ausgewählte
  Heap-Karte als öffentliches Ergebnis.
- `apps/web/app/chronicle.ts` besitzt bereits eine benannte Chronikdarstellung
  für `p3_38_move_top_trash_to_grip`, behandelt den allgemeinen
  `p3_37_search_trash_to_grip`-Ausgang aber nicht entsprechend.
- Der bestehende Gideon-Engine-Test sichert Regelauflösung, Hidden-Info-Schutz
  und Replay, prüft jedoch noch nicht den Namen der zurückgeholten Karte im
  real projizierten öffentlichen Ereignis und in der Chronik.

## Scope

- Den vollständigen Pfad von Gideon’s Pawnshop über die Runner-private Auswahl
  bis zum öffentlichen `resolve_choice`-Ereignis und zur Spielchronik prüfen.
- Nach abgeschlossener Auswahl einen eindeutigen deutschen Chronikeintrag
  ausgeben, sinngemäß: „Die Runner-KI hat Gideon’s Pawnshop genutzt und
  <Kartenname> aus dem Heap in den Grip genommen.“
- Die Darstellung auf den gemeinsamen Effektfamilienpfad
  `p3_37_search_trash_to_grip` beziehen, damit auch vergleichbare
  Trash-Suchkarten denselben öffentlich bekannten Ausgang korrekt anzeigen.
- Falls die ausgewählte Kartendefinition im real projizierten PublicEvent noch
  verloren geht, die Ursache in der öffentlichen Engine-Projektion beheben;
  der Chronik-Formatter darf keine private Choice-Payload und keinen Freitext
  als Ersatz auswerten.
- Fokussierte Regressionen für einen realen Gideon’s-Pawnshop-Ausgang durch
  Eventbau/öffentliche Projektion sowie für die daraus erzeugte
  Chronikmeldung ergänzen.
- Live-Chronik, Reconnect und Replay über denselben öffentlichen Eventvertrag
  konsistent halten.

## Nicht im Scope

- Änderung der KI-Entscheidung, ob Gideon’s Pawnshop gespielt oder welche
  Karte zurückgeholt wird.
- Änderung der Kartenregel, der Kosten, der Legal Actions, der Choice-
  Ownership, von `applyAction`, Replay-Determinismus oder StateHash.
- Offenlegung der Runner-Grip, des Stacks oder nicht gewählter Choice-
  Kandidaten. Öffentlich werden nur Quellkarte, tatsächlich gewählte
  Heap-Karte und die abgeschlossene Zonenbewegung dargestellt.
- Parsing von `actionId`, Choice-ID, Prompt, Label oder Chronik-Freitext als
  fachliche Datenquelle.
- Allgemeines Redesign oder Neu-Gruppieren der Spielchronik.

## Akzeptanzkriterien

- [ ] Der reproduzierte Gideon’s-Pawnshop-Pfad erzeugt nach der Auswahl einen
  sichtbaren Chronikeintrag, der **Gideon’s Pawnshop** und den Namen der
  tatsächlich aus dem Heap in den Grip genommenen Karte nennt.
- [ ] Vor Abschluss der Auswahl behauptet kein Chronikeintrag, eine konkrete
  Karte sei bereits zurückgeholt worden; es entsteht kein irreführender
  Doppeleintrag für denselben Ausgang.
- [ ] Die Chronik bezieht den Kartennamen aus einem real projizierten,
  strukturierten und side-sicheren PublicEvent; Live-Ansicht, Reconnect und
  Replay besitzen dieselbe Information.
- [ ] Das öffentliche Ereignis enthält keine nicht gewählten Heap-Optionen,
  keine Grip-/Stack-Inhalte und keine privaten Karteninstanz-IDs.
- [ ] Ein Engine-/Public-Event-Test sichert den öffentlichen Bewegungsausgang;
  ein Web-Test sichert die deutsche Chronikmeldung einschließlich beider
  Kartennamen.
- [ ] Andere Hidden-Zone-Suchen, insbesondere private Stack-Suchen ohne
  öffentliche Auswahl, bleiben redigiert und unverändert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, da der sichtbare Fehler eine
  kleine Chronikdarstellung betrifft. Sollte die echte öffentliche Projektion
  den bereits engine-intern bekannten Zielnamen verlieren, muss der
  Ursachen-Fix zusätzlich in der Engine-/Public-Payload-Schicht erfolgen.
- Relevante Startpunkte:
  `packages/engine/src/game/hidden-zone/search-choice-move-intents.ts`,
  `packages/engine/src/public-context.ts`,
  `packages/engine/src/index-tests/originalset/runner-events-hardware-programs-resources.test.ts`,
  `apps/web/app/chronicle.ts` und `apps/web/app/chronicle.test.ts`.
- Die bestehende `p3_38_move_top_trash_to_grip`-Formatierung ist ein
  Vergleichspfad, aber kein Anlass für parallele oder kartenspezifische
  Entscheidungslogik.
- Hidden-Info fail-closed halten: Die gewählte Heap-Karte ist als Bewegung aus
  einer öffentlichen Zone ein öffentliches Spielergebnis; die private Grip
  danach und alle nicht gewählten Optionen bleiben verborgen.

## Ergebnisnotiz

Noch offen.
