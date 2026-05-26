---
activityId: act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break
status: blocked
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 5a
proReferences:
  - PRO004
  - PRO011
  - PRO012
blockedBy:
  - icebreaker_install_choice_state
  - stateful_breaker_subtype_choice
  - bulldozer_next_sentry_followup
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-5a-icebreaker-core-matchers-pump-break.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_079|onr_proteus_080|onr_proteus_081|onr_proteus_082|onr_proteus_083|onr_proteus_088|onr_proteus_091|onr_proteus_092|onr_proteus_093|onr_proteus_095|onr_proteus_100\" data/cards/proteus-cards.json data/manifests/proteus-card-support.json docs/releases/proteus -S"
  - "rg -n \"onSuccessfulBreak|lose_bits_from_stealth_sources|remainderStrengthBonusByBreaker|CardIcebreakerBreakSpecialImplementation|icebreakerAbilities\" packages/engine/src -S"
  - "git diff --check"
---

# Proteus Phase 5a: Icebreaker Core Matchers/Pump/Break

## Ziel

Die sichtbaren Proteus-Icebreaker als eigene CardImplementation-Dateien über deklarative Icebreaker-Profile, generische Matcher und bestehende Pump-/Break-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5a Icebreaker Core Matchers/Pump/Break`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/architecture/ability-engine/card-implementation-v1-pattern-catalog.md`.
- Bestehende Icebreaker-Implementierungen unter `packages/engine/src/card-implementations/`.

## Zielkarten

- `onr_proteus_079_big-frackin-gun` Big Frackin' Gun
- `onr_proteus_080_black-widow` Black Widow
- `onr_proteus_081_boring-bit` Boring Bit
- `onr_proteus_082_bulldozer` Bulldozer
- `onr_proteus_083_corrosion` Corrosion
- `onr_proteus_088_fubar` Fubar
- `onr_proteus_091_lockjaw` Lockjaw
- `onr_proteus_092_morphing-tool` Morphing Tool
- `onr_proteus_093_redecorator` Redecorator
- `onr_proteus_095_skeleton-passkeys` Skeleton Passkeys
- `onr_proteus_100_wrecking-ball` Wrecking Ball

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Bestehende `icebreakerAbilities`-, Pump- und Break-Muster wiederverwenden.
- Neue Subroutine-/Subtype-Matcher nur generisch und kartenunabhängig ergänzen.
- Effektive Stärke, Timing, Kosten, Ziele und Illegal-Pump-Guards in LegalAction-Projektion und `applyAction` revalidieren.

## Nicht im Scope

- Keine installierten Breaker-Support-Modifier aus Phase 5e.
- Keine Hidden Runner Resources.
- Keine AI-Hints, Decklegalität oder UI-Regelautorität.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Alle Pump-/Break-Actions werden aus frischen LegalActions projiziert und in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel- und Strength-/Subtype-/Subroutine-Matcher-Tests sind vorhanden.
- [ ] Replay-/StateHash-Stabilität und Registry-/Coverage-/Manifest-Nachweis sind erbracht.

## Ergebnisnotiz

Teilweise umgesetzt: PRO004 ist abgeschlossen; der übergreifende Phase-5a-Slice bleibt wegen PRO011/PRO012 blockiert.

PRO004 hat die einfachen Zielkarten `Big Frackin' Gun`, `Boring Bit`, `Corrosion`, `Redecorator`, `Skeleton Passkeys` und `Wrecking Ball` als konkrete CardImplementation-Dateien mit generischen `icebreakerAbilities` umgesetzt. Keine dieser Karten ist decklegal, formatlegal oder AI-unterstützt.

Die einfachen Zielkarten `Big Frackin' Gun`, `Boring Bit`, `Corrosion`, `Redecorator`, `Skeleton Passkeys` und `Wrecking Ball` sind voraussichtlich mit vorhandenen `icebreakerAbilities`-Profilen, `count` und Stealth-Loss-Seiteneffekten umsetzbar. Der vollständige Slice enthält aber mehrere Karten, für die der aktuelle generische Breaker-Baustein nicht ausreicht:

- `Black Widow` braucht beim Installieren eine Runner-Choice für ein installiertes ICE und einen source-bound +5-Stärke-Modifikator nur während Encounters mit genau diesem ICE. Ein generischer Install-Choice-/Target-State für Runner-Programme existiert dafür noch nicht.
- `Fubar` braucht eine einmalige, zustandsbehaftete Wahl, ob das Programm Code Gates, Sentries oder Walls bricht. Diese Wahl muss in Break-Actions und `applyAction` revalidiert werden; der aktuelle Breaker-Matcher ist statisch.
- `Morphing Tool` braucht dieselbe Breaker-Typ-State-Maschine zusätzlich mit Install-Initialwahl und späterer `[1], A`-Neuwahl.
- `Bulldozer` kann Stealth-Loss bereits teilweise über bestehende Break-Side-Effects abbilden, braucht aber zusätzlich den Folgeeffekt: Wenn alle Subroutinen einer Wall mit Bulldozer gebrochen wurden, wird beim nächsten Sentry in diesem Run eine Subroutine kostenlos gebrochen. Dafür fehlt ein generischer rungebundener Break-Followup-Flag.
- `Lockjaw` ist laut Kartentext kein Icebreaker-Core-Matcher, sondern ein Encounter-Supportprogramm: `[T]` gibt einem eigenen Icebreaker +2 Stärke für den Rest des Runs. Das passt fachlich eher zu Phase 5e Breaker-Support/Modifier und nicht zu 5a Core Matchers.

Die übrigen Karten dieses Phase-5a-Slices bleiben außerhalb von PRO004:

- `Black Widow`, `Fubar` und `Morphing Tool` bleiben PRO011.
- `Bulldozer` und `Lockjaw` bleiben PRO012.
