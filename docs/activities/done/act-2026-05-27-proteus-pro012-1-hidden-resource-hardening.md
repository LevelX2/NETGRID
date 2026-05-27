---
activityId: act-2026-05-27-proteus-pro012-1-hidden-resource-hardening
status: done
created: 2026-05-27
completed: 2026-05-27
releaseTarget: Proteus PRO012-1
tags:
  - proteus
  - PRO012-1
  - hardening
  - hidden-runner-resources
  - tests
---

# Proteus PRO012-1: Hidden Resource Hardening

## Ergebnis

PRO012-1 ist als reine Test- und Resolve-Härtung für den bereits umgesetzten PRO012-Scope erledigt. Es wurde keine neue Proteus-Karte implementiert oder freigeschaltet; Harness-Ziel bleibt 154 Proteus-Karten, 113 implementiert, 41 fehlend, 0 Drift.

## Mercenary Subcontract

NETGRID modelliert Access aktuell sequenziell über genau eine aktuelle Zugriffskarte in `run.accessedCardId`. Auch bei Multiaccess wird die Queue Karte für Karte abgearbeitet. Mercenary Subcontract wird daher für die jeweils aktuelle Zugriffskarte angeboten; der Kartentext `one or more cards that you are currently accessing` wird im aktuellen Engine-Modell als wiederholbares Current-Access-Fenster pro zugreifbarer Karte interpretiert. Da Mercenary tappt, ist faktisch eine Aktivierung pro ungetappter Quelle möglich.

Der Resolve-Pfad für `hidden_resource_current_access_free_trash` revalidiert jetzt Quelle, Runner-Resource-Installation, Controller, Tap-Zustand, Ability-Kind, Kostenprofil, Zahlbarkeit, kostenloses Trash-Override, aktuelle `run.accessedCardId` und Agenda-Ausschluss. Die `[4]`-Kosten werden im Resolve-Pfad eingezogen; normalerweise nicht trashbare Nicht-Agendas bleiben als Current-Access-Ziel erlaubt.

## Testnachweis

Ergänzt wurden konkrete Verhaltenstests für:

- `Bolt-Hole`: Meat-only-Fenster, maximal 2 Prevention, Reveal/Tap, Corp-View-Redaction, Replay/StateHash.
- `Expendable Family Member`: 1-Credit-plus-Tap-Kosten, Reveal/Tap, Credit-Revalidierung, Corp-View-Redaction.
- `Back Door to Netwatch`: direkter PendingChoice-Test bleibt plus zusätzlicher Trace-Orchestration-Test über echten erfolgreichen Trace-Result, der `trace_success_cancel` öffnet.
- `Credit Subversion`: HQ-only, erfolgreicher Run vor Access, bis zu 3 Creditverlust, Reveal/Tap, falscher Server abgelehnt.
- `Death from Above`: Remote-only, erfolgreicher Run vor Access, Root- und ICE-Trash nach Archives faceup, Reveal/Tap.
- `Mercenary Subcontract`: `[4]` plus Tap, Current-Access-Trash für normalerweise nicht trashbare Nicht-Agenda, Agenda-Ausschluss und Resolve-Revalidierung.

## Grenzen

Wired Switchboard bleibt über den generischen Trace-Post-Bid-Link-Pfad und den neuen Trace-Orchestration-Window-Test mitabgedeckt; die bestehende once-per-trace/source- und Tap-Revalidierung liegt im gemeinsamen Trace-Resolver. PRO012-1 ändert keine Manifest-Freigaben, keine Decklegalität, keine Formatlegalität und keine AI-Unterstützung.

## Checks

- `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/access/access-flow.test.ts src/game/trace/trace-orchestration.test.ts`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/damage/prevention.test.ts src/game/run/successful-run-interventions.test.ts src/game/trace/trace-flow.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`
- `rg -n "PRO012-1|PROO12|PROD012|PRO 012|onr_proteus_129|onr_proteus_132|onr_proteus_136|onr_proteus_137|onr_proteus_140|onr_proteus_141|onr_proteus_145|onr_proteus_154" packages docs data KI-Wissen-NETGRID -S`
