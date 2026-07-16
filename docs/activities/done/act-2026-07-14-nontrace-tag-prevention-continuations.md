---
activityId: act-2026-07-14-nontrace-tag-prevention-continuations
status: done
kind: fix
area: engine
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-14
startedAt: 2026-07-16
completedAt: 2026-07-16
branch: codex/activities-worktree-20260716-counter-cleanup
releaseTarget: Current private playtest
blockedBy:
  - act-2026-07-14-trace-tag-prevention-avoidance-hardening
resultArtifacts:
  - docs/reviews/engine/nontrace-tag-prevention-continuations-2026-07-16.md
  - packages/engine/src/game/damage/direct-tag-write-boundary.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts app/card-choice-panel.test.ts app/run-layering.test.ts features/actions/WindowEventIcon.test.ts
  - git diff --check
---

# Verbleibende Nicht-Trace-Tags mit suspendierbaren Prevention-Continuations härten

## Ziel

Alle noch direkt schreibenden, kartengetriebenen und regeltechnisch
vermeidbaren Nicht-Trace-Tagpfade sollen das gemeinsame
Add-Tag-ImminentEvent-/Avoid-Tag-Modell nutzen, ohne kombinierte Effekte,
Turn-Start-Abläufe, Access-Sequenzen oder Run-Ende doppelt beziehungsweise in
falscher Reihenfolge aufzulösen.

## Kontext und Quellen

- Der Audit
  `docs/reviews/engine/trace-tag-prevention-avoidance-hardening-2026-07-14.md`
  hat Trace-Tags und gedruckte Tag-ICE-Subroutinen geschlossen.
- Direkte aktive Einstiege verbleiben unter anderem in
  `access-effect-handlers.ts`, `effect-runtime-helpers.ts`,
  `card-lifecycle-runtime-hosts.ts`, `lifecycle-runtime.ts`,
  `fort-run-side-families.ts`, `run-access-transition.ts`,
  `run-end-cleanup.ts`, `state-runtime-resolvers.ts` und
  `turn-runtime-resolvers.ts`.
- Diese Pfade dürfen nicht mechanisch auf eine Funktion mit `pendingChoice`
  umgestellt werden: Mehrere führen danach noch weitere Effekte aus oder
  befinden sich in automatischen Lifecycle-Schleifen.

## Scope

- Jede verbleibende direkte Erhöhung von `runner.tags` klassifizieren als
  vermeidbar, ausdrücklich unvermeidbar, finale gemeinsame Resolver-Anwendung
  oder Test-only.
- Für vermeidbare kartengetriebene Einstiege einen neutralen suspendierbaren
  Continuation-Vertrag ergänzen.
- Kombinierte Tag-plus-Damage-/Trash-/Credit-/Draw-Effekte in gedruckter
  Reihenfolge genau einmal auflösen.
- Turn-Start-, Run-Success-, Run-End- und Access-Fortsetzungen nach Avoid oder
  Pass deterministisch fortsetzen.
- Wrong-side, stale Choice, Kosten-/Source-Drift, Hidden Info, Replay und
  StateHash je betroffener Pfadfamilie regressiv sichern.
- Direkte Tag-Schreibstellen nach der Migration mit einem Boundary-Gate auf
  die ausdrücklich erlaubten Resolver-/Teststellen begrenzen.

## Nicht im Scope

- Keine Änderung gedruckter Kartentexte oder unvermeidbarer Effekte.
- Keine UI-Regelautorität; die UI zeigt ausschließlich Engine-Choices.
- Keine gleichzeitige Neufassung von Damage-, Run-, Access- oder
  Lifecycle-Architektur außerhalb der notwendigen Continuation-Schnittstellen.

## Akzeptanzkriterien

- [x] Jede produktive direkte Erhöhung von `runner.tags` ist klassifiziert und
      entweder gemeinsam geroutet oder ausdrücklich als unvermeidbare finale
      Anwendung begründet.
- [x] Access-Ambush-, CardEffect-, Lifecycle-, Start-of-turn-, Run-Success-
      und Run-End-Tagpfade können bei legaler Source pausieren und nach Avoid
      oder Pass genau einmal weiterlaufen.
- [x] Kombinierte Effekte halten ihre gedruckte Reihenfolge und wenden keine
      Folgekomponente vorzeitig oder doppelt an.
- [x] Alle sieben Avoid-Tag-Sources funktionieren auch in den jeweils
      passenden Nicht-Trace-Pfadfamilien mit Kosten- und Source-Revalidation.
- [x] PlayerViews und PublicEvents leaken keine verdeckte Source oder Choice.
- [x] Replay und StateHash stimmen in mindestens einem positiven und einem
      Pass-Fall je Continuation-Familie.
- [x] Ein Boundary-Gate verhindert neue unklassifizierte direkte
      `runner.tags +=`-Schreibstellen.
- [x] Fokussierte Engine-/Web-Tests, relevante Typechecks und
      `git diff --check` sind grün.

## Umsetzungshinweise

- Zuerst einen kleinen neutralen Continuation-State für Add-Tag-Fenster
  definieren; nicht pro Karte eigene Pending-Felder anlegen.
- Ein geöffnetes Choice-Fenster muss den aufrufenden Effekt vor weiteren
  Mutationen anhalten und nach Choice-Auflösung am exakten Folgeschritt
  fortsetzen.
- `damage-core.ts` bleibt die einzige Stelle, die ein bereits entschiedenes
  Add-Tag-ImminentEvent final auf `runner.tags` anwendet.

## Ergebnisnotiz

Der neutrale `pendingAddTagContinuation`-Vertrag pausiert Access-,
CardEffect-, Draw-/Lifecycle-, Start-of-turn-, Successful-Run-, Run-End-,
End-turn- und terminale Tagpfade am gemeinsamen Add-Tag-ImminentEvent. Avoid
und Pass setzen den jeweiligen Ablauf am exakten Folgeschritt fort; kombinierte
Credit-, Draw-, Damage-, Trash-, Bad-Publicity- und Turn-Abschluss-Effekte
werden nicht vorzeitig oder doppelt angewendet.

Alle sieben öffentlichen Avoid-Tag-Quellen sind auf einem Nicht-Trace-
Accesspfad einschließlich Kosten und Source-Drift geprüft. Direkte produktive
Tag-Erhöhungen bleiben nur in den zwei finalen `damage-core.ts`-Resolvern; der
LegalAction-lose `EffectCommand` `add_tag` wurde entfernt. Die vollständige
Engine-Suite ist mit 187 Testdateien und 1700 Tests grün; Shared-, Engine- und
Web-Typechecks, 144 fokussierte Web-Tests sowie `git diff --check` sind grün.
