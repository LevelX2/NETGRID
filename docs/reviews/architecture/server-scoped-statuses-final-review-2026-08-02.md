# Final Review: Serverbezogene Regelzustände

Datum: 2026-08-02

Prozess:
`docs/architecture/server-scoped-statuses-process-2026-08-02.md`

Arbeitsbranch: `codex/server-scoped-statuses`

## Ergebnis

Servergenaue öffentliche Regelzustände besitzen jetzt einen gemeinsamen,
diskriminierten `VisibleServerStatus`-Vertrag in der `PlayerView`. Die
Umsetzung deckt die aktuell belegten Familien ab:

- `run_prohibited` für einen auf genau diesem Server ausgeschlossenen
  Run-Start;
- `cost_modifier` mit `corp_ice_install`, `increase` oder `reduce` für
  servergebundene ICE-Installationskostenänderungen.

Der Webclient rendert beide Familien in einer gemeinsamen Statuszeile. Sichtbar
sind knappe funktionale Labels wie `Run gesperrt`, `ICE-Install +2` oder
`ICE-Install −2`. Der Tooltip nennt die öffentliche Kartenquelle und erklärt
die Wirkung. Kartennamen tragen keine Typen, Funktionen, Status-IDs,
Komponenten oder CSS-Verträge.

## Architektur- und Scopeprüfung

- Die Rules Engine bleibt alleinige Autorität. Die Änderung erzeugt keine
  LegalAction, berechnet keine Kosten im Client und entscheidet keine
  Run-Zulässigkeit in der UI.
- Die Run-Sperre wird weiterhin aus der bestehenden generischen
  Run-Start-Eligibility bezogen.
- Kostenstatus verwenden dieselben aktiven deklarativen
  CardImplementation-Modifier wie die Engine-Projektion. Nur öffentliche und
  eindeutig servergebundene Quellen werden aufgenommen.
- Runnerseitige Erhöhungen und korpseitige Ermäßigungen sind abgedeckt.
- Globale Kostenmodifier werden ausdrücklich nicht an einem einzelnen Server
  angezeigt.
- Verdeckte Runner-Quellen erzeugen keinen öffentlichen Status.
- Echte Fort-Counter wie Pox, Spy und servergebundene Virus-Counter verbleiben
  im `CounterDisplay`-Vertrag.

## Kartenpool-Abgleich

Der aktuelle Kartenpool enthält genau eine aktive Karte mit einem
serverbezogenen Run-Start-Verbot. Sie nutzt den allgemeinen
`server_run_start_restriction`-Vertrag. Für servergebundene
ICE-Installationskosten sind aktuell eine Runnerquelle mit Erhöhung und eine
Korpquelle mit Ermäßigung belegt. Ein globaler Korp-Installationsmodifier dient
als negative Gegenprobe und erscheint nicht als Serverstatus.

Die konkreten Karten bleiben CardImplementation- und Testquellen. Der
Produktionsvertrag selbst enthält keine Karten-ID- oder Titelabfrage.

## Regressionen

- Run-Sperre erscheint für Runner und Korp nur am betroffenen Server und
  verschwindet nach erfüllter Aktivitätsbedingung oder unbekannter Quelle.
- Runner-Kostenaufschlag erscheint nur am gewählten Server und nicht an anderen
  Forts.
- Korp-Kostenermäßigung erscheint nur am Fort der rezzed Quelle.
- Ein globaler Installationskostenmodifier erscheint an keinem einzelnen
  Server.
- Die Webableitung deckt Sperre, Aufschlag und Ermäßigung einschließlich
  Tooltip, Label und Farbton ab.

## Verifikation

- Fokussierte Engine-Auswahl: 5 Dateien, 93 Tests grün.
- Fokussierter Weblauf: 1 Datei, 121 Tests grün.
- Vollständiger Engine-Lauf: 212 Dateien, 1.845 Tests grün.
- Vollständiger Weblauf: 76 Dateien, 759 Tests grün.
- Shared-, Engine- und Web-Typecheck: grün.
- Engine-Build: grün.
- Web-Produktionsbuild: grün.
- `format:changed`: grün.
- `git diff --check`: grün.

Der erste breite Engine-Lauf fand genau eine veraltete Testannahme, die noch
den entfernten Kosten-`CounterDisplay` erwartete. Der Test wurde auf den neuen
Statusvertrag umgestellt und wegen der projektweiten Format-Ratchet in derselben
Datei rein mechanisch nach aktuellem Prettier-Stand formatiert. Der
anschließende vollständige Engine-Lauf ist vollständig grün.

## Restpunkte

Keine fachlichen Restpunkte im freigegebenen Scope. Weitere Statusarten werden
erst ergänzt, wenn eine öffentliche Regelwirkung nachweislich genau einen
Server betrifft. Eine allgemeine Projektion aller Kartenmodifier ist bewusst
nicht Teil dieses Vertrags.
