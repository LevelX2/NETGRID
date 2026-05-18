---
activityId: act-2026-05-17-belief-world-rollout-spike
status: done
kind: architecture
area: ai
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy:
  - act-2026-05-17-ai-belief-reconnect-undo-contract
  - act-2026-05-17-ai-match-progression-benchmark
resultArtifacts:
  - docs/activities/done/act-2026-05-17-belief-world-rollout-spike.md
checks:
  - git diff --check (grün)
---

# Spike für faire Belief-World-Rollouts

## Ziel

Prüfen, ob die KI langfristig mehrere hypothetische Welten aus ihrem Belief State auswerten kann, ohne echte Hidden Info, FullState oder gegnerische Decklisten zu verwenden. Ergebnis soll eine klare Go/No-Go-Entscheidung oder ein sehr kleiner Prototyp-Schnitt sein.

## Kontext und Quellen

- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, Abschnitt `P2: Faire Belief-World-Rollouts`.
- Die Analyse bewertet diesen Weg als strategisch nützlich, aber wegen Cheating- und Komplexitätsrisiko ausdrücklich P2.
- `docs/activities/done/act-2026-05-17-ai-belief-reconnect-undo-contract.md` belegt inzwischen, dass Belief-Rekonstruktion aus side-sicheren Eventprojektionen, `PlayerView` und `LegalActions` signaturstabil bleibt und `Replay.privatePayload` nicht verwendet.
- `docs/activities/done/act-2026-05-17-ai-match-progression-benchmark.md` belegt einen diagnostischen Benchmark, aber auch vollständige Action-Limit-Stagnation im kurzen Fenster.
- Aktueller Codeanker: `packages/ai/src/belief-state.ts` rekonstruiert `BeliefState` aus side-sicherem AI-Input; `packages/ai/src/index.ts` enthält mit `createBeliefSimulationWorld` bereits eine redaction-sichere, nicht-produktive Weltbeschreibung aus Belief-Hypothesen.

## Scope

- Einen Spike-Report oder Minimalprototyp entwerfen, der Belief-Hypothesen von echtem Hidden State trennt.
- Anforderungen an getrennte RNG-Nutzung, Seedbarkeit und Nicht-Kopplung an Engine-Replay festhalten.
- Hidden-State-Variantentest planen oder prototypisch anlegen: gleiche sichtbare Projektion muss gleiche Entscheidung erzeugen.
- Klären, ob Rollouts zuerst nur als Analyse-/Benchmarkwerkzeug laufen dürfen, nicht als Live-Controller.

## Nicht im Scope

- Keine produktive Rollout-KI.
- Keine Nutzung echter verdeckter Kartenidentitäten, FullState, gegnerischer Decklisten oder Storage-Interna.
- Keine Änderung an LegalActions, applyAction, Replay oder StateHash.
- Keine LLM-basierte Regelauslegung.

## Findings

### Hoch: Live-Rollouts wären aktuell kein zulässiger Produktpfad

Risiko: Ein Live-Controller, der Sample-Welten bewertet, kann versehentlich echte Hidden-Zone-Identitäten, gegnerische Decklisten oder Engine-/Storage-Interna nutzen. Das würde die NETGRID-Grundregel verletzen, dass KI nur aus `PlayerView`, side-sicheren `PublicEvents`, `LegalActions` und ausdrücklich erlaubten Metadaten entscheiden darf.

Fundstellen:

