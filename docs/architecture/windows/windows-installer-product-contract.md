# Windows-Installer-Produktvertrag

Stand: 2026-09-04  
Status: beschlossenes Zielbild; Anwendungsvoraussetzungen umgesetzt,
Installer/Launcher/Updater noch nicht implementiert

## Zweck und Grenze

Dieser Vertrag beschreibt den geführten Windows-11-x64-Installer, den
Launcher und den Updateweg für NETGRID. Er baut ausschließlich auf dem
auditierten Output aus `build:windows-release-output` auf. Repositoryquellen,
Entwicklungsdatenbanken, Testspiele, Demo- und Selfplay-Daten, private
Kartenbilder, Secrets und sonstige Entwicklungsartefakte bleiben gemäß
`windows-release-boundary.md` ausgeschlossen.

Der Vertrag ist eine Vorbedingung für die spätere Umsetzung. Er führt kein
zweites fachliches Datenmodell ein und implementiert noch keinen Installer,
Launcher oder Updater.

## Installationsprodukt

- Offiziell unterstützt wird zunächst Windows 11 x64.
- Ausgeliefert wird ein klassischer Windows-Setup-Assistent mit `Setup.exe`
  und MSI-Paket, Eintrag unter „Installierte Apps“, Reparatur und sauberer
  Deinstallation. WiX ist die bevorzugte Werkzeugbasis.
- NETGRID wird pro Rechner installiert. Der Programmordner ist standardmäßig
  `C:\Program Files\NETGRID` und darf in den erweiterten Optionen geändert
  werden.
- Node.js 24 x64 wird mitgeliefert. Die zugehörigen Lizenz-, Copyright- und
  Drittanbieterhinweise sind Bestandteil des Pakets.
- Installation, Update, Reparatur und Deinstallation fordern einmalig die
  Windows-Administratorfreigabe an. Der normale Betrieb benötigt keine
  Administratorrechte.
- Die erste private Alpha darf unsigniert sein. Codesigning, Timestamping und
  die Beschaffung eines öffentlich vertrauenswürdigen Zertifikats bleiben vor
  einer breiteren Veröffentlichung ein eigenes Release-Gate.

## Zwei geführte Installationswege

Die erste fachliche Auswahl des Setups lautet:

1. **Empfohlene Installation**: zeigt nur unvermeidbare Entscheidungen und
   übernimmt alle übrigen Werte aus diesem Vertrag. Sie ist vorausgewählt.
2. **Benutzerdefinierte Installation**: führt verständlich durch alle
   freigegebenen Optionen, erklärt Folgen und zeigt jeweils den empfohlenen
   Wert. Sie schaltet keine internen Entwicklerparameter frei.

Auch die empfohlene Installation muss mindestens die Betriebsart abfragen,
weil eine Netzwerkfreigabe nicht stillschweigend erfolgen darf. Notwendige
Ersteinrichtungen können nach Abschluss in einem sicheren First-Run-Assistenten
erfolgen, wenn Geheimnisse nicht gefahrlos über MSI-Eigenschaften verarbeitet
werden können.

### Empfohlene Defaults

| Bereich | Vorauswahl |
| --- | --- |
| Setupweg | Empfohlene Installation |
| Betriebsart | Nur dieser Rechner |
| Kontomodus | Einfach, ohne Spielerpasswörter |
| Programmordner | `C:\Program Files\NETGRID` |
| Datenordner | `C:\ProgramData\NETGRID` |
| Web-/Serverport | `3100` / `8787` |
| Spielaufbewahrung | automatische Bereinigung nach 30 Tagen |
| Desktopverknüpfung | aktiviert, abwählbar |
| Abschlussaktion | „NETGRID jetzt starten“ aktiviert |
| Updatekanal | nur stabile GitHub Releases |

## Datenablage und Lebenszyklus

- Alle veränderlichen Daten liegen außerhalb des Programmordners unter einem
  absoluten `NETGRID_DATA_ROOT`.
- Standard ist `C:\ProgramData\NETGRID`. In den erweiterten Optionen darf ein
  anderer Ordner auf einem lokalen, dauerhaft verfügbaren Laufwerk gewählt
  werden.
- Netzwerkfreigaben, Cloud-Synchronisationsordner und Wechselmedien sind als
  Datenroot nicht unterstützt. Programm- und Datenordner dürfen nicht
  identisch sein.
