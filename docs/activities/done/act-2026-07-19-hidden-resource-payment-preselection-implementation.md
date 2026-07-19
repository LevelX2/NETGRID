---
activityId: act-2026-07-19-hidden-resource-payment-preselection-implementation
status: done
kind: implementation
area: shared
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt: 2026-07-19
completedAt: 2026-07-19
branch: codex/hidden-bank-continuation-ui
releaseTarget:
blockedBy:
  - act-2026-07-19-hidden-resource-next-payment-preselection
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/game/view/card-view.ts
  - packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts
  - apps/web/app/hidden-resource-payment-preselection.ts
  - apps/web/app/hidden-resource-payment-preselection.test.ts
  - apps/web/app/page.tsx
  - apps/web/features/cards/CardView.tsx
  - apps/web/features/game-board/ActiveRunnerZoneBoard.tsx
  - apps/web/app/globals.css
  - docs/architecture/ui/hidden-resource-next-payment-preselection-concept-2026-07-19.md
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/hidden-resource-payment-preselection.test.ts app/action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Hidden-Resource-Zahlungsfähigkeit sicher vormerken

## Ziel

Den freigegebenen ersten Umsetzungsschnitt für
`Für die nächste passende Zahlung vormerken` realisieren. Der Runner wählt an
einer eigenen Hidden Resource eine konkrete Zahlungsfähigkeit vor; der Client
reicht sie beim nächsten passenden Payment-Support-Fenster genau einmal und nur
auf Basis einer exakt passenden aktuellen Engine-`LegalAction` ein.

## Kontext und Quellen

- Konzept:
  `docs/architecture/ui/hidden-resource-next-payment-preselection-concept-2026-07-19.md`.
- Das bestehende `runner_cost_penalty_support`-Fenster und `applyAction` bleiben
  alleinige Regelautorität.
- `Chiba Bank Account` besitzt eine eindeutige Fähigkeit; `Swiss Bank Account`
  benötigt eine Auswahl nach Karteninstanz und Ability-Index.
- Die zentrale Fortsetzungsaktion wurde mit
  `act-2026-07-19-hidden-bank-continuation-central-action` sichtbar gemacht und
  kann nach automatischer Support-Nutzung anhand frischer `LegalActions`
  eindeutig fortgesetzt werden.

## Scope

- Einen engine-erzeugten, ausschließlich in der eigenen Runner-Ansicht
  sichtbaren Deskriptor für vormerkbare
  `runner_cost_penalty_support`-Fähigkeiten bereitstellen.
- Im Webclient je konkrete Fähigkeit einen verständlichen Vormerkungsmarker
  anzeigen; höchstens eine Vormerkung pro Match und Runner zulassen.
- Beim echten Support-Fenster nur bei exakt einem Treffer nach Quelle,
  Ability-Index, Timing und Window-ID die aktuelle LegalAction über den normalen
  Submit-Pfad genau einmal einreichen.
- Nach bestätigter Support-Nutzung nur bei exakt einer frischen LegalAction mit
  ursprünglicher Action-ID und derselben Window-ID die Zahlung automatisch
  fortsetzen.
- Bei fehlender oder mehrdeutiger LegalAction sicher auf das zentrale Fenster
  zurückfallen und die Vormerkung mit lokalem Hinweis entfernen.
- Vormerkung bei Nutzung, Ablehnung, Fortsetzen ohne Support, Quellenverlust,
  Run-/Zugende, Undo sowie Match-/Seitenwechsel konservativ bereinigen.
- Chiba, beide Swiss-Fähigkeiten, Deduplizierung, stale State und
  Hidden-Info-Grenzen testen.

## Nicht im Scope

- Keine PlayerAction aus Kartentext oder UI-Hardcodes erzeugen.
- Keine private Absicht im autoritativen GameState, StateHash oder Replay.
- Keine geräte- oder browserübergreifende Synchronisierung.
- Keine KI-Sonderbehandlung und kein UI-Redesign außerhalb der
  Resource-Fähigkeitssteuerung.

## Akzeptanzkriterien

- [x] Nur der Runner-Eigentümer erhält Deskriptoren seiner vormerkbaren Hidden-
      Resource-Fähigkeiten; Korp-Ansicht und öffentliche Verträge leaken nichts.
- [x] Chiba kann eindeutig markiert und beim nächsten passenden
      Zahlungsfenster über genau eine aktuelle LegalAction aktiviert werden.
- [x] Bei Swiss sind Karteninstanz und eine der beiden Fähigkeiten eindeutig
      auswählbar; ein pauschales Karten-Häkchen existiert nicht.
- [x] Rerender oder erneut empfangene Ansicht übermitteln dieselbe Support-
      LegalAction nicht doppelt.
- [x] Fehlende, mehrdeutige, stale oder abgelehnte Treffer führen ohne
      Regelaktion in das sichtbare zentrale Zahlungsfenster zurück.
- [x] Nach automatischer Support-Aktivierung wird ausschließlich eine exakt
      passende, frische Fortsetzungs-LegalAction automatisch eingereicht; andernfalls
      bleibt das zentrale Zahlungsfenster sichtbar.
- [x] Lebenszyklus-Bereinigung und Hidden-Info-Grenzen sind durch paketnahe
      Tests abgesichert.
- [x] Engine-/Web-Typechecks, fokussierte Tests und `git diff --check` sind grün.

## Ergebnisnotiz

Die private Runner-PlayerView enthält nun ausschließlich an den eigenen
installierten Hidden Resources engine-abgeleitete Deskriptoren je
Payment-Support-Fähigkeit. Chiba erhält einen Marker, Swiss zwei getrennte
Marker nach Ability-Index. In der Korp-Ansicht bleiben die Karten verdeckt und
die Deskriptoren vollständig aus.

Der Client hält nur eine lokale Vormerkung und reicht im echten Zahlungsfenster
genau eine aktuelle LegalAction mit passender Karteninstanz, Ability-Index,
Timing und Window-ID ein. Match-, Window- und Action-ID bilden den
Deduplizierungsschlüssel. Fehlende oder mehrdeutige Treffer, Quellenverlust,
Run-/Zugende, Matchwechsel und Undo löschen die Absicht konservativ. Manuelle
Support- oder Fortsetzungsentscheidungen löschen sie ebenfalls. Nach einer
automatischen Bankaktivierung wartet der Client auf die bestätigte höhere
StateVersion. Eine exakt zur ursprünglichen Aktion und Window-ID gehörende
Fortsetzungs-LegalAction reicht er automatisch ein; stale, fehlende oder
mehrdeutige Folgezustände fallen auf das sichtbare zentrale Zahlungsfenster
zurück. Die Chronik unterdrückt dabei den redundanten generischen verdeckten
Credit-Effekt und ordnet die konkrete Banknutzung dem aktiven Run zu.
