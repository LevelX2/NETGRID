# V1.6.2 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`

## Ergebnis

- Geplanter V1.6.2-Korb laut Matrix: 50 Karten
- Als V1.6.2-Kern implementiert: 5 Karten
- Deferred in V1.6.2: 45 Karten

## Kernkorb

1. `onr_v1_212_priority-requisition`
2. `onr_v1_215_security-net-optimization`
3. `onr_v1_317_data-masons`
4. `onr_v1_320_encoder-inc`
5. `onr_v1_341_skalderviken-sa-beta-test-site`

## Deferred-Regel

Alle Karten außerhalb des Kernkorbs bleiben in V1.6.2 deferred, wenn mindestens eine Bedingung gilt:

- Upgrade-/Uninstall-/ChoiceFlow-Abhängigkeit (V1.6.3)
- Hosting-/Recurring-/Unique-Abhängigkeit (V1.7.0)
- fehlende belastbare per-card Resolverzuordnung ohne Heuristik
