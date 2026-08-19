# Kartenbildimport IMG06–IMG07

Status: `active`
Stand: 2026-08-19
Primärer Agent: `release-implementation-agent`
Arbeitsbranch: `codex/img06-img07-image-import-packs`
Worktree: `C:\Projekte\NETGRID_IMG06_IMG07_IMAGE_IMPORT_PACKS`

## Quelle und Zielprüfung

Der Projektbetreiber hat die direkte Umsetzung von IMG06 und IMG07 beauftragt.
IMG01 bis IMG05 sind abgeschlossen und stellen den persistenten Bildspeicher,
die katalogbasierte CSV-Zuordnung, Normalisierung, atomare Bindungen und die
ausschließlich lokale Runtime-Auflösung bereit.

Die Vorgabe ist für die automatische Abarbeitung ausreichend präzise. Kleine
technische Lücken werden konservativ geschlossen: Remotezugriffe benötigen
einen eigenen expliziten CLI-/API-Modus, automatisierte Netzwerktests verwenden
kontrollierte Transporte statt fremder Websites, und private Bildpakete sind
zunächst selbstständige lokale Verzeichnispakete. Komfortable Add-on-EXEs
bleiben Teil des späteren Windows-Installer-Pakets.

## Gesamtziel

NETGRID erhält:

- einen ausschließlich während eines expliziten Vorbereitungsimports aktiven
  HTTPS-Quellpfad mit festen Download-, Größen-, Zeit- und Redirectgrenzen;
- fail-closed Schutz vor lokalen, privaten, reservierten und anderweitig nicht
  öffentlichen Netzwerkzielen vor jedem Request und nach jedem Redirect;
- Header-, Byte-, Hash- und dekodierungsbasierte Dateitypprüfung;
- drei private, katalogvollständige Bildpaketprofile für Originalset, Proteus
  und Classic;
- ein manifest- und hashbasiertes lokales Paketformat mit
  Mindest-Importer-Version, lokalem Builder und atomarem Paketimport;
- ausschließlich ignorierte lokale Quell- und Buildverzeichnisse für private
  Bilder und erzeugte Pakete.

Nach einem erfolgreichen Import verwendet die Spielruntime weiterhin nur die
lokalen, normalisierten Assets aus dem bestehenden Store.

## Annahmen

- `printingId` bleibt der kanonische Bildschlüssel.
- IMG06 akzeptiert ausschließlich direkte HTTPS-Bildantworten. HTML-Seiten,
  HTTP, FTP, `file:` und andere Protokolle sind unzulässig.
- Der bestehende lokale Import bleibt ohne Remotezugriff. HTTPS wird nur über
  einen gesonderten expliziten Schalter beziehungsweise CLI-Befehl aktiviert.
- Zulässige Remoteformate bleiben PNG, JPEG und WebP; der tatsächliche
  Bilddecoder entscheidet zusätzlich zum Antwort-Header.
- Ein optionaler SHA-256 bezieht sich auf die unveränderten heruntergeladenen
  Quellbytes.
- Re:Factor darf als manuell gestarteter externer Smoke-Test dienen, wird aber
  weder in automatisierten Tests noch als feste Quelle oder Importliste in
  NETGRID hinterlegt.
- Das erste IMG07-Paketformat ist ein lokales Verzeichnis mit Manifest und
  Bilddateien. Die spätere Add-on-EXE verpackt dasselbe Format, ohne den
  Importkern zu ändern.
- Die Mindestversion ist zunächst eine ganzzahlige
  `minimumImporterVersion`; damit bleibt sie unabhängig von der sichtbaren
  V0-Produktbezeichnung eindeutig prüfbar.

## Nicht-Ziele

- Kein Remotezugriff während Spielbetrieb, Serverstart, Bildauflösung oder
  Browsernutzung.
- Keine LAN-, HTTP- oder WebSocket-API zum Starten eines Imports.
- Kein Crawler, Scraper, HTML-Parser, Quellkatalog oder eingebauter
  Drittanbieteradapter.
- Keine Umgehung von Zugriffsschutz, Robots-Regeln oder Rate Limits.
- Keine versionierten privaten Bilder, fertigen Privatpakete oder
  Drittanbieter-URL-Listen.
- Kein Windows-Hauptinstaller und keine Add-on-EXE in IMG06 oder IMG07.
- Keine Änderung an Engine, GameState, LegalActions, Replay, StateHash, KI
  oder Decklegalität.

## Controller-Invarianten

- Genau ein Paket ist aktiv; IMG07 beginnt erst nach bestandenem IMG06-Gate.
- Jeder Import lädt beziehungsweise liest und normalisiert alle ausgewählten
  Quellen, bevor aktive Bindungen verändert werden.
- Ein Fehler erzeugt keine teilweise aktivierte Sammlung.
- Jeder Redirect wird wie ein neuer Zielrequest vollständig geprüft.
- DNS-Ergebnisse und die tatsächlich verbundene Gegenstelle müssen öffentlich
  zulässig sein; ein einzelnes unzulässiges Ergebnis lässt den Request
  scheitern.
