---
activityId: act-2026-06-28-corp-ai-accounts-receivable-threshold
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-28
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Korp-KI priorisiert Accounts-Receivable-Schwelle

## Ziel

Die Korp-KI soll eigene sofortige Economy-Operations wie `Accounts Receivable` nicht gegen generische `1 Credit nehmen`-Aktionen oder nicht dringende Installationen unterbewerten. Wenn die Korp mit einem Basic-Credit eine bezahlbare starke Burst-Economy-Operation freischalten kann, soll diese Sequenz gegenüber niedrigwertiger Einzel-Ökonomie und optionalem Setup bevorzugt werden.

## Kontext und Quellen

- Playtest-Beobachtung vom 2026-06-28: Die Korp hatte 4 Credits, nahm zuerst 1 Credit auf 5, installierte danach ein ICE vor HQ für 2 Credits und nahm anschließend wieder 1 Credit. Der Runner hatte im vorherigen Zug durch HQ-Zugriff gesehen, dass die Korp `Accounts Receivable` auf der Hand hatte.
- Erwartete Linie im beobachteten Zustand: mit dem ersten Basic-Credit auf 5 gehen, `Accounts Receivable` spielen und dadurch 5 Credits zahlen / 9 Credits erhalten, danach bei Bedarf das HQ-ICE installieren. Das ist netto +4 Credits in einer Aktion und damit klar besser als eine weitere Basic-Credit-Aktion, solange keine akut höhere Schutz- oder Score-Priorität dagegensteht.
- `Accounts Receivable` ist engine-seitig umgesetzt als Operation mit Kosten 5 und Effekt `Gain 9 credits`: `packages/engine/src/card-implementations/onr-v1/corp/operations/accounts-receivable.ts`.
- Kartendaten: `packages/shared/src/index.ts` führt `onr_v1_281_accounts-receivable` mit `cost: 5`, `rulesText: "Gain 9 credits."` und Mechaniken `play_operation`, `gain_credits`.
- AI-Hint-Stand: `data/ai/ai-card-hints-active.json` klassifiziert die Karte als `economy_operation`, `planRoles: ["recover_economy"]`, `valueHints: { economy: 3 }`, Effekt `amount: 9` und Signal `economy.corp_credit_burst`. Der Befund spricht dafür, dass dieser Wert oder seine Nutzung im Sequenzkontext zu schwach ist.
- Verwandte erledigte Korp-KI-Pakete:
  - `docs/activities/done/act-2026-06-12-corp-ai-remote-rez-floor-before-agenda.md`
  - `docs/activities/done/act-2026-06-24-corp-ai-prioritize-tagged-meat-damage-payoffs.md`

## Scope

- Einen fokussierten KI-Test oder Same-State-Snapshot für die beobachtete Korp-Entscheidung bauen:
  - Korp hat 4 Credits und `Accounts Receivable` in eigener HQ-Hand.
  - `gain_credit` ist legal und würde die 5-Credit-Schwelle erreichen.
  - Nach dem Schwellen-Credit ist `play_operation` für `Accounts Receivable` legal.
  - Alternativen wie Basic-Credit, nicht dringende ICE-Installation vor HQ oder generisches Setup sind legal.
- Die Korp-Bewertung so ergänzen, dass sie bezahlbare oder durch genau eine Funding-Aktion freischaltbare eigene Burst-Economy-Operations erkennt.
- `Accounts Receivable` als Startfall abdecken, aber prüfen, ob dieselbe Logik für vergleichbare eigene Korp-Operations mit Kosten, Credit-Gain und `economy.corp_credit_burst`-Signal generisch genutzt werden kann.
- Die Entscheidung im AI-Trace side-safe erklärbar machen, zum Beispiel über Evidence wie `corp_operation_economy_threshold`, `burst_economy_net_gain`, `credits_after_funding` oder bestehende gleichwertige Begriffe.
- Regressionen für beide Stufen aufnehmen:
  - bei 4 Credits zuerst Basic-Credit, weil dadurch die starke Economy-Operation freigeschaltet wird,
  - bei 5 Credits `Accounts Receivable` gegenüber Basic-Credit und nicht dringender Installation bevorzugen.

