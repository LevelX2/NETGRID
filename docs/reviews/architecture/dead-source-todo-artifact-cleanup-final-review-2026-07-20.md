# Dead-Source-/TODO-Artefakt-Cleanup – Abschlussreview 2026-07-20

## Ergebnis

Der Repository-Gesamtcheck hat 33 löschbare Dateien bestätigt und entfernt:
19 verwaiste Sourcecode-/Barrel-Dateien, neun abgeschlossene
`tests/specs/*.todo.md`-Listen und fünf Artefakte der einmaligen
Proteus-Importkette. Vor dieser Abschlussdokumentation wurden dadurch 9.667
Zeilen entfernt. Es verbleibt kein Codeimport und kein Dokumentverweis auf die
gelöschten Proteus-Artefakte.

## Prüfmethode

- vollständiger Import-/Export- und Dependency-Scan aller Workspace-Pakete
  mit Knip;
- exakte `rg`-Prüfung auf Modulpfade, Symbole, generierte Artefakte und
  TODO-Dateien;
- Git-Historienprüfung der verdächtigen KI-Helfer: ihre letzten produktiven
  Aufrufer wurden beim Legacy-Cutover vom 10.07.2026 entfernt;
- verschärfte TypeScript-Prüfung mit `noUnusedLocals` und
  `noUnusedParameters` als Zusatzsignal;
- reguläre Typechecks, Architekturchecks, Pakettests, Root-Specs und
  Produktions-Build als maßgeblicher Verhaltensnachweis.

Die verschärfte TypeScript-Prüfung meldet in aktiven Engine-/KI-
Kompositionsdateien weiterhin unbenutzte Parameter und Typimporte aus
gemeinsamen Host-Signaturen. Diese Meldungen beweisen keine verwaisten Module
und wurden daher nicht als Dateilöschgrund verwendet.

## Entfernte Sourcecode-Altlasten

### Proteus-Importer und Katalog

- `packages/catalog/src/proteus-spoiler.ts` samt öffentlichen Re-Exports;
- die zwei nicht mehr importierten Katalog-Testfixtures
  `ai-approval-gates.ts` und `ai-approval-hints.ts`;
- die dadurch unbenutzte Paketabhängigkeit `@netgrid/shared`.

Der aktive Katalog lädt Proteus aus `data/cards/proteus-cards.json`. Die
Rarität wird weiterhin durch den allgemeinen Spoilerquellen-Parser aus
`packages/catalog/src/rarity.ts` gelesen. Die unveränderte Rohquelle
`docs/source/Proteusspoiler.txt` bleibt erhalten.

### KI

Entfernt wurden elf Module ohne Aufrufer: der alte
`tactical-plan-candidate-text`-Textmatcher sowie zehn Helper für die frühere
Baseline-/Legacy-Bewertung von Profilgewichten, Ranked Choices, Rollen-Evidence,
Advancement-Payout, Runzielen, Wiederholungsruns, Score-Confidence, Shell
Traders und Tag-Punish-Priorität. Die Semantic Runtime besitzt dafür aktuelle,
strukturierte Verbraucher oder hat den früheren Pfad vollständig ersetzt.

### Engine und Web

- ungenutzte Webkomponente `SimulationResult.tsx`;
- ungenutzter Engine-Kompatibilitäts-Re-Export `ability-engine/cost-pipeline.ts`;
- drei nicht importierte Engine-Barrels unter `game/state`, `game/trace` und
  `game/engine-runtime-internal`;
- die dazugehörige veraltete Layer-Debt-Ausnahme im
  Engine-Source-Structure-Check.

## Entfernte Planungs-/TODO-Artefakte

- alle neun abgeschlossenen `tests/specs/*.todo.md`-Abnahmelisten aus den
  MVP-0.1-bis-0.9-Phasen;
- `data/card-import/proteus-card-basis-2026-05-17.json`;
- `data/card-import/source-registry-proteus-2026-05-17.json`;
- `data/reports/proteus-spoiler-import-report-2026-05-17.json`;
- `docs/releases/proteus/spoiler-import-report.md`;
- die erledigte Einzelactivity zum Proteus-Spoilerimport.

Proteus-Dokumentverweise zeigen jetzt auf die Rohquelle, den aktiven
Kartenstand und das aktive Supportmanifest. Historische Chroniken dürfen die
damaligen TODO-Dateinamen weiterhin als zeitgenössischen Nachweis nennen.

## Bewusst beibehalten

- direkt ausführbare Betriebs-, Asset-, Benchmark-, Replay- und
  Decision-Checkpoint-Skripte: Ein Importscanner erkennt CLI-Einstiegspunkte
  nicht zuverlässig; mehrere sind aktive Package-Kommandos, Runbook-Werkzeuge
  oder erst im Juli 2026 verwendete Diagnosepfade;
- `data/rules/proteus-mechanics-coverage-2026-05-17.json` und die darauf
  verweisenden Mechanikverträge, weil sie weiterhin einzigartige
  Cluster-/Regel-Evidence enthalten;
- aktive Compatibility-Grenzen für Replay, PlayerView, Payloads und
  Kartenmechaniken; `legacy` im Namen oder Kommentar ist allein kein
  Löschkriterium.

## Testkorrekturen aus dem Vollcheck

Der erste kombinierte Volltest deckte zwei veraltete beziehungsweise zu enge
Server-Testannahmen auf:

- Der Root-Rez-Test bildet jetzt den aktuellen Ablauf
  `jack_out/continue_run -> movement_rez_window` ab und erwartet dort die
  Corp-AI-Aktion.
- Der lange, deterministische KI-vs-KI-Smoke benötigt isoliert rund 65,5
  Sekunden. Sein Budget wurde von 60 auf 120 Sekunden angehoben; die
  Verhaltensassertionen blieben unverändert.

## Verifikation

- Workspace-Typecheck: grün;
- Package-Boundaries: grün, 1.875 Dateien;
- Engine-Source-Structure plus Selftest: grün, 995 Produktionsdateien,
  null relative Zyklen;
- AI-Source-Structure plus Selftest: grün, 670 Produktionsdateien, null
  Runtime- und Typzyklen;
- kombinierter Vollnachweis: 698 Testdateien und 5.504 Tests grün
  (Shared, Catalog, Decks, Engine, AI, Web, Server und Root-Specs);
- Test-Discovery: alle physischen Pakettests erfasst;
- vollständiger Produktions-Build einschließlich Next.js: grün;
- erneuter Knip-Scan: keine verwaisten App-/Package-Module und keine
  Dependency-Probleme; verbleibende Dateimeldungen sind direkte CLI-/Script-
  Einstiegspunkte;
- `git diff --check`: grün;
- keine `*.todo.md`-Datei mehr im Arbeitsbaum.
