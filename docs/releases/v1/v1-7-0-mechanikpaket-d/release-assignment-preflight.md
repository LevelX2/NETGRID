# V1.7.0 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- `docs/releases/v1/v1-6-1-mechanikpaket-a/plan-to-v1-7-0.md`

## Ergebnis

- Geplanter V1.7.0-Korb laut Matrix: 36 Karten
- Als V1.7.0-Kern implementiert: 5 Karten
- Deferred in V1.7.0: 31 Karten

## Kernkorb

1. `onr_v1_011_cloak`
2. `onr_v1_036_jackhammer`
3. `onr_v1_069_succubus`
4. `onr_v1_163_floating-runner-bbs`
5. `onr_v1_180_smiths-pawnshop`

## Deferred-Regel

Alle Karten außerhalb des Kernkorbs bleiben in V1.7.0 deferred, wenn mindestens eine Bedingung gilt:

- zusätzliche Abhängigkeit zu V1.7.1-Run-/Access-/Search-/Multiaccess-Bausteinen
- zusätzliche Abhängigkeit zu V1.7.2-Trace-/Tag-/Handsize-Bausteinen
- zusätzliche Abhängigkeit zu V1.8.x+-Agenda-/Counter-/Dice-Familien
- fehlende belastbare Resolver- oder Szenariozuordnung für den freigabefähigen Kern

## Unique-Befund

Der ursprünglich unklare Effektblock `L2_Deck_Unique_Constraint` wird im Kernrelease über `onr_v1_180_smiths-pawnshop` konkretisiert und mit Deck- sowie Runtime-Gates abgesichert.
