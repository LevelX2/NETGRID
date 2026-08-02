# Standarddeck-Anleitungen – Paketprozess

Status: aktiv  
Quelle: Nutzerfreigabe vom 2. August 2026

## Zielprüfung

Die Vorgabe ist umsetzungsreif. Alle aktiven Standarddecks sollen eine
kuratierte, aus der bestehenden deterministischen Deckanalyse abgeleitete
deutsche Anleitung erhalten. Fehlende oder veraltete Anleitungen bleiben als
Pflegezustand sichtbar, dürfen aber Build, Serverstart, Deckauswahl und
Spielbetrieb niemals blockieren.

## Gesamtziel

Alle aktiven Standarddecks besitzen eine versionierte, nachvollziehbar an ihre
Deckzusammensetzung und Analysebasis gebundene Anleitung. Der Webclient zeigt
die aktuelle Anleitung über eine Taste neben festen Standarddeck-Auswahlen und
im Standarddeck-Kopierdialog. Fehlende und veraltete Inhalte werden als
„Anleitung fehlt noch“ beziehungsweise „Anleitung muss aktualisiert werden“
kommuniziert. Persönliche Decks und eine noch nicht aufgelöste Zufallsauswahl
erhalten keine Standarddeck-Anleitung.

## Annahmen

- Der aktive Standarddeck-Katalog ist die einzige Bestandsautorität.
- Die bestehende DeckDoctrine-Analyse wird nur gelesen; KI-Verhalten wird nicht
  verändert.
- Guides sind Präsentationsdaten und werden nicht Teil von `DeckSnapshot`,
  Match-State, Replay oder StateHash.
- Ein veralteter Guide wird nicht als aktuelle Anleitung ausgegeben.
- Der eigenständige Guide-Check darf rot werden. `build`, Serverstart und
  Spielbetrieb bleiben davon unabhängig.

## Nicht-Ziele

- Keine dynamische LLM-Texterzeugung zur Laufzeit.
- Keine automatische Anleitung für persönliche Decks.
- Keine Deckänderung, Balanceänderung oder KI-Verhaltensänderung.
- Keine öffentliche Deckstärke-, Win-Rate- oder Rangliste.
- Keine Guide-Daten in Match-, Replay- oder Hidden-Info-Payloads.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Jedes Paket wird geprüft, mit `git diff --check` kontrolliert und separat
  committed.
- Guide-Fehler sind Pflegebefunde, keine Laufzeitblocker.
- Neue Standards ohne Guide bleiben spielbar und zeigen den Missing-Zustand.
- Geänderte Standards mit veraltetem Guide bleiben spielbar und zeigen den
  Stale-Zustand.
- Interne, Test- und Retire-Decks erhalten keine öffentliche Anleitung.
- Erkenntnisse, die KI- oder Deckänderungen erfordern, werden als Follow-up
  dokumentiert und nicht still in diesen Prozess aufgenommen.

## Automatische Fehlerbehandlung

- Fehlendes Guide-Manifest: leerer Guidebestand, Anwendung bleibt lauffähig.
- Beschädigter Guide-Eintrag: nur dieser Eintrag gilt als nicht verfügbar.
- Fehlende Guide-ID: Status `missing`.
- Deck-, Versions- oder Analyseabweichung: Status `stale`.
- Unbekannte Schlüsselkarte oder unvollständiger Text: Status `invalid` und
  in der UI wie aktualisierungsbedürftig behandeln.
- Der Pflegecheck meldet alle Befunde gesammelt und beendet sich ungleich null.

## Sicherheitsblocker

- Ein geplanter Patch würde Guide-Daten in autoritative Match- oder
  Hidden-Info-Verträge aufnehmen.
- Eine Analyse lässt sich nur durch Änderung produktiver KI-Entscheidungen
  herstellen.
- Fremde Änderungen im Arbeitsbereich kollidieren fachlich mit dem Prozess.

Bei einem Sicherheitsblocker wird gestoppt und eine Removal Condition
dokumentiert.

## State Machine

`prepared -> P01 -> P02 -> P03 -> P04 -> P05 -> P06 -> final_verify -> merged -> cleaned -> complete`

Fehlerzustände eines Guide-Eintrags:

`available | missing | stale | invalid`

Nur `available` zeigt den Inhalt. `missing`, `stale` und `invalid` verändern
weder Deckspielbarkeit noch Anwendungslaufzeit.

## Paketfolge

### P01 – Guide-Vertrag und toleranter Pflegecheck

Ziel: Typen, Datenvertrag, Statusermittlung und eigenständigen Check schaffen.

Kernarbeit:

- Präsentationstypen und pure Validierung im Deckpaket.
- Versioniertes Guide-Manifest als Datenquelle.
- Check für Vollständigkeit, Deckbindung, Schlüsselkarten und Analyse-Drift.
- Kein Aufruf des Checks aus `build` oder Serverstart.

Done-Gate:

- Unit-Tests für `available`, `missing`, `stale` und `invalid`.
- Der Check meldet den zunächst unvollständigen Bestand verständlich.
- Deck-, Server- und Buildverträge bleiben unberührt.

Commit: `feat(decks): add tolerant standard deck guide contract`

### P02 – Vollbestand der 43 Anleitungen und Analysebericht

