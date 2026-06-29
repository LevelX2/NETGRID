# AI Endgame Scoreline and Dynamic ICE Evidence, 2026-06-29

## Match

- Match-ID: `match_28b304f024323f9d`
- Speicherort: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Modus: `human_runner_vs_corp_ai`
- Status: `finished`
- Letztes gespeichertes Match-Update: `2026-06-28T20:02:54.169Z`
- StateVersion: `205`
- AI-Traces: `78`

## Wichtige Einordnung

Das Match wurde vor den zuletzt gemergten KI-Fixes gespielt. Die aktuelle Re-Evaluation derselben Snapshot-Situationen zeigt Teilverbesserungen bei unrezzbarem Central-ICE und Dynamic-ICE-Reihenfolge, aber die finale Endgame-Scoreline wird weiterhin zu positiv bewertet. Deshalb ist das Endgame-Muster aus diesem Spiel weiterhin umsetzungsrelevant.

## Freigegebene Fehlergruppen

### 1. Endgame-Scoreline als `temporary_safe` fehlklassifiziert

StateVersions `187` bis `190`: Die Corp installierte `Hunting Pack` auf Remote 2, installierte danach `Corporate Headhunters`, advancete einmal und gab dem Runner eine volle Zugriffschance. Die Remote war nur scheinbar sicher. Beim Run musste die Corp Rez-/Trigger-Kosten zahlen, fiel auf 0 Credits und konnte den Zugriff nicht verhindern.

Bessere sichtbare Alternativen: Economy zur Rezreserve, Remote-Härtung erst bei ausreichendem Budget oder Verzicht auf die spielentscheidende Scoreline.

### 2. Runner-Exposure vor Score nicht hart genug

Die Scoreline war nicht `immediate`: Der Runner durfte vor dem Score erneut handeln. Sichtbar waren Runner-Credits, installierte Board-Coverage und ein bereits erfolgreich druckvoller Gameplan gegen Corp-Server. Die Bewertung behandelte die Remote trotzdem als temporär sicher.

Bessere sichtbare Alternative: Scoreline nur starten oder fortsetzen, wenn der konkrete Server nach realistischer Runner-Credit-Entwicklung noch contest-resistent ist.

### 3. Dynamic ICE erzeugt Scheinsicherheit

`Hunting Pack` und `Mobile Barricade` wirkten im finalen Remote-Kontext nicht als belastbare Zugriffssperre. Die historische KI rezzte erst `Hunting Pack`, der aktuelle Code würde zwar `Mobile Barricade` früher priorisieren, aber beide Sequenzen lösen das Budget- und Zugriffproblem nicht.

Bessere sichtbare Alternative: Dynamic-ICE-Schutz nur zählen, wenn Position, Rez-Kosten, paid abilities und sichtbare Runner-Coverage zusammen einen realen Zugriffswiderstand ergeben.

### 4. Archives-ICE wurde ohne ausreichend konkretes Risiko übergewichtet

In mehreren Midgame-Entscheidungen wurden ICE-Ressourcen nach Archives gelegt, obwohl R&D- und HQ-Druck durch sichtbare Multiaccess-Karten und erfolgreiche Läufe relevanter waren und die spätere Scoring-Remote nicht robust genug war.

Bessere sichtbare Alternative: Archives-ICE nur mit konkretem Archives-Risiko stark belohnen; sonst R&D/HQ/Remote-Aufbau und Scoreline-Finanzierung bevorzugen.

## Nicht freigabereif aus diesem Spiel

- Der `Inside Job`-Diebstahl von `Charity Takeover` ist kein Beweis, dass die Corp Runner-Handkarten annehmen darf. Er stützt nur die allgemeinere Exposure-Window-Regel.
- Alte `corp_visible_meat_damage_payoff`-Evidence im Trace bestätigt ein bereits behandeltes Verhalten, ist aber aus diesem Match kein neuer offener Implementierungspunkt.
- Es wurde keine Engine- oder LegalAction-Lücke festgestellt.

