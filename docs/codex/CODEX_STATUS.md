# CODEX_STATUS

Stand: 2026-07-25

## Einstieg

- Führender Projektstand:
  `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- Aktuelle Roadmap- und Gate-Autorität:
  `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- Historische Status-, Goal- und Release-Chronik:
  `docs/codex/CODEX_STATUS_CHRONICLE.md`
- Älterer Zielverlauf: `docs/codex/GOAL_HISTORY.md`

## Aktuelle Phase

NETGRID ist eine private Version-0-Webanwendung. Engine-Korrektheit,
LegalAction-Disziplin, Hidden-Info-Schutz, deterministisches Replay,
StateHash und seedbasierte RandomDrawRecords sind verbindlich.

Originalset, Classic und Proteus sind technisch spielbar. Classic ist mit
54/54 Karten abgeschlossen. Proteus ist mit 154/154 Karten technisch
`ai_supported`; alle 114 Pilotdeck-Karten sind an elf Familien-Szenarien
gebunden. Vier qualifizierte Proteus-Snapshots sind im AI-Deckpool 1.1.0 für
poolbewusste feste oder seedbasierte Auswahl freigegeben. Technischer Support
ist keine automatische Play-Strength-Freigabe.

Die Plan-first-Live-Runtime ist der einzige produktive
KI-Entscheidungsweg. Historisch benannte Semantic-Runtime-Fassaden rufen
ausschließlich diesen Einstieg auf. Alte Planer, Shadow-/META-Runtime,
historisch benannte Controllerprofile und stille Legacy-Fallbacks sind kein
aktueller Vertrag. Der Coverage-Restpfad ist fail-closed und darf nur
vorhandene sichere LegalActions auswählen.
Der produktive Auswahlweg ist über den side-sicheren
`AiDecisionDebug.decisionChain` bis zur finalen Action und Choice getrennt
beobachtbar; diese Observability verändert weder Scoring noch Planpriorität.
Der vorhandene SQLite-KI-Trace persistiert die Kette im normalen
`summary`-Modus kompakt und im erweiterten `detailed`-Modus vollständig unter
demselben `trace_json`-Pfad.

PF15 des Plan-first-Runtime-Cutovers ist mit Commit `4b0c459f6`
abgeschlossen. Residente `PlanInstance`s sind die einzige persistente
Handlungsautorität; Step, Route und vorhandene LegalAction werden daraus
materialisiert. Tactical Goals bleiben ausschließlich kurzlebige,
`stateVersion`-gebundene und nicht autoritative Goal-/Threat-Signale für
Discovery und Priorisierung. `TransientPlanSignal` typisiert diesen Vertrag;
stale/future Signale, unbekannte Felder und Action-Autoritätsfelder scheitern
fail-closed. Live-Produzenten bestehen für Runner-Remote-Contest, Survival,
Terminal Wins und Corp-Scoreprojekte; der Scheduler bindet nur das exakte
Planmodul, den residenten `dedupeKey` und das Ziel. P1- bis P3-Pläne dürfen
den Intent nur mit belastbarer Evidence
übergehen; P4-/P5-Kampagnen benötigen Intent-Fit oder explizite taktische
Evidence. Ein Override mutiert den Intent nicht automatisch, und normale
Action-Schwankungen wechseln ihn nicht. Der öffentliche Abschluss der
Setup-/Mulliganphase ist als aktueller `phase_change`-Trigger produktiv
angeschlossen; weitere typisierte Revalidierungsgründe benötigen noch eigene
side-sichere Live-Evidence-Produzenten.

Der öffentliche transitive Livegraph enthält keine alten TacticalGoal-,
SemanticChoice-, PracticalMicro-, TacticalPlan-Memory- oder
TacticalPlan-Override-Abhängigkeiten mehr. Öffentliche TacticalGoal-Exporte
und `ownRunnerTacticalGoals` sind entfernt. Live und Simulation verwenden
denselben Plan-first-Einstieg; historische Altverträge bleiben nur als
isolierte Test-/Evaluationsdiagnostik und sind durch Boundary-Gates vom
produktiven Graphen getrennt.

Corp-Verteidigung besitzt keine Legacy-Zentralreserve und keinen eigenen
zentralen Reserveplan. Finanzierung ist ein Economy-Bedarf des exakten
Defense-Parents; Schutzwirkung und Reserve werden getrennt und ausschließlich
über Engine-zertifizierte Quotes bewertet. `Loan from Chiba` wird bei Erwerb
und Entwicklung durch Economy behandelt; Halten, Verlassen und
Zahlungs-/Verlustrisiko gehören nach der Installation in einen
`runner.resource_lifecycle`-Child der exakten Karteninstanz. Unbekannte
Engine-Zahlungsquotes bleiben blockiert und werden nicht geschätzt.

