---
activityId: act-2026-06-07-runner-hand-development-creditbase-contract
status: done
kind: concept
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/architecture/ai/runner-hand-development-creditbase-contract-2026-06-07.md
  - docs/architecture/ai/README.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
checks:
  - git diff --check
---

# Runner-Handentwicklung und Creditbasis-Vertrag definieren

## Ziel

Die Runner-KI soll einen klaren fachlichen Vertrag dafür bekommen, wann eigene Handkarten und Creditaufbau als mittelfristige Entwicklungsziele wichtiger sind als ein weiterer schwacher Run.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Der Runner wirkt zu runzentriert, bleibt häufig bei 0 Credits und spielt außerhalb von Eisbrechern oder 0-Kosten-Karten selten nützliche Handkarten aus.
- Eingefügter Analyse-Text vom 2026-06-07: Vorgeschlagen werden `RunnerHandDevelopmentEvaluation`, `RunnerCreditBasePlan` und neue beziehungsweise präzisierte TacticalGoals für Boardentwicklung.
- AI-STRAT-Vorstand:
  - `docs/architecture/ai/ai-strat-runner-intent-run-target-goals-automation-process-2026-06-07.md`
  - `docs/reviews/ai/ai-strat-runner-intent-goals-final-report-2026-06-07.md`
- Relevante Codeanker:
  - `packages/ai/src/runner-strategic-intent.ts`
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/runner-tactical-goals.ts`
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/runner-plans.ts`

## Scope

- Bestehende AI-STRAT-Typen und TacticalGoals prüfen, insbesondere `runner.build_economy_base` und `runner.maintain_credit_and_hand_buffer`.
- Entscheiden, ob neue interne Goal-IDs nötig sind oder ob bestehende Goals durch präzisere Evidence und Subrollen reichen.
- Zielvertrag für `RunnerHandDevelopmentEvaluation` definieren:
  - Verfügbarkeit: legal spielbar, Credits fehlen, MU fehlt, Timing blockiert, aktuell nicht relevant.
  - Entwicklungsrolle: Access-Payoff, Breaker/Rig-Piece, Memory-Support, Economy-Engine, Banktool, Draw/Search, Defense, Run-Event, Duplikat/Low-Value, unbekannt.
  - strategische Passung, aktueller Bedarf, Priorität, FundingNeed, Defer-Reason und redigierte Evidence.
- Zielvertrag für `RunnerCreditBasePlan` definieren:
  - Credit-Floor,
  - gewünschte Reserve,
  - aktiver Run-FundingNeed,
  - nützliche Handkarten, die wegen Credits blockiert sind,
  - Economy-/Creditbase-Empfehlung.
- Übersteuerungsregeln definieren:
  - Remote-Score-Threat,
  - bekannter Agenda-Zugriff,
  - Survival-/Flatline-/Tag-Gefahr,
  - klarer High-Payoff-Run.
- Folgepakete bei Bedarf nachschärfen, falls die Analyse andere Schnittgrenzen empfiehlt.

## Nicht im Scope

- Keine Codeänderung.
- Keine neuen Strategy-IDs oder globalen Taktiksignaldateien.
- Keine neue Kartensemantik, Hintmigration oder Kartenfreigabe.
- Keine Änderung an Engine, `LegalActions`, `applyAction`, Replay, StateHash oder Zufallspfaden.
- Keine Nutzung verdeckter gegnerischer Kartendaten, FullState, Storage-Interna, `privatePayload` oder gegnerischer Decklisten.
- Keine pauschale "installiere alles"-Heuristik.

## Akzeptanzkriterien

- [ ] Es gibt ein kurzes Vertragsartefakt oder eine Ergebnisnotiz mit finalem Typ-/Goal-/Evidence-Schnitt.
- [ ] Der Vertrag benennt ausdrücklich, welche bestehenden AI-STRAT-Goals wiederverwendet oder erweitert werden.
- [ ] Credit-Floor, Handkarten-FundingNeed und Run-Übersteuerungen sind prüfbar beschrieben.
- [ ] Hidden-Info-, LegalAction-, Replay- und StateHash-Grenzen sind als harte Nicht-Scope-Grenzen enthalten.
- [ ] Die Folgeactivities bleiben passend oder werden konkret angepasst.

## Umsetzungshinweise

- Dieses Paket soll vor den Umsetzungspaketen gegriffen werden.
- Wenn die vorhandenen Goals reichen, keine neuen Goal-IDs erzwingen; dann lieber Evidence, Rollen und Mapping präzisieren.
- Konservative Defaults sind erwünscht: Unklare Karten werden nicht als starke Install-Ziele behandelt.

## Ergebnisnotiz

Abgeschlossen. Der Vertrag verwendet die bestehenden AI-STRAT-Goals weiter und erzwingt keine neuen Goal-IDs. Präzisiert wurden `RunnerHandDevelopmentEvaluation`, `RunnerCreditBasePlan`, Credit-Floors, blockierte FundingNeeds, Run-Übersteuerungen, redigierte Evidence, LegalAction-Grenzen sowie Hidden-Info-/Replay-/StateHash-Nicht-Scope-Grenzen. Die vier Folgeactivities bleiben passend und können auf dieser Vertragsbasis umgesetzt werden.
