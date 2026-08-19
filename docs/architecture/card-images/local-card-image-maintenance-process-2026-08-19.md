# IMG08 – Lokale Kartenbildverwaltung

Status: `in-progress`
Stand: 2026-08-19
Primärer Agent: `release-implementation-agent`
Arbeitsbranch: `codex/img08-local-card-image-management`
Worktree: `C:\Projekte\NETGRID_IMG08_LOCAL_CARD_IMAGE_MANAGEMENT`
Aktives Paket: `IMG08.3`

## Quelle und Zielprüfung

Der Projektbetreiber hat die direkte Umsetzung der zuvor freigegebenen
Backend-Planung mit dem Skill `paketprozess-worktree-goal` beauftragt. IMG01
bis IMG07 stellen bereits den persistenten lokalen Bildspeicher, lokale und
gehärtete HTTPS-Zuordnungsimporte sowie vollständige private Bildpakete für
Originalset, Proteus und Classic bereit.

Die Vorgabe ist für eine automatische Abarbeitung ausreichend präzise. Die
vorhandene Maintenance-Control-Plane ist der verbindliche Betreiberzugang. Die
neue Oberfläche wird ausschließlich lokal angeboten und verwendet nur
verwaltete relative Inbox-Einträge; absolute Dateipfade werden nie an den
Browser ausgeliefert.

## Gesamtziel

IMG08 ergänzt unter `/maintenance/card-images` eine lokale, authentifizierte
und fail-closed arbeitende Kartenbildverwaltung. Der Betreiber kann den
Bildbestand prüfen, Katalogvorlagen erzeugen, lokale oder explizite
HTTPS-Zuordnungen vorprüfen und importieren sowie private Bildpakete prüfen,
bauen und importieren. Die Spielruntime bleibt vollständig netzwerkfrei und
verwendet weiterhin ausschließlich den persistenten lokalen Bildspeicher.

## Annahmen

- Die Bildverwaltung ist nur im Deployment-Profil `local` und nur über eine
  direkte Loopback-Verbindung verfügbar.
- Mapping-Dateien, lokale Quellbilder und Paketverzeichnisse liegen unter einer
  verwalteten, ignorierten Import-Inbox.
- Browserpayloads verwenden ausschließlich sichere relative Inbox-Namen.
- Schreibende Importe und Paket-Builds verlangen eine frische
  Maintenance-Reauthentifizierung.
- Prüfläufe sind ausdrücklich vorbereitend; der Apply-Lauf validiert alle
  Quellen und Bindungen erneut.
- Ein Prozess-lokaler Jobcontroller erlaubt höchstens einen mutierenden
  Kartenbildjob gleichzeitig.

## Nicht-Ziele

- keine Freigabe für normale LAN-Spieler oder die Game Plane;
- keine frei wählbaren absoluten Serverpfade im Browser;
- kein Scraping von Katalog- oder Artikelseiten;
- keine ZIP-, Add-on-EXE- oder Windows-Installer-Erzeugung;
- keine Bildbearbeitung oder manuelle Zuschnittoberfläche;
- keine automatischen oder zeitgesteuerten Remote-Downloads;
- keine Änderung an Engine, GameState, Replay, StateHash, Kartenlegalität oder
  KI.

## Controller-Invarianten

- Genau ein Paket ist aktiv; Pakete werden nicht übersprungen.
- Jeder Dateisystemzugriff bleibt unter einem explizit validierten Root.
- Der lokale Standardimport führt keinen Netzwerkzugriff aus.
- HTTPS ist nur in einem expliziten Modus mit Rechtebestätigung zulässig.
- Import- und Bindungsänderungen bleiben atomar und fail-closed.
- Absolute Pfade und Quell-URLs gelangen nicht in Browser-, PlayerView-,
  Match-, Replay-, Event- oder StateHash-Payloads.
- Private Bilder und Paketausgaben bleiben ignoriert und außerhalb von Git,
  CI und Hauptinstaller.

## Automatische Fehlerbehandlung

