---
activityId: act-2026-08-21-katalog-sichtbare-schnellsuche
status: done
kind: concept
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-21
startedAt: 2026-08-21
completedAt: 2026-08-21
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/features/catalog/CatalogPanel.tsx
  - apps/web/app/catalog-quick-search.test.ts
  - packages/catalog/src/index.ts
  - packages/catalog/src/index.test.ts
checks:
  - "18 Katalogindex-Tests bestanden"
  - "34 Katalog-UI-, API-, Filter- und Lokalisierungstests bestanden"
  - "Katalog-Typecheck bestanden"
  - "Firefox bei 390 x 844 und 1280 x 900 mit geschlossenem, geöffnetem, suchendem und zusätzlich gefiltertem Zustand geprüft"
  - "Web-Typecheck: eigene Änderungen fehlerfrei; unabhängiger Baselinefehler in app/ai-turn-plan-comparison-ui.test.ts:67"
---

# Katalog mit dauerhaft sichtbarer Schnellsuche ausstatten

## Ziel

Im Katalog ist eine normale Kartensuche jederzeit unmittelbar erreichbar,
ohne zuerst die umfangreichen Spezialfilter aufzuklappen. Ein kompakter
Filterknopf öffnet nur noch die selten benötigten Filter. Dadurch bleibt der
Katalog im Alltag platzsparend: Kartennamen, Regeltext, Kartentypen und
Subtypen lassen sich direkt suchen, während Set-, Status-, Seiten-, Raritäts-
und weitere Expertenfilter bei Bedarf verfügbar bleiben.

## Kontext und Quellen

- Nutzeridee vom 2026-08-21: Das Suchfeld für Kartenname, Text und Subtyp ist
  derzeit im aufklappbaren Katalogfilter versteckt. Als UX-Referenz dient die
  beschriebene Card Library in DEX, deren normale Suche ohne vorheriges
  Aufklappen sichtbar ist und Titel, Rules Text, Type und Subtype findet.
- Gewünscht ist zusätzlich ein kompakter Filterknopf im rechten oberen Bereich
  des Katalogs. Erst dieser öffnet die größeren Spezialfilter für Sets,
  Kartentypauswahl und ähnliche genauere Eingrenzungen.
- `apps/web/features/catalog/CatalogPanel.tsx` zeigt aktuell zunächst eine
  breite `catalogFilterToggle`-Zeile. Das eigentliche `catalogSearch`-Feld
  befindet sich zusammen mit allen anderen Steuerelementen innerhalb der nur
  bei `filtersOpen` gerenderten `catalogControls`.
- `apps/web/features/catalog/useCatalogWorkspace.ts` hält Suche und
  Filterzustände bereits getrennt. Die Suche wird als `q` an
  `/api/cards/catalog` übergeben; weitere Katalogfilter werden anschließend
  kompositorisch angewendet.
- `packages/catalog/src/index.ts` baut den bestehenden Suchindex bereits aus
  Titel, Seite, Kartentyp, Fraktion, Set-ID, Subtypen, Rarität und Regeltext.
  Damit ist die gewünschte Mindestsuche technisch weitgehend vorhanden, aber
  ihre Feldabdeckung ist noch nicht durch fokussierte Suchtests als sichtbarer
  Produktvertrag abgesichert.
- Die Katalogtexte in `apps/web/messages/{de,en,fr}.json` nennen derzeit
  „Kartenname, Text, Subtyp“, obwohl auch der Kartentyp durchsucht wird.

## Scope

- Im ständig sichtbaren Kopf- beziehungsweise Werkzeugbereich des Katalogs ein
  gut erkennbares Schnellsuchfeld mit Suchsymbol, verständlichem Platzhalter
  und eigener Löschaktion platzieren. Es bleibt unabhängig vom Zustand der
  Spezialfilter sichtbar.
- Den bisherigen breiten Filterbalken durch einen kompakten Filterknopf im
  rechten oberen Bereich der Katalogfläche ersetzen beziehungsweise dort
  integrieren. Der Knopf öffnet und schließt die erweiterten Filter und zeigt
  über Zustand, Badge oder kurze Beschriftung verständlich an, wenn
  Spezialfilter aktiv sind.
- Das Suchfeld aus dem aufgeklappten Spezialfilterbereich entfernen, sodass es
  genau eine Suchsteuerung und einen eindeutigen Suchzustand gibt.
- Die Schnellsuche mindestens gegen Kartentitel, vollständigen sichtbaren
  Regeltext, Kartentyp und Subtypen arbeiten lassen. Groß-/Kleinschreibung,
  übliche Akzente beziehungsweise Sonderzeichen und mehrere Suchwörter sollen
  dem bestehenden normalisierten Suchvertrag entsprechend robust behandelt
  werden.
- Suchbegriff und Spezialfilter weiterhin gemeinsam anwenden. Das Öffnen oder
  Schließen der Spezialfilter verändert weder den Suchtext noch das
  Suchergebnis. „Suche löschen“ löscht nur die Schnellsuche; ein separater
  Filter-Reset löscht nur die dafür ausdrücklich vorgesehenen Spezialfilter.
- Die Ergebnisanzahl und aktive Filteranzeige so anpassen, dass Suchtext und
  Spezialfilter unterscheidbar bleiben und keine veraltete zusammengequetschte
  Zusammenfassung im ehemaligen Filterbalken stehen bleibt.
- Responsives Verhalten für breite Katalogansicht und kleine Viewports
  festlegen. Auf schmalen Flächen darf die Suche in eine eigene Zeile wechseln;
  Suchfeld, Löschen und Filterknopf bleiben ohne horizontales Abschneiden oder
  unnötiges dauerhaftes Aufklappen bedienbar.
