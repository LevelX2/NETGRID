# AI B8AF Deckout Flood Final 2026-06-29

## Ergebnis

Die Corp-Board-Triage hat eine neue Primärlage `force_scoreline_clock`. Sie wird nur gesetzt, wenn die Corp side-safe aus der eigenen PlayerView sieht, dass R&D niedrig ist, sichtbarer Agenda-Flood in HQ liegt und mindestens eine konkrete Scoreline-LegalAction existiert.

In dieser Lage werden konkrete Scoreline-, Same-Turn-Closeout-, Advancement-Burst- und passende Remote-Schutz-Aktionen als passend bewertet. Freiwilliges Draw, draw-lastige Economy-Operationen, Archiv-ICE, off-target Setup und passive Economy werden bei hoher/kritischer Lage stark genug als Mismatch markiert, um lokale Positivwerte zu brechen. Wenn ein konkreter Rez-Floor fehlt, gewinnt Funding vor blindem Advance.

## Regressionsschutz

- Deckout-/Agenda-Flood: Scoreline schlägt passive Economy.
- Draw-Economy wie `Day Shift`: positiver Economy-Wert bleibt sichtbar, verliert aber gegen die Notfall-Triage.
- Rez-Floor fehlt: Basic-Economy schlägt blindes Advance bis der Floor finanziert ist.
- Niedriges R&D ohne sichtbaren HQ-Agenda-Flood: keine erzwungene Scoreline; bestehende Remote-Safety-Logik bleibt führend.

## Grenzen

Die Änderung erzeugt keine LegalActions und ändert keine Engine-Regeln. Sie nutzt eigene Corp-HQ-Karten und `own.stackOrRdCount`, aber keine verdeckte Runner-Hand, keinen Runner-Stack und keine gegnerseitige Hidden-Info. Die bestehende AI-Trace-Persistenz wurde nicht geändert; für das analysierte Match war `ai_decision_traces` leer, aber der vorhandene `aiTraceMode`-/Maintenance-Pfad ist bereits getestet.

## Verifikation

- `semantic-runtime-corp-score.test.ts`: 46 Tests grün.
- Fokussierter Runtime-Cluster: 4 Dateien, 103 Tests grün.
- Vollständiger `@netgrid/ai`-Testlauf: 272 Dateien, 2191 Tests grün.
- `@netgrid/ai` Typecheck grün.
- `git diff --check` grün.