- Validierungsfehler werden in stabile strukturierte Fehlercodes übersetzt.
- Ein fehlgeschlagener Job erhält den Zustand `failed`; der nächste Job darf
  erst nach terminalem Abschluss beginnen.
- Teilweise geschriebene ungebundene Inhaltsblobs dürfen keine aktive Bindung
  erzeugen; die atomare Collection-Bindung bleibt das Commit-Gate.
- Unbekannte Inbox-Einträge, Symlink-Ausbrüche und Pfadtraversal werden
  abgelehnt.
- Fehlgeschlagene Paketchecks blockieren Paketimport und Paketbuild.

## Sicherheitsblocker

Die Umsetzung stoppt ohne stillen Fallback, wenn eine der folgenden Grenzen
nicht belastbar durchsetzbar ist:

- sichere kanonische Root-/Inbox-Bindung;
- Loopback- und Local-Profile-Grenze;
- Maintenance-Authentifizierung, CSRF-Schutz oder Reauthentifizierung;
- atomare Bindungsänderung;
- HTTPS-Ziel- und Downloadhärtung;
- Vermeidung absoluter Pfade in Browserpayloads.

Removal Condition: Der betroffene Vertrag ist im verantwortlichen Paket
ursachenorientiert korrigiert und durch einen fokussierten Regressionstest
belegt.

## State Machine

```text
planned -> in-progress -> package-checks -> package-commit -> next-package
next-package -> final-verification -> main-merge -> cleanup -> complete
in-progress|package-checks|final-verification -> blocked
```

Jobzustände:

```text
queued -> running -> succeeded
queued -> running -> failed
```

## Paketfolge

1. `IMG08.1` – Sicherheits- und Backend-Vertrag (`completed`)
2. `IMG08.2` – Import-Inbox und Bestandsübersicht (`completed`)
3. `IMG08.3` – lokale und HTTPS-Importjobs
4. `IMG08.4` – private Bildpaketverwaltung
5. `IMG08.5` – Maintenance-Weboberfläche und Berichte
6. Finaler Integrations- und Cleanup-Checkpoint

## Paketfortschritt

### IMG08.1 abgeschlossen

- lokaler Kartenbild-Maintenance-Präfix und pfadfreier
  Capability-Vertrag ergänzt;
- bestehende Maintenance-Session und Origin-/CSRF-Kette wiederverwendet;
- Oberfläche selbst für authentifizierte Remote-Maintenance fail-closed
  gesperrt;
- fokussierter HTTP-Test: 3 Tests bestanden;
- Server-Typecheck erreicht weiterhin ausschließlich den bereits auf `main`
  vorhandenen unabhängigen AI-Fehler
  `selected-choices-for-decision.ts(2588): option.card possibly undefined`.

### IMG08.2 abgeschlossen

- verwalteten Inbox-Root mit kanonischer Rootprüfung, Traversal- und
  Symlink-Sperre ergänzt;
- ausschließlich relative Inbox-Einträge klassifiziert;
- Katalogbestand für Originalset 374, Proteus 154 und Classic 54 gegen die
  persönliche Collection ausgewertet;
- geschützte Inventory-, Inbox- und CSV-Template-Routen ergänzt;
- `@netgrid/card-images`: 42 Tests und Typecheck bestanden;
- fokussierter Server-HTTP-Test: 4 Tests bestanden;
- Package-Boundary-Gate bestanden;
- Server-Typecheck weiterhin nur durch denselben unabhängigen AI-Baselinefehler
  gestoppt.

## Paketdetails

### IMG08.1 – Sicherheits- und Backend-Vertrag

Ziel: Ein expliziter lokaler Kartenbild-Maintenance-Kontext besitzt stabile
Typen, Routen- und Reauth-Grenzen.

Eingangsvoraussetzungen: bestehende Maintenance-Control-Plane und
`@netgrid/card-images`.

Arbeit:

