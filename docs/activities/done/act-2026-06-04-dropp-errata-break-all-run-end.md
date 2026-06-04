---
activityId: act-2026-06-04-dropp-errata-break-all-run-end
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-04
startedAt: 2026-06-04
completedAt: 2026-06-04
branch: main
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/onr-v1/runner/programs/dropp.ts
  - packages/engine/src/game/run/encounter-actions.ts
  - packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts
  - packages/engine/src/index-tests/originalset/runner-events-hardware-programs-resources.test.ts
  - apps/web/app/chronicle.ts
  - data/ai/ai-card-hints-active.json
  - packages/ai/src/breaker-ontology-consumer.ts
  - packages/ai/src/deck-doctrine-strategy.ts
  - packages/ai/src/deck-doctrine-strategy.test.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/runner-events-hardware-programs-resources.test.ts src/index-tests/releases/card-release-smokes.test.ts
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t Dropp
  - corepack pnpm --filter @netgrid/ai exec vitest run src/deck-doctrine-strategy.test.ts src/compiled-hints-runtime.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t Dropp
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm check:ai-compiled-hints
  - corepack pnpm check:ai-hint-compiled-index
  - corepack pnpm check:ai-strategy-taxonomy
  - HEAD-Inspector-Builder via temporärer Kopie --check
  - git diff --check
---

# Dropp-Errata korrekt abbilden

## Ziel

`Dropp` soll nach lokaler Errata statt nach dem missverständlichen gedruckten Text funktionieren: Der Stärke-Pump beendet den Run nicht. Dropps Break-Fähigkeit bricht alle Subroutinen des aktuellen ICE und beendet danach den Run, ohne dass das ICE als erfolgreich passiert gilt.

## Kontext und Quellen

- Nutzerfund vom 2026-06-04: Die aktuelle Interpretation, dass bereits `1 Credit: +1 Stärke` den Run beendet, ist spielmechanisch unsinnig.
- Gedruckte lokale Spoilerquelle: `docs/source/Runnerspoiler 1.0.txt` führt `Dropp [TM]` mit `[0]: Break ice subroutine. [1]: +1 strength. Using Dropp [TM] ends your run.`
- Führende lokale Errataquelle: `docs/source/Netrunner Errata 1.70.md` sagt im Abschnitt `Dropp [TM]`:
  - Errata: `[0] Break all subroutines of a piece of ice, and end the run.`
  - Der alte Satz `Using Dropp ends your run.` soll gelöscht werden.
  - Dropp endet den Run nach dem aktuellen ICE; die Subroutinen sind gebrochen, aber das ICE ist nicht erfolgreich passiert.
  - Zusätzliche Kosten pro Subroutine müssen für alle Subroutinen bezahlt werden; wenn der Runner das nicht kann, darf Dropp nicht genutzt werden.
- Aktueller Engine-Befund:
  - `packages/engine/src/card-implementations/onr-v1/runner/programs/dropp.ts` hängt `onUse: end_run` sowohl an `break_subroutine` als auch an `increase_strength`.
  - Die Break-Fähigkeit ist aktuell als einzelne beliebige Subroutine modelliert, nicht als alle Subroutinen des aktuellen ICE.
- Aktueller Support-/AI-Stand:
  - `data/ai/ai-card-hints-active.json` und abgeleitete Reports führen Dropp als Universalbreaker mit `ends_run_after_use`.
  - Dieser Hinweis bleibt grundsätzlich richtig, muss aber an die Break-all-Fähigkeit gebunden sein und darf nicht den Stärke-Pump als runbeendend beschreiben.
- Zusätzlicher Chronikbefund vom 2026-06-04:
  - In der sichtbaren Spielchronik steht aktuell nur sinngemäß `Die Runner-KI hat mit Dropp™ Subroutine 1 auf Banpei gebrochen.`
  - Für Dropp fehlt dabei die entscheidende Information, dass der Run wegen Dropps Karteneffekt endet.
  - Nach der Errata muss außerdem sichtbar werden, dass Dropp alle Subroutinen des aktuellen ICE bricht und der Run dadurch endet, ohne dass das ICE als erfolgreich passiert gilt.

