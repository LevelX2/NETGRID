---
activityId: act-2026-06-09-experimental-ai-access-chronicle
status: inbox
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Experimental AI: Access-Ambush in Chronik und Rez-Erwartung klären

## Ziel

Beim Zugriff auf ein avanciertes `Experimental AI` soll die Spielchronik eindeutig zeigen, dass der Access-Ambush der Karte ausgelöst wurde, wie viele Advancement-Counter gezählt wurden und welches installierte Runner-Programm dadurch in den Heap gelegt wurde. Zusätzlich soll die Nutzererwartung zum Rezzen geklärt werden: Nach aktuellem lokalem Karten- und Implementierungsstand braucht der Ambush selbst kein vorheriges Rezzen; falls ein separates legales Rez-Fenster fehlt, soll das nicht mit der Ambush-Wirkung vermischt werden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-09 mit Screenshot: Die Korp hatte in `Remote 2` ein verdecktes `Experimental AI` mit einem Advancement-Counter installiert. Die Runner-KI startete einen Run auf `Remote 2`, griff auf `Experimental AI` zu und trashte danach die Karte.
- Der Runner hatte zu diesem Zeitpunkt nur `Blink` als installiertes Programm. In der Chronik erschien nach dem Zugriff nur sinngemäß `Eine verdeckte Karte wurde in den Heap gelegt.` Dadurch blieb unklar, dass der eine Advancement-Counter von `Experimental AI` das installierte Programm `Blink` getrasht hatte.
- Der Nutzer erwartete ein vorheriges Korp-Rez-Fenster und wollte `Experimental AI` vor der Wirkung rezzen. Offen sichtbar zu klären ist, ob Rezzen für diese Wirkung funktional notwendig ist oder nur die Karte offenlegt.
- Bestätigter lokaler Kartentext: `data/local/card-import/onr-v1-limited/text-review-galleries/gallery-17-19-confirmed-texts.local.md` beschreibt `Experimental AI` als vor und nach dem Rezzen advancebar; beim Zugriff wird pro Advancement-Counter ein Programm getrasht.
- Aktuelle Implementierung: `packages/engine/src/card-implementations/onr-v1/corp/assets/experimental-ai.ts` nutzt einen installierten `on_access`-Ambush mit `source_advancement_counter_count` und `trash_installed_runner_cards`.
- Bestehende Regressionen: `packages/engine/src/index-tests/originalset/per-card-followups.test.ts` prüft die Counter-Anzahl; `packages/engine/src/index-tests/mechanics/agenda-global-random.test.ts` prüft den Access-Ambush-Payload.
- Verwandte erledigte Pakete: `docs/activities/done/act-2026-05-17-effect-event-chronicle-visibility-audit.md` und `docs/activities/done/act-2026-06-08-blink-die-chronicle-transparency.md`.

## Scope

- Szenario reproduzieren: verdecktes, installiertes `Experimental AI` in einem Remote, ein Advancement-Counter, Runner mit genau einem öffentlich installierten Programm `Blink`, erfolgreicher Remote-Run und Zugriff.
- Prüfen und explizit festhalten, dass der `Experimental AI`-Ambush beim Zugriff nicht an einen vorherigen Rez-Zustand gebunden ist, sofern der lokale Kartentext und Regelvertrag das bestätigen.
- Prüfen, ob die Korp an der passenden Stelle trotzdem ein legales Rez-Fenster für das Asset bekommen müsste. Wenn diese Frage über den kleinen Chronik-/Ambush-Schnitt hinausgeht, daraus eine eigene Follow-up-Activity schneiden statt den Ambush-Fix zu blockieren.
- PublicEvent-/Chronik-Projektion so schärfen, dass der Effekt nicht als generische verdeckte Kartenbewegung erscheint, wenn das Ziel ein öffentlich installiertes Runner-Programm war.
- Die Chronik soll Quelle, Auslöser und Ergebnis verbinden, zum Beispiel sinngemäß: `Experimental AI wurde beim Zugriff ausgelöst: 1 Advancement-Counter trashte Blink.`
- Die spätere Runner-Entscheidung, `Experimental AI` selbst zu trashen, soll als eigener Access-Trash-Schritt verständlich bleiben und nicht mit dem Ambush-Effekt verwechselt werden.
- Fokussierte Engine- und Web-Chronik-Regressionen für den `Experimental AI`-Fall ergänzen oder bestehende Tests präzisieren.