- Serverabhängigkeit und schmale Maintenance-Service-Grenze ergänzen;
- Local-Profile- und Loopback-Prüfung definieren;
- Route, CSRF, Authentifizierung und Reauthentifizierung festlegen;
- strukturierte öffentliche Fehlerprojektion definieren;
- keine CLI- oder Shellprozesse starten.

Kernartefakte: Serverkonfiguration, HTTP-Routing, Servicevertrag und Tests.

Checks: fokussierte Servertests, Server-Typecheck, `git diff --check`.

Done-Gate: Nichtlokale Aufrufe scheitern fail-closed; Maintenance-Auth und
Reauth sind nachweisbar aktiv.

Commit: `feat(server): establish local card image maintenance boundary`

### IMG08.2 – Import-Inbox und Bestandsübersicht

Ziel: Der Betreiber erhält eine sichere relative Inbox und belastbare
Bestandsdaten für Originalset, Proteus und Classic.

Arbeit:

- Inbox-Pfade im Card-Image-Paket ableiten und validieren;
- sichere relative Einträge inventarisieren;
- Symlinks, Traversal und Root-Ausbrüche ablehnen;
- Collection-Bindungen mit dem Katalog je Set auswerten;
- CSV-Vorlagen als Downloadantwort erzeugen.

Kernartefakte: `@netgrid/card-images`, Maintenance-Service und GET-Routen.

Checks: Card-Image- und Servertests, Paket-Typechecks, `git diff --check`.

Done-Gate: Statuszahlen und Inbox-Einträge sind korrekt; keine absolute
Pfadinformation verlässt den Server.

Commit: `feat(card-images): add managed maintenance inbox inventory`

### IMG08.3 – Lokale und HTTPS-Importjobs

Ziel: Lokale und explizite HTTPS-Mappings können geprüft und kontrolliert
importiert werden.

Arbeit:

- sequenziellen Jobcontroller und Fortschrittsvertrag ergänzen;
- lokale und HTTPS-Prüf-/Apply-Jobs auf den bestehenden Importkern binden;
- Rechtebestätigung und Konfliktmodi erzwingen;
- strukturierte, pfad- und URL-sichere Berichte liefern;
- mutierende Jobs mit frischer Reauthentifizierung schützen.

Checks: Card-Image- und Servertests einschließlich Parallel-, Fehler-, Rechte-,
CSRF- und Reauth-Fällen; Typechecks; `git diff --check`.

Done-Gate: Genau ein mutierender Job läuft; Fehler ändern keine aktive
Collection-Bindung; HTTPS bleibt explizit und gehärtet.

Commit: `feat(server): run controlled card image import jobs`

### IMG08.4 – Private Bildpaketverwaltung

Ziel: Vollständige private Pakete können über die Maintenance-Fläche geprüft,
gebaut und importiert werden.

Arbeit:

- Pakete relativ zur Inbox erkennen und manifestbasiert beschreiben;
- Paket-Prüflauf und Importjob integrieren;
- vollständigen Profil-Build aus einer Inbox-Zuordnung ermöglichen;
- Buildausgaben ausschließlich unter dem ignorierten Pack-Root erzeugen;
- Profil-, Katalog-, Mindestversions- und Hashfehler strukturiert ausgeben.

Checks: Paket- und Servertests für alle drei Profile, Typechecks,
`git diff --check`.

Done-Gate: Originalset, Proteus und Classic verwenden unverändert den
IMG07-Vertrag; private Dateien bleiben unversioniert.

Commit: `feat(server): manage private card image packs locally`

### IMG08.5 – Maintenance-Weboberfläche und Berichte

Ziel: Die Funktionen sind unter `/maintenance/card-images` verständlich und
vollständig bedienbar.

Arbeit:

- Navigation aus der bestehenden Maintenance-Seite ergänzen;
- Statuskarten, Inbox-Auswahl, Modus- und Konfliktauswahl umsetzen;
- Rechtebestätigung, Prüflauf, Reauth und Apply-Ablauf integrieren;
- Jobfortschritt und terminale Berichte darstellen;
- Paketprüfung, -build und -import abbilden;
- ausschließlich relative Namen und side-sichere Diagnosen anzeigen.