Die verifizierte PF15-Code-Freeze-Baseline umfasst 60 Spiele und 11.012
Entscheidungen. Sie wurde im vollständigen dirty PF15-Arbeitsbaum auf Parent
`527833085` gemessen; dieser Arbeitsstand wurde anschließend mit
`4b0c459f6` committed. Illegal Actions, Replay-, Runtime-, Hidden-Info-,
Fallback-, Timeout-, Action-Limit-, No-Legal-Action- und Redaktionsfehler
stehen jeweils bei null; die Plan-Conversion beträgt `0,670`, klar dominierte
Planwahlen stehen bei null. AI-, Engine-, Shared- und Catalog-Typechecks, alle
drei AI-Vitest-Shards, der vollständige Engine-Lauf mit 207 Dateien und 1.795
Tests sowie Scenario-, Checkpoint-, Hidden-Info-, Authority-, Structure- und
Diff-Gates waren grün. 175 qualitative Trace-Befunde, darunter drei hohe
`corp_never_scores_long_game`-Fälle, und zwei Outcome-Anomalien mit
`gameEndReason=unknown` bleiben sichtbare Qualitäts-Restpunkte, nicht
technische Gate-Ausnahmen. Führend ist
`docs/reviews/ai/ai-behavior-baseline-v1-plan-first-pf15-code-freeze-verified-2026-07-25.md`.

Die historische Regressionsevidence des Matches
`match_fd22cad3cc454a9e` besitzt exakte
Regressionsverträge für eine redundante zweite `Psychic Friend`-Installation
und drei sofortige Runner-Zugenden mit vier Restklicks. Zulässige erste
Breaker-Installationen, null-Klick-Zugenden und ein deterministischer
Corp-Deckout-Sieg sind positive Gegenproben. Die damals aufgezeichneten
Diagnosemetriken wiesen 22 vorzeitige Zugenden und 16 redundante negativ
bewertete Installationen aus, ohne die produktive Auswahl zu verändern. Ein
damaliger eigenständiger Slot erreichte reproduzierbar das
480-Aktionen-Limit. Diese Werte sind historische Regressionsevidence und
nicht der unmittelbar zuvor ausgewiesene PF15-Code-Freeze-Current-State.
Führend ist
`docs/reviews/ai/runner-action-valuation-regression-final-review-2026-07-23.md`.

Aktionskapazität ist zusätzlich als gemeinsame side-sichere Ressource
modelliert. Aktuelle Aktionen stammen ohne Drei-/Vier-Aktionsannahme aus dem
PlayerView; unmittelbare und zukünftige Quellen werden aus LegalActions und
normalisierten Hints projiziert. `ActionDemand`s, begrenzte garantierte oder
kontingente Routen und Planportfolio-Reservierungen binden Zusatzaktionen an
wirkliche Folgeaktionen. Eingeschränkte Bursts ohne kompatible Route werden
nicht spekulativ bevorzugt; selbstfinanzierende Runs zählen ihre Quellaktion
als Umwandlung. Der finale 60-Spiele-Integrationslauf mit 10.974
Entscheidungen ist ohne
Hard Failure, verpasstes Scorefenster, dominierte Planwahl oder
Fehlkonversion akzeptiert. Führend sind
`docs/architecture/ai/ai-action-capacity-routes-implementation-process-2026-07-22.md`
und
`docs/reviews/ai/ai-behavior-baseline-v1-action-capacity-routes-2026-07-22.md`.

Die Corp-Entscheidungsfenster aus `match_e2f2f6f433debe00` sind spielgleich
gehärtet. Wirkungsloses oder negativ getauschtes Rezzing wird abgelehnt,
Mehrkarten-Draw und Credit-Überschuss besitzen getrennte Grenzwerte,
wiederholter R&D-Erfolg bleibt über Runner-Züge als Gegenplan aktiv und
agenda-freies HQ erhält keinen Matchpoint-Sondervorrang. Sichtbare HQ-Agendas
bleiben schützenswert, solange kein garantiert vollständiger Same-Turn-
Scorepfad vorliegt. Dessen Install- und Advance-Schritte werden nicht mehr
gleichzeitig als verzögert oder contestable bestraft. Zehn Match-Checkpoints,
444 AI-Testdateien mit 3.109 Tests und der 45-Karten-Consumer-Audit sind grün;
führend ist
`docs/reviews/ai/match-e2f2-corp-decision-windows-remediation-final-review-2026-07-22.md`.

