# Proteus Technical Model Backlog

Status: `technical_model_backlog`

Datum: 2026-06-13

Bezug: AI-MAT5-18

## Ziel

Proteus-Karten werden nicht direkt über breitere Kartenlisten KI-fähig gemacht. Die Readiness wird in kleine technische Modellpakete übersetzt, die jeweils eigene Gates, Tests und report-only Diagnostik bekommen.

## Modellpakete

| Modell | Zweck | Beispiele / Trigger |
| --- | --- | --- |
| `random_outcome_model` | Zufällige Effekte vor Runtime-Nutzung deterministisch und seed-sicher beschreiben. | AI Board Member, Bargain with Viacox, Quest for Cattekin, Playful AI, Roadblock, Rio de Janeiro City Grid |
| `bad_publicity_model` | Bad-Publicity-Kosten, -Quellen und Payoffs getrennt von generischer Economy modellieren. | Karten mit Bad-Publicity-Kosten oder Bad-Publicity-Payoff |
| `hidden_resource_model` | Hidden-Resource-/Ambush-Zustände ohne Hidden-Info-Leak diagnostizieren. | versteckte Runner-Ressourcen, verdeckte Corp-Antworten |
| `virus_counter_model` | Virus-Counter, Purge-Druck und Counter-Auszahlung getrennt modellieren. | Virus-Programme, Counter-Wachstum, Purge-Fenster |
| `x_cost_model` | Variable X-Kosten als gebundene Entscheidung mit Budget, Ziel und erwarteter Wirkung ausdrücken. | X-Events, X-Abilities, variable Trash-/Trace-Kosten |
| `temporary_action_model` | Temporäre Aktionen, Extra-Aktionen und Verfallsfenster replay-sicher beschreiben. | zeitlich begrenzte Clicks, zusätzliche Actions |
| `access_ambush_model` | Access-Folgen, Ambush-Risiken und Trash-/Steal-Entscheidungen trennen. | Access-Schaden, Tag-Ambush, Program-/Hardware-Trash |
| `run_modification_model` | Run-Modifikatoren und Run-Struktur getrennt von tatsächlichem Payoff halten. | Umleitungen, zusätzliche Accesses, Run-Tax-Modifikatoren |

## Gates

- Keine Proteus-Runtime-Freigabe aus diesem Dokument.
- Keine neuen LegalActions oder Engine-Regeln.
- Keine Hidden-Info-Allowlist-Erweiterung.
- Jedes Modell braucht eigene Tests, Evidence-Hygiene und StateHash-/Replay-Verträglichkeit.

## Nächster Schnitt

Das erste technische Paket ist `random_outcome_model` als report-only Readiness-Modell, weil mehrere Proteus-Karten Zufall enthalten und ohne Modell weder deterministische KI-Bewertung noch sichere Follow-up-Pakete möglich sind.
