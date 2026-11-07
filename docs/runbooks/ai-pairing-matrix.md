# KI-Paarungsmatrix aus vorhandener Evidence

Die Paarungsmatrix ist eine historische, deskriptive Ergebnisübersicht der
zentralen [Selbstspiel-Registry](ai-selfplay-evidence-registry.md). Sie erzeugt
keine neuen Spiele und verändert weder die Registry noch das KI-Verhalten.

## Population

Gezählt werden ausschließlich geschlossene Paarungen mit Spielphase `final`,
Gewinner `Runner`/`Corp` und dokumentiertem `flags_count = 0`. Fehlende Flagzahlen
bleiben unbekannt. `base`, Vorher-Läufe, Fixdiagnostik, Holdouts und Replays
sind eigenständige Nachweise und werden nicht als Ersatzphasen hinzugenommen.
Alle Ausschlüsse werden mit Grund gezählt; Hauptsummen sind zusätzlich mit
einer separat gruppierten SQL-Abfrage abzugleichen.

Die SQLite-Datei wird read-only innerhalb einer konsistenten Lesetransaktion
geöffnet. Parallel laufende Selbstspiel-Jobs bleiben unangetastet. Die Anzeige
ist ein datierter Snapshot und beansprucht keine laufende Aktualisierung.

## Darstellung

- Runner-Decknamen stehen in den Zeilen, Corp-Decknamen in den Spalten.
- Jeder belegte Knoten zeigt **Runner-Siege : Corp-Siege** und **n = Spiele**.
  Die Zahl der Paarungsserien ist zusätzliche Herkunftsinformation.
- Farbe zeigt die beobachtete Runner-Siegquote, Gleichstand bleibt neutral.
  Unbelegte Kombinationen zeigen `—`, keine fiktive 0:0-Bilanz.
- Exakt gespeicherte Decknamen bilden die historischen Zeilen/Spalten.
  Ähnliche Schreibweisen werden nicht automatisch zusammengeführt.
- Verschiedene Code-/Regel-/KI-/Snapshotpopulationen erhalten `≠`;
  unvollständige Herkunft erhält `?`. Die Knotendetails trennen vollständigen
  Source-Commit, Regelprofil, KI-Modus und beide Deck-Hashes und zeigen
  Ergebnis, Nenner und Paarungs-IDs jeder Population.
- Die Standardreihenfolge nach Spielzahl erleichtert den Einstieg in belegte
  Kombinationen. Eine Corp-Auswahl und horizontale Tabellenansicht erhalten
  lesbare Ergebnisse bei vielen Decks; alternativ alphabetisch sortieren.

Historische Gesamtquoten sind kein aktuelles Deckranking. Verschiedene
Code- oder Deckstände, wechselnde Gegner und kleine Stichproben begrenzen
Stärkeaussagen. Für kontrollierte Vergleiche die Populationen getrennt halten.
Unbekannte Herkunft begründet keine Gleichheit mit anderen unbekannten Daten.
Widersprüchliche Commits und mehrfach gezählte Seeds derselben vollständigen
Population scheitern strukturiert, statt still zusammengezählt zu werden.

## Wiederholung und Prüfung

Der persönliche Skill `netgrid-paarungsmatrix` enthält den ausführbaren Helper,
die Darstellungsvorlage und fokussierte Regressionen. Seine gepflegte Quelle
liegt im persönlichen Haupt-Vault unter `07 Codex/skills/netgrid-paarungsmatrix/`;
die lokale Installation unter `.codex/skills/netgrid-paarungsmatrix/`.

Der Helper nimmt `--db` und `--output` als explizite absolute Pfade entgegen.
`--pairings` beschränkt auf exakte Registry-IDs; `--source-commit` auf den
vollständigen aufgezeichneten Commit. Fehlende Datenbank, falsches Schema,
unbekannte IDs, leere Ergebnisse und verletzte Identitätsbindungen werden als
strukturierte Fehler ausgegeben. Es entstehen das Visualisierungsfragment,
aggregierte Daten und Quellenmetadaten; lokale Artefakte bleiben unversioniert.

Vor Ausgabe die aggregierten Summen, ausgeschlossenen Spiele und mindestens
eine Knotenauswahl mit ihren Populationen prüfen. In Firefox Desktopansicht,
schmale Ansicht, Corp-Auswahl und Sortierung kontrollieren. Eine isolierte
Dateivorschau braucht keinen NETGRID-Appstart. Der Snapshot-SHA-256 bindet die
aufgenommenen Spielidentitäten, Ergebnisse, Decknamen und Herkunftswerte.

## PDF-Ausgabe und Versand auf Wunsch

Für die Ausgabe derselben Matrix als PDF den vorhandenen aggregierten
Snapshot übernehmen. Der Skill-Helper `render-pairing-matrix-pdf.py` verteilt
die gesamte Matrix auf A4-Seiten im Querformat und prüft, dass jeder belegte
Knoten exakt einmal enthalten ist. Lange Decknamen bestimmen die benötigte
Zeilenhöhe. Quellenseite, Nenner und Herkunftsmarker bleiben erhalten; die
detaillierte interaktive Populationsauflösung ist im PDF ausdrücklich nicht
enthalten. Alle PDF-Seiten vor der Ausgabe rendern und kontrollieren.

Ein ausdrücklich beauftragter Versand an den Nutzer erfolgt über den
Gmail-Connector an `me` mit dem echten PDF-Anhang. Eine erfolgreiche
Sendebestätigung ist der Versandnachweis. Weder PDF-Erstellung noch der Skill
allein autorisieren zusätzliche oder wiederkehrende E-Mails.