Die aktuelle Plan-first-Live-Runtime verwendet reine abgeleitete Run-Target-,
Handentwicklungs- und Install-Fit-Ergebnisse innerhalb genau einer synchronen
Entscheidung wieder. Allokationsarme Redaction- und Side-Safety-Prüfungen
erhalten denselben Hidden-Info-Vertrag. Der feste 240-Aktionen-Fall sank vom
bereits optimierten Stand 22,854 auf 18,512 Sekunden und blieb in kompakter
Baseline sowie vollständigen Raw-Slots bitgleich. Der Standard-Benchmark
profitiert ohne zusätzlichen Schalter. Führend ist
`docs/reviews/ai/ai-core-runtime-performance-followup-final-review-2026-07-20.md`.

Choice-Ranking, Scoring-Window, Corp-Score, Board-Triage und Cutover-Tests
besitzen fachliche Owner- oder Vertragsgrenzen; der produktive Importgraph
bleibt frei von Laufzeit- und Typzyklen. Das AI-Source-Structure-Gate schützt
diese qualitativen Grenzen ohne Datei-, Zeilen-, Testgrößen-, Fanout- oder
Runtime-Root-Caps. Führend sind
`docs/architecture/legacy-simplification-process-2026-07-19.md` und
`docs/reviews/architecture/legacy-simplification-final-review-2026-07-19.md`.

Das jüngste Runner-Endgame-Review aus Match 424A ist spielgleich geschlossen:
Tag-Vermeidung, projizierte Run-Events, terminale Remote-Vorbereitung,
Bank-/Plan-Arbitration und Mehr-ICE-Bezahlbarkeit besitzen unveränderte
Decision-Checkpoint-Verträge. Der vollständige Abschlusslauf umfasst 333
AI-Testdateien und 2253 grüne Tests. Führend ist
`docs/reviews/ai/ai-match-424a-runner-endgame-remediation-final-2026-07-15.md`.

## Öffentliche Matches, Live-Zuschauer und Lern-Replays

Jedes Match besitzt genau den Erstellungsflag `isPublic`; der Standard ist
`true`. Öffentliche offene Matches werden ausgeschrieben und können
beigetreten werden. Öffentliche aktive Matches sind über eine read-only
Zuschauerprojektion sichtbar, die weder Hände noch andere verdeckte
Kartenidentitäten, private Choices oder LegalActions enthält.

Nach Matchende liefert ein öffentliches Match ein anonym abrufbares,
StateHash-verifiziertes Full-Information-Replay. Es verwendet dieselbe
Spieloberfläche wie eine laufende Partie und wechselt ohne Schrittverlust
zwischen Runner- und Korp-Perspektive. Die jeweils eigene Hand erscheint im
normalen Board; eine getrennte Analysefläche und ein Gegnerhandfenster
existieren nicht. Private Matches bleiben aus öffentlichen Listen und anonymen
Replaypfaden ausgeschlossen. Eine einmalige SQLite-Normalisierung markiert
alle vorhandenen Matches rückwirkend öffentlich; der Bestandsaudit bestätigte
21/21 öffentliche Matches und 19/19 replayfähige terminale Matches mit 4.218
verifizierten Frames. Führend sind
`docs/architecture/public-match-spectator-replay-process-2026-07-20.md` und
`docs/reviews/public-match-spectator-replay-final-review-2026-07-20.md`.

Der dauerhafte Bereich `Spiele` stellt diese öffentlichen Matches in der
Reihenfolge Offen, Laufend, Abgeschlossen mit passenden Filtern und direkten
Aktionen bereit. `Meine Spiele` verwendet dagegen ausschließlich die
authentifizierte Account-Teilnehmerbindung und darf dadurch auch eigene
private Matches zeigen, niemals aber fremde. Terminale Ergebnisse werden
einmal als immutable Snapshots gespeichert; nach dem historischen Backfill
lesen Listen nur noch kompakte Matchzeilen. Der gemessene Bestandslauf
ergänzte 19/19 Snapshots, fünf warme öffentliche Abrufe lagen bei 73 bis
12 ms. Führend ist
`docs/reviews/public-game-directory-and-personal-history-final-review-2026-07-20.md`.

## Geschlossene Account- und Deck-Alpha

Die erste V2.0-Benutzerstufe ist als geschlossene Passwort-Alpha umgesetzt.
Accounts entstehen nur durch Admin-Bootstrap oder einmalige Einladung;
widerrufbare Sessions, Origin-/CSRF-Schutz, neutrales Loginverhalten und
Hash-only-Persistenz sind aktiv. E-Mail, Passkeys, MFA und öffentliche
Registrierung sind noch kein Produktvertrag.

