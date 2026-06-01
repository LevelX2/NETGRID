---
activityId: act-2026-06-01-mystery-box-chronicle-run-choice
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-06-01
startedAt: 2026-06-01
completedAt: 2026-06-01
branch:
releaseTarget:
blockedBy:
  - act-2026-06-01-mystery-box-corp-review-gate
relatedActivities:
  - act-2026-05-19-self-modifying-code-choice-chronicle
  - act-2026-05-23-synchronized-attack-hq-chronicle-summary
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - packages/engine/src/game/hidden-zone/search-choice-handlers.ts
  - packages/engine/src/game/hidden-zone/search-choice-handlers.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/hidden-zone/search-choice-handlers.test.ts -t "p3_38 Mystery Box"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "Mystery Box"
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "Mystery Box review"
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Mystery Box: Chronik zeigt Run-Kontext und konkrete Programmauswahl

## Ziel

Die Chronik soll `Mystery Box` während eines Runs korrekt unter dem laufenden Run darstellen und die aufgelöste Programmauswahl konkret benennen, statt nur `Die Runner KI hat eine Entscheidung beantwortet.` zu zeigen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-01: Die Runner-KI nutzte `Mystery Box` während eines Runs auf Research and Development. Der Chronik-Eintrag zur Entscheidung war nach links an den Rand gerückt und damit nicht sichtbar als Teil des laufenden Runs gruppiert.
- Zusätzlich war die Meldung zu generisch: Statt `Die Runner KI hat eine Entscheidung beantwortet.` soll erkennbar sein, welches Programm aus den gezeigten Karten gewählt und installiert wurde.
- Verwandtes erledigtes Muster: `act-2026-05-19-self-modifying-code-choice-chronicle` löste denselben generischen Choice-Fallback für `Self-Modifying Code` mit konkreter Programmauswahl.
- Weiteres Muster: `act-2026-05-23-synchronized-attack-hq-chronicle-summary` ersetzte eine generische KI-Choice-Meldung durch eine side-sichere Ergebniszusammenfassung.
- Aktueller Web-Anker: `apps/web/app/chronicle.ts` fällt für unbekannte `resolve_choice`-Payloads auf `eine Entscheidung beantwortet` zurück.

## Scope

- Mystery-Box-Aktivierung und Mystery-Box-Choice in der Web-Chronik reproduzieren.
- `hiddenZoneAction: "p3_38_look_top_stack_show_to_corp_then_install_matching"` explizit formatieren.
- Erfolgsfall konkret darstellen:
  - Quelle `Mystery Box`,
  - Top-5-Stackkarten wurden der Korp gezeigt,
  - ausgewähltes Programm,
  - Installation im Rig ohne Kosten,
  - `Mystery Box` wurde getrasht,
  - Stack wurde gemischt.
- No-Program-Fall konkret darstellen: Top-5-Karten gezeigt, kein Programm installiert, `Mystery Box` bleibt installiert, Stack wurde gemischt.
- Den Chronik-Eintrag während eines laufenden Runs auf R&D unter der Run-Gruppe halten und nicht als randständigen Zug-/Neutral-Eintrag ausgeben.
- Die KI-Perspektive korrekt formulieren, z. B. `Die Runner-KI hat <Programmname> mit Mystery Box gewählt und im Rig installiert.`

## Nicht im Scope

- Keine Änderung am eigentlichen Mystery-Box-Reveal-/Ack-Vertrag; das liegt im blockierenden Paket `act-2026-06-01-mystery-box-corp-review-gate`.
- Keine allgemeine Neufassung aller `resolve_choice`-Fallbacks.
- Keine Änderung an Karteneffekt, Stack-Reihenfolge, Shuffle, Installation, MU oder Kosten.
- Keine Anzeige nicht gezeigter Stack-Karten und keine neuen Hidden-Info-Daten in Chronik, PublicEvents, Replay oder KI-Inputs.

## Akzeptanzkriterien

- [x] Die Mystery-Box-Programmauswahl rendert nicht mehr als `Die Runner KI hat eine Entscheidung beantwortet.`
- [x] Bei erfolgreicher Installation nennt die Chronik das gewählte Programm und die Installation im Rig.
- [x] Die Meldung enthält side-sichere Hinweise auf Korp-Reveal, Source-Trash und Stack-Shuffle.
- [x] Bei No-Program-Fall erscheint eine konkrete Meldung ohne generischen Choice-Fallback.
- [x] Der Mystery-Box-Choice-Eintrag bleibt während eines Runs auf R&D in der Run-Gruppe beziehungsweise Run-Einrückung.
- [x] Existing-Chroniktests für generische Fallbacks bleiben erhalten; nur Mystery-Box-spezifische Payloads werden konkret formatiert.
- [x] Fokussierte Web-Tests decken Runner-KI-Programmauswahl und No-Program-Fall ab.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/chronicle.ts`
  - `apps/web/app/chronicle.test.ts`
- Für die konkrete Textbildung können die SMC-Zweige `self_modifying_code_install_program` und `self_modifying_code_free_mu` als Muster dienen.
- Prüfen, ob die aufgelöste Choice-Payload aktuell genug Daten enthält. Falls `installedProgramDefinitionId` nur im Engine-Event, aber nicht in der Web-Projektion ankommt, muss das blockierende Reveal-/Ack-Paket die side-sichere Payload-Ergänzung mitliefern.
- Run-Gruppierung nicht über Text-Heuristiken erzwingen, wenn ein vorhandenes Run-Kontextfeld oder Eventkontext genutzt werden kann.

## Ergebnisnotiz

Umgesetzt: Die Web-Chronik formatiert `p3_38_look_top_stack_show_to_corp_then_install_matching` jetzt Mystery-Box-spezifisch. Die Runner-KI-Programmauswahl nennt das installierte Programm, Installation im Rig, Korp-Reveal, Source-Trash und Stack-Shuffle. Der No-Program-Pfad zeigt eine konkrete Korp-Bestätigung mit Korp-Reveal, weiterhin installierter `Mystery Box` und Stack-Shuffle statt des generischen Choice-Fallbacks. Beide Mystery-Box-Choice-Einträge werden als `run` kategorisiert und bleiben damit während eines aktiven Runs in der Run-Gruppe.

Ergänzt wurde außerdem ein side-sicherer finaler Engine-Payload für den p3_38-Mystery-Box-Install-Choice (`revealCount`, gezeigte Definitionen, `installedProgramDefinitionId`), damit die Chronik ohne Textheuristik formatieren kann.

Checks: fokussierte Engine-, Web- und Server-Regressionen sowie `@netgrid/web` typecheck und `git diff --check` bestanden. `corepack pnpm --filter @netgrid/engine typecheck` wurde ausgeführt und scheitert weiterhin an einem bestehenden, nicht paketbezogenen Fixture-Typfehler in `packages/engine/src/game/card-implementation/trace-runtime-deps.test.ts` (`addHackerTrackerTraceCounters`/`resolveTraceTrashRunnerResourceSuccess` fehlen im Test-Stub).
