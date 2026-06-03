---
activityId: act-2026-06-03-corporate-war-score-chronicle
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-03
startedAt: 2026-06-03
completedAt: 2026-06-03
branch:
releaseTarget: V1.9.22 follow-up
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/corp/scored-agenda-flow.ts
  - packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts
  - packages/engine/src/index-tests/originalset/agenda-scorearea-recurring.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm exec vitest run apps/web/app/chronicle.test.ts
  - corepack pnpm exec vitest run packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts -t "Corporate War"
  - corepack pnpm exec vitest run packages/engine/src/index-tests/originalset/agenda-scorearea-recurring.test.ts -t "Hostile Takeover"
  - corepack pnpm exec vitest run packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts packages/engine/src/index-tests/originalset/agenda-scorearea-recurring.test.ts -t "Corporate War|Hostile Takeover"
  - corepack pnpm --filter @netgrid/web typecheck
  - "corepack pnpm --filter @netgrid/engine typecheck (fehlgeschlagen: bestehender unberührter TS2739 in packages/engine/src/game/card-implementation/trace-runtime-deps.test.ts)"
  - git diff --check
---

# Corporate War: Score-Credit-Swing in der Chronik sichtbar machen

## Ziel

`Corporate War` soll beim Scoren nicht nur den korrekten Credit-Effekt ausführen, sondern diesen öffentlichen Effekt auch verständlich in der Chronik anzeigen.

## Kontext und Quellen

- Nutzerfund vom 2026-06-03: Die Korp hat `Corporate War` gescored, hatte zu diesem Zeitpunkt mehr als 12 Credits und erhielt die 12 Credits, aber in der Chronik erschien keine passende Meldung.
- Lokaler Kartentext: `If you have 12 or more bits in your pool when you score Corporate War, gain 12; otherwise, lose all bits.`
- Aktuelle Implementierung: `packages/engine/src/card-implementations/onr-v1/corp/agendas/corporate-war.ts` nutzt `scoredAgenda.kind = "corporate_war_credit_swing"` mit Schwelle `12`, Gain `12` und öffentlicher Visibility.
- Aktuelle Engine-Regression: `packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts` prüft den erfolgreichen Credit-Gain und die Miss-Variante mit `corporateWarThresholdMet`, `onScoreGainCredits` und `onScoreLostAllCredits`, aber der Befund spricht für eine fehlende oder nicht formatierte Chronik-Projektion.
- Vorsichtung: `apps/web/app/chronicle.ts` merged bei `score_agenda` offenbar nur `add_hosted_credits` als Card-Resolver-Effekt; `Corporate War` ist dagegen ein öffentlicher Creditpool-Gain beziehungsweise Creditverlust.

## Scope

- Reproduzieren, ob das Live-/Replay-Event für `Corporate War` beim Score nur die bestehenden `onScore*`-Payloadfelder enthält oder zusätzlich `resolvedEffects` fehlen.
- Den passenden Vertrag wählen:
  - entweder einen side-sicheren öffentlichen `resolvedEffects`-Eintrag für `gain_credits` beziehungsweise `lose_credits` an den Score-Event hängen,
  - oder die Chronik gezielt aus den vorhandenen `corporateWarThresholdMet`-/`onScore*`-Payloadfeldern formatieren.
- Die erfolgreiche Schwellenvariante in der Chronik sichtbar machen: sinngemäß `Die Korp hat Corporate War gescored ... und 12 Credits erhalten.`
- Die Miss-Variante ebenfalls sichtbar machen: sinngemäß `Die Korp hat Corporate War gescored ... und alle Credits verloren.`
- Prüfen, ob vergleichbare On-score-Creditpool-Effekte wie `Hostile Takeover` dieselbe Lücke haben; falls ja, maximal eine kleine generische Erweiterung für öffentliche Score-Creditpool-Effekte vornehmen oder ein Folgepaket anlegen.
- Fokussierte Engine-/Web-Regressionen ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Änderung an der Regelwirkung von `Corporate War`: Schwelle 12, bei Erreichen +12 Credits, sonst alle Credits verlieren.
- Keine Änderung an Agenda-Punkten, Advancement, Score-Timing oder Siegpriorität.
- Keine KI-, Catalog-, Manifest- oder Release-Promotion.
- Kein Redesign der Chronik oder der Score-Area-Anzeige.
- Keine neue Offenlegung verdeckter Zonen, verdeckter Karten, HQ/R&D-Inhalte, Reconnect-Daten, Replay-Privatdaten oder KI-Inputs.