## Scope

- Dropps Engine-Vertrag korrigieren:
  - `1 Credit: +1 Stärke` bleibt ein normaler Encounter-Pump und beendet den Run nicht.
  - `0 Credits: Break all subroutines of a piece of ice, and end the run` wird als Dropp-Break-Fähigkeit abgebildet.
  - Der Run endet nach Dropps Break-Auflösung als nicht erfolgreich.
  - Passing-/Successful-Run-Fenster, Pass-Trigger und Access dürfen durch Dropp nicht ausgelöst werden.
- Kosten- und LegalAction-Regeln für Dropps Break-Fähigkeit korrekt revalidieren:
  - Dropp darf nur im gültigen ICE-Encounter aus installierter Quelle genutzt werden.
  - Dropp muss für das aktuelle ICE stark genug sein.
  - Zusätzliche Break-Kosten pro Subroutine gelten für alle offenen/brechbaren Subroutinen des ICE.
  - Wenn der Runner nicht alle notwendigen Zusatzkosten zahlen kann, darf keine Dropp-Break-LegalAction angeboten oder akzeptiert werden.
- Karten-/Katalogtext prüfen und bei Bedarf auf den lokalen Errata-Vertrag angleichen, ohne offizielle Assets oder externe Kartendatenquellen einzuführen.
- AI-/Semantik-Hinweise prüfen und nur soweit korrigieren, dass:
  - `breaker.universal` erhalten bleibt,
  - `breaker.ends_run_after_use` nur die Dropp-Break-Fähigkeit meint,
  - Dropp nicht als generisch sicherer Universalbreaker bewertet wird,
  - der Pump nicht als runbeendende Fähigkeit in Inspector-/Descriptor-Daten erscheint.
- Regressionen ergänzen oder aktualisieren:
  - Pump mit Dropp erhöht Stärke und der Run läuft weiter.
  - Dropp-Break bricht alle relevanten Subroutinen des aktuellen ICE und beendet danach den Run.
  - Dropp-Break löst keine Passing-, Successful-Run- oder Access-Folgen aus.
  - Zusätzliche Break-Kosten pro Subroutine werden vollständig berechnet und bei unzureichenden Credits blockiert.
  - Stale Action, falsche Seite, entfernte Quelle und falscher Encounter werden weiter abgelehnt.
  - Replay und StateHash bleiben deterministisch.
- Chronik-/PublicPayload-Darstellung korrigieren:
  - Der Dropp-Break-Eintrag muss öffentlich verständlich zeigen, dass der Run durch Dropp endet.
  - Der Eintrag darf nicht suggerieren, dass nur eine einzelne Subroutine gebrochen wurde, wenn die Errata-Fähigkeit alle Subroutinen bricht.
  - Der Eintrag muss in der Run-Gruppe bleiben und darf keine Hidden-Info in PublicEvents, PlayerViews oder Reconnect-Payloads ergänzen.

## Nicht im Scope

- Keine generische Neugestaltung aller Icebreaker-Fähigkeiten.
- Keine Freigabe weiterer Karten oder Mechaniken.
- Keine Änderung an anderen runbeendenden Breakern, Stealth-Loss-Breakern oder Random-Breakern, außer eine fokussierte Dropp-Regression braucht einen Vergleich.
- Keine AI-Planner-Neugewichtung über die korrekte Dropp-Semantik hinaus.
- Keine Änderung an Hidden-Info-, PlayerView-, PublicEvent-, WebSocket-, Reconnect-, Replay- oder Log-Redaction-Grenzen.
- Keine Produkt-/UI-Neugestaltung; sichtbare Textkorrekturen nur, wenn sie zur Regelklarheit nötig sind.

## Akzeptanzkriterien

