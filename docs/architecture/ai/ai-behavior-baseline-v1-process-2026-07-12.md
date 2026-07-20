# AI Behavior Baseline v1 Prozess

Status: aktiv

## Zweck

AI Behavior Baseline v1 ist der deckübergreifende, deterministische
Referenzlauf für KI-Verhalten. Er ergänzt Siege, Agenda-Punkte und Spielende um
normalisierte Signale für verpasste Scorefenster, ausgelassene
Advanced-Remote-Contests, Plan-Konversion und strategische Stagnation.

Der Test erzeugt keine Trainingsdaten, verändert keine Live-KI und ist keine
zweite Regelautorität. Er verwendet ausschließlich die bestehende
`@netgrid/ai/simulation`-Trace-Mining-Simulation mit `current_candidate` auf
beiden Seiten.

## Fester Standardlauf

- sechs lauffähige Deck-Slots:
  - `progression_tuning_origin_rig_vs_tax`;
  - `progression_tuning_origin_pressure_vs_tax`;
  - `snapshot_holdout_origin_pressure_vs_tag_ops`;
  - `strategy_panel_fast_advance_chrome_rush`;
  - `strategy_panel_net_damage_black_ice`;
  - `strategy_panel_hybrid_score_punish_cheap_bag`.
- zehn feste Seeds `ai-behavior-baseline-v1-01` bis `-10`;
- 480 Aktionen pro Spiel;
- Runner und Korp jeweils `current_candidate`;
- eingefrorene Deck-Fingerprints im Resultat.

Damit deckt der Standardlauf Rig-/Economy-, Event-Pressure- und
Central-Multiaccess-Runner gegen Remote Scoring, Tag & Punish, Fast Advance,
Net Damage und Hybrid Score/Punish ab. Der spätere Vollmodus `--full` verwendet
alle aktuell lauffähigen Deck-Slots.

## Kennzahlen

Die kompakte Baseline enthält drei primäre Verhaltensraten:

1. `missedScoreWindowRate`: verpasste legale Korp-Scorefenster geteilt durch
   vorhandene Scorefenster.
2. `advancedRemoteContestSkipRate`: ausgelassene, als bezahlbar und relevant
   markierte Advanced-Remote-Contests geteilt durch diese Gelegenheiten.
   Das ist ein Diagnosewert, kein isoliertes Fail-Kriterium.
3. `planConversionRate`: innerhalb von drei eigenen Entscheidungen konvertierte
   Pläne geteilt durch konvertierte, abgelaufene oder abgebrochene Planintents.

Ergänzend werden strategische No-Progress-Wiederholungen und konservativ
erkannte `clearly_dominated_plan_choice`-Fälle pro 100 Entscheidungen
ausgewiesen. Sie stehen neben den technischen Gates, nicht an deren Stelle.

Die harten Gates sind unverändert: keine illegalen Aktionen, Replay-Fehler,
Aktionslimits, Fallbacks, Timeouts, Runtimefehler, Hidden-Info-Marker oder
`no_legal_action_failure`; alle Traces müssen redaction-safe sein.

## Ausführung

```powershell
corepack pnpm benchmark:ai-behavior -- `
  --out-json data/local/ai-behavior-baseline-v1-YYYY-MM-DD.json `
  --out-md docs/reviews/ai/ai-behavior-baseline-v1-YYYY-MM-DD.md `
  --raw-out data/local/ai-behavior-baseline-v1-YYYY-MM-DD-raw.json.gz
```

Für einen Vorher-/Nachher-Vergleich wird die vorherige kompakte JSON-Datei
zusätzlich übergeben:

```powershell
corepack pnpm benchmark:ai-behavior -- `
  --baseline data/local/ai-behavior-baseline-v1-YYYY-MM-DD.json `
  --out-json data/local/ai-behavior-baseline-v1-candidate.json `
  --out-md docs/reviews/ai/ai-behavior-baseline-v1-candidate.md `
  --raw-out data/local/ai-behavior-baseline-v1-candidate-raw.json.gz
```

Ab vier angeforderten Slots verteilt der Runner die Slots standardmäßig auf
bis zu vier isolierte Node-Prozesse. Kleinere Läufe bleiben seriell und zahlen
keinen Prozessstart. `--workers 1` erzwingt den seriellen Referenzpfad;
`--workers 2` bis `--workers 32` überschreiben die Automatik bewusst. Die
Zusammenführung bleibt unabhängig von der Fertigstellungsreihenfolge in der
angeforderten Slot-Reihenfolge deterministisch.

`--raw-out` schreibt atomar. Die Endung `.gz` aktiviert die empfohlene
verlustfreie Gzip-Kompression; `.json` bleibt als unkomprimierter kompatibler
Pfad verfügbar. Beide Formate enthalten dasselbe
`ai-behavior-baseline-v1-raw`-Schema und die vollständige redigierte Evidence.

Der Vergleich verweigert eine Bewertung bei abweichender Version, Seeds,
Slot-Reihenfolge, Aktionslimit oder Deck-Fingerprints. Ein anderer Git-Stand ist
erwartet und wird im Bericht als Kandidat ausgewiesen.

## Artefakte und Interpretation

- Die kompakte Baseline und der vollständige redigierte Tracebestand gehören
  nach `data/local/` und bleiben unversioniert.
- Ein kleiner, reproduzierbarer Reviewbericht unter `docs/reviews/ai/`
  dokumentiert Vertrag, technische Gates, Raten und auffällige Slots.
- Eine sinkende Verhaltensrate ist erst bei gleicher Konfiguration sinnvoll.
  Ohne wiederholte Baseline bleibt sie Review-Evidence; feste
  Verschlechterungsschwellen werden erst nach Kalibrierung mehrerer Läufe
  festgelegt.
- Siege und Agenda-Punkte bleiben Kontextwerte. Sie ersetzen keine
  Verhaltensdiagnose.
