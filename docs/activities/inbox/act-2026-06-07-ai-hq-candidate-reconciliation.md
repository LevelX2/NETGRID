---
activityId: act-2026-06-07-ai-hq-candidate-reconciliation
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-hq-hidden-install-candidates
resultArtifacts: []
checks: []
---

# HQ-Kandidaten durch spätere Rez-, Reveal- und Access-Ereignisse abgleichen

## Ziel

Mehrdeutige HQ-Kandidaten nach einem verdeckten Install sollen später wieder präzisiert werden, wenn die installierte Karte rechtmäßig bekannt wird. Dadurch soll die Runner-KI sichere Restkarten zurückgewinnen, statt dauerhaft in unnötiger Unsicherheit zu bleiben.

## Kontext und Quellen

- Vorgängerpaket: `act-2026-06-07-ai-hq-hidden-install-candidates`.
- Gewünschtes Verhalten aus Nutzerfeedback: Wenn von mehreren bekannten ICE eines verdeckt installiert wurde und später das entsprechende ICE gerezzt oder anderweitig offenbart wird, muss die KI nachkorrigieren können, welches ICE noch in HQ sein muss.
- Relevante Codeanker:
  - `packages/ai/src/belief-state.ts`
  - `packages/ai/src/runner-plans.ts`
  - `packages/ai/src/index.test.ts`

## Scope

- Kandidatengruppen mit installierter Position oder Remote-/Serverbezug so führen, dass spätere Events sie wiederfinden können.
- Spätere rechtmäßige Offenbarungen auswerten:
  - Rez,
  - Access,
  - Expose/Reveal,
  - Trash/Steal/Score aus der installierten Position.
- Wenn die offenbarte Karte Teil einer Kandidatengruppe ist:
  - diese Definition aus der HQ-Restunsicherheit entfernen,
  - andere Kandidaten entsprechend wieder als sicherer HQ-Rest zählen, soweit logisch zwingend,
  - Duplikate count-sicher behandeln.
- Wenn die offenbarte Karte nicht zur Kandidatengruppe passt:
  - konservativ bleiben,
  - Invalidation-/Anomaliegrund im Belief-Debug erfassen,
  - keine Hidden-Info-Schlussfolgerung erzwingen.
- Regressionen für eindeutige und duplikatbehaftete Kandidatengruppen ergänzen.

## Nicht im Scope

- Keine vollständige Belief-World-Rollout-Logik.
- Keine Nutzung echter verdeckter Kartenidentitäten aus Engine-State oder Storage.
- Keine Änderung der Rez-, Access-, Trash-, Steal- oder Score-Regeln.
- Keine UI-Politur über notwendige Debug-Felder hinaus.

## Akzeptanzkriterien

- [ ] Eine durch verdeckten ICE-Install entstandene Kandidatengruppe wird nach späterem Rez der installierten Karte logisch reduziert.
- [ ] Sicher verbleibende HQ-Karten werden wieder als solche in `hqHandMemory` ableitbar.
- [ ] Duplikate werden count-sicher behandelt, ohne Karteninstanzidentität zu leaken.
- [ ] Mismatch-Fälle werden konservativ invalidiert oder markiert, nicht durch illegale Information gelöst.
- [ ] Planner-Bewertung für HQ-Druck nutzt wiedergewonnene sichere Agenda-/Nicht-Agenda-Information korrekt.
- [ ] Fokussierte AI-Tests, Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Priorität hat Korrektheit der sicheren Restmengen, nicht maximale UI-Darstellung.
- Kandidatengruppen sollten eine stabile, side-sichere Referenz auf das Install-Ereignis und den Server/Slot tragen.
- Wenn ein späterer Event zu wenig Positionsinformation enthält, Folgepaket für side-sichere Eventposition statt breiter Schätzung anlegen.

## Ergebnisnotiz

Noch offen.
