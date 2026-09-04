# Paketprozess: Installerunabhängige Windows-Produktvoraussetzungen

Stand: 2026-09-04  
Status: aktiv

## Quelle und Zielprüfung

Führend sind `windows-release-boundary.md`,
`windows-installer-product-contract.md`,
`windows-installer-package-process.md`, der bestehende Account- und
Maintenance-Vertrag sowie die Entscheidung zur fortlaufenden Git-Buildnummer.
Der Nutzer hat die direkte Umsetzung im Worktree verlangt. Zielzustand,
Sicherheitsgrenzen, Nicht-Ziele und paketnahe Gates sind bestimmbar; es ist
keine weitere Produktentscheidung erforderlich.

## Gesamtziel

NETGRID erhält vor der eigentlichen Installerentwicklung die stabilen
Anwendungseigenschaften, die ein Installer später nur noch konfigurieren muss:
Produktversion `1.0` mit fortlaufender Git-Buildnummer, fällige automatische
Spielbereinigung beim Backend-Start und dieselbe Account-Autorität mit
installergeeignetem einfachem oder geschütztem Zugangsmodus. Der normale
Entwicklungsstart und seine Invite-only-Policy bleiben unverändert.

## Annahmen

- `git rev-list --count HEAD` bleibt die fortlaufende Buildkennung.
- Offizielle Builds entstehen ausschließlich aus einem sauberen Main-Commit;
  die sichtbare Form lautet `V1.0 · Build <Anzahl>`.
- `invite_only` bleibt ein internes Entwicklungs-/Bestandsprofil. Die
  installierbaren Produktprofile heißen `simple` und `protected`.
- Zugangsmodus ist eine persistente Policy derselben Accountdaten, kein
  paralleles Accountmodell.
- Simple-Profile erhalten weiterhin nicht erratbare HttpOnly-Sitzungen; nur
  der Einstieg ist im vertrauenswürdigen LAN passwortlos.
- Maintenance bleibt eigenständig authentifiziert und Loopback-only.

## Nicht-Ziele

- kein MSI, Setup-Bootstrapper, Launcher, Tray, Firewallsetup oder Autostart;
- kein GitHub-Download, Updater oder Veröffentlichungsworkflow;
- keine öffentliche Registrierung im Internetprofil;
- keine E-Mail-Recovery, Passkeys oder Zwei-Faktor-Authentisierung;
- keine Migration lokaler Entwicklungsdaten in einen Release.

## Controller-Invarianten

- Genau ein Paket ist aktiv und wird erst nach seinem Done-Gate committed.
- Der Accountzugangsmodus ändert weder Match-Capabilities noch
  PlayerAction-/LegalAction-Grenzen.
- Account-ID und Sitzungsdaten gelangen weiterhin nicht in öffentliche
  Matchdaten, Replays, Logs oder Clientfehler.
- Selbstregistrierung ist nur in `simple` und `protected` erlaubt; im
  `private_internet`-Profil bleibt sie unabhängig von der Policy gesperrt.
- Moduswechsel und Passwortreset verlangen eine frische authentifizierte
  Maintenance-Sitzung, sind transaktional und widerrufen betroffene
  Sitzungen.
- Start-Cleanup löscht nur nach der gespeicherten Policy zulässige terminale,
  ungeschützte Matches und blockiert den Serverstart nicht.
- Fehlende oder ungültige Policy scheitert strukturiert; kein stiller
  permissiver Fallback.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Fehler werden in der erzeugenden Schicht behoben. Bei möglicher öffentlicher
Selbstregistrierung, nicht widerrufenen Sitzungen nach Policywechsel,
unsicherer Passwortübergabe, nicht atomarem Credentialwechsel oder erweitertem
Cleanup-Scope stoppt der Prozess fail-closed. Ein Blockerbericht nennt Ursache
und Removal Condition.

## State Machine

```text
prepared -> P00 -> P01 -> P02 -> P03 -> P04 -> P05
         -> integration_verified -> merged -> cleaned
         \-> security_blocked
```

## Paketfolge

