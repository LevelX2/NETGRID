# Match 802F – Search-Role- und Remote-Probe-Fix

## Umgesetzte Befunde

### Kartentitel sind keine Suchsemantik

`runnerSourceCardAnswerRole` leitet `search` und `draw` nicht mehr aus Titel,
Typ oder Subtypen ab. Weiterhin gültig bleiben explizite Kartenrollen,
Mechaniken und tatsächlicher Regeltext. Dadurch erhalten weder `Schematics
Search Engine` noch `Library Search` allein wegen ihres Namens eine
Coverage-/Setup-Suchbewertung.

Der spielgleiche Checkpoint D17 bleibt produktiv: Schematics wird weiterhin
installiert, trägt aber nicht mehr `runner_goal_fit_setup_search`. Die direkte
Gegenprobe prüft zusätzlich Library Search und bewahrt echte Tutor- und
Draw-Semantik.

### Funding vor dem kostenfreien Score-Threat-Probe

Bei D13 war `remote_1` ein `probe_only`-Run mit Score-Threat,
`gain_credits_first`, sichtbaren Pfadkosten 0 und einem weiteren
Vorbereitungsklick. Die Planer-Ausnahme für Prüfruns hatte die konkrete
Funding-Empfehlung verworfen. Der Plan wählt jetzt zunächst `gain_credits`.

Die Grenze ist absichtlich eng: Sie gilt nur für Score-Threat-Probes ohne
sichtbare Pfadkosten. Eine sonst gleiche gewöhnliche Probe bleibt zulässig;
ein Score-Threat-Probe mit sichtbaren Pfadkosten bleibt ebenfalls zulässig.
Das vorhandene Match-9FEF-Checkpointpaket bestätigt den zweiten Fall.

## Reproduzierbarkeit und Checks

- Rote Evidenz vor dem Fix: beide neuen Checkpoints lieferten
  `behavior_regression`; siehe
  `docs/reviews/ai/match-802f-search-role-remote-probe-red-evidence-2026-07-17.md`.
- Grüne Ziel- und Gegenproben: 22 Tests in den drei fokussierten Dateien.
- Angrenzende Checkpoints: `match-9fef-runner-decision-checkpoints.test.ts`,
  15 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck` grün.
- `corepack pnpm check:ai-source-structure` grün.

Der vollständige Shard-Lauf wurde nach dem ersten, inzwischen behobenen
9FEF-Fund erneut angestoßen, überschritt in dieser Ausführungsumgebung jedoch
die 124-Sekunden-Grenze ohne weiteres Ergebnis. Die gezielten und angrenzenden
Gates oben sind vollständig grün; der breite Shard-Lauf bleibt als
Umgebungsgrenze dokumentiert.
