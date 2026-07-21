# Spielprotokoll-Export

Status: in Umsetzung; EXP-001 abgeschlossen
Stand: 2026-07-21
Arbeitsbranch: `codex/gamebook-export`
Arbeits-Worktree: `C:\Projekte\NETGRID_GAMEBOOK_EXPORT`

## Quelle und Ziel

Ein abgeschlossenes NETGRID-Spiel wird als vollständiges, sachliches
Spielprotokoll exportierbar. Das Protokoll ermöglicht es Personen, die die
Karten kennen, die Partie ohne UI und ohne technische Daten erneut
nachzuvollziehen.

Die Darstellung orientiert sich am tatsächlichen Ablauf und nicht an einer
Interpretation oder Lernhilfe:

- Spielvorbereitung mit beiden Starthänden und Mulligans,
- zu Beginn jedes Zuges genau eine Hand- und Credit-Angabe der aktiven Seite,
- Pflichtziehungen mit Kartenname,
- Gliederung nach `Aktion 1`, `Aktion 2` beziehungsweise `Aktion 3 und 4`,
- konkrete Kartennamen, Server, ICE-Positionen, Zahlungen, Kontostände,
  Choices, Run-Schritte, Rezzes, Subroutinen, Breaks, Jack-out, Access und
  Auflösungen,
- keine IDs, Hashes, Dateipfade, Eventnamen oder technische Interna im
  lesbaren Protokoll,
- keine wiederholte Hand- oder Boardzusammenfassung am Zugende.

## Gesamtziel

`/Goal` Arbeite den Prozess „Spielprotokoll-Export“ vollständig und
sequenziell von EXP-001 bis EXP-005 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die Wiki-Einstiegsseiten, die
betroffenen Package-`AGENTS.md` und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree `C:\Projekte\NETGRID_GAMEBOOK_EXPORT` auf Branch
`codex/gamebook-export`. Nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und committe
jedes abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe und
dokumentiere Ursache und Removal Condition. Nach Abschluss: final
verifizieren, lokal nach `main` mergen, Worktree und Branch entfernen und die
Entfernung prüfen.

## Annahmen und Grenzen

- Vollständige Protokolle entstehen nur für künftig aufgezeichnete Spiele.
  Bestehende Spiele können aus Snapshots und Events als Bestandsprotokoll
  gelesen werden, dürfen aber keine nicht gespeicherten Choices oder
  Ziehungen behaupten.
- Exportiert werden nur terminale Matches. Öffentliche Matches folgen der
  bestehenden Full-Information-Replay-Policy; private Matches bleiben
  teilnehmergebunden.
- KI-Züge werden als ausgeführte Spielzüge dargestellt. Interne KI-Scores,
  Hypothesen und DecisionDebug bleiben ausgeschlossen.
- Der vollständige technische Nachweis bleibt getrennt von der lesbaren
  Markdown-Datei. Tokens, Sessions, Account-IDs, lokale Pfade und Rohlogs
  sind nie Exportbestandteil.
- Kein Import, keine Änderung der Spielregeln, keine Live-Exports und keine
  Erweiterung der Kartenfreigabe.

## Pakete

| Paket | Ziel | Done-Gate | Commit |
| --- | --- | --- | --- |
| EXP-001 | Vertrag, Prozess und Testfälle festlegen | Format, Sicherheitsgrenzen und Beispiele festgeschrieben | `docs(gamebook): define export contract` |
| EXP-002 | vollständigen Decision Ledger erfassen und persistieren | Jede neue Transition enthält die benötigten lesbaren Fakten | `feat(gamebook): persist decision ledger` |
| EXP-003 | Markdown-Renderer und Nachweisformat | Aktionsprotokoll aus einem echten Match deterministisch erzeugbar | `feat(gamebook): render match chronicle export` |
| EXP-004 | berechtigter Downloadpfad | terminale Berechtigung, Header und Fehlerpfade geprüft | `feat(gamebook): expose match chronicle export` |
| EXP-005 | Regression, Reviews und Abschluss | Tests, Dokumentation und Final Review grün | `test(gamebook): verify complete match export` |

## Controller-Invarianten

1. Genau ein Paket ist aktiv; keines wird übersprungen.
2. Rules Engine und StateHash bleiben die einzige Regel- und
   Integritätsautorität.
3. Eine lesbare Zeile darf nur gespeicherte Fakten wiedergeben.
4. Vollständige Kartenidentitäten werden nur im terminal autorisierten
   Full-Information-Export ausgegeben.
5. Jeder Paketabschluss umfasst passende Tests, `git diff --check`,
   Prozessfortschritt und einen eigenen Commit.

## Akzeptanzkriterien

- Das Protokoll zeigt Starthand, Mulligan, Ziehungen und Hand am Zugbeginn.
- Jede Aktion nennt Karte oder Regelhandlung, Kosten, Ziel, Resultat und
  Kontostand, soweit fachlich vorhanden.
- Runs enthalten alle tatsächlich geschehenen Schritte in Reihenfolge.
- Ein Dritter kann die Partie mit den Karten nachspielen, ohne technische
  Kennungen zu benötigen.
- Der Renderer ist deterministisch und die technische Evidence lässt sich
  gegen das Replay und die StateHash-Kette prüfen.
- Negative Tests verhindern Exporte aktiver Spiele, unberechtigte private
  Exporte und Secrets/Debugdaten im Artefakt.

## Fortschritt

| Paket | Status | Ergebnis |
| --- | --- | --- |
| EXP-001 | abgeschlossen | Produktvertrag, Grenzen, Pakete und Abnahmekriterien festgeschrieben. |
| EXP-002 | aktiv | Decision Ledger wird untersucht und umgesetzt. |
| EXP-003 | offen | |
| EXP-004 | offen | |
| EXP-005 | offen | |