- Das Setup prüft Zielpfad, Schreibrechte, verfügbaren Speicher und einen
  gegebenenfalls vorhandenen gültigen NETGRID-Datenbestand. Updates behalten
  den gewählten Datenpfad bei.
- Eine Entwicklungs- oder Playtest-Datenbank wird weder automatisch erkannt
  noch importiert. Produktdatenmigrationen benötigen einen eigenen
  versionierten Vertrag und Upgrade-Test.
- Bei der Deinstallation bleiben Konten, Profile, Decks, Spiele,
  Einstellungen, Kartenbilder und Backups standardmäßig erhalten. „Alle
  NETGRID-Daten endgültig löschen“ ist eine gesonderte, nicht vorausgewählte
  und lokalisierte Bestätigung.

### Aufbewahrung gespeicherter Spiele

- Automatische Bereinigung ist standardmäßig aktiv und entfernt ungeschützte,
  terminale Spiele nach 30 Tagen.
- Der geführte Ablauf bietet mindestens 7, 30, 90, 180 und 365 Tage sowie
  „Nie automatisch löschen“.
- Als „behalten“ markierte Spiele werden nicht automatisch gelöscht.
- Der Backend-Start stößt eine fällige Bereinigung zeitnah asynchron an; das
  Öffnen der Anwendung wartet nicht darauf. Danach bleibt die stündliche
  Prüfung aktiv.
- Der Routine-Cleanup erstellt kein vollständiges Backup, da gelöschte Spiele
  sonst dauerhaft in Sicherungen fortbestehen würden. Update-Backups sind
  davon getrennt.

## Betriebs- und Netzwerkmodell

- NETGRID verwendet einen Benutzerlauncher und keinen Windows-Dienst.
- Es gibt keinen Windows-Autostart. NETGRID startet nur über Startmenü,
  optionale Desktopverknüpfung oder einen bereits geöffneten Launcher.
- Der Launcher startet Server und Weboberfläche bei Bedarf, erkennt eine
  vorhandene Instanz und öffnet dann die richtige URL.
- Während des Betriebs bleibt ein NETGRID-Symbol im System-Tray sichtbar. Es
  bietet mindestens „NETGRID öffnen“, „Maintenance öffnen“ und „NETGRID
  beenden“.
- Das Schließen des Browserfensters beendet NETGRID nicht. Nur „NETGRID
  beenden“ stoppt die Instanz kontrolliert.
- Startmenüeinträge „NETGRID“ und „NETGRID Maintenance“ verwenden dieselbe
  Instanz. Maintenance bleibt unabhängig von der Spielbetriebsart lokal über
  Loopback erreichbar und behält ihre eigene Authentifizierung.
- Nach einem unerwarteten Prozessabbruch versucht der Launcher genau einen
  automatischen Neustart. Scheitert auch dieser, zeigt er einen verständlichen
  Dialog mit Wiederholen, Diagnose und Beenden; es gibt keine Endlosschleife.

### Betriebsarten

Das Setup fragt ausdrücklich:

- **Nur dieser Rechner**: Bindung und Zugriff bleiben lokal.
- **Privates Netzwerk**: Spielzugriff wird im privaten LAN erlaubt. Eine
  eingehende Windows-Firewallregel gilt ausschließlich für das Netzwerkprofil
  „Privat“. Im Profil „Öffentlich“ bleibt externer Zugriff blockiert.

Eine öffentliche Internetfreigabe, Router-Portweiterleitung oder exponierte
Maintenance-Oberfläche wird nie automatisch eingerichtet. Zugriff über ein
vom Benutzer eingerichtetes VPN kann den privaten LAN-Weg nutzen. Die
Standardports `3100` und `8787` werden vorab geprüft; bei Konflikten bietet
das Setup einen freien Alternativsatz beziehungsweise in der
benutzerdefinierten Installation eine gültige manuelle Auswahl an.

## Spielerprofile und Maintenance

### Kontomodi

Beide Modi erlauben im erreichbaren lokalen beziehungsweise privaten Netzwerk
die direkte Selbstanlage eines Spielerprofils ohne Einladung und ohne
Betreiberfreigabe:

