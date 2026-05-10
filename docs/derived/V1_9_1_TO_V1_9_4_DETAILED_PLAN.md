# V1.9.1 bis V1.9.4 Detailplanung

Stand: 2026-05-10  
Status: detailgeplant (nur Planung, keine Implementierung)

## Ziel und Rahmen

Dieses Dokument liefert eine umsetzungsreife Detailplanung fuer die naechsten vier Pflicht-Releases nach V1.9.0:

1. V1.9.1 Deferred-Aufloesung und Restfaelle deterministischer Zufall
2. V1.9.2 Hidden-Zone-/Access-/Run-Kernverbreiterung
3. V1.9.3 Trace-/Tag-/Resource-/Action-Fenster-Konsolidierung
4. V1.9.4 Damage-/Prevention-/Core-Erweiterungen

Verbindliche Leitlinien:

- Engine-Korrektheit, Hidden-Info-Schutz, Replay/StateHash-Determinismus und LegalAction-only bleiben harte Gates.
- Keine Scope-Verschiebung zu V2.x.
- V2.0 ist bis nach gruenem Abschluss von V1.9.8 gesperrt.
- Jeder Releaseabschluss hebt die sichtbare Webclient-Version auf den Zielstand an und weist das im Final Review nach.
- Kein automatischer AI-Support-Upgrade durch Kartenfreigabe.

## Gepruefte Quellen

