---
activityId: act-2026-05-24-proteus-phase-9c-hidden-zone-search-install-tutor
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
releaseTarget: Proteus Phase 9c
proReferences:
  - PRO036
blockedBy:
  - grip_install_temporary_credit_choice_contract
  - search_install_run_followup_return_or_penalty_contract
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-9c-hidden-zone-search-install-tutor.md
  - docs/releases/proteus/README.md
  - docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
checks:
  - rg Hijack/Test Spin in Proteus cards and Hidden-Zone search/install engine paths
  - rg search_stack_install/choose_stack_or_trash_program_install/runTemporaryCredits/returnInstalledCardToGripAtEndOfTurn in engine
  - git diff --check
---

# Proteus Phase 9c: Hidden-Zone Search/Install/Tutor

## Ziel

`Hijack` und `Test Spin` mit side-privater Hidden-Zone-Suche, deterministischem Shuffle/Reorder und redigierten PublicEvents umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9c Hidden-Zone Search/Install/Tutor`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.
- V1.9.11 Hidden-Zone-Search-/Reveal-/Reorder-/Shuffle-Artefakte.

## Zielkarten

- `onr_proteus_110_hijack` Hijack
- `onr_proteus_126_test-spin` Test Spin

## Scope

- Side-private Kandidatenlisten und Choices.
- Install-/Tutor-Folgeaktionen mit `applyAction`-Revalidierung.
- Deterministisches Shuffle/Reorder ohne PublicEvent-Leaks.

## Nicht im Scope

- Keine Random/Dice-Karten aus 9a.
- Keine Action-Economy aus 9b.
- Keine Umsetzung von `Ice and Data Special Report` ohne Regelklärung.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Hidden-Zone-Kandidaten sind nur für die berechtigte Seite sichtbar.
- [ ] PublicPayload, PlayerView, Reconnect, Undo-Preview und Replay leaken keine privaten Kandidaten oder Reihenfolgen.
- [ ] LegalAction-Projektion und Revalidierung decken Seite, Timing, Kosten, Ziele und Choices ab.
- [ ] Hidden-Info-, wrong-side-, stale-action-, Shuffle-/Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Blocker

Der Slice ist ohne neue generische Install-/Followup-Verträge nicht vollständig umsetzbar:

- `Hijack` ist fachlich keine Stack-Search-Karte. Die Karte installiert ein Programm oder eine Hardware aus der Grip und stellt genau 3 temporäre Credits bereit, die ausschließlich für diese Installationskosten verwendet werden dürfen. Die vorhandenen Hidden-Zone-Search-Bausteine decken Stack/Heap-Suche und Programminstallationen ab, aber kein Program-oder-Hardware-Installationschoice aus Grip mit temporärem Install-Credit-Pool und Rückgabe ungenutzter Credits.
- `Test Spin` kann den vorhandenen `search_stack_install`-Pfad nur teilweise nutzen: Die Karte sucht ein Programm im Stack, installiert es kostenlos, shufflet den Stack, startet danach einen Run und verlangt nach dem Run entweder das Zurückmischen des Programms in den Stack oder, wenn es nicht mehr im Spiel ist, einen Verlust von `4 + Installationskosten` mit Meat-Damage für den nicht bezahlbaren Rest. Der vorhandene `Sneak Preview`-Pfad kann ein Programm temporär kostenlos installieren und am Ende des Zuges in die Grip zurücknehmen; er bildet weder den verpflichtenden Run-Followup noch die Stack-Rückmischung oder den Verlust-/Damage-Penalty ab.

Es wurden bewusst keine Teil-CardImplementations promotet. Der nächste unblockende Schritt ist ein enger Vertrag für Event-gebundene Installationschoices aus Grip/Stack mit temporären Install-Credits, Run-Followup-State und deterministischem Return-or-Penalty-Cleanup.

## Ergebnisnotiz

Blockiert dokumentiert. Keine Runtime-Änderung, keine Manifest-Promotion und keine Deck-/AI-Freigabe.
