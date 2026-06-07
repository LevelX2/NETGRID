---
activityId: act-2026-06-07-ai-run-payoff-signal-inventory
status: inbox
kind: concept
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# AI-Run-Payoff-Signal-Inventar

## Ziel

Klären, welche aktiven Runner-Karten erfolgreiche Runs auf HQ, F&E, Archive, Außenserver oder beliebige Server aufwerten, abwerten oder funktional verändern, und ob diese Wirkung bereits als kontrollierte AI-Hints/Taktiksignale modelliert ist.

## Kontext und Quellen

- Nutzerhinweis vom 2026-06-07: Run-Zielbewertungen sollen nicht nur CardId-Sonderfälle kennen, sondern serverbezogene Boni/Mali aus AI-Hints beziehungsweise Taktiksignalen berücksichtigen.
- `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`: Taktiksignale beschreiben wiederverwendbare Funktion, nicht Kartentyp, Subtyp oder Name.
- `docs/architecture/ai/ai-strat-runner-intent-run-target-goals-automation-process-2026-06-07.md`: `RunnerRunTargetEvaluation` ist Teil der aktuellen Runner-Intent-/TacticalGoals-Linie.
- `packages/ai/src/runner-run-target-evaluation.ts`: aktuelle Run-Zielbewertung kennt Access-Payoff, Known-Access-State und einen engen Multiaccess-Check.
- `data/ai/tactic-signals-v1.json`, `data/ai/ai-card-hints-active.json`, `data/ai/function-signal-derivation-v1.json`.
- `data/cards/proteus-cards.json`, `packages/shared/src/index.ts`: Proteus-Beispiele wie `Crumble`, `Highlighter` und `Vienna 22` tragen serverbezogene Successful-Run-/Access-Payoffs.

## Scope

- Bestehende Signale und Hint-Felder für Run-, Access-, Virus-, Economy- und Risk-Payoffs inventarisieren.
- Aktive Runner-Karten anhand von Kartentext-/Mechanikmustern prüfen:
  - successful run on HQ,
  - successful run on R&D beziehungsweise F&E,
  - successful run on Archives,
  - successful run on a subsidiary data fort, remote oder Außenserver,
  - successful run allgemein,
  - whenever/after you access cards from HQ/R&D,
  - additional cards from HQ/R&D,
  - run ends, spend limit oder Run-Einschränkungen.
- Mindestens prüfen: `Crumble`, `Highlighter`, `Vienna 22`, `Boardwalk`, `Butcher Boy`, `Cockroach`, `Deep Thought`, `Cascade`, `Fait Accompli`, `Pox`, `Incubator`, `Pattel's Virus`, `Expert Schedule Analyzer`, `Microtech AI Interface`, HQ-/R&D-Interface-artige Karten und Preps mit serverbezogenem Run-Payoff.
- Trennen zwischen präzisen Funktionssignalen und optionalen Oberklassen. Ein generisches Server-Payoff-Signal darf präzise Wirkungen wie Multiaccess, Trash Pressure, Info, Counter-Aufbau, Economy oder Risiko nicht ersetzen.
- Ergebnis als kurzer Review unter `docs/reviews/ai/` oder als klarer Abschnitt in einer passenden bestehenden AI-Review-Datei dokumentieren.

## Nicht im Scope

- Keine direkte Runtime-Anbindung in `RunnerRunTargetEvaluation`.
- Keine neuen Strategy-IDs.
- Keine Engine-, LegalAction-, `applyAction`-, Replay- oder StateHash-Änderung.
- Keine Hidden-Info-Ausweitung.
- Keine Protheus-`ai_supported`-, `deck_legal`- oder `format_legal`-Freigabe.
- Keine pauschale Signalvermehrung aus Kartennamen, Subtypen oder Familiennamen.

## Akzeptanzkriterien

- [ ] Es gibt ein nachvollziehbares Inventar der relevanten Kartenfamilien und ihrer aktuellen AI-Hints/Taktiksignale.
- [ ] Für jede geprüfte Karte ist klar, ob sie sofortigen Access-Wert, künftigen Counter-Aufbau, Purge-Tax, Economy, Risiko/Malus oder nur eine formale Bedingung liefert.
- [ ] Fehlende Signale sind als kleine, wiederverwendbare Vorschläge benannt und begründet.
- [ ] Bestehende Signale wie `access.hq_multiaccess`, `access.rnd_multiaccess`, `access.rnd_topdeck_setup`, `info.hq` oder ähnliche vorhandene Begriffe werden bevorzugt, sofern sie fachlich passen.
- [ ] Offene Regelfragen oder unsichere Karten werden als Folgepakete statt als stillschweigende Implementierungsvorgabe notiert.

## Umsetzungshinweise

- Vor dem Ergänzen neuer Signale erst prüfen, ob die bestehende Ontologie bereits präzise genug ist.
- Serverbezogene Auslöser und Payoff-Art getrennt halten: Beispielhaft `run.hq_success_counter` nicht als Ersatz für `access.hq_multiaccess` verwenden.
- Risiken/Mali getrennt modellieren, zum Beispiel Ausgabenlimit, Run-Ende nach Nutzung, Low-Value-Run-Liability oder Self-Damage.
- Bei Protheus-Karten den aktuellen Status beachten: Human-vs-Human ist freigegeben, AI-Unterstützung bleibt ohne eigenes Gate geschlossen.

## Ergebnisnotiz

Noch offen.