- **Einfach**: Profil anlegen oder auswählen, kein Spielerpasswort. Der Modus
  ist für den eigenen Rechner und ein vertrauenswürdiges privates Netzwerk
  vorausgewählt.
- **Geschützt**: Bei der Profilanlage wird ein Passwort vergeben; Anmeldung
  und Profilwechsel sind damit geschützt.

Das bisherige Invite-only-Bootstrapmodell ist für das installierte Produkt
nicht der Zielweg. Der aktive Profilname wird vor jedem Spiel deutlich
angezeigt und kann dort gewechselt werden. Ein Browser beziehungsweise Gerät
merkt sich sein zuletzt verwendetes Profil; im geschützten Modus darf der
Benutzer bewusst „Auf diesem Gerät angemeldet bleiben“ wählen.

Spieler dürfen das eigene Profil umbenennen. Eine endgültige Profillöschung
mit ihren persönlichen Zuordnungen erfolgt nur über Maintenance. Gäste
bleiben ohne dauerhaftes Profil und ohne fortgeführte persönliche Statistik;
das anonyme Spiel unterliegt weiterhin der normalen Matchaufbewahrung.

Maintenance kann ohne Neuinstallation zwischen einfachem und geschütztem
Kontomodus wechseln. Beim Wechsel in den geschützten Modus führt ein Assistent
durch die Passwortvergabe für bestehende Profile. Beim Rückwechsel verlangt
Maintenance eine erneute Passwortbestätigung und warnt vor dem anschließend
passwortlosen Profilzugriff. Beide Richtungswechsel widerrufen alle
Spielersitzungen. Vergessene Spielerpasswörter werden ausschließlich über
Maintenance zurückgesetzt, ohne Spiele oder Historie zu löschen.

### Maintenance-Ersteinrichtung

Der Maintenance-Zugang bleibt in beiden Kontomodi eigenständig geschützt.
Das Passwort wird nicht als MSI-Eigenschaft oder Kommandozeilenargument
übergeben. Nach der Installation richtet ein lokaler, geschützter
First-Run-Schritt das Passwort durch zweimalige verdeckte Eingabe über den
bestehenden sicheren Bootstrapweg ein. Die normale Spieloberfläche bleibt
nutzbar; Maintenance bleibt bis zur Initialisierung gesperrt.

## Updates über GitHub Releases

- GitHub Releases ist der einzige Veröffentlichungs- und Updatekanal.
- Der Launcher prüft einmal beim Start, ob eine neuere freigegebene Version
  existiert. Ohne Internet bleibt NETGRID uneingeschränkt nutzbar.
- Standardmäßig werden nur stabile Releases angeboten. In den Einstellungen
  kann „Stabile und Vorabversionen“ aktiviert werden. Maßgeblich ist das
  GitHub-`prerelease`-Flag; Drafts werden ignoriert.
- Ein Update wird nur nach ausdrücklicher Zustimmung heruntergeladen und
  installiert. Vorabversionen erhalten eine zusätzliche deutliche Warnung.
- Vor jeder Updateinstallation wird ein vollständiges, geprüftes Datenbackup
  erzeugt. Eine Vorabversion verwendet dieselbe Installation und denselben
  Datenbestand; ein Downgrade ist nicht zugesichert.
- Läuft NETGRID, warnt der Updater und beendet es kontrolliert. Ein laufendes
  Spiel blockiert das Update, bis es beendet oder das Update abgebrochen wird.
- Nach erfolgreichem Update wird eine zuvor laufende Instanz wieder gestartet.
- Bei einem Fehlschlag werden soweit technisch möglich die vorherige
  Programmversion und das unmittelbar davor erzeugte Datenbackup
  wiederhergestellt. Ist das nicht sicher möglich, bleibt NETGRID gestoppt
  und zeigt einen klaren Reparaturweg statt eines teilaktualisierten Starts.
- Releases enthalten mindestens Versionsangabe, lokalisierte
  Änderungshinweise, Installer und veröffentlichte SHA-256-Prüfsumme. Vor der
  Installation muss der Download gegen die freigegebene Integritätsinformation
  geprüft werden; Codesigning ergänzt dieses Gate später.

## Datenschutz, Diagnose und Support

- NETGRID sendet keine Telemetrie und keine automatischen Fehlerberichte.
  Der einzige automatische externe Kontakt ist die Updateprüfung bei GitHub.
