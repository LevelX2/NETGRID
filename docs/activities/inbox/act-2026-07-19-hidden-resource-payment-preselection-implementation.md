---
activityId: act-2026-07-19-hidden-resource-payment-preselection-implementation
status: inbox
kind: implementation
area: shared
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-07-19-hidden-resource-next-payment-preselection
resultArtifacts: []
checks: []
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
  bleibt nach automatischer Support-Nutzung manuell.

## Scope

- Einen engine-erzeugten, ausschließlich in der eigenen Runner-Ansicht
  sichtbaren Deskriptor für vormerkbare
  `runner_cost_penalty_support`-Fähigkeiten bereitstellen.
- Im Webclient je konkrete Fähigkeit einen verständlichen Vormerkungsmarker
  anzeigen; höchstens eine Vormerkung pro Match und Runner zulassen.
- Beim echten Support-Fenster nur bei exakt einem Treffer nach Quelle,
  Ability-Index, Timing und Window-ID die aktuelle LegalAction über den normalen
  Submit-Pfad genau einmal einreichen.
- Bei fehlender oder mehrdeutiger LegalAction sicher auf das zentrale Fenster
  zurückfallen und die Vormerkung mit lokalem Hinweis entfernen.
- Vormerkung bei Nutzung, Ablehnung, Fortsetzen ohne Support, Quellenverlust,
  Run-/Zugende, Undo sowie Match-/Seitenwechsel konservativ bereinigen.
- Chiba, beide Swiss-Fähigkeiten, Deduplizierung, stale State und
  Hidden-Info-Grenzen testen.

## Nicht im Scope

- Keine PlayerAction aus Kartentext oder UI-Hardcodes erzeugen.
- Keine private Absicht im autoritativen GameState, StateHash oder Replay.
- Kein automatisches Fortsetzen der ursprünglichen Zahlung nach der
  Bankaktivierung.
- Keine geräte- oder browserübergreifende Synchronisierung.
- Keine KI-Sonderbehandlung und kein UI-Redesign außerhalb der
  Resource-Fähigkeitssteuerung.

## Akzeptanzkriterien

- [ ] Nur der Runner-Eigentümer erhält Deskriptoren seiner vormerkbaren Hidden-
  Resource-Fähigkeiten; Korp-Ansicht und öffentliche Verträge leaken nichts.
- [ ] Chiba kann eindeutig markiert und beim nächsten passenden
  Zahlungsfenster über genau eine aktuelle LegalAction aktiviert werden.
- [ ] Bei Swiss sind Karteninstanz und eine der beiden Fähigkeiten eindeutig
  auswählbar; ein pauschales Karten-Häkchen existiert nicht.
- [ ] Rerender oder erneut empfangene Ansicht übermitteln dieselbe Support-
  LegalAction nicht doppelt.
- [ ] Fehlende, mehrdeutige, stale oder abgelehnte Treffer führen ohne
  Regelaktion in das sichtbare zentrale Zahlungsfenster zurück.
- [ ] Nach automatischer Support-Aktivierung bleibt die Fortsetzung der
  ursprünglichen Zahlung eine getrennte manuelle Entscheidung.
- [ ] Lebenszyklus-Bereinigung und Hidden-Info-Grenzen sind durch paketnahe
  Tests abgesichert.
- [ ] Engine-/Web-Typechecks, fokussierte Tests und `git diff --check` sind grün.

## Ergebnisnotiz

Noch offen.
