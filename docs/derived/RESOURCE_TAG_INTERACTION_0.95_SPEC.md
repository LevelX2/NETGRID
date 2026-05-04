# Resource/Tag Interaction 0.95 Spec

Status: eingefroren
Stand: 2026-05-04

## Zweck

Diese Spezifikation beschreibt den engen V0.95-Mechanikvertrag fuer Runner-Resources und Corp-Resource-Trash bei getaggtem Runner. Sie baut auf V0.94 auf und startet keinen Trace-, Prevention-, Hosting-, Virus-, Counter-, Multiaccess- oder Identity-Scope.

## CR-Abgleich und lokale Entscheidung

Aus der CR-v26.03-Regelreferenz fuer den V0.95-Startscope:

- Resources sind Runner-Karten.
- Runner installiert Resources faceup und aktiv in die Play Area.
- Es gibt kein Limit fuer installierte Runner-Resources.
- Solange der Runner getaggt ist, kann die Corp als Action 1 Klick und 2 Credits zahlen, um eine installierte Runner-Resource zu trashen.

Lokale V0.95-Entscheidung:

- V0.95 implementiert nur normale faceup installierte Resources.
- Keine facedown Runner-Karten, keine Hosting-Beziehungen und keine laufenden Resource-Spezialfaehigkeiten.
- Resource-Trash ist ein oeffentliches Event und keine Hidden-Info-Barriere, weil Ziel und Ergebnis oeffentlich installierte Karten betreffen.
- Resource-Trash bleibt trotzdem streng revalidiert: Tags, Side, StateVersion, Timing, Klicks, Credits und Zielzone.

## Typ- und State-Erweiterungen

Empfohlene additive Erweiterungen:

```ts
type CardType = "identity" | "event" | "program" | "hardware" | "resource" | "agenda" | "operation" | "asset" | "upgrade" | "ice";

type RunnerRig = {
  hardware: CardInstanceId[];
  programs: CardInstanceId[];
  resources: CardInstanceId[];
};
```

Falls der bestehende State noch keine `RunnerRig`-Struktur nutzt, darf V0.95 die vorhandenen Runner-Boardlisten additiv um `resources` erweitern. PlayerViews muessen installierte Resources fuer beide Seiten sichtbar machen, ohne Runner-Grip oder Stack zu leaken.

## Resource-Install

Mindestablauf:

1. Runner hat eine Resource im Grip.
2. `getLegalActions` erzeugt eine Install-LegalAction nur im Runner-Hauptfenster und nur bei ausreichenden Klicks/Credits.
3. `applyAction` revalidiert Side, ActionId, StateVersion, Timing, Klick, Credits, Karte und Zone.
4. Die Resource wird aus Grip entfernt und in den Runner-Resource-Bereich gelegt.
5. Die Karte ist faceup, aktiv und fuer beide Seiten sichtbar.
6. Der oeffentliche Event zeigt nur die installierte oeffentliche Boardkarte und keine Handliste.

## Resource-Trash bei Tags

Mindestablauf:

1. Runner hat mindestens einen Tag.
2. Runner kontrolliert mindestens eine installierte Resource.
3. Corp ist in ihrer Action Phase, hat mindestens 1 Klick und mindestens 2 Credits.
4. `getLegalActions` erzeugt pro legalem Ziel eine Corp-Action, bevorzugt `trash_resource`.
5. `applyAction` revalidiert Tagstatus, Side, ActionId, StateVersion, Timing, Klicks, Credits, Ziel und Resource-Zone.
6. Die Corp zahlt 1 Klick und 2 Credits.
7. Die gewaehlte Resource wird in den Runner-Heap bewegt.
8. Das Event ist oeffentlich und enthaelt nur oeffentliche Resource-Daten, Kosten- und Ergebniszusammenfassung.

## Sichtbarkeit

Oeffentlich erlaubt:

- Resource-Definition und Titel, sobald installiert.
- Resource-Install-Event mit oeffentlicher Karte.
- Resource-Trash-Event mit oeffentlicher Karte, Kosten und Zielzusammenfassung.
- Anzahl Runner-Heap-Karten nach bestehendem Sichtbarkeitsvertrag.

Nicht erlaubt:

- Runner-Grip- oder Stack-Liste.
- nicht installierte Resource-Kandidaten im Corp-View.
- Corp-HQ- oder R&D-Daten.
- Import-/Katalog-/Bildstatus als Engine- oder Decklegalitaetsgrund.
- interne Resolverdaten oder private Testfixture-Details in PublicEvents.

## Event- und Undo-Vertrag

- Resource-Install ist oeffentlich oder hoechstens `private_to_side` fuer Handherkunft, aber PublicPayload bleibt redigiert.
- Resource-Trash ist `public`, sofern Ziel und Ergebnis oeffentlich sind.
- Resource-Trash blockiert Undo nicht selbst.
- Undo ueber vorherige Hidden-Info-Barrieren bleibt blockiert.
- Reconnect und WebSocket EventTail muessen denselben side-sicheren Vertrag nutzen.

## AI- und Multiplayer-Vertrag

- AI sieht Resources nur ueber PlayerView, LegalActions und side-gefilterte Events.
- AI darf Resource-Trash nur waehlen, wenn eine LegalAction vorhanden ist.
- Server-Submit prueft Idempotency und stale StateVersion wie bei anderen Actions.
- Reconnect zeigt installierte Resources und Heap-Folgen, aber keine private Handherkunft.

## Testkarte

V0.95 darf eine lokale/fiktive Resource als Harness einfuehren, bevorzugt mit einfacher, oeffentlicher Rolle:

- keine offizielle Karte,
- kein offizielles Asset,
- keine Hidden-Info-Choice,
- keine Trace-/Prevention-/Hosting-/Counter-Mechanik,
- Manifest, Resolver/Ability, Unit-, Szenario-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Smoke verpflichtend.

## No-Scope Guards

Die Implementierung muss aktiv pruefen, dass keine dieser Familien sichtbar wird:

- Trace, Link, Bid-Choice,
- Damage Prevention, Avoid, Interrupt, Replacement,
- Hosting, Hosted Credits, Recurring Credits,
- Virus, Purge, neue Counterfamilien,
- Multiaccess, Breach-Queue, Jack-out-Ausbau,
- Identity-Setup- oder Triggerfaehigkeiten,
- Mulligan.
