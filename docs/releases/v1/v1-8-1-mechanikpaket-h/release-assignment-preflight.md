# V1.8.1 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen (Requirements-Freeze Eingang)

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- `docs/releases/v1/v1-7-1-mechanikpaket-e/plan-to-v1-8-1.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`

## Ergebnis

- Geplanter V1.8.1-Korb laut Matrix: 15 Karten
- Als V1.8.1-Kern implementiert: 12 Karten
- Deferred in V1.8.1: 3 Karten

## Kernkorb (freigabefähig)

1. `onr_v1_012_clown`
2. `onr_v1_046_pattels-virus`
3. `onr_v1_049_pox`
4. `onr_v1_094_inside-job`
5. `onr_v1_173_restrictive-net-zoning`
6. `onr_v1_193_corporate-coup`
7. `onr_v1_209_political-coup`
8. `onr_v1_222_ball-and-chain`
9. `onr_v1_225_canis-major`
10. `onr_v1_226_canis-minor`
11. `onr_v1_242_fatal-attractor`
12. `onr_v1_268_shock-r`

## Freigabe-Matrix je Karte

| Nr | CardId | Name | Entscheidung | Begründung |
| --- | --- | --- | --- | --- |
| 012 | onr_v1_012_clown | Clown | freigabefähig | Reiner Counter-/Encounter-Modifier ohne zusätzliche Würfelpflicht. |
| 013 | onr_v1_013_cockroach | Cockroach | deferred | Explizite Würfel-/Zufallsabhängigkeit laut Matrix (`L3_Deterministischer_Wuerfel_Zufall` -> V1.9.0). |
| 030 | onr_v1_030_grubb | Grubb | deferred | Offener Mechanikhinweis: remainder-of-run-Breaker-Strength-Lifecycle ist im aktuellen Scope nicht normiert; vorläufig deferred statt impliziter Erweiterung. |
| 034 | onr_v1_034_incubator | Incubator | deferred | Explizite Würfel-/Zufallsabhängigkeit laut Matrix (`L3_Deterministischer_Wuerfel_Zufall` -> V1.9.0). |
| 046 | onr_v1_046_pattels-virus | Pattel's Virus | freigabefähig | Virus-/Counter-Trigger ohne Würfelpfad; Purge- und Counter-Determinismus im Scope. |
| 049 | onr_v1_049_pox | Pox | freigabefähig | Servergebundene Virus-Counter plus Installkosten-Tax ohne Würfelpflicht. |
| 094 | onr_v1_094_inside-job | Inside Job | freigabefähig | Run-Flow-Erweiterung ohne Hidden-Info-Zusatzrisiko; sauber im Counter-/Run-Scope abbildbar. |
| 173 | onr_v1_173_restrictive-net-zoning | Restrictive Net Zoning | freigabefähig | Servergebundener Installkosten-Tax als deterministischer Persistenzpfad. |
| 193 | onr_v1_193_corporate-coup | Corporate Coup | freigabefähig | Agenda-Counterspeicher plus Click-Aktion im Scored-Agenda-Scope. |
| 209 | onr_v1_209_political-coup | Political Coup | freigabefähig | Agenda-Counterspeicher plus Click-Aktion im Scored-Agenda-Scope. |
| 222 | onr_v1_222_ball-and-chain | Ball and Chain | freigabefähig | Run-Tax-Flag für weitere Encounters; deterministisch über Run-State modellierbar. |
| 225 | onr_v1_225_canis-major | Canis Major | freigabefähig | Future-Encounter-Ice-Strength-Modifier ohne Würfelpflicht. |
| 226 | onr_v1_226_canis-minor | Canis Minor | freigabefähig | Future-Encounter-Ice-Strength-Modifier ohne Würfelpflicht. |
| 242 | onr_v1_242_fatal-attractor | Fatal Attractor | freigabefähig | Next-Encounter-Penalty-Trigger ohne Würfelpflicht; deterministische Encounter-Auswertung möglich. |
| 268 | onr_v1_268_shock-r | Shock.r | freigabefähig | Next-Encounter-Break-/Jackout-Lock deterministisch im Run-State modellierbar. |

## Deferred-Regel

Karten außerhalb des 12er-Kernkorbs bleiben in V1.8.1 deferred, wenn mindestens eine Bedingung gilt:

- zusätzliche Abhängigkeit zu `L3_Deterministischer_Wuerfel_Zufall` (`V1.9.0`)
- offener resolvernaher Mechanikhinweis ohne Bestandteil des V1.8.1-Counter-/Virus-/Purge-Scope