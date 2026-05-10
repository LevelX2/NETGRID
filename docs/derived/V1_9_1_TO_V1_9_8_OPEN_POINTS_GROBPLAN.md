# V1.9.x Grobplanung (V1.9.1 bis V1.9.8) für offene Ursprungsset-Punkte

Stand: 2026-05-10  
Status: grobgeplant (Planung, keine Implementierung)

## Ziel und Rahmen

Diese Grobplanung definiert eine vollständige V1.9.x-Folgelinie, um die nach V1.9.0 verbleibenden offenen O:NR-v1-Mechanik- und Kartenpunkte systematisch umzusetzen.

Leitlinien:

- Engine-Korrektheit, Hidden-Info-Schutz, Replay-/StateHash-Determinismus und LegalAction-only bleiben harte Gates.
- Keine Scope-Verschiebung zu V2.x-Produktfeatures.
- Jede Kartenfreigabe bleibt releasegebunden über `freigabefähig` vs `deferred`.
- Jeder Releaseabschluss enthält verpflichtend das Anheben der sichtbaren Webclient-Version auf den Zielstand und den Nachweis im Final Review.

## Quellen und Berechnungsbasis

- `docs/codex/CODEX_STATUS.md` (V1.9.0 abgeschlossen am 2026-05-10)
- `docs/derived/V1_9_0_*`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/manifests/card-implementation-manifest-*.json`

Backlog-Schnitt (Stand 2026-05-10):

- 374 Basisset-Karten in der lokalen Matrix
- 114 bereits in O:NR-v1-Release-Manifests freigegeben
- 260 noch nicht freigegebene Basisset-Karten
- 24 offene Effektfamilien im verbleibenden Bestand

Hinweis zur Methode: Die Zuordnung freigegeben/nicht freigegeben wurde über Titelnormalisierung (alphanumerisch) zwischen Matrix und O:NR-v1-Release-Manifests gebildet.

## Offene Pflichtpunkte nach V1.9.0

### 1) Deferred-Überhang aus V1.9.0

- `Cockroach`
- `Incubator`
- `Grubb`

### 2) Offene Mechanikhinweis-Karten (`geprüft: konkrete Mechanik fehlt`)

- `Grubb` -> Counter-/Run-Persistenz-Lücke
- `Data Naga` -> Hidden-Zone-/Program-Trash-Vertrag
- `TKO 2.0` -> persistenter Action-Loss
- `Data Darts` -> Hidden-Zone + Next-ICE-Break-Restriktion
- `Data Raven` -> Trace/Link + persistente Counter
- `Dupré` -> Run-/Fort-Persistenz + Counter

## Release-Schnitt V1.9.1 bis V1.9.8 (Grob)

| Release | Zielbild | Primäre Effektfamilien | Grobe Backloggröße* |
| --- | --- | --- | ---: |
| V1.9.1 | Schließung des V1.9.0-Deferred-Überhangs | `L3_Deterministischer_Wuerfel_Zufall` (Restfälle) + gezielte Counter-/Run-Persistenz für die drei Deferred-Karten | 3 |
| V1.9.2 | Hidden-Zone-/Access-/Run-Kern verbreitern | `L2_HiddenZone_Search_Reveal_Reorder_Shuffle`, `L2_Access_Breach_und_Multiaccess_Erweiterungen`, `L2_Ambush_auf_Access_Resolver`, `L2_Run_Flow_Erweiterungen_und_RunLocks`, `L2_Recurring_Pools_und_StartOfTurn_Resolver` | 36 |
| V1.9.3 | Trace-/Tag-/Resource-/Action-Fenster konsolidieren | `L2_Trace_Link_Bidding_und_BaseLink_Windowing`, `L2_Tag_Bedingungen_Remove_Avoid`, `L2_Resource_Tag_Interactions`, `L2_Handsize_und_ActionEconomy_Modifier` | 24 |
| V1.9.4 | Damage-/Prevention-/Core-Erweiterungen vervollständigen | `L2_Damage_Familien_und_Flatline_Integration`, `L3_Prevention_Avoid_Replacement`, `L3_Core_Brain_Damage_Erweiterungen` | 22 |
| V1.9.5 | Persistente Boardlogik und globale Modifier skalieren | `L3_Generische_Asset_Node_Faehigkeiten`, `L2_Globale_Statische_Modifier_ICE_Cost_Strength`, `L3_Persistente_Modifier_und_Sonderzustaende` | 32 |
| V1.9.6 | Agenda-/Counter-Schicht schließen | `L2_Counter_System_und_Virus_Purge_Trigger`, `L2_Agenda_Difficulty_und_Overadvance_Details`, `L3_Scored_Agenda_Active_Static_Overadvance` | 43 |
| V1.9.7 | Upgrade-/Programm-/Hosting-/Destroy-Lifecycles schließen | `L3_Generische_Upgrade_Faehigkeiten`, `L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink`, `L2_Hosting_und_Hosted_Resource_Modelle`, `L3_Uninstall_und_InstalledCard_Destroy` | 51 |
| V1.9.8 | Resolver-Longtail, Vollabdeckungs- und KI-Gedächtnispräzisions-Gate | `L1B_PerCard_Resolver_Test_Gate` (Restbestand) + finaler Backlog-Cut auf 0 offene Effektfamilien | 49 |

\*Grobe Backloggröße: heuristische Kartenzuordnung nach „spätest benötigter Effektfamilie“ plus Override für `Cockroach`/`Incubator`/`Grubb` in V1.9.1.

## Ergänzende KI-Härtungsspur (neu)

Planentscheid vom 2026-05-10: Ein zusätzlicher KI-Härtungspunkt „side-sicheres Positionsgedächtnis“ wird verbindlich in V1.9.8 eingeplant.

Zielbild:

- Die KI hält rechtmäßig gesehene Hidden-Zone-Informationen positionsgenau nach (`R&D`, `HQ`, `Remote`), statt nur grobe Wertannahmen zu nutzen.
- Das Gedächtnis folgt sichtbaren Zonenwanderungen deterministisch (z. B. `R&D -> HQ` nach Corp-Draw, Invalidation bei `shuffle`/`arrange`/`swap`/relevanten Access-Moves).
- DecisionDebug trennt klar zwischen `sicher gewusst` und `hypothesiert`; Unsicherheit bleibt sichtbar.
- Hidden-Info-Vertrag bleibt hart: keine Annahmen über unbekannte Kartentitel, keine Einsicht in echte gegnerische Hand-/Deckwahrheit.
- Difficulty bleibt ein Qualitäts-/Risikoprofil und kein zusätzlicher Informationskanal.

Abnahmekriterien im Zielrelease:

1. Runner-/Corp-Szenarien für positionsgenaues Memory über mehrere Züge inklusive Draw-/Shuffle-/Undo-ähnlicher Rekonstruktion bestehen.
2. Hidden-State-Invariance bleibt grün: gleiche sichtbare Projektion führt zu gleichem Entscheidungsverhalten.
3. Replay-/StateHash-Isolation bleibt grün: Belief-/Memory-Rekonstruktion verändert keinen echten GameState.

## Vollständige Zuordnung der offenen Effektfamilien auf V1.9.x

| Effektfamilie | Offene Karten im Restbestand | Zielrelease |
| --- | ---: | --- |
| `L3_Deterministischer_Wuerfel_Zufall` | 9 | V1.9.1 |
| `L2_HiddenZone_Search_Reveal_Reorder_Shuffle` | 51 | V1.9.2 |
| `L2_Access_Breach_und_Multiaccess_Erweiterungen` | 23 | V1.9.2 |
| `L2_Ambush_auf_Access_Resolver` | 11 | V1.9.2 |
| `L2_Run_Flow_Erweiterungen_und_RunLocks` | 22 | V1.9.2 |
| `L2_Recurring_Pools_und_StartOfTurn_Resolver` | 22 | V1.9.2 |
| `L2_Trace_Link_Bidding_und_BaseLink_Windowing` | 35 | V1.9.3 |
| `L2_Tag_Bedingungen_Remove_Avoid` | 14 | V1.9.3 |
| `L2_Resource_Tag_Interactions` | 8 | V1.9.3 |
| `L2_Handsize_und_ActionEconomy_Modifier` | 16 | V1.9.3 |
| `L2_Damage_Familien_und_Flatline_Integration` | 34 | V1.9.4 |
| `L3_Prevention_Avoid_Replacement` | 29 | V1.9.4 |
| `L3_Core_Brain_Damage_Erweiterungen` | 6 | V1.9.4 |
| `L3_Generische_Asset_Node_Faehigkeiten` | 44 | V1.9.5 |
| `L2_Globale_Statische_Modifier_ICE_Cost_Strength` | 16 | V1.9.5 |
| `L3_Persistente_Modifier_und_Sonderzustaende` | 25 | V1.9.5 |
| `L2_Counter_System_und_Virus_Purge_Trigger` | 44 | V1.9.6 |
| `L2_Agenda_Difficulty_und_Overadvance_Details` | 24 | V1.9.6 |
| `L3_Scored_Agenda_Active_Static_Overadvance` | 24 | V1.9.6 |
| `L3_Generische_Upgrade_Faehigkeiten` | 24 | V1.9.7 |
| `L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink` | 18 | V1.9.7 |
| `L2_Hosting_und_Hosted_Resource_Modelle` | 10 | V1.9.7 |
| `L3_Uninstall_und_InstalledCard_Destroy` | 4 | V1.9.7 |
| `L1B_PerCard_Resolver_Test_Gate` | 49 | V1.9.8 |

## Offene Mechanikhinweis-Karten in der V1.9.x-Linie

| Karte | Zielrelease | Begründung |
| --- | --- | --- |
| `Grubb` | V1.9.1 | expliziter Deferred-Überhang aus V1.9.0 |
| `Data Naga` | V1.9.2 | Hidden-Zone-/Access-nahe Mechaniklücke |
| `TKO 2.0` | V1.9.3 | Action-Economy-Modifier persistent |
| `Data Darts` | V1.9.4 | Damage-Pfad mit Hidden-Zone-Kopplung |
| `Data Raven` | V1.9.6 | Trace/Link + Counter-Lifecycle |
| `Dupré` | V1.9.6 | Run-/Fort-Persistenz + Counter-Lifecycle |

## Mindest-Gates pro V1.9.x-Release

1. Requirements/Spec/Testmatrix/Requirements-Review pro Release verpflichtend.
2. Preflight: jede Kandidatenkarte als `freigabefähig` oder `deferred` markiert.
3. Pflichtartefakte je Release:
   - `docs/derived/V1_9_x_*`
   - `data/manifests/card-implementation-manifest-1.9.x.json`
   - `data/rules/mechanics-coverage-1.9.x.json`
   - `data/scenarios/v19x-card-release-smoke.json`
4. `lint`, `typecheck`, `test`, `build` sowie release-spezifische Engine-/Catalog-/Server-Smokes müssen grün sein.
5. No-Scope-Gate: keine V2.x-Produktfeatures, keine Hidden-Info-Leaks, kein impliziter Kartenunlock außerhalb des freigegebenen Kernkorbs.

## Ergebnis

Mit dieser Linie sind alle derzeit offenen Ursprungsset-Punkte vollständig in V1.9.x eingeplant:

- V1.9.1 schließt den expliziten Deferred-Überhang aus V1.9.0.
- V1.9.2 bis V1.9.7 schließen die verbleibenden 23 offenen Effektfamilien strukturiert.
- V1.9.8 zieht den Per-Card-Resolver-Longtail durch ein finales Vollabdeckungs-Gate auf 0 offene Effektfamilien.
