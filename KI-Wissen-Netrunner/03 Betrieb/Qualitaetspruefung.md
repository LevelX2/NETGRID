# Qualitätsprüfung

## Aktuelle Hinweise

- Prüfen, ob `Erstes Testdeck.txt` nachgereicht oder als durch das konsolidierte MVP-0.1-Konzept ersetzt markiert werden soll.
- Vor `pnpm install` Node 22 aktivieren; beim Setup war Node `v24.15.0` aktiv und `pnpm` nicht im PATH.
- Vor der MVP-0.1-Requirements-Phase sicherstellen, dass `docs/codex/CODEX_STATUS.md` den aktuellen Quellenstand korrekt abbildet.
- Nach jeder neuen Derived-Doc-Phase prüfen, ob `Index.md`, `Aktueller Projektstatus.md` und `Log.md` nachgezogen werden müssen.

## Lint-Regeln

- Keine unklaren Quellenprioritäten.
- Keine Vermischung von MVP 0.1 und MVP 0.2 ohne Gate-Hinweis.
- Keine versteckten Scope-Erweiterungen des Kartenpools.
- Keine Full-State- oder Hidden-Info-Daten in Client-, KI-, Replay-, Fehler- oder Log-Kontexten.
- Keine lokalen Secrets oder privaten Tokens in versionierten Dateien.
