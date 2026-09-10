[English](README.md) | [Deutsch](README.de.md) | [Français](README.fr.md)

# NETGRID

NETGRID ist eine private, lokal ausgerichtete Webanwendung zum Spielen, Testen und Analysieren des klassischen Netrunner-Kartenspiels.

Die Anwendung verbindet eine deterministische Regel-Engine, privaten Mehrspielermodus, Karten- und Deckverwaltung, Replays, eine mehrsprachige Browseroberfläche und eine integrierte Plan-first-KI, die sowohl Runner als auch Korp spielen kann.

**Aktueller Produktstand:** V0.9, private Vorabversion.

NETGRID wird aktiv als lokale Anwendung entwickelt und nicht als öffentlich gehosteter Dienst betrieben. APIs, Speicherformate, Replayformate und lokale Laufzeitdaten können sich zwischen Versionen noch ändern.

## Highlights

- Regelgeführte Partien mit serverseitig autoritativen legalen Aktionen.
- Mensch gegen Mensch, Mensch gegen KI und KI gegen KI.
- KI-Spiel sowohl als Runner als auch als Korp.
- Kartenpools Originalset, Classic und Proteus.
- Benutzeroberfläche auf Deutsch, Englisch und Französisch.
- Privater Mehrspielermodus per Einladungslink über Loopback, LAN oder eine kontrollierte private Bereitstellung.
- Deckbibliothek, Deckeditor, Kartenkatalog, Standarddecks und Deckanleitungen.
- Match-Lobbys, Bereitschaftsprüfung, Countdown, Chat, Wiederverbindung und Undo-Anfragen.
- Einzelpartien und Serien mit Seitenwechsel über 2 bis 6 Spiele.
- Optionale Spieleruhren und einstellbares KI-Tempo.
- Live-Zuschauer, Spielhistorie, Statistiken, Chronik und deterministische Replays.
- Lokale Verwaltung persönlicher Kartenbilder ohne Abhängigkeit von externen Bilddiensten während des Spiels.
- Kein externes Sprachmodell und kein Cloud-KI-Dienst erforderlich.

## Spielbetrieb

### Regelgeführte Partien

Die NETGRID-Regel-Engine ist die einzige Autorität für Spielregeln und Ausführung.

Browser, Mehrspielerserver, menschliche Spieler und KI dürfen nur Aktionen einreichen, die zuvor von der Engine als `LegalActions` angeboten wurden. Vor der Ausführung prüft die Engine Seite, Timing, `actionId`, `stateVersion`, Kosten, Ziele und Auswahlwerte erneut.

Damit bleiben Spielregeln von Benutzeroberfläche und KI-Entscheidungslogik getrennt.

### Spielmodi

NETGRID unterstützt:

- **Mensch gegen Mensch** über einen privaten Beitrittslink.
- **Mensch gegen KI**, wobei der Mensch Runner oder Korp spielt.
- **Zufällige Seitenverteilung** für Mensch gegen Mensch und Mensch gegen KI.
- **KI gegen KI** zur Beobachtung, Simulation und Regressionsanalyse.

Mensch-gegen-Mensch-Partien besitzen eine gemeinsame Startlobby mit Deckbereitschaft, Bereitschaftsprüfung, konfigurierbarem Countdown, Lobby-Chat und Verbindungsstatus.

### Matchformate und Steuerung

Verfügbare Matchformate sind:

- ein reguläres Regelmatch bis 7 Agendapunkte;
- eine Serie aus 2 bis 6 Spielen mit wechselnden Seiten.

Je nach gewähltem Modus unterstützt NETGRID außerdem:

- optionale Spieleruhren mit Startzeit und Kulanzphase;
- schnelle, getaktete oder manuell weitergeschaltete KI-Züge;
- Wiederverbindung nach Browser- oder Netzwerkunterbrechung;
- Undo-Anfragen mit Zustimmung oder Ablehnung;
- Aufgabe, Verlassen und Zeitablauf als geregelte Spielausgänge;
- Ergebnisübersichten für Einzelspiele und Serien.

### Trace-Regelprofile

Beim Erstellen eines Matches kann ein Trace-Regelprofil gewählt werden:

- **Modern Open** — offene, aufeinanderfolgende Zahlungen; der Runner gewinnt Gleichstände.
- **Classic Blind** — verdeckte Gebote; der Runner gewinnt Gleichstände.
- **Classic Blind — Korp gewinnt Gleichstände** — verdeckte Gebote; die Korp gewinnt Gleichstände.