Ein Account kann bis zu 50 persönliche Server-Decks speichern. 40 kuratierte
Standard-Decks sind unveränderlich direkt spielbar oder kopierbar; interne KI-,
Test- und Retire-Klassen bleiben unsichtbar. Jeder Matchstart verwendet einen
neu validierten immutable Snapshot und bleibt accountfrei in Engine, Replay,
StateHash und KI. Führend sind
`docs/releases/v2/v2-0-auth-privacy-cloud-decks/password-accounts-cloud-decks-final-review-2026-07-18.md`
und `docs/runbooks/account-alpha-operations.md`.

Angemeldete Accounts besitzen außerdem eine private Matchstatistik mit
sicherer, rein serverseitiger Teilnehmerbindung, idempotentem Spiel- und
Serienledger, Runner-/Korp- und Gegnerart-Aufschlüsselung sowie paginierter
redigierter Historie. Schema 3, Export-Schema 2, Accountlöschung,
Backup/Restore, Retention-Unabhängigkeit und Start-Reconciliation sind
abgedeckt. Gäste erhalten keine Statistikansicht; öffentliche Profile,
Ranking, Elo und Leaderboards bleiben bewusst außerhalb der Closed Alpha.
Führend ist
`docs/releases/v2/account-match-statistics-final-review-2026-07-19.md`.

Der SQLite-Persistenzpfad schreibt wachsende Event-, Receipt- und
KI-Trace-Tabellen inkrementell. Ausführlicher KI-Debug besitzt mit dem
Trace-Ledger nur eine dauerhafte Quelle; Replayperspektiven werden daraus
side-sicher hydriert. Backups sind kompakt und konsistent, der lokale
`storage:optimize`-Lauf sichert vor der Normalisierung und dem `VACUUM`, und
Accountstatistik verwendet SQL-Aggregate sowie Keyset-Pagination. Führend ist
`docs/reviews/architecture/sqlite-matchstorage-optimization-final-review-2026-07-19.md`.

Normale Human- und KI-Aktionen verwenden zusätzlich einen bounded SQLite-
Load und einen atomaren Delta-Save mit Match-/StateVersion- und
Historyzähler-Prüfung. Event-Tail, Chronicle, Hidden-Info, Idempotenz, Undo,
Replay und StateHash bleiben stabil; klassische Storage-Adapter behalten den
Vollpfad. Die synthetische 1-/10-/25-Match-Probe war mit 36 genau einmal
persistierten Aktionen grün. Führend ist
`docs/reviews/architecture/delta-action-persistence-final-review-2026-07-19.md`.

## Current-State-Cleanup

Der Prozess
`docs/architecture/current-state-project-cleanup-process-2026-07-10.md`
ersetzt tote Demo-Runtime, abgeschlossene Storage-Importpfade, historische
AI-Einmalskripte und mehrfach versionierte Assetderivate durch aktuelle,
ausführbare Verträge.

- `/api/game` und sein globaler V0.8-State sind entfernt.
- Der abgeschlossene JSON-/Alt-SQLite-Import ist kein Start-, CLI-, Health-
  oder Backupvertrag mehr.
- Die Kartenregistry liegt in `packages/shared/src/card-definitions.ts` und
  exportiert nur `CARD_DEFINITIONS` sowie `CARD_DEFINITIONS_BY_ID`.
- Create-Match-Decks sind ausschließlich participant-scoped.
- Package-Boundaries, Contracttests und drei feste AI-Shards sind
  dokumentiert und ausführbar.
- Lokalisierte Kartenassets versionieren Art-Quellen und Full-PNGs; Review-
  Derivate bleiben lokal.
- Der Repository-Gesamtcheck vom 20.07.2026 hat 19 verwaiste Code-/Barrel-
  Dateien, neun abgeschlossene TODO-Abnahmelisten und die fünfteilige alte
  Proteus-Importkette entfernt. Der erneute Import-/Dependency-Scan enthält
  keine verwaisten App-/Package-Module. Führend ist
  `docs/reviews/architecture/dead-source-todo-artifact-cleanup-final-review-2026-07-20.md`.
- ARC-001 ersetzt private-LAN-basierte Maintenance-Freigabe durch eine
  eigenständige Passwort-/Session-/CSRF-/Reauth-Control-Plane. Lokales HTTP
  ist Loopback-only; Remote Maintenance ist standardmäßig aus und verlangt
  HTTPS sowie einen explizit vertrauten Proxy. Führend:
  `docs/reviews/architecture/maintenance-control-plane-security-final-review-2026-07-11.md`.

