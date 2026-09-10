# CODEX_STATUS

Stand: 2026-09-09

## Einstieg

Für den aktuellen Projektstand gelten in dieser Reihenfolge:

1. `docs/architecture/README.md`
2. `docs/architecture/engine/README.md`
3. `docs/architecture/ai/README.md`
4. passende `docs/runbooks/` und `docs/activities/`
5. paketlokale `AGENTS.md`, Code, Tests und ausführbare Gates

Historische Statuschroniken, abgeschlossene Releasepakete, Prozesse und Reviews werden nicht als zweite Steuerungsschicht im Arbeitsbaum gepflegt. Dafür reicht die Git-Historie.

## Produktstand und Version

NETGRID ist eine private Version-0-Webanwendung mit deterministischer Rules Engine, lokalem/private-LAN-Multiplayer, SQLite-Storage, Deckbibliothek, Kartenkatalog, Replay-/Undo-Grundlage, Human-vs-Human, Human-vs-KI und KI-vs-KI-Analysepfaden.

Die sichtbare Produktversion ist `V1.0`; die fortlaufende technische
Buildkennung wird aus `git rev-list --count HEAD` ermittelt. Veröffentlichte
Stände verwenden technisch `1.0.<Buildnummer>`. Die private
Vorproduktionsumgebung erhält dadurch allein noch keine öffentliche Support-
oder Rückwärtskompatibilitätszusage. Führend ist
`docs/decisions/product-version-and-build-identification-2026-07-17.md`.

Es gibt derzeit keine dauerhaft führende monolithische Release-Roadmap. Aktuelle Arbeit wird über `docs/activities/inbox/`, `docs/activities/in-progress/`, den Current-State-Status und bei Bedarf einen explizit aktuellen Scope-/Releaseplan gesteuert. Nach Abschluss wird die historische Release-Evidence entfernt.

Die Engine ist alleinige Regelautorität. UI, Server und KI reichen nur angebotene `LegalActions` ein; die Engine revalidiert Zustand, Kosten, Ziel, Choice und Legalität vor der Ausführung. Hidden-Info-Schutz, Replay, StateHash und seedbasierter Zufall bleiben verbindliche Grenzen.

## Engine und Karten

Originalset, Classic und Proteus sind technisch spielbar. Kartenspezifische Autorenwahrheit wird über die zentrale CardSpec-Architektur konsolidiert.

Bezahlbare Assets und Upgrades können in der Corp-Hauptphase auch nach der
letzten Aktion gerezzt werden, bis die Corp den Zug tatsächlich beendet.
Der Null-Klick-Zweig verwendet dieselbe Root-Rez-Kostenquote. Bel-Recycling
gegen Deckout und Remote Facilitys sofortige Extra-Aktion sind regressionsgeprüft.

Das interne `testset` ist im normalen Laufzeitprofil deaktiviert. Es wird in
Katalog, Deckdaten und Matchaufbau nur mit
`NETGRID_ENABLE_TEST_CARDS=true` angeboten; auch der nicht verlinkte
`/tutorial`-Prototyp ist daran gebunden. Generische technische Identitäten
liegen im separaten aktiven Systemset. Produktive Engine-, Server- und KI-Defaults
verwenden echte Originalset-Decks, während die synthetischen Demo-Decks nur
noch als explizite Mechanik-Fixtures in internen Tests bestehen.

Der CardSpec-Migrationsprozess CS00 bis CS13 ist abgeschlossen und integriert. Aktuell gilt:

- `@netgrid/cards` ist die zentrale kartenspezifische Autoren- und Projektionsschicht;
- `@netgrid/cards/engine` liefert der Engine mechanische CardImplementation-, Runtime- und Source-Ref-Projektionen;
- `packages/engine/src/card-implementations/registry.ts` besitzt keine zweite manuelle Autorenregistry;
- Coverage ist Metadaten-/Auditlogik und bezieht Implementierungs-, Runtime- und Source-Informationen aus CardSpec;
- die Rules Engine bleibt alleinige Autorität für Legalität und Ausführung.

Führend:

- `docs/architecture/central-card-specification-and-registry-target-state-2026-08-09.md`
- `docs/architecture/engine/README.md`
- `packages/engine/AGENTS.md`

## KI

