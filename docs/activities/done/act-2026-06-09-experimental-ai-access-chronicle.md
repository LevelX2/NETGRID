---
activityId: act-2026-06-09-experimental-ai-access-chronicle
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt: 2026-06-09
completedAt: 2026-06-09
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/run/run-core-execution.ts
  - packages/engine/src/test-fixtures/index-test-helpers.ts
  - packages/engine/src/index-tests/originalset/per-card-followups.test.ts
  - packages/engine/src/index-tests/mechanics/agenda-global-random.test.ts
  - packages/engine/src/index-tests/mechanics/assets-nodes-upgrades.test.ts
  - packages/engine/src/index-tests/originalset/hidden-access-run-regressions.test.ts
  - packages/engine/src/index-tests/originalset/corp-assets-upgrades-operations.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/per-card-followups.test.ts src/index-tests/mechanics/agenda-global-random.test.ts src/game/run/run-core-execution.test.ts src/game/run/run-rez-window.test.ts src/game/run/run-flow.test.ts
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/run-access-multiaccess.test.ts src/index-tests/mechanics/per-card-longtail.test.ts src/index-tests/mechanics/assets-nodes-upgrades.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/hidden-access-run-regressions.test.ts src/index-tests/originalset/corp-assets-upgrades-operations.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Experimental AI: Rez-Fenster und Access-Ambush in Chronik klären

## Ziel

Nach einem Run auf ein Remote mit verdecktem `Experimental AI` soll die Human-Korp im passenden Run-Timing-Fenster gefragt werden, ob sie das Asset rezzen will, bevor der Zugriff abgewickelt wird. Unabhängig davon soll die Spielchronik beim Zugriff auf ein avanciertes `Experimental AI` eindeutig zeigen, dass der Access-Ambush der Karte ausgelöst wurde, wie viele Advancement-Counter gezählt wurden und welches installierte Runner-Programm dadurch in den Heap gelegt wurde.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-09 mit Screenshot: Die Korp hatte in `Remote 2` ein verdecktes `Experimental AI` mit einem Advancement-Counter installiert. Die Runner-KI startete einen Run auf `Remote 2`, griff auf `Experimental AI` zu und trashte danach die Karte.
- Nach Nutzerklarstellung vom 2026-06-09 hätte die Human-Korp nach Deklaration des Runs beziehungsweise im passenden Run-Fenster gefragt werden müssen, ob sie das verdeckte Asset rezzen will. Diese Interaktionslücke ist ein eigener Befund und nicht nur eine Chronik-Unklarheit.
- Der Runner hatte zu diesem Zeitpunkt nur `Blink` als installiertes Programm. In der Chronik erschien nach dem Zugriff nur sinngemäß `Eine verdeckte Karte wurde in den Heap gelegt.` Dadurch blieb unklar, dass der eine Advancement-Counter von `Experimental AI` das installierte Programm `Blink` getrasht hatte.
- Der Nutzer wollte `Experimental AI` vor der Wirkung rezzen. Zu trennen sind deshalb zwei Fragen: Das legale Rez-Fenster muss angeboten werden; der Access-Ambush selbst braucht nach aktuellem lokalem Karten- und Implementierungsstand kein vorheriges Rezzen.
- Bestätigter lokaler Kartentext: `data/local/card-import/onr-v1-limited/text-review-galleries/gallery-17-19-confirmed-texts.local.md` beschreibt `Experimental AI` als vor und nach dem Rezzen advancebar; beim Zugriff wird pro Advancement-Counter ein Programm getrasht.
- Aktuelle Implementierung: `packages/engine/src/card-implementations/onr-v1/corp/assets/experimental-ai.ts` nutzt einen installierten `on_access`-Ambush mit `source_advancement_counter_count` und `trash_installed_runner_cards`.
- Bestehende Regressionen: `packages/engine/src/index-tests/originalset/per-card-followups.test.ts` prüft die Counter-Anzahl; `packages/engine/src/index-tests/mechanics/agenda-global-random.test.ts` prüft den Access-Ambush-Payload.
- Verwandte erledigte Pakete: `docs/activities/done/act-2026-05-17-effect-event-chronicle-visibility-audit.md` und `docs/activities/done/act-2026-06-08-blink-die-chronicle-transparency.md`.

