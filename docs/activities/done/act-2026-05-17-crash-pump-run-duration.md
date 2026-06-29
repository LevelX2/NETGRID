---
activityId: act-2026-05-17-crash-pump-run-duration
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
supersededBy:
  - "2026-06-29 Krash encounter-duration rules correction"
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Krash strength pumps" --passWithNoTests
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Krash: Pump-Bonus bis zum Run-Ende halten

> Korrektur 2026-06-29: Diese Activity beruhte auf einer falschen Regelannahme. Der gedruckte Krash-Text sagt nur `[2]: +1 strength`; im Gegensatz zu Grubb steht dort kein "for the remainder of this run". Der Krash-Pump ist daher wieder encounter-gebunden und muss beim nächsten ICE neu bezahlt werden.

## Ziel

Der Stärke-Pump von `Krash` soll innerhalb desselben Runs beim nächsten ICE erhalten bleiben und erst am Run-Ende entfernt werden.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Nach `+1 Stärke` am ersten ICE verschwindet der Bonus beim nächsten ICE im selben Run.
- Nutzererwartung: nicht für den ganzen Runner-Zug, aber für den aktuellen Run.
- Klarstellung vom 2026-05-17: `Crash` war falsch geschrieben; gemeint ist `Krash`.
- Lokaler Kartenanker: `onr_v1_039_krash`.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle.md` behandelte unnötiges Pumpen/Chronik, nicht diese Laufzeit.

## Scope

- Kartentext und lokale Regelbasis für Krash-Pump-Laufzeit prüfen.
- Modifier-Laufzeit (`encounter`, `run`, `turn`) korrigieren.
- UI-Chip und Stärke-Berechnung beim ICE-Wechsel synchron halten.
- Run-Ende-Cleanup testen.

## Nicht im Scope

- Keine Änderung an Runner-KI-Pump-Strategie.
- Keine generelle Icebreaker-UI außer der nötigen Anzeige des bestehenden Modifiers.

## Akzeptanzkriterien

- [ ] Gesicherter Regelstand zur Crash-Pump-Laufzeit ist geprüft.
- [ ] Falls Run-Laufzeit korrekt ist: Bonus bleibt beim nächsten ICE im selben Run erhalten.
- [ ] Bonus wird am Run-Ende entfernt und nicht in den nächsten Run oder Zug getragen.
- [ ] UI-Chip und effektive Stärke stimmen überein.
- [ ] Regression deckt zwei ICE in einem Run ab.

## Umsetzungshinweise

- Falls der lokale Kartentext abweicht, den Konflikt sichtbar dokumentieren und nicht still gegen die Quelle arbeiten.

## Ergebnisnotiz

Überholt durch Korrektur vom 2026-06-29: Krash nutzt nicht mehr den rungebundenen Strength-Bonuspfad. Der Pump-Bonus bleibt nur im aktuellen ICE-Encounter erhalten; beim nächsten ICE steht Krash wieder auf seiner Basisstärke und muss erneut gepumpt werden. Run-gebundene Stärke bleibt Karten wie Grubb vorbehalten, deren Text die Laufzeit ausdrücklich nennt.