- Größenlimits gelten sowohl für `Content-Length` als auch für tatsächlich
  gestreamte Bytes.
- MIME-Angaben allein legitimieren keine Datei; Decoder und Quellhash bleiben
  maßgeblich.
- Paketpfade sind relativ, normalisiert und dürfen den Paketroot nicht
  verlassen.
- Runtime und Webclient erhalten weder Remote-URLs noch absolute lokale Pfade.

## Automatische Fehlerbehandlung

- Ungültige URL, Protokoll, Zugangsdaten, Port, DNS-Antwort, Netzwerkadresse,
  Redirect, Statuscode, MIME-Typ, Content-Encoding, Zeitüberschreitung,
  Bytegrenze, Hash oder Bilddekodierung brechen IMG06 strukturiert ab.
- Ungültiges Paketschema, unbekanntes Profil, falsche Kartenzahl, fehlende oder
  doppelte `printingId`, falsches Set, zu neue Mindestversion, unsicherer Pfad,
  fehlende Datei oder Hashabweichung brechen IMG07 vor der Aktivierung ab.
- Im Konfliktmodus `skip` werden ausschließlich bereits vorhandene Bindungen
  übersprungen. `replace` ersetzt nur Bindungen; inhaltsadressierte Blobs
  bleiben unveränderlich.
- Scope-fremde Funde werden als Follow-up dokumentiert und nicht still
  umgesetzt.

## Sicherheitsblocker

Der Prozess stoppt, wenn Remoteimport aus Runtime- oder LAN-Pfaden erreichbar
wäre, wenn Requests interne beziehungsweise reservierte Ziele erreichen
könnten, wenn Redirects Prüfungen umgehen, wenn ein Paket Pfade außerhalb
seines Roots lesen kann oder wenn private Assets in Git beziehungsweise CI
gelangen. Removal Condition ist jeweils ein expliziter lokaler, fail-closed
Vorbereitungspfad mit nachgewiesener Ziel-, Pfad-, Inhalts- und Hashprüfung.

## State Machine

```text
prepared -> IMG06 -> IMG07 -> final_verify -> main_sync
         -> main_merge -> cleanup -> complete
```

Bei einem roten Done-Gate verbleibt der Prozess im aktuellen Zustand.

## Fortschritt

- Prozessvorbereitung abgeschlossen und committed.
- IMG06 implementiert: Der lokale Befehl `import` bleibt netzwerkfrei;
  `import-https` verlangt zusätzlich `--confirm-rights`. HTTPS-Requests werden
  auf vollständig geprüfte öffentliche DNS-Ergebnisse gepinnt, jeder Redirect
  wird neu geprüft, und Status-, MIME-, Encoding-, Byte-, Verbindungs- und
  Gesamtzeitgrenzen greifen vor der lokalen Normalisierung und Bindung.
- IMG06-Prüfstand: 31 Kartenbild-Pakettests und Paket-Typecheck grün. Ein
  optionaler produktiver Smoke gegen ein einzelnes Re:Factor-JPG war mit
  100.266 Byte, `image/jpeg` und dem erwarteten SHA-256 erfolgreich; die Datei
  wurde nicht gespeichert oder importiert.
- IMG07 implementiert: Die festen Profile `originalset`, `proteus` und
  `classic` prüfen den aktuellen Katalog auf exakt 374, 154 und 54 Bilder.
  Lokale Vorlagen, Builderausgaben und drei selbstständige Verzeichnispakete
  liegen ausschließlich unter dem ignorierten `card-image-packs`-Root.
  Manifest, Mindest-Importer-Version, Katalogfingerabdruck, sichere relative
  Pfade, reguläre Dateien, Bytewerte und SHA-256 werden vor dem erneuten
  atomaren CSV-/Normalisierungsimport geprüft.
- IMG07-Prüfstand: 37 Kartenbild-Pakettests und Paket-Typecheck grün. Der
  CLI-Smoke erzeugte für `classic` genau 54 Datenzeilen plus Kopfzeile;
  `git check-ignore` bestätigte die lokale Paketausgabe als ignoriert.

## Paketfolge

### IMG06 – HTTPS-Import

Ziel: Der bestehende CSV-Import kann in einem ausdrücklich aktivierten
Vorbereitungsmodus direkte HTTPS-Bilder sicher herunterladen und anschließend
über den unveränderten lokalen Normalisierungs- und Storepfad übernehmen.

Arbeit:

- gesonderten HTTPS-Importmodus in API und CLI einführen;
- URL-, Port-, Credential-, DNS- und IP-Prüfung implementieren;
- Requests an geprüfte DNS-Ergebnisse binden und Gegenstelle kontrollieren;
- Redirect-, Status-, MIME-, Encoding-, Byte- und Zeitlimits durchsetzen;
- optionalen Quell-SHA-256 vor Normalisierung prüfen;
- strukturierte, pfad- und URL-sichere Diagnosen ergänzen;
- kontrollierte Tests für Erfolgsfall, HTTP, interne Ziele, Redirects,
  Dateitypen, Grenzen, Timeout und Hashabweichung ergänzen.

Done-Gate:

