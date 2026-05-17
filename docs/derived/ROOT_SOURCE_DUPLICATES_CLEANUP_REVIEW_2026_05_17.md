# Root-/Source-Duplikate Cleanup Review 2026-05-17

Status: documentation-cleanup-review

Dieser Review bewertet die bekannten Duplikate im `docs/`-Root gegen die führenden Ablagen `docs/source/` und `docs/codex/`. Rohquelleninhalte wurden nicht verändert; die Root-Duplikate wurden in diesem Paket noch nicht entfernt.

## Findings

### Niedrig: Drei Root-Rohquellen sind bitgleiche Duplikate von `docs/source/`

Betroffene Dateien:

| Root-Datei | Führender Pfad | SHA-256 |
|---|---|---|
| `docs/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` | `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` | `5D21878215F379EED02189AB6CFE55F2BB74D611AADC11358791F64078CA2697` |
| `docs/NETGRID_MVP_0.2_Plan.md` | `docs/source/NETGRID_MVP_0.2_Plan.md` | `6B849D02F2571CE860EEA6FAA92D31B7BA1E4D888A5D0DA7BB6A74C3E025B3B8` |
| `docs/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` | `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` | `FFD36071034AEAE240CB319B13BE1DAE1D265C4598B44FBBFB90C86297A4523E` |

Risiko: Neue Threads oder manuelle Pflege könnten die Root-Kopie statt der führenden Rohquelle verwenden.

Empfehlung: `docs/source/*` bleibt `keep-source`; die drei Root-Duplikate sind `git-remove-after-condense`, aber erst nach der unten dokumentierten Linkmigration.

### Niedrig: Root-Runbook ist eine veraltete Kopie des Codex-Runbooks

Betroffene Dateien:

| Root-Datei | Führender Pfad | Hash-Befund |
|---|---|---|
| `docs/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` | `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` | Root `D3B00B46162E20319792C4367FDDCBF0DF9B354896D92644E34C50D75758CFDA`, Codex `231B39B3A60AC24BC4F446755723FDD4ABAAD97A3D5BF74A76ABE197A228767B` |

Diff-Befund: `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` enthält sieben zusätzliche Zeilen:

- Vorranghinweis vom 2026-05-08: aktueller Release-Stand und Anschlussplanung laufen über `docs/codex/CODEX_STATUS.md` und `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`.
- Releaseübergreifender Abschluss-Gate ab V1.x: sichtbare Webclient-Version muss auf den Zielrelease-Stand angehoben und im Final Review dokumentiert werden.
- Abschluss-Template-Feld `webclient_release_version_updated`.

Einordnung: Diese Differenz ist bewusst zu behalten. Die neuere und führende Fassung liegt unter `docs/codex/`; die Root-Datei ist nicht führend.

Empfehlung: `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` bleibt `keep-source`; `docs/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` ist `git-remove-after-condense`.

## Referenzbefund

Explizite führende Referenzen:

- Wissensbasis und Quellenlage verweisen auf `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`, `docs/source/NETGRID_MVP_0.2_Plan.md`, `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` und `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md`.
- Datenartefakte wie `data/decks/demo-decks.json`, `data/cards/demo-cards.json`, `data/rules/rules-baseline.json` und `data/rules/rules-baseline-0.2.json` referenzieren bereits `docs/source/`.
- Neuere `docs/derived/`-Artefakte referenzieren für diese Primärquellen überwiegend `docs/source/` und für das Runbook `docs/codex/`.

Explizite Root-Pfad-Referenzen:

- Außer diesem Activity-Paket wurden keine aktiven expliziten Referenzen auf `docs/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`, `docs/NETGRID_MVP_0.2_Plan.md`, `docs/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` oder `docs/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` gefunden.

Bare-Filename-Referenzen:

