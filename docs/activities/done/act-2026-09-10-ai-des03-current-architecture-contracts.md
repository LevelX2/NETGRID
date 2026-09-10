---
activityId: act-2026-09-10-ai-des03-current-architecture-contracts
status: done
kind: documentation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-10
startedAt: 2026-09-10
completedAt: 2026-09-10
branch: codex/ai-des03-current-architecture-contracts
owner: 01a08be8-5094-7bd2-986b-f072d5073e01
resultArtifacts:
  - docs/architecture/ai/README.md
  - docs/architecture/ai/target-architecture.md
  - docs/architecture/ai/change-compass.md
  - docs/architecture/ai/planning-architecture.md
  - docs/architecture/ai/turn-campaign-planner.md
  - docs/architecture/ai/runner-plan-contracts.md
  - docs/architecture/ai/corp-plan-contracts.md
  - docs/architecture/ai/hint-architecture.md
  - docs/architecture/ai/decision-trace-contract.md
  - packages/ai/AGENTS.md
checks:
  - 227 lokale Links und Anker einschließlich sechs eingehender Verweise geprüft
  - 25 dokumentierte Owner gegen beide Coverage-Register und Factory-Symbole geprüft
  - DES-02-Faktenblöcke unverändert erhalten
  - Prettier-Prüfung der zwölf betroffenen Dokumente bestanden
  - git diff --check bestanden
  - Keine Änderungen in produktivem Code, Tests, Daten oder Scripts
---

# DES-03: Aktuelle Architekturverträge konsolidieren

## Ziel und Quelle

Einzelauftrag des Nutzers zum Designreview vom 2026-09-10, DES-03:
Aktuelle AI-Verträge, ihre Implementierungen und offene Anforderungen sind
direkt auffindbar; jede zentrale Regel besitzt eine maßgebliche Definition.

## Scope

- README als aktuelle Aufruf- und Ownerkarte mit Code-/Vertragslinks.
- Eindeutige Rollen für Zielbild, Änderungskompass, gemeinsamen Planvertrag,
  Zug-/Kampagnendetails und fachliche Ownerverträge.
- Konzeptionelle Fähigkeiten auf tatsächliche Symbole abbilden.
- Historische Umsetzungsschritte und normative Verweise auf entfernte
  Quellen bereinigen; aktuelle fachliche Anforderungen erhalten.

## Nicht im Scope

- Weitere Designreview-Punkte, produktiver Code, Spielstärke, Gewichtung,
  neue Frameworkfunktionen oder Behebung bekannter Testfehler.

## Akzeptanzkriterien

- [x] Aktueller Entscheidungspfad und registrierte Owner sind mit Code verknüpft.
- [x] Gemeinsame Regeln haben eine maßgebliche Stelle; andere Quellen verweisen darauf.
- [x] Ist-Verträge, konzeptionelle Erläuterungen und offene Fähigkeiten sind unterscheidbar.
- [x] Fachwissen einschließlich DES-02 bleibt erhalten; Historie liegt in Git.
- [x] Betroffene lokale Links/Anker und Codeverweise sind geprüft; git diff --check besteht.

## Ergebnisnotiz

Umgesetzt auf Basis von 512a06683: README als maßgebliche Navigations- und
Pflegematrix, getrennte aktuelle Ownerverträge, reale dreiteilige PlanModule-API
mit Zuordnung konzeptioneller Fähigkeiten, aktuelle Such-/Commitment-Quellen
und generierter CardSpec-Hintpfad. Abgeschlossene Cutover-/Paketabläufe,
Versionschroniken und entfernte normative Reviewverweise sind bereinigt.
Die Dokumentation hält ausdrücklich fest, dass die generische Restzugsuche
auch P4 bis P6 zunächst nach Klassenrang und danach nach registrierten Werten
vergleicht. Die frühere weitergehende konzeptionelle Beschreibung ist keine
heimliche Verhaltensfreigabe. Opening-Module, stärkere State-Typbindung und
begrenzte Domainfähigkeiten bleiben sichtbar offen.

Zielbild, Planvertrag, Kompass und deren Fach-/Detailverweise wurden gemeinsam
geprüft und angepasst. Die aktuelle Trace-Datenklasse bleibt maßgeblich;
Verweise auf entfernte historische Sicherheitsdokumente sind ersetzt.
Fachliche Ownerabsätze wurden gegen den Ausgangstext geprüft, einschließlich
Counterbank-/Bluffbindung, Runrisikofortsetzung und kostenloser Scorekosten.
Status, Deckreferenz und AI-Preflight zeigen auf die neuen Fachstellen.

Keine AI-Shards, Typechecks, Builds oder Verhaltenstests: Der Diff ändert
ausschließlich Dokumentation und ihre Leseanweisung. Keine anderen
DES-Punkte umgesetzt. Die bestehenden unabhängigen Testfehler waren nicht
Gegenstand dieses Pakets. Dauerhafte Ergebnisse liegen in den genannten
Verträgen; dieses Paket besitzt nach Abschluss keine Retention-Funktion.
