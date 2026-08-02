# Standarddeck-Anleitungen – Abschlussreview

Datum: 2. August 2026
Ergebnis: umgesetzt und releasefähig

## Ergebnis

Alle 43 aktiven Standarddecks besitzen eine versionierte deutsche Anleitung.
Die Inhalte werden aus derselben deterministischen Deckstrategie-Ableitung
kuratiert, die auch zur fachlichen Prüfung der Decklinien dient. Jede
Anleitung enthält:

- eine kurze Einordnung und die Deckidee,
- einen Plan für Eröffnung, Mittelspiel und Endphase,
- bis zu fünf tatsächlich im Deck enthaltene Schlüsselkarten mit ihrer Rolle,
- praktische Spieltipps sowie erkennbare Risiken und Schwächen.

41 Profile sind als plausibel bestätigt. Ghost Circuit und Vom Tablet bleiben
als Beobachtungsfälle ausdrücklich sichtbar: Bei Ghost Circuit fehlt eine
belastbare Primärlinie, bei Vom Tablet fehlen trotz erkannter Remote-/Rush-
Linie stabile einzelne Strategieanker. Diese Befunde reichen ohne zusätzliche
Playtest-Evidence nicht für eine Deck-, Balance- oder KI-Änderung aus.

## Pflege- und Laufzeitvertrag

Der aktive Standarddeck-Katalog ist die Bestandsautorität. Das Guide-Manifest
bindet jeden Eintrag über Deck-ID, Deckversion, Quellhash und Analysehash an
seinen geprüften Stand. Der eigenständige Befehl
`corepack pnpm check:standard-deck-guides` meldet gesammelt:

- `missing`, wenn ein aktives Standarddeck keinen Guide besitzt,
- `stale`, wenn Deck- oder Analysebindung nicht mehr aktuell ist,
- `invalid`, wenn Inhalt oder Schlüsselkartenvertrag beschädigt sind.

Diese Zustände sind Pflegebefunde und absichtlich kein Bestandteil von
`build`, Serverstart oder Matchstart. Ein betroffenes Standarddeck bleibt
spielbar. Die UI zeigt „Anleitung fehlt noch“ beziehungsweise „Anleitung muss
aktualisiert werden“, statt veralteten Inhalt auszugeben. Damit fallen neu
hinzugefügte oder geänderte Standards im Check und in der Oberfläche auf,
ohne das Programm unbenutzbar zu machen.

Guide-Daten sind reine Präsentationsmetadaten. Sie werden weder in
`DeckSnapshot` noch in Match-State, Replay, StateHash oder KI-Entscheidungen
aufgenommen. Ein Test mit fehlendem beziehungsweise beschädigtem
Guide-Manifest bestätigt unveränderte 43 Standarddecks und identische
Snapshot-Hashes.

## Oberfläche

Bei jeder festen Standarddeck-Auswahl steht neben dem Dropdown die Taste
„Deck-Anleitung“. Host-, Beitritts- und erweiterte Auswahl verwenden dieselbe
Komponente. Der Standarddeck-Kopierdialog verwendet denselben Guide-Dialog und
dieselbe Statuslogik. Zufallsauswahlen und persönliche Decks erhalten keine
irreführende Standarddeck-Anleitung.

Der Dialog ist responsiv, intern scrollbar, per sichtbarer Schließen-Taste,
Hintergrund oder `Escape` schließbar. In den Auswahlabläufen kehrt der Fokus
nach dem Schließen an die auslösende Taste zurück.

## Verifikation

- Guide-Pflegecheck: 43/43 aktuelle aktive Standarddecks.
- Deckpaket: 2 Testdateien, 24 Tests grün.
- Server: 23 Testdateien, 219 Tests grün.
- Webclient: 77 Testdateien, 766 Tests grün.
- Contract-Gate: Shared 16/16 sowie Specs 8/8 grün; Test-Discovery vollständig.
- AI-Gesamtlauf: drei Shards, 554 Testdateien und 4.557 Tests grün.
- Workspace-Typecheck: vollständig grün. Der erste Lauf erreichte nur das
  voreingestellte 4-GB-Heap-Limit im unveränderten AI-Typecheck; der identische
  Lauf war mit 8-GB-Prozessheap grün.
- Workspace-Build einschließlich optimiertem Next.js-Produktionsbuild: grün.
- Firefox: Desktop-Auswahl, Öffnen, Inhalt, Beobachtungshinweis,
  `Escape`-Schließen und Ausblenden bei Zufallsauswahl geprüft. Mit
  Firefox-Geräteemulation bei 393 px liegt der Dialog vollständig mit 8 px
  Rand im Viewport und scrollt intern.
- `git diff --check`: grün.

## Follow-up ohne Releaseblocker

Playtests sollen Ghost Circuit und Vom Tablet weiter beobachten. Erst
reproduzierbare schwache Hände, fehlende Coverage, tote Schlüsselkarten oder
eine inkonsistente Umsetzungsroute rechtfertigen ein eigenes Deck-/KI-Paket.
Neue oder geänderte Standards werden durch den Pflegecheck und die sichtbaren
UI-Zustände unmittelbar auffällig; eine automatische Laufzeit-Textgenerierung
ist weiterhin bewusst nicht vorgesehen.
