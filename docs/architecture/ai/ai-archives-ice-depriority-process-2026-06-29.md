# AI Archives ICE Depriorisierung 2026-06-29

Status: in Umsetzung

## Quelle/Vorgabe

Nach der Rush-Scoring-Window-Härtung wurde fachlich korrigiert, dass „Archives ICE gedeckelt“ noch zu schwach ist. Vorrats-Archives-ICE ist aus Korp-Sicht fast immer ein schlechtes Signal und zieht Klicks, Credits und ICE aus den wichtigen Linien ab: Agenda scoren, HQ schützen, R&D schützen und eine wehrhafte Scoring-Remote bauen.

## Gesamtziel

Die Corp-KI soll Archives-ICE nur noch als Notfallmaßnahme bei konkretem sichtbarem Archives-Agenda-Risiko positiv bewerten. Ohne Agenda im Archiv bleibt Archives-ICE auch bei wiederholtem Archives-Druck negativ. Bereits vorhandener Archives-Schutz soll weitere Archives-ICE-Installationen nicht rechtfertigen.

## Annahmen

- Die KI nutzt nur side-safe `AiDecisionInput`, `PlayerView`, `LegalActions`, PublicEvents und erlaubte Kartenmetadaten.
- Es wird keine Bluff-Strategie für Archives gebaut.
- Das Primärziel bleibt: Agendas nicht wegwerfen, sondern in Scoring-Fenstern scoren.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Annahmen über Runner-Hand, Runner-Stack oder verdeckte Runner-Ressourcen.
- Keine generelle Central-ICE-Neukalibrierung außerhalb von Archives.

## Paketfolge

### Paket 1: Prozess und Scope

Ziel: Nutzerfeedback als engen KI-Scope dokumentieren.

Kernartefakt:

- `docs/architecture/ai/ai-archives-ice-depriority-process-2026-06-29.md`

Done-Gate:

- Prozessartefakt vorhanden.

### Paket 2: Runtime-Härtung und Regressionen

Ziel: Archives-ICE ohne konkrete Archives-Agenda stark negativ bewerten; bei Agenda im Archiv nur erstes ICE als Notfall positiv lassen.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.test.ts`

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-scoring-window.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

### Paket 3: Abschluss und Integration

Ziel: Final-Report, Wissenslog, lokaler Merge nach `main`.

Kernartefakte:

- `docs/reviews/ai/ai-archives-ice-depriority-final-2026-06-29.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`

Done-Gate:

- Arbeitsbranch sauber, lokal nach `main` integriert, relevante Checks im Hauptworkspace wiederholt.