- [ ] Dropps Pump-LegalAction beendet den Run nicht und erzeugt keinen `finishRun(false)`-Effekt.
- [ ] Dropps Break-LegalAction bricht alle offenen/brechbaren Subroutinen des aktuellen ICE und beendet danach den Run.
- [ ] Nach Dropp-Break gilt das ICE nicht als passiert; Passing-Trigger, Successful-Run-Trigger, Breach und Access bleiben aus.
- [ ] Zusatzkosten pro Subroutine werden für alle betroffenen Subroutinen berechnet und vollständig bezahlt oder die Aktion ist illegal.
- [ ] `applyAction` revalidiert Quelle, Seite, stateVersion, Encounter, Stärke, Kosten und Ziel-ICE erneut.
- [ ] Dropp bleibt in Support-/AI-Daten als Universalbreaker mit runbeendendem Break-Drawback sichtbar; der Pump wird nicht als runbeendend beschrieben.
- [ ] Kartentext-/Anzeigequellen widersprechen dem lokalen Errata-Vertrag nicht mehr oder dokumentieren klar, warum ein display-only Alttestext bestehen bleibt.
- [ ] Die Spielchronik benennt bei Dropps Break-Fähigkeit klar, dass der Run durch Dropp endet.
- [ ] Die Spielchronik zeigt bei Dropp nicht mehr irreführend nur `Subroutine 1 gebrochen`, wenn die korrigierte Errata-Fähigkeit alle Subroutinen des ICE bricht.
- [ ] Fokussierte Engine-Regressionen und relevante AI-/Katalog-Checks sind ausgeführt oder begründet ausgelassen.
- [ ] Hidden-Info-, Replay- und StateHash-Gates bleiben grün.
- [ ] `git diff --check` ist grün.

## Umsetzungshinweise

- Naheliegende betroffene Dateien:
  - `packages/engine/src/card-implementations/onr-v1/runner/programs/dropp.ts`
  - `packages/engine/src/ability-engine/definition-types.ts`
  - `packages/engine/src/ability-engine/icebreaker-abilities.ts`
  - `packages/engine/src/game/run/encounter-actions.ts`
  - `packages/engine/src/game/run/runner-breaker-action-execution.ts`
  - `packages/engine/src/public-context.ts`
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/chronicle.test.ts`
  - `data/cards/originalset-v1-cards.json`
  - `data/ai/ai-card-hints-active.json`
  - generierte/compiled AI-Hint- und Inspector-Artefakte, falls bestehende Checks sie verlangen
- Prüfen, ob vorhandene `multiBreakSubroutineActions` für Dropp wiederverwendbar ist oder ob Dropp eine eigene `break_all_subroutines_then_end_run`-Spezialform braucht. Wichtig ist, dass die Runner-Auswahl nicht nur eine Teilmenge bricht.
- Bei Zusatzkosten auf vorhandene Break-Cost-Quote-/Revalidation-Pfade zurückgreifen. Keine ad-hoc-Kostenberechnung neben der Rules Engine.
- Dropp darf nach der Korrektur weiterhin als riskanter Universalbreaker gelten; das Risiko liegt im Break-All-Ende des Runs, nicht im Stärke-Pump.

## Ergebnisnotiz

Dropp ist lokal nach Errata modelliert: Der Stärke-Pump beendet den Run nicht mehr; die Break-Fähigkeit bricht alle relevanten Subroutinen des aktuellen ICE, berechnet Zusatzkosten für alle betroffenen Subroutinen und beendet den Run danach ohne Pass-/Successful-Run-/Access-Folge. Public Payload und Chronik markieren Break-all und Run-Ende. Karten-/Shared-/Katalogtext sowie AI-Hints sind an den Errata-Vertrag angepasst; AI-Consumer behandeln Dropp trotz Universal-Coverage als Notfallbreaker und nicht als normalen Reachability-/Access-Breaker.

Hinweis: `corepack pnpm --filter @netgrid/engine typecheck` bleibt wegen eines bestehenden, nicht paketbezogenen `trace-runtime-deps.test.ts`-Typingfehlers rot.