## Nicht im Scope

- Keine Änderung am Kartentext, an der Kartenimplementierung, an LegalActions, `applyAction`, Replay, StateHash oder Randomness.
- Kein pauschales Verbot, ICE vor HQ zu installieren. Eine akute Schutz-, Rez-Floor-, Scoring- oder Kill-Priorität darf Economy weiterhin schlagen, muss dann aber im Trace begründet sein.
- Keine Nutzung verdeckter Runner-Informationen. Die Korp darf ihre eigene HQ-Hand kennen; Runner-facing Views, PublicEvents, Reconnect-Payloads, Logs und öffentliche Debugflächen dürfen daraus keine verdeckten Korp-Handkarten leaken.
- Kein breiter Rewrite der Korp-Doctrine oder aller Operation-Hints außerhalb des kleinsten nötigen Economy-Burst-/Funding-Schwellenmusters.

## Akzeptanzkriterien

- [ ] Ein fokussierter KI-Test oder Snapshot reproduziert den 4-Credit-Zustand mit `Accounts Receivable` in eigener Korp-Hand und legalen Alternativen.
- [ ] Bei 4 Credits bevorzugt die Korp eine Funding-Aktion, wenn diese unmittelbar `Accounts Receivable` freischaltet und keine stärkere akute Priorität besteht.
- [ ] Bei 5 Credits bevorzugt die Korp das Spielen von `Accounts Receivable` gegenüber Basic-Credit und nicht dringender HQ-ICE-Installation.
- [ ] Der Score berücksichtigt den Nettoeffekt der Operation, also Kosten 5 / Gain 9 / netto +4, nicht nur einen groben `economy: 3`-Hint oder den reinen `gain_credits`-Amount.
- [ ] Eine Gegenprobe hält wichtige Ausnahmen stabil: bei akutem Remote-Rez-Floor, Same-Turn-Score, Runner-Kill-Fenster oder anderer klar höherer LegalAction darf die Korp von der Economy-Linie abweichen.
- [ ] Debug-/Trace-Evidence erklärt side-safe, warum Funding oder `Accounts Receivable` gewählt oder abgelehnt wurde, ohne Korp-Handkarten an Runner-facing Flächen zu leaken.
- [ ] Bestehende Korp-KI-Regressionen für Remote-Rez-Floor, passive Scoreline und Tag-/Damage-Payoffs bleiben grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil der Befund Korp-KI, Karten-Hints, Planbewertung und Sequenzplanung verbindet.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/runtime/semantic-runtime-corp-score.ts`
  - `packages/ai/src/runtime/semantic-runtime-corp-board-score-composition.ts`
  - `packages/ai/src/runtime/semantic-choice-ranking.ts`
  - `packages/ai/src/runtime/strategic-action-fit.ts`
  - `packages/ai/src/decision/action-goal-fit.ts`
  - `packages/ai/src/index.test.ts` oder passende fokussierte Runtime-Tests
  - `data/ai/ai-card-hints-active.json`
- Zuerst klären, ob die Liveentscheidung `Accounts Receivable` als `economy.gain_credit`, als `play_operation` mit Card-Hint oder als generische Operation bewertet. Der Fix sollte möglichst am semantischen Candidate-/Scoringpfad ansetzen, nicht als hart codierter Kartenname-Vorrang.
- Wenn die Analyse zeigt, dass nur der Hint-Wert `economy: 3` zu schwach ist, den Hint und die dazugehörige Verbrauchslogik gemeinsam prüfen. Ein reiner Zahlen-Patch ohne Regressionstest reicht hier nicht.
- Bei der 4-Credit-Stufe ist der Basic-Credit nicht als Selbstzweck gut, sondern als Schwellenaktion. Diese Begründung sollte im Trace sichtbar werden, damit die KI nicht wieder in beliebige Credit-Spam-Sequenzen kippt.

## Ergebnisnotiz

Noch offen.
