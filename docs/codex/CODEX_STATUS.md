# CODEX_STATUS

Stand: 2026-07-19

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

Die Semantic Runtime ist der einzige produktive KI-Entscheidungsweg. Alte
Planer, Shadow-/META-Runtime, historisch benannte Controllerprofile und
stille Legacy-Fallbacks sind kein aktueller Vertrag. Der Coverage-Restpfad
ist fail-closed und darf nur vorhandene sichere LegalActions auswählen.
Der produktive Auswahlweg ist über den side-sicheren
`AiDecisionDebug.decisionChain` bis zur finalen Action und Choice getrennt
beobachtbar; diese Observability verändert weder Scoring noch Planpriorität.
Der vorhandene SQLite-KI-Trace persistiert die Kette im normalen
`summary`-Modus kompakt und im erweiterten `detailed`-Modus vollständig unter
demselben `trace_json`-Pfad.

Das AI-Source-Structure-Gate ist nach der Remediation aller neun am 19.07.2026
reproduzierten Größenverstöße wieder grün. Choice-Ranking, Scoring-Window,
Corp-Score, Board-Triage und Cutover-Tests besitzen fachliche Owner- oder
Vertragsgrenzen; der produktive Importgraph bleibt frei von Laufzeit- und
Typzyklen. `check:ai`, `check:ai:full` und 406 AI-Testdateien mit 2.793 Tests
sind grün. Führend ist
`docs/reviews/ai/ai-source-structure-gate-remediation-final-review-2026-07-19.md`.

Das jüngste Runner-Endgame-Review aus Match 424A ist spielgleich geschlossen:
Tag-Vermeidung, projizierte Run-Events, terminale Remote-Vorbereitung,
Bank-/Plan-Arbitration und Mehr-ICE-Bezahlbarkeit besitzen unveränderte
Decision-Checkpoint-Verträge. Der vollständige Abschlusslauf umfasst 333
AI-Testdateien und 2253 grüne Tests. Führend ist
`docs/reviews/ai/ai-match-424a-runner-endgame-remediation-final-2026-07-15.md`.

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
corepack pnpm check:ai:full
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
