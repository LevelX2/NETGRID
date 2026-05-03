# Qualitätsprüfung

## Aktuelle Hinweise

- `data/decks/demo-decks.json` wurde in Phase 1 gegen `docs/source/Erstes Testdeck.txt` und das konsolidierte MVP-0.1-Konzept normalisiert und als Derived-Datenartefakt eingefroren.
- Phase 1 hat JSON-Parse, Must-Requirement-Coverage und `playable_mvp`-Card-Coverage bestanden.
- Vor `pnpm install` Node 24 LTS verwenden; beim Setup war Node `v24.15.0` aktiv und `pnpm` nicht im PATH.
- Phase 2 muss Hidden-Info-Tests, Replay/StateHash-Tests, stale-action- und illegal-action-Tests früh grün bekommen.
- Nach jeder weiteren Phase prüfen, ob `Index.md`, `Aktueller Projektstatus.md` und `Log.md` nachgezogen werden müssen.

## Lint-Regeln

- Keine unklaren Quellenprioritäten.
- Keine Vermischung von MVP 0.1 und MVP 0.2 ohne Gate-Hinweis.
- Keine versteckten Scope-Erweiterungen des Kartenpools.
- Keine Full-State- oder Hidden-Info-Daten in Client-, KI-, Replay-, Fehler- oder Log-Kontexten.
- Keine lokalen Secrets oder privaten Tokens in versionierten Dateien.
