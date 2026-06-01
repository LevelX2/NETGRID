# AI019 Runner Program Semantics Review

## Kurzfazit

AI019 inventarisiert alle 98 aktiven/compiled Runner-Programme aus Classic/Originalset und Proteus. Die 42 Icebreaker-/BreakerProfile-Faelle aus AI018/AI018c bleiben eingefroren; alle 56 Nicht-Icebreaker-Programme wurden fachlich nachgezogen. Ergebnis: 73 neue katalogisierte Taktiksignale, keine neue Strategy-ID, keine Planner-, ActionScore-, PlanWeight-, Engine-, LegalAction-, Targeting-AI-, Profil-/Default- oder UI-Derivationswirkung.

## Scope und Out-of-Scope

- Scope: Classic/Originalset Runner-Programme plus Proteus Runner-Programme, soweit aktiv und compiled vorhanden.
- Kernscope: Nicht-Icebreaker-Programme, inklusive Daemons, Stealth-/Recurring-Credits, Trace/Link, Detection, Access-/Run-Werkzeuge, Programmsuche, Programmschutz, ICE-/Server-Manipulation, Damage/Survival und Viren.
- Frozen: Icebreaker und Karten mit BreakerProfile aus AI018/AI018c, nur mit Nicht-Regressionspruefung.
- Out-of-Scope: Preps, Resources, Hardware allgemein, Corp-Karten, LegalAction Semantic Bridge, Planner-/Runtime-Verbrauch, grosse Legacy-Migration und UI-Derivationslogik.

## Inventarcounts

| Kategorie | Anzahl |
| --- | ---: |
| Aktive/compiled Runner-Programme | 98 |
| Frozen Icebreaker / BreakerProfile | 42 |
| Gepruefte Nicht-Icebreaker-Programme | 56 |
| Geaenderte Nicht-Icebreaker-Programme | 56 |
| Neue Taktiksignale | 73 |
| Neue Strategy IDs | 0 |

## Clusteruebersicht

| Cluster | Karten | Geaendert | Strategy-Anker | Support-only |
| --- | ---: | ---: | ---: | ---: |
| Access / HQ / R&D / Information | 4 | 4 | 4 | 0 |
| Daemon / Hosting | 3 | 3 | 0 | 3 |
| Damage Prevention / Survival | 5 | 5 | 1 | 4 |
| Detection / Expose / Scouting | 5 | 5 | 0 | 5 |
| Economy / Setup | 4 | 4 | 0 | 4 |
| ICE- / Server-Manipulation | 6 | 6 | 0 | 6 |
| Frozen Icebreaker / BreakerProfile | 42 | 0 | 0 | 0 |
| Programmsuche / Installation / Schutz | 3 | 3 | 2 | 1 |
| Stealth / Recurring Credit | 3 | 3 | 0 | 3 |
| Trace / Link | 4 | 4 | 0 | 4 |
| Virus-Programme | 19 | 19 | 6 | 13 |

## Taktiksignale

AI019 fuegt 73 wiederverwendbare Signale hinzu: 61 support-only und 12 may-anchor-faehig. Bestehende Signale wie `setup.search`, `setup.install_discount`, `economy.recurring`, `access.hq_multiaccess`, `access.rnd_multiaccess`, `ice.strength_reduction` und Breaker-/Icebreaker-Supportsignale werden weiterverwendet. Zusaetzlich wird das bestehende `defense.trace_defense` auf support-only gesetzt, damit Trace-/Link-Karten nicht automatisch `runner.survival_defense` ankern.

## Strategy IDs und Ankerentscheidungen

Es gibt keine neue Strategy-ID. Strategieanker stehen nur bei Karten, die eine Decklinie wirklich tragen oder wesentlich ermoeglichen: HQ-/R&D-Druck, Interface-Closeout, Search-Breaker oder Survival-Defense. Reine Link-/Trace-Karten, Daemons, Recurring-Credits, Trash-Credits, Programmschutz, einfache Detection und normale Support-Viren bleiben ohne pauschalen Strategieanker. `economy.trash_credit` bleibt support-only und erzeugt keinen `runner.remote_trash`-Anker.

