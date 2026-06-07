---
activityId: act-2026-06-07-runner-ai-wilson-run-action-utilization
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/runner-wilson-run-action.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-wilson-run-action.test.ts
  - corepack pnpm --filter @netgrid/ai exec tsc --noEmit
  - git diff --check
---

# Runner-KI nutzt Wilson-Run-Aktion opportunistisch

## Ziel

Die Runner-KI soll eine installierte Karte `Wilson, Weeflerunner Apprentice` nicht ignorieren, wenn sie in diesem Zug ohnehin einen Run plant und das Wilson-Ausgabenlimit voraussichtlich nicht gegen den Run spricht.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Rallam als Runner-KI installierte `Wilson, Weeflerunner Apprentice` im ersten Zug, nutzte Wilson danach aber nicht, obwohl Runs gewählt wurden und kein sichtbarer Bedarf bestand, während des Wilson-Runs mehr als 3 Credits für Icebreaker- oder Link-Kosten auszugeben.
- Fachliche Erwartung aus der Beobachtung: Wenn die Runner-KI sich für einen Run entscheidet, soll sie bei installiertem Wilson zuerst die Wilson-Aktion wählen und den anschließend verfügbaren Wilson-Run nutzen, sofern der Run nicht sichtbar mehr als 3 Credits für Icebreaker/Link erfordert.
- Wilson-Engine-Implementierung: `packages/engine/src/card-implementations/onr-v1/runner/resources/wilson-weeflerunner-apprentice.ts`
- LegalAction-Erzeugung: `packages/engine/src/game/turn/runner-main-actions.ts`
  - `runnerAbility: "wilson_gain_run_action"`
  - `payload.wilsonRunOnlyAction === true`
- Wilson-Resolver und Run-Cap: `packages/engine/src/game/abilities/trigger-ability-execution.ts`, `packages/engine/src/game/run/start-run-action-execution.ts`, `packages/engine/src/game/run/run-duration-payment.ts`
- Aktueller AI-Hinweis: `data/ai/ai-card-hints-active.json` enthält Wilson als AI-unterstützte Karte.
- Bestehender AI-Pfad: `packages/ai/src/index.ts`, `packages/ai/src/tactical-plans.ts`, `packages/ai/src/runner-plans.ts`

## Scope

- Reproduzierbaren AI-Test anlegen, in dem die Runner-KI Wilson installiert hat, eine `wilson_gain_run_action`-LegalAction sieht und zugleich ein normaler Run fachlich das beste Ziel ist.
- Runner-KI so erweitern, dass sie in dieser Lage zuerst die Wilson-Trigger-LegalAction wählt, statt direkt den normalen Run zu starten.
- Folgeentscheidung nach aktivierter Wilson-Aktion absichern: Wenn normale `start_run`-Actions und passende `start_run`-Actions mit `payload.wilsonRunOnlyAction === true` für dasselbe Ziel verfügbar sind, soll die KI die Wilson-Run-Action bevorzugen.
- Wilson-Nutzung an die bestehende Run-Planung binden: Das Wilson-Ziel soll aus dem bereits gewählten Run-Plan, RunTargetEvaluation oder TacticalPlan abgeleitet werden, nicht als separate zufällige Run-Strategie entstehen.
- Das 3-Credit-Limit konservativ berücksichtigen:
  - Wilson bevorzugen, wenn sichtbare/geschätzte Icebreaker- und Link-Ausgaben für den geplanten Run bei höchstens 3 Credits liegen.
  - Wilson nicht bevorzugen, wenn sichtbare Kosten oder vorhandene Run-Kostenabschätzung klar mehr als 3 Credits für Icebreaker/Link erwarten lassen.
- DecisionDebug/Evidence knapp ergänzen, damit sichtbar ist, ob Wilson genutzt, übersprungen oder wegen Cap-Risiko nicht bevorzugt wurde.
- Fokussierte Regressionstests für Trigger-Entscheidung und anschließende Wilson-Run-Auswahl ergänzen.

## Nicht im Scope

