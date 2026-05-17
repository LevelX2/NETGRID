---
activityId: act-2026-05-17-crash-pump-run-duration
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Crash: Pump-Bonus bis zum Run-Ende halten

## Ziel

Der Stärke-Pump von `Crash` soll innerhalb desselben Runs beim nächsten ICE erhalten bleiben und erst am Run-Ende entfernt werden, falls der Kartentext diese Laufzeit vorgibt.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Nach `+1 Stärke` am ersten ICE verschwindet der Bonus beim nächsten ICE im selben Run.
- Nutzererwartung: nicht für den ganzen Runner-Zug, aber für den aktuellen Run.
- Lokaler Kartenanker: `onr_v1_157_crash-everett-inventive-fixer`.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle.md` behandelte unnötiges Pumpen/Chronik, nicht diese Laufzeit.

## Scope

- Kartentext und lokale Regelbasis für Crash-Pump-Laufzeit prüfen.
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

Noch offen.
