# GitHub-Fehlermeldungen aus NETGRID

**Status** · Geplanter Umfang für V1.0

Spieler erstellen im Browser einen lokalen ZIP-Fehlerbericht und reichen ihn
selbst im öffentlichen Issue-Tracker von NETGRID ein. Das ist der einzige
vorgesehene Meldeweg. Er funktioniert auf eigenen und fremden Spielservern
sowie im NETGRID-Gastmodus. Für den Export braucht der Browser keinen
GitHub-Zugang. Zum Öffnen und Einreichen des Issues braucht der Spieler
Internetzugang und ein GitHub-Konto.

## Bedienung im Spiel

1. **Fehler melden** in der Match-Topbar übernimmt den letzten bestätigten
   Stand der eigenen Partie in den Melde-Dialog. Aus den Optionen öffnet derselbe
   Dialog einen allgemeinen Bericht. Bei unterbrochener Matchverbindung zeigt
   der Dialog, welche Angaben noch vorliegen und von welchem Stand sie
   stammen. Die Partie und ihre Uhr laufen weiter.
2. Der Spieler kann Beobachtung, Erwartung und Schritte zum Nachstellen
   ergänzen. NETGRID erfasst die technischen Daten und die Spielersicht
   automatisch.
3. **Fehlerbericht speichern** lädt das ZIP direkt herunter. Mit
   **Kurztext kopieren** kann der Spieler dieselbe Fehlerbeschreibung und die
   wichtigsten Versionsangaben als durchsuchbaren Text ins Issue übernehmen.
