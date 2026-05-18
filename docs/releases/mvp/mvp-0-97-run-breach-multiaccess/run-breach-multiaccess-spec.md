# Run/Breach/Multiaccess 0.97 Spec

Status: Spezifikation für V0.97-Implementierung
Stand: 2026-05-04

## Regelkern

V0.97 führt für neue V0.97-Spiele einen expliziten Breach-State ein. Ein erfolgreicher Run erzeugt eine Access-Queue. Die Runner-Seite accessed genau eine Queue-Position pro `access_card`-Aktion und entscheidet danach wie bisher über Steal, Trash oder Decline. Künftige Queue-Entries bleiben intern und dürfen vor ihrem Access nicht sichtbar werden.

## Jack-out

Jack-out ist in V0.97 legal:

- nur für Runner,
- nur während eines V0.97-Movement-Fensters,
- nach passiertem ICE,
- vor dem nächsten ICE oder vor dem Server,
- nur wenn keine Choice und kein Access offen ist.

Effekt:

- der Run endet erfolglos,
- kein Breach wird gestartet,
- keine Karte wird revealed,
- Eventklassifikation: `public`.

Nicht legal:

- vor dem ersten ICE,
- während Encounter-Resolution,
- während Breach/Access,
- bei falscher Side, stale StateVersion oder offener Choice.

## Breach-State

`BreachState` enthält:

- `breachId`,
- Server-ID,
- Access-Modus,
- Queue-Einträge,
- aktuellen Index,
- Completion-Status,
- öffentliche Access-Zusammenfassungen.

`AccessQueueEntry` enthält intern:

- Entry-ID,
- Zone,
- CardInstanceId,
- Ursprung/Server,
- Hidden-Info-Klasse,
- Status.

PlayerViews dürfen nur abstrakte Breach-Daten und den aktuellen Access zeigen, nicht künftige Entry-IDs oder Kartentitel.

## Access-Queue

R&D:

- Queue enthält die obersten N Karten zum Breach-Start.
- Reihenfolge ist deterministisch.
- Nur die aktuelle Karte wird beim `access_card` sichtbar.

HQ:

- Queue enthält N verschiedene Karten aus HQ.
- Auswahl nutzt `RandomDrawRecords` ohne Replacement.
- PublicEvents dürfen keine nicht zugegriffenen HQ-Titel oder -IDs enthalten.

Archives:

- Queue enthält Archives-Karten nach lokalem Modell.
- V0.97 führt keinen vollständigen facedown-Archives-Ausbau ein.
- Künftige Archives-Entries werden nicht vorab in PlayerViews geleakt.

Remote:

- Queue enthält Root-Karten des angegriffenen Remote-Servers.
- Steal/Trash/Decline bleiben kompatibel.
- Kein Access-Replacement oder Candidate-Pruning.

## Actions

- `jack_out`: public Run-Ende ohne Breach.
- `continue_run`: im Movement-Fenster setzt den Run Richtung nächstes ICE oder Server fort.
- `access_card`: accesses die nächste Queue-Position.
- `steal_agenda`: stiehlt die aktuell accessete Agenda und setzt die Queue fort oder beendet den Breach.
- `trash_accessed_card`: trasht die aktuell accessete trashbare Karte und setzt die Queue fort oder beendet den Breach.
- `decline_trash`: declined den aktuellen Access und setzt die Queue fort oder beendet den Breach.

## Visibility

Hidden-Zone-Access ist `hidden_info_barrier`. Das Event darf die aktuell accessete Karte revealn, aber keine weiteren Queue-Entries.

PlayerViews:

- Runner sieht die aktuell accessete Karte.
- Corp sieht eigene Karten wie bisher.
- Beide Seiten sehen abstrakte Breach-Positionen, aber keine künftigen Hidden-Zone-Details.
- Reconnect und WebSocket verwenden denselben PlayerView-Vertrag.

## Replay und Randomness

- R&D/Remote/Archives-Queues sind deterministisch ohne neue Randomness.
- HQ-Multiaccess verwendet `nextRandom` und schreibt pro Auswahl einen `RandomDrawRecord`.
- Replay muss denselben Queue-Aufbau und finalen StateHash reproduzieren.

## AI und Multiplayer

AI darf nur aus LegalActions, PlayerView und public EventTail entscheiden. Sie darf nicht wissen, welche künftigen R&D-/HQ-Queue-Karten intern vorgemerkt sind.

Multiplayer muss Submit, Idempotency, Reconnect und Undo-Barrieren während Breach und Multiaccess side-sicher behandeln.

## No-Scope

Nicht in V0.97:

- Access-Replacement,
- Access-Prevention,
- Bypass,
- Search/Reveal/Expose/Arrange/Shuffle/Swap,
- aktive Identity-Abilities,
- Hosting/Viren/Counter,
- Prevention/Avoid/Interrupt/Replacement.
