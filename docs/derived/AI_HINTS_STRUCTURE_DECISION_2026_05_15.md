# AI-Hints-Strukturentscheidung 2026-05-15

## Entscheidung

AI-Hints sollen künftig nicht nach historischen Entwicklungs- oder Release-Schnitten organisiert werden.

Die bisherigen Dateinamen und Artefaktgruppen wie `ai-card-hints-deck-legal-v1915.json`, `ai-card-hints-deck-legal-v1916.json` oder ähnliche Release-/Batch-Zuschnitte gelten für die zukünftige KI-Runtime-Struktur als Ballast. Die Information, aus welchem kurzen Entwicklungsrelease ein Hint ursprünglich stammt, ist für das aktuelle Spielverhalten, die KI-Entscheidungslogik und die Wartung nicht relevant.

## Zielstruktur

Die AI-Hints sollen nach einem fachlich und technisch aktuellen Kriterium organisiert werden. Bevorzugte Ordnung:

- aktive, von der KI geladene Hints in einer zentralen Runtime-Quelle;
- optional getrennte fachliche Gruppen nur dort, wo sie für Wartung und KI-Verhalten helfen, zum Beispiel `corp`, `runner`, `ice`, `agenda`, `economy`, `run`, `damage`, `tag`, `breaker`;
- keine Release-, Sprint-, Batch- oder historische Provenienz als primäres Ordnungsprinzip;
- keine dauerhaften Sonderdateien nur deshalb, weil sie während der Entwicklung an einem bestimmten Tag oder in einem bestimmten Release entstanden sind;
- Draft-, No-Promotion- und alte Gate-Artefakte sollen aus dem aktiven Runtime-Pfad entfernt oder gelöscht werden, sofern sie keinen heutigen produktiven Zweck erfüllen.

## Begründung

Die historische Gliederung war während der schnellen Kartenfreischaltung nützlich, erzeugt jetzt aber unnötige Komplexität:

- viele Importlisten statt klarer Datenquelle;
- schwer lesbare Namen;
- künstliche Kopplung der KI-Runtime an alte Entwicklungsabschnitte;
- mehr Such-, Prüf- und Pflegeaufwand;
- höhere Gefahr, neue Hints an der falschen Stelle zu ergänzen.

Für das Projekt zählt jetzt die optimale aktuelle Struktur, nicht die Herkunft eines Hints aus einem früheren Freigabeschnitt.

## Umsetzungslinie

Der nächste Strukturierungsschritt soll die aktiven AI-Hints konsolidieren und die KI-Codepfade auf diese neue Ordnung umstellen. Historische Release-/Batch-Namen sollen dabei nicht in neue Runtime-Dateien übernommen werden.

Alte Dateien, Statusverweise und Approval-Artefakte sollen nicht aus Rücksicht auf ihre Entstehung bewahrt werden. Sie dürfen entfernt oder zusammengeführt werden, sobald die aktive KI-Funktion, Tests und notwendige Datenvalidierung erhalten bleiben.

## Umgesetzter Zielzustand

Die aktive KI-Runtime lädt die Kartenhinweise aus `data/ai/ai-card-hints-active.json`.

Diese Datei ist das aktuelle Bündel für produktiv genutzte AI-Hints. Die früheren Release-, Batch-, Draft-, No-Promotion- und Approval-Splitdateien wurden aus dem aktiven Runtime-Pfad entfernt und, soweit sie keinen heutigen produktiven Zweck mehr hatten, gelöscht.

`data/ai/ai-card-hints-1.3.1.json` und der zugehörige Report bleiben vorerst als alter Card-Pipeline-Snapshot erhalten. Sie sind nicht mehr die Runtime-Quelle der KI, sondern dienen nur noch der bestehenden Import-/Katalogpipeline und deren historischen Snapshot-Checks.
