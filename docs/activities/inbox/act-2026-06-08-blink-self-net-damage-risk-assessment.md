---
activityId: act-2026-06-08-blink-self-net-damage-risk-assessment
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Blink Self-Net-Damage Risk Assessment

## Ziel

Die Runner-KI bewertet `Blink` nicht mehr wie sichere Universal-Coverage, sondern als riskanten Icebreaker: Runs und Encounter-Break-Actions, die realistisch auf Blink angewiesen sind, werden anhand von Handkartenpuffer, möglichem Net-Damage-Fehlschlag, Run-Payoff und stabilen Alternativen bewertet.

## Kontext und Quellen

- Nutzer-Folgeauftrag vom 2026-06-08 aus eingefügter Vorgabe `AI-RISK-BLINK-1: Blink Self-Net-Damage Risk Assessment`.
- `Blink` ist ein Runner-Icebreaker mit deterministischem Würfelresolver: Für `0 Credits` wird ein Würfel geworfen; bei 4, 5 oder 6 wird eine Subroutine gebrochen, sonst erleidet der Runner entsprechend 1, 2 oder 3 Net Damage. Die Fähigkeit darf nur einmal pro Subroutine während einer Begegnung genutzt werden.
- Bestehende AI-Hints markieren `Blink` bereits grob als `random_breaker`, `random_outcome` und im `breakerProfile.sideEffects` als `random_failure`.
- Bestehende Self-Damage-Guardrails decken direkte Self-Damage-Aktionen wie `Faked Hit` ab, aber nicht automatisch eine Breaker-Fähigkeit, deren Schaden erst während eines Runs durch zufälligen Fehlschlag entsteht.
- Separates UI-/Chronik-Paket: `docs/activities/inbox/act-2026-06-08-blink-die-chronicle-transparency.md` macht Wurf und Ergebnis sichtbar, ändert aber bewusst keine KI-Prioritäten, Run-Zielwahl oder Encounter-Strategie.

## Scope

- Lean Local Mode: keine Gate-Kaskade, keine Release-Neuplanung.
- Vorhandene Semantik/Hints für `Blink` prüfen und nutzen, insbesondere `random_breaker`, `random_failure`, `riskTags` und Breaker-Coverage.
- Falls eine präzise Risiko-Semantik für Blink fehlt, minimal ergänzen oder als Review-Finding dokumentieren.
- Ein `BlinkRiskAssessment` oder gleichwertiges lokales Bewertungsmodell einführen, das mindestens diese Felder oder äquivalente Debug-Facts berechnet:
  - `currentHandCount`
  - `handAfterActionCost`
  - `blinkUsesLikely`
  - `visibleSubroutinesLikely`
  - `maxSingleFailureDamage = 3`
  - `worstCaseDamageEstimate`
  - `lethalOnAnyFailure`
  - `lethalOnHighFailure`
  - `survivesOneFailedBlinkUse`
  - `riskSeverity: none | low | medium | high | lethal`
  - `payoffOverride: none | known_agenda | remote_score_threat | immediate_win | survival`
- `RunnerRunTargetEvaluation` anbinden: Wenn ein sichtbarer Pfad nur durch Blink oder riskante Universal-Coverage erreichbar wirkt, Runs bei zu wenig Handkarten abwerten, blockieren oder auf Setup/Draw umlenken.
- Encounter-/Breaker-Action-Bewertung anbinden: Wenn eine legale `break_subroutine`-Action `Blink` nutzt, darf die KI bei möglichem tödlichem Fehlschlag nicht normal wählen, außer ein klarer Immediate-Win-/Notfallgrund trägt die Entscheidung.
- Debug/Evidence redigiert ergänzen, zum Beispiel:
  - `blinkRiskApplied`
  - `blinkHandBuffer`
  - `blinkUsesLikely`
  - `blinkRiskSeverity`
  - `survivesOneFailedBlinkUse`
  - `lethalBlinkFailureRisk`
  - `why_blink_run_blocked`
  - `why_blink_run_allowed_despite_risk`
- TacticalGoals ergänzen, wenn der bestehende Goal-Pfad dafür geeignet ist:
  - `runner.draw_for_damage_buffer`
  - `runner.find_stable_breaker_first`
  - `runner.avoid_low_value_risky_run`
  - `runner.build_hand_buffer_before_blink_run`

## Nicht im Scope

