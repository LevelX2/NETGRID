# Runner-Run und Phasenanzeige

Status: R1 und R2 abgenommen, Integration aktiv. Auftrag: Match `match_28a78ebb6fe87b18`, D85–95,
und missverständliche Movement-Anzeige vor Shock.r (State 194).

## Ziel und Grenzen

Historische API-Checkpoints müssen korrekte verbleibende Encounterkosten und
eine finanzierte Run-Zulassung belegen. Die UI unterscheidet Bewegung zum
nächsten ICE von dessen Approach-/Rez-Fenster. Engine bleibt Regelautorität;
LegalActions, side-sichere Sicht und Root-/Executorbindung bleiben erhalten.
Kein Serverstart, kein Matcheingriff, keine Remote-Aktion, keine Vollsuite.
Fremde Änderungen im Hauptcheckout werden weder übernommen noch verworfen.

## Sequenz und Abnahme

1. **R1 – Runner-Ursachen beheben (abgenommen).** API-gebundene Checkpoints für
   D85/D88/D90 sichern, Fehler fokussiert reproduzieren. Verbleibende
   Subroutinen im Run-Window quotieren; blockierte unbekannte ICE-Reserve
   im Remote-Owner beachten. Die Wiederholung muss durch behobene Ursachen
   entfallen, ohne pauschales Verbot gleicher Server. Tests prüfen Kosten,
   zulässige Action, Root/Executor, finanzierte und unbekannte Gegenfälle.
   Done: fokussierte Regressionen und `git diff --check` grün, Runner-Vertrag
   gepflegt, Paketcommit `fix(ai): preserve remaining encounter costs and remote reserves`.
2. **R2 – Run-Fenster verständlich darstellen (abgenommen).** Nach R1 Titel und
   Movement-Pass in de/en/fr phasengerecht formulieren. Der Kopf bleibt bei
   höchstens zwei Textzeilen (Server/Phase/Ziel und bekannter ICE-Name). Verdeckte ICE bleiben
   verdeckt, andere Passfenster behalten ihre Bedeutung. Direkte UI- und
   Übersetzungsregressionen prüfen Movement, Approach, Encounter und Zugriff.
   Done: fokussierte Checks grün, UI-Vertrag gepflegt, Paketcommit
   `fix(web): distinguish movement targets from ice approach windows`.
3. **Integration (aktiv).** Aktuelles main defensiv einbinden, unmittelbar
   betroffene Checks ausführen, lokal integrieren; sauberen eigenen Worktree
   und gemergten Branch entfernen und beide Entfernungen verifizieren.

## Prozessvertrag

Worktree: `C:/Projekte/NETGRID_runner_run_clarity`.
Branch: `codex/runner-run-clarity`. Integrationsbranch: lokales `main`.
Genau ein Paket ist aktiv; erst nach Abnahme und Commit folgt das nächste.
Fehler werden ursachenbezogen untersucht. Fehlende historische API-Verträge
oder widersprüchliche fachliche Änderungen sind konkrete Blocker mit Removal
Condition, keine Einladung zu Fallbacks. Kleine Umsetzungsdetails werden
autonom entschieden. Pflichtquellen: AGENTS, AI-Änderungskompass, Plan- und
Runner-Verträge, Web-Regeln und aktueller UI-Vertrag.

Goal: Beide Pakete sequenziell verifiziert abschließen, lokal nach main
integrieren und Worktree/Branch entfernen. Dieses temporäre Prozessartefakt
wird nach Rückführung gültiger Erkenntnisse in aktuelle Verträge entfernt.

## Nachweise R1

- D85/D88/D90 aus bereits geladenen Maintenance-API-Antworten mit dem
  offiziellen Exportvalidator übernommen; alle neun Provenance-Prüfungen wahr.
- Vor Patch drei gezielte rote Regressionen; nach Patch acht grüne neue
  Prüfungen einschließlich finanzierter Wiederholung, Kostenlücke, vollständig
  abgearbeiteter Subroutinen und fail-closed bei fehlender Engine-Quote.
- Vier angrenzende Information-Probe-Tests grün; deren synthetische Actions
  um die tatsächlichen offenen Subroutine-IDs vervollständigt.
- Vier historische meta-434-Fortsetzungsprüfungen grün.
- b244 hatte denselben Reserve-Bypass (25 Credits Lücke). Erwartung auf
  Zurückstellung korrigiert und finanzierten terminalen Gegenfall ergänzt:
  beide grün.
- Fokussierter Strict-Typecheck der drei geänderten Testeingänge und ihrer
  produktiven Abhängigkeiten grün. Keine Vollsuite/Build/Simulation.

## Nachweise R2

- 164 direkte Action-Board-Tests grün, einschließlich de/en/fr,
  Movement-/Approach-/Fort-Pass-Abgrenzung und Hidden-ICE-Schutz.
- Firefox-Renderprüfung des echten Head-Components mit produktivem CSS:
  18 Varianten (drei Sprachen, drei Phasen, kurze/lange ICE-Namen), jeweils
  zwei einzeilige Textreihen und Tooltip mit vollständigem Text; Sichtprüfung
  bestanden. Statisches lokales HTML, kein Server oder Matcheingriff.
- Fokussierter Strict-Typecheck von Overlay, Header und direkten Tests grün.
  Overlay konsumiert die bestehende typisierte App-Locale-Normalisierung.
- I18n-Gate mit 2.431 ausgerichteten Meldungen in drei Sprachen grün.
- UI-Vertrag aktualisiert. Keine neue Regel-/Legalitätsentscheidung.
