---
activityId: act-2026-05-17-olivia-salazar-rez-cost-reduction
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - apps/web/app/action-board-ui.test.ts
  - data/ai/ai-card-hints-active.json
  - data/manifests/card-implementation-manifest-1.9.19.json
  - data/manifests/deck-legal-ai-approval-v1919-manifest.json
  - data/rules/mechanics-coverage-1.9.19.json
  - data/scenarios/ai-deck-legal-v1919-smokes.json
  - data/scenarios/v1919-agenda-overadvance-release-smoke.json
  - data/scenarios/v1919-agenda-overadvance-wip-smoke.json
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Olivia Salazar|Fait Accompli and Arasaka\": pass"
  - "corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts app/chronicle.test.ts -t \"Olivia Salazar\": pass"
  - "corepack pnpm --filter @netgrid/engine typecheck: pass"
  - "corepack pnpm --filter @netgrid/web typecheck: pass"
  - "corepack pnpm --filter @netgrid/shared typecheck: pass"
  - "corepack pnpm --filter @netgrid/catalog test: pass"
  - "corepack pnpm check:ai-approval-consistency: pass"
  - "git diff --check: pass"
---

# Olivia Salazar: Rez-Kostenreduktion prüfen und anbieten

## Ziel

Wenn `Olivia Salazar` regelrecht ICE-Rez-Kosten reduziert, muss die reduzierte Rez-Option in LegalActions und UI angeboten werden, auch wenn die Korp die normalen Rez-Kosten nicht bezahlen kann.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Während eines Runs wurde nur `nicht rezzen` angeboten, obwohl die Korp mit Olivia-Kostenreduktion genug Credits gehabt hätte.
- Lokale V1.9.19-Artefakte beschreiben Olivia derzeit als Agenda-Steal-Kostenpfad; daher ist zuerst eine Regel-/Kartentextprüfung nötig.
- Lokaler Kartenanker: `onr_v1_363_olivia-salazar`.

## Scope

- Gültigen Kartentext und lokale Implementierungsbasis für Olivia Salazar prüfen.
- Falls Rez-Kostenreduktion korrekt ist: Affordability-Prüfung und optionale Cost-Reduction-Pipeline für Rez-Aktionen anpassen.
- Reduzierte Rez-Option mit Quelle und tatsächlichen Kosten anzeigen.
- Nutzungskosten/-Erschöpfung/-Drehung gemäß Kartentext abhandeln.
- Chronik-Eintrag für reduziertes Rezzen ergänzen.

## Nicht im Scope

- Keine generelle Cost-Reduction-Architektur über Rez-Aktionen hinaus, falls nicht nötig.
- Keine Änderung am Agenda-Steal-Pfad, außer eine Quellenprüfung zeigt, dass er falsch ist.

## Akzeptanzkriterien

- [x] Der gültige Olivia-Salazar-Effekt ist geprüft und dokumentiert.
- [x] Bei korrekter Rez-Reduktion wird die reduzierte Rez-Aktion angeboten, auch wenn normale Kosten unbezahlbar sind.
- [x] Der Button nennt Quelle und tatsächliche Kosten.
- [x] `applyAction` revalidiert reduzierte Kosten, Timing, Serverbezug und Quelle.
- [x] Chronik dokumentiert Quelle, ICE und gezahlte Kosten.

## Umsetzungshinweise

- Bei Quellenkonflikt nicht beide Effekte still kombinieren; zuerst Entscheidung sichtbar machen.

## Ergebnisnotiz

Erledigt am 2026-05-17. Quellenprüfung gegen `docs/source/Corpspoiler 1.0.txt` und `docs/source/Netrunner Errata 1.70.md` bestätigt Olivia Salazar als source-bound Rez-Effekt: Für halbe effektive Kosten, abgerundet, wird ein ICE in ihrem Fort während des Runs gerezzt und am Runende derezzt; jede Olivia-Quelle darf nur einmal pro Run auf diesem Fort verwendet werden. Der widersprüchliche Agenda-Steal-Kostenpfad wurde aus Runtime, Tests und V1.9.19-Datenartefakten entfernt.

Die Engine bietet nun im `run.approach_ice`-Fenster eine Olivia-Rez-LegalAction an, auch wenn die normalen Rez-Kosten unbezahlbar sind. Das Action-Label nennt Olivia Salazar, ICE und tatsächliche Kosten. `applyAction` revalidiert Timing, aktuelles ICE, Fortbindung, rezzed Olivia-Quelle, einmalige Nutzung und reduzierte Kosten über die LegalAction-Regeneration plus explizite Resolver-Prüfung. PublicPayload und Chronik nennen Quelle, ICE, Ausgangskosten und gezahlte Kosten; am Runende wird das temporär gerezzte ICE derezzt.
