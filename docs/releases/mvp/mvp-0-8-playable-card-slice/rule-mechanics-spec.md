# Rule Mechanics 0.8 Spec

Status: Requirements Freeze
Stand: 2026-05-03

## Erlaubte Mechaniken

V0.8 erweitert nur kleine vorhandene Pfade:

| Mechanik | Regel |
|---|---|
| Credits gewinnen | Resolver addiert einen festen Betrag nach Kostenvalidierung. |
| Karten ziehen | Resolver nutzt vorhandene Draw-Funktionen und verändert RandomCounter nicht zusätzlich. |
| Event-Run mit Erfolgsbonus | LegalAction enthält Serverziel; `startRun` setzt einen festen Erfolgsbonus. |
| Hardware installieren | vorhandener Installpfad; `modify_memory_limit` bleibt auf +1 begrenzt. |
| Icebreaker installieren | vorhandener Programmpfad mit Memory und Breaker-Fähigkeiten. |
| Operation spielen | Operation wird nach Kosten in Archives gelegt und löst festen Resolver aus. |
| Agenda installieren, advancen, scoren, stehlen | vorhandener Agenda-Pfad mit neuer lokaler Agenda. |
| Asset rezzen und trashen | vorhandener Root-Rez-/Access-Pfad mit festem Rez-Bonus. |
| ICE rezzen, encounter, subroutines | vorhandene Subroutine-Typen `end_the_run`, `corp_gain_credit`, `runner_lose_credits`, `give_runner_tag`. |

## Verbotene Mechaniken in V0.8

Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention und Replacement sind nicht Teil des Hauptslice. Karten mit solchen Mechaniken dürfen nicht `playable` oder `deck_legal` werden.

## Hidden-Info-Regeln

- Corp-HQ, R&D, unrezzed ICE und unrezzed Root-Karten bleiben für Runner redacted.
- Runner-Grip und Stack bleiben für Corp redacted.
- PublicEvents dürfen neue Karten nur bei legalem Reveal-Punkt nennen: Play, Rez, Score, Steal, Trash.
- AI-Inputs enthalten keine FullState-, Decklisten- oder verdeckten Kartendaten.
- Reconnect-, Error-, Undo- und WebSocket-Payloads bleiben side-gefiltert.

## StateHash und Replay

V0.8-Szenarien fixieren Seed, Deck-Snapshots und RulesBaseline. Golden Hashes werden erst nach grüner Implementierung eingefroren. Unbegründete Hash-Drift ist ein Gate-Blocker.