Verdeckte Gebote werden gemeinsam aufgedeckt. Trace-Zahlungen verwenden die normalen legalen Zahlungsquellen und bleiben Bestandteil des deterministischen Replays.

## Integrierte KI

NETGRID enthält eine eigene lokale Spiel-KI. Sie ist keine Anbindung an ein externes Sprachmodell und benötigt weder eine KI-API noch ein Cloudkonto oder eine Internetverbindung.

Die KI arbeitet Plan-first:

1. Sie erhält dieselbe side-sichere Spielersicht und dieselben legalen Aktionen, die ihrer Seite zur Verfügung stehen.
2. Sie interpretiert Kartenfähigkeiten, Kosten, Ziele, Timing und sichtbaren Boardkontext.
3. Sie analysiert die Zusammensetzung ihres eigenen Decks und die unterstützten strategischen Linien.
4. Sie führt Pläne und länger laufende Kampagnen, etwa Rig-Aufbau, Druck auf Zentralserver, Remote-Contest, Scoringprojekte, Economy-Aufbau, Verteidigung und Punish-Linien.
5. Sie vergleicht zusammenhängende Restzugfolgen, statt jede Aktion isoliert auszuwählen.
6. Sie führt nur den aktuellen Schritt des gewählten Plans aus.
7. Die Engine prüft die ausgewählte legale Aktion erneut und führt sie aus.

Getrennte Runner- und Korp-Scheduler verwenden denselben technischen Planungsrahmen, behalten aber seitenspezifische Prioritäten und Planmodule.

Die KI erzeugt keine eigenen legalen Aktionen und erhält keine verdeckten Informationen des Gegners. Zulässige Variation zwischen annähernd gleichwertigen Entscheidungen verwendet den Seed-basierten Engine-Zufall und bleibt replayfähig.

### Auswahl der KI-Decks

KI-Decks können:

- ausdrücklich ausgewählt werden;
- aus freigegebenen Standarddecks stammen;
- anhand des Match-Seeds deterministisch aus einem freigegebenen Pool gewählt werden;
- in dafür vorgesehenen Modi von einem Teilnehmerdeck übernommen werden.

Eigene KI-Decks werden gegen das ausgewählte Format validiert und dürfen nur KI-unterstützte Karten enthalten.

### KI-unterstützte Kartenpools

| Auswählbarer Kartenpool         | Menschliches Spiel | KI-Spiel |
| ------------------------------- | -----------------: | -------: |
| Originalset                     |                 Ja |       Ja |
| Originalset + Classic           |                 Ja |       Ja |
| Originalset + Proteus           |                 Ja |       Ja |
| Originalset + Classic + Proteus |                 Ja |       Ja |

Proteus hat die aktuellen KI-Readiness-Prüfungen für kontrollierte Karten-Hints, ausgewählte Playtest-Decks, deterministische Simulationen, Replayintegrität und Hidden-Info-Schutz bestanden.

Die weitere KI-Entwicklung konzentriert sich vor allem auf Spielstärke, zusätzliche wiederverwendbare Planlinien und Regressionsabdeckung, nicht auf ein zweites Entscheidungssystem.

## Karten und Decks

### Unterstützte Inhalte

NETGRID stellt derzeit technisch spielbare Implementierungen bereit für:

- das Originalset;
- die Classic-Erweiterung;
- Proteus.

Classic und Proteus können zusätzlich zum Originalset unabhängig voneinander oder gemeinsam aktiviert werden.

Kartenspezifische Implementierungsdaten werden über die zentrale `CardSpec`-Architektur gepflegt. Sie ist die Projektquelle für Kartenmetadaten, strukturierte Effekte, Engine-Projektionen und KI-Hints. Für Legalität und Ausführung bleibt die Regel-Engine verantwortlich.

Für Entwicklung und Diagnose existiert ein internes Testkartenset, das im Normalbetrieb deaktiviert ist. Es wird nur sichtbar, wenn `NETGRID_ENABLE_TEST_CARDS=true` ausdrücklich gesetzt wird.

### Kartenkatalog und Deckbibliothek

Der Kartenkatalog im Browser bietet eine durchsuchbare Ansicht des verfügbaren Kartenpools und seiner Kartendaten.

NETGRID enthält außerdem:

- kuratierte Standarddecks;
- optionale Strategie- und Nutzungshinweise für unterstützte Standarddecks;
- persönliche Runner- und Korp-Deckbibliotheken;
- Erstellen, Bearbeiten, Duplizieren und Importieren von Decks;
- Kopieren eines Standarddecks in die persönliche Bibliothek;
- serverseitige Deck- und Formatvalidierung;
- unveränderliche Deck-Snapshots für den Matchstart;
- Filterung nach Seite, Kartenpool und Matchkompatibilität.

