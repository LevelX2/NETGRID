# CODEX_STATUS

Stand: 2026-07-10

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
52/52 Karten abgeschlossen. Proteus ist mit 154/154 Karten technisch
`ai_supported`; alle 114 Pilotdeck-Karten sind an elf Familien-Szenarien
gebunden. Vier qualifizierte Proteus-Snapshots sind im AI-Deckpool 1.1.0 für
poolbewusste feste oder seedbasierte Auswahl freigegeben. Technischer Support
ist keine automatische Play-Strength-Freigabe.

Die Semantic Runtime ist der einzige produktive KI-Entscheidungsweg. Alte
Planer, Shadow-/META-Runtime, historisch benannte Controllerprofile und
stille Legacy-Fallbacks sind kein aktueller Vertrag. Der Coverage-Restpfad
ist fail-closed und darf nur vorhandene sichere LegalActions auswählen.

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

## Aktive Gates

```text
corepack pnpm typecheck
corepack pnpm test:contracts
corepack pnpm test:ai:shards
corepack pnpm check:package-boundaries
corepack pnpm check:card-asset-retention
corepack pnpm check:ai:full
corepack pnpm check:proteus-ai-readiness
corepack pnpm build
```

Paketnahe Tests bleiben vor dem Full Gate Pflicht. Tests mit Timeout oder
abgebrochene Prozesse gelten nicht als bestanden.

## Offene technische Schwerpunkte

- `apps/web/app/page.tsx`, `apps/web/app/chronicle.ts`,
  `apps/server/src/multiplayer.test.ts` und Teile des Corp-AI-Scorings sind
  weiterhin groß.
- Das Engine-Architektur-Zielgate ist ohne Baseline-Ausnahme grün;
  Mark-Counter-Anzeigen sind datengetrieben.
- Ability-Payloadfelder mit historischem Namen sind noch aktive Producer-/
  Consumer-Verträge und erst nach eigener Normalisierung entfernbar.
- Fremde Worktrees werden nur mit sauberem Status und eindeutigem
  Eigentumsnachweis entfernt.

## Retention

Nummerierte AI020-bis-AI212-Prozesse, Dry-Runs und Rohscorecards sind keine
aktuelle Freigabe. Der verbleibende Erkenntniswert liegt in
`docs/reviews/ai/ai-historical-process-rollup-2026-07-10.md` und der
historischen Codex-Chronik. Neue große Rohläufe gehören nach `data/local/`;
versioniert werden nur aktuelle Gates, reproduzierbare Regressionen,
Architekturentscheidungen und konkrete Removal Conditions.