## Strategy-Support-Paare

Die aktive Hintdatei speichert `lineSupport` und `strategicRole` weiterhin getrennt. Der JSON-Report gibt deshalb 15 eindeutige `strategySupportPairs` report-only aus. Karten mit Paaren: Boardwalk (onr_v1_008_boardwalk), Crumble (onr_proteus_084_crumble), Deep Thought (onr_v1_017_deep-thought), Emergency Self-Construct (onr_v1_022_emergency-self-construct), Expert Schedule Analyzer (onr_v1_024_expert-schedule-analyzer), Garbage In (onr_proteus_089_garbage-in), Highlighter (onr_proteus_090_highlighter), Microtech AI Interface (onr_v1_041_microtech-ai-interface), Mystery Box (onr_v1_043_mystery-box), R&D-Protocol Files (onr_v1_050_r-and-d-protocol-files), Self-Modifying Code (onr_v1_059_self-modifying-code), Shredder Uplink Protocol (onr_v1_062_shredder-uplink-protocol), Vienna 22 (onr_proteus_098_vienna-22).

## TargetProfile-Kandidaten

TargetProfile V1 bleibt diagnostisch/read-only und erzeugt keine Zielwahl. Aufgenommen oder bestaetigt wurden Expose-Ziele, Server-/Fort-Ziele, ICE-Ziele, Programmschutz, Programmsuche und Lockjaws Icebreaker-Ziel. Status: Disintegrator: schema_gap; Lockjaw: target-profile-v1; Afreet: target-profile-v1; False Echo: target-profile-v1; I Spy: target-profile-v1; Imp: target-profile-v1; Joan of Arc: target-profile-v1; Mouse: target-profile-v1; Mystery Box: target-profile-v1; Netspace Inverter: target-profile-v1; Pattel’s Virus: target-profile-v1; SeeYa: target-profile-v1; Self-Modifying Code: target-profile-v1; Smarteye: target-profile-v1; Startup Immolator: schema_gap; Succubus: target-profile-v1. Startup Immolator und Disintegrator bleiben als Schema-Gap markiert, weil die Voraussetzung alle Subroutinen gebrochen nicht als Condition modelliert ist.

## Deferred Items

- `strategySupportPairs` bleiben report-only, bis das aktive Schema Rollen direkt pro Strategieanker speichert.
- `all_subroutines_broken` fehlt als Condition fuer Startup Immolator und Disintegrator.
- Eine allgemeine `runner.search.program`-Strategy-ID wird nicht eingefuehrt; Mystery Box und Self-Modifying Code bleiben auf `runner.search.breaker` plus Programmsuche-Taktiksignalen.
- Eine generische `runner.virus`-Strategie wird nicht eingefuehrt; Virus ist Mechanik, Strategie kommt nur aus konkretem Payload.

## Post-Review-Liste

Die vollstaendige Post-Review-Liste steht im JSON-Report unter `postReviewAssignments`. Sie enthaelt alle 56 Nicht-Icebreaker-Programme mit mechanischer Familie, Taktiksignalen, Strategy-Ankern, Legacy-Rolle, eindeutigen Strategy-Support-Paaren, TargetProfile-Status, Reviewstatus und Begruendung.

## Verifikation

Die Verifikationsliste steht maschinenlesbar im JSON-Report. Bis zur Reporterzeugung sind Derived-Facts, Full-Derived-Facts, compiled Hints, Inspector-Index, Compiled-Index, Taxonomie, Manual Overlays, Hint Quality, Approval Consistency, DeckDoctrine Strategy und die AI-Test-Suite erfolgreich gelaufen. Typechecks, Custom-Invarianten und `git diff --check` werden unmittelbar vor Commit final nachgezogen.