- lokaler Import löst weiterhin keinen Remotezugriff aus;
- HTTPS funktioniert nur mit expliziter Aktivierung;
- interne/reservierte Ziele und unsichere Redirects scheitern vor
  Inhaltsübernahme;
- alle Limits und Dateitypprüfungen sind fokussiert getestet;
- ein Fehler aktiviert keine Bindung;
- Pakettests, Paket-Typecheck, Paketgrenzen und `git diff --check` sind grün.

Commit: `feat(card-images): add hardened https import`

### IMG07 – Drei private Bildpakete

Ziel: Vollständige private Bildbestände lassen sich lokal als drei
kataloggebundene, selbstprüfende Pakete bauen, übertragen und importieren.

Profile:

- `originalset`: Set `originalset-v1`, exakt 374 Bilder;
- `proteus`: Set `proteus`, exakt 154 Bilder;
- `classic`: Set `classic`, exakt 54 Bilder.

Arbeit:

- versioniertes Verzeichnisformat und Manifestvertrag definieren;
- Profile aus dem aktuellen Katalog prüfen und exportieren;
- lokalen Builder aus einer vollständig ausgefüllten lokalen CSV-Zuordnung
  bereitstellen;
- Dateien deterministisch kopieren und Quell-SHA-256, Bytes und relative
  Pfade manifestieren;
- Paketimport mit Schema-, Profil-, Mindestversions-, Katalog-, Pfad- und
  Hashprüfung auf den bestehenden atomaren Importkern setzen;
- Quell-/Buildroot fest unter ignorierten lokalen Verzeichnissen auflösen;
- CLI, Beispielablauf, `.gitignore` und synthetische Tests ergänzen.

Done-Gate:

- die drei Profile entsprechen nachweislich 374/154/54 aktuellen
  Katalogeinträgen;
- unvollständige, zusätzliche oder veränderte Pakete scheitern fail-closed;
- ein gültiges synthetisches Paket lässt sich bauen, übertragen und atomar
  importieren;
- Builderausgaben und private Bilder sind im Repository ignoriert;
- CI benötigt keine privaten Assets;
- Pakettests, Paket-Typecheck, Paketgrenzen und `git diff --check` sind grün.

Commit: `feat(card-images): add private image pack workflow`

## Verifikationsregeln

- Während eines Pakets läuft zuerst der engste relevante Vitest-Pfad.
- Typoberflächenänderungen erfordern den Typecheck von
  `@netgrid/card-images`.
- Paketgrenzen werden nach jedem Paket geprüft.
- Vor jedem Commit läuft `git diff --check`; gestaged werden ausschließlich
  paketzugehörige Änderungen.
- Vor dem Main-Merge laufen alle Kartenbildtests, Paket-Typecheck und Build,
  Paketgrenzen sowie ein lokaler CLI-/Paket-Smoke-Test mit synthetischen
  Bildern.
- Fremde Websites sind kein verpflichtendes Gate. Ein Re:Factor-Aufruf bleibt
  optional, manuell und nicht reproduktionskritisch.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_IMG06_IMG07_IMAGE_IMPORT_PACKS` auf Branch
  `codex/img06-img07-image-import-packs`.
- Der Hauptcheckout wird ausschließlich für den finalen lokalen Merge genutzt.
- Prozessvorbereitung, IMG06, IMG07 und final rückgeführtes Wissen erhalten
  jeweils klar abgegrenzte Commits, soweit Änderungen anfallen.
- Vor dem Merge wird aktuelles `main` intentionswahrend in den Arbeitsbranch
  integriert und anschließend erneut geprüft.
- Bevorzugt wird ein Fast-forward-Merge nach lokalem `main`.
- Nach erfolgreichem Merge werden Worktree und gemergter Branch entfernt und
  in Git sowie im Dateisystem verifiziert.
- Kein Push, Pull Request oder sonstige Remoteintegration.

## Controller-Prompt-Kern

```text
/Goal Arbeite IMG06 und IMG07 vollständig und sequenziell ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main. Lies AGENTS.md, die
paketlokalen Vorgaben und dieses Prozessartefakt. Arbeite ausschließlich im
festgelegten Worktree und immer nur am aktiven Paket. Führe dessen Checks aus,
committe es vor dem nächsten Paket und stoppe bei einem Sicherheitsblocker
fail-closed. Integriere danach aktuelles main, verifiziere final, merge lokal
nach main und entferne Worktree sowie Branch erst nach nachgewiesen sauberer
Integration.
```

## Abschlusskriterien

- Prozessvorbereitung sowie IMG06 und IMG07 sind getrennt nachvollziehbar
  committed.
- HTTPS-Import ist explizit, begrenzt, SSRF-gehärtet und getestet.
- Drei private Paketprofile, Builder und Import sind lokal vollständig
  nutzbar und getestet.
- Keine privaten Bilder oder Buildausgaben sind versioniert.
- Der Arbeitsbranch ist lokal nach `main` integriert und `main` ist geprüft.
- Worktree und gemergter Branch sind verifiziert entfernt.
- Offene Punkte beschränken sich auf spätere Windows-Installer- und
  Add-on-EXE-Arbeit.
