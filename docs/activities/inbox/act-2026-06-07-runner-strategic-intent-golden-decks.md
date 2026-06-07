---
activityId: act-2026-06-07-runner-strategic-intent-golden-decks
status: inbox
kind: fix
area: ai
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner StrategicIntent mit weiteren Golden Decks absichern

## Ziel

Die neue Runner-Strategieprojektion soll nicht nur am Golden Deck `Blink Pressure Rig` kalibriert werden, sondern durch weitere repräsentative Runner-Deckmuster gegen Überanpassung abgesichert werden.

## Kontext und Quellen

- Nutzer-Nacharbeitsableitung vom 2026-06-07 aus eingefügtem Reviewtext.
- AI-STRAT-4 deckt `Blink Pressure Rig` als ersten Golden-Deck-Anker ab.
- `packages/ai/src/runner-golden-deck-debug.test.ts`
- `packages/ai/src/runner-strategic-intent.test.ts`
- `data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json`
- `data/ai/ai-local-realistic-benchmark-decks-2026-05-23.json`

## Scope

- Vorhandene Runner-Benchmark-Decks sichten und 2 bis 3 zusätzliche Golden-Deck-Szenarien auswählen.
- Mindestens diese Muster prüfen, sofern passende Snapshots vorhanden oder klein synthetisch sinnvoll sind:
  - R&D-/Interface-Pressure-Deck,
  - HQ-/Pressure-Deck,
  - Economy-/Remote-Contest-Deck,
  - neutrales Agenda-Steal-Deck ohne klare Speziallinie.
- Tests ergänzen, die `primaryWinIntent`, `executionStyle`, `setupEngine`, `pressureVectors`, `riskProfile`, `rejectedIntents` und redigierte Evidence für diese Muster absichern.
- Abweichungen dokumentieren, wenn ein vorgeschlagenes Muster noch keine belastbare Snapshot-Grundlage hat.

## Nicht im Scope

- Keine neuen Strategy-IDs.
- Keine neuen Taktiksignale oder Kartentaxonomie-Dateien.
- Keine Card-Hint-Migration.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.
- Keine vollständige Neubewertung aller Runner-Decks.

## Akzeptanzkriterien

- [ ] Mindestens zwei zusätzliche Runner-Golden-Deck-Muster sind durch fokussierte Tests abgesichert oder begründet zurückgestellt.
- [ ] Die Tests verhindern, dass generischer Support fälschlich zu dediziertem HQ-/R&D-Pressure wird.
- [ ] Blink Pressure Rig bleibt weiterhin grün.
- [ ] Evidence und Debug-Snapshots enthalten keine vollständige Deckliste, Deckreihenfolge, private Snapshot-ID, `cardInstances`, `privatePayload` oder gegnerische Hidden-Info.
- [ ] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Erst vorhandene Benchmark-Snapshots nutzen; nur bei klarer Lücke kleine synthetische Fixtures anlegen.
- Wenn die Sichtung konkrete Kalibrierfehler zeigt, kleine Folge-Activities schneiden statt eine große KI-Rekalibrierung in dieses Paket zu ziehen.

## Ergebnisnotiz

Noch offen.
