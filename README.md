# Data Visualisierung

Dieses Repositoty beinhaltet den Code für die Informationsvisualisierung für den Kurz "Visualisierung" an der Bauhaus Universität Weimar, Sommersemester 2019.

Das Projekt besteht aus der Visualiserung von der Linie 61 und 66 von Dresden, die Strecke vom Campus zu den Wohnheimen bzw. Hbf Dresden zu der TU Dresden.



## Quelle der Daten

Die Daten bestehen aus 2 Kategorien:

* **tatsächliche Ankunftzeit der Busse Linie 61 und 63 DVB Dresden (selbstständig ausgewertet)**

* **planmäßige Ankunftzeit der Busse Linie 61 und 63 DVB Dresden (Quelle: DVB Dresden - [VVO/DVB](http://www.vvo-online.de/fahrplan))**



## Visualization

Die visualisierung wurde inspiriert von: [MBTA Visualization](http://mbtaviz.github.io/) created by Mike Barry and Brian Card in 2014.

Um die Visualisierung zu erstellen, wurde das JavaScript-Framework [D3] (https://d3js.org/), Version 4, verwendet.

Die visualisierung links ist das Marey-Diagramm mit jeder Busfahrt, die je nach Typ in verschiedenen Farben codiert ist. In der rechten Visualiserung wurde eine interaktive Karte, die die Position der Fahrzeuge in Echtzeit darstellt, wenn man die Maus über das Marey-Diagramm bewegt, dargestellt.

Die Visualisierung befindet sich in dem `visualization` Ordner.

## License and Copyright

See `LICENSE`.
