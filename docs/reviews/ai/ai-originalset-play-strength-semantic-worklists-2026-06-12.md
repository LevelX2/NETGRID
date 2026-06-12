# AI Originalset Play-Strength Semantic Worklists 2026-06-12

## Status

diagnostic_worklists_only

## Scope

Dieses Artefakt schneidet Originalset-nahe Semantik-Lücken in prüfbare Worklists. Es ändert keine Hints, keine Card-Semantic-Profile, keine Runtime-Auswahl, keine Scores, keine Engine-Regeln und keine LegalAction-Erzeugung.

## Quellen

- `docs/reviews/ai/originalset-semantic-play-strength-backlog-2026-06-12.md`
- `docs/reviews/ai/ai028-r-netgrid-semantic-audit-pack-refresh-2026-06-03.md`
- `packages/ai/src/actions/action-semantic-invariants.ts`
- `packages/ai/src/actions/action-semantic-invariants.test.ts`

## Schnittregeln

- Taktiksignale müssen funktionale Wirkung beschreiben, nicht nur Kartentyp, Subtyp oder Namen.
- Damage, Tag, Conditions, TargetProfiles und RiskProjection bleiben getrennte Prüfflächen.
- TargetProfiles beschreiben nur bereits side-safe sichtbare oder legal angebotene Ziele.
- RiskProjection darf keine verdeckten Karten, Deckreihenfolge, private Payloads oder Engine-only Daten ableiten.
- Support-only-Signale erzeugen keine Strategieanker.
- Jede spätere Umsetzung muss `buildActionSemanticInvariantReport` grün halten.

## Worklists

| Worklist | Fokus | Prüffragen | Done-Gate | Nicht-Ziel |
| --- | --- | --- | --- | --- |
| `AI-ORIG-WL-01-runner-multiaccess-access-payoff` | Runner multiaccess / access payoff | Sind HQ-/R&D-/Archives-/Remote-Zugriffswerte als funktionale Payoff-Signale beschrieben? Sind Multiaccess, Trashwert, Agenda-Fenster und Kosten getrennt? | Kleine Kartenklasse mit side-safe Payoff-Signalen und Invariant-Test grün. | Keine Zielauswahl aus verdeckten Karten. |
| `AI-ORIG-WL-02-runner-breaker-search-install` | Runner breaker search / install | Trennen Search, Install, Coverage, Kosten und Encounter-Kontext sauber? Sind Breaker-Signale nicht nur Subtypnamen? | Search-/Install-TargetProfiles bleiben diagnostisch und LegalAction-gebunden. | Kein pauschaler `runner.search.breaker`-Anker aus generischem Search. |
| `AI-ORIG-WL-03-runner-survival-damage-prevention` | Runner survival / damage prevention | Sind Damage-Arten, Handpuffer, Prevention, Avoidance und riskante Runs getrennt? | Survival-Signale bleiben Boardstate-/Risk-getrieben und side-safe. | Kein Flatline-Wissen aus verdeckter Korp-Hand oder R&D. |
| `AI-ORIG-WL-04-runner-economy-banks-commitments` | Runner economy banks / commitments | Unterscheiden Signale sofortige Credits, gespeicherte Credits, Schulden, Commitments und Reservebedarf? | Economy-Signale nennen konkrete Finanzwirkung und verhindern Bank-over-target-Fehlschlüsse. | Keine generische Economy-Aufwertung ohne Funding Need. |
| `AI-ORIG-WL-05-runner-risky-random-run-tools` | Runner risky/random run tools | Sind Random Outcomes, self-damage, Run-Modifikatoren und Notausgänge als Risiko-/Opportunity-Projektion getrennt? | RiskProjection dokumentiert Unsicherheit und bleibt report-only. | Keine produktive Zufallsoptimierung ohne eigenes Gate. |
| `AI-ORIG-WL-06-corp-score-windows-advance-support` | Corp score windows / advance support | Sind Score, Advance-to-score, Overadvance, install-advance und Fake-Advance getrennt? | Scoreline-Signale hängen an legalen Score-/Advance-Fenstern und side-safe Advancement-Kontext. | Keine Scoring-Entscheidung aus Agenda-Identität, die nicht public oder legal sichtbar ist. |
| `AI-ORIG-WL-07-corp-rez-economy-ice-tax` | Corp rez economy / ICE tax | Trennen Signale Rez-Kosten, ICE-Tax, Schutzwert, Low-Rez-Reserve und Encounter-Zeitpunkt? | Rez-/Tax-Signale bleiben Kosten- und Timingpunkt-gebunden. | Keine globale ICE-Aufwertung nur wegen ICE-Subtyp. |
| `AI-ORIG-WL-08-corp-tag-punish` | Corp tag/punish | Sind Tag-Quelle, Tag-Zustand, Punish-Payoff, Trace und Conditions getrennt? | Tag-Punish-Signale beweisen sichtbare Tag- oder Trace-Basis. | Kein Punish-Anker ohne sichtbare Bedingung. |
| `AI-ORIG-WL-09-corp-damage-ambush-access-punish` | Corp damage/ambush/access-punish | Trennen Signale Damage, Ambush, Access-Punish, Installed-Remote-Rolle und Runner-Risiko? | Damage-/Ambush-Signale bleiben side-safe und nutzen keine verdeckte Remote-Identität. | Keine Ambush-Entscheidung aus versteckten Karten. |
| `AI-ORIG-WL-10-corp-asset-economy` | Corp asset economy | Sind Asset-Economy, Burst-Economy, persistent income, bait, protection und scoring remote roles getrennt? | Asset-Signale benennen funktionale Economy- oder Remote-Rolle ohne Targeting-Effekt. | Keine automatische Asset-Install-Auswahl. |
| `AI-ORIG-WL-11-target-profile-gaps` | TargetProfile gaps | Wo fehlen LegalAction-gebundene TargetProfiles für Server, Karten, ICE, Programme, Choices oder Costs? | Gaps werden als `required_but_no_profile` oder `profile_exists_no_legal_options` klassifiziert. | TargetProfiles erzeugen keine Ziele und heben kein `target_context_unavailable` auf. |
| `AI-ORIG-WL-12-risk-projection-gaps` | RiskProjection gaps | Wo fehlen explizite Risikoachsen für Damage, Tag, Bad Publicity, Random Outcome, Run-Kosten und Post-Run-Reserve? | RiskProjection-Gaps nennen sichtbare Quelle, Unsicherheitsstatus und Nicht-Verbraucher. | Keine Hidden-Info-Allowlist-Erweiterung. |

## Pflichtgate

Jede spätere Worklist-Umsetzung muss mindestens ausführen:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-invariants.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## No-Effect Contract

- `scope`: `diagnostic_worklists_only`
- `productiveUseAllowed`: `false`
- `semanticExecutionAllowed`: `false`
- `runtimeConsumerStatus`: `none`
- `noRuntimeEffect`: `true`
- Keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-, Default- oder UI-Wirkung.
