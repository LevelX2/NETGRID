# AI Play-Strength Snapshot Corpus 2026-06-11

## Status

`implemented_diagnostic`

## Zweck

Der Korpus erweitert die Decision-Snapshot-Suite um reproduzierbare Spielstärke-Szenarien. Die Szenarien testen Eigenschaften der neuen Decision-Spine-Diagnostik, nicht exakte CardId-Produktiventscheidungen.

## Positive Guard-Snapshots

| Snapshot | Side | Verbotene Mistakes | Erwartete Richtung |
| --- | --- | --- | --- |
| `runner_low_credits_no_run` | Runner | `unsafe_run`, `economy_starvation` | Creditaufbau statt riskanter Run. |
| `runner_safe_hq_access` | Runner | `missed_safe_access` | Sicherer zentraler Zugriff bleibt erkennbar. |
| `runner_remote_score_threat` | Runner | `ignored_remote_threat` | Remote-Score-Gefahr wird als Contest-Fenster abgebildet. |
| `runner_damage_buffer_needed` | Runner | `unsafe_run`, `ignored_damage_risk` | Damage-Risiko führt zu defensiver Vorbereitung statt Run. |
| `corp_score_window_available` | Corp | `missed_score_window` | Score-Fenster wird bevorzugt. |
| `corp_low_rez_reserve` | Corp | `bad_rez_spend` | Niedrige Rez-Reserve bevorzugt Economy statt Rez-Ausgabe. |

## Negativer Klassifikationsguard

`target_profile_missing` bleibt bewusst ein negativer Guard: Die Suite muss `target_choice_unavailable` klassifizieren, wenn ein Target-Resolution-Ziel ohne side-safe TargetContext bewertet wird.

## Grenzen

- Keine Produktivgewichtung wird geändert.
- Konkrete Snapshotnamen erzeugen keine Runtime-Sonderlogik.
- Der Korpus ist diagnostisch und dient als Grundlage für spätere Shadow-vs-Runtime-Reports und Kalibrierung.