## Scope

- Szenario reproduzieren: verdecktes, installiertes `Experimental AI` in einem Remote, ein Advancement-Counter, Runner mit genau einem öffentlich installierten Programm `Blink`, erfolgreicher Remote-Run und Zugriff.
- Prüfen, ob der Human-Korp nach Run-Deklaration oder spätestens im letzten legalen Run-Fenster vor dem Zugriff ein Rez-Prompt für das verdeckte Asset angeboten wird.
- Falls der Rez-Prompt fehlt, den LegalAction-/UI-/Serverfluss so korrigieren, dass die Human-Korp `Experimental AI` rezzen oder bewusst nicht rezzen kann, bevor der Zugriff abgewickelt wird.
- Beim bewussten Nicht-Rezzen soll der Zugriff trotzdem regelkonform fortgesetzt werden; der Ambush darf dadurch nicht verhindert werden, sofern der lokale Regelvertrag kein Rez-Erfordernis vorsieht.
- Prüfen und explizit festhalten, dass der `Experimental AI`-Ambush beim Zugriff nicht an einen vorherigen Rez-Zustand gebunden ist, sofern der lokale Kartentext und Regelvertrag das bestätigen.
- PublicEvent-/Chronik-Projektion so schärfen, dass der Effekt nicht als generische verdeckte Kartenbewegung erscheint, wenn das Ziel ein öffentlich installiertes Runner-Programm war.
- Die Chronik soll Quelle, Auslöser und Ergebnis verbinden, zum Beispiel sinngemäß: `Experimental AI wurde beim Zugriff ausgelöst: 1 Advancement-Counter trashte Blink.`
- Die spätere Runner-Entscheidung, `Experimental AI` selbst zu trashen, soll als eigener Access-Trash-Schritt verständlich bleiben und nicht mit dem Ambush-Effekt verwechselt werden.
- Fokussierte Engine- und Web-Chronik-Regressionen für den `Experimental AI`-Fall ergänzen oder bestehende Tests präzisieren.

## Nicht im Scope

- Keine Änderung am gedruckten oder lokal bestätigten Kartentext.
- Keine Änderung an der Anzahl der getrashten Programme pro Advancement-Counter, der Zielauswahl, Run-Legalität, Access-Queue oder Trash-Kosten.
- Keine Änderung daran, dass `Experimental AI` vor und nach dem Rezzen avanciert werden kann.
- Keine Änderung an Runner-KI-Strategie, Remote-Zielwahl oder der Entscheidung, `Experimental AI` nach dem Zugriff zu trashen.
- Kein genereller Umbau aller Access-Ambushes oder aller Hidden-Zone-Chroniktexte.
- Keine Offenlegung verdeckter Kartenidentitäten in PlayerViews, PublicEvents, Reconnect-Payloads, Undo-Previews, öffentlichen Replays, Logs oder Client-Fehlern. Sichtbar dürfen nur Informationen werden, die aus öffentlich installierten Karten oder legalem Zugriff bereits side-sicher bekannt sind.

## Akzeptanzkriterien

- [ ] Ein reproduzierbarer Test- oder Fixture-Fall deckt `Experimental AI` mit einem Advancement-Counter und installiertem `Blink` ab.
- [ ] Nach Run-Deklaration beziehungsweise im passenden Run-Fenster vor dem Zugriff bekommt die Human-Korp eine legale Rez-Option für das verdeckte `Experimental AI`, sofern sie die Rez-Kosten bezahlen kann.
- [ ] Wenn die Human-Korp das Rezzen ablehnt oder überspringt, wird der Zugriff fortgesetzt und der `Experimental AI`-Ambush nach aktuellem Regelvertrag weiterhin beim Zugriff abgewickelt.
- [ ] Wenn die Human-Korp `Experimental AI` vor dem Zugriff rezzt, bleibt der folgende Ambush regelkonform und die Chronik trennt Rez-Schritt, Ambush-Effekt und späteren Runner-Trash.
- [ ] Die Engine-/Event-Projektion enthält side-sicher Quelle `Experimental AI`, gezählte Advancement-Counter und Trash-Ergebnis.
- [ ] Die Web-Chronik erklärt, dass `Experimental AI` beim Zugriff ausgelöst wurde und dass der Advancement-Counter das Programm `Blink` getrasht hat, sofern `Blink` für den Betrachter öffentlich bekannt ist.
- [ ] Falls das Ziel aus Sicht eines Betrachters nicht namentlich sichtbar sein darf, bleibt der Text dennoch verständlich über Quelle, Counter-Anzahl und Anzahl getrashter Programme, ohne den Kartennamen zu leaken.
- [ ] Der Access-Trash von `Experimental AI` selbst bleibt als separater Chronikschritt erkennbar.
- [ ] Die Rez-Erwartung ist im Code-/Test-/Review-Kontext eindeutig dokumentiert: Die Human-Korp muss die passende Rez-Entscheidung bekommen; der Ambush braucht nach aktuellem Stand trotzdem kein vorheriges Rezzen.
- [ ] Hidden-Info-Regressionen prüfen, dass keine verdeckten Hand-, Stack-, HQ-, R&D- oder unrevealed Remote-Identitäten über diesen Pfad öffentlich werden.
- [ ] Fokussierte Checks sind ausgeführt; ausgelassene Checks sind begründet.