R&D-Zugriffsfallen mit kostenloser Rez-Rückmischung besitzen jetzt eine
exakte Install-/Rez-Linie im bestehenden Ambush-Owner, einschließlich
begrenztem verdecktem Halten und Schutz reservierter Agenda-Orte. Defense
bindet geeignete geschützte Köder an eine finanzierbare ICE-/Encounter-Folge;
Economy schließt den begrenzten Bedarf. Geschlossene Rez-Fenster sind eine
verbindliche Planungsgrenze. Bei bereits leerem R&D bindet Ambush die legale
Install-/Rez-Rettung als dringliche Bedrohungsantwort vor gewöhnlicher
Score-Finanzierung; nach Auffüllen entfällt dieser aktuelle Nachweis. Der
Cleanup bewertet den Nutzen von Archives-Zugriffsfallen am tatsächlichen
Abwurfziel. Unabhängige Ambush-Vorbereitung löscht keine fremden
Agenda-Finanzierungsbedarfe mehr. Eigenständige Trace-Tag-Quellen erhalten
eine Engine-Quote mit kleinstem ausreichendem Gebot und gebundener Trace-
Fortsetzung. Vollständig mit Agendas überfüllte HQ darf Score durch eine
begrenzte verdeckte Score-Linie entlasten. Installierte ungerezzte Counterbanken
können für einen exakten Defense-Verbraucher profitabel vorbereitet werden;
die Zahlungsquote unterstützt mehrere nötige Counterauszahlungen. Der mehrzügige Contract-Aufbau aus HQ bleibt offen. Aktuelle Fort-Pass-
Verteidigung und variables Trace-ICE sind ausführbar; Runner unterscheidet
Gebühr und Run-Abbruch. Der Ambush-Owner bindet bezahlte Zugriffseffekte an
die private Engine-Choice und lehnt nachweislich leere Icebreaker-Counter-
Zahlungen ab. Kontrolle 415 umfasst 40 saubere Originalspiele und 40 getrennte
BBS-Variantenspiele. Corp-Siege 3 → 3, mittlere Punkte
1,20 → 1,53; derselbe Niederlagen-Satz wird separat verglichen.
Die Standardliste bleibt unverändert. Score-Finanzierung, Agenda-Risiko,
Contract-Erstaufbau und die Bluff-Mischung bleiben begrenzt abgenommen.
Ergebnisse und Testgrenzen stehen in
`docs/architecture/ai/hidden-node-capability-review.md`.

