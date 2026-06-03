---
activityId: act-2026-06-02-cockroach-counter-corp-display-chronicle
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-03
completedAt: 2026-06-03
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/view/card-view.ts
  - packages/engine/src/game/run/run-end-cleanup.ts
  - packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - "PASS: pnpm exec vitest run apps/web/app/chronicle.test.ts -t \"Cockroach|Pattel and Pox\""
  - "PASS: pnpm exec vitest run packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts -t \"Cockroach threshold|purges Cockroach\""
  - "PASS: pnpm exec vitest run apps/web/app/chronicle.test.ts"
  - "PASS: pnpm exec vitest run packages/engine/src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts"
  - "PASS: pnpm --filter @netgrid/web typecheck"
  - "PASS: git diff --check"
  - "WARN: pnpm --filter @netgrid/engine typecheck scheitert weiterhin an bestehendem, unberührtem TS2739 in packages/engine/src/game/card-implementation/trace-runtime-deps.test.ts:131"
---

# Cockroach-Counter: Korp-Anzeige und Chroniktext korrigieren

## Ziel

`Cockroach`-Counter sollen in der Spielansicht als Korp-zugeordnete Counter erscheinen und die Chronik soll den Effekt entsprechend formulieren, statt die Counter als Counter auf der Runner-Karte `Cockroach` darzustellen.

## Kontext und Quellen

- Nutzerfund vom 2026-06-02 mit Screenshot: Die Anzeige zeigt `3 Cockroach` direkt auf der Runner-Karte `Cockroach` im Rig.
- Nutzererwartung: Der Kartentext sagt `give the Corp a Cockroach counter`; die Counter sollen deshalb wie andere Korp-Counter bei der Korp angezeigt werden.
- Aktuelle lokale Kartendefinition: `onr_v1_013_cockroach` / `Cockroach`, Text in `packages/shared/src/index.ts` und `data/cards/originalset-v1-cards.json`.
- Relevante Vorarbeit mit gleichem Anzeige-Muster: `docs/activities/done/act-2026-05-22-skivviss-counter-ownership-and-draw-log.md`.
- Naheliegende Codepfade laut Vorsichtung:
  - `packages/engine/src/game/view/card-view.ts`
  - `apps/web/app/action-board-ui.ts`
  - `apps/web/app/chronicle.ts`
  - bestehende Cockroach-Tests in Engine und Web.

## Scope

- Prüfen, ob Cockroach-Counter weiterhin engine-intern auf der verursachenden Runner-Karte gespeichert bleiben dürfen oder ob nur die PlayerView-/CounterDisplay-Projektion falsch ist.
- PlayerView-/Web-Anzeige so korrigieren, dass Cockroach-Counter als Korp-zugeordnete Counter sichtbar werden, analog zum Skivviss-Muster.
- Den Karten-Badge auf `Cockroach` im Runner-Rig entfernen oder so ändern, dass dort keine irreführende Karten-Counter-Anzeige mehr entsteht.
- Chroniktext für erfolgreiche HQ-Runs mit Cockroach so korrigieren, dass er die Korp als Empfänger benennt.
- Tooltip-/Kurztexte und bestehende Counter-Badges auf konsistente Begriffe prüfen: `Korp`, `Cockroach-Counter`, Virus-/Purge-Hinweis.
- Fokussierte Regressionen für Anzeigeprojektion und Chronikformatierung ergänzen oder aktualisieren.

## Nicht im Scope

- Keine Änderung an der Regelwirkung: Ab zwei Cockroach-Countern werden Korp-HQ-Discards zufällig.
- Keine Änderung am allgemeinen Virus-Purge-Vertrag.
- Keine generische Neugestaltung aller Counter-Anzeigen.
- Keine neue Hidden-Info-Offenlegung aus HQ, R&D, Stack, Grip, Hand, Reconnect, PublicEvents oder Replay.
- Keine KI-Strategie- oder Kartensupport-Änderung.

## Akzeptanzkriterien

- [x] Cockroach-Counter werden im normalen Spiel nicht mehr als Counter auf der Runner-Karte im Rig angezeigt.
- [x] Die Korp-Anzeige enthält stattdessen einen verständlichen Cockroach-Counter-Eintrag mit Anzahl.
- [x] Runner- und Korp-Sicht sind side-sicher und zeigen keine verdeckten Korp-Karteninformationen.
- [x] Die Chronik für erfolgreiche HQ-Runs formuliert sinngemäß, dass die Korp Cockroach-Counter erhält.
- [x] Die Chronik- und Tooltiptexte verwenden `Korp` statt `Corp`, soweit es sichtbare deutsche UI-Texte sind.
- [x] Die bestehende Random-HQ-Discard-Wirkung ab zwei Cockroach-Countern und die Virus-Purge-Integration bleiben erhalten.
- [x] Fokussierte Web-/Engine-Tests decken Counter-Projektion, Chroniktext und Hidden-Info-Grenze ab, oder ausgelassene Checks sind begründet.

## Umsetzungshinweise

- Das Skivviss-Ergebnis als Muster verwenden: interner Speicherort und öffentliche Anzeigeprojektion dürfen getrennt sein, solange Replay, StateHash und Purge-Verhalten stabil bleiben.
- Bestehende Web-Erwartungen wie `Cockroach erhält 1 Cockroach-Counter.` vermutlich auf Korp-Empfänger ändern.
- Wenn sich bei der Analyse zeigt, dass nicht nur die Projektion, sondern der Regelzustand selbst falsch modelliert ist, das Paket vor der Umsetzung eng auf `card-enablement-ai-knowledge-agent` re-scope'n oder ein Folgepaket anlegen.

## Ergebnisnotiz

Umgesetzt am 2026-06-03.

- Der interne Regelzustand bleibt unverändert source-bound auf der installierten Runner-Karte `Cockroach`, damit Random-HQ-Discard, Purge, Replay und StateHash stabil bleiben.
- Die PlayerView projiziert Cockroach-Counter jetzt wie Skivviss/Cascade auf die Korp-Identität. Auf der Runner-Karte im Rig werden weder `counters.virus` noch ein Cockroach-/Virus-CounterDisplay ausgegeben.
- Beide Sichtweisen erhalten denselben öffentlichen Korp-CounterDisplay mit Label `Cockroach-Counter`, Anzahl und Aria-Text `... auf der Korp`; es werden keine verdeckten Korp-Kartendaten ergänzt.
- Der öffentliche Cockroach-ResolvedEffect ist semantisch auf `side: "corp"` gesetzt, während die interne Speicherung unverändert bleibt.
- Die Chronik formuliert erfolgreiche HQ-Run-Counter jetzt als Korp-Empfang: `Die Korp hat 1 Cockroach-Counter durch Cockroach erhalten.`
- Die vorhandene Tooltiplogik wurde nicht umgebaut; sie nutzt das bestehende `cockroach`-CounterDisplay und bleibt deutsch mit `Korp`.