4. **GitHub-Issue öffnen** führt mit einem festen Link zum Issue-Formular von
   LevelX2/NETGRID. Der Link unterdrückt den Referrer. Der Spieler fügt die
   ZIP-Datei an und veröffentlicht das Issue. Der NETGRID-Dialog bleibt dabei
   geöffnet. [GitHub-Dateianhänge](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
   [Issue auf GitHub erstellen](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue)
   [NETGRID-Issue-Tracker](https://github.com/LevelX2/NETGRID/issues)

## Inhalt des ZIP-Fehlerberichts

| Datei | Inhalt |
| --- | --- |
| `FEHLERBERICHT.md` | Beschreibung des Spielers, erwartetes und beobachtetes Verhalten, Schritte zum Nachstellen, Zeitpunkt, Versionsübersicht, Liste der enthaltenen Daten und bekannte Lücken |
| `umgebung.json` | Berichtsformat, Produktversion, geladene Web- und Server-Buildkennung, eindeutige Kennung des Kartenkatalogs, Locale, Verbindungsstatus und letzter bekannter öffentlicher Fehlercode. Für Darstellungsfehler Browserfamilie und Größe des sichtbaren Bereichs. |
| `spielstand.json` | Spielmodus, Seite, Zug, `stateVersion`, `matchVersion`, Phase, Run-Schritt, sichtbare Ressourcen und Zähler sowie die Karten, die der meldende Spieler kennt. Dazu gehören eigene Hand, eigene verdeckte Installationen, für diese Seite offengelegte gegnerische Karten, sichtbare Aktionen und offene Auswahlen. Die eigene Deckliste kann aufgenommen werden, wenn sie aus der für diese Partie bestätigten Deckwahl verfügbar ist. |
| `chronik.json` | Geordneter Ausschnitt der letzten bis zu 100 bestätigten Aktionen und Effekte, die der meldenden Seite angezeigt wurden. Enthalten sind auch für diese Seite sichtbare private Schritte, etwa eine eigene Auswahl oder das Aufdecken einer Karte. Der abgedeckte Bereich und bekannte Lücken sind angegeben. |

Allgemeine Berichte enthalten Beschreibung und Umgebung. Partieberichte
binden Spielstand und Chronik an dieselbe zuletzt bestätigte Matchansicht.
Nach Reconnect, Undo oder Matchwechsel stammen neue Berichte aus der dann
bestätigten Ansicht und deren Chronik. Bereits geöffnete Berichte behalten
ihren Stand. Der Standardbericht nutzt die Sicht der meldenden Seite für
bekannte Karten, sichtbare Ereignisse und angebotene Auswahlen. Für den
Spieler unbekannte Karten und Deckreihenfolgen können mit der beim Start
erteilten Freigabe hinzukommen. Interne Replay-Rohdaten, Zugangsdaten, rohe
Event- und Match-IDs, Serverlogs und privilegierte KI-Debugdaten bleiben auf ihren
bestehenden Diagnosepfaden.
[Ereignisprojektion und Sichtbarkeit](../engine/public-event-payload-architecture.md)
[Versions- und Buildvertrag](../../decisions/product-version-and-build-identification-2026-07-17.md)

## Kennungen und Versionsbindung

Kartendefinitionen verwenden die vorhandene numerische `CardDefinitionId`
aus dem gebundenen Kartenkatalog. Adressierbare Fähigkeiten verwenden ihre
numerische `CanonicalCapabilityId` aus dem vorhandenen Fähigkeitsregister.
Diese Referenzen werden direkt in den Bericht übernommen.
[Kompakte Laufzeit-IDs](../compact-runtime-identifiers.md)

Kartenexemplare besitzen in der Laufzeit kurze Base36-IDs. Der Bericht ordnet
ihnen berichtslokale Nummern zu, damit dasselbe Exemplar über Spielstand und
Chronik hinweg erkennbar ist. Diese Zuordnung gilt für den eingefrorenen
Bericht und wird für alle enthaltenen Dateien gemeinsam erzeugt.

Aktions- und Optionsnummern gelten innerhalb ihres konkreten Angebots.
Der Bericht bindet sie an Seite, `stateVersion` und `matchVersion` der
bestätigten Ansicht. Choices führen ihre Eröffnungs-StateVersion.
Unterroutinenreferenzen sind Base36-Positionen in der vollständigen
ICE-Sequenz und werden mit der zugehörigen ICE- und Encounterbindung erfasst.
Fachliche Angaben wie Kartendefinition, Ziel und Auswahlwert stammen aus den
strukturierten Feldern der Spielersicht und ihrer Ereignisse.

Für sichtbare Zufallsereignisse übernimmt die Chronik den öffentlichen
numerischen Zweckcode. Die Zuordnung zu Kartendefinitionen und Fähigkeiten
erfolgt bei der Fehleranalyse über den zum Bericht gehörenden Katalog und
Fähigkeitsindex.

## Freigabe beim Spielstart

Vor Spielstart kann jeder menschliche Spieler für seine Partie **„Verdeckte
Karten in teilbaren Fehlerberichten erlauben“** ankreuzen. Die Beschriftung
erklärt, dass der Fehlerbericht schon während der Partie heruntergeladen und
öffentlich eingereicht werden kann. Der Server hält beim Start fest, ob alle
menschlichen Teilnehmer zugestimmt haben. Das Spiel kann mit jeder Auswahl
starten.

Mit der Freigabe beim Start ergänzt der Server beim Download die
reproduktionsrelevanten Daten beider Seiten aus dem gemeldeten Stand.
Dazu gehören beide Hände, verdeckte Installationen, Karten in offenen
Auswahlen und bei Bedarf die Deckreihenfolge. Ohne gemeinsame Freigabe gilt
die normale Spielersicht. Der Server prüft den Matchsitz beim Berichtsexport.
Die zusätzlichen Daten gehen ausschließlich an diesen Export. **Fehlerbericht
speichern** bleibt für beide Fälle dieselbe Aktion.

## Nachstellen des Fehlers

Die Versionsangaben, die Spielersicht und die zugehörige Ereignisfolge
ermöglichen das Nachstellen vieler UI-, Netzwerk- und Regelprobleme. Der
Spieler kann die auslösende Handlung und beobachtete Folge im Text ergänzen,
besonders wenn die Handlung vor der Bestätigung gescheitert ist.

Ein exaktes deterministisches Replay setzt die intern gespeicherte Partie mit
ihrem vollständigen Zustand, Aktionen und Zufallsdaten voraus. Der Dialog kann
den lokalen Diagnoseverweis für den Betreiber getrennt vom ZIP
anzeigen, sofern die Anwendung ihn bereits kennt. Er enthält Match-ID,
MatchVersion, StateVersion und gegebenenfalls die letzte bestätigte Event-ID.
Der Verweis gehört ausschließlich in die lokale Betreiberanalyse. Er erscheint
weder in der ZIP-Datei noch im kopierten Kurztext oder in der GitHub-URL.
Der jeweilige Spielserverbetreiber kann die gespeicherte Partie im vorhandenen
Maintenance-Pfad untersuchen, soweit sie und der fragliche Stand noch
vorliegen. Das gilt auch auf einem selbst betriebenen Fremdserver.
[Lokale Maintenance-Matchanalyse](../../runbooks/maintenance-control-plane.md#laufende-matchanalyse)

## Umsetzung und Abnahme

1. **Berichtsdaten.** Ein eigener Web-Serializer baut die Dateien aus
   bestätigtem Matchkontext, bestehender Projektion der meldenden Seite und
   Laufzeit-Builddaten. Das Datenformat bekommt eine Version, feste
   Dateinamen und Größenlimits. Fehlende Angaben werden ausgewiesen. Der
   Browser erzeugt das ZIP lokal.
2. **Freigabe und Kartenkennungen.** Der Spielserver übernimmt die Auswahl
   der menschlichen Teilnehmer beim Start und prüft sie beim Export. Der
   Serializer übernimmt die vorhandenen Karten- und Fähigkeitsnummern und
   erzeugt die berichtslokalen Exemplarreferenzen. Die Katalogkennung und die
   Versionsbindungen werden aus demselben bestätigten Matchkontext übernommen.
3. **Spielfläche.** `ActiveMatchTopbar` und `OptionsPanel` binden denselben
   Melde-Dialog ein. Dieser verwendet vorhandene Download- und
   Zwischenablage-Hilfen, soweit sie zum Format passen. Ein statischer
   GitHub-Link und lokalisierte Texte in de, en und fr vervollständigen den
   Ablauf. Die Freigabe steht in der Startoberfläche der Partie.
4. **Abnahme.** Tests öffnen das erzeugte ZIP und prüfen jede enthaltene
   Datei gegen den Berichtsvertrag. Aus beiden Seitenperspektiven müssen die eigene
   Hand, eigene verdeckte Karten, tatsächlich gesehene gegnerische Karten und
   sichtbare Auswahlen im Bericht ankommen. Testwerte für unbekannte
   gegnerische Karten, nicht sichtbare Auswahlen, Seeds und Tokens dürfen in
   ZIP, Kurztext und Link nicht erscheinen. Firefox prüft Match und Optionen
   im Gastmodus, HTTP-LAN, einen Verbindungsverlust und die eingefrorene
   Diagnose nach Undo oder Wiederverbindung. Der Export darf den Matchzustand
   nicht verändern.
   Vor dem bewussten Öffnen des Links wird GitHub nicht kontaktiert.
   Ein bekannter Regelfehler dient als Probe, ob sich Build, beteiligte
   Karten und auslösende Schritte im ZIP nachvollziehen lassen. Die Probe
   umfasst einen Fehler, bei dem eine eigene verdeckte Karte relevant ist.
   Im Zwei-Spieler-Fall werden beide gesetzten Häkchen, ein fehlendes Häkchen
   und Sitzungen anderer Partien geprüft. Die erweiterten Kartenreferenzen
   sind bei gemeinsamer Freigabe im ZIP enthalten und lassen sich mit dem
   exakt zugehörigen Kartenkatalog auflösen. Die technischen Dateien
   enthalten weder Kartennamen noch die Zuordnungstabelle.
   Mehrere Exemplare derselben Karte behalten in Spielstand und Chronik
   ihre jeweilige berichtslokale Referenz. Wiederverwendete Aktionsnummern
   nach Undo werden durch die MatchVersion dem richtigen Verlauf zugeordnet.
   Unterroutinenpositionen bleiben an ihre jeweilige ICE-Sequenz gebunden.
   Den GitHub-Dateianhang im Webformular prüft eine gesondert beauftragte
   Abnahme mit einer synthetischen ZIP und einem normalen GitHub-Konto.

Für die Umsetzung gelten die fokussierten Web- und Servertests, Typechecks
der betroffenen Pakete, `corepack pnpm check:i18n` und `git diff --check`.
Die Freigabe erhält gezielte Hidden-Info- und Projektionstests. Der
Browserlauf verwendet isolierte Ports und Daten.
