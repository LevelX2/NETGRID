# Legacy-Vereinfachung – Abschlussreview 2026-07-19

## Ergebnis

Die untersuchten Legacy-, Compiler-, Fallback- und Moving-Target-Schichten
sind entfernt. Die verbleibende Struktur besitzt je Fachbereich eine
kanonische produktive Quelle; bestehende Regel-, Datenschutz- und
Sicherheitsgrenzen wurden nicht abgeschwächt.

## Vereinfachter Stand

- `data/ai/ai-card-hints-active.json` enthält die statischen Karten-Hints und
  die von Runtime, Deckstrategie und Inspector benötigten Signale direkt.
  Hint-Compiler, Ableitungskataloge und zweiter Inspector-Semantikindex sind
  entfernt.
- Das parallele Kartenrollenmanifest, der alte Access-Ausführungspfad und die
  alte Chimera-Choice-Verkabelung sind entfernt. Aktuelle Kartenmechaniken
  laufen über CardImplementations und den kanonischen Accesspfad.
- AI- und Engine-Architekturchecks schützen Zyklen, Schichtgrenzen,
  Registry-Eigentum und verbotene Abhängigkeiten. Historische Datei-, Zeilen-,
  Testgrößen-, Fanout- und exakte Binding-Ratchets sind entfernt.
- SQLite ist der einzige konfigurierbare Server-Storage. JSON-Storage,
  Alt-Schema-Migrationen, Eventlog-Backfill und parallele private
  Deck-Snapshot-Formen sind entfernt.
- Tote Katalogpipeline, alte AI-Profile, archivierte Card-Gates, verwaiste
  Generatorreports sowie identische Browser-Storage-Aliase sind entfernt.

## Befund aus der Gesamtprüfung

Der erste vollständige Testlauf fand zwei Regressionen bei der
Runner-Hintergrundbank. Nicht die eingebrannten Hints waren fehlerhaft:
`icebreaker_support` wurde nach der Umstellung auf die kanonischen Hints durch
eine ungebundene Teilzeichenkettensuche als echter Breaker interpretiert. Das
gab dem Entfernen einer Run-Sperre fälschlich Vorrang vor der Bankaktion.

Die Erkennung verwendet nun sichtbare Icebreaker-Subtypen, ein strukturiertes
`breakerProfile` oder die begrenzten Rollen `icebreaker` und `breaker_*`.
Zwei Negativtests schützen Supportkarten vor derselben Fehlklassifikation bei
Run-Sperren und Hosted-Installationen. Die bestehenden
Entscheidungs-Checkpoints wurden nicht verändert.

## Beibehaltene Grenzen

- Rules Engine und erneute `applyAction`-Validierung;
- Hidden-Information-Redaktion und private PlayerViews;
- deterministische Replays, StateHash und Seed-/RandomDrawRecords;
- Authentifizierung, CSRF, Rate Limits und aktuelle SQLite-Backups;
- aktuelle zyklus-, layer- und registrybasierte Architekturchecks;
- reale aktive Engine-Abhängigkeiten und gezielte Verhaltensregressionstests.

## Verifikation

- `pnpm lint`: grün;
- `pnpm typecheck`: grün;
- `pnpm test`: 687 Testdateien, 5.414 Tests, vollständig grün;
- `pnpm build`: grün, einschließlich optimiertem Next-Produktions-Build;
- `check:ai` und AI-Source-Structure-Selftest: grün, 0 Laufzeit- und 0
  Typzyklen;
- Engine-Source-Structure und Selftest: grün, 0 relative Zyklen;
- Engine-CardImplementation-Architekturziel und Selftest: grün;
- gezielte Bank-/Breaker-Regression: 3 Testdateien mit 24 Tests grün;
- `git diff --check`: grün.

## Bewusst verbleibend

`public-context.ts`, der große Per-Card-Longtail-Test und wenige reale
Engine-Schichtabhängigkeiten bleiben als sichtbare Architekturpunkte bestehen.
Sie sind aktive Implementierung beziehungsweise fachlicher
Regressionsschutz, keine redundanten Quellen oder historischen
Größen-Guardrails.

Führender Prozessstand:
`docs/architecture/legacy-simplification-process-2026-07-19.md`.