Checks: Web-Unit-/Komponententests, Server-Integrationstests, Web-/Server-
Typechecks und Builds, fokussierter Firefox-E2E-Smoke soweit ohne produktive
Bildbestände möglich, `git diff --check`.

Done-Gate: Ein lokaler Betreiber kann alle IMG08-Workflows ohne CLI ausführen;
die vorhandene Kartenruntime zeigt danach die gebundenen lokalen Bilder.

Commit: `feat(web): add local card image maintenance workspace`

## Verifikationsregeln

- Während eines Pakets nur die engsten betroffenen Tests ausführen.
- Nach jedem Paket `git diff --check`, paketbezogenes Staging und genau einen
  Abschlusscommit.
- Finale Mindestchecks:
  - `corepack pnpm --filter @netgrid/card-images test`
  - `corepack pnpm --filter @netgrid/card-images typecheck`
  - `corepack pnpm --filter @netgrid/server test`
  - `corepack pnpm --filter @netgrid/server typecheck`
  - `corepack pnpm --filter @netgrid/web test`
  - `corepack pnpm --filter @netgrid/web typecheck`
  - `corepack pnpm --filter @netgrid/web build`
  - `corepack pnpm check:package-boundaries`
  - `git diff --check`
- Breite AI-Shards sind nicht erforderlich, da IMG08 keine KI-, Engine- oder
  Spielzustandslogik verändert.

## Worktree-, Git- und Integrationsregeln

- Alle Umsetzungsänderungen erfolgen ausschließlich im angegebenen Worktree.
- Der Hauptworkspace wird nur für den finalen lokalen Merge verwendet.
- Jedes Paket wird nach bestandenem Done-Gate separat committed.
- Vor dem Merge wird aktuelles `main` in den Arbeitsbranch integriert, falls
  `main` weitergelaufen ist.
- Der Merge nach `main` erfolgt bevorzugt per Fast-Forward.
- Es erfolgen kein Push und keine Remote-Integration.
- Nach dem Main-Merge werden Worktree-Pfad und sauberer Arbeitsstatus erneut
  geprüft, anschließend der Worktree entfernt und seine Entfernung in Git und
  Dateisystem verifiziert.
- Der vollständig gemergte Branch wird danach mit `git branch -d` gelöscht.

## Verbindliches /Goal

```text
/Goal Arbeite IMG08 – Lokale Kartenbildverwaltung vollständig und sequenziell
von IMG08.1 bis IMG08.5 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtenden Seiten aus
KI-Wissen-NETGRID, agents/release-implementation-agent.md, die paketlokalen
AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_IMG08_LOCAL_CARD_IMAGE_MANAGEMENT auf Branch
codex/img08-local-card-image-management. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative
automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket.
Aktualisiere den Paketstatus, führe Paketchecks und git diff --check aus und
committe jedes abgeschlossene Paket separat. Bei einem Sicherheitsblocker
stoppe ohne Fallback und dokumentiere Ursache sowie Removal Condition. Nach
Abschluss aller Pakete integriere aktuelles main, verifiziere final, merge
lokal nach main, prüfe main, entferne den sauberen Arbeits-Worktree, verifiziere
die Entfernung in Git und Dateisystem, lösche den gemergten Arbeitsbranch und
markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- Alle fünf Pakete sind nach ihren Done-Gates abgeschlossen und committed.
- Die dauerhaften Kartenbild-, Maintenance- und Betriebsverträge beschreiben
  IMG08 als Current State.
- Finale Checks sind bestanden oder unabhängige Baselinefehler sind exakt und
  reproduzierbar ausgewiesen.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace und Mergezustand sind geprüft.
- Worktree und gemergter Arbeitsbranch sind nachweislich entfernt.
- Kein privates Bild, privates Paket oder lokales Laufzeitartefakt ist
  versioniert.