Die Corp erzeugt aus fehlenden HQ-Agendas keinen blinden Agenda-Suchauftrag.
Vorhandenes Handpotenzial, Economy und Defense werden ohne diesen künstlichen
Score-Parent entwickelt. Passives Runner-Einkommen nach erfolgreichen Runs
und begrenzte Corp-Guthaben werden mit Kosten, Reserven und begrenztem
Amortisationshorizont bewertet. Führend sind die [Runner-Entwicklung](../architecture/ai/runner-plan-contracts.md#5-runnerdevelop_board_and_hand)
sowie [Corp-Scoring](../architecture/ai/corp-plan-contracts.md#2-corpscore_agenda)
und [Corp-Economy](../architecture/ai/corp-plan-contracts.md#6-corpeconomy).

Die produktive KI ist Plan-first. Residente Planinstanzen, side-spezifische Scheduler, TurnPlanner, Commitment/Execution Lease, Kampagnenfortsetzung und eng gebundene Choice-Auflösung bilden den aktuellen Entscheidungsweg. Doctrine, Hints, Sensoren und Quotes liefern Information; sie besitzen keine parallele Action-Autorität.

Führend:

- `docs/architecture/ai/README.md`
- `docs/architecture/ai/target-architecture.md`
- `docs/architecture/ai/planning-architecture.md`
- `docs/architecture/ai/turn-campaign-planner.md`
- `docs/architecture/ai/change-compass.md`
- `packages/ai/AGENTS.md`

Weitere KI-Arbeit ist überwiegend Play-Strength- und Modulerweiterung. Neue Beobachtungen werden als kleine Activities und Regressionstests geführt, nicht als neue globale Heuristikschicht oder dauerhafte Reviewchronik.

Die aktuellen Grenzen von zweckgebundener Corp-Finanzierung und
zonenspezifischer Fallen-Vorbereitung sind in
`docs/architecture/ai/hidden-node-capability-review.md` abgegrenzt. Der
charaktererhaltende Hidden-Node-Vergleich begründet derzeit weder einen
Standarddeck-Tausch noch pauschale KI-Boni; die Originalliste bleibt
unverändert. Im aktiven Capability-Paket entsteht eine eng gebundene
zweckgebundene Economy-Finanzierung mit Rückgabe an den tatsächlichen
Verbraucher. Auszahlung → tatsächlicher Economy-Rez sowie Auszahlung →
Defense-Rez mit erhaltenem Parent und beendetem Support sind geprüft, letzteres
auch mit Mobile Barricade im unveränderten Original-Corpdeck. Ein bereits
rezzed und erschöpfter Contract wird für einen endlichen terminalen ICE-Rez-
Bedarf aufgeladen, bei Bedarf um einen allgemeinen Credit ergänzt und über
den Zugwechsel in Auszahlung/Rezzing überführt. Bedarf und Quelle werden
nach jedem Schritt neu geprüft; gespeicherte Counter sind keine Liquidität.
Erstinvestition und weitergehende Verbraucher bleiben begrenzt. Der 70er-
Vergleich vor dem abschließenden Main-Abgleich ergibt 0→1 Corp-Siege,
42→45 Corp-Punkte und 57→56 Nullscore-Niederlagen bei gültigen Replays ohne
Runtimefehler. Die neue Contract-Vorbereitung wurde darin nicht ausgewählt;
dieser kleine gemischte Systemeffekt ist kein allgemeiner Stärkennachweis.
Die Current-State-Review grenzt vorbereitete Capability-Fixtures von
Spielevidence und dem Integrationsstand ab. Die ehemals offenen 18
Main-Baseline-Erwartungsfehler waren veraltete Testbindungen an historische
Einzelaktionen, absolute Simulationspositionen und Vollspielstände. Sie sind
gegen die aktuellen Owner-, Executor-, Capability-, Legalitäts- und
Replayverträge neu gebunden. Der lokale Gesamttest vom 2026-09-08 ist vollständig
grün: 5.215 AI-Tests in 619 Dateien über drei feste Shards, 3.777 Tests der
übrigen Pakete, acht Spec-Tests, sieben Selfplay-Evidence-Tests und 15 E2E-Tests.
Discovery, AI-Strukturgates, Paketgrenzen, Typechecks und Gesamtbuild sind
ebenfalls bestanden. SP-082-Finanzierung, R&D-Protocol-Ordering und Test Spin
verwenden jetzt gezielt hergestellte Engine-Pfade statt vorausgesetzter
Vollspielverläufe. Dabei wurde zusätzlich ein echter Test-Spin-Fehler behoben:
direktes Ausspielen, Such-Choice, Coverage-MU-Freigabe und Runstart-Ordering
erhalten denselben exakt gebundenen Ursprung. Fehlende oder fremde Bindungen
bleiben fail-closed; Replay und StateHash sind für die Pfade geprüft.
Der E2E-Runner wartet nach Prozessende begrenzt auf die Dateifreigabe durch
Windows; ein dauerhaft gesperrtes Artefakt lässt den Befehl weiterhin scheitern.
Die finale unveränderte 40-Spiele-Population
der Metaserie enthält 10.851 Entscheidungen ohne technische Audit-Flags;
die 707 angewandten Choices sind gegen die LegalActions geprüft.
Für wachsende Kataloge und
Verhaltenssimulationen gilt der stabile Testvertrag aus
`docs/architecture/test-tiers-and-package-boundaries-2026-07-10.md`.

Historische Selfplay-Cycle-Reviews, Markdown-Matrix, Reporting-State und
versionierte HTML-Blockberichte wurden nach dem abschließenden idempotenten
Import vom 2026-08-30 entfernt. Führend sind die lokale SQLite-Registry, ihre
Sicherungen und `docs/runbooks/ai-selfplay-evidence-registry.md`.

Die Express-Shutdown-Metaserien (Registry-Paarungen 387, 395, 396) begründen
keinen automatischen Standarddeck-Tausch. Der Killkern konvertiert tatsächlich;
offene Arbeit betrifft geschützte Scorelinien, Archives-Schutz gegen sichtbare
HQ-Umleitung und rechtzeitige Runner-Vorsorge. Eine mögliche verdeckte
Tagabwehr ist weder eine sichere Abwehr noch ein garantierter Kill:
Versuchskosten und alternative Gewinnlinien bleiben gemeinsam zu bewerten.
Die verifizierten SP-251/252 korrigieren lokale Run-Dispositionsgrenzen und
die Engine-Trennung von Ressourcenpool und gedeckeltem Ausgabenbudget;
`planning-architecture.md` hält diese bestehenden Owner-Grenzen fest.
Die fokussierte Integration bestätigt beide Fixes und einen vollständig
aktions-/owner-/ressourcengleichen Exact-Replay. Die drei damals
mitgeprüften älteren Score-Erwartungen sind im aktuellen Testvertrag anhand
der verantwortlichen Root-/Support-Owner statt historischer Leaf-Aktionen
abgedeckt.

## Plattform und Betrieb

Aktuelle Betriebs- und Wartungsverträge liegen unter `docs/runbooks/`:

- `account-alpha-operations.md`
- `maintenance-control-plane.md`
- `netgrid-local-transfer.md`
- `windows-release-output.md`

Ein installerneutraler Windows-x64-Produktoutput ist vorbereitet. Er trennt
statische Produktdaten, Entwicklungs-/Testbestände und veränderliche lokale
Daten durch einen positiven Releasevertrag. Web und Server laufen aus dem
geprüften Output mit einem externen `NETGRID_DATA_ROOT`; interne Testkarten,
Demo-Snapshots, Testspiele, Selfplay-Evidence und Entwicklungsdatenbanken
werden nicht ausgeliefert. Führend sind
`docs/architecture/windows/windows-release-boundary.md` und das zugehörige
Runbook. Ein auf .NET SDK 10.0.302 und WiX 7.0.0 gepinntes MSI-/Setup-
Installerskelett baut ausschließlich den auditierten Produktoutput, erfasst
die Runtime-Lizenzen und prüft die extrahierte Payload vollständig gegen das
Produktmanifest. Die offizielle Node.js-24.20.0-x64-Laufzeit und eine
selbstenthaltene .NET-Komponente richten einen validierten lokalen Datenroot,
geschützte Runtimekonfiguration, intern erzeugtes Tokensalz und getrennte
ACLs idempotent ein; Standarddeinstallation und Reparatur bewahren bestehende
Daten. Der selbstenthaltene Tray-Launcher startet Server und Webclient bei
Bedarf, verwendet eine Instanz, öffnet Spiel oder Maintenance, stoppt den
Server geordnet und versucht nach einem Prozessabbruch genau eine
Wiederherstellung. Startmenü und optionale Desktopverknüpfung sind im MSI
gebunden. Der selbstenthaltene Setup-Assistent bindet das eingebettete MSI per
SHA-256, führt durch voreingestellte oder benutzerdefinierte Werte und fragt die
Local-/Private-LAN-Freigabe ausdrücklich ab. Ports werden vor der Erhöhung
geprüft; LAN-Firewallregeln gelten ausschließlich im Windows-Profil „Privat“.
Die gewählte Spielaufbewahrung initialisiert die bestehende Storage-Policy
einmalig, ohne spätere Maintenance-Änderungen zu überschreiben. Der
selbstenthaltene First-Run-Assistent übergibt das zweimal verdeckt eingegebene
Maintenance-Passwort nur per stdin an die bestehende Authentifizierungs-CLI
und verweigert jede Überschreibung vorhandener Credentials. `simple` und
`protected` bleiben die einzige Account-Policy-Autorität; Private-LAN-
Self-Service ist freigegeben, während Maintenance und Policyverwaltung auf
Loopback bleiben. Der Launcher prüft ausschließlich GitHub Releases und bietet
Updates erst nach Zustimmung an. Release-Metadaten und Prüfsummendatei müssen
denselben SHA-256-Wert nennen; laufende Partien blockieren die Installation.
Nach kontrolliertem Stopp erzeugt der getrennte Updater inzwischen einen
geprüften Live-Datenroot-Snapshot einschließlich Decks, getrennter Kontendaten,
Sidecars und Kartenbildern; historische Backups und Installer-Caches sind
ausgeschlossen. Credentials und Runtimekonfiguration werden beim Restore
nicht überschrieben. Der Updater führt das MSI-Upgrade aus und startet erst
nach Healthcheck neu. Der neue Sicherungspfad ist komponentenweise geprüft;
direkte MSI-Versionswechsel sind inzwischen an denselben Snapshot-/Restore-
Owner und den gebundenen Verifier angeschlossen. Ihre Prüfung liegt vor dem
MSI-Transaktionsabschluss. Prozessverlust von Prüfer, MSI-Client,
Custom-Action-Host und Windows-Installer-Dienst sowie die gebundene Übernahme
verwaister Leases sind inzwischen in der isolierten Windows-11-Sandbox nativ
geprüft. Der native Vorintegrationskandidat 1.0.8226 besteht außerdem den
Bestands-Reparaturablauf einschließlich erhaltenem Maintenance-Zugang,
Healthcheck und Abschlussstart. Nach defensiver Integration des aktuellen
lokalen `main` ist der saubere Kandidat 1.0.8379 mit dynamischer Server-
Buildinformation und 10.909 vollständig auditierten Payload-Dateien gebaut;
alle lokalen Windows-Komponenten- und UI-Gates sind grün. Die bestätigte
native Bestandsreparatur auf 1.0.8379 ist ebenfalls grün: Setupabschluss,
echter MSI-Fortschritt ohne Überlagerung, erhaltener Maintenance-Zugang,
Abschlussstart sowie Client- und Server-Buildidentität sind belegt. Eine neue
saubere Offline-Sandboxmatrix belegt zusätzlich Standard-/Custom-
Frischinstallation, 8226→8379-Upgrade, Cache-Repair, Rückwechsel,
Deinstallation, Datenerhalt und ausdrückliche Datenlöschung in 16 grünen
Prüfbereichen. Das veröffentlichte GitHub-Prerelease 1.0.8379 wurde vom
installierten 8226-Launcher korrekt gefunden, geladen und hashgeprüft. Der
echte Lauf deckte vor jeder Produktmutation eine zu enge Neustartprüfung auf:
Der nicht erhöhte gefilterte Sandbox-Administrator wurde wegen
`TokenElevationTypeLimited` abgewiesen. Der Fix lässt Default und den nicht
erhöhten Limited-Kontext zu, hält Full und alle übrigen Sicherheitsgrenzen
weiterhin geschlossen und besteht 42 fokussierte native Prüfungen. Der daraus
erzeugte Kandidat 1.0.8383 besteht sämtliche Windows-Buildgates und wurde in
einer neuen Sandbox erfolgreich eigenständig installiert; die überarbeitete
Ersteinrichtungsentscheidung erscheint wie vorgesehen. Der gehärtete Updater
lehnt den historischen synthetischen Rollback-Harness vor jeder
Produktmutation korrekt ab; sein produktiver
Rollbacknachweis bleibt deshalb an den echten Launcher- und GitHub-Flow
gebunden. Als letzter lokaler Produktnachweis steht der echte GitHub-Updateweg
von 1.0.8383 auf einen höheren korrigierten Build aus; die Probe auf einem
getrennten Zielrechner folgt danach. Bei Fehlern werden Programm und Daten
soweit sicher möglich zurückgerollt,
andernfalls bleibt NETGRID klar diagnostiziert gestoppt. Alle Windows-
Oberflächen verwenden eine gemeinsame vollständige Sprachquelle für Deutsch,
Englisch und Französisch sowie das NETGRID-Icon. Die 3×3-Setup-Renderprüfung
deckt alle Sprachen bei 100, 125 und 150 Prozent ab. Der Launcher erzeugt auf
Nutzeraktion ein lokales, redigiertes Diagnose-ZIP ohne Datenbanken, Spiele,
Credentials, Tokens oder private Kartenbilder. Die installerunabhängigen
Produktvoraussetzungen sind umgesetzt: Releasebuilds tragen `V1.0` plus
fortlaufende Git-Buildnummer, die gespeicherte Retention-Policy wird beim
Backend-Start sofort asynchron geprüft, und lokale Installationen können ohne
zweites Accountmodell zwischen einfachem und geschütztem Spielerzugang
wechseln. Der Entwicklungsstart bleibt standardmäßig `invite_only`; der
Windows-Releaseoutput erhält `simple` als Ausgangswert. Das beschlossene Zielbild umfasst einen
klassischen per-machine Installer mit empfohlenem und benutzerdefiniertem
Setupweg, mitgelieferter Node-Laufzeit, bedarfsgestartetem Tray-Launcher,
lokalem oder Private-LAN-Betrieb, getrennten einfachen/geschützten
Spielerprofilen, sicherer Maintenance-Ersteinrichtung, GitHub-Updates nach
Zustimmung, Datensicherung/Rollback sowie vollständigem `de`/`en`/`fr`-
Branding. Führend sind
`docs/architecture/windows/windows-installer-product-contract.md` und der
Paketprozess WIN-I00 bis WIN-I08. GitHub Releases bleibt der einzige Kanal;
der Updater verwendet keinen weiteren Feed, Store oder eigenen Updateserver.

Der persönliche Kartenbildimport besitzt einen persistenten lokalen Store,
lokale und explizite gehärtete HTTPS-Quellen sowie drei private
Verzeichnispaketprofile für Originalset, Proteus und Classic. Runtimepfade
bleiben vollständig netzwerkfrei; private Quellen und Paketausgaben sind aus
Git, CI und Hauptinstaller ausgeschlossen. Die lokale Maintenance-Oberfläche
unter `/maintenance/card-images` stellt Bestandsprüfung, Vorlagen, Prüfläufe,
Importe und Paket-Builds über eine verwaltete relative Inbox bereit. Sie ist
Loopback-only; mutierende Jobs verwenden die bestehende authentifizierte
Maintenance-Sitzung mit CSRF-/Origin-Prüfung ohne zweite Passworteingabe.
Führend ist
`docs/architecture/card-images/personal-card-image-import.md`.

Öffentliche Matchlisten innerhalb der privaten Anwendung, accountgebundene persönliche Historie, Live-Zuschauer und terminale Lern-Replays sind umgesetzt. Neue Plattformarbeit wird als aktueller Scope geführt und nach Integration in Status, Architektur, Entscheidung oder Runbook zurückgeführt.

## Aktuelle Arbeit

- `docs/activities/inbox/`: offene kleine Findings und Nacharbeiten.
- `docs/activities/in-progress/`: aktuell beanspruchte Pakete.
- `docs/activities/done/`: nur kurzlebiger Abschluss-Slot; abgeschlossene Einzelpakete werden nach Rückführung des Ergebnisses entfernt.
- Die CardSpec-Umstellung ist technisch abgeschlossen; aktuelle Karten-/KI-Arbeit baut auf diesem Vertrag auf.
- Die Dokumentationsbereinigung folgt dem Current-State-Prinzip und entfernt historische Prozess-, Review- und Release-Evidence ohne aktuellen Vertrags- oder Gate-Nutzen.

## Zentrale Gates

Je nach Änderungsscope sind insbesondere relevant:

- Engine-Typecheck und paketnahe Engine-Tests;
- `corepack pnpm check:engine-source-structure`;
- `corepack pnpm check:engine-source-structure:selftest` bei Strukturguard-Arbeit;
- `corepack pnpm check:ai` und die einschlägigen AI-Struktur-/Hint-Gates bei KI-Änderungen;
- Releasegrenzen über `check:release-boundary`,
  `build:windows-release-output` und den isolierten
  `smoke:windows-release-output` bei Änderungen am Produktoutput;
- Replay-, StateHash-, Hidden-Info- und deterministische Zufallstests bei betroffenen Enginepfaden;
- `git diff --check` vor Abschluss eines Änderungsschnitts.

Vollständige Testshards werden nach Wirkung und vereinbartem Integrationscheckpoint eingesetzt; kleine Diagnosefixes beginnen mit dem engsten reproduzierenden Test.

## Dokumentationsregel

Führende Dokumente beschreiben den heutigen Architektur-, Produkt-, Gate- oder Betriebszustand. Abgeschlossene Implementierungsprozesse, Releasepakete, Reviews, Zwischenstände, Benchmarks, Replay-/Trace-Rohdaten und alte Statuschroniken werden nicht vorsorglich konserviert. Git-Historie übernimmt die historische Nachvollziehbarkeit.

Retention: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
