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
