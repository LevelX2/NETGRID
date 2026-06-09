---
activityId: act-2026-06-09-icebreaker-special-effects-neutral-model
status: inbox
kind: architecture
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-06-08-blink-self-net-damage-risk-assessment
  - act-2026-06-08-blink-die-chronicle-transparency
resultArtifacts: []
checks: []
---

# Icebreaker-Specials neutral modellieren

## Ziel

Icebreaker-Sonderregeln sollen nicht dauerhaft als einzelne Kartennamen im allgemeinen Breaker-Adapter, Run-Tracking und KI-Risikocode wachsen. Wiederkehrende Muster wie zufälliger Break mit Schaden, Post-Encounter-Self-Trash-Check, Strength-Bonus pro Break und Run-End-Counter sollen als parametrisierte Special-Effects beziehungsweise Risk-Profile modelliert werden.

## Kontext und Quellen

- Architekturprüfung vom 2026-06-09 fand kartennamige Icebreaker-Specials in allgemeinen Pfaden:
  - `blink_random_break_or_net_damage`,
  - `bartmoss_post_encounter_self_trash_check`,
  - `snowball_run_strength_per_successful_break`,
  - `dupre_strength_counter_and_last_fort`.
- `packages/engine/src/game/run/runner-breaker-action-execution.ts` ruft mehrere Tracking-Funktionen pro Break auf, unter anderem `recordBartmossEncounterUsage`, `recordDupreBreakUsage` und `recordSnowballBreakUsage`.
- `packages/ai/src/runner-run-target-evaluation.ts` und `packages/ai/src/index.ts` enthalten ein spezifisches `BlinkRiskAssessment`.
- Das erledigte Paket `act-2026-06-08-blink-self-net-damage-risk-assessment` hat Blink bewusst als konkreten Risikofall gehärtet, aber eine generische Überarbeitung weiterer riskanter Icebreaker explizit aus dem Scope genommen.

## Scope

- Prüfen, welche Icebreaker-Specials echte Einzelkarten-Sonderfälle bleiben müssen und welche über ein neutrales Profil ausdrückbar sind.
- Ein kleines neutrales Modell entwerfen oder implementieren, zum Beispiel:
  - `random_break_or_damage` mit Würfel-/Schadensparametern,
  - `post_encounter_self_trash_check`,
  - `strength_bonus_per_successful_break_this_run`,
  - `record_breaker_used_this_run_for_end_cleanup`,
  - `run_end_add_counter_if_used_on_last_fort`.
- Engine-Tracking so umbauen, dass nicht mehrere kartennamige Recorder pauschal bei jeder Breaker-Nutzung aufgerufen werden müssen.
- KI-Risikoauswertung so vorbereiten, dass Blink-artige Risiken aus Profilparametern gelesen werden können, ohne die bestehende Blink-Härtung zu verlieren.
- Fokussierte Regressionen für Blink und mindestens eine weitere migrierte Special-Familie ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Änderung an Blink-Würfelwahrscheinlichkeit, Net-Damage, RandomDrawRecords, Replay oder StateHash.
- Keine Änderung an Bartmoss-, Snowball-, Dupré- oder anderen Kartentexten.
- Keine pauschale KI-Sperre für riskante Icebreaker.
- Keine vollständige Migration aller Icebreaker, wenn nur ein Muster sicher neutralisiert werden kann.
- Keine Entfernung sichtbarer Kartennamen aus Chroniktexten, wenn die Quelle öffentlich sichtbar ist.

## Akzeptanzkriterien

- [ ] Mindestens ein bisher kartennamiges Icebreaker-Special ist intern neutral parametrisiert.
- [ ] Die allgemeine Breaker-Ausführung ruft für die migrierte Familie keinen kartennamigen Recorder mehr pauschal auf.
- [ ] Blink-Risiko-Regressionen bleiben grün und verlieren keine Handpuffer-/Payoff-Evidence.
- [ ] Eine zweite Special-Familie oder ein zweiter Breaker-Tracking-Fall nutzt dasselbe Modell oder denselben Helper.
- [ ] Hidden-Info-, Random-, Replay- und StateHash-Grenzen bleiben unverändert.
- [ ] Fokussierte Engine- und AI-Tests decken den migrierten Spezialeffekt ab.

## Umsetzungshinweise

- Einstiegspunkte:
  - `packages/engine/src/ability-engine/icebreaker-abilities.ts`
  - `packages/engine/src/game/run/runner-breaker-action-execution.ts`
  - `packages/engine/src/game/run/run-end-cleanup.ts`
  - `packages/shared/src/index.ts`
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/index.ts`
- Bei Blink zuerst das bestehende Verhalten beibehalten und nur die Benennung/Parametrisierung schrittweise neutralisieren.
- Wenn AI-Risikoparametrisierung zu breit wird, Engine-Special-Neutralisierung und AI-Follow-up trennen.

## Ergebnisnotiz

Noch offen.
