# Proteus Play-Strength Readiness Classes

Status: `historical_pre_rollout_review_superseded_by_default_pool_ready`

Datum: 2026-06-13

Bezugsprozess: AI-MAT3-20 aus `docs/architecture/ai/ai-play-strength-maturation-3-process-2026-06-13.md`.

Aktualisierung 2026-07-09: Die nachfolgenden Klassen dokumentieren den damaligen Vorbereitungsstand. Ihre Removal Conditions sind durch das Familieninventar, elf Szenariopakete, die neuen Entscheidungsmodelle, den grünen 16-Spiel-Pilot und KI-Deckpool 1.1.0 geschlossen. Aktueller Status: `default_pool_ready`; führend ist `docs/reviews/ai/proteus-ai-release-reconciliation-final-review-2026-07-09.md`.

## Ergebnis

Proteus ist technisch KI-deckzulässig und für explizit ausgewählte Playtest-Decks freigegeben. Die bisherigen Proteus-Hinweise werden in Ready-/No-Go-Klassen sortiert, damit diese begrenzte Zulassung nicht versehentlich als Default-/Random-Pool- oder vollständige Play-Strength-Freigabe gelesen wird.

## Klassen

| Klasse                                   | Bedeutung                                                                                    | Aktuelle Einordnung                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ready_for_semantic_inventory`           | Karten oder Mechanikfamilien dürfen semantisch inventarisiert werden.                        | Proteus-HQ-/Virus-/Derez- und Region-/Fast-Score-Snapshots als Diagnosequellen.                   |
| `ready_for_report_only_corpus`           | Real-Engine- oder Snapshot-Fälle dürfen als report-only Korpusbeispiele genutzt werden.      | RemoteContest-, TargetChoice- und DoctrineGoal-Diagnostik, solange keine Pilot-Aktivierung folgt. |
| `blocked_missing_target_choice_contract` | Ziele oder Choices sind ohne side-safe Engine-Kontext nicht bewertbar.                       | Mehrzielige Proteus-Effects, Hidden-Fort-Manipulation, komplexe Access-Folgen.                    |
| `blocked_missing_mechanic_contract`      | Engine-/LegalAction-Vertrag ist nicht ausreichend stabil oder noch nicht abstrahiert.        | Dynamische öffentliche ETR-ICE, Run-Spend-Caps, Post-Pass-Derez-Utility.                          |
| `blocked_hidden_info_risk`               | Bewertung würde verdeckte Daten, Deckreihenfolge oder unrevealed Remote-Identität riskieren. | Hidden-Fort-, Central-Access- und private-look-nahe Effekte.                                      |
| `blocked_play_strength_calibration`      | Mechanik ist engine-seitig möglich, aber KI-seitig nicht kalibriert.                         | Proteus-RemoteContest, tag/trace-punish-nahe Payoffs, Fast-Advance-Support.                       |

## Regeln für Folgepakete

- `ready_for_semantic_inventory` und `ready_for_report_only_corpus` erlauben Diagnose-, Coverage- und Review-Arbeit innerhalb des expliziten Selected-Deck-Playtests.
- Jede Bewegung in Richtung Default-/Random-Pool braucht familienbezogene Coverage und ein separates Pilotgate.
- `blocked_*`-Klassen sind Removal Conditions, keine Todo-Beschreibungen.
- Proteus-Karten werden nicht durch TargetChoiceShadow-, DoctrineGoal- oder Selfplay-Fortschritt automatisch freigegeben.

## Schlussfolgerung

Der nächste sinnvolle Proteus-Schritt ist ein maschinenlesbares Semantik-Inventar entlang der Klassen `blocked_missing_target_choice_contract` und `blocked_missing_mechanic_contract`. Erst wenn diese Blocker für einzelne Kartenfamilien entfernt und durch Real-Engine-Evidence geschlossen sind, darf die Default-/Random-Pool-Promotion erfolgen.
