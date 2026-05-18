# V1.9.0 Release Assignment Preflight

Stand: 2026-05-10  
Status: abgeschlossen (Planungsfreeze-Eingang)

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/final-review.md`
- `docs/codex/CODEX_STATUS.md`

## Ergebnis

- Geplanter V1.9.0-Korb laut Matrix: 5 Karten
- V1.8.1-Deferred-Überhang: 3 Karten (`Cockroach`, `Incubator`, `Grubb`)
- Geplanter V1.9.0-Kern für dieses Gate: 5 Karten (ohne automatische Übernahme des Deferred-Überhangs)

## Kernkorb V1.9.0 (freigabefähig)

1. `onr_v1_005_bartmoss-memorial-icebreaker`
2. `onr_v1_007_blink`
3. `onr_v1_115_terrorist-reprisal`
4. `onr_v1_223_banpei`
5. `onr_v1_275_vacuum-link`

## Abhängigkeitsbefund je Kernkarte

| Nr | CardId | Name | Primäre fehlende Logik laut Matrix | Preflight-Entscheidung |
| --- | --- | --- | --- | --- |
| 005 | `onr_v1_005_bartmoss-memorial-icebreaker` | Bartmoss Memorial Icebreaker | `L3_Deterministischer_Wuerfel_Zufall` | freigabefähig in V1.9.0 |
| 007 | `onr_v1_007_blink` | Blink | `L3_Deterministischer_Wuerfel_Zufall` | freigabefähig in V1.9.0 |
| 115 | `onr_v1_115_terrorist-reprisal` | Terrorist Reprisal | `L3_Deterministischer_Wuerfel_Zufall` | freigabefähig in V1.9.0 |
| 223 | `onr_v1_223_banpei` | Banpei | `L4_Konkreter_Sonderresolver_noch_offen` | freigabefähig in V1.9.0 mit explizitem Banpei-Resolververtrag |
| 275 | `onr_v1_275_vacuum-link` | Vacuum Link | `L3_Deterministischer_Wuerfel_Zufall` | freigabefähig in V1.9.0 |

## Gelöste Preflight-Entscheidungen

1. `L3_Deterministischer_Wuerfel_Zufall` wird als zentraler Engine-Resolver in V1.9.0 gebaut und für alle vier Zufallskarten wiederverwendet.
2. `L4_Konkreter_Sonderresolver_noch_offen` wird für Banpei als konkret definierter Resolververtrag geführt (Programm-Entsorgung plus deterministischer Fallback).
3. `L2_Ambush_auf_Access_Resolver` wird in V1.9.0 als Foundationscope umgesetzt, aber ohne zusätzliche Kartenfreigabe im 5er-Kernkorb.
4. V1.8.1-Deferred-Karten bleiben für V1.9.0-Kernscope deferred:
   - `onr_v1_013_cockroach`: benötigt zusätzlich randomisierte HQ-Discard-Umlenkung im Counter-Kontext.
   - `onr_v1_034_incubator`: benötigt Start-of-turn-Multiroll plus Counter-Transform-Choice.
   - `onr_v1_030_grubb`: benötigt remainder-of-run-Breaker-Stärke-Lifecycle außerhalb des V1.9.0-Kerns.

## Deferred-Regel V1.9.0

Karten außerhalb des 5er-Kerns bleiben in V1.9.0 deferred, wenn mindestens eine Bedingung gilt:

- zusätzlicher Counter-/Choice-Lifecycle außerhalb des V1.9.0-Kernumfangs,
- zusätzlicher Breaker-Lifecycle über Encounter-Grenzen hinaus,
- zusätzliche Mechanikfamilie außerhalb `L2_Ambush`, `L3_Deterministischer_Wuerfel_Zufall`, `L4_Konkreter_Sonderresolver_noch_offen`.
