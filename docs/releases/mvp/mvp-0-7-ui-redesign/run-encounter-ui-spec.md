# Run Encounter UI 0.7 Spec

Status: Design Freeze
Stand: 2026-05-03

## Zweck

Diese Spezifikation definiert die V0.7-Darstellung aktiver Runs. Sie übernimmt die Lesbarkeit aus Design C und den Fokus aus Design D, ohne neue Run-Regeln zu bauen.

## Run-Zustände

Die UI muss mindestens diese Zustände unterscheidbar anzeigen:

- kein aktiver Run,
- Run-Ziel gewählt,
- Approach,
- Rez-Fenster,
- Encounter,
- Subroutine-Auswahl,
- Break/Pump-Entscheidung,
- ICE passiert,
- Access,
- Steal/Trash/Decline,
- Run beendet.

## Timeline

`RunTimeline` zeigt die aktuelle Phase als Stepper:

1. Ziel
2. Approach
3. Encounter
4. Break
5. Access
6. Ergebnis

Nicht angebotene Schritte bleiben neutral. Multiaccess wird nicht als Standardtext angezeigt, solange die Engine keine entsprechende LegalAction liefert.

## Runner-Fokus

Runner sieht:

- Zielserver als side-sicheren Namen,
- sichtbare/rezzed ICE-Informationen,
- eigene Credits, Clicks, Tags und installierte Breaker,
- aktuelle Encounter- oder Access-Entscheidung,
- nur `LegalActions`, die die Engine anbietet.

Runner sieht nicht:

- unrezzed ICE-Titel,
- verdeckte Root-Karten,
- R&D-/HQ-Identitäten vor legalem Access,
- private Corp-Payloads.

## Corp-Fokus

Corp sieht:

- vollständige eigene Serverinformationen,
- eigene HQ-Karten,
- Runner Public Info,
- Rez- und Decline-Aktionen aus `LegalActions`,
- action receipt und aktuellen Lock-/Sync-Status.

Corp sieht nicht:

- Runner-Grip-/Stack-Titel,
- private Runner-Deckliste,
- private Runner-Payloads.

## Choice-Darstellung

Choices werden nicht frei erfunden. Jede Auswahl referenziert eine aktuelle LegalAction oder eine vom Server gelieferte Choice-Struktur:

- ICE rezzen oder ablehnen,
- Subroutine brechen,
- Breaker pumpen,
- weiterlaufen, falls legal,
- Access-Karte stehlen, trashen oder ablehnen.

Pending Actions sperren erneutes Einreichen. Stale oder rejected Actions zeigen side-sichere Fehlermeldungen ohne Kartennamen aus verdeckten Zonen.

## EventLog

Run-Events werden als kompakte Timeline geführt:

- Public Events mit sichtbaren Details,
- Side Events nur in passender Side-View,
- Redacted Events mit neutralem Text,
- System Events für Reconnect, Undo und Receipts.

## Testspur

Diese Spezifikation deckt `V07-MUST-003`, `V07-MUST-008`, `V07-MUST-009`, `V07-MUST-010` und `V07-MUST-011` ab.