- Keine Änderung daran, welche Wilson-LegalActions die Engine erzeugt.
- Keine Änderung an `applyAction`, StateHash, Replay, Run-Payment, Run-Start-Tax, ICE-Encounter-Logik oder Wilson-Regeltext.
- Keine synthetischen Actions: Die KI darf nur vorhandene `LegalActions` auswählen.
- Keine Hidden-Info-Auswertung aus Korp-Hand, R&D, verdeckten ICE-Kosten oder privaten Payloads.
- Keine breite Neukalibrierung aller Runner-Run-Gewichte.
- Keine Änderung an Wilsons Tag-Avoid- oder Meat-Damage-Prevention-Fähigkeiten.

## Akzeptanzkriterien

- [x] Ein fokussierter AI-Test zeigt: Bei installiertem Wilson, legalem `wilson_gain_run_action` und einem geplanten Run mit sichtbarem Cap-Risiko <= 3 wählt `chooseRunnerAction` zuerst die Wilson-Trigger-LegalAction.
- [x] Ein fokussierter AI-Test zeigt: Nach aktivierter Wilson-Aktion bevorzugt `chooseRunnerAction` für dasselbe Run-Ziel die `start_run`-LegalAction mit `payload.wilsonRunOnlyAction === true` gegenüber der normalen Click-Run-Action.
- [x] Ein negativer Test zeigt: Bei klar geschätzten Icebreaker-/Link-Ausgaben > 3 Credits wird Wilson nicht gegenüber dem normalen Run erzwungen.
- [x] TacticalPlan- oder Legacy-Referenz bleibt stabil: Wilson erzeugt keinen neuen Run-Plan, sondern hängt sich an den ohnehin gewählten Run-Plan an.
- [x] DecisionDebug/Evidence nennt mindestens einen redigierten Grund wie `wilson_run_action_preferred`, `wilson_run_only_action_preferred` oder `wilson_cap_risk_skip`.
- [x] Die Tests prüfen, dass die ausgewählte Action aus `input.legalActions` stammt und keine privaten Karten-, Instanz-, Payload- oder FullState-Daten auswertet.
- [x] Fokussierte `@netgrid/ai`-Tests und `git diff --check` sind grün; falls bestehende fremde Änderungen breitere Checks blockieren, ist das Ergebnis als bekannt getrennt dokumentiert.

## Umsetzungshinweise

- Wahrscheinliche Ansatzpunkte sind `chooseRunnerAction`/Semantic Runtime in `packages/ai/src/index.ts` und die Run-Plan-Mapping-Logik in `packages/ai/src/tactical-plans.ts`.
- Die erste Entscheidung ist ein Setup-Schritt vor dem Run: Wilson-Trigger wählen, wenn der aktuell stärkste mappbare Runner-Plan ein Run ist und Wilson noch ungenutzt ist.
- Die zweite Entscheidung ist ein Action-Ersatz: Bei identischem Serverziel und akzeptablem Cap-Risiko die Wilson-Run-Action der normalen `start_run`-Action vorziehen.
- Cap-Prüfung nur aus side-sicheren, vorhandenen AIInput-/LegalAction-/VisibleRunAnalysis-Daten ableiten. Wenn die Schätzung unsicher ist, konservativ bleiben und Debug-Evidence ausgeben.
- Wenn die Analyse zeigt, dass Wilson nur exemplarisch für eine generische Familie "zusätzliche Run-Aktion mit Einschränkung" steht, dieses Paket zuerst für Wilson abschließen und danach ein eigenes Familienpaket schneiden.

## Ergebnisnotiz

Die Runner-KI hängt Wilson jetzt an den ohnehin gewählten Semantic-Runtime-Run an: Bei sicherem sichtbarem Cap-Risiko wird zuerst die Wilson-Trigger-LegalAction gewählt, danach für dasselbe Ziel die Wilson-only-Run-Action bevorzugt. Bei klar sichtbaren Icebreaker-/Link-Kosten über 3 Credits bleibt die normale Run-Action bestehen. DecisionDebug nennt redigierte Wilson-Evidence, und die neuen Tests prüfen LegalAction-Herkunft sowie absence privater Daten.
