# V1.6.3 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`

## Ergebnis

- Geplanter V1.6.3-Korb laut Matrix: 23 Karten
- Als V1.6.3-Kern implementiert: 5 Karten
- Deferred in V1.6.3: 18 Karten

## Kernkorb

1. `onr_v1_233_d-arc-knight`
2. `onr_v1_267_sentinels-prime`
3. `onr_v1_273_triggerman`
4. `onr_v1_350_antiquated-interface-routines`
5. `onr_v1_371_tokyo-chiba-infighting`

## Deferred-Regel

Alle Karten außerhalb des Kernkorbs bleiben in V1.6.3 deferred, wenn mindestens eine Bedingung gilt:

- zusätzliche Abhängigkeit zu `V1.7.0+` (Subtype/Hosting/Recurring/Unique)
- zusätzliche Abhängigkeit zu `V1.7.1+` (Run-/Access-/HiddenZone-Breite)
- zusätzliche Abhängigkeit zu `V1.7.2+` (Trace/Tag/ActionEconomy)
- zusätzliche Abhängigkeit zu `V1.8.x+` (Agenda-/Counter-/Dice-Familien)

## ChoiceFlow-Befund

`L2_ChoiceFlow_Gegnerentscheidung_und_Guessing` hat im freigabefähigen Kernkorb keinen belastbaren Kartenfall und bleibt für V1.6.3 explizit deferred dokumentiert.