- Keine Engine-Änderung.
- Keine LegalAction-Erzeugungsänderung.
- Keine Änderung an `applyAction`, Replay, StateHash, `RandomDrawRecords` oder der Blink-Würfellogik.
- Keine neue Strategy-ID, wenn bestehende Risiko-/Setup-/Run-Goal-Strukturen ausreichen.
- Keine Hidden-Info-Ausweitung in KI-Inputs, Debug, PublicEvents oder Reconnect-Payloads.
- Keine pauschale Sperre aller Blink-Runs.
- Keine generische Überarbeitung aller riskanten Icebreaker; falls weitere Karten betroffen sind, separate Folge-Activities anlegen.
- Keine Chronik-/UI-Textkorrektur; dafür existiert das separate Blink-Chronik-Paket.

## Akzeptanzkriterien

- [ ] Die KI behandelt `Blink` nicht mehr als sichere Universal-Coverage, wenn ein Run-Pfad realistisch Blink-Breaks benötigt.
- [ ] Bei `Blink` installiert, 0 Handkarten und Run-Pfad erfordert Blink: Die KI startet den Run nicht oder wählt im Encounter keine tödlich riskante Blink-Break-Action.
- [ ] Bei `Blink` installiert, 1 Handkarte und Low-Value-HQ-/R&D-Ziel: Die KI wählt keinen riskanten Blink-Run.
- [ ] Bei `Blink` installiert, 2 Handkarten und bekannt niedrigem Payoff-Ziel: Die KI wählt keinen riskanten Blink-Run.
- [ ] Bei `Blink` installiert, mindestens 3 Handkarten und plausiblem unbekanntem oder hohem Payoff: Ein Blink-Run bleibt möglich, aber mit sichtbarer Risiko-Evidence.
- [ ] Bei Remote Score Threat, bekannter Agenda oder Immediate-Win-Situation kann ein riskanter Blink-Run nur begründet zugelassen werden; Debug/Evidence erklärt den Override.
- [ ] Wenn eine stabile Breaker-Alternative vorhanden und bezahlbar ist, bevorzugt die KI stabile Coverage gegenüber riskantem Blink.
- [ ] Encounter-`break_subroutine`-LegalActions mit Blink werden bei lethal failure risk hart ausgeschlossen oder extrem abgewertet, solange kein Immediate-Win-/Notfallgrund besteht.
- [ ] Die finale Action bleibt immer aus `input.legalActions`.
- [ ] Hidden-Info-, Redaction-, Replay- und StateHash-Grenzen bleiben unverändert.

## Umsetzungshinweise

- Primärfolgeagent: `card-enablement-ai-knowledge-agent`, weil Kartenverhalten, AI-Hints, RunnerRunTargetEvaluation, Encounter-Action-Scoring und Hidden-Info-Grenzen zusammenpassen müssen.
- Geeignete Einstiegspfade prüfen:
  - `packages/ai/src/index.ts` für Runner-Entscheidung, Self-Damage-Guardrails, Semantic-Runtime-Exclusions und Encounter-Action-Scoring.
  - `packages/ai/src/visible-run-analysis.ts` für sichtbare Breaker-/ICE-Pfade und Run-Reachability.
  - `packages/ai/src/runner-tactical-goals.ts` für Risiko-/Setup-TacticalGoals.
  - `data/ai/ai-card-hints-active.json` und kompilierte Hint-Spuren für Blink-Risikosignale.
- Keine verdeckten Kartenidentitäten verwenden. Handkartenpuffer darf nur über side-sichere Counts beziehungsweise eigene Runner-Handsicht bewertet werden.
- Bestehende Self-Damage-Guardrail als Muster nutzen, aber Blink nicht fälschlich als normale Self-Damage-Karte modellieren, wenn das die Timing- oder LegalAction-Grenzen verwischt.
- Falls die genaue Anzahl benötigter Blink-Nutzungen im Pre-Run-Pfad nicht sicher bestimmbar ist, konservativ über sichtbare ungebrochene End-the-run-Subroutinen oder bekannte Breaker-Reachability schätzen und die Unsicherheit im Debug ausgeben.
- Bei mehreren Subroutinen muss das Risiko stärker steigen; perfekte Wahrscheinlichkeitsrechnung ist nicht erforderlich, aber die Mindestlogik muss konservativ sein:
  - 0 Handkarten: jeder Fehlschlag flatlined.
  - 1 Handkarte: Wurf 2 oder 3 flatlined.
  - 2 Handkarten: Wurf 3 flatlined.
  - 3+ Handkarten: ein einzelner Fehlschlag ist überlebbar.

## Checks

- `corepack pnpm --filter @netgrid/ai typecheck`
- Fokussierte Vitest-Dateien je nach berührten Pfaden, zum Beispiel für `runner-run-target-evaluation`, `visible-run-analysis`, `action-semantic-candidate`, `semantic-runtime-cutover` oder bestehende Runner-KI-Tests.
- `git diff --check`

## Ergebnisnotiz

Noch offen.