- `docs/codex/CODEX_STATUS.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/derived/V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN.md`
- `docs/derived/V1_9_0_DETAILED_PLAN.md`
- `docs/derived/V1_9_0_REQUIREMENTS.md`
- `docs/derived/V1_9_0_TEST_MATRIX.md`
- `docs/derived/V1_9_0_REQUIREMENTS_REVIEW.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Konsistenz- und Widerspruchspruefung

| Frage | Befund | Entscheidung |
| --- | --- | --- |
| Ist V2.x nach V1.9.0 direkt dran? | Nein. Roadmap und Status sind jetzt auf V1.9.1 bis V1.9.8 vor V2.x ausgerichtet. | V1.9.1 bis V1.9.8 sind Pflichtlinie vor V2.0. |
| Ist die Viererfolge V1.9.1 bis V1.9.4 fachlich konsistent? | Ja. Sie folgt der Effektfamilien-Reihenfolge aus dem Grobplan und minimiert Cross-Release-Blocker. | Sequenz wird unveraendert uebernommen. |
| Gibt es eine Datenluecke in der lokalen Matrix? | Ja. Die Spalte `Naechster geplanter Kartenrelease` endet lokal bei V1.9.0. | V1.9.1+ wird ueber Preflight aus Effektfamilien-/Manifest-Differenz eingefroren. |
| Sind bekannte Sonderfaelle den vier Releases korrekt zugeordnet? | Grobplan nennt `Grubb` (V1.9.1), `Data Naga` (V1.9.2), `TKO 2.0` (V1.9.3), `Data Darts` (V1.9.4). | Diese vier Karten werden als Pflicht-Pruefpunkte je Release gesetzt. |
| Gefaehrdet die Viererlinie Hidden-Info-/Determinismus-Gates? | Erhoehtes Risiko bei Hidden-Zone, Trace, Prevention. | Je Release eigene Visibility-/Replay-/Undo-Gates verpflichtend. |

## Sequenz und Release-Schnitt

| Release | Primare Effektfamilien | Geplanter Grobkorb | Pflicht-Sonderfaelle |
| --- | --- | ---: | --- |
| V1.9.1 | `L3_Deterministischer_Wuerfel_Zufall` Rest + Counter/Run-Persistenz fuer Deferred | 3 | `Cockroach`, `Incubator`, `Grubb` |
| V1.9.2 | `L2_HiddenZone_Search_Reveal_Reorder_Shuffle`, `L2_Access_Breach_und_Multiaccess_Erweiterungen`, `L2_Ambush_auf_Access_Resolver`, `L2_Run_Flow_Erweiterungen_und_RunLocks`, `L2_Recurring_Pools_und_StartOfTurn_Resolver` | 36 | `Data Naga` |
| V1.9.3 | `L2_Trace_Link_Bidding_und_BaseLink_Windowing`, `L2_Tag_Bedingungen_Remove_Avoid`, `L2_Resource_Tag_Interactions`, `L2_Handsize_und_ActionEconomy_Modifier` | 24 | `TKO 2.0` |
| V1.9.4 | `L2_Damage_Familien_und_Flatline_Integration`, `L3_Prevention_Avoid_Replacement`, `L3_Core_Brain_Damage_Erweiterungen` | 22 | `Data Darts` |

## Abhaengigkeitslogik ueber alle vier Releases

1. V1.9.1 loest den expliziten Deferred-Ueberhang aus V1.8.1/V1.9.0 auf und stellt den Zufallskern fuer verbleibende Sonderfaelle stabil.
2. V1.9.2 baut Hidden-Zone-/Access-/Run-Vertraege aus, die fuer spaetere Damage-/Prevention-Wege strukturell benoetigt werden.
3. V1.9.3 haertet Trace-/Tag-/Resource-Fenster und Actions, damit V1.9.4-Prevention/Schadenspfade keine instabilen Kosten-/Choice-Pfade nutzen.
4. V1.9.4 schliesst Damage-/Prevention-/Core-Familien als eigenen Hochrisiko-Gateblock.

## Releaseplan im Detail

### V1.9.1

- Scope: Deferred-3er-Kern (`Cockroach`, `Incubator`, `Grubb`) plus notwendige deterministische Zufalls-/Persistenzvertraege.
- Nicht-Scope: keine Hidden-Zone-Breite aus V1.9.2, keine Trace-/Tag-Breite aus V1.9.3, keine Damage-/Prevention-Breite aus V1.9.4.
- Pflichtentscheidung: exakter 3er-Kern, keine Zusatzfreigabe.
- Haupttests: deterministische Random-/Counter-/Run-Persistenz, Visibility, Replay/StateHash, stale/illegal action.

### V1.9.2

- Scope: Hidden-Zone-/Access-/Run-/Recurring-Ausbau gemaess Effektfamilien.
- Nicht-Scope: Trace/Tag/Resource, Damage/Prevention/Core.
- Pflichtentscheidung: `Data Naga` muss vor Code als `freigabefaehig` oder `deferred` mit Begruendung markiert werden.
- Haupttests: Hidden-Zone-Redaction, Access-Reihenfolge, Run-Locks, Reconnect-/Undo-Barrieren.

### V1.9.3

- Scope: Trace-/Tag-/Resource-/Action-Economy-/Handsize-Fenster.
- Nicht-Scope: Counter-Folgestrang aus V1.9.6 bleibt ausgenommen.
- Pflichtentscheidung: `TKO 2.0` muss vor Code als `freigabefaehig` oder `deferred` mit Begruendung markiert werden.
- Haupttests: Trace/Bid-Determinismus, Tag-Remove/Avoid, Resource-Trash, Action-Loss/Handsize-Konsistenz.

### V1.9.4

- Scope: Damage-Familien, Prevention/Avoid/Replacement-Erweiterungen, Core-Brain-Damage-Erweiterungen.
- Nicht-Scope: Broad Counter-/Agenda-Lifecycle (V1.9.6), Upgrade-/Hosting-Lifecycles (V1.9.7).
- Pflichtentscheidung: `Data Darts` muss vor Code als `freigabefaehig` oder `deferred` mit Begruendung markiert werden.
- Haupttests: Damage-/Prevention-Reihenfolge, Choice-Windows, Hidden-Info-Schutz bei Schadensereignissen, Flatline/Core-Grenzfaelle.

## Offene Punkte und Klaerung

1. Kartenzuordnung V1.9.2 bis V1.9.4 ist als Grobkorb vorhanden, aber noch nicht als exakte Runtime-Allowlist eingefroren.  
Klaerung: Pro Release ist ein `Release Assignment Preflight` vor Implementierung verpflichtend.

2. `Data Raven` und `Dupre` sind laut Grobplan V1.9.6-Themen und duerfen in V1.9.1 bis V1.9.4 nicht implizit vorgezogen werden.  
Klaerung: harte Deferred-Regel fuer beide Karten in den vier Releases.

3. Lokale Matrix-Release-Spalte endet bei V1.9.0.  
Klaerung: Freeze basiert auf Effektfamilien-Mapping plus Manifest-Diff, nicht auf der alten Release-Spalte.

## Gemeinsame Gate-Regeln fuer alle vier Releases

- Pro Release Pflichtartefakte: Requirements, Spec, Testmatrix, Requirements Review, Implementation Review, Final Review.
- Pro Release Pflichtdaten: `data/manifests/card-implementation-manifest-1.9.x.json`, `data/rules/mechanics-coverage-1.9.x.json`, `data/scenarios/v19x-card-release-smoke.json`.
- Pflichtchecks: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`.
- No-Scope-Gate: keine V2.x-Features, keine Public-Plattformfunktionen, keine Hidden-Info-Leaks, kein impliziter Kartenunlock.

## Ready-for-Implementation-Urteil

- `V1_9_1_to_V1_9_4_planning_review_done: true`
- `ready_for_V1_9_1_requirements_freeze: true`
- `ready_for_V1_9_1_implementation_after_preflight: true`
- `ready_for_V1_9_2_to_V1_9_4_implementation_sequenziell: true`

Die Viererlinie ist konsistent geplant. Nach V1.9.1-Preflight kann die Umsetzung strikt sequenziell gestartet werden.
