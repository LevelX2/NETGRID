---
activityId: act-2026-06-13-runner-ai-holovid-remote-trash-commitment
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-13
startedAt: 2026-06-13
completedAt: 2026-06-13
branch:
releaseTarget: runner-ai-known-remote-payoff-follow-up
blockedBy: []
resultArtifacts:
  - packages/ai/src/known-remote-access-payoff.ts
  - packages/ai/src/index.test.ts
checks:
  - "PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t \"Holovid|BBS|memory-known|known remote\""
  - "PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts -t \"known remote|remote trash|reserve\""
  - "PASS: corepack pnpm --filter @netgrid/ai typecheck"
---

# Runner-KI: Holovid-Remote nur mit echtem Trash-Commitment contesten

## Ziel

Die Runner-KI soll wiederholte Runs auf ein bekanntes, ungeschütztes Remote-Asset vermeiden, wenn sie beim Zugriff den bekannten Trash-Payoff nicht nehmen wird. Ein Run auf ein bekanntes `Holovid Campaign`-Remote darf nicht über mehrere Züge oder mehrfach in einem Zug als `runner.contest_remote` gewinnen, wenn der Runner den Zugriff anschließend immer wieder ablehnt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-13: In einer Partie `Cooperation` gegen Runner-KI liegt in `remote_2` ein `Holovid Campaign` ohne ICE. Über die letzten drei Züge läuft die Runner-KI wiederholt auf dieses Remote, trashte die Karte beim Zugriff aber nicht, obwohl genug Credits vorhanden waren. Teilweise wiederholt sie denselben Run viermal in einem Zug und verschwendet dadurch Aktionen.
- Betroffene Karte: `Holovid Campaign` (`onr_v1_326_holovid-campaign`), Trashkosten 7, rezzed Asset/Node mit öffentlichen Bits und Korp-Start-of-turn-Creditdrain.
- Verwandte abgeschlossene Fixlinie:
  - `docs/architecture/ai/ai-fix-remote-known-access-payoff-automation-process-2026-06-06.md`
  - `docs/reviews/ai/ai-fix-remote-known-access-payoff-final-report-2026-06-06.md`
  - `docs/activities/done/act-2026-06-09-ai-remote-prerun-access-commitment.md`
- Arbeitshypothese: Die bestehende Pre-Run-Payoff-/Commitment-Logik greift für bekannte Remote-Assets ohne ICE nicht oder nicht konsistent genug, wenn der Trash technisch bezahlbar ist, aber die Access-Entscheidung selbst wegen Reserve, Wertmodell oder Kampagnenbewertung ablehnt.

## Scope

- Einen fokussierten Runner-KI-Reproduktionsfall für ein bekanntes, ungeschütztes Remote mit `Holovid Campaign` aufbauen.
- Prüfen, ob `evaluateKnownRemoteAccessPayoff`, Pre-Run Access Commitment, Planfortführung oder Action-Mapping bei ICE-losen Remote-Zielen anders bewertet als bei Remotes mit Pfadkosten.
- Die Pre-Run-Bewertung und die tatsächliche `trash_accessed_card`-Entscheidung so angleichen, dass ein bekannter Remote-Run nur dann hoch bewertet oder fortgeführt wird, wenn die KI den bekannten Trash-/Steal-/Access-Payoff auch nehmen würde.
- Regression für wiederholte `start_run remote_2`-Auswahl ergänzen: Nach einem abgelehnten Holovid-Trash bei unverändertem Remote-Zustand darf derselbe Remote keinen Planfortschreibungsbonus und keinen erneuten Action-Spam erhalten.

## Nicht im Scope

- Keine Änderung an Run-Legalität, Access-Queue, `trash_accessed_card`-LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung: Die KI darf nur sichtbare PlayerView-Daten und side-sichere eigene Memory nutzen.
- Keine globale Neugewichtung aller Remote-Runs, zentralen Runs oder Economy-Pläne außerhalb des beschriebenen known-remote-payoff-Falls.
- Keine Änderung an `Holovid Campaign`-Engine-Implementierung, Start-of-turn-Bits, Selftrash oder Trashkosten, außer ein separater Engine-Bug wird im Zuge der Analyse eindeutig belegt.

## Akzeptanzkriterien

- [ ] Es gibt einen fokussierten AI-Test für `Holovid Campaign` in einem bekannten, ungeschützten Remote, in dem die Runner-KI nach abgelehntem Trash denselben Remote nicht erneut mehrfach als beste Aktion wählt.
- [ ] Die Debug-/Evidence-Spur erklärt side-sicher, warum der Remote-Run abgewertet wird, z. B. über `known_remote_root_trash_declined`, `no_current_payoff`, `reserve_would_break`, `low_value_target` oder bestehende äquivalente Begriffe.
- [ ] Bezahlbarer und wirklich gewollter Remote-Trash bleibt positiv; bekannte Remote-Agendas bleiben positive Remote-Ziele.
- [ ] ICE-lose Remotes und Remotes mit Pfadkosten nutzen konsistente Pre-Run-Commitment-Logik.
- [ ] Relevante AI-Checks laufen grün, mindestens ein fokussierter Vitest-Lauf für die neue Regression und `corepack pnpm --filter @netgrid/ai typecheck`.

## Umsetzungshinweise

- Relevante Startpunkte:
  - `packages/ai/src/known-remote-access-payoff.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/src/tactical-plans.ts`
  - vorhandene Regressionen um `known remote`, `post-ICE trash guard`, `remote contest viable` und `assetTrashNeglect`.
- Erst klären, warum die KI im Zugriff nicht trasht: Budgetreserve, Zielwertmodell, Holovid-spezifischer Wert, fehlendes Structured-Role-Profil oder fehlende Memory-Invalidierung.
- Danach genau diese Access-Entscheidung in der Pre-Run-Projektion spiegeln oder eine gemeinsame Entscheidungsroutine nutzen, damit Planung und tatsächliche Access-Entscheidung nicht auseinanderlaufen.
- Der Fix soll keine neuen LegalActions erzeugen. Er darf nur vorhandene `LegalActions` priorisieren, mappen oder bewusst nicht mappen.

## Ergebnisnotiz

Erledigt am 2026-06-13. Die Known-Remote-Payoff-Projektion übernimmt bei sichtbaren bekannten Remote-Root-Karten jetzt auch die sichtbaren Counter aus der `PlayerView`. Dadurch bewertet sie endliche Economy-Pools wie `Holovid Campaign` konsistent mit der späteren Access-Trash-Entscheidung: Wenn der Trash technisch bezahlbar ist, aber wegen Creditreserve und zu geringem Restpool nicht genommen würde, wird der Remote vorab als `trash_unaffordable`/`known_no_current_payoff` eingestuft und der `runner.contest_remote`-Plan bleibt abandoned.

Der neue Regressionstest reproduziert ein bekanntes, ungeschütztes `Holovid Campaign`-Remote mit 8 Bits und 7 Runner-Credits: Die KI declined beim Access den Trash wegen Budget, bewertet den erneuten Remote-Run danach als known-no-payoff, penalisiert den Repeat nach declined Trash und wählt nicht erneut denselben Remote-Run. Bezahlbare BBS-/known-remote-Baselines und dedicated-trash-credit-Fälle bleiben grün.
