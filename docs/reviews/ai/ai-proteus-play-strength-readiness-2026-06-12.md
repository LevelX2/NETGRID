# AI Proteus Play-Strength Readiness 2026-06-12

## Status

diagnostic_readiness_only

## Scope

Dieses Artefakt bewertet Proteus-Play-Strength-Readiness nur diagnostisch. Proteus wird für die KI dadurch nicht produktiv geöffnet. Es gibt keine neuen Hints, keine Card-Semantic-Profile, keine Runtime-Auswahl, keine Scores, keine Engine-Regeln und keine LegalAction-Erzeugung.

## Roadmap-Gate

Proteus bleibt für KI-Play-Strength zurückgestellt, bis Originalset-Semantik, ActionSemanticCandidate-Brücke, TargetChoiceShadow und RiskProjection stabiler sind. Die nächsten Arbeiten sind daher Lücken sichtbar machen, nicht Runtime-Aktivierung.

## Readiness-Matrix

| Readiness-ID | Bereich | Hauptlücke | Benötigte Vorarbeit | Nicht-Ziel |
| --- | --- | --- | --- | --- |
| `AI-PROTEUS-READ-01-random-outcomes` | Random outcomes | Zufällige Ergebnisse brauchen Seed-/Outcome-Projektion und getrennte Follow-up-Bewertung. | Report-only OutcomeProjection mit Unsicherheitsstatus. | Keine produktive Optimierung von Zufallsausgängen. |
| `AI-PROTEUS-READ-02-bad-publicity` | Bad Publicity | Kosten-/Payoff-Logik muss Bad-Publicity-Gain, -Loss und Schwellen sauber trennen. | Side-safe Cost-/RiskProjection für Bad-Publicity-Kontexte. | Keine pauschale Bad-Publicity-Vermeidung ohne Spielzustand. |
| `AI-PROTEUS-READ-03-ambush-virus` | Ambush/Virus | Ambush-Risiko, Virus-Counter, Purge-Druck und Access-Punish sind vermischt. | Getrennte Damage-, Counter-, Access- und RemoteRole-Signale. | Keine Ambush-Erkennung aus verdeckter Remote-Identität. |
| `AI-PROTEUS-READ-04-variable-x-costs` | variable X costs | X-Kosten brauchen Budgetfenster, Grenznutzen und Post-Action-Reserve. | CostProjection mit min/max/selected-X nur aus LegalAction und PlayerView. | Keine X-Auswahl außerhalb der Engine-Choice. |
| `AI-PROTEUS-READ-05-temporary-actions` | temporary actions | Temporäre Aktionen, einmalige Modifier und delayed effects brauchen Ablauf-/Timing-Kontext. | Condition-/TimingProfile für sichtbare Duration und Expiry. | Keine versteckte Ablaufzustandsableitung. |
| `AI-PROTEUS-READ-06-complex-run-modification` | complex run modification | Bypass, additional subroutines, run-end, access replacement und post-run effects brauchen getrennte Risikoachsen. | RunProjectionSummary plus RiskProjection für sichtbare Modifikatoren. | Keine direkte Runner-Pilotfreigabe für komplexe Proteus-Runs. |
| `AI-PROTEUS-READ-07-target-choice-gaps` | TargetChoice gaps | Proteus-Ziele können Karten, Server, ICE, Programme, Counters, Choices oder hosted Cards betreffen. | TargetProfile-Taxonomie nur für bereits legal angebotene Ziele. | Keine TargetProfile-Materialisierung ohne LegalAction-Zieloptionen. |
| `AI-PROTEUS-READ-08-risk-projection-gaps` | RiskProjection gaps | Proteus-Risiken sind stärker zustands- und timingabhängig als Originalset-Basics. | RiskProjection mit Quelle, Sichtbarkeit, Unsicherheit und Nicht-Verbraucherstatus. | Keine Hidden-Info-Allowlist-Erweiterung. |

## Prüfregeln

- Proteus-Readiness bleibt report-only.
- Originalset-Worklists haben Vorrang vor Proteus-Aktivierung.
- ActionSemanticCandidate muss Ziel-, Kosten-, Timing- und RiskProjection-Signale getrennt führen.
- TargetChoiceShadow darf Proteus-Ziele erst bewerten, wenn LegalAction-Zieloptionen side-safe vorliegen.
- RiskProjection darf keine verdeckten Kartendaten, Deckreihenfolge, private Payloads oder Engine-only Marker enthalten.

## Pflichtgate

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-invariants.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## No-Effect Contract

- `scope`: `diagnostic_readiness_only`
- `productiveUseAllowed`: `false`
- `semanticExecutionAllowed`: `false`
- `runtimeConsumerStatus`: `none`
- `noRuntimeEffect`: `true`
- Keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-, Default- oder UI-Wirkung.
