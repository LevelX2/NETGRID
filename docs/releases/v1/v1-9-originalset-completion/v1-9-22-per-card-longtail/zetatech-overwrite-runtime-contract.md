# V1.9.22 Zetatech Software Installer Overwrite Runtime Contract

Stand: 2026-06-26
Status: corrected runtime contract

## Zweck

Dieser Vertrag ersetzt die fruehere Overlay-Deutung fuer `Zetatech Software Installer` (`onr_v1_075_zetatech-software-installer`). Die Kartenformulierung erlaubt, die zwei restricted Recurring Credits fuer eine Programminstallation zu nutzen, die `Zetatech Software Installer` selbst ueberschreibt. Sie erzeugt keinen Host, keine gehostete Programminstallation und keinen allgemeinen MU-Erlass.

## Lokale Fakten

- Runner-Programm, Installkosten 0, MU 1.
- Zwei restricted Recurring Credits aus der Bank fuer Programminstallationen.
- Genutzte Recurring Credits refreshen zu Beginn des naechsten Runner-Zugs ohne Akkumulation.
- "Overwriting Software Installer itself" bedeutet: Beim Installieren eines Programms darf der installierte `Zetatech Software Installer` als zu trashende/zu ueberschreibende Programmquelle gewaehlt werden.

## Enger Runtime-Vertrag

1. Die Engine bietet keine spezielle Zetatech-Host- oder Overlay-`install_card`-Action an.
2. Ein Programm aus der Grip kann normal installiert werden, wenn die Runner-MU nach Trash der ausgewaehlten installierten Programme reicht.
3. Wird `Zetatech Software Installer` als Trash-vor-Install-Ziel gewaehlt, zahlt die Engine die Installkosten, solange Zetatech noch installiert ist.
4. Nach der Zahlung wird `Zetatech Software Installer` in den Heap gelegt; danach wird das neue Programm normal installiert.
5. Das neue Programm bekommt kein `hostedOn` auf Zetatech und keinen `hostOnCardId` aus diesem Vertrag.
6. Das neue Programm verbraucht seine eigene MU. Wenn `memoryUsed` gleich bleibt, liegt das nur daran, dass Zetatech selbst aus der Rig entfernt wurde.
7. PublicPayloads duerfen Trash-/Install-Metadaten enthalten, aber keine Overlay-, Host- oder Grip-Leak-Felder.
8. Replay/StateHash muss stabil sein; keine Grip-Liste, nicht ausgewaehlten Grip-Karten oder privaten Payloads duerfen leaken.

## Testpflicht

- Normale Zetatech-Installation bleibt unveraendert.
- Es gibt keine Zetatech-Overlay-LegalAction.
- Trash-vor-Install kann Zetatech auswaehlen, wenn dadurch MU erreichbar wird.
- Wrong-Side-/Stale-Revalidation fuer die `install_card`-Action bleibt aktiv.
- Installkosten werden aus Zetatech-Recurring-Credits bezahlt, bevor Zetatech getrasht wird.
- Das installierte Programm hat kein `hostedOn`; Zetatech liegt danach im Heap.
- PublicPayload ist side-sicher und enthaelt keine Overlay-/Host-Payloadfelder.
- Replay/StateHash stabil.

## Nicht Teil Dieses Vertrags

- Hosting eines Programms auf `Zetatech Software Installer`.
- MU-freie Programme durch `Zetatech Software Installer`.
- Mehrere gleichzeitige Ueberschreibungsebenen oder Host-Ketten.
- AI-Hints oder finale Decklegalitaet.