- `packages/ai/AGENTS.md`: AI darf nie Full GameState erhalten und muss nur LegalActions wählen.
- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`, `P2: Faire Belief-World-Rollouts`: Nutzen strategisch, Risiko sehr hoch; No-Cheat-Gate ohne FullState, echte verdeckte Kartenidentitäten oder gegnerische Decklisten.
- `docs/reviews/ai/match-progression-benchmark-2026-05-17.md`: aktuelle Candidate- und Baseline-Profile stagnieren im Diagnosefenster vollständig im Action-Limit. Rollouts würden derzeit eher schwache Basisheuristiken amplifizieren als belastbar bessere Strategie messen.

Empfehlung: Kein Go für produktive oder matchaktive Rollout-KI. Rollouts dürfen vorerst nur als explizit experimentelles Analyse- oder Benchmarkwerkzeug mit eigenen Safety-Gates geplant werden.

### Mittel: Belief-Hypothesen sind eine brauchbare, aber noch zu schmale Weltquelle

Risiko: `BeliefState` enthält rechtmäßig sichtbare Fakten, Unsicherheiten und erste Hypothesen wie unbekannte Remote-Root-Karten oder unrezzed ICE-Risiko. Daraus kann ein Sample-Welt-Modell entstehen. Die Hypothesen sind aber abstrahiert und dürfen nicht durch Katalog-, Decklisten- oder FullState-Wissen "aufgefüllt" werden.

Fundstellen:

- `packages/ai/src/belief-state.ts`: `BeliefKnowledgeKind` trennt `public_fact`, `own_private_fact`, `revealed_opponent_fact`, `hypothesis` und `unknown`.
- `packages/ai/src/belief-state.ts`: `buildAssumptions` setzt unter anderem `hidden_corp_information_not_used`, `hidden_runner_information_not_used` und `belief_state_reconstructed_from_side_safe_history`.
- `packages/ai/src/index.ts`: `createBeliefSimulationWorld` übernimmt nur Hypothesen-Subjects aus `BeliefState` und prüft `assertAiInputIsSideSafe(input)`.

Empfehlung: Sample-Welten dürfen ausschließlich aus versionierten `BeliefState.entries` mit `kind === "hypothesis"`, `unknown`-Counts, sichtbaren Board-Fakten, eigenen privaten Karten und rechtmäßig offenbarten gegnerischen Fakten entstehen. Verboten bleiben echte verdeckte Definitionen, gegnerische Decklisten, `cardInstances`, `privatePayload`, Storage-Snapshots und Replay-Private-Daten.

### Mittel: RNG, Replay und StateHash brauchen eine harte Simulationsgrenze

Risiko: Wenn Rollout-Zufall den Engine-Seed, `RandomCounter`, `RandomDrawRecords` oder Replay-Events des echten Matches berührt, entsteht entweder Nondeterminismus im Match oder eine falsche Kopplung zwischen Analyse und Regelautorität.

Fundstellen:

- `packages/engine/AGENTS.md`: Engine-Funktionen müssen für gleichen Initialzustand, Seed und Eventlog deterministisch sein; erfolgreiche Transitionen emittieren `resultingStateHash`.
- AGENTS.md-Projektprinzipien: Zufall läuft über Seed, `RandomCounter` und `RandomDrawRecords`; deterministisches Replay und StateHash sind Pflicht.
- `packages/ai/src/index.test.ts`: bestehende Simulationstests prüfen bereits getrennte `simulationRngSeed`-Deterministik und unveränderten echten Match-StateHash für normale AI-Simulationen.

Empfehlung: Ein späterer Rollout-Prototyp verwendet einen eigenen `rolloutSeed`, eigene `rolloutRngCounter` und reine Analyse-Resultate. Er schreibt keine Engine-Events, keine `RandomDrawRecords`, keine `PlayerAction`, keine Replay-Daten und keinen Match-`StateHash`. Der echte Match-StateHash muss vor und nach jeder Rollout-Auswertung bytegleich bleiben.

### Niedrig: Hidden-State-Variantentest ist das zentrale Sicherheits-Gate

Risiko: Redaction-Checks allein beweisen nicht, dass Entscheidungen invariant bleiben. Zwei reale States können dieselbe sichtbare Projektion haben, aber unterschiedliche verdeckte Karten. Eine faire KI muss in beiden Fällen dieselbe Aktion oder dieselbe geordnete Aktionspräferenz erzeugen, solange Belief, `PlayerView`, `PublicEvents` und `LegalActions` identisch sind.

Fundstellen:

- `docs/activities/done/act-2026-05-17-ai-belief-reconnect-undo-contract.md`: gleiche side-sichere Projektionen erzeugen gleiche Belief-Signaturen für Runner und Korp.
- `packages/ai/src/index.test.ts`: bestehende Tests prüfen bereits Hidden-State-Invarianz für sichtbare Runner-Entscheidungen und Belief-Signaturen.

Empfehlung: Rollout-Prototyp erst akzeptieren, wenn ein Fixture-Paar mit identischer sichtbarer Projektion, identischen LegalActions und unterschiedlichen echten Hidden-Zone-Definitionen dieselbe Rollout-Welt-Signatur, dieselbe Entscheidung und dieselben Safety-Metriken erzeugt. Jede Abweichung ist No-Go, bis die Quelle nachweislich nur sichtbare Daten betrifft.

## Vorgeschlagene Architektur

```text
AiDecisionInput
  -> reconstructBeliefState(input)
  -> BeliefWorldSampler
       Input: BeliefState, PlayerView, LegalActions, rolloutSeed
       Verboten: FullState, cardInstances, privatePayload, Storage, Decklisten
       Output: abstrakte BeliefWorld[] mit Hypothesen-IDs, nicht echten Karteninstanzen
  -> RolloutEvaluator
       Input: BeliefWorld[], LegalActions, sichtbare Bewertungsfunktionen
       Verboten: applyAction auf echtem Match-State, Replay-Schreibzugriff
       Output: DecisionScores/Debug nur redigiert und side-sicher
  -> Normaler AI-Selector
       Darf weiterhin nur eine vorhandene LegalAction wählen