Ungültige persönliche Entwürfe dürfen gespeichert und weiterbearbeitet werden. Für den Matchstart kann jedoch nur ein erfolgreich validierter, unveränderlicher Snapshot verwendet werden.

Gastdecks verbleiben in der lokalen Gastumgebung. Accountdecks werden in der Accountdatenbank gespeichert.

Offizielle Kartenillustrationen werden nicht mit NETGRID ausgeliefert. Eigene Kartenbilder können optional lokal importiert und verwaltet werden.

## Mehrspieler, Accounts und Historie

### Privater Mehrspielermodus

Der normale Betriebsmodus ist lokal oder im privaten LAN.

Menschliche Partien können über einen privaten Beitrittslink erstellt werden. Der Server speichert Matchsitzungen, Wiederverbindungsberechtigungen, Deckauswahl, Matchzustand und Ereignisverlauf in einer lokalen SQLite-Datenbank.

Innerhalb einer privaten NETGRID-Installation können Matches anderen Benutzern dieser Installation als offen, aktiv oder beendet angezeigt werden. Dies ist eine installationslokale Funktion und kein globaler öffentlicher Matchmaking-Dienst.

Live-Zuschauer können unterstützte laufende Matches über side-sichere Zuschaueransichten verfolgen. Verdeckte Informationen bleiben geschützt.

### Accounts und Gäste

NETGRID kann ohne Account im lokalen Gastmodus verwendet werden.

Ein optionales, einladungsbasiertes Accountsystem ergänzt:

- persönliche Deckspeicherung;
- private Matchhistorie;
- Statistiken zu Siegen, Niederlagen, Unentschieden, Agendapunkten und Serien;
- Auswertungen nach Seite, Gegnertyp, Matchmodus und Matchformat;
- persönliche letzte Ergebnisse;
- an den Account gebundene Anzeigenamen;
- Passwortänderung und vom Administrator erzeugte Resetlinks;
- Accountexport und Accountlöschung.

Accounts sind bewusst von Matchberechtigungen getrennt. Ein Account-Cookie berechtigt weder zu Spielaktionen noch zum Beitritt oder zur Wiederverbindung mit einem Match.

Das aktuelle Accountsystem bietet keine öffentliche Selbstregistrierung, keinen E-Mail-Versand, keine E-Mail-Verifikation, keine Passkeys, keine Zwei-Faktor-Authentifizierung und keine selbstständige Passwortwiederherstellung.

### Replays und Analyse

NETGRID zeichnet deterministische Matchereignisse, State-Hashes und Seed-basierte Zufallsziehungen auf.

Verfügbare Auswertungsflächen sind unter anderem:

- eine chronologische Matchdarstellung;
- Replay abgeschlossener Partien;
- Ergebnisübersichten;
- letzte öffentliche Ergebnisse innerhalb der privaten Installation;
- persönliche Accounthistorie;
- Zusammenfassungen mehrteiliger Serien;
- Prüfung von Endzustand und Replay;
- Lern- und Analyseansichten für beendete Spiele;
- schreibgeschützte Maintenance-Analyse gespeicherter Matches.

Replay und Chronik werden aus strukturierten Spielereignissen erzeugt. Sie werden nicht als fest formulierter, sprachgebundener Text gespeichert.

## Mehrsprachige Oberfläche

Die normale Spieleroberfläche und die browserbasierte Maintenance-Oberfläche stehen zur Verfügung auf:

- **Deutsch** — Standardsprache;
- **Englisch**;
- **Französisch**.

Die ausgewählte Sprache wird pro Browser gespeichert und kann zur Laufzeit ohne Änderung der Match-URL gewechselt werden.

Verschiedene Clients können dasselbe Match in unterschiedlichen Sprachen anzeigen. Die Locale beeinflusst nur Darstellung und Formatierung. Sie verändert weder Spielzustand noch Regeln, Legalität, Aktionsidentität, State-Hashes, Zufallsergebnisse, Replays oder KI-Entscheidungen.

Der Übersetzungsumfang umfasst App-Rahmen, Accounts, Matchstart, Lobbys, Deck- und Kartenflächen, Spielbrett, Aktionen, Auswahlfenster, Ergebnisanzeigen, Chronik, Replays, nutzerseitige Fehler und Maintenance-Navigation.

Gedruckte Kartentitel, gedruckter Regeltext, Flavourtext, Kartenbilder, technische IDs, rohe KI-Traces und rohe Engine-Diagnosen werden nicht übersetzt.

