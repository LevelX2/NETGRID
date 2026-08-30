# Card Image Architecture

Dieser Ordner enthält nur die aktuellen Architekturverträge für Kartenbilder.

## Führende Dokumente

- [Personal Card Image Import](personal-card-image-import.md) – lokaler Import, Maintenance-Zugriff, Verzeichnis-/ZIP-Pakete, HTTPS-Härtung und Variantenverwaltung.
- [Card Image Performance Architecture Requirements](card-image-performance-architecture-requirements.md) – Laufzeit-, Darstellungs- und Performancevertrag.

## Leitplanken

- Kartenbildquellen bleiben lokal auf dem Server.
- Die Web-App erhält nur kontrollierte Varianten und ausdrücklich freigegebene Routen.
- Source-Dateien sind kanonisch; abgeleitete Varianten können reproduzierbar neu erzeugt werden.
- Historische Umsetzungsprozesse, Prompts und Abschlussreviews liegen ausschließlich in der Git-Historie.
