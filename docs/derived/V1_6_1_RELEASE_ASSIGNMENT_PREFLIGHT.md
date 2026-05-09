# V1.6.1 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`

## Ergebnis

- Geplanter V1.6.1-Korb laut Matrix: 111 Karten (Runner 69 / Corp 42)
- Davon mit späteren Blockereffekten (`V1.7.1+`): 33 Karten
- Ohne spätere Blockereffekte: 78 Karten
- Als V1.6.1-Kern implementiert: 6 Karten
- Deferred in V1.6.1: 105 Karten

## Kernkorb

1. `onr_v1_023_evil-twin`
2. `onr_v1_028_force-shield`
3. `onr_v1_125_dermatech-bodyplating`
4. `onr_v1_229_code-corpse`
5. `onr_v1_231_cortical-scrub`
6. `onr_v1_254_liche`

## Deferred-Regel

Alle Karten außerhalb des Kernkorbs bleiben in V1.6.1 deferred, wenn mindestens eine Bedingung gilt:

- spätere verpflichtende Effektzuordnung (`V1.7.1+`)
- keine belastbare per-card Resolverzuordnung ohne Heuristik
- Scopeüberschneidung mit V1.6.2+ Mechanikpaketen
