# Originalset Semantic Worklist Packages

Status: `package_candidates_ready`

Datum: 2026-06-13

Bezugsprozess: AI-MAT3-19 aus `docs/architecture/ai/ai-play-strength-maturation-3-process-2026-06-13.md`.

## Ziel

Die Originalset-Arbeitsliste wird nicht als breites Hint- oder Runtime-Paket fortgeführt, sondern in kleine, prüfbare Folgepakete geschnitten. Alle Pakete bleiben LegalActions-only, side-safe und diagnostisch, bis ein separates Gate eine Runtime-Nutzung erlaubt.

## Paketvorschläge

| Paket | Scope | Done-Gate |
| --- | --- | --- |
| `ORIG-AI-1 central pressure target profiles` | HQ/R&D/Archives-Druck in ActionSemanticCandidate und TargetChoiceShadow schärfen. | Real-Engine-Corpus enthält je ein HQ-, R&D- und Archives-Beispiel mit side-safe TargetContext; TargetChoice-Coverage bleibt redaction-safe. |
| `ORIG-AI-2 remote contest target profiles` | Remote-Agenda-/Asset-/Upgrade-Wertprofile für Runner-Contest trennen. | RemoteContest bleibt report-only; TargetChoiceShadow unterscheidet Score-Threat und Trash-Value-Beispiele. |
| `ORIG-AI-3 breaker coverage search semantics` | Search-/Draw-/Install-Fälle für fehlende Barrier/Code-Gate/Sentry-Coverage konkretisieren. | RunnerCoverageGoal-Tests decken sichtbare Install-, Search- und Draw-Pfade ohne Hidden-Deckdaten ab. |
| `ORIG-AI-4 corp central defense doctrine` | HQ- und R&D-Defense aus DoctrineGoal und Corp-Install-/Rez-Diagnostik getrennt bewerten. | DoctrineGoal-Coverage weist separate HQ-/R&D-Ziele aus; keine Scoring-Neugewichtung ohne Snapshot-Evidence. |
| `ORIG-AI-5 score-window payload coverage` | Corp `score_agenda`/`advance_card`-Payloads breiter im Real-Engine-Korpus abdecken. | ShadowLeague zeigt stabile Corp-Score-Window-Metriken ohne neue Forbidden-Mistake-Klasse. |
| `ORIG-AI-6 discard and choice option semantics` | Echte `resolve_choice`-Fälle, vor allem Discard, in TargetChoiceShadow-Coverage ausbauen. | Choice-Optionen werden gerankt, aber es werden keine produktiven `selectedChoices` erzeugt. |

## Nicht-Ziele

- Keine Aktivierung neuer Pilot-Defaults.
- Keine neue Engine-Regel oder LegalAction.
- Keine Hidden-Info-Allowlist-Erweiterung.
- Keine Kartenfreigabe allein durch bessere KI-Semantik.

## Schlussfolgerung

Die nächsten Originalset-Arbeiten sollen über diese Paketkandidaten einzeln umgesetzt werden. Der wichtigste erste Schnitt ist `ORIG-AI-3`, weil RunnerCoverageGoal und Doctrine-Search bereits in AI-MAT3 vorbereitet wurden und direkte Regressionstests möglich sind.

## AI-MAT4-14 Umsetzung: Runner Breaker/Search Paket 1

Status: `diagnostic_tests_added`

Scope:

- Self-Modifying Code
- Mystery Box
- The Short Circuit
- Mantis, Fixer-at-Large
- Temple Microcode Outlet
- Test Spin

Abdeckung:

- Such-/Installationssignale werden als funktionale Coverage-Signale geprüft.
- `runner.doctrine.breaker_search` wird ohne Hidden-Deckdaten auf side-safe Search-Actions gemappt.
- TargetChoice-/TargetProfile-Lücken bleiben als diagnostische Gaps sichtbar.
- Temporäre und zufällige Such-/Installationswirkung bleibt RiskProjection-/TargetProfile-Folgearbeit.
- Keine produktive Karten-Sonderlogik, keine Runtime-Aktivierung.

## AI-MAT4-15 Umsetzung: Runner Survival/Risk Paket 1

Status: `diagnostic_tests_added`

Scope:

- Arasaka Owns You
- Emergency Self-Construct
- Force Shield
- Shield
- Armored Fridge
- Trauma Team
- Lifesaver Nanosurgeons
- Preying Mantis
- Quest for Cattekin
- Lucidrine Booster Drug

Abdeckung:

- Survival-Signale, Flatline-Prävention und Damage-Prevention werden getrennt geprüft.
- `risk.self_brain_damage`, `risk.action_loss` und `risk.random_damage` bleiben explizite RiskProjection-Flächen.
- Damage-Prevention-Type-Precision bleibt diagnostisch; keine Runtime- oder Engine-Freigabe.

## AI-MAT4-16 Umsetzung: Corp Score/Advance Paket 1

Status: `diagnostic_tests_added`

Scope:

- Project Consultants
- Management Shake-Up
- Systematic Layoffs
- Team Restructuring
- Falsified-Transactions Expert
- Chicago Branch
- Vapor Ops
- Project Babylon
- Project Venice

Abdeckung:

- `advance.counter_placement`, `advance.counter_transfer`, `advance.overadvance_support` und `advance.counter_cashout` werden getrennt als funktionale Signale geprüft.
- Corp-Scoreline-Doctrine-Links bleiben diagnostisch und erzeugen keine Scoring-Neugewichtung.
- TargetProfile-Gaps bleiben sichtbar; keine produktive Karten-Sonderlogik.

## AI-MAT4-17 Umsetzung: Corp Tag/Punish Paket 1

Status: `diagnostic_tests_added`

Scope:

- Closed Accounts
- Scorched Earth
- Punitive Counterstrike
- Urban Renewal
- Netwatch Operations Office
- Private Cybernet Police
- City Surveillance
- Data Raven
- TRAP!
- Solo Squad

Abdeckung:

- Tag-Quelle, Tag-Payoff und Tag-Snowball werden als getrennte Signale geprüft.
- Meat-Damage-Payoffs, Resource-Trash und Access-Tag-Ambush bleiben getrennt.
- `condition.requires_tagged_runner` bleibt Folge-Gate; keine Strategie ohne vollständige Source-/Payoff-Kette.

## AI-MAT4-18 Umsetzung: Corp Damage/Ambush Paket 1

Status: `diagnostic_tests_added`

Scope:

- Setup!
- Vacant Soulkiller
- Virus Test Site
- Experimental AI
- Corprunner's Shattered Remains
- Dedicated Response Team
- TRAP!
- Bolter Cluster
- Cinderella
- Code Corpse
- Wall of Ice

Abdeckung:

- Net-, Brain- und Meat-Damage-Ambush-Signale bleiben getrennt.
- Program-/Hardware-Trash und ICE-Damage werden getrennt von generischem Damage-Payoff geprüft.
- Kein `damage.payoff` allein reicht für Strategie; TargetProfile- und RiskProjection-Gaps bleiben sichtbar.