- Der Launcher kann auf ausdrückliche Benutzeraktion ein Diagnosepaket
  erzeugen. Es enthält Versionen, technische Konfiguration und bereinigte
  Protokolle, aber keine Datenbank, Passwörter, Tokens, privaten Kartendaten,
  gespeicherten Spiele oder menschlichen Hidden-Info-Inhalte.
- Das Diagnosepaket wird nie automatisch hochgeladen. Der Benutzer entscheidet
  selbst, ob es einem GitHub-Fehlerbericht beigefügt wird.

## Sprache, Branding und visuelle Qualität

- Setup, First Run, Launcher, Tray-Menü, Update-, Reparatur-, Fehler- und
  Deinstallationsdialoge sind vollständig auf Deutsch, Englisch und
  Französisch verfügbar.
- Die Windows-Sprache wird erkannt; `de`, `en` und `fr` werden direkt gewählt,
  sonst Englisch. Die Sprache kann am Setupbeginn geändert werden.
- Sichtbare Texte verwenden natürliche, korrekt formatierte Sprache, echte
  Umlaute und `ß` im Deutschen, konsistente Terminologie, verständliche
  Fehlerursachen und handlungsorientierte Schaltflächen. Abgeschnittene Texte,
  rohe Logmeldungen, unübersetzte Platzhalter und technisch wirkende
  Provisorien sind Releaseblocker.
- Das vorhandene NETGRID-Windows-Icon wird konsistent für Setup-Datei,
  Startmenü, Desktopverknüpfung, Tray und „Installierte Apps“ eingebunden.
  Setupgrafiken, Abstände, Typografie, Skalierung und Kontrast bilden ein
  zusammenhängendes NETGRID-Erscheinungsbild.
- Visuelle Abnahme erfolgt mindestens bei 100 %, 125 % und 150 %
  Windows-Skalierung sowie mit den längsten Texten aller drei Sprachen. Icon-
  und Dialogdarstellung werden auf hellem und dunklem Windows-Kontext geprüft,
  soweit die verwendete Setuptechnologie dies unterstützt.

## Release-Gates des späteren Installers

Ein Installer ist erst veröffentlichungsfähig, wenn mindestens nachgewiesen
ist:

1. ausschließlich auditierter Produktoutput und freigegebene
   Installerressourcen sind enthalten;
2. Frischinstallation, empfohlener und benutzerdefinierter Weg, Reparatur,
   Upgrade, fehlgeschlagenes Upgrade mit Rollback und Deinstallation bestehen;
3. Programm-/Datenrechte, Secret-Erzeugung, Portkonflikte und beide
   Netzwerkprofile verhalten sich fail-closed;
4. Launcher, Single-Instance, Tray, Startmenü, Desktopoption, kontrolliertes
   Beenden und einmaliger Crash-Recovery funktionieren;
5. Daten bleiben bei Upgrade und Standarddeinstallation erhalten; explizite
   Datenlöschung und Backup/Restore sind geprüft;
6. einfacher und geschützter Kontomodus, First Run, Maintenance-Trennung und
   Sitzungswiderruf bestehen;
7. stabile und Vorab-Releases werden korrekt unterschieden, Downloads geprüft
   und nur nach Zustimmung installiert;
8. sämtliche sichtbaren Flows sind in `de`, `en` und `fr` funktional,
   sprachlich und visuell abgenommen;
9. Lizenz- und Drittanbieterhinweise sind vollständig; für eine breite
   Veröffentlichung ist zusätzlich Codesigning entschieden und geprüft;
10. eine saubere Windows-11-x64-Testmaschine ohne Entwicklungswerkzeuge kann
    NETGRID nach dem Setup out of the box starten und wieder entfernen.

## Bewusst zurückgestellt

- Windows 10, ARM64, MSIX, Microsoft Store und portable ZIP-Distribution;
- Windows-Dienst und Windows-Autostart;
- öffentliche Internetfreigabe, automatischer Reverse Proxy und automatische
  VPN-Einrichtung;
- E-Mail-Recovery, Passkeys, Zwei-Faktor-Authentisierung und öffentliche
  Registrierung;
- automatische Übermittlung von Telemetrie oder Diagnosen;
- Signaturpflicht für die erste private Alpha.
