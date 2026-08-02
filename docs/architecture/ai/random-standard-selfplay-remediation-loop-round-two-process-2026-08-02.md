# Random-Standard-Selfplay-Remediation – Runde 2

Stand: 2026-08-02

## Ausgangslauf

- Runner: `standard_runner_deep_market_engine`
- Corp: `standard_classic_corp_superserum_control_grid_2026_07_01`
- Seed: `loop-20260802-1785653991903-f92fc957`
- Schwierigkeit: Hard gegen Hard
- Auditgrenze: 500 Aktionen

Der Ausgangslauf brach nach 11 Aktionen an einer öffentlichen, nicht
erzwungenen Deflector-Zielwahl ab. Nach der ersten Korrektur wurden mit
demselben Seed zwei weitere partieblockierende Choice-Lücken bei Aktion 162
und 299 sichtbar. Jeder harte Abbruch wurde vor der Implementierung als
lokaler privilegierter Decision-Checkpoint gesichert.

## Eigentümer und Korrekturen

### Run-Redirect

`corp.defend_servers` bleibt alleiniger Owner der Redirect-Entscheidung. Das
Modul prüft den aktuellen Encounter, die effektive Engine-Subroutine, das
Zielprofil, Kosten, Credit-Floor, vollständige Choice-Matrix und exakte
`resolve_choice`-Action. Der Resolver überträgt nur die vom Plan gebundene
Option. Der automatische Engine-Window-Pfad ist für diese strategische Choice
gesperrt.

Die Erkennung ist an die allgemeine Engine-Effektfamilie
`card_implementation.classic_deflector`, nicht an eine Karten-ID, ein Deck,
einen Seed oder eine Match-ID gebunden. Tests verwenden absichtlich generische
Quell- und Definitions-IDs und decken bezahlten Redirect, reservebedingtes
Ablehnen und den verpflichtenden kostenlosen Redirect ab.

### Optionale installierte Kartenliquidation

`runner.economy` übernimmt die Engine-Familie
`runner.installed_resource_trash_for_credits`. Der Plan validiert Quelle,
StateVersion, installierte Quelle, LegalAction und die vollständige Matrix der
installierten Ziele. Da der aktuelle PlayerView-Vertrag weder eine
Engine-gequotete Zielbewertung noch einen allgemein belastbaren
Liquidationswert liefert, bindet der Plan konservativ `pass`. Dadurch wird die
Partie fortsetzbar, ohne Kartenwerte im Resolver oder eine zweite
Entscheidungsautorität zu erfinden.

Eine spätere produktive Zielwahl benötigt zuerst einen allgemeinen,
side-sicheren Engine-/Planvertrag für Auszahlung und Zielerhaltungswert. Sie
ist ausdrücklich keine Voraussetzung für die technische Laufzeitkorrektur.

### Würfelaufteilung

Die dritte Lücke war ein Präfixwechsel derselben bereits vorhandenen
Mechanik. Der bestehende Würfelaufteilungs-Resolver erkannte nur
`v1921.playful_ai`; die Engine liefert inzwischen
`card_implementation.random_dice_split`. Die Korrektur erweitert allein die
Quellerkennung. Auswahlheuristik, Action-ID und Resolver bleiben unverändert.

## Kontrolllauf und offene Verhaltensprüfung

Der identische Seed erreicht nach den Korrekturen 500 Aktionen ohne
RuntimeFailure, illegale Aktion, Fallback, Timeout oder Replayfehler. Der Lauf
endet am konfigurierten Aktionslimit bei 6:0 Agendapunkten für den Runner.

Die automatische Analyse meldet keinen kritischen technischen Befund mehr,
aber einen hohen kombinierten Langspielbefund (`action_limit_reached` und
`corp_never_scores_long_game`) sowie mittlere Hinweise zu einem wiederholten
R&D-Lauf und Recovery-ähnlichen Wiederholungen. Diese Punkte verändern
Spielstrategie und werden deshalb nicht unter der Freigabe für zwingende
Laufzeitkorrekturen umgesetzt.

## Entfernungskriterien

Die neuen Verträge dürfen erst entfernt oder ersetzt werden, wenn:

1. strategische Run-Redirect-Choices durch einen gleichwertigen allgemeinen
   Planvertrag vollständig übernommen werden;
2. installierte Kartenliquidation eine Engine-gequotete, side-sichere
   Auszahlung und eine planseitige Zielwertbewertung besitzt; beziehungsweise
3. alle produktiven Würfelaufteilungsquellen auf einen einzigen stabilen
   Engine-Präfix migriert und die alte Quellform nachweislich nicht mehr
   unterstützt werden muss.
