# Resource/Tag Interaction 0.95 Spec

Status: Spezifikation für V0.95-Implementierung
Stand: 2026-05-04

## Regelkern

Runner-Resources sind installierte Runner-Karten. In V0.95 sind sie nach Installation faceup, aktiv und public. Wenn der Runner getaggt ist, darf die Corp als Basisaktion 1 Klick und 2 Credits zahlen, um eine installierte Resource zu trashen.

## Shared Contract

- `CardType` erhält `resource`.
- `ActionType` erhält `trash_resource`.
- `LegalAction` für `trash_resource` enthält Zielinformationen für genau eine öffentlich installierte Runner-Resource.
- PlayerViews dürfen installierte Resources als öffentliche Boardkarten anzeigen.

## Resource-Install

Runner-Install aus dem Grip ist legal, wenn:

- aktive Seite Runner ist,
- der Runner nicht in einem beendeten Spiel ist,
- Timingpunkt ein Runner-Aktionsfenster ist,
- Runner mindestens 1 Klick und die Installationskosten hat,
- Zielkarte im Runner-Grip liegt,
- Kartentyp `resource` ist und Karte über Manifest/Resolver freigegeben ist.

`applyAction` revalidiert die aktuelle LegalAction und damit Side, actionId, stateVersion, Timing, Kosten und Zielkarte.

Nach erfolgreichem Install:

- Runner verliert 1 Klick und die Installationskosten,
- Resource verlässt Grip und wird installed,
- Resource ist für Runner und Corp öffentlich sichtbar,
- Eventklassifikation: `public`,
- Eventpayload enthält nur öffentliche Resource-Daten und keine Grip-/Stack- oder Hidden-Zone-Listen.

## Corp-Resource-Trash

Corp-Action `trash_resource` ist legal, wenn:

- aktive Seite Corp ist,
- Timingpunkt ein Corp-Aktionsfenster ist,
- Runner mindestens 1 Tag hat,
- Corp mindestens 1 Klick und 2 Credits hat,
- Ziel eine installierte Runner-Resource ist,
- Ziel öffentlich sichtbar und nicht bereits im Heap oder einer verdeckten Zone ist.

Effekt:

- Corp zahlt 1 Klick und 2 Credits,
- gewählte Resource wird in den Runner-Heap bewegt,
- Eventklassifikation: `public`,
- Resource-Trash ist keine neue Hidden-Info-Barriere, weil ausschließlich öffentliche Boarddaten betroffen sind.

Negative Revalidierung:

- falsche Side,
- stale `stateVersion`,
- untagged Runner,
- fehlende Corp-Klicks oder Credits,
- Ziel ist keine Resource,
- Ziel ist nicht installiert,
- Ziel gehört nicht dem Runner,
- Ziel liegt in einer verdeckten Zone.

## Visibility-Vertrag

V0.95 darf in keinem Payload verdeckte Kartendaten aus Runner-Grip, Runner-Stack, Corp-HQ, Corp-R&D, verdeckten Archives-Karten, Reconnect, Undo-Preview, PublicEvents, Logs, Errors, AI-Inputs oder UI-Diagnostics offenlegen.

Installierte Resources sind public, weil sie offen im Board liegen. Diese Public-Information darf Titel, Typ, Kosten und Instanz-ID der installierten Resource enthalten.

## Replay und StateHash

Resource-Install und `trash_resource` sind deterministische Moves ohne neue Randomness. Sie müssen im EventLog replaybar sein und bei identischem Seed, Decksnapshot und Action-Stream denselben StateHash ergeben.

## AI-Vertrag

AI darf `trash_resource` nur wählen, wenn es als LegalAction in der side-sicheren AI-Eingabe vorhanden ist. AI darf keine versteckten Hand-, Stack-, HQ-, R&D- oder Archives-Daten zur Resource-Bewertung nutzen.

## No-Scope-Grenzen

Nicht in V0.95:

- Trace, Link, Bidding,
- Jack-out-/Breach-/Multiaccess-Ausbau,
- Identity-Abilities und dauerhafte Modifikatoren,
- Search, Reveal, Expose, Arrange, Shuffle,
- Hosting und hosted Cards,
- Virus/Purge,
- Counter-Familien außer vorhandenen Tags und Advancement Counters,
- Prevention, Avoid, Interrupt, Replacement.