## Nicht im Scope

- Keine Änderung am gedruckten oder lokal bestätigten Kartentext.
- Keine Änderung an der Anzahl der getrashten Programme pro Advancement-Counter, der Zielauswahl, Run-Legalität, Access-Queue oder Trash-Kosten.
- Keine Änderung an Runner-KI-Strategie, Remote-Zielwahl oder der Entscheidung, `Experimental AI` nach dem Zugriff zu trashen.
- Kein genereller Umbau aller Access-Ambushes oder aller Hidden-Zone-Chroniktexte.
- Keine Offenlegung verdeckter Kartenidentitäten in PlayerViews, PublicEvents, Reconnect-Payloads, Undo-Previews, öffentlichen Replays, Logs oder Client-Fehlern. Sichtbar dürfen nur Informationen werden, die aus öffentlich installierten Karten oder legalem Zugriff bereits side-sicher bekannt sind.

## Akzeptanzkriterien

- [ ] Ein reproduzierbarer Test- oder Fixture-Fall deckt `Experimental AI` mit einem Advancement-Counter und installiertem `Blink` ab.
- [ ] Die Engine-/Event-Projektion enthält side-sicher Quelle `Experimental AI`, gezählte Advancement-Counter und Trash-Ergebnis.
- [ ] Die Web-Chronik erklärt, dass `Experimental AI` beim Zugriff ausgelöst wurde und dass der Advancement-Counter das Programm `Blink` getrasht hat, sofern `Blink` für den Betrachter öffentlich bekannt ist.
- [ ] Falls das Ziel aus Sicht eines Betrachters nicht namentlich sichtbar sein darf, bleibt der Text dennoch verständlich über Quelle, Counter-Anzahl und Anzahl getrashter Programme, ohne den Kartennamen zu leaken.
- [ ] Der Access-Trash von `Experimental AI` selbst bleibt als separater Chronikschritt erkennbar.
- [ ] Die Rez-Erwartung ist im Code-/Test-/Review-Kontext eindeutig dokumentiert: Der Ambush braucht nach aktuellem Stand kein vorheriges Rezzen; ein eventuell fehlendes allgemeines Rez-Fenster wird separat eingeordnet.
- [ ] Hidden-Info-Regressionen prüfen, dass keine verdeckten Hand-, Stack-, HQ-, R&D- oder unrevealed Remote-Identitäten über diesen Pfad öffentlich werden.
- [ ] Fokussierte Checks sind ausgeführt; ausgelassene Checks sind begründet.

## Umsetzungshinweise

- Primärfolgeagent: `card-enablement-ai-knowledge-agent`, weil Kartenresolver, Access-Ambush, PublicEvent-Payload und Chronik zusammen geprüft werden müssen.
- Beim Engine-Fix zuerst vorhandene Payload-Felder wie `ambushDefinitionId`, `advancementCounterCount`, `trashedCount` und Zielkarteninformationen prüfen. Nicht im Web aus dem Boardzustand nachraten, wenn die Engine den Effekt bereits deterministisch kennt.
- Der bestehende `hidden_info_barrier`-Pfad ist vermutlich zu grob für öffentlich installierte Runner-Programme. Die Lösung soll nicht pauschal Hidden-Info-Barrieren abschwächen, sondern die Sichtbarkeit des konkreten Zieltyps sauber klassifizieren.
- Web-Chronik in `apps/web/app/chronicle.ts` nur so weit spezial- oder generisch erweitern, wie für diesen Ambush-Fall nötig. Falls sich eine kleine generische `access_ambush_trash_installed`-Formulierung anbietet, darf sie genutzt werden, solange andere Karten nicht versehentlich neue Informationen leaken.
- Relevante Stellen zum Start: `packages/engine/src/card-implementations/onr-v1/corp/assets/experimental-ai.ts`, `packages/engine/src/public-context.ts`, `apps/web/app/chronicle.ts`, `apps/web/app/chronicle.test.ts`.

## Ergebnisnotiz

Noch offen.