## Akzeptanzkriterien

- [ ] Wenn die Korp `Corporate War` mit mindestens 12 Credits vor dem Scoren scored, erhält sie weiterhin genau 12 Credits.
- [ ] Für diese erfolgreiche Variante erscheint eine öffentliche Chronikmeldung, die den Credit-Gain klar benennt.
- [ ] Wenn die Korp `Corporate War` mit weniger als 12 Credits scored, verliert sie weiterhin alle Credits.
- [ ] Für diese Miss-Variante erscheint eine öffentliche Chronikmeldung, die den Creditverlust klar benennt.
- [ ] Chronikmeldung und Chips sind aus Korp- und Runner-Sicht verständlich und verwenden sichtbare deutsche Begriffe wie `Korp` und `Credits`.
- [ ] PlayerViews, PublicEvents, WebSocket-/Reconnect-Payloads, Replay und KI-Inputs leaken keine verdeckten Informationen.
- [ ] Replay und StateHash bleiben deterministisch.
- [ ] Fokussierte Tests decken die beiden `Corporate War`-Score-Branches und die Chronikformatierung ab, oder ausgelassene Checks sind begründet.

## Umsetzungshinweise

- Gute Startpunkte:
  - `packages/engine/src/game/corp/scored-agenda-flow.ts`
  - `packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts`
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/chronicle.test.ts`
- Falls `resolvedEffects` ergänzt werden, an bestehenden Mustern für `kind: "gain_credits"` / `kind: "lose_credits"`, `reason: "card_resolver"`, `sourceDefinitionId` und `sourceTitle` orientieren.
- Falls die Chronik aus Spezial-Payloadfeldern formatiert wird, Doppelmeldungen vermeiden und die normale Score-Zeile nicht unverständlich verlängern.
- Die bestehende Hosted-Credit-Score-Formatierung für `Corporate Coup`, `Political Coup` und `Detroit Police Contract` nicht regressieren.

## Ergebnisnotiz

Erledigt am 2026-06-03. `Corporate War` erzeugt beim Scoren jetzt öffentliche, source-bound `resolvedEffects` für den erfolgreichen 12-Credit-Gain und für die Miss-Variante mit Creditverlust. Der bestehende `gain_credits_on_score`-Pfad, unter anderem `Hostile Takeover`, gibt ebenfalls einen strukturierten öffentlichen `gain_credits`-Effekt aus.

Die Web-Chronik führt Score-Agenda-Creditpool-Effekte jetzt in die Score-Zeile zusammen und zeigt zusätzlich alte oder knappe Score-Payloads mit `onScoreGainCredits` beziehungsweise `onScoreLostAllCredits` verständlich an. Für `Corporate War` erscheint damit bei erfüllter Schwelle eine Meldung mit `12 Credits erhalten`; bei verfehlter Schwelle wird `alle Credits verloren` angezeigt. Hosted-Credit-Score-Anzeigen für Coup-/Detroit-Agenden bleiben über die bestehende Merge-Logik abgedeckt.

Checks: Die fokussierten Web- und Engine-Vitest-Läufe, der Web-Typecheck und `git diff --check` waren grün. Der Engine-Typecheck wurde ausgeführt, scheiterte aber an einem bestehenden, unberührten Fixture-Fehler in `packages/engine/src/game/card-implementation/trace-runtime-deps.test.ts` (`trace`-Host-Mock ohne neue Trace-Methoden); diese Datei wurde im Paket nicht geändert.
