# V1.9.1 bis V1.9.4 Implementation Handoff

Stand: 2026-05-10  
Status: handoff-bereit (Planung abgeschlossen, keine Implementierung)

## Zweck

Dieses Handoff verbindet die detaillierte Viererplanung mit einem umsetzungsnahen Startablauf. Es ist der Einstiegspunkt fuer die naechsten Implementierungsthreads.

## Verbindliche Reihenfolge

1. V1.9.1
2. V1.9.2
3. V1.9.3
4. V1.9.4

Kein Parallelstart. Jeder Release startet erst nach gruenem Final-Gate des Vorgaengers.

## Pflichtartefakte pro Release (bereits vorhanden)

- Requirements
- Spezifikation
- Testmatrix
- Requirements Review

Dateien:

- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/requirements-review.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/requirements-review.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-3-mechanikpaket-l/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-3-mechanikpaket-l/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-3-mechanikpaket-l/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-3-mechanikpaket-l/requirements-review.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/requirements-review.md`

## Startprotokoll je Release

1. Release-Preflight erstellen (`freigabefaehig` vs `deferred`, finaler Kernkorb).
2. Requirements/Spec/Testmatrix gegen Preflight auf Widersprueche pruefen.
3. Erst danach Implementierung starten.
4. Pflichtchecks laufen lassen: `lint`, `typecheck`, `test`, `build`.
5. Datenartefakte erzeugen: Manifest, Mechanics-Coverage, Smoke-Szenario.
6. Implementation Review, Final Review, `CODEX_STATUS.md` aktualisieren.
7. Sichtbare Webclient-Version auf Zielrelease anheben und im Final Review nachweisen.

## Kritische Stop-Regeln

- Hidden-Info-Leak entdeckt.
- Nicht deterministische Replay-/StateHash-Abweichung.
- Scope driftet in V2.x oder spaetere Effektfamilien.
- Preflight-Kernkorb wird waehrend Umsetzung ohne dokumentierten Gate-Beschluss erweitert.

## Gate-Status

- `ready_for_V1_9_1_implementation_after_preflight: true`
- `ready_for_V1_9_2_to_V1_9_4_sequenziell_after_preflights: true`

V2.0 bleibt bis nach gruenem Abschluss von V1.9.8 gesperrt.
