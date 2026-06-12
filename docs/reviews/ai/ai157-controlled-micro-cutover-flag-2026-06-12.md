# AI157 Controlled Micro-Cutover Flag

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI157 sollte einen nach AI155 belegten Micro-Cutover hinter einem engen Default-off-Flag testen:

- `NETGRID_AI_ENDGAME_SEMANTIC_CANDIDATE=1`
- nur im konkreten Same-State-Kandidaten-Scope,
- side-safe,
- fallback auf Legacy bei Missing TargetContext,
- Flag off = alte Entscheidung,
- Flag on = nur Kandidatenscope verändert,
- No candidate = Legacy fallback.

## Entscheidung

Kein Runtime-Flag mit Wirkung.

## Begründung

AI149 findet keinen same-state LegalAction-Match und AI155 entscheidet deshalb No-Go. Ein Feature-Flag ohne konkreten Kandidaten würde keinen getesteten Scope absichern, sondern nur eine leere Schaltfläche in die Runtime einführen. Das wäre unnötige Angriffsfläche für Fehlkonfiguration und würde den Testgegenstand nicht verbessern.

## Verhalten

| Modus | Ergebnis |
| --- | --- |
| Flag fehlt | unverändertes Legacy-/bestehendes Semantic-Verhalten |
| Flag hypothetisch gesetzt | keine neue Wirkung, weil kein Kandidat existiert |
| Missing TargetContext | kein Cutover, Legacy fallback |
| No candidate | kein Cutover, Legacy fallback |

## Folge

Ein echtes Flag darf erst eingeführt werden, wenn ein späterer Block einen Kandidaten mit folgenden Nachweisen liefert:

- `same_state_legal_better > 0`,
- TargetContext vollständig oder ausreichend,
- Hard-/Risk-Gates grün,
- x5 nicht schlechter,
- x10 nicht schlechter,
- keine generischen Credit-/Draw-/Run-/Corp-Economy-Mali.

## Verifikation

- AI149: `sameStateMatches = 0`
- AI155: Runtime-Cutover No-Go
- Keine Codeänderung an Runtime-Flags
- `git diff --check`
