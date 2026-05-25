---
activityId: act-2026-05-24-quest-for-cattekin-start-turn-chronicle-random
status: inbox
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Quest for Cattekin Start-of-Turn-Wurf und Chronik prüfen

## Ziel

`Quest for Cattekin` zeigt bei jedem Runner-Zugbeginn nachvollziehbar den Würfelwurf und das Ergebnis in der Chronik, und der Engine-Pfad würfelt, trasht, schadet und gewährt die dauerhafte Extra-Aktion exakt nach Kartentext.

## Kontext und Quellen

- Nutzerfund vom 2026-05-24: Die Resource-Random `Quest for Cattekin` lag im Rig. Zu Beginn des nächsten Runner-Zugs wurde die Karte direkt getrasht und der Runner hatte eine Action mehr, aber im Protokoll stand kein Würfelwurf und kein Ergebnis.
- Erwarteter sichtbarer Verlauf: Chronik nennt den Wurf. Bei `6`: Quest for Cattekin trashen und dauerhafte Extra-Aktion für künftige Runner-Züge. Bei `1`: 1 Brain/Core Damage. Bei `2`: 1 Net Damage. Bei `3`, `4`, `5`: sichtbar kein weiterer Effekt.
- Kartendaten: `onr_v1_172_quest-for-cattekin`, Titel im Projekt `Quest for Cattekin`; Nutzer sagte phonetisch `Quest for Catechin`.
- Quelle: `docs/source/Runnerspoiler 1.0.txt` nennt den Originaltext mit Start-of-turn-Wurf, 6er-Trash/Action, 1 Brain Damage, 2 Net Damage und nicht verhinderbarem Damage.
- Bestehender Status: `docs/releases/v1/v1-9-originalset-completion/v1-9-21-deterministic-random/random-effect-completion-review.md` dokumentiert die Karte als abgeschlossen; `docs/reviews/originalset-spotchecks/register.md` sagt „Engine funktioniert; Chronik nachgeschärft“.
- Relevante Codepfade laut Vorsichtung: `packages/engine/src/index.ts` `applyQuestForCattekinStartOfTurn`, `packages/engine/src/index.test.ts` Quest-for-Cattekin-Startturn-Test, Web-Chronik in `apps/web/app/page.tsx`.

## Scope

- Prüfen, ob `applyQuestForCattekinStartOfTurn` im Live-Zug wirklich bei jedem installierten Quest-for-Cattekin-Exemplar genau einmal würfelt.
- Prüfen, ob der 6er-Fall tatsächlich aus einem deterministischen Würfelwurf kommt und nicht durch Timing, Setup, Testfixture, Reconnect oder State-Version-Logik irrtümlich ausgelöst wird.
- Chronik-/PublicEvent-Darstellung für alle Outcomes ergänzen oder reparieren:
  - `1`: Würfelwurf und 1 Brain/Core Damage.
  - `2`: Würfelwurf und 1 Net Damage.
  - `3`, `4`, `5`: Würfelwurf und „kein weiterer Effekt“.
  - `6`: Würfelwurf, Trash der Resource und dauerhafte Extra-Aktion.
- Sicherstellen, dass die zusätzliche Action ab dem richtigen Zeitpunkt und dauerhaft für spätere Runner-Züge gilt.
- Einen fokussierten Regressionstest ergänzen, der mindestens einen No-Op-Wurf und den 6er-Fall über öffentliche Events/Chronikdaten absichert.

## Nicht im Scope

- Keine Änderung des offiziellen Kartentexts oder Card-ID-Schemas.
- Keine generelle Neugestaltung der Chronik oder aller Random-Karten.
- Keine Änderung an Seed-, RandomCounter-, RandomDrawRecords-, Replay- oder StateHash-Grundverträgen außerhalb des nötigen Fixes.
- Keine Abschwächung von Hidden-Info-Redaction in PublicEvents, Reconnect, Undo, Replay, Logs oder KI-Inputs.
- Keine KI-Strategieänderung für die Bewertung von `Quest for Cattekin`.

## Akzeptanzkriterien

- [ ] Bei jedem Runner-Zugbeginn mit installierter `Quest for Cattekin` entsteht ein deterministischer Würfelwurf mit passendem `RandomDrawRecord`.
- [ ] Die öffentliche Chronik zeigt für `Quest for Cattekin` den gewürfelten Wert und das konkrete Ergebnis, auch bei `3`, `4` oder `5`.
- [ ] Bei Wurf `6` wird die Resource getrasht, der Runner erhält die Extra-Aktion im aktuellen oder ab dem regelkonform erwarteten Turn, und der persistente Extra-Action-Zustand wirkt in späteren Runner-Zügen weiter.
- [ ] Bei Wurf `1`/`2` wird der passende nicht verhinderbare Damage ausgelöst und in der Chronik verständlich dargestellt.
- [ ] Replays bleiben deterministisch; StateHash und RandomDrawRecords bleiben stabil.
- [ ] PublicEvent-/Reconnect-/Undo-/Replay-Payloads leaken keine verdeckten Kartendaten.
- [ ] Fokussierte Engine- und, falls die Chronik im Webclient betroffen ist, Web-/UI-Tests sind ergänzt oder ein bewusst begründeter Ersatzcheck ist dokumentiert.

## Umsetzungshinweise

- Der vorhandene Engine-Effekt enthält bereits `v1921DieRoll`, `randomPurpose` und `randomCounterAfter`; wahrscheinlich liegt der Fehler entweder im spezifischen 6er-/No-Op-Testloch oder in der Chronik-Mapping-Schicht.
- Nicht nur den 6er-Fall testen. Der Nutzer braucht ausdrücklich sichtbare Protokolle auch bei „nichts passiert“.
- Für deterministische Outcome-Tests bevorzugt gezielte Seeds oder vorhandene Testhelfer verwenden, statt den Random-Resolver selbst zu umgehen.
- Wenn sich herausstellt, dass die Engine korrekt ist und nur die Web-Chronik die `resolvedEffects` nicht rendert, das Ergebnis als UI-/Chronik-Fix umsetzen, aber die Engine-Regression für den Nutzerfund trotzdem absichern.

## Ergebnisnotiz

Noch offen.