## Aktive Gates

```text
corepack pnpm typecheck
corepack pnpm test:contracts
corepack pnpm test:ai:shards
corepack pnpm check:package-boundaries
corepack pnpm check:ai-source-structure
corepack pnpm check:card-asset-retention
corepack pnpm check:proteus-ai-readiness
corepack pnpm build
```

Paketnahe Tests bleiben vor dem Full Gate Pflicht. Tests mit Timeout oder
abgebrochene Prozesse gelten nicht als bestanden.

## Aktueller Playtest-Fund vom 11. Juli 2026

Der sequenzielle Prozess
`docs/architecture/current-game-findings-remediation-process-2026-07-11.md`
schließt zehn Spielbefunde und den Chronicle-Choice-Querschnitt. Pattel-
Counter, öffentliche Choice-Texte, Pay-to-continue-Ton, Dr.-Dreff-Runfolge,
Access-Herkunft, seitenspezifische Ereignisicons und die Auto-End-Barriere sind
gehärtet. `Lockjaw`-Tap und das nicht bezahlbare `Colonel Failure` wurden mit
Regel- beziehungsweise Match-Evidence als Nichtfehler bestätigt.

Führend ist
`docs/reviews/current-game-findings-remediation-final-review-2026-07-11.md`.

## Node-Zugriffseffekt-Rez-Vertrag vom 15. Juli 2026

Alle 56 aktiven Corp-Assets aus Originalset V1, Classic und Proteus wurden auf
Zugriffseffekte geprüft. Zehn besitzen einen semantischen Access-Effekt.
Installierte Access-Quellen benötigen jetzt generisch Rez; sieben Nodes folgen
diesem Default. `Virus Test Site` bleibt die einzige belegte installierte
Unrezzed-Ausnahme und verursacht dann genau 1 Net Damage statt
advancementskalierendem Schaden. Bel-Digmo und Stereogram bleiben reine
R&D-/Archives-Kontrollfälle.

Der vollständige Engine-Lauf ist nach dem Engine Architecture Refresh mit 202
Testdateien und 1.741 Tests grün.
Führend sind
`docs/architecture/card-rules/node-access-rez-contract-process-2026-07-15.md`
und
`docs/reviews/engine/node-access-rez-contract-final-review-2026-07-15.md`.

## Offene technische Schwerpunkte

- PF16 hat den Legacy-Livegraph bereinigt, den nicht autoritativen
  Goal-/Threat-Signalvertrag einschließlich Strategic-Intent-Rückkanal
  typisiert und den Resource-Lifecycle-Vertrag verifiziert. Final Review und
  vollständige Pre-Commit-Gates einschließlich der 60-Spiele-Baseline sind
  grün. Offen sind PF16-Commit, lokale Integration nach `main` und der
  verifizierte Worktree-/Branch-Cleanup.
- `apps/web/app/page.tsx`, `apps/web/app/chronicle.ts` und
  `apps/server/src/multiplayer.test.ts` sind weiterhin groß. Die priorisierten
  Corp-AI-Scoring-, Choice- und Triage-Owner liegen wieder innerhalb ihrer
  geratcheten Grenzen.
- Das Engine-Architektur-Zielgate ist ohne Baseline-Ausnahme grün;
  Mark-Counter-Anzeigen sind datengetrieben. 430 Runtime-Port-Bindings sind
  statisch typisiert; der produktive relative Importgraph ist zyklenfrei.
- Ability-Discriminatorfelder sind normalisiert und PublicEvents enthalten
  keine internen Discriminatornamen mehr. Verbleibende historisch benannte
  Präsentationsfelder werden nur mit nachgewiesener Producer-/Consumer-Parität
  in einem eigenen Folgepaket entfernt.
- Damage, Access, Run und Turn sind fachlich modularisiert; Registries sind
  nach Set, Seite und Kartentyp geordnet. Führend ist
  `docs/reviews/engine/engine-architecture-refresh-final-review-2026-07-18.md`.
- Fremde Worktrees werden nur mit sauberem Status und eindeutigem
  Eigentumsnachweis entfernt.

## Retention

Nummerierte AI020-bis-AI212-Prozesse, Dry-Runs und Rohscorecards sind keine
aktuelle Freigabe. Der verbleibende Erkenntniswert liegt in
`docs/reviews/ai/ai-historical-process-rollup-2026-07-10.md` und der
historischen Codex-Chronik. Neue große Rohläufe gehören nach `data/local/`;
versioniert werden nur aktuelle Gates, reproduzierbare Regressionen,
Architekturentscheidungen und konkrete Removal Conditions.