## Umsetzungshinweise

- Primärfolgeagent: `card-enablement-ai-knowledge-agent`, weil Kartenresolver, Access-Ambush, PublicEvent-Payload und Chronik zusammen geprüft werden müssen.
- Das Rez-Fenster zuerst als LegalActions-/Timing-Problem prüfen: Gibt es vor Access eine Korp-Entscheidung für installierte Remote-Root-Assets, wird sie im Human-vs-KI-Fluss unterdrückt, oder fehlt nur die UI-Oberfläche?
- Das UI darf den Run nicht automatisch bis zum Access durchlaufen, wenn eine Human-Korp im aktuellen Timing-Fenster noch eine bezahlbare Rez-Option hat.
- Beim Engine-Fix zuerst vorhandene Payload-Felder wie `ambushDefinitionId`, `advancementCounterCount`, `trashedCount` und Zielkarteninformationen prüfen. Nicht im Web aus dem Boardzustand nachraten, wenn die Engine den Effekt bereits deterministisch kennt.
- Der bestehende `hidden_info_barrier`-Pfad ist vermutlich zu grob für öffentlich installierte Runner-Programme. Die Lösung soll nicht pauschal Hidden-Info-Barrieren abschwächen, sondern die Sichtbarkeit des konkreten Zieltyps sauber klassifizieren.
- Web-Chronik in `apps/web/app/chronicle.ts` nur so weit spezial- oder generisch erweitern, wie für diesen Ambush-Fall nötig. Falls sich eine kleine generische `access_ambush_trash_installed`-Formulierung anbietet, darf sie genutzt werden, solange andere Karten nicht versehentlich neue Informationen leaken.
- Relevante Stellen zum Start: `packages/engine/src/card-implementations/onr-v1/corp/assets/experimental-ai.ts`, `packages/engine/src/public-context.ts`, `apps/web/app/chronicle.ts`, `apps/web/app/chronicle.test.ts`.

## Ergebnisnotiz

Abgeschlossen am 2026-06-09.

- `startRun` öffnet bei ICE-losen Servern vor dem Access ein `run.jack_out_window`, wenn unrezzed Remote-Root-Karten legal rezbar sind. Dadurch bekommt die Korp auch bei einem Run direkt auf ein Remote-Root die bestehende Root-Rez-Entscheidung; Runner-Actions bleiben bis zum Pass leer.
- Der bestehende Access-Vertrag bleibt erhalten: Wenn die Korp das Rezzen überspringt, führt der Runner den Run per `continue_run` in den Access weiter; der `Experimental AI`-Ambush löst auch unrezzed aus.
- Beim vorherigen Root-Rez von `Experimental AI` bleiben Rez-Event, Access-Ambush und späterer Runner-Trash der Karte getrennte öffentliche Schritte.
- Die Chronicle formatiert `v1919_access_ambush_trash_installed`-Effekte aus der Engine-Payload konkret: Quelle, Advancement-Counter und getrashtes öffentlich bekanntes Runner-Programm werden verbunden; ohne öffentlichen Zielnamen fällt der Text auf die Programm-Anzahl zurück.