## Lokale Kartenbilder

Persönliche Kartenbilder werden lokal vorbereitet und gespeichert. Die Spielruntime verwendet nur normalisierte lokale Varianten und lädt keine Illustrationen von externen Diensten nach.

Unterstützte Vorbereitungsquellen sind:

- PNG-, JPEG- und WebP-Dateien;
- ausdrücklich aktivierte und gehärtete HTTPS-Importe;
- validierte lokale Verzeichnispakete;
- validierte lokale ZIP-Transportpakete.

Bildpakete und Einzelquellen werden vor dem Import geprüft. Die lokale Maintenance-Oberfläche kann den Bildbestand anzeigen, Vorlagen erzeugen, Importe validieren, private Pakete bauen und vorbereitete Pakete importieren.

Private Quellbilder, erzeugte Pakete, Caches und Laufzeitassets sind weder Bestandteil des Repositorys noch des CI-Builds.

## Maintenance und Architektur

### Maintenance-Bereich

Der geschützte Maintenance-Bereich ist erreichbar unter:

```text
/maintenance
```

Er bietet administrative Zugriffe unter anderem auf:

- SQLite-Speicherstatus;
- Backup, Wiederherstellung und Optimierung;
- Matchanalyse;
- KI-Entscheidungstraces;
- Kartenbildbestand und Importjobs;
- lokale Maintenance-Diagnosen.

Die Maintenance-Anmeldung ist von Spieleraccounts und Match-Reconnect-Berechtigungen getrennt.

Standardmäßig ist Maintenance auf Loopback beschränkt. Zugriff von einem anderen Gerät erfordert eine kontrollierte HTTPS-Origin und eine Reverse-Proxy-Konfiguration.

### Architekturprinzipien

NETGRID folgt wenigen, klaren Systemgrenzen:

- **Engine-Autorität:** Nur die Engine definiert und vollzieht legale Spielaktionen.
- **Hidden-Info-Schutz:** Verdeckte gegnerische Zonen bleiben aus normalen PlayerViews, KI-Eingaben, öffentlichen Ereignissen, Netzwerkpayloads, Replays, Logs und Clientfehlern ausgeschlossen.
- **Determinismus und Replay:** State-Hashes, Action Receipts, Seed-basierter Zufall und Random-Draw-Aufzeichnungen machen Matches reproduzierbar und prüfbar.
- **Zentrale Kartenspezifikation:** Kartenmetadaten, strukturierte Mechaniken, Laufzeitprojektionen und KI-Hints werden in einer zentralen CardSpec-Schicht statt in parallelen manuellen Registries gepflegt.
- **Locale-neutrale Spielsemantik:** Engine und Backend tauschen stabile Codes und strukturierte Präsentationsdaten aus; erst der Browser formuliert daraus deutsche, englische oder französische Texte.
- **Local-first-Speicherung:** Matches, Accounts, persönliche Decks, Kartenbilder, Caches und Betriebsdaten verbleiben in vom Betreiber kontrolliertem Speicher.

## Technik

NETGRID ist ein TypeScript-Monorepo mit:

- Node.js 24 LTS;
- pnpm Workspaces über Corepack;
- TypeScript;
- Next.js und React;
- einem lokalen Node.js-Mehrspielerserver;
- SQLite;
- Vitest;
- Playwright.

Die wichtigsten Projektbereiche sind:

- `apps/web` — Browseranwendung;
- `apps/server` — Mehrspieler-, Account-, Maintenance- und Persistenzserver;
- `packages/engine` — deterministische Regel-Engine;
- `packages/cards` — zentrale Kartenspezifikationen und Projektionen;
- `packages/ai` — lokale Plan-first-KI und Simulation;
- `packages/decks` — Deckmodelle und Validierung;
- `packages/catalog` — Projektionen für den Kartenkatalog;
- `packages/shared` — gemeinsame Verträge.

## Lokaler Start

### Voraussetzungen

- Node.js 24;
- Corepack;
- PowerShell für den normalen lokalen Startpfad.

### Abhängigkeiten installieren

```powershell
corepack pnpm install
```

### NETGRID starten

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-netgrid.ps1
```

Das Startscript startet Server und Webanwendung, ermittelt die lokale LAN-Adresse und setzt die zusammengehörigen URLs, Origins und Umgebungsvariablen.

Standardmäßige lokale Endpunkte:

- Webanwendung: `http://127.0.0.1:3100`
- Server-Health-Endpunkt: `http://127.0.0.1:8787/health`
- Maintenance: `http://127.0.0.1:3100/maintenance`

