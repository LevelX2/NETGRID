# Strategie- und Regelaudit der Überraschungsdecks

Status: in Arbeit  
Branch: `codex/surprise-decks-strategy-audit`  
Worktree: `C:\Projekte\NETGRID_AI_SURPRISE_DECKS_STRATEGY_AUDIT`

## Ziel

Die vier am 10. Juli 2026 freigegebenen Folgepunkte werden sequenziell umgesetzt. Das Ergebnis trennt technische Legalität, klar dominierte Strategieentscheidungen und einen eigenen Regel-/Timing-Audit. Lokale Laufzeitdaten unter `data/local/` bleiben unversioniert.

## Verbindliche Pakete

1. **P0 – Evidence und Reproduktion**: Die freigegebenen Fundstellen und legalen Alternativen werden als Ausgangsbasis fixiert.
2. **P1 – Negative Wiederholungsruns**: Ein opportunistischer Plan darf einen negativ bewerteten Wiederholungsrun nicht gegen eine positiv bewertete legale Alternative erzwingen. Frische oder zwingende Run-Payoffs bleiben geschützt.
3. **P2 – Trash-Ziel und Budget**: Ein als `trash_asset_or_upgrade` gestarteter Run verwendet beim Access das vorher eingeplante Trash-Budget konsistent. Sicherheits- und Bezahlbarkeitsgrenzen bleiben wirksam.
4. **P3 – Duplicate-Detektor**: Positive, stapelbare und einsatzbereite Zweitkopien werden nicht mehr als `duplicate_low_delta_install` gemeldet; aufgeschobene oder wirklich redundante Kopien bleiben sichtbar.
5. **P4 – Optimalitätsgate**: Selfplay-Mining erhält ein konservatives Gate für klar dominierte planselektierte Entscheidungen. Zusätzlich wird ein gepaartes A/B-Panel mit identischen Seeds und mehreren Referenz-Deckpaaren definiert.
6. **P5 – Läufe und Audit**: Der identische persönliche 20×480-Lauf wird wiederholt. Das Referenzpanel wird auf unverändertem `main` und auf dem Kandidatenbranch mit identischen Seeds ausgeführt. Ein separater Regel-/Timing-Bericht prüft Replay, Illegalitäten, Timingpfade und die konkret berührten Karten-/Regelverträge.
7. **P6 – Abschluss**: Fokus- und Breitentests, Typecheck und relevante Gates laufen grün; Bericht und Prozess werden abgeschlossen, anschließend wird lokal nach `main` integriert.

## Gates

- keine Illegalität, kein Replay-Fehler und kein Hidden-Information-Marker in den Abnahmeläufen
- keine der drei reproduzierten negativ bewerteten, planerzwungenen R&D-Wiederholungen
- keine der fünf positiven Broker-Installationen als `duplicate_low_delta_install`
- kein neu erkanntes klar dominiertes planselektiertes Fenster im identischen 20×480-Lauf
- A/B-Vergleich ohne Verschlechterung der harten technischen Gates
- Regel-/Timing-Aussage getrennt von der strategischen Bewertung; ungeprüfte Vollständigkeit wird nicht als bewiesen dargestellt

## Abschlussprotokoll

| Paket | Status | Commit | Verifikation |
| --- | --- | --- | --- |
| P0 | abgeschlossen | dieser Prozess-Commit | Ausgangsevidence aus dem 20×480-Rerun: Seeds 15/20, fünf Access-Declines und fünf Broker-Falschpositive |
| P1 | abgeschlossen | dieser Paket-Commit | 26 Fokustests; negative R&D-Wiederholung weicht positiver anderer Serveroption, Fresh-/Score-Threat-Gegenfälle geschützt |
| P2 | offen | – | Access-/Budget-Fokustests + reproduzierte Seeds |
| P3 | offen | – | Mining-Fokustests + Rerun-Fundstellen |
| P4 | offen | – | Detektortests + gepaartes Panel |
| P5 | offen | – | 20×480, A/B-Panel, Regel-/Timing-Audit |
| P6 | offen | – | Breitentests, Typecheck, lokaler Merge |
