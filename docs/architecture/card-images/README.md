# Kartenbild-Architektur

`docs/architecture/card-images/` enthält die Kartenbild-Performance-, Anzeige-
und persönliche Importarchitektur.

## Enthaltene Artefakte

- `card-image-runtime-performance-process-2026-08-22.md`
- `card-image-performance-architecture-requirements.md`
- `card-image-performance-stage-1-implementation-prompt.md`
- `card-image-performance-stage-1-implementation-review.md`
- `personal-card-image-import-process-2026-08-19.md`
- `private-card-image-https-and-pack-process-2026-08-19.md`
- `personal-card-image-import.md`

## Aktueller Performancevertrag

- Persönliche Importe erzeugen `master`, `full`, `preview` und `thumb` als
  lokale WebP-Varianten.
- Die zentrale `CardImage`-Schicht fordert je Darstellungsort nur die passende
  Variante an und setzt Listenbilder lazy sowie priorisierte Einzelbilder
  eager mit hoher Fetch-Priorität.
- Der Managed Store hält validierte Collections und Asset-Manifeste anhand
  ihrer Dateifingerprints prozesslokal im Cache. Ein unveränderter bereits
  geprüfter Blob wird nicht erneut vollständig gehasht.
- Änderungen durch denselben oder einen anderen Prozess invalidieren den
  betroffenen Eintrag über Dateiidentität, Größe sowie hochauflösende
  Änderungszeiten und werden erneut fail-closed validiert.
- Persönliche Bild-URLs tragen die beim Serverrender ermittelte
  Collection-Revision. Nur wenn sie noch dem aktuellen Store entspricht,
  liefert die Route `private, max-age=31536000, immutable`; fehlende oder alte
  Revisionen bleiben revalidierungspflichtig.
- Listenvirtualisierung bleibt eine messungsabhängige Folgeoption und ist kein
  Ersatz für den Runtime- und Browsercache.

## Regel

Kartenbildartefakte verändern keine Asset-Rechte, keine Kartenfreigabe und keine Hidden-Info-Grenzen. Asset- und Rechtsgates bleiben separat.