| Paket | Ziel | Kernarbeit | Direkte Checks | Done-Gate | Commit-Vorschlag |
| --- | --- | --- | --- | --- | --- |
| WIN-P00 Prozess und Verträge | Scope ausführbar fixieren | Prozessartefakt, Development-/Release-Policy, Paket-Handoff aktualisieren | Dokument- und Diffprüfung | Invarianten und Nicht-Ziele sind widerspruchsfrei | `docs(installer): define prerequisite package process` |
| WIN-P01 Produkt- und Buildversion | `1.0` ohne laufenden Pflegeaufwand | sichtbare Produktversion, Git-/Installer-Versionsvertrag, Tests | Build-Info-Tests, Web-Typecheck soweit betroffen | UI und Releasevertrag verwenden `1.0` plus Commitanzahl | `feat(version): establish 1.0 build identity` |
| WIN-P02 Cleanup beim Start | Kurze Starts berücksichtigen | initialen asynchronen Policylauf vor dem Stundentimer auslösen, Fehler redigieren | fokussierte Timer-/Storage-Tests | Startup blockiert nicht; Policy läuft einmal sofort und dann stündlich | `feat(storage): run retention cleanup on server start` |
| WIN-P03 Account-Policy und Maintenance | Eine Accountautorität, drei Zugangsrichtlinien | persistente Policy, Simple-/Protected-Registrierung, Profilwahl, atomarer Moduswechsel, Maintenance-Reset, Sessionwiderruf | Service-, Storage-, HTTP-, Auth- und Origin-Tests | Kein öffentlicher Bypass; Policywechsel und Reset sind fail-closed | `feat(accounts): add local access policies` |
| WIN-P04 Spieler- und Maintenance-UI | Geführte Bedienung in drei Sprachen | Moduserkennung, Profilanlage/-wahl, Passwortflüsse, aktives Profil, Maintenance-Steuerung, `de`/`en`/`fr` | Komponenten-/Clienttests, i18n-Gate, Web-Typecheck | Beide Produktmodi sind ohne Invite bedienbar; Texte vollständig | `feat(web): add guided local profile access` |
| WIN-P05 Integration und Rückführung | Voraussetzungen releasefähig abschließen | Runbooks/Status/Installerprozess aktualisieren, Releaseoutput prüfen | betroffene Server-/Webtests, Typechecks, Releasegrenzen, Diffcheck | Current State stimmt; Branch ist integrationsbereit | `docs(installer): complete product prerequisites` |

## Verifikationsregeln

Nach jedem Paket laufen ausschließlich direkt betroffene Tests und
`git diff --check`. Typoberflächenänderungen erhalten den jeweiligen
Paket-Typecheck. Änderungen an Releaseversion oder Releasekonfiguration
erhalten die betroffenen Releasegrenzen und den Releaseoutput-Smoke. Ein
breiter Workspace-Test ist ohne neue direkte Wirkung nicht Teil dieses Goals.

## Worktree-, Git- und Integrationsregeln

Arbeitsbranch ist `codex/windows-installer-prerequisites`, Worktree ist
`C:\Projekte\NETGRID-worktrees\windows-installer-prerequisites`. Jedes Paket
erhält einen eigenen Commit. Nach P05 wird aktuelles `main` defensiv
integriert, direkt betroffene Checks werden wiederholt und der Arbeitsbranch
lokal nach `main` gemergt. Erst danach werden Worktree und gemergter Branch
verifiziert entfernt. Ein Push erfolgt nicht ohne ausdrücklichen Auftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite die installerunabhängigen Windows-Produktvoraussetzungen
sequenziell von WIN-P00 bis WIN-P05 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies AGENTS.md, paketlokale AGENTS.md, CODEX_STATUS, den Windows-
Installer-Produktvertrag und dieses Prozessartefakt. Arbeite ausschließlich
im festgelegten Worktree und immer nur am aktiven Paket. Erhalte den normalen
Entwicklungsstart und die bestehende Accountautorität. Implementiere weder
Installer noch Launcher oder Updater. Führe paketnahe Checks aus, committe
jedes abgeschlossene Paket und stoppe bei einem Sicherheitsblocker fail-closed
mit Ursache und Removal Condition. Nach P05 verifiziere die direkt betroffenen
Gates, merge lokal nach main und entferne Worktree und Branch erst nach den
vorgeschriebenen Prüfungen. Push nur auf ausdrücklichen Wunsch.
```

## Abschlusskriterien

Das Goal ist erst abgeschlossen, wenn P00 bis P05 committed, die fokussierten
Account-, Cleanup-, UI-, Lokalisierungs- und Releasegates grün, die Ergebnisse
in den Current State zurückgeführt, der Branch lokal gemergt und Worktree
sowie Branch nachweislich entfernt sind.
