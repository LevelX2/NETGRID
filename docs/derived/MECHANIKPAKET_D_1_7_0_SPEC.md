# Mechanikpaket D 1.7.0 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.7.0 implementiert einen freigabefähigen Kern mit 5 Karten und vier Blöcken:

1. Unique-Constraint im Deck- und Runtime-Lebenszyklus
2. Daemon-Hosting mit hosted-Programmen und Kaskaden-Trash
3. Recurring-/Start-of-turn-Resolver mit deterministischer Reihenfolge
4. Subtype-Vertrag für Stealth/Noisy/Worm

## Nicht-Scope

- Keine Run-/Search-/Multiaccess-Breite aus V1.7.1.
- Keine Trace-/Tag-/Handsize-Breite aus V1.7.2.
- Keine zusätzliche AI-Support-Freigabe.

## Kartenvertrag V1.7.0

- `onr_v1_011_cloak`
  - Programm mit `recurring_credit`
  - Credits nur für Icebreaker-Nutzung während Runs
  - Kein Einsatz für Noisy-Icebreaker
  - Refill am Start des Runner-Zugs
- `onr_v1_036_jackhammer`
  - Noisy-Barrier-Breaker
  - Darf Cloak-Recurring-Credits nicht verwenden
- `onr_v1_069_succubus`
  - Daemon mit Hosting-Kapazität 3 MU
  - Hosted Programme zählen nicht auf Runner-MU
  - Beim Verlassen des Hosts werden hosted Programme deterministisch getrasht
- `onr_v1_163_floating-runner-bbs`
  - Resource mit deterministischem Start-of-turn-Creditgewinn (+1)
- `onr_v1_180_smiths-pawnshop`
  - Unique Resource
  - Start-of-turn optional: andere installierte Runner-Karte trashen für +1 Credit
  - Unique-Regel darf in Deck und Runtime nicht verletzt werden

## Engine-Vertrag

- Deckvalidierung lehnt Unique-Karten mit `quantity > 1` ab.
- Runtime-Install blockiert doppelte Unique-Karten desselben Namens im Spiel.
- Runner-Install bietet gehostete Install-Aktionen auf Daemon-Hosts an.
- Hosted-Install und Normal-Install müssen unterschiedliche ActionIds haben.
- Hosted Programme werden auf dem Host verankert, ohne zusätzliche Runner-MU-Kosten.
- Host-Verlust triggert deterministische Kaskaden-Trash-Auflösung für hosted Programme.
- Run-Kostenpfade berücksichtigen Recurring-Credits inklusive Stealth/Noisy-Filter.
- Runner-Start-of-turn führt Recurring-Refresh und Resource-Starteffekte deterministisch aus.
- `onr_v1_021_dwarf` und `onr_v1_074_worm` tragen konsistent den Subtype `worm`.

## Deferred-Hinweis

Der Planungskorb für V1.7.0 enthält 36 Karten. Der freigabefähige Kernrelease setzt 5 Karten um; 31 Karten bleiben in V1.7.0 deferred dokumentiert, weil zusätzliche Mechanikbreite oder Folge-Gates erforderlich sind.