```

Belief-Welten sind keine Engine-States. Sie sind DTOs mit abstrakten Annahmen wie `remote_root_unknown_may_be_agenda_like`, `unrezzed_ice_risk_high` oder `hq_known_definitions_subset`. Eine Sample-Welt darf bekannte eigene Karten und rechtmäßig offenbarte gegnerische Karten referenzieren, aber keine unbekannte verdeckte Kartenidentität erfinden, sofern diese nicht bereits als rechtmäßig gesehenes Belief-Faktum vorhanden ist.

## RNG-, Replay- und StateHash-Grenzen

- Rollout-RNG ist ein separater Analyse-RNG: `rolloutSeed = hash(aiInput.seed, aiInput.side, aiInput.playerView.stateVersion, belief.version, explicitExperimentSeed)`.
- Rollout-Zufall erhöht nie den echten `RandomCounter` des Matches.
- Rollout-Ergebnisse erzeugen nie `RandomDrawRecords`.
- Rollouts werden nicht in `eventLog`, PublicEvents, privatePayloads, Reconnect-Payloads oder öffentliche Replays geschrieben.
- Rollout-Auswertung darf `applyAction` nicht gegen den echten Match-State aufrufen. Falls später eine Engine-nahe Sandbox nötig wird, braucht sie einen getrennten, aus sichtbaren DTOs aufgebauten Analyse-State und ein eigenes Architektur-Gate.
- Der echte `StateHash` vor und nach Rollout-Auswertung muss identisch bleiben.
- Debug-Ausgaben dürfen nur Belief-Hypothesen-IDs, aggregierte Scores, Reason-Codes und Safety-Flags enthalten; keine Hidden-Zone-Definitionen.

## Hidden-State-Variantentest

Minimaler Testplan für ein späteres Folgepaket:

1. Erzeuge zwei Engine-States mit unterschiedlicher verdeckter Corp-R&D-, HQ- oder Remote-Root-Identität.
2. Erzwinge gleiche sichtbare Projektion für die KI-Seite: identische `PlayerView`, identische side-sichere `PublicEvents`, identische `eventTail`, identische `LegalActions`.
3. Rekonstruiere `BeliefState` und berechne `beliefStateInvariantSignature`.
4. Erzeuge mit gleichem `rolloutSeed` Belief-Welten.
5. Vergleiche `worldSignature`, geordnete Decision-Scores, gewählte LegalAction, Safety-Debug und echten Match-`StateHash`.

Akzeptanz: Alle sichtbarkeitsrelevanten Signaturen und Entscheidungen sind gleich; der echte Match-`StateHash` bleibt unverändert. Wenn unterschiedliche verdeckte Definitionen eine andere Rollout-Entscheidung erzeugen, ist das ein hartes No-Go für den Prototyp.

## Entscheidung

Ergebnis: späterer Prototyp, kein Live-Go.

Begründung:

- Die Belief-/Reconnect-/Undo-Vorarbeit liefert eine belastbare side-sichere Grundlage.
- Der aktuelle `createBeliefSimulationWorld`-Anker ist redaction-sicher, aber noch kein Rollout-System.
- Der Progression-Benchmark zeigt noch keine stabile strategische Basis, die Rollouts sinnvoll auswerten könnten.
- Das Cheating-Risiko bleibt hoch, sobald Sample-Welten Engine-State, echte Hidden-Zone-Definitionen oder Decklisten berühren.

Kleiner Folgepaket-Schnitt, erst nach P1-Basisheuristik-Verbesserung:

- `BeliefWorldSampler` als reines AI-Experimentmodul ohne Engine-/Server-Importe.
- Maximal zwei Hypothesenfamilien: unbekannte Remote-Root-Karte und unrezzed ICE-Risiko.
- Ein Hidden-State-Variantentest mit gleicher sichtbarer Projektion.
- Ein RNG-Isolationstest mit unverändertem echten `StateHash`.
- Ein Redaction-Test gegen `cardInstances`, `privatePayload`, `fullGameState`, `decklist`, `sessionToken` und `reconnectToken`.
- Kein Anschluss an Live-Entscheidungen; Ausgabe nur Benchmark-/Debug-Report.

## Akzeptanzkriterien

- [x] Der Spike beschreibt eine Architektur, in der Sample-Welten ausschließlich aus Belief-Hypothesen entstehen.
- [x] Hidden-State-Varianten mit identischer sichtbarer Projektion bleiben entscheidungsgleich oder das Risiko wird als No-Go dokumentiert.
- [x] RNG-, Replay- und StateHash-Grenzen sind explizit benannt.
- [x] Eine Entscheidung liegt vor: späterer Prototyp mit klarer Sicherheitsbarriere; kein Live-Go.
- [x] Keine produktive Live-KI nutzt den Spike ohne eigenes Gate.

## Umsetzungshinweise

- Erst nach P0/P1-Stabilisierung sinnvoll; sonst misst der Spike schwache Basisheuristiken statt Rollout-Nutzen.
- Wenn Code entsteht, getrennt und experimentell halten, nicht in den normalen AI-Controllerpfad einhängen.
- No-Cheat-Gate: Sample-Welten dürfen nie aus echtem Hidden State generiert werden.

## Checks

- `git diff --check`: grün.
- Keine AI-/Engine-Tests ausgeführt, weil dieses Paket ausschließlich den Architektur-Spike in der Activity dokumentiert und keine Produktivcode-, LegalActions-, Engine-, Replay- oder StateHash-Änderung enthält.

## Ergebnisnotiz

Abgeschlossen. Der Spike entscheidet gegen produktive Live-Rollouts und für einen späteren, kleinen Analyse-Prototyp mit harter Sicherheitsbarriere. Sample-Welten dürfen ausschließlich aus Belief-Hypothesen, sichtbaren Fakten, eigenen privaten Fakten und rechtmäßig offenbarten gegnerischen Fakten entstehen. RNG, Replay und StateHash bleiben vollständig vom echten Match getrennt. Ein Hidden-State-Variantentest mit identischer sichtbarer Projektion ist Pflicht-Gate; jede entscheidungsrelevante Abweichung durch echte verdeckte Karten ist No-Go.