- Deutsche, englische und französische Platzhalter sowie fokussierte Such-,
  Filterkompositions- und UI-Tests ergänzen. Die visuelle Prüfung erfolgt in
  Firefox bei geschlossenem und geöffnetem Spezialfilter.

## Nicht im Scope

- Einführung einer separaten Suchmaschine, unscharfer KI-Suche,
  Volltext-Ranking oder serverseitiger Suchhistorie.
- Änderung der Katalogdaten, Kartentexte, CardSpecs oder fachlichen
  Katalogsichtbarkeit.
- Redesign von Kartendetail, Kartenbild, Statusbadges oder KI-Hinweisinspektor.
- Entfernen bestehender Spezialfilter oder Zusammenlegen fachlich
  unterschiedlicher Filterzustände.
- Übernahme der DEX-Oberfläche als exakte visuelle Kopie. DEX ist hier eine
  UX-Referenz für sichtbare Suche und getrennte Spezialfilter, keine
  Design- oder Codequelle.
- Gleichzeitige Umgestaltung der allgemeinen Optionsoberfläche oder anderer
  Suchfelder außerhalb des Katalogs.

## Akzeptanzkriterien

- [x] Beim Öffnen des Katalogs ist das Schnellsuchfeld sofort sichtbar und
  fokussierbar, auch wenn die erweiterten Filter geschlossen sind.
- [x] Ein kompakter Filterknopf befindet sich im oberen Werkzeugbereich des
  Katalogs, öffnet/schließt nur die Spezialfilter und zeigt seinen offenen
  sowie einen aktiven gefilterten Zustand verständlich an.
- [x] Im geöffneten Spezialfilter existiert kein zweites Suchfeld; sichtbare
  Suche, Suchwert und Löschaktion besitzen jeweils genau eine Steuerung.
- [x] Fokussierte Tests belegen Treffer über Kartentitel, sichtbaren Regeltext,
  Kartentyp und Subtyp sowie robuste Groß-/Kleinschreibung. Die vorhandenen
  zusätzlichen Suchbegriffe dürfen bestehen bleiben, werden aber nicht
  fälschlich als Spezialfilter dargestellt.
- [x] Suche, Set-, Seiten-, Status-, Block-, KI-Hinweis-, Raritäts- und
  Kartentypfilter bleiben kompositorisch: Nur Karten, die alle aktiven
  Bedingungen erfüllen, werden angezeigt.
- [x] Öffnen und Schließen des Filterbereichs erhält Suchtext, Spezialfilter
  und aktuelle Auswahl; eine nicht mehr sichtbare Karte wird weiterhin nach
  dem bestehenden Auswahlvertrag konsistent ersetzt.
- [x] Die Löschaktion des Suchfelds leert nur den Suchtext und lässt aktive
  Spezialfilter unverändert. Ein Zurücksetzen der Spezialfilter löscht den
  Suchtext nicht unbeabsichtigt.
- [x] Platzhalter und Hilfetext nennen den tatsächlichen Mindestumfang der
  Suche verständlich in Deutsch, Englisch und Französisch.
- [x] Auf Desktop und kleinem Viewport bleiben Suchfeld, Löschaktion und
  Filterknopf vollständig sichtbar; der geschlossene Filter spart gegenüber
  dem bisherigen aufgeklappten Zustand deutlich vertikalen Platz.
- [x] Fokussierte Komponenten-/Modelltests und eine visuelle Firefox-Prüfung
  sichern geschlossene, geöffnete, suchende und zusätzlich gefilterte Zustände
  ab.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, da die Suchlogik bereits
  vorhanden ist und der Schwerpunkt auf einer gezielten Interaktions- und
  Layoutkorrektur liegt.
- Den bestehenden Zustand `catalogSearch` und Callback `onSearch` weiter als
  einzige Autorität nutzen. Keine zweite lokale Suchvariable im Header oder
  Filterpanel einführen.
- Den tatsächlichen Suchvertrag in `searchableText` mit kleinen Fixtures
  absichern, statt nur den Platzhalter zu ändern. Insbesondere Kartentyp und
  Regeltext sind derzeit nicht durch die Katalog-UI-Tests belegt.
- Der Filterknopf soll `aria-expanded` und eine eindeutige Beziehung zum
  Filterbereich behalten. Ein aktiver Badge zählt bevorzugt nur
  Spezialfilter; der sichtbare Suchtext erklärt sich bereits durch das Feld.
- Beim responsiven Umbau die vorhandene Katalogliste und Detailspalte nicht
  neu strukturieren. Die Arbeit bleibt auf Header, Such-/Filterwerkzeug und
  deren Tests begrenzt.

## Ergebnisnotiz

Der Katalogkopf enthält nun genau eine dauerhaft sichtbare Schnellsuche für
Titel, sichtbaren Regeltext, Typ und Subtyp. Die normalisierte Suche ignoriert
Groß-/Kleinschreibung und kombinierende Akzentzeichen; mehrere Suchwörter
müssen unabhängig von ihrer Feldreihenfolge gemeinsam auf eine Karte passen.

Der kompakte Filterknopf öffnet ausschließlich die Spezialfilter und zeigt
deren Anzahl als Badge. Der aufgeklappte Bereich besitzt kein zweites
Suchfeld. Sein eigener Reset setzt Set, Seite, Status, Blockstatus,
KI-Hinweise, Rarität und Kartentypen zurück, lässt den Suchtext aber bewusst
stehen. Umgekehrt löscht das X nur die Suche. Firefox bestätigte die
Komposition mit `daemon strength afreet` plus Korp-Filter sowie vollständig
sichtbare Werkzeugleisten bei 390 x 844 und 1280 x 900.
