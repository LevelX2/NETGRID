---
activityId: act-2026-09-16-maintenance-installation-directories
status: inbox
kind: concept
area: web
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-16
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Installations- und Datenverzeichnis in Maintenance anzeigen

## Ziel

Der lokale Betreiber erkennt, wo die aktuell laufende NETGRID-Installation
und ihre Daten liegen. Programmverzeichnis und Datenverzeichnis werden klar
unterschieden.

## Kontext und Quellen

- Nutzerwunsch vom 16.09.2026: Das Installationsverzeichnis soll irgendwo
  erkennbar sein; Kontext ist der Kartenbildimport einer Installerinstallation.
- `docs/architecture/windows/windows-installer-product-contract.md`
- `docs/architecture/card-images/personal-card-image-import.md`
- `apps/web/app/maintenance/page.tsx`
- `apps/windows/Netgrid.RuntimeConfig/Program.cs` (Installationsstatus)
- `packages/card-images/src/paths.ts` (Daten- und Bildpfade)

## Scope

- Kompakter Abschnitt „Installation und Speicherorte“ auf der
  Maintenance-Statusseite mit Programmverzeichnis und aktivem Datenverzeichnis.
- Werte aus dem tatsächlich laufenden Deployment und seiner validierten
  Konfiguration ermitteln; keine Beispielpfade als Ist-Werte verwenden.
- Pfade kopierbar und vollständig lesbar darstellen. In der Bildverwaltung
  reicht ein kompakter Verweis auf diese Speicherortinformationen.
- Installerbetrieb und Repositorybetrieb eindeutig unterscheiden; fehlende
  Informationen sichtbar als nicht verfügbar kennzeichnen.

## Nicht im Scope

- Verzeichnisse verschieben, bearbeiten oder beliebige Dateisystempfade
  auflisten; Konfigurationsdateien, Secrets oder Benutzerdateien ausliefern.
- Browserseitiges Öffnen beliebiger Ordner oder ein neuer Dateimanager.

## Akzeptanzkriterien

- [ ] Programm- und Datenverzeichnis der laufenden Installation sind mit
  verständlichen deutschen Bezeichnungen sichtbar und kopierbar.
- [ ] Benutzerdefinierte Installations-/Datenroots werden korrekt angezeigt;
  Testwerte dürfen nicht durch fest kodierte Standardpfade ersetzt werden.
- [ ] Die Anzeige ist auf die authentifizierte lokale Betreiber-Maintenance
  begrenzt; normale Spieler- und öffentliche APIs erhalten keine Pfade.
- [ ] Der bisherige Vertrag ohne absolute Pfade in Browserpayloads wird für
  genau diese explizit angeforderte Betreiberanzeige dokumentiert präzisiert.
  Upload- und Jobpayloads bleiben bei relativen Einträgen.
- [ ] Fokussierte Tests prüfen Herkunft der Werte und Zugriffsschutz; UI-Texte
  folgen der vorhandenen DE/EN/FR-Lokalisierung.

## Umsetzungshinweise

Vorhandenen authentifizierten Maintenance-Statusvertrag erweitern, keine
zusätzliche öffentliche Diagnosefläche schaffen. Installerstatus muss zur
laufenden Instanz passen; nicht blind eine fremde lokale Installation anzeigen.

## Ergebnisnotiz

Offen; als Umsetzungsvorschlag erfasst, noch keine UI-Änderung.