Das Script kann statt der Loopback-Adresse die entsprechende LAN-URL öffnen.

Direkte Paket-Dev-Starts dienen Diagnose und isolierter Entwicklung. Für den normalen lokalen Betrieb gilt das Projekt-Startscript, damit Web-URL, Server-URL, LAN-Adresse und Origin-Allowlist zusammenpassen.

### Maintenance erstmals einrichten

Vor der ersten Nutzung des Maintenance-Bereichs wird lokal ein Maintenance-Passwort gesetzt:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\set-maintenance-password.ps1
```

Der vollständige Betriebsvertrag steht im [Maintenance-Control-Plane-Runbook](docs/runbooks/maintenance-control-plane.md).

Optionale einladungsbasierte Accounts sind im [Account-Alpha-Runbook](docs/runbooks/account-alpha-operations.md) beschrieben.

## Konfiguration und lokale Daten

`.env.example` dokumentiert die wichtigsten lokalen Konfigurationsvariablen.

Das Standard-Startscript setzt die für den normalen lokalen Betrieb erforderlichen Werte, darunter öffentlicher Host, Web-URL, Server-URL und erlaubte Origins. Lokale Overrides und Secrets dürfen nicht committed werden.

Laufzeitdaten liegen lokal, normalerweise unter:

```text
data/runtime/
```

Die standardmäßige SQLite-Datenbank für Multiplayer ist:

```text
data/runtime/multiplayer/netgrid.sqlite
```

Lokale Speicherkommandos:

```powershell
corepack pnpm storage:inspect
corepack pnpm storage:backup
corepack pnpm storage:restore -- <backup-directory>
corepack pnpm storage:optimize
```

Lokale Installationen können zusätzlich über den dokumentierten Local-Transfer-Workflow exportiert und importiert werden.

## Entwicklungsprüfungen

Übliche repositoryweite Prüfungen:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm e2e
```

Wichtige architekturspezifische Prüfungen:

```powershell
corepack pnpm check:engine-source-structure
corepack pnpm check:cards-source-structure
corepack pnpm check:ai
corepack pnpm check:i18n
```

Für engere Änderungen können paketbezogene Prüfungen verwendet werden:

```powershell
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/server typecheck
corepack pnpm --filter @netgrid/web test
```

## Dokumentation

Aktuelle Architektur- und Betriebsreferenzen:

- [Aktueller Codex-Status](docs/codex/CODEX_STATUS.md)
- [Architekturindex](docs/architecture/README.md)
- [Engine-Architektur](docs/architecture/engine/README.md)
- [KI-Architektur](docs/architecture/ai/README.md)
- [Lokalisierungsarchitektur](docs/architecture/localization/translatable-ui.md)
- [Maintenance Control Plane](docs/runbooks/maintenance-control-plane.md)
- [Accountbetrieb](docs/runbooks/account-alpha-operations.md)
- [Lokaler Transfer](docs/runbooks/netgrid-local-transfer.md)
- [Import persönlicher Kartenbilder](docs/architecture/card-images/personal-card-image-import.md)

Der Arbeitsbaum beschreibt den aktuellen Stand. Historische Implementierungspläne, Reviews, Benchmarks und Migrationsevidence werden über die Git-Historie erhalten und nicht als zweite aktuelle Spezifikation geführt.

## Aktuelle Grenzen

NETGRID bietet derzeit nicht:

- eine global gehostete öffentliche Plattform;
- öffentliches Matchmaking über verschiedene Installationen hinweg;
- Rankings oder Bestenlisten;
- Turnierverwaltung;
- öffentliche Moderationswerkzeuge;
- öffentliche Selbstregistrierung;
- E-Mail-Versand oder automatische Passwortwiederherstellung;
- mitgelieferte offizielle Kartenillustrationen;
- eine Kompatibilitätsgarantie für Laufzeitdaten der Vorabversion.

Private SQLite-Datenbanken, persönliche Decks, lokale Kartenbilder, Caches, Logs, Secrets und Laufzeitexporte bleiben lokal und werden nicht versioniert.

## Lizenz und rechtlicher Hinweis

Der NETGRID-Quellcode steht unter der [MIT-Lizenz](LICENSE).

NETGRID ist ein inoffizielles privates Projekt. Kartennamen, Kartentexte, Spielnamen, Illustrationen, Logos und zugehörige Marken verbleiben bei den jeweiligen Rechteinhabern. Dieses Repository verteilt keine offiziellen Kartenillustrationen.
