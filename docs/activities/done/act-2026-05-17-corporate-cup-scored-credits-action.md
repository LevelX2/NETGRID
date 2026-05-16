---
activityId: act-2026-05-17-corporate-cup-scored-credits-action
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/catalog/src/catalog-gates.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/score-area-ui.ts
  - apps/web/app/score-area-ui.test.ts
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "scores Coup agendas"
  - corepack pnpm --filter @netgrid/engine test -- -t "revalidates scored agenda"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/shared test
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/catalog test
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts score-area-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Corporate Cup: Scored-Credits, Aktionsfähigkeit und Anzeige korrigieren

## Ziel

`Corporate Cup` soll nach dem Scoren die korrekte Anzahl Credits erhalten und der Korp eine ausführbare Fähigkeit anbieten, um Credits von der Agenda in den Credit-Vorrat zu verschieben. Die Anzeige soll Credits auf der Agenda als Token/Credits darstellen, nicht als missverständlichen Badge-Text oder statische Effektzeile.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Nach dem Scoren von `Corporate Cup` liegen nur `5 Credits` auf der Agenda, erwartet sind `15 Credits`.
- Es fehlt eine sichtbare und ausführbare Aktion, mit der die Korp `3` Credits von `Corporate Cup` nehmen und in den eigenen Vorrat legen kann.
- Die aktuelle scored-Agenda-Anzeige zeigt unten zusätzlich `5 Credits` und den Text `Aktion: 1 Credit nehmen`; das wirkt wie eine statische Effektbeschreibung und ist für eine ausführbare Fähigkeit nicht hilfreich.
- Gewünschte Darstellung: Credits auf der Agenda als Credit-/Goldstück-Token wie bei anderen Karten. Ab zweistelligen Mengen soll die bestehende Mengenlogik mit Zahl genutzt werden, also z. B. ein Credit-Token mit `15`.

## Scope

- `Corporate Cup`-Regel-/Resolververtrag gegen lokale Quellen prüfen: beim Scoren sollen 15 Credits auf die Agenda gelegt werden.
- Engine/Runtime prüfen und korrigieren, warum aktuell nur 5 Credits auf `Corporate Cup` landen.
- LegalAction für die Korp bereitstellen, solange `Corporate Cup` scored ist und mindestens 3 Credits auf ihr liegen: 3 Credits von der Agenda nehmen und dem Korp-Creditpool hinzufügen.
- Die LegalAction side-, stateVersion-, Kosten-/Counter- und stale-sicher revalidieren.
- Die Aktion in der UI im scored-Agenda-Kontext sichtbar und ausführbar machen, idealerweise als Aktionsbutton direkt bei der Agenda.
- Credit-Anzeige auf scored Agendas so darstellen, dass Credit-Counter als Token/Goldstücke mit Mengenbadge erscheinen, nicht nur als Textbadge.
- Prüfen, ob die untere scored-Agenda-Statuszeile für reine Aktionsfähigkeiten entfernt oder anders behandelt werden soll; statische Effekte dürfen weiterhin angezeigt werden.

## Nicht im Scope

- Keine Änderung an allgemeinen Agenda-Punkte-Regeln.
- Keine Änderung an Scoring/Steal-Grundlogik außerhalb von `Corporate Cup`, außer die Anzeige nutzt bereits generische scored-Agenda-Counter.
- Keine Änderung an Replay oder StateHash außer den notwendigen deterministischen Events der korrigierten Fähigkeit.
- Keine KI-Freigabe-Erweiterung, falls dafür ein separates AI-Hint-/AI-Smoke-Gate nötig ist; AI-Nutzung der Fähigkeit kann als Folgepunkt dokumentiert werden.
- Kein Redesign des gesamten scored-Agenda-Overlays.

## Akzeptanzkriterien

- [x] `Corporate Cup` erhält beim Scoren 15 Credits, nicht 5.
- [x] Die Korp sieht eine ausführbare Aktion, um 3 Credits von `Corporate Cup` in den eigenen Creditpool zu nehmen.
- [x] Die Aktion verschwindet oder ist illegal, sobald weniger als 3 Credits auf `Corporate Cup` liegen.
- [x] `applyAction` revalidiert Side, StateVersion, Quelle, Countermenge und Timing.
- [x] PublicEvents/PlayerViews bleiben side-sicher und leaken keine verdeckten Informationen.
- [x] Replay und StateHash bleiben deterministisch.
- [x] Die scored-Agenda-Anzeige stellt Agenda-Credits als Credit-/Goldstück-Token mit Mengenanzeige dar; `15` ist als Menge klar sichtbar.
- [x] Reine Aktionsfähigkeiten werden nicht zusätzlich als irreführende statische Effektzeile wiederholt, sofern der Aktionsbutton sichtbar ist.
- [x] Fokussierte Engine- und Web-Regressionen decken Scoren, Creditmenge, Credit-Entnahme und Anzeige ab, oder Testauslassungen sind begründet dokumentiert.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind `packages/engine/src/index.ts` oder die ausgelagerten Mechanics-Module für Agenda-/Operation-Effekte, `packages/shared/src` für Kartendaten sowie die scored-Agenda-Anzeige in `apps/web/app/page.tsx`.
- Zuerst einen kleinen Repro-Test bauen, der zeigt, dass derzeit nur 5 Credits auf `Corporate Cup` liegen und keine Take-3-Action angeboten wird.
- Die Fähigkeit sollte als normale `LegalAction` modelliert werden, nicht als bloßer UI-Shortcut.
- Für die Anzeige sollte möglichst eine generische Counter-/Credit-Renderinglogik verwendet werden, damit andere scored Agendas mit Credit-Countern konsistent profitieren.

## Ergebnisnotiz

Erledigt am 2026-05-17. Lokale Quelle und Repository-Karte heißen `Corporate Coup`; die Nutzerformulierung `Corporate Cup` wurde als diese Karte eingeordnet. Shared- und Catalog-Text wurden auf den lokalen Quellvertrag `15` beim Scoren und `3` pro Aktion korrigiert. Die Engine legt beim Scoren jetzt 15 Power/Credit-Counter auf `Corporate Coup`, bietet die Korp-`gain_credit`-LegalAction nur ab mindestens 3 Countern an und revalidiert in `applyAction` Side, ScoreArea-Quelle, Definition, Countermenge und Gain-Betrag. `Political Coup` wurde als vergleichbare scored-Agenda-Aktion mitgeprüft und bleibt bei 12/3; die bestehende Revalidation für weitere scored-Agenda-Aktionen wurde fokussiert mitgetestet. Die Score-Area reicht CardActions jetzt an scored Agendas durch, Coup-Aktionen erhalten im Kartenkontext kompakte Labels wie `3 Credits nehmen`, und Coup-Counter werden als Credit-Token mit Mengenanzeige statt als statische Effekt-/Textzeile dargestellt. KI-Nutzung der Fähigkeit wurde nicht erweitert; die Aktion ist aber als reguläre LegalAction verfügbar.