- `docs/NETGRID_Dokumentenpaket_MVP_0_1_0_2/README_Dokumentenpaket.md` nennt die frühen Quellen mit Dateinamen ohne Pfad. Das ist historisch lesbar, aber vor Entfernung der Root-Duplikate sollte es auf `docs/source/` präzisiert werden.
- `docs/NETGRID_Detailliertes_Testkonzept_MVP_0_1_0_2.md` nennt dieselben frühen Quellen ohne Pfad. Auch hier sollte vor Entfernung der Root-Duplikate auf `docs/source/` präzisiert werden.
- Die beiden Runbook-Dateien enthalten interne Quelllisten mit Bare-Filenames; maßgeblich ist die `docs/codex/`-Fassung, die weiter unten bereits `docs/source/` und `docs/codex/` als führende Pfade nennt.

## Dateiempfehlungen

| Datei | Empfehlung | Begründung |
|---|---|---|
| `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` | keep-source | Führende Rohquelle laut Wissensbasis; Hash identisch zur Root-Kopie. |
| `docs/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` | git-remove-after-condense | Bitgleiches Root-Duplikat ohne aktive explizite Root-Pfad-Referenzen. |
| `docs/source/NETGRID_MVP_0.2_Plan.md` | keep-source | Führende Rohquelle laut Wissensbasis; Hash identisch zur Root-Kopie. |
| `docs/NETGRID_MVP_0.2_Plan.md` | git-remove-after-condense | Bitgleiches Root-Duplikat ohne aktive explizite Root-Pfad-Referenzen. |
| `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` | keep-source | Führende Regelreferenz laut Wissensbasis; Hash identisch zur Root-Kopie. |
| `docs/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` | git-remove-after-condense | Bitgleiches Root-Duplikat ohne aktive explizite Root-Pfad-Referenzen. |
| `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` | keep-source | Führende und vollständigere Runbook-Fassung mit aktuellem Vorranghinweis und Release-Gate. |
| `docs/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` | git-remove-after-condense | Veraltete Root-Kopie; sieben Zeilen fehlen gegenüber dem führenden Codex-Runbook. |

## Link-Migrationsplan

Vor einem separaten Entfernen der vier Root-Dateien:

1. `docs/NETGRID_Dokumentenpaket_MVP_0_1_0_2/README_Dokumentenpaket.md` auf konkrete Pfade zu `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`, `docs/source/NETGRID_MVP_0.2_Plan.md`, `docs/source/Erstes Testdeck.txt` und `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` präzisieren.
2. `docs/NETGRID_Detailliertes_Testkonzept_MVP_0_1_0_2.md` in der Testbasis-Zeile analog auf `docs/source/` präzisieren.
3. Bei Bedarf `docs/README.md` um einen kurzen Hinweis ergänzen, dass frühe Primärquellen ausschließlich unter `docs/source/` liegen und Codex-Runbooks unter `docs/codex/`.
4. Danach die vier Root-Duplikate entfernen:
   - `docs/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
   - `docs/NETGRID_MVP_0.2_Plan.md`
   - `docs/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`
   - `docs/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md`
5. Vor dem Commit erneut `rg` auf alle vier Root-Pfade sowie die vier Dateinamen ausführen und prüfen, ob neue Root-Pfad-Links entstanden sind.
6. `git diff --check` ausführen.

## Offene Fragen

- Soll die spätere Entfernung als eigener Cleanup-Commit erfolgen, oder sollen im nächsten Cleanup-Paket zunächst nur die beiden Bare-Filename-Referenzen präzisiert werden?
- Ein Root-Weiterleitungshinweis ist nicht nötig, solange keine aktiven Root-Pfad-Links existieren. Falls externe lokale Gewohnheitspfade erhalten bleiben sollen, wäre ein kurzer `docs/README.md`-Hinweis besser als vier Root-Stubs.

## Gesamteinschätzung

Der führende Zielzustand ist klar: Rohquellen liegen unter `docs/source/`, Codex-Runbooks unter `docs/codex/`. Die Root-Duplikate können nach Linkmigration entfernt werden, ohne Rohquelleninhalte zu verändern. Die einzige fachliche Differenz liegt beim Runbook; sie gehört zur neueren `docs/codex/`-Fassung und soll nicht zurückportiert oder verworfen werden.