Ziel: Für jedes aktive Standarddeck eine geprüfte deutsche Anleitung liefern.

Kernarbeit:

- Deterministische Strategieprofile für alle aktiven Standards auswerten.
- Deckidee, Spielphasen, Schlüsselkarten, Tipps und Risiken schreiben.
- Plausibilitäts-/Beobachtungsbefunde in einem Reviewbericht dokumentieren.
- Keine Deck- oder KI-Änderung aus Befunden ableiten.

Done-Gate:

- Exakt ein Guide je aktivem Standarddeck.
- Alle Schlüsselkarte-IDs liegen im jeweiligen Deck.
- Der Pflegecheck ist grün; Ghost Circuit wird transparent neutral behandelt.

Commit: `data(decks): curate all standard deck guides`

### P03 – Tolerante Serverauslieferung

Ziel: Guides und Pflegezustände über den bestehenden Standardkatalog liefern.

Kernarbeit:

- Manifest defensiv laden und an Standarddeck-Metadaten binden.
- `available`, `missing`, `stale` und `invalid` ausliefern.
- Snapshots und Hashes unverändert halten.

Done-Gate:

- Fehlende/veraltete Guides blockieren weder Service noch Snapshots.
- API- und Snapshot-Tests sind grün.

Commit: `feat(server): expose tolerant standard deck guide states`

### P04 – Deckauswahl und Guide-Dialog

Ziel: Anleitung bei jeder festen Standarddeck-Auswahl zugänglich machen.

Kernarbeit:

- Gemeinsames Auswahl-View-Model mit Guidezustand.
- Responsiver, tastaturbedienbarer Guide-Dialog.
- Zustände „Anleitung fehlt noch“ und „Anleitung muss aktualisiert werden“.
- Keine irreführende Anleitung für Zufalls- oder persönliche Decks.

Done-Gate:

- Host-, Beitritts- und erweiterte Auswahl profitieren über die gemeinsame
  Komponente.
- Komponenten-/Modelltests und Web-Typecheck sind grün.

Commit: `feat(web): show standard deck guides in match selection`

### P05 – Standarddeck-Kopierdialog

Ziel: Anleitung auch beim Durchsehen und Kopieren eines Standards anbieten.

Kernarbeit:

- Guide-Taste und dieselben Pflegezustände im Kopierdialog.
- Gemeinsame Dialogkomponente ohne doppelte Inhaltslogik.

Done-Gate:

- Wechsel des gewählten Standards aktualisiert Anleitung und Status korrekt.
- Webtests sind grün.

Commit: `feat(web): add guides to standard deck copy flow`

### P06 – Dokumentation und Abschlussverifikation

Ziel: Wartungsvertrag, aktueller Bestand und Verifikation dauerhaft sichern.

Kernarbeit:

- Wissensstatus auf alle aktiven Standarddecks aktualisieren.
- Final Review mit Befunden, Checks und Follow-ups.
- Projektlog nach Relevanzregel ergänzen.

Done-Gate:

- Dokumentation entspricht Runtime und Testvertrag.
- Paketnahe und breite Gates sind dokumentiert grün oder ein echter Blocker ist
  mit Removal Condition festgehalten.

Commit: `docs: close standard deck guide process`

## Verifikationsregeln

Paketnah:

- Deckpaket-Tests und Typecheck.
- Server-Tests für Standardkatalog und Snapshots.
- Web-Modell- und Komponententests.
- Eigenständiger `check:standard-deck-guides`.
- `git diff --check` vor jedem Commit.

Final:

- `corepack pnpm typecheck`
- `corepack pnpm test:contracts`
- `corepack pnpm test:ai:shards`
- `corepack pnpm build`
- fokussierte Browserprüfung über den regulären E2E-/Startpfad mit Firefox,
  soweit ohne Eingriff in die Hauptinstanz möglich.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_STANDARDDECK_ANLEITUNGEN`
- Arbeitsbranch: `codex/standarddeck-anleitungen`
- Integration: lokal nach `main`, bevorzugt Fast-Forward.
- Kein Push und kein Pull Request.
- Vor dem Merge aktuellen `main` in den Arbeitsbranch integrieren, falls nötig.
- Nach erfolgreichem Merge Worktree und gemergten Branch entfernen und beides
  in Git sowie im Dateisystem verifizieren.

## Controller-Prompt-Kern

`/Goal Arbeite den Standarddeck-Anleitungsprozess vollständig und sequenziell
von P01 bis P06 im Worktree C:\Projekte\NETGRID_STANDARDDECK_ANLEITUNGEN auf
Branch codex/standarddeck-anleitungen ab. Committe jedes abgeschlossene Paket,
verifiziere final, merge lokal nach main und entferne Worktree sowie Branch
verifiziert. Fehlende oder veraltete Anleitungen dürfen Tests melden, aber
Build, Serverstart, Deckauswahl und Spielbetrieb niemals blockieren.`

## Abschlusskriterien

- P01 bis P06 sind einzeln verifiziert und committed.
- Alle aktiven Standards besitzen aktuelle Guides oder ein absichtlich
  getesteter Pflegezustand bleibt nicht als Release-Restpunkt offen.
- Guidefehler können den Programmstart und das Spielen nicht blockieren.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptcheckout ist sauber.
- Arbeitsworktree und gemergter Branch sind nachweislich entfernt.
