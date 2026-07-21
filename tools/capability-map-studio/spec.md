# Capability Map Renderer – Spezifikation

Status: Erweiterungsspezifikation v0.18
Stand: 21. Juli 2026
Ziel: Umsetzungsreife Spezifikation für Fokus, Hierarchienavigation, erweiterbare Capability-Formen sowie ein- und mehrseitigen PowerPoint-Export auf Basis des bestehenden Renderers

## 1. Produktvision

Das Tool visualisiert hierarchische Capability Maps auf Basis einer strukturierten YAML-Definition. Anwenderinnen und Anwender bearbeiten das YAML direkt in einer statisch deploybaren Webanwendung und sehen eine validierte Live-Vorschau. Die Visualisierung nutzt den verfügbaren Raum dynamisch, unterstützt beliebig verschachtelte Capabilities, zweistufige visuelle Gruppen, explizite Layout-Umbrüche und alternative Capability-Formen. Inhalte lassen sich suchen, filtern, ein- und ausklappen sowie als Teilbäume fokussieren. Die erzeugte Darstellung kann schrittweise als SVG, daraus rasterisiertes PNG, vektorbasiertes PDF und zuletzt als editierbare PowerPoint-Präsentation exportiert werden.

Das Rendering ist deterministisch: Reihenfolge, Hierarchie, Ausrichtung und relative Größen werden ausschließlich aus dem YAML abgeleitet. Die Visualisierung selbst dient im MVP nicht als grafischer Struktureditor.

## 2. Ziele des MVP

Das MVP muss:

1. YAML in einem integrierten Editor bearbeiten und mit kurzer Verzögerung validieren können.
2. die zuletzt gültige Eingabe unmittelbar als verschachtelte Capability Map darstellen.
3. beliebig tiefe, rekursive Capability-Strukturen im Datenmodell unterstützen.
4. ein gemischtes, rekursives Layout aus horizontal gestapelten Elementen, vertikalen Säulen und expliziten horizontalen beziehungsweise vertikalen Flushes unterstützen.
5. Capabilities ein- und ausklappen, suchen, anhand von Metadaten filtern sowie Capabilities und Gruppen als Teilbaum fokussieren können.
6. Details der ausgewählten Capability in einem separaten Panel darstellen.
7. Darstellungswerte vererben und fehlende Werte sinnvoll vorbelegen.
8. den aktuellen YAML-Inhalt lokal im Browser speichern und wiederherstellen.
9. als statische Webanwendung ohne Backend betrieben werden können.
10. eine getrennte Rendering-Schicht besitzen, die später als wiederverwendbare TypeScript-Bibliothek extrahiert oder veröffentlicht werden kann.
11. TypeScript, Linting, automatisierte Tests und Hot Reloading unterstützen.
12. Capabilities optional in rein visuellen, einklappbaren Gruppen auf zwei Gruppenebenen strukturieren können.
13. Blatt-Capabilities mit kompakter Inhaltsdarstellung rendern, ihren zugewiesenen Layout-Slot jedoch vollständig ausfüllen lassen.
14. Beschreibungen ausschließlich im Detailpanel und nicht innerhalb der Capability Map anzeigen.
15. Capabilities über einen erweiterbaren, integrierten Formenkatalog rendern; initial stehen die rechteckige Box und der Chevron einer Wertstromdarstellung zur Verfügung.
16. fehlende `trackWeight`- und `layerWeight`-Werte anhand des rekursiv berechneten Platzbedarfs automatisch bestimmen.
17. den Fokusmodus für Capabilities und Gruppen per Doppelklick ohne explizite Fokus-Schaltfläche aktivieren und den aktuellen Hierarchiepfad dauerhaft als Breadcrumb anzeigen.
18. eine reproduzierbare komplexe Referenzmap mit ungefähr 500 Capabilities und bis zu vier Capability-Ebenen für Funktions-, Layout- und Performanceprüfungen bereitstellen.

## 3. Nicht-Ziele des MVP

Nicht Bestandteil des MVP sind:

- Laden per Datei, Build-Konfiguration oder URL;
- Export nach SVG, PNG oder PowerPoint;
- Benutzerkonten, Backend, Cloud-Speicherung oder Zusammenarbeit in Echtzeit;
- grafische Bearbeitung per Drag-and-drop oder Größenänderung in der Map;
- verbindliche Unterstützung von Smartphones;
- ein formales WCAG-Konformitätsziel;
- eine zweite Oberflächensprache;
- mehr als zwei ineinander verschachtelte Gruppenebenen;
- Gruppen innerhalb der `children`-Liste einer Capability;
- durch YAML frei definierbare Polygonpfade, frei konfigurierbare Formgeometrien oder benutzerdefinierter SVG-/HTML-Inhalt; zusätzliche, durch die Anwendung implementierte und validierte Formen bleiben ausdrücklich vorgesehen;
- frei referenzierbare Bilder, HTML-Inhalte, Skripte oder externe Icon-URLs.

Die zuvor als Nicht-Ziel behandelten Exporte nach PNG, SVG und PowerPoint sowie der neu ergänzte PDF-Export sind Gegenstand der separaten Erweiterung in Abschnitt 17. Sie verändern nicht rückwirkend den Umfang des ursprünglichen MVP.

## 4. Zielgruppen und Nutzungsszenario

Primäre Zielgruppe sind Enterprise- und Business-Architektinnen und -Architekten sowie Personen aus Organisations- und Produktentwicklung in privatwirtschaftlichen Unternehmen.

Primärer Ablauf:

1. Die Anwendung öffnet sich mit dem lokal gespeicherten YAML oder, falls keines vorhanden ist, mit einem kommentierten Beispiel.
2. Die Person ändert das YAML im Editor.
3. Nach einer kurzen Eingabepause wird das Dokument syntaktisch, strukturell und semantisch validiert.
4. Bei gültiger Eingabe aktualisiert sich die Map.
5. Bei ungültiger Eingabe bleiben die letzte gültige Map und ihr Interaktionszustand erhalten; die Vorschau wird als nicht aktuell gekennzeichnet.
6. Die Person sucht, filtert, klappt Capabilities ein oder aus, fokussiert eine Capability oder Gruppe per Doppelklick, navigiert über den dauerhaft sichtbaren Breadcrumb-Pfad und betrachtet Capability-Details.
7. Die Person exportiert die aktuell erzeugte Darstellung lokal in einem unterstützten Ausgabeformat.

## 5. Bedienoberfläche

### 5.1 Desktop

Die Standardansicht besteht aus:

- einer Kopfzeile mit Suche, Filter, Ansichtssteuerung, Zurücksetzen und Status;
- einem links angeordneten, in der Breite veränderbaren YAML-Editor;
- einer zentralen Map-Fläche;
- einer dauerhaft sichtbaren Breadcrumb-Navigation oberhalb der Map-Fläche;
- einem bei Auswahl eingeblendeten Detailpanel rechts neben der Map.

Das Detailpanel darf die Map-Fläche verkleinern, muss aber schließbar sein. Reine Detailauswahl, Suche, Filter sowie Ein- und Ausklappen dürfen Zoom und Position nicht automatisch zurücksetzen. Ein vollständiges `fitView` erfolgt nur beim initialen Laden, nach „Auf Beispiel zurücksetzen“, auf die explizite Aktion „Ansicht einpassen“ sowie beim Eintritt in den Fokusmodus oder beim Wechsel des Fokusziels.

### 5.2 Tablet

Ab Tablet-Breite wird zwischen „YAML“ und „Map“ umgeschaltet. Das Detailpanel erscheint als Drawer über der Map. Smartphones gehören nicht zum verbindlich unterstützten Umfang.

### 5.3 Map-Steuerung

Die Map bietet:

- Zoom per Mausrad beziehungsweise Trackpad;
- Verschieben des Viewports;
- Schaltflächen für Vergrößern, Verkleinern und „Ansicht einpassen“;
- eine Exportaktion mit den je Ausbaustufe verfügbaren Formaten PNG, SVG, PDF und PPTX;
- eine kompakte Auswahl der Ansichtstiefe mit „Ebene 1“, „Ebene 2“, „Ebene 3“ und „Vollständig“;
- Auswahl einer Capability per einfachem Klick;
- Ein- und Ausklappen einer Capability mit Kindern;
- Fokus auf eine Capability als temporäre Wurzel per Doppelklick auf ihre sichtbare Form;
- Fokus auf eine Gruppe als temporäre Wurzel per Doppelklick auf ihre Gruppenfläche oder Beschriftung;
- Rückkehr zur übergeordneten beziehungsweise vollständigen Map.

Die Breadcrumb-Navigation ist auch ohne aktiven Fokus sichtbar. Sie beginnt stets mit der Map-Wurzel, zeigt bei aktivem Fokus den vollständigen strukturellen Pfad einschließlich aller enthaltenen Gruppen und Capabilities und erlaubt die direkte Navigation zu jedem fokussierbaren Ahnen. Eine separate Fokus-Schaltfläche wird weder auf Capabilities, Gruppen noch im Detailpanel angezeigt. Capability-Formen und Gruppen sind nicht frei verschiebbar und nicht direkt skalierbar.

## 6. YAML-Datenmodell

### 6.1 Grundsätze

- Technische Feldnamen sind Englisch.
- Freie Inhalte dürfen jede Sprache verwenden.
- YAML ist das führende Format.
- Das Schema besitzt eine explizite Versionsnummer.
- Unbekannte Felder außerhalb von `metadata` sind Validierungsfehler, um Tippfehler früh zu erkennen.
- `metadata` darf frei erweiterte, YAML-/JSON-kompatible Werte enthalten.
- Gruppen- und Capability-IDs sind gemeinsam innerhalb des gesamten Dokuments eindeutig.
- Die Reihenfolge der Capabilities, Gruppen und Flushes im YAML bestimmt die Darstellungsreihenfolge.

### 6.2 Vorgeschlagene Struktur

```yaml
version: 1
map:
  id: example-map
  name: Beispiel Capability Map
  description: Auszug aus der komplexen Referenzmap und dem Startbeispiel
  theme:
    defaultColor: "#DCE8F5"
  capabilities:
    - type: group
      id: management
      name: Management Capabilities
      visualization:
        backgroundColor: "#E9F1F8"
      layout:
        direction: horizontal
      capabilities:
        - id: strategy
          name: Strategy
          description: Defines direction and priorities.
          owner: Corporate Development
          visualization:
            color: "#B8D8F0"
            icon: compass
          layout:
            direction: horizontal
            layerWeight: 1.2
        - id: governance
          name: Governance
          layout:
            direction: horizontal
        - type: flush
          direction: horizontal
        - type: group
          id: portfolio-management-group
          name: Portfolio Management
          capabilities:
            - id: portfolio-management
              name: Portfolio Management
              layout:
                direction: vertical
    - type: flush
      direction: vertical
    - id: operations
      name: Operations
      layout:
        direction: vertical
      children:
        - id: production-planning
          name: Production Planning
          visualization:
            shape: box
        - id: order-fulfillment
          name: Order Fulfillment
          visualization:
            shape: chevron
```

### 6.3 Dokumentfelder

| Pfad | Typ | Pflicht | Bedeutung |
| --- | --- | --- | --- |
| `version` | positive Ganzzahl | ja | Version des Eingabeschemas; im MVP ausschließlich `1` |
| `map.id` | String | ja | Technische ID der Map |
| `map.name` | String | ja | Anzeigename der Map |
| `map.description` | String | nein | Kurzbeschreibung der Map |
| `map.theme.defaultColor` | RGB-Hex-String | nein | Standard-Hintergrundfarbe für Capabilities |
| `map.capabilities` | Root-Element-Liste | ja | Geordnete Liste aus Wurzel-Capabilities, Gruppen und Flushes; mindestens eine Capability direkt oder innerhalb einer Gruppe |

### 6.4 Capability-Felder

| Feld | Typ | Pflicht | Standard / Bedeutung |
| --- | --- | --- | --- |
| `id` | String | ja | Global eindeutige, stabile technische ID |
| `name` | nicht leerer String | ja | Anzeigename |
| `description` | String | nein | Kurzbeschreibung; ausschließlich im Detailpanel sichtbar, weiterhin durchsuchbar |
| `owner` | String | nein | Primär verantwortliche Organisation oder Rolle |
| `responsibilities` | String-Liste | nein | Verantwortlichkeiten der Capability |
| `tags` | String-Liste | nein | Such- und Filtermerkmale |
| `visualization.color` | RGB-Hex-String `#RRGGBB` | nein | Eigene Hintergrundfarbe |
| `visualization.icon` | String | nein | Offizieller Name eines Icons aus dem installierten Lucide-Katalog |
| `visualization.shape` | Shape-ID aus dem integrierten Formenkatalog | nein | Standard: `box`; initial zulässig sind `box` und `chevron`; `chevron` ist nur für Blatt-Capabilities zulässig |
| `layout.direction` | `vertical` oder `horizontal` | nein | Standard: `vertical` |
| `layout.layerWeight` | positive Zahl | nein | Optionaler expliziter Höhenfaktor eines horizontalen Layers; ohne Wert erfolgt eine automatische Bedarfsberechnung ausschließlich aus aktuell sichtbaren Elementen |
| `layout.trackWeight` | positive Zahl | nein | Optionaler expliziter Track-Faktor; ohne Wert erfolgt eine automatische Bedarfsberechnung ausschließlich aus aktuell sichtbaren Elementen |
| `metadata` | Objekt | nein | Frei erweiterbare Metadaten |
| `children` | Capability-/Flush-Liste | nein | Rekursive, geordnete Unterfähigkeiten mit optionalen Layout-Flushes; Gruppen sind hier nicht zulässig |

`layout.layerWeight` ist nur für Elemente mit `layout.direction: horizontal` zulässig. Das bisherige Feld `layout.weight` wird nicht als Alias übernommen und erzeugt einen Validierungsfehler mit dem Hinweis auf `layout.layerWeight`. Leere optionale Listen und Objekte werden akzeptiert und bei der Normalisierung entfernt. IDs sollen dem Muster `[a-zA-Z0-9][a-zA-Z0-9._-]*` entsprechen.

### 6.5 Gruppenfelder

Gruppen werden durch `type: group` von normalen Capabilities unterschieden. Eine Gruppe der ersten Ebene ist ein direkter Eintrag von `map.capabilities`. Eine solche Gruppe darf neben Capabilities und Flushes auch Gruppen der zweiten Ebene enthalten. Gruppen der zweiten Ebene enthalten ausschließlich Capabilities und Flushes; eine dritte Gruppenebene ist ein Validierungsfehler. Gruppen sind innerhalb von Capability-`children` nicht zulässig.

| Feld | Typ | Pflicht | Standard / Bedeutung |
| --- | --- | --- | --- |
| `type` | `group` | ja | Kennzeichnet das Element als Gruppe |
| `id` | String | ja | Global gegenüber Gruppen und Capabilities eindeutige ID |
| `name` | nicht leerer String | ja | Stets vollständig darzustellender Gruppenname |
| `visualization.backgroundColor` | RGB-Hex-String `#RRGGBB` | nein | Dezente Containerfarbe; eingebaute Standardfarbe bei fehlender Angabe |
| `layout.direction` | `vertical` oder `horizontal` | nein | Standard: `vertical`; Anordnung im direkten Elterncontainer und Position des Gruppennamens |
| `layout.layerWeight` | positive Zahl | nein | Optionaler expliziter Höhenfaktor eines horizontalen Layers; ohne Wert erfolgt eine automatische Bedarfsberechnung ausschließlich aus aktuell sichtbaren Elementen |
| `layout.trackWeight` | positive Zahl | nein | Optionaler expliziter Track-Faktor; ohne Wert erfolgt eine automatische Bedarfsberechnung ausschließlich aus aktuell sichtbaren Elementen |
| `capabilities` | Element-Liste | ja | Mindestens eine Capability; auf Gruppenebene 1 zusätzlich Gruppenebene 2 sowie auf beiden Ebenen Flushes zulässig |

```yaml
- type: group
  id: management-group
  name: Management Capabilities
  visualization:
    backgroundColor: "#E9F1F8"
  layout:
    direction: horizontal
    trackWeight: 1.15
  capabilities:
    - id: strategy
      name: Strategy
    - type: group
      id: governance-group
      name: Governance
      capabilities:
        - id: enterprise-governance
          name: Enterprise Governance
```

### 6.6 Flush-Felder

Ein Flush ist ein rein strukturelles Layout-Element ohne ID, Namen, fachliche Inhalte oder eigene Darstellung. Flushes dürfen in `map.capabilities`, in Gruppen-`capabilities` und in Capability-`children` vorkommen.

| Feld | Typ | Pflicht | Bedeutung |
| --- | --- | --- | --- |
| `type` | `flush` | ja | Kennzeichnet einen harten Layout-Umbruch |
| `direction` | `horizontal` oder `vertical` | ja | Achse, auf der nach dem Flush ein neuer Layoutbereich begonnen wird |

```yaml
- id: capability-a
  name: Capability A
  layout:
    direction: horizontal
- id: capability-b
  name: Capability B
  layout:
    direction: horizontal
- type: flush
  direction: horizontal
- id: capability-c
  name: Capability C
  layout:
    direction: vertical
```

Jede Elementliste darf beliebig viele horizontale und vertikale Flushes enthalten und beide Richtungen frei abwechseln. Zwischen zwei Flushes muss jedoch mindestens ein fachliches Element liegen. Flushes am Anfang oder Ende einer Elementliste sowie unmittelbar aufeinanderfolgende Flushes sind Validierungsfehler, weil sie leere Layoutbereiche erzeugen würden. Flushes werden nicht gezählt, gesucht, gefiltert, ausgewählt oder persistiert.

## 7. Layout-Semantik

### 7.1 Begriffe

- **Elementliste:** Die geordnete `capabilities`- oder `children`-Liste eines Containers einschließlich ihrer Flushes.
- **Band:** Ein horizontaler Layoutbereich. Ein `vertical`-Flush beendet das aktuelle Band und beginnt darunter ein neues.
- **Horizontaler Block:** Eine Folge von Elementen mit `layout.direction: horizontal`, die innerhalb eines Tracks vertikal übereinander angeordnet wird.
- **Track:** Eine Säule innerhalb eines Bands. Ein `horizontal`-Flush beendet den aktuellen Track und beginnt rechts daneben einen neuen.
- **Platzbedarf:** Die bevorzugte Breite und Höhe eines Elements beziehungsweise Unterbaums vor der Anpassung an den tatsächlich verfügbaren Raum.

Die Bezeichnung `horizontal` beschreibt weiterhin, dass ein Element als horizontale Ebene innerhalb eines gestapelten Blocks angelegt wird. `vertical` beschreibt einen eigenen Säulen-Track. Flush-Richtungen bezeichnen dagegen die Achse, auf der der nachfolgende Layoutbereich beginnt: `horizontal` rechts daneben, `vertical` darunter.

### 7.2 Deterministischer Algorithmus

Für jede Elementliste wird rekursiv folgender Algorithmus angewendet:

1. Behalte die YAML-Reihenfolge unverändert bei.
2. Berechne zunächst für jedes aktuell sichtbare Element seinen bevorzugten Platzbedarf rekursiv von den Blättern zur Wurzel. Kinder eingeklappter Capabilities beziehungsweise Inhalte eingeklappter Gruppen sowie durch Fokus oder Filter ausgeblendete Elemente fließen weder direkt noch indirekt in diese Berechnung ein.
3. Teile die Elementliste an jedem `vertical`-Flush in Bänder. Die Höhe eines Bands leitet sich aus dem größten vertikalen Platzbedarf seiner Tracks ab; mehrere Bänder teilen die verfügbare Höhe proportional zu diesem Bedarf.
4. Erzeuge innerhalb jedes Bands für jedes `vertical`-Element einen eigenen Track und fasse aufeinanderfolgende `horizontal`-Elemente zu einem gestapelten Track zusammen.
5. Beende bei einem `horizontal`-Flush den aktuellen Track zwingend. Das nachfolgende Element startet einen neuen Track, auch wenn seine Richtung ansonsten eine Fortsetzung erlaubt hätte.
6. Teile die verfügbare Breite eines Bands anhand der effektiven Track-Gewichte auf. Deren Berechnung ist in Abschnitt 7.3 festgelegt.
7. Ordne Elemente eines horizontalen Blocks vertikal nach YAML-Reihenfolge an. Die Höhe ihrer Layout-Slots wird durch explizite oder automatisch berechnete `layout.layerWeight`-Werte bestimmt.
8. Jedes fachliche Element füllt seinen zugewiesenen Layout-Slot in Breite und Höhe vollständig aus. Blatt-Capabilities verwenden weiterhin eine kompakte Inhaltsdarstellung, ihre äußere Box wird jedoch auf die vollständige Slot-Größe gestreckt.
9. Ziehe definierte Abstände, Rahmen, Innenabstände und den Headerbereich ab, bevor Kind-Layouts berechnet werden.
10. Wende denselben Algorithmus auf Gruppeninhalte und die sichtbaren Kinder jeder Nicht-Blatt-Capability an.

Das Ergebnis jeder rekursiven Elementliste ist ein vollständiges rechteckiges Tiling ihres Inhaltsbereichs: Abgesehen von explizit definierten Gaps, Rahmen, Namensbereichen und Innenabständen bleibt keine unzugewiesene Restfläche. Insbesondere darf kein intrinsisches Mindest- oder Kompaktmaß dazu führen, dass ein bereits berechneter Slot nur teilweise durch sein Element belegt wird.

`layout.trackWeight` ist nur am ersten fachlichen Element eines Tracks erlaubt. `layout.layerWeight` ist nur an `horizontal`-Elementen erlaubt. Verstöße erzeugen einen Validierungsfehler mit Lösungshinweis. Flushes selbst besitzen keine Gewichte.

### 7.3 Automatische Platzbedarfs- und Track-Berechnung

Der bevorzugte Platzbedarf wird deterministisch berechnet:

1. Eine Blatt-Capability liefert für die automatische Gewichtung einen kompakten bevorzugten Platzbedarf. Dieser Bedarf beeinflusst die relative Slot-Aufteilung, begrenzt aber nicht die anschließend zugewiesene äußere Boxgröße.
2. Der Bedarf einer Capability berücksichtigt den sicheren Inhaltsbereich ihrer aufgelösten Form. Ein Chevron berücksichtigt zusätzlich Pfeilspitze, Einzug und den definierten Abstand zu direkt angrenzenden Chevrons; eine Überlappung findet nicht statt.
3. Der Bedarf einer Nicht-Blatt-Capability ergibt sich aus Header, Innenabständen und dem rekursiv berechneten Bedarf ihres Kind-Layouts.
4. Der Bedarf einer Gruppe ergibt sich aus Namensbereich, Innenabständen und dem rekursiv berechneten Bedarf ihrer Inhalte.
5. Der bevorzugte Breitenbedarf eines gestapelten Tracks ist das Maximum seiner Elemente; sein bevorzugter Höhenbedarf ist deren Summe einschließlich Abständen.
6. Der bevorzugte Bedarf eines Bands ergibt sich aus der Summe seiner Track-Breiten und der größten Track-Höhe.

Für die tatsächliche Breitenverteilung gilt:

- Ist `layout.trackWeight` gesetzt, ist dieser Wert das effektive Gewicht des Tracks und überschreibt die automatische Ableitung.
- Fehlt `layout.trackWeight`, wird der bevorzugte Breitenbedarf des Tracks durch den Median der automatisch gewichteten Tracks desselben Bands geteilt.
- Automatisch abgeleitete Gewichte werden über zentrale Layout-Tokens auf einen sinnvollen Korridor begrenzt; initial gilt `0,5` bis `3`. Dadurch beeinflussen große Unterbäume die Breite, ohne einzelne Tracks unverhältnismäßig dominant werden zu lassen.
- Ein explizites Gewicht von `1` entspricht damit ungefähr einem Track mit medianem automatischem Platzbedarf.
- Die verfügbaren Pixel werden anschließend proportional zu allen effektiven Gewichten verteilt und unter Beachtung der Mindestbreiten gerundet. Rundungsreste gehen in YAML-Reihenfolge an die ersten Tracks.
- Die Berechnung wird bei Filter-, Collapse- und Fokusänderungen mit dem jeweils sichtbaren Baum erneut ausgeführt. Verdeckte Nachfahren dürfen dabei keinen historischen oder zwischengespeicherten Platzbedarf beibehalten.

Für die Höhenverteilung innerhalb eines horizontal gestapelten Tracks gilt analog:

- Ist `layout.layerWeight` gesetzt, ist dieser Wert das effektive Gewicht des Layers und überschreibt die automatische Ableitung.
- Fehlt `layout.layerWeight`, wird der bevorzugte Höhenbedarf des Elements durch den Median der automatisch gewichteten Layer desselben Tracks geteilt.
- Automatisch abgeleitete `layerWeight`-Werte werden ebenfalls auf den Korridor `0,5` bis `3` begrenzt.
- Ein explizites `layerWeight: 1` entspricht ungefähr einem Layer mit medianem automatischem Höhenbedarf.
- Die verfügbare Track-Höhe wird proportional zu den effektiven Layer-Gewichten verteilt. Jede Capability- oder Gruppenbox belegt anschließend die vollständige Höhe ihres Slots; die kompakte Blattdarstellung betrifft ausschließlich ihren Inhalt.
- Das frühere Feld `layout.weight` ist ungültig und wird weder normalisiert noch stillschweigend migriert.

### 7.4 Beispiele für Richtungen und Flushes

Die Folge

```text
Cap 1 horizontal
Cap 2 horizontal
Cap 3 horizontal
Cap 4 vertical
Cap 5 vertical
Cap 6 horizontal
Cap 7 horizontal
```

ergibt vier Tracks:

```text
[Cap 1] | [Cap 4] | [Cap 5] | [Cap 6]
[Cap 2] |         |         | [Cap 7]
[Cap 3] |         |         |
```

Bei vergleichbarem automatisch berechnetem Breitenbedarf sind die vier Tracks ähnlich breit. Bei vergleichbarem Höhenbedarf erhalten die drei beziehungsweise zwei Elemente der horizontalen Blöcke ähnliche Layer-Höhen.

Die Folge

```text
Cap A horizontal
Cap B horizontal
Flush horizontal
Cap C vertical
```

ergibt innerhalb eines Bands zwei Säulen:

```text
[Cap A] | [Cap C]
[Cap B] |
```

Ein `vertical`-Flush beginnt dagegen ein neues Band unterhalb des bisherigen Layouts:

```text
[Cap A] | [Cap B]
-----------------
[Cap C] | [Cap D]
```

### 7.5 Kompakte Blattinhalte, Platzmangel und semantischer Zoom

- Blatt-Capabilities besitzen einen kompakten bevorzugten Platzbedarf und werden ausschließlich mit Name sowie optionalem Icon und Zustandsmarkierungen gerendert. Ihre äußere Box füllt dennoch den vollständigen berechneten Slot.
- Beschreibungen werden unabhängig vom verfügbaren Platz niemals in der Map gerendert.
- Nicht-Blatt-Capabilities und Gruppen besitzen Mindestmaße für sinnvoll darstellbare Inhalte.
- Bei abnehmendem Platz verschwinden in dieser Reihenfolge: Metadaten-Vorschau, Icon.
- Die Icon-Sichtbarkeit richtet sich nach der tatsächlich nutzbaren Höhe des kompakten Headers, nicht nach dem bevorzugten Platzbedarf einer Blatt-Capability. Das 18-px-Icon bleibt ab 28 px interner Boxhöhe sichtbar und entfällt erst darunter; reguläre Header verwenden 20-px-Icons.
- Capability-Namen verwenden in Live-Map, SVG, PNG und PDF gut lesbare, zentral definierte Größen von 15 px in regulären, 12 px in kompakten und 10 px in minimalen Boxen. Gruppenbeschriftungen verwenden dort 12 px beziehungsweise 11 px im eingeklappten Zustand. PPTX verwendet abweichend die hierarchische Typografie aus Abschnitt 17.7.2.
- Capability-Namen dürfen abhängig von der tatsächlich nutzbaren Headerhöhe über mehrere Zeilen umbrechen. Sehr flache Boxen bleiben einzeilig; reguläre Header unterstützen bis zu zwei und ausreichend hohe kompakte Boxen bis zu drei Zeilen.
- Name und Zustandsindikatoren bleiben möglichst lange sichtbar.
- Ausgeklappte sichtbare Kinder behalten auch bei knappem Platz ihre Layout-Slots. Der semantische Zoom reduziert zunächst deren innere Inhalte und Zustandsdetails, nicht jedoch die fachlichen Elemente selbst.
- Die Daten bleiben erhalten; Fokus auf die Elternkachel nutzt die gesamte Map-Fläche für deren Unterbaum.
- Eingeklappte oder weggefilterte Unterbäume werden nicht an das Visualisierungs-Framework übergeben.

Die konkreten Mindestgrößen werden in der Implementierung als zentrale Design-Tokens festgelegt und durch automatisierte sowie visuelle Tests abgesichert.

### 7.6 Gruppen auf zwei Ebenen

- Gruppen nehmen auf beiden zulässigen Gruppenebenen wie Capabilities am bestehenden Track-Algorithmus teil; `direction`, `layerWeight` und `trackWeight` haben dieselbe Platzierungssemantik.
- Die Richtung verändert nicht das interne Layout der enthaltenen Capabilities. Diese behalten ihre eigenen, gemischten Layoutwerte.
- Bei `vertical` steht der Gruppenname in einem reservierten Bereich oberhalb der Capabilities.
- Bei `horizontal` steht der Gruppenname in einem schmalen reservierten Bereich links neben den Capabilities. Im ausgeklappten Zustand wird er vertikal und ohne Umbruch gesetzt.
- Gruppen besitzen außer Name, Layout und Hintergrundfarbe keine fachlichen Inhalte oder Metadaten.
- Die Gruppenfarbe wird nicht an enthaltene Capabilities vererbt.
- Eine Gruppe der zweiten Ebene wird vollständig innerhalb des Inhaltsbereichs ihrer Elterngruppe berechnet und darf deren Namensbereich oder Rahmen nicht überlagern.
- Eingeklappte `vertical`-Gruppen bleiben als schmale Säule sichtbar; eingeklappte `horizontal`-Gruppen als flache Ebene.
- In gemischten Tracks bleibt eine eingeklappte Gruppe auf die schmale Platzhalterbreite beziehungsweise -höhe reduziert und gibt den dadurch frei werdenden Platz an die flexiblen Nachbarelemente ab.
- Besteht ein gestapelter horizontaler Track ausschließlich aus eingeklappten horizontalen Gruppen, teilen sie die vollständige verfügbare Track-Höhe abzüglich der Gaps untereinander auf. Ihre Namen werden vertikal dargestellt.
- Besteht ein Band ausschließlich aus eingeklappten vertikalen Gruppen-Tracks, teilen sie die vollständige verfügbare Band-Breite abzüglich der Gaps untereinander auf. Ihre Namen werden horizontal dargestellt. Das Band bleibt quer dazu ein kompakter Strukturstreifen: Seine Höhe entspricht grundsätzlich `collapsedGroupSize` und wächst nur um die tatsächlich erforderlichen Textzeilen, falls die Namen trotz bedarfsgewichteter Breitenverteilung umbrechen müssen. In einem gemischten Elementbereich erhält der geöffnete Inhalt dadurch die verbleibende Höhe.
- In beiden Collapse-only-Konstellationen werden `layerWeight` und `trackWeight` ignoriert. Die Verteilung folgt stattdessen dem für den vollständigen Namen benötigten Platz; bei gleichem Bedarf wird gleichmäßig verteilt.
- Der Gruppenname wird stets vollständig und ohne Ellipse dargestellt. Reicht der proportionale Platz nicht für eine Zeile, darf der Name auch im eingeklappten Zustand umbrechen.
- Im eingeklappten Zustand dient der gesamte farbige Platzhalter samt Gruppenname als Aufklappfläche mit technischem Tooltip beziehungsweise zugänglichem Namen; ein eigener sichtbarer Button oder ein Chevron wird nicht gerendert.
- Gruppen sind nicht als fachliche Detailobjekte auswählbar und öffnen kein Detailpanel. Sie sind jedoch per Doppelklick als temporäre Wurzel fokussierbar.

## 8. Darstellungsregeln

### 8.1 Vererbung

- `visualization.color` und `visualization.icon` werden vom direkten Elternknoten geerbt.
- Eigene Werte überschreiben geerbte Werte.
- Fehlt eine Farbe in der gesamten Ahnenkette, gilt `map.theme.defaultColor`.
- Fehlt auch diese, gilt ein eingebauter Theme-Standard.
- `visualization.shape` und Layoutwerte werden nicht vererbt.

### 8.2 Farben

- Das MVP akzeptiert RGB-Hex-Werte im Format `#RRGGBB`.
- Text-, Rahmen- und Interaktionsfarben werden automatisch aus der wirksamen Hintergrundfarbe abgeleitet.
- Extrem helle oder dunkle Eingaben dürfen für Text und Zustandsanzeige durch kontrastierende Systemfarben ergänzt werden; die eingegebene Kachelfarbe selbst bleibt unverändert.

### 8.3 Icons

- Alle Icons der installierten Lucide-Version stehen ohne manuell gepflegte Allowlist zur Verfügung. Sie können über ihren offiziellen PascalCase-Namen oder in Kebab-Case referenziert werden, zum Beispiel `BrainCircuit` oder `brain-circuit`.
- Ein unbekannter Icon-Name ist ein Schema-/Semantikfehler.
- Externe Bild- oder Icon-URLs sind im MVP unzulässig.

### 8.4 Erweiterbares Formensystem

`visualization.shape` wählt eine Form aus einem von der Anwendung bereitgestellten Formenkatalog. Der Katalog enthält initial `box` und `chevron`, ist architektonisch jedoch nicht auf diese Werte begrenzt. Weitere Formen wie Raute, Hexagon, Pfeil oder Pill dürfen später ergänzt werden, ohne das YAML-Feld, den React-Flow-Node-Typ, die Interaktionslogik oder das Export-Szenenmodell grundlegend zu verändern.

Für jede registrierte Form existiert genau eine zentrale, formatneutrale Definition mit mindestens:

- stabiler Shape-ID und Anzeigename;
- einer aus tatsächlicher Breite, Höhe und zentralen Design-Tokens deterministisch erzeugten Vektorgeometrie;
- einem sicheren rechteckigen Inhaltsbereich für Icon, Text und Zustandsindikatoren;
- zulässigen Capability-Arten, Layout-Richtungen und gegebenenfalls einer definierten Ersatzdarstellung;
- Kontur-, Ecken- und Join-Regeln;
- einer vereinfachten Legendengeometrie;
- Exporthinweisen für SVG und editierbare PowerPoint-Geometrie.

Unbekannte Shape-IDs sind Validierungsfehler. Neue integrierte Formen erweitern den Katalog und die Schema-Validierung, erfordern aber keine neue YAML-Struktur. Eigene SVG-Pfade oder Geometrieparameter werden nicht aus dem YAML übernommen. Dadurch bleiben Darstellung, Sicherheit, Validierung und Export reproduzierbar.

Alle Capability-Formen verwenden denselben rechteckigen äußeren Interaktions-Wrapper. Er bleibt für React Flow die maßgebliche Node-Grenze und übernimmt Auswahl, Drag-Verhinderung, Doppelklick, Tooltip, zugänglichen Namen und Zustandsklassen. Die sichtbare Form wird darin als absolut positionierte SVG-Fläche dargestellt; sie empfängt selbst keine Pointer-Ereignisse. Icon, Name und Bedienelemente liegen als semantische HTML-Inhaltsebene über der SVG-Fläche und werden innerhalb des von der Form gelieferten sicheren Inhaltsbereichs ausgerichtet. Interaktive Inhaltselemente verwenden die React-Flow-Utility-Klasse `nodrag`.

Füllung und Grundkontur einer nicht-rechteckigen Form werden durch **einen gemeinsamen SVG-Pfad** mit `fill` und echtem `stroke` dargestellt. Eine Kontur darf nicht durch zwei ineinandergelegte Polygone, CSS-`clip-path`, Pseudoelemente oder unterschiedlich große Füll- und Rahmenflächen simuliert werden. Der Pfad berücksichtigt die halbe Konturstärke an den Node-Grenzen, sodass weder Spitzen noch Linien abgeschnitten werden. Auswahl, Suche und Fokus dürfen einen zusätzlichen, auf demselben Pfad basierenden Effekt verwenden, verändern aber weder die Grundgeometrie noch deren Konturstärke.

Die Formdefinition ist von React und React Flow unabhängig. Bildschirmrenderer und Exportadapter erhalten dieselbe aufgelöste Geometrie; formatspezifische Nachbauten der Pfadpunkte sind unzulässig. Änderungen an Spitze, Einzug, Ecken oder Inhaltsbereich einer Form werden dadurch an einer Stelle vorgenommen und müssen in Web, SVG, PNG, PDF und PPTX konsistent wirksam werden.

#### 8.4.1 Box

- `visualization.shape: box` ist der Standard und verwendet ein abgerundetes Rechteck mit den zentral definierten absoluten Eckenradien.
- Die Box ist für Blatt- und Nicht-Blatt-Capabilities sowie beide Layout-Richtungen zulässig.
- Formfläche, Headertrennung und sicherer Inhaltsbereich berücksichtigen die vorhandenen Capability-Inhalte und sichtbaren Kinder.

#### 8.4.2 Wertstrom-Chevron

- Chevrons sind in dieser Ausbaustufe ausschließlich für Blatt-Capabilities zulässig. Ein Chevron mit `children` ist ein Validierungsfehler mit dem Hinweis, entweder die Kinder zu entfernen oder `shape: box` zu verwenden.
- Bei `visualization.shape: chevron` und `layout.direction: vertical` wird die Capability als nach rechts gerichtetes Wertstromsegment dargestellt. Der kanonische Pfad besitzt links eine Einbuchtung und rechts eine Pfeilspitze. Die initialen absoluten Design-Tokens sind `tipDepth = 22`, `notchDepth = 18`, `strokeWidth = 1` und `segmentGap = 4` logische Einheiten.
- Für ein Layoutrechteck mit Breite `w`, Höhe `h` und `strokeInset = strokeWidth / 2` gilt `maxDepth = max(0, min((w - 2 × strokeInset) / 3, (h - 2 × strokeInset) / 2))`. Die wirksame Spitzen- beziehungsweise Einzugstiefe ist jeweils das Minimum aus ihrem Design-Token und `maxDepth`. Der geschlossene Pfad verläuft, ausgehend links oben und im Uhrzeigersinn, über linke obere Ecke, Beginn der rechten Spitze, rechte Spitze, Ende der rechten Spitze, linke untere Ecke und linke Einbuchtung. Sämtliche Außenpunkte liegen um `strokeInset` innerhalb des Layoutrechtecks. Damit bleibt die Kontur auch bei kleinen Elementen vollständig sichtbar und die Form schneidet sich nicht selbst.
- Der Chevron besitzt entlang seiner vollständigen Kontur dieselbe charakteristische graue Grundlinie wie reguläre Capability-Boxen. Die erste Version verwendet einen zentral festgelegten, leicht gerundeten Linienübergang (`stroke-linejoin: round`) und eine einheitliche Konturstärke.
- Der sichere Inhaltsbereich beginnt rechts der linken Einbuchtung und endet links der Pfeilspitze. Icon und Text werden innerhalb dieses Bereichs gemeinsam zentriert; Formspitzen dürfen nicht als nutzbare Textbreite gezählt werden.
- Direkt aufeinanderfolgende Chevron-Geschwister bleiben eigenständige, vollständig umrandete Formen. Sie überlappen sich nicht und werden initial durch einen zentralen horizontalen Abstand von `4` logischen Einheiten getrennt. Boxen und Flushes unterbrechen eine Chevron-Kette.
- Bei `visualization.shape: chevron` und `layout.direction: horizontal` wird die Capability bis auf Weiteres über die im Formenkatalog definierte Ersatzdarstellung `box` gerendert. Es gibt weder einen linken Abwärts-Chevron noch eine vertikale Verbindungslinie. Die konfigurierte Shape-ID bleibt im normalisierten Modell erhalten, damit später eine spezialisierte horizontale Variante ohne Schemaänderung ergänzt werden kann.
- Ein Chevron unterstützt dieselben wirksamen Farben, Icons, Auswahl-, Such-, Filter- und Doppelklick-Interaktionen wie eine Box.
- Der Capability-Name muss vollständig zugänglich bleiben. Reicht der sichere Inhaltsbereich nicht aus, darf der Name visuell gekürzt werden, muss aber über Tooltip und zugänglichen Namen vollständig verfügbar sein.

## 9. Suche, Filter und Sichtbarkeit

### 9.1 Suche

Die Suche berücksichtigt mindestens `name`, `description`, `owner`, `responsibilities`, `tags` und skalare Metadatenwerte. Treffer werden hervorgehoben; ihre Ahnen werden automatisch sichtbar gehalten. Suche allein blendet Nicht-Treffer nicht aus.

### 9.2 Metadatenfilter

- Die Filteroberfläche wird automatisch aus den im gültigen Dokument tatsächlich vorhandenen Kernfeldern und Metadatenwerten erzeugt.
- Eine zusätzliche Filterkonfiguration im YAML ist im MVP weder erforderlich noch vorgesehen.
- Filter können auf Kernfeldern und skalaren beziehungsweise skalaren Listenwerten in `metadata` aufgebaut werden.
- Leere Felder und komplexe Objektwerte werden nicht als auswählbare Filter angeboten.
- Werte innerhalb desselben Felds werden mit ODER verknüpft.
- Unterschiedliche Felder werden mit UND verknüpft.
- Passt ein Nachfahre, bleiben alle notwendigen Ahnen als Kontext sichtbar.
- Ein nur als Kontext sichtbarer Ahne wird optisch von einem direkten Treffer unterschieden.
- Leere Trefferlisten zeigen einen erklärenden Leerzustand und eine Aktion „Filter zurücksetzen“.
- Gruppen sind keine eigenen Filtertreffer. Enthält eine Gruppe keine passenden Capabilities, bleibt sie als kompakter struktureller Platzhalter sichtbar.

### 9.3 Ein-/Ausklappen

Der Einklappzustand wird getrennt über Capability- und Gruppen-IDs verwaltet und als separater UI-Zustand in `localStorage` gespeichert. Er ist kein Bestandteil des YAML und darf beim Speichern oder Exportieren des YAML niemals dort hineingeschrieben werden. Zustände für IDs, die im aktuellen Dokument nicht mehr vorkommen, werden beim Laden verworfen. Filter oder Suche dürfen notwendige Capability-Ahnen und Gruppen temporär öffnen, verändern aber nicht den gespeicherten manuellen Einklappzustand. Gruppen verschwinden niemals vollständig.

Existiert für die aktuelle Map noch kein gespeicherter Zustand, startet sie deterministisch in „Ebene 1“:

- Gruppen der ersten und zweiten Ebene bleiben ausgeklappt, damit die Grundstruktur sichtbar ist.
- „Ebene 1“ zeigt ausschließlich die obersten Capabilities; alle Capabilities mit Kindern sind eingeklappt.
- „Ebene 2“, „Ebene 3“ und „Vollständig“ erweitern die sichtbare Capability-Tiefe deterministisch.
- Manuelle Änderungen und eine gewählte Ansichtstiefe werden lokal gespeichert.
- Gespeicherte Zustände des entfernten Profils `overview` werden einmalig auf „Ebene 1“ migriert und anhand der Capability-Tiefe neu erzeugt.

Beim Ein- oder Ausklappen bleibt das betätigte Element als visueller Anker an derselben Bildschirmposition. Das neu berechnete Layout darf daher weder an den oberen Rand springen noch automatisch vollständig eingepasst werden.

### 9.4 Fokusmodus

Ein Doppelklick auf eine registrierte Capability-Form oder eine Gruppenfläche behandelt das gewählte Element temporär als Wurzel. Gruppen beider zulässigen Gruppenebenen sind fokussierbar; Flushes bleiben rein strukturell und können nicht fokussiert werden. Der Doppelklick erfordert keine gesonderte Fokus-Schaltfläche.

Beim Fokus auf eine Capability wird diese unabhängig von Ansichtsprofil und manuellem Collapse-Zustand temporär geöffnet, sodass ihre direkten Capability-Kinder als genau nächste Capability-Ebene sichtbar werden. Die direkten Kinder selbst werden nicht automatisch geöffnet; tiefere Ebenen folgen wieder dem aktiven Ansichtsprofil, dem manuellen Collapse-Zustand sowie Suche und Filtern. Bei einer Blatt-Capability entsteht kein zusätzlicher Leerraum. Beim Fokus auf eine Gruppe wird die Gruppe selbst einschließlich notwendiger Gruppenahnen temporär geöffnet und ihre direkten Inhalte werden sichtbar. Direkt enthaltene Capabilities werden dabei nicht ihrerseits automatisch geöffnet; ihre Kinder folgen weiterhin dem aktiven Ansichtsprofil, dem manuellen Collapse-Zustand sowie Suche und Filtern.

Diese Fokusöffnungen sind ausschließlich abgeleitete, flüchtige Sichtbarkeits-Overrides. Sie verändern weder die manuell eingeklappten Capability- und Gruppen-IDs noch das gewählte Ansichtsprofil oder die in `localStorage` gespeicherten Werte. Beim Wechsel des Fokusziels oder beim Verlassen des Fokusmodus entfallen die Overrides, und der vorherige effektive Collapse-Zustand gilt wieder. Die automatische Fokusöffnung darf deshalb nicht als manuelle Änderung persistiert oder in YAML beziehungsweise Exportmetadaten geschrieben werden.

Beim Eintritt in den Fokusmodus wird der bisherige Viewport gespeichert und der fokussierte Teilbaum einmalig eingepasst. Die dauerhaft sichtbare Breadcrumb-Navigation beginnt mit der Map-Wurzel und zeigt anschließend den vollständigen strukturellen Pfad zum Fokusziel. Darin werden Gruppen der ersten und zweiten Ebene sowie Capability-Ahnen in ihrer tatsächlichen Reihenfolge dargestellt. Ein Klick auf einen fokussierbaren Breadcrumb setzt dieses Element als neues Fokusziel; ein Klick auf die Map-Wurzel beendet den Fokusmodus. Beim vollständigen Verlassen wird der vor Eintritt gespeicherte Viewport wiederhergestellt. Die reine Navigation zwischen fokussierten Ahnen passt den neuen Teilbaum einmalig ein, überschreibt aber nicht den ursprünglich gespeicherten Rückkehr-Viewport.

Ohne aktiven Fokus zeigt der Breadcrumb ausschließlich die Map-Wurzel als aktuellen, nicht erneut auslösbaren Eintrag. Bei schmalem Platz bleibt der aktuelle Eintrag sichtbar; ältere mittlere Pfadelemente dürfen visuell zu einer zugänglichen Ellipsen-Auswahl zusammengefasst werden, ohne Gruppen aus dem semantischen Pfad zu entfernen. Fokus, Breadcrumb-Navigation, Suche und Filter bleiben miteinander kombinierbar.

Ein einfacher Klick auf eine Gruppenbeschriftung behält seine bestehende Collapse-Funktion. Ein Doppelklick auf Gruppenfläche oder -beschriftung hat Vorrang, fokussiert die Gruppe und darf nicht zusätzlich ein- oder ausklappen. Die Interaktionsauflösung muss für Maus und Trackpad deterministisch sein.

## 10. Detailpanel

Das Detailpanel zeigt für die ausgewählte Capability:

- Name, Icon und wirksame Farbe;
- vollständige Beschreibung;
- Owner und Verantwortlichkeiten;
- Tags;
- frei definierte Metadaten in einer lesbaren Schlüssel-Wert-Darstellung;
- Pfad innerhalb der Capability-Hierarchie;
- direkte Kinder und Zahl aller Nachfahren;
- wirksame und explizit gesetzte Visualisierungswerte.

Es bietet für Nicht-Blatt-Capabilities eine Aktion zum Ein-/Ausklappen, aber weder eine Fokus-Schaltfläche noch Datenbearbeitung. Der Fokus wird ausschließlich durch Doppelklick in der Map aktiviert.

## 11. Editor, Validierung und Live-Vorschau

### 11.1 Editor

CodeMirror 6 wird als YAML-Editor eingesetzt. Er bietet Syntaxhervorhebung, Zeilennummern, Suchen, Undo/Redo und die Integration eigener Diagnostik. Die komplexe Referenzmap gemäß Abschnitt 15.4 ist zugleich das standardmäßig geladene, kommentierte Startdokument. Sie demonstriert die vollständige Varianz der unterstützten Syntax und ist das Ziel der Aktion „Auf Beispiel zurücksetzen“.

### 11.2 Validierungspipeline

Nach einer Eingabepause von ungefähr 250 ms läuft:

1. YAML-Parsing unter Erhalt von Quellpositionen;
2. strukturelle Schema-Validierung;
3. semantische Validierung;
4. Normalisierung von Defaults und Vererbung;
5. Sichtbarkeits- und Layoutberechnung;
6. Aktualisierung der Vorschau.

Semantisch validiert werden mindestens:

- global eindeutige Capability- und Gruppen-IDs;
- gültige ID-Formate;
- gültige Farben und bekannte Icons;
- bekannte Shape-IDs und die im Formenkatalog definierten Einschränkungen der gewählten Form;
- maximal zwei Gruppenebenen sowie keine Gruppen innerhalb von Capability-`children`;
- gültige Positionen von Flushes und keine leeren Layoutsegmente;
- `shape: chevron` ausschließlich für Blatt-Capabilities und dessen definierte Box-Ersatzdarstellung bei horizontalem Layout;
- positive `layerWeight`- und `trackWeight`-Werte;
- korrekte Position von `layerWeight` und `trackWeight`;
- Verwendung des nicht mehr unterstützten Felds `weight` mit einem konkreten Migrationshinweis auf `layerWeight`;
- mindestens eine Capability direkt oder innerhalb einer Gruppe;
- ausschließlich unterstützte Schema-Versionen.

### 11.3 Fehlerdarstellung

- Fehler werden im Editor an der möglichst genauen Quellposition markiert.
- Eine Fehlerliste zeigt Schweregrad, YAML-Pfad, verständliche Ursache und Lösungshinweis.
- Syntaxfehler blockieren nachfolgende Schema- und Semantikprüfungen.
- Warnungen dürfen das Rendering nicht blockieren; Fehler blockieren es.
- Bei Fehlern bleibt die zuletzt gültige Map sichtbar und erhält den Status „Vorschau nicht aktuell“.
- Ist noch keine gültige Eingabe vorhanden, zeigt die Map einen erklärenden Fehlerzustand.

## 12. Lokale Speicherung

- Der aktuelle Editorinhalt wird nach Änderungen automatisch in `localStorage` gespeichert.
- YAML-Text und UI-Zustand werden als getrennte Einträge gespeichert.
- Der persistierte UI-Zustand des MVP enthält ausschließlich die getrennt gespeicherten, manuell eingeklappten Capability- und Gruppen-IDs sowie das Ansichtsprofil. Temporäre Fokusöffnungen und der Breadcrumb-Pfad werden daraus abgeleitet und nicht gespeichert.
- Fokus, Auswahl, Suche und aktive Filter werden nicht sitzungsübergreifend gespeichert.
- Gespeicherte Daten tragen jeweils eine interne Speicher- und Schema-Version.
- Beim Start wird zuerst der lokale Stand geladen.
- Nicht lesbare oder inkompatible Daten führen nicht zum Absturz; das Tool bietet das Startbeispiel und einen Hinweis an.
- „Auf Beispiel zurücksetzen“ erfordert eine Bestätigung, wenn ungesicherte Abweichungen bestehen.
- Das Zurücksetzen auf das Beispiel löscht auch den separat gespeicherten Collapse-Zustand.
- Es werden keine Daten an einen Server übertragen.

## 13. Technische Architektur

### 13.1 Technologieentscheidungen

| Bereich | Auswahl | Begründung |
| --- | --- | --- |
| Sprache | TypeScript im Strict Mode | Durchgängige Typisierung von Schema, Normalform, Layout und UI |
| UI | React | Komponentenmodell und direkte Integration mit React Flow und CodeMirror |
| Build/Development | Vite | Schneller Development-Server, TypeScript-Unterstützung und React Fast Refresh |
| Visualisierung | React Flow (`@xyflow/react`) | Verschachtelte Gruppen, Custom Nodes, Zoom/Pan, Fit View, Sichtbarkeit und Interaktionsgrundlagen |
| YAML-Editor | CodeMirror 6 | Modularer Editor mit YAML-Sprache und integrierbarer Diagnostik |
| YAML-Parser | `yaml` | Parsing mit Dokument-/Quellpositionszugriff und verständlichen Syntaxfehlern |
| Laufzeitschema | Zod | TypeScript-nahe Validierung und Ableitung interner Typen |
| Icons | Lucide React | Konsistente Open-Source-Icons ohne externe URLs |
| Unit-/Komponententests | Vitest und Testing Library | Vite-nahe, schnelle Tests |
| End-to-End-Tests | Playwright | Browserübergreifende Kernabläufe und visuelle Regressionstests |
| Linting | ESLint mit `typescript-eslint` | Type-aware TypeScript-Regeln und reproduzierbare Qualitätsprüfung |

React Flow übernimmt Viewport, Eingaben und das Rendering verschachtelter Custom Nodes. Es bestimmt weder die fachliche Anordnung noch die sichtbare Form einer Capability. Alle Capability-Formen werden über einen gemeinsamen registrierten Capability-Custom-Node gerendert; `visualization.shape` wird als Formdatenwert an dessen SVG-Shape-Surface übergeben. Eine neue Form darf deshalb nicht allein zur Darstellung einen zusätzlichen React-Flow-Node-Typ erfordern. Eine eigene, pure TypeScript-Layoutfunktion berechnet in einer Bottom-up-Phase zunächst die bevorzugten Platzbedarfe ausschließlich des sichtbaren Baums und weist in einer Top-down-Phase lückenlos die verfügbaren absoluten Rechtecke zu. Anschließend übersetzt der Adapter Capabilities und Gruppen in React-Flow-Nodes mit Elternbezug; Flushes existieren nur in der Layout-Zwischenrepräsentation.

Ein von React unabhängiges Shape-Registry-Modul löst eine Shape-ID, das endgültige Layoutrechteck und die Design-Tokens in eine kanonische Formgeometrie auf. Diese enthält mindestens den sichtbaren Vektorpfad, den sicheren Inhaltsbereich, Konturparameter und die tatsächlich verwendete Darstellungsvariante. Bildschirm- und Exportrenderer konsumieren dieses Ergebnis, anstatt eigene Box-, Chevron- oder künftige Formpunkte zu berechnen. Der äußere React-Flow-Node bleibt rechteckig; ausschließlich die visuelle SVG-Fläche folgt dem kanonischen Pfad.

Der Export greift nicht auf einen Screenshot des sichtbaren Browserausschnitts zurück. Ein formatneutrales Export-Szenenmodell wird aus demselben sichtbaren Baum und denselben absoluten Layoutrechtecken abgeleitet. Daraus wird als erste kanonische Ausgabe ein selbstständiges SVG erzeugt. PNG rasterisiert ausschließlich dieses SVG; PDF übernimmt dieselbe SVG-Geometrie soweit technisch möglich vektorbasiert. Dadurch verwenden Bildschirmdarstellung und alle Exportformate dieselbe Geometrie, während formatspezifische Renderer keine React-Flow- oder Viewport-Transformationen rekonstruieren oder redundante Zeichenlogik pflegen müssen.

### 13.2 Schichten

```text
YAML-Text
  -> Parser und Quellpositionsindex
  -> Schema- und Semantikvalidierung
  -> normalisiertes Capability-Modell
  -> gemeinsamer Hierarchieindex für Gruppen und Capabilities
  -> Suche, Filter, Collapse und Fokus
  -> Bottom-up-Platzbedarfsberechnung des sichtbaren Baums
  -> deterministische Top-down-Layout-Engine
  -> Shape-Registry und kanonische Formgeometrie
  -> React-Flow-Adapter
  -> Map und Detailpanel
```

Vorgesehene interne Module:

- `domain`: Schema, normalisierte Typen und Vererbungsregeln;
- `parser`: YAML-Parsing, Quellpfade und Diagnostik;
- `layout`: pure, rekursive Bedarfs- und Layoutberechnung einschließlich Bändern, Tracks und Flushes;
- `shapes`: registrierter Formenkatalog, zentrale Design-Tokens, Pfadgeometrien, sichere Inhaltsbereiche und Formrestriktionen ohne React-Abhängigkeit;
- `visibility`: Suche, Filter, Collapse, Fokus und Kontext-Ahnen;
- `renderer`: Adapter, gemeinsamer Capability-Custom-Node, SVG-Shape-Surface und semantische HTML-Inhaltsebene für React Flow;
- `export`: formatneutrales Szenenmodell, gemeinsame Export-Tokens und Adapter für PNG, SVG, PDF und PPTX;
- `editor`: CodeMirror-Integration;
- `app`: UI-Komposition, lokaler Zustand und Persistenz.

Zwischen `domain`, `layout`, `shapes` und `visibility` dürfen keine React-Abhängigkeiten bestehen. Der `renderer` bildet diese Ergebnisse ausschließlich auf React Flow, SVG-Fläche und HTML-Inhaltsebene ab. Damit bleiben Layout- und Formgeometrie testbar, exportierbar und später wiederverwendbar.

Der normalisierte Hierarchieindex bildet Capability- und Gruppen-IDs gemeinsam auf Elementart, Eltern-ID und vollständigen Pfad ab. Fokusziel und Breadcrumb verwenden denselben Index, damit Gruppenpfade nicht nachträglich aus der Renderstruktur rekonstruiert werden. Die `visibility`-Schicht leitet daraus die temporären Fokusöffnungen ab, bevor der sichtbare Baum an Bedarfsberechnung und Layout übergeben wird. Der manuelle Collapse-Zustand bleibt dabei unverändert die persistierbare Quelle; Fokusöffnungen bilden eine separate, höher priorisierte Sichtbarkeitsschicht.

### 13.3 Zustand

Der Zustand wird in klar getrennte Bereiche aufgeteilt:

- Editor: aktueller YAML-Text, Diagnosen, letzte gültige Normalform;
- Ansicht: Suche, Filter, manuelles Collapse-Set, Fokusziel-ID, abgeleitete Fokusöffnungen, Auswahl-ID;
- Ansichtsprofil: „Ebene 1“, „Ebene 2“, „Ebene 3“ oder „Vollständig“;
- Viewport: Zoom und Pan;
- Export: gewähltes Format, laufender Fortschritt, Ergebnis- oder Fehlermeldung;
- Persistenz: Speicherstatus und Schema-Version.

Für das MVP genügt React State mit Reducer und Context. Eine zusätzliche globale State-Bibliothek wird nur eingeführt, wenn die Umsetzung einen konkreten Bedarf zeigt.

### 13.4 Umsetzungsreihenfolge für Fokus und Breadcrumb

Die Erweiterung wird in kleinen, getrennt prüfbaren Schritten umgesetzt:

1. Der normalisierte Hierarchieindex wird auf gemeinsame Pfade für Gruppen und Capabilities erweitert und zunächst mit Unit-Tests abgesichert.
2. Das Fokusziel wird von einer reinen Capability-ID auf ein gemeinsam auflösbares Gruppen- oder Capability-Ziel umgestellt.
3. Die `visibility`-Schicht erhält die flüchtigen Fokusöffnungen für fokussierte Gruppen und die direkte nächste Ebene einer fokussierten Capability; Persistenz und Layout bleiben dabei unverändert.
4. Gruppen erhalten die Doppelklick-Interaktion mit Vorrang vor dem einfachen Collapse-Klick. Capability-Fokus und Viewport-Wiederherstellung werden gegen Regressionen geprüft.
5. Der dauerhaft sichtbare Breadcrumb wird ausschließlich aus dem Hierarchieindex und dem aktuellen Fokusziel abgeleitet und anschließend für Desktop und Tablet responsiv abgesichert.
6. Das Export-Szenenmodell übernimmt denselben vollständigen Fokuspfad einschließlich Gruppen.
7. Abschließend werden die kombinierten Abläufe mit Suche, Filter, Ansichtsprofil, manuellem Collapse, Fokuswechsel, Breadcrumb-Navigation und Export browserübergreifend getestet.

## 14. Nichtfunktionale Anforderungen

### 14.1 Performance

Verbindliche Testbasis ist die komplexe Referenzmap mit ungefähr 500 Capabilities und bis zu vier Capability-Ebenen auf einem aktuellen durchschnittlichen Laptop:

- Editoränderung bis Abschluss von Parsing und Validierung: Zielwert unter 300 ms nach Ablauf des Debounce;
- gültige Änderung bis sichtbare Vorschau einschließlich Bottom-up-Bedarfsberechnung: Zielwert unter 750 ms;
- Suche, Filter-, Collapse- oder Fokusänderung bis aktualisierte Map: Zielwert unter 350 ms;
- flüssiges Zoomen und Verschieben im üblichen Arbeitsbereich.
- Export der komplexen Referenzmap darf die Oberfläche nicht dauerhaft blockieren; konkrete Zeit- und Speicherziele werden vor jeder Formatstufe anhand eines technischen Spikes verbindlich festgelegt.

Tiefere Strukturen bleiben zulässig, sind aber außerhalb der garantierten Performance-Baseline. Es gibt keine künstliche Tiefenbegrenzung im Schema. Nicht sichtbare Unterbäume werden nicht gerendert.

### 14.2 Browser und Darstellung

- Verbindlich unterstützt werden die jeweils zwei neuesten Hauptversionen von Chrome, Edge, Firefox und Safari auf Desktop-Systemen.
- Die Anwendung bleibt ab Tablet-Breite bedienbar.
- Das Layout füllt die verfügbare Browserfläche ohne feste Seitenabmessungen.
- Helle Oberfläche ist der MVP-Standard; Farben werden über zentrale Design-Tokens definiert.

### 14.3 Sicherheit und Datenschutz

- YAML wird ausschließlich als Datenformat behandelt und niemals ausgeführt.
- Freie Texte werden als Text gerendert, nicht als HTML.
- Externe Ressourcen aus dem YAML werden nicht geladen.
- Icon-Namen werden ausschließlich gegen den automatisch von `lucide-react` bereitgestellten Katalog aufgelöst; externe Ressourcen werden dabei nicht geladen.
- Verarbeitung und Speicherung erfolgen ausschließlich lokal im Browser.
- Exportdateien werden ausschließlich lokal erzeugt; weder YAML noch gerenderte Inhalte werden für den Export an einen Server übertragen.

### 14.4 Entwicklungsqualität

Die Implementierung muss mindestens folgende Skripte anbieten:

- Development-Server mit Hot Reloading;
- Produktions-Build;
- Standalone-Build als einzelne HTML-Datei mit eingebettetem CSS, JavaScript und sonstigen Assets, die direkt über `file://` ohne Webserver lauffähig ist;
- Linting;
- Typecheck ohne Ausgabe;
- Unit-/Komponententests;
- End-to-End-Tests.

Der CI-fähige Qualitätslauf umfasst mindestens Linting, Typecheck, Tests und Produktions-Build.

## 15. Teststrategie

### 15.1 Unit-Tests

Besonders vollständig zu testen sind:

- Schema-Defaults und Fehlermeldungen;
- globale ID-Eindeutigkeit;
- Farb- und Icon-Vererbung;
- Gruppierung maximaler horizontaler Blöcke sowie horizontale und vertikale Flush-Grenzen;
- Bottom-up-Platzbedarf und automatische Track-Gewichtung ohne `trackWeight`;
- Bottom-up-Höhenbedarf und automatische Layer-Gewichtung ohne `layerWeight`;
- gemischte automatische und explizite Track-Gewichte einschließlich Begrenzung und Rundung;
- gemischte automatische und explizite Layer-Gewichte einschließlich Begrenzung und Rundung;
- Validierungsfehler und Migrationshinweis für das entfernte Feld `weight`;
- gemischte Richtungen auf mehreren Ebenen;
- kompakte Blattinhalte, deren äußere Boxen unterschiedlich große Slots jeweils vollständig ausfüllen;
- lückenloses Tiling jeder rekursiven Inhaltsfläche sowie Neuberechnung ausschließlich aus sichtbaren Elementen nach Collapse-, Filter- und Fokusänderungen;
- Registry-Auflösung bekannter und unbekannter Shape-IDs, Formrestriktionen und Ersatzdarstellungen einschließlich ungültiger Chevrons mit Kindern;
- deterministische Pfadgeometrie, Konturstärke und sichere Inhaltsbereiche bei kleinen, breiten und hohen Layoutrechten;
- Filterlogik einschließlich Kontext-Ahnen;
- Wechselwirkung zwischen Filter und manuellem Collapse;
- Fokus auf Capability und Gruppe, vollständige Breadcrumb-Pfade einschließlich Gruppen sowie temporäre Öffnung der direkten nächsten Capability-Ebene;
- semantische Zoom-Entscheidung bei Platzmangel.
- Schema, Vererbung, Ausrichtung und Collapse-Platzhalter von Gruppen auf erster und zweiter Ebene.

### 15.2 Komponenten- und Integrationstests

- gültige Änderung aktualisiert die Vorschau;
- ungültige Änderung markiert den Editor und erhält die letzte gültige Vorschau;
- Auswahl öffnet das korrekte Detailpanel;
- Beschreibungen erscheinen vollständig im Detailpanel, aber niemals in der Map;
- Reset und Wiederherstellung aus `localStorage`;
- Filter-, Suche-, Collapse- und Fokusabläufe.
- Fokus per Doppelklick auf jede registrierte Capability-Form und Gruppe ohne sichtbare Fokus-Schaltfläche;
- dauerhaft sichtbarer Breadcrumb-Pfad mit Map-Wurzel, Gruppen und Capability-Ahnen;
- temporäre Fokusöffnung der direkten nächsten Capability-Ebene ohne Mutation des manuellen oder gespeicherten Collapse-Zustands;
- als normale Boxen dargestellte horizontale Chevron-Konfigurationen ohne Abwärtsindikator oder Verbindungslinie;
- vertikale Chevron-Wertströme mit einem einzigen SVG-Pfad, gleichmäßiger grauer Kontur und vollständigen Konturen auch in einer Kette;
- gemeinsame Inhaltsausrichtung, Interaktionen und zugängliche Namen über Box, Chevron und spätere registrierte Formen hinweg;
- horizontales und vertikales Gruppen-Rendering auf zwei Ebenen einschließlich getrenntem Collapse-Zustand.
- Exportaktion, Fortschritts- und Fehlerzustand sowie korrekter Dateiname und MIME-Typ je freigeschaltetem Format.

### 15.3 End-to-End- und visuelle Tests

- Start mit Beispiel bis zur interaktiven Map;
- fehlerhafte und anschließend korrigierte YAML-Eingabe;
- Referenzbeispiel für das Layout `[H,H,H,V,V,H,H]`;
- Referenzbeispiele mit mehreren, gemischt ausgerichteten Flushes innerhalb derselben Root-, Gruppen- und `children`-Liste;
- horizontale und vertikale Gruppen auf zwei Ebenen sowie ihre schmalen Collapse-Platzhalter;
- kompakte Blätter sowie gemischte Box- und Chevron-Wertstromdarstellungen einschließlich sehr schmaler und sehr flacher Grenzfälle;
- visuelle Regression der vollständigen Chevron-Kontur an linker Einbuchtung, rechter Spitze und Linienübergängen sowie des definierten Abstands in Chevron-Ketten;
- tiefer verschachtelte Map mit semantischem Zoom;
- Download jedes freigeschalteten Exportformats im regulären und im Standalone-Build;
- Prüfung, dass Viewport-Steuerungen, Editor, Detailpanel, Hover- und Auswahlmarkierungen nicht in der Exportdatei erscheinen;
- formatbezogene Struktur- beziehungsweise visuelle Regressionen gemäß Abschnitt 17.9;
- komplexe 500-Capability-Referenzmap gemäß Abschnitt 15.4;
- Desktopansicht und Tablet-Umschaltung;
- kritische Abläufe in Chromium, Firefox und WebKit.

### 15.4 Komplexe Referenzmap

Für reproduzierbare Funktions-, Layout-, visuelle und Performanceprüfungen wird eine versionierte YAML-Referenzdatei mit folgenden Eigenschaften eingecheckt:

- insgesamt 480 bis 520 Capabilities;
- genau fünf fachlich benannte Gruppen der ersten Ebene;
- pro Hauptgruppe null bis drei Gruppen der zweiten Ebene; in Summe ungefähr acht bis zehn Untergruppen;
- pro Untergruppe ungefähr fünf strukturierende Capabilities und darunter überwiegend acht bis zehn Blatt-Capabilities;
- ein bis vier Capability-Ebenen, wobei nicht jeder Ast dieselbe Tiefe besitzt;
- Gruppen der ersten und zweiten Ebene in horizontaler und vertikaler Richtung;
- ungruppierte Capabilities neben Gruppen;
- horizontale und vertikale Flushes in Root-, Gruppen- und `children`-Listen;
- automatische Track- und Layer-Gewichtung sowie gezielte explizite `trackWeight`- und `layerWeight`-Ausnahmen;
- kompakte Blatt-Capabilities überwiegend als Boxen; Chevrons werden nur in fachlich zusammenhängenden Wertströmen aus ungefähr drei bis sechs Schritten verwendet und machen höchstens ungefähr 20 Prozent der Blätter aus;
- kurze, mittlere und sehr lange deutsche sowie englische Namen, darunter lange zusammengesetzte deutsche Wörter;
- unterschiedlich lange Beschreibungen, die ausschließlich im Detailpanel sichtbar sind;
- semantisch passende und variierende Icons für jede Capability sowie unterschiedliche Farben, Verantwortlichkeiten, Tags, Metadaten und Vererbungskonstellationen;
- mehrere bewusst filter- und suchbare Merkmalskombinationen;
- ein deterministischer Inhalt: entweder als statische Datei oder aus einem Generator mit festem Seed, wobei CI und lokale Entwicklung exakt dasselbe Ergebnis verwenden.

Die Referenzmap ist ein versioniertes Test- und Demonstrationsartefakt und zugleich das Startbeispiel des Editors. Beim ersten Start ohne gespeichertes YAML sowie nach „Auf Beispiel zurücksetzen“ wird diese circa 500 Capabilities umfassende Datei geladen.

## 16. Abnahmekriterien des MVP

Das MVP gilt als abgenommen, wenn:

1. die statische Anwendung ohne Backend gebaut und ausgeliefert werden kann;
2. der integrierte Editor das Startbeispiel anzeigt und Änderungen lokal speichert;
3. gültiges YAML nach der definierten Pipeline live gerendert wird;
4. Syntax-, Schema- und Semantikfehler verständlich und quellnah dargestellt werden;
5. bei Fehlern die letzte gültige Vorschau sichtbar und als veraltet markiert bleibt;
6. beliebig rekursive `children` vom Schema akzeptiert werden;
7. das gemischte Layout einschließlich beider Flush-Richtungen, explizitem und automatischem `layerWeight`, explizitem und automatischem `trackWeight` sowie der Bottom-up-Bedarfsberechnung dem beschriebenen Algorithmus entspricht;
8. Farb- und Icon-Vererbung korrekt funktioniert;
9. Suche, Metadatenfilter, Collapse und der ausschließlich per Doppelklick auf Capability oder Gruppe aktivierte Fokusmodus korrekt zusammenspielen;
10. Auswahl einer Capability alle definierten Details im Panel zeigt;
11. Zoom, Pan, „Ansicht einpassen“, Viewport-Ankerung beim Collapse, einmaliges Einpassen beim Fokuswechsel sowie Wiederherstellung des ursprünglichen Viewports nach dem Fokusmodus funktionieren;
12. die komplexe Referenzmap mit ungefähr 500 Capabilities und bis zu vier Capability-Ebenen die Performance-Ziele im vereinbarten Testsystem erfüllt;
13. Desktop-Browser und Tablet-Darstellung gemäß Zielrahmen getestet sind;
14. Linting, Typecheck, automatisierte Tests und Produktions-Build erfolgreich durchlaufen;
15. die Map keine grafische Bearbeitung zulässt und vollständig aus dem YAML reproduzierbar ist;
16. gruppierte und ungruppierte Root-Capabilities gemeinsam darstellbar sind, Gruppen bis zur zweiten Gruppenebene funktionieren, Gruppenfarben nicht vererbt werden und eingeklappte Gruppen als schmale, vollständig beschriftete Struktur sichtbar bleiben;
17. Blatt-Capabilities kompakte Inhalte besitzen, ihre äußeren Boxen den zugewiesenen Slot vollständig ausfüllen und Beschreibungen ausschließlich im Detailpanel erscheinen;
18. Capability-Formen über denselben erweiterbaren Formenkatalog aufgelöst werden, vertikale Blatt-Capabilities als vollflächiger Rechts-Chevron mit echter, gleichmäßiger grauer SVG-Kontur erscheinen und horizontale Chevron-Konfigurationen vorläufig als normale Box dargestellt werden;
19. die Referenzdatei alle in Abschnitt 15.4 definierten Varianzmerkmale reproduzierbar abdeckt;
20. eine Map ohne gespeicherten Ansichtsstatus in „Ebene 1“ startet und alle Ansichtsprofile reproduzierbare Tiefen erzeugen;
21. der Breadcrumb in fokussierter und nicht fokussierter Ansicht dauerhaft sichtbar ist, Gruppen und Capability-Ahnen vollständig und in korrekter Reihenfolge enthält und die Navigation zu jedem fokussierbaren Ahnen erlaubt;
22. der Capability-Fokus genau die direkte nächste Capability-Ebene temporär sichtbar macht, ohne manuelle Collapse-Sets, Ansichtsprofil oder `localStorage` zu verändern, und der Gruppenfokus die fokussierte Gruppe samt direkten Inhalten öffnet, ohne direkt enthaltene Capabilities ihrerseits automatisch zu öffnen.

## 17. Export-Erweiterung

### 17.1 Zielbild und Exportumfang

Die Exportfunktion erzeugt lokal herunterladbare Dateien in den Formaten PNG, SVG, PDF und PPTX. Für die erste Umsetzung jedes Formats gilt als gemeinsamer Exportumfang:

- Exportiert wird die **aktuell erzeugte fachliche Darstellung** einschließlich des aktiven Ansichtsprofils, Fokus, Filterung sowie Capability- und Gruppen-Collapse-Zustand.
- Exportiert werden die vollständigen logischen Layoutgrenzen dieser Darstellung, unabhängig vom aktuellen Zoom, Pan und sichtbaren Browserausschnitt.
- Editor, Detailpanel, Toolbar, React-Flow-Steuerungen, Hintergrundraster, Hover-Zustand, aktuelle Auswahlkontur und sonstige Bedienoberfläche sind nicht Bestandteil der Datei.
- Fachlich wirksame Darstellungsmerkmale wie Gruppen, registrierte Capability-Formen, Farben, Icons, Namen, Zeilenumbrüche, Kontextabblendung und sichtbare Nachfahrenzähler bleiben erhalten.
- Jedes Format enthält einen Export-Frame mit dem Map-Namen als Titel oberhalb der Darstellung sowie einer Legende und ausgewählten Exportmetadaten. Diese Inhalte gehören zur Exportdatei, nicht zur interaktiven Map und verändern deren Layout nicht.
- Der Titel steht links oben. Rechts oben erscheinen der Erstellungszeitpunkt mit Zeitzone und das aktive Ansichtsprofil. Ein Fokuspfad und aktive Filter werden nur dann als zusätzliche kompakte Metadatenzeilen ausgegeben, wenn sie tatsächlich aktiv sind.
- Die Legende steht unterhalb der Map und enthält ausschließlich in der aktuellen Darstellung vorkommende Konzepte. Mögliche Einträge sind Gruppe, die tatsächlich verwendeten Capability-Formen, Indikator für verborgene Nachfahren und abgeblendeter Kontext. Jede Shape-Legende verwendet die vereinfachte Geometrie aus dem Formenkatalog.
- Eine aktive reine Textsuche beeinflusst den Export zunächst nicht visuell; Suchkonturen werden nicht exportiert. Filter und Fokus bestimmen dagegen weiterhin den sichtbaren Inhalt.
- Als Datenquelle dient ausschließlich die letzte gültige Darstellung. Ist die Vorschau wegen ungültigem YAML veraltet, bleibt Export möglich, muss aber vor dem Download deutlich auf den Export der letzten gültigen Version hinweisen.
- Die Erzeugung erfolgt vollständig im Browser und muss auch im Standalone-Build über `file://` ohne Webserver oder externe Ressourcen funktionieren.

SVG, PNG und PDF exportieren weiterhin ausschließlich die aktuelle Darstellung. PPTX bietet zusätzlich den in Abschnitt 17.7.2 definierten, vom UI-Zustand unabhängigen vollständigen Mehrfolienexport.

### 17.2 Gemeinsames Export-Szenenmodell

Vor dem ersten Format wird eine formatneutrale, immutable Export-Repräsentation eingeführt. Sie enthält mindestens:

- Dokumentmetadaten wie Map-ID, Map-Name, Exportzeitpunkt und Schema-Version;
- Gesamtbreite, Gesamthöhe und Hintergrund des vollständigen Export-Frames;
- Titel-, Legenden- und Metadatenblöcke mit eigener Geometrie und Typografie;
- geordnete Gruppen- und Capability-Elemente mit stabiler ID und Hierarchiebezug;
- absolute Rechtecke, Innenabstände, Ebenenreihenfolge und Clip-Geometrien;
- wirksame Füll-, Text-, Rahmen- und Konturfarben;
- Namen, Zeilenbegrenzung, Schriftgröße, Ausrichtung und Schriftschnitt;
- Lucide-Icons als formatsunabhängige Vektorpfade;
- Gruppen- und Capability-Geometrien sowie sichtbare Zustandsindikatoren; jede Capability-Geometrie enthält die konfigurierte Shape-ID, die tatsächlich verwendete Darstellungsvariante, den kanonischen Vektorpfad, den sicheren Inhaltsbereich und die Konturparameter;
- einen expliziten, absoluten Eckenradius je Flächenelement in logischen Export-Einheiten; der Radius darf nicht erst formatspezifisch aus Breite oder Höhe der Form abgeleitet werden.

Das Szenenmodell darf keine DOM-Elemente, React-Komponenten, CSS-Klassen oder React-Flow-Objekte enthalten. Es referenziert keine formatspezifisch erneut zu berechnenden Formpunkte, sondern übernimmt die aufgelöste Geometrie aus dem gemeinsamen Shape-Registry-Modul. Gemeinsame Export-Tokens müssen aus denselben Designwerten wie die Bildschirmdarstellung abgeleitet werden. Die Reihenfolge im Szenenmodell definiert verbindlich die Zeichen- und Überlagerungsreihenfolge aller Formate.

Der Erstellungszeitpunkt wird einmal pro Exportvorgang erzeugt und anschließend unverändert von allen Formatadaptern verwendet. Tests müssen eine injizierbare Uhr verwenden können. Die sichtbare Darstellung nutzt das lokale Datum und die lokale Uhrzeit einschließlich einer eindeutigen Zeitzonenangabe. Filter werden mit Feldbezeichnung und ausgewählten Werten zusammengefasst; der Fokus wird als vollständiger struktureller Pfad einschließlich enthaltener Gruppen und Capability-Ahnen ausgegeben.

### 17.3 Bedienung, Dateinamen und Fehlerfälle

- Die Kopfzeile erhält eine kompakte Exportaktion. Noch nicht implementierte Formate werden nicht als aktive Aktionen angeboten.
- Nach Auswahl eines Formats wird die Datei ohne weiteren Serverkontakt erzeugt und über den Browser heruntergeladen.
- Während der Erzeugung verhindert ein eindeutiger Fortschrittszustand Mehrfachauslösungen desselben Exports; die übrige Anwendung bleibt soweit technisch möglich bedienbar.
- Fehler führen nicht zum Verlust von YAML oder UI-Zustand und werden mit Format, Ursache und erneut ausführbarer Aktion angezeigt.
- Ein Abbruch oder Browserlimit erzeugt keine leere beziehungsweise unvollständige Datei.
- Der Dateiname folgt dem Muster `<map-id>-<ansichtsprofil>-YYYYMMDD-HHmmss.<endung>` und verwendet den lokalen Exportzeitpunkt. Ungültige Dateisystemzeichen werden entfernt. Ein frei konfigurierbarer Präfix bleibt eine mögliche spätere Ausbaustufe.
- MIME-Typen sind `image/png`, `image/svg+xml`, `application/pdf` und `application/vnd.openxmlformats-officedocument.presentationml.presentation`.

### 17.4 Phase 1 – SVG

SVG baut auf demselben Szenenmodell auf und stellt die Map als selbstständige Vektordatei bereit.

- Die Wurzel enthält eine deterministische `viewBox` über die vollständigen logischen Layoutgrenzen.
- Gruppen, registrierte Capability-Formen, Rahmen, Texte und Lucide-Icons werden als native SVG-Elemente ausgegeben.
- Nicht-rechteckige Capability-Flächen verwenden jeweils einen einzigen nativen SVG-Pfad mit gemeinsamer Füllung und Kontur. Eine aus zwei Polygonen zusammengesetzte Kontursimulation ist auch im Export unzulässig.
- Texte bleiben als Text erhalten und werden nicht generell in Pfade umgewandelt.
- Sämtliche Styles und Iconpfade werden eingebettet; die Datei besitzt keine externen Ressourcen, Skripte, Event-Handler oder `foreignObject`-Abhängigkeiten.
- IDs im SVG sind stabil, dokumentweit eindeutig und aus den fachlichen IDs ableitbar, ohne ungültige XML-Zeichen zu übernehmen.
- Die Ausgabe muss in aktuellen Browsern sowie üblichen Vektorprogrammen geöffnet werden können.
- Für SVG sind XML-Gültigkeit, Struktur, ViewBox, Texte, Pfade, Farben, fehlende externe Referenzen und eine visuelle Regression zu testen.

Das freigegebene SVG bildet anschließend die kanonische visuelle Zwischenrepräsentation für PNG und PDF. Es umfasst den vollständigen Export-Frame einschließlich Titel, Legende und Metadaten. Änderungen an gemeinsamer Geometrie, Textplatzierung, Farben oder Icons werden zuerst im Szenenmodell und SVG umgesetzt und nicht separat in nachgelagerten Formaten dupliziert.

### 17.5 Phase 2 – PNG

PNG wird ausschließlich durch Rasterisierung des in Phase 1 freigegebenen SVGs erzeugt und besitzt keine eigene fachliche Zeichenimplementierung.

- Die vollständige logische Exportfläche wird mit weißem Hintergrund als verlustfreie Rastergrafik ausgegeben.
- Die Standardauflösung verwendet einen Skalierungsfaktor von `2` gegenüber den internen SVG-Koordinaten, damit Text und Konturen auf üblichen Displays scharf bleiben.
- Seitenverhältnis und Anordnung entsprechen exakt der SVG-`viewBox`; der aktuelle Viewport wird nicht übernommen.
- Vor der Rasterung sind bereits im SVG alle Icons, Schriften und Styles lokal aufgelöst. Externe URLs oder nachgeladene Assets sind unzulässig.
- Überschreitet die resultierende Bitmap ein Browser- oder Speicherlimit, bricht der Export mit einer verständlichen Meldung ab, statt stillschweigend Auflösung oder Ausschnitt zu verändern.
- Für PNG sind Pixelabmessungen, nicht leere Ausgabe, Hintergrund, Farbfidelität und eine visuelle Regression gegen genau das zugrunde liegende SVG zu testen.

Ein transparenter PNG-Hintergrund sowie auswählbare Skalierungsfaktoren wie 1×, 2× und 4× sind mögliche spätere Ausbaustufen. Die erste Version bietet hierfür keine zusätzlichen Bedienelemente.

### 17.6 Phase 3 – PDF

PDF verwendet die in Phase 1 freigegebene SVG-Ausgabe als visuelle Quelle und darf nicht lediglich ein komprimiertes PNG in eine PDF-Hülle einbetten.

- Texte, Linien, Flächen, Icons und Konturen registrierter Capability-Formen werden aus dem SVG übernommen und bleiben soweit von der gewählten PDF-Bibliothek unterstützt vektorbasiert.
- Eine separate, redundante PDF-Zeichenimplementierung für Capability- oder Gruppengeometrien ist unzulässig. Notwendige PDF-spezifische Transformationen beschränken sich auf Seite, Skalierung, Metadaten und technisch erforderliche SVG-Kompatibilitätsanpassungen.
- Die erste PDF-Ausbaustufe erzeugt genau eine A3-Seite im Querformat mit umlaufend 10 mm Rand. Der vollständige Export-Frame einschließlich Titel, Legende, Metadaten und aktueller Darstellung wird proportional, zentriert und ohne Beschnitt in die verbleibende Inhaltsfläche eingepasst.
- Nicht von der Map belegte Restfläche bleibt weiß; das Seitenverhältnis der Darstellung wird niemals verzerrt.
- Dokumenttitel und Erzeuger werden aus Map-Name und Anwendung gesetzt; YAML-Inhalte oder Capability-Metadaten werden nicht ungefragt als PDF-Metadaten eingebettet.
- Für PDF sind Dateisignatur, Seitenzahl, Seitengröße, extrahierbare Texte, fehlender Beschnitt und visuelle Regressionen zu testen.

Eine dynamisch an das Map-Seitenverhältnis angepasste Seitengröße, auswählbare Standardformate und Orientierungen sowie eine automatische Mehrseitenaufteilung sind mögliche spätere Ausbaustufen.

### 17.7 Phase 4 – PPTX

PPTX ist wegen der erforderlichen Editierbarkeit und der Abbildung der verschachtelten Geometrie die letzte und eigenständig freizugebende Formatstufe.

- Die Ausgabe ist keine reine Screenshot-Folie. Gruppen, registrierte Capability-Flächen, Konturen und Texte werden soweit technisch möglich als einzeln bearbeitbare PowerPoint-Formen erzeugt.
- Capability-Namen bleiben editierbare Textinhalte. Lucide-Icons dürfen als eingebettete SVG-Grafiken vorliegen, sofern eine Umwandlung in editierbare Freiformpfade unverhältnismäßig oder nicht robust ist.
- Die Bestandteile einer Capability werden, sofern die gewählte Bibliothek dies robust unterstützt, als gemeinsam verschiebbares PowerPoint-Objekt gruppiert. Form, Rahmen und Texte bleiben nach dem Auflösen der Gruppierung einzeln editierbar; das Icon bleibt ein eingebettetes SVG.
- Visuelle Gruppencontainer bleiben eigenständige editierbare Hintergrundformen mit separatem editierbarem Namen. Eine rekursiv verschachtelte PowerPoint-Gruppierung entlang der fachlichen Hierarchie ist in der ersten Version nicht erforderlich.
- Fachliche IDs und Hierarchiebezüge werden intern in der Exportzuordnung erhalten, damit Tests und spätere Erweiterungen Elemente eindeutig zuordnen können; sie müssen nicht als sichtbarer Text erscheinen.
- Die visuelle Zeichenreihenfolge entspricht dem Szenenmodell. Gruppen liegen hinter ihren enthaltenen Capabilities, ohne deren Bearbeitbarkeit zu verhindern.
- Der Formenkatalog definiert je Shape eine PPTX-Strategie. Ein natives PowerPoint-Preset darf nur verwendet werden, wenn seine Geometrie nachweislich innerhalb der visuellen Toleranz zur kanonischen Form liegt; andernfalls wird aus dem kanonischen Pfad eine einzelne native editierbare Freiform erzeugt. Ein rasterisiertes Bild oder eingebettetes SVG ist für die Capability-Fläche selbst kein zulässiger Fallback.
- Der Export der aktuellen Darstellung erzeugt genau eine 16:9-Breitbildfolie. Der Map-Inhalt wird für den festen Folienbereich neu gelayoutet und füllt ihn ohne Leerraum, Beschnitt oder Verzerrung aus.
- Die erste PPTX-Ausbaustufe darf nicht umgesetzt werden, bevor durch einen technischen Spike nachgewiesen ist, dass die Referenzmap mit akzeptabler Geometrie-, Text- und Farbfidelität geöffnet und bearbeitet werden kann.
- Der technische Spike muss insbesondere die robuste Erzeugung, gemeinsame Verschiebbarkeit und spätere Auflösbarkeit der Capability-Objekte bestätigen. Ist dies mit der gewählten Bibliothek nicht zuverlässig möglich, wird vor der PPTX-Implementierung erneut entschieden und nicht stillschweigend auf eine einzige SVG-Grafik ausgewichen.
- Für PPTX sind OOXML-Struktur, Öffnen ohne Reparaturmeldung, Folienzahl und -größe, vorhandene editierbare Texte und Formen, Elementreihenfolge sowie visuelle Regressionen gegen die Bildschirmdarstellung zu testen.

#### 17.7.1 Eckenradien und native PowerPoint-Geometrie

Die PowerPoint-Ausgabe muss die festen Eckenradien des gemeinsamen Designsystems abbilden. Das unveränderte PowerPoint-Preset `roundRect` ist hierfür nicht ausreichend: Dessen Standardrundung wird relativ zur kürzeren Kante einer Form bestimmt und lässt dadurch insbesondere breite, flache Gruppen deutlich stärker gerundet erscheinen als in Web- und SVG-Darstellung.

Für alle gerundeten Flächen gelten deshalb folgende Regeln:

- Der gemeinsame Export-Style definiert den Radius in logischen Export-Einheiten. Gruppencontainer verwenden `10`, Capability-Boxen `9`. Pillenförmige Indikatoren wie Nachfahrenzähler bleiben davon getrennte, ausdrücklich kapselartige Komponenten.
- Der wirksame Radius ist `min(styleRadius, width / 2, height / 2)`. Damit bleibt der Radius bei normal großen Flächen absolut konstant und wird nur bei tatsächlich zu kleinen beziehungsweise eingeklappten Flächen geometrisch begrenzt.
- Die einheitliche PPTX-Gesamtskalierung wird nach dieser Begrenzung angewendet. Der physische Folienradius ergibt sich somit aus `effectiveRadius × placementScale`; er wird nicht je Form erneut relativ zu deren Seitenverhältnis bestimmt.
- Gruppen der ersten und zweiten Gruppenebene verwenden denselben Gruppenradius. Unterschiedliche Breiten, Höhen, Layout-Richtungen oder Verschachtelungstiefen dürfen die Rundungsstärke nicht verändern.
- Eingeklappte Gruppen behalten denselben Grundradius und verwenden lediglich die geometrische Begrenzung. Ein kapselartiges Ergebnis ist nur dann zulässig, wenn die kürzere Kante tatsächlich höchstens dem doppelten Designradius entspricht.
- Rechteckige Capability-Flächen und Gruppencontainer bestehen jeweils aus genau einer nativen editierbaren PowerPoint-Fläche mit gemeinsamem Füll- und Rahmenpfad. Übereinandergelegte Füll- und Rahmenformen mit voneinander abweichenden Radien sind unzulässig.
- Capability-Formen ohne gerundete Ecken, initial der Chevron, besitzen keinen Eckenradius. Legendenformen verwenden die vom Shape-Katalog gelieferte vereinfachte Geometrie des jeweils erklärten Konzepts; ein Gruppen-Legendensymbol muss ebenfalls einen explizit begrenzten Radius erhalten.
- Trennlinien für Gruppennamen und Capability-Header müssen vollständig innerhalb der zugehörigen Form liegen. Schneidet ihre Position den Bereich einer gerundeten Ecke, werden ihre Endpunkte bis hinter den Eckenbereich eingerückt; der Außenrahmen selbst bleibt unverändert.

Die PPTX-Adaption verwendet folgende technische Priorität:

1. Bevorzugt wird ein natives PowerPoint-`roundRect` mit explizit gesetztem OOXML-Anpassungswert. Für das DrawingML-Preset wird der Wert aus `effectiveRadius / min(width, height)` berechnet, auf den zulässigen Bereich begrenzt und für jede Form einzeln geschrieben.
2. Unterstützt die eingesetzte Bibliothek diesen Anpassungswert nicht über ihre öffentliche API, darf das erzeugte OOXML vor dem Download deterministisch nachbearbeitet werden. Die Form muss dabei ein einzelnes natives `roundRect` bleiben und weiterhin ohne Reparaturmeldung editierbar sein.
3. Nur falls die OOXML-Anpassung nachweislich nicht robust ist, darf eine einzelne native editierbare Freiform mit vier geraden Kanten und vier Viertelkreisbögen verwendet werden.

Nicht zulässig sind das unveränderte Standard-`roundRect`, ein rasterisiertes Gruppenbild, ein eingebettetes SVG als Gruppenfläche oder ein rein visuelles Kaschieren durch zusätzliche Eckformen.

Die Rundungsfidelität wird mit einer eigenen Referenzmatrix geprüft. Diese enthält mindestens eine sehr breite und flache Root-Gruppe, eine hohe schmale Gruppe, zwei verschachtelte Gruppen, eine eingeklappte Gruppe, eine kompakte Capability und eine Form nahe der Radiusbegrenzung. Die Abnahme umfasst:

- einen Strukturtest auf den je Form berechneten OOXML-Anpassungswert beziehungsweise die freigegebene native Freiformgeometrie;
- eine visuelle Regression der vier Ecken gegen das kanonische SVG bei identischer normalisierter Ausgabegröße;
- die Prüfung, dass Gruppen gleicher Styleklasse trotz unterschiedlicher Seitenverhältnisse denselben absoluten Radius besitzen;
- das Öffnen und erneute Speichern in PowerPoint ohne Reparaturmeldung sowie eine Renderprüfung mit dem automatisierten Office-Renderer;
- die Bestätigung, dass Füllung, Rahmen, Name und Trennlinie weiterhin separat beziehungsweise wie vereinbart editierbar und nicht beschnitten sind.

Als visuelle Toleranz gilt nach Normalisierung höchstens eine Abweichung von `1` logischen Export-Einheit beim Radius und höchstens `2` Rasterpixel in den Eckenvergleichsbildern. Ein deutlich pillenförmiger Gruppencontainer bei ausreichender Höhe ist unabhängig von der numerischen Toleranz ein Abnahmefehler.

Konfigurierbare Folienformate, eine frei konfigurierbare Folienplanung, editierbare Icon-Freiformpfade und rekursiv verschachtelte PowerPoint-Gruppen sind mögliche spätere Ausbaustufen.

#### 17.7.2 Vollständiger hierarchischer Mehrfolienexport

Das Exportmenü bietet getrennte Aktionen für `PPTX – aktuelle Darstellung` und `PPTX – vollständige Map`. Der vollständige Export verwendet ausschließlich die letzte gültige normalisierte Map und ignoriert Suche, Filter, Fokus sowie manuelle oder gespeicherte Capability- und Gruppen-Collapse-Zustände. Beide Modi werden vollständig lokal erzeugt und verändern weder UI-Zustand noch `localStorage`.

Der vollständige Export erzeugt folgende Folien in stabiler Reihenfolge; sämtliche Titel beginnen mit dem Namen der Capability Map aus dem YAML:

1. `<Map-Name> - Übersicht` zeigt Top-Gruppen als große, farbige und vollständig beschriftete Übersichtskacheln. Ungruppierte Root-Capabilities erscheinen als eigene Kacheln; tiefere Inhalte bleiben verborgen.
2. `<Map-Name> - Ebene 1` zeigt alle Gruppen geöffnet und ausschließlich die Root-Capabilities.
3. Danach folgt für jede Top-Gruppe in YAML-Reihenfolge eine Folie `<Map-Name> - Ebene 1 - <Top-Gruppe>`. Die aktuelle Top-Gruppe ist geöffnet, alle anderen Top-Gruppen bleiben als eingeklappter Strukturkontext sichtbar; ungruppierte Root-Capabilities werden ausgeblendet.
   Auf sämtlichen Ebene-1-Folien werden Nachfahrenzähler wie `+9` nicht dargestellt und weder in der Textmessung noch in der Mindestflächenberechnung reserviert. Die Folienstruktur macht bereits deutlich, dass weitere Detailfolien folgen; der dadurch frei werdende Raum steht vollständig für Capability-Namen zur Verfügung. Der aktuelle Einzelfolienexport und Detailfolien ab Ebene 2 behalten Nachfahrenzähler weiterhin bei.
   Ausschließlich die ungefilterte Gesamtfolie `<Map-Name> – Ebene 1` verwendet für Capability-Ebene 1 fest `7 pt` Arial Regular. Die Top-Gruppen-Fokusfolien derselben fachlichen Ebene behalten die deckweite bevorzugte Größe von `10 pt`. Die Ausnahme wird sowohl bei Textmessung und Mindestflächenberechnung als auch beim Rendering angewendet und verändert das deckweite Basisprofil nicht.
4. Ab Ebene 2 wird nicht mehr eine komplette Ebene mit allen gleichzeitig geöffneten Capability-Unterbäumen erzeugt. Stattdessen erhält jede Capability mit direkten Kindern in stabiler YAML-Tiefensuche genau eine Fokusfolie für ihre nächste Ebene. Der Pfad von der Top-Gruppe beziehungsweise Untergruppe bis zur fokussierten Capability ist geöffnet; die fokussierte Capability zeigt ihre direkten Kinder. Der Primärtitel folgt `<Map-Name> – Ebene N`. Die Kontextzeile enthält den Gruppenpfad und anschließend `Fokus: <Capability-Pfad>`; der Fokuspfad wird nicht zusätzlich in der Fußnote wiederholt.
5. Capability-Geschwister des Fokuspfads bleiben als kompakte Kontextboxen sichtbar, sind aber eingeklappt und tragen mit ihren Nachfahren nicht zur Flächenberechnung bei. Dadurch ist auf einer Detailfolie stets nur ein Capability-Unterbaum geöffnet. Capabilities außerhalb des aktuellen Gruppenpfads werden ausgeblendet.
6. Bei einer Capability innerhalb einer Untergruppe ist nur diese Untergruppe geöffnet. Andere Untergruppen und Top-Gruppen bleiben eingeklappt sichtbar; ungruppierte und direkt neben Untergruppen liegende Capabilities werden ausgeblendet. Direkt in einer Top-Gruppe liegende Capabilities verwenden denselben Fokuspfad ohne Untergruppenkontext.
7. Ungruppierte Root-Capabilities mit Nachfahren erhalten am Ende entsprechende Fokusfolien `<Map-Name> - Ebene N - Weitere Capabilities`; die Top-Gruppen bleiben dort eingeklappt. Blatt-Capabilities erzeugen keine eigene Detailfolie.

Die Anzahl der Folien wird damit deterministisch aus der Map abgeleitet: Zu Übersicht und Ebene-1-Folien kommt genau eine Detailfolie je Capability mit direkten Capability-Kindern. So bleibt der gesamte Baum enthalten, ohne Geschwister-Unterbäume gleichzeitig zu öffnen. Verschachtelte Capability-Container und ihre regulären Header bleiben vollständig erhalten; der Fokuspfad wird weder komprimiert noch aus der Szene entfernt. Reine Kontextlisten verteilen ihren verbleibenden Platz proportional zu ihrem sichtbaren Mindestbedarf und füllen ihren Slot sowohl horizontal als auch vertikal vollständig aus. Alle Folien eines Exportvorgangs verwenden denselben Erstellungszeitpunkt, dieselbe deckweite Legende und das Dateinamenschema `<map-id>-vollstaendig-YYYYMMDD-HHmmss.pptx`. Die Referenzmap erzeugt weiterhin `95` Folien.

Jede Folie verwendet das 16:9-Format `13,333 × 7,5` Zoll und folgende festen Bereiche:

- Titel: `x = 0,25`, `y = 0,25`, `w = 12,833`, `h = 0,80` Zoll;
- Map: `x = 0,25`, `y = 1,15`, `w = 12,833`, `h = 5,25` Zoll;
- Legende: `x = 0,25`, `y = 6,52`, `w = 12,833`, `h = 0,34` Zoll;
- Metadaten-Fußnote: `x = 0,25`, `y = 6,94`, `w = 12,833`, `h = 0,31` Zoll.

Der Titelbereich wird in eine Primär- und eine Kontextzeile geteilt. Der Primärtitel lautet `<Map-Name> – Übersicht` beziehungsweise `<Map-Name> – Ebene N` und verwendet fest `28 pt` Arial Bold. Im vollständigen Export liegt er als natives editierbares Textobjekt auf einem zum Primärtitel gehörenden PowerPoint-Folienlayout, damit seine feste Geometrie unabhängig von der Komplexität der Inhaltsfolie bleibt. Die optionale Kontextzeile verwendet `14 pt` Arial Regular. Auf Capability-Detailfolien lautet sie `<Top-Gruppe> [› <Untergruppe>] · Fokus: <Capability-Pfad>`; auf Gruppenfolien enthält sie weiterhin nur den Gruppenpfad. Der Fokus wird im Voll-Export nicht in der Metadaten-Fußnote dupliziert. Benötigt der Primärtitel ausnahmsweise zwei Zeilen, entfällt die Kontextzeile und ihr vollständiger Kontext wird zusätzlich in die Fußnote aufgenommen. Titel werden weder automatisch verkleinert noch abgeschnitten. Die deckweit identische Legende bildet die Vereinigungsmenge aller in den Folien vorkommenden Konzepte in stabiler Reihenfolge, verwendet fest `10 pt` und darf innerhalb ihres festen Bereichs auf zwei Zeilen umbrechen. Legendentexte werden niemals gekürzt oder automatisch verkleinert. Die Fußnote verwendet `8 pt`, enthält beim Voll-Export den Erstellungszeitpunkt und die Kennzeichnung als vollständiger Export und beim aktuellen Export zusätzlich Ansichtsprofil sowie gegebenenfalls Fokus und Filter. Eine Foliennummer wird nicht erzeugt.

Der Mapbereich wird je Folie direkt für sein festes Seitenverhältnis neu berechnet. Der vollständige Export besitzt dazu eine zweistufige Layoutphase: Zuerst werden deckweit Typografie, Textbedarf, Fokusrollen und mögliche Reflows bestimmt; anschließend wird jede Folie mit diesen Vorgaben neu gelayoutet. Die Layout-Engine teilt den vollständigen Bereich lückenlos unter den sichtbaren Root-Elementen auf; nachträgliches Strecken, proportionaler Restleerraum oder Beschneiden sind unzulässig. Regulärer und vollständiger PPTX-Export verwenden innerhalb der Map `8` logische Einheiten beziehungsweise ungefähr `0,06` Zoll für Gaps und Gruppen-Padding. Die Mindest-Innenabstände der Capability-Texte bleiben davon unberührt. Dadurch wird mehr Fläche fachlich genutzt, ohne benachbarte Konturen unmittelbar aneinanderzusetzen. Live-Ansicht, SVG, PNG und PDF behalten ihre bisherigen Abstände.

Capability-Namen verwenden PPTX-spezifisch Arial Regular. Übersichtskacheln und offene Gruppennamen verwenden Arial Bold, eingeklappte Gruppennamen dagegen Arial Regular. Der vollständige Export erzeugt einmalig ein `PptxTypographyProfile`, das für sämtliche Folien gilt. Die bevorzugten Gruppengrößen lauten: Übersichtskachel `16 pt`, offene Top-Gruppe `12 pt`, offene Untergruppe `10 pt`, eingeklappte Top-Gruppe `8 pt` und eingeklappte Untergruppe `7 pt`. Damit sind sämtliche Gruppennamen gegenüber v0.15 um `2 pt` reduziert; die Fettschrift offener Gruppen erhält ihre visuelle Hierarchie, während eingeklappter Kontext typografisch zurücktritt. Capability-Ebenen verwenden weiterhin `10 pt`, `8 pt`, `7 pt` und `6 pt`. Weitere Capability-Tiefen verwenden jeweils `90 %` der vorherigen Größe. Die numerische Abstufung gilt innerhalb der Gruppenleiter und innerhalb der Capability-Leiter strikt; an der Grenze zwischen Untergruppe und erster Capability-Ebene darf durch den unterschiedlichen Schriftschnitt dieselbe Punktgröße entstehen. Oberhalb von `7 pt` sind ausschließlich ganze Zahlen zulässig; darunter wird auf `0,1 pt` gerundet.

Die Berechnung beginnt bei der kleinsten vorhandenen Ebene und läuft strikt nach oben. Jede höhere semantische Ebene bleibt größer als die unmittelbar darunterliegende. Passt eine bevorzugte Größe trotz Fokuspriorisierung und Reflow nicht, wird sie für diese semantische Ebene deckweit und nicht nur auf einzelnen Folien reduziert; die Hierarchie bleibt dabei erhalten. Nach Ausschöpfen von Reflow und Icon-Ausblendung dürfen einzelne Capability-Namen mit Ellipse gekürzt werden. Überschreitet ein einzelnes nicht weiter umbrechbares Textfragment die verfügbare Breite jedoch nur um ein oder zwei abschließende Zeichen, wird es vollständig ohne Ellipse ausgegeben; erst ab mindestens drei zu entfernenden Zeichen greift die Kürzung. Der vollständige Name bleibt unabhängig davon im Objektnamen beziehungsweise Alternativtext erhalten. Der aktuelle Einzelfolienexport behält seine unabhängige, szenenbezogene Typografieberechnung.

Die Schriftgröße einer Capability-Ebene wird zunächst ohne Icons bestimmt. Anschließend werden Icons dieser Ebene deckweit nur dargestellt, wenn jede sichtbare Box der Ebene Icon und Text aufnehmen kann. Andernfalls werden alle Icons dieser Ebene auf allen Folien ausgeblendet; eine individuelle Icon-Ausblendung innerhalb derselben Ebene ist unzulässig. Sichtbare Icons verwenden gemeinsam `min(20 pt, Schriftgröße + 2 pt)`. Capability-Texte erhalten mindestens `0,08` Zoll horizontalen und `0,05` Zoll vertikalen Innenabstand; der Icon-Text-Abstand beträgt mindestens `0,06` Zoll. Der Platz des Nachfahrenzählers `+N` wird vor dem Umbruch aus der verfügbaren Textfläche herausgerechnet, sodass Badge und Name sich nicht überlagern.

Jedes sichtbare Element trägt für den vollständigen PPTX-Export eine Präsentationsrolle: `Fokus`, `Fokus-Ahne`, `direktes Fokus-Kind`, `eingeklappter Kontext` oder `reguläres Element`. Innerhalb jeder rekursiven Elementliste werden zuerst die textmetrischen Mindestflächen des Kontextes reserviert. Der Fokuspfad erhält seine vollständige lesbare Mindestfläche und anschließend den verbleibenden flexiblen Raum. `layerWeight` und `trackWeight` bleiben grundsätzlich erhalten, dürfen den Fokus auf Fokusfolien jedoch nicht unter sein lesbares Minimum drücken. Sind in einer konkreten Teil- oder Trackliste ausschließlich eingeklappte Kontextgruppen beziehungsweise Kontext-Capabilities sichtbar, wird der nach den Mindestflächen verbleibende Raum proportional unter diesen Elementen verteilt. Verdeckte Nachfahren eingeklappter Capability-Geschwister beeinflussen den Bedarf nicht. Der Mapbereich bleibt auf jeder Rekursionsebene vollständig gekachelt.

Eingeklappte Top-Gruppen verwenden als bewusste Kontextausnahme `8 pt`, eingeklappte Untergruppen `7 pt`, jeweils Arial Regular. Sie werden durch geringere Sättigung und schwächere Konturen zurückgenommen. Ihre Beschriftungsrichtung folgt der tatsächlich zugewiesenen Geometrie: hohe schmale Streifen verwenden eine um 90 Grad gedrehte Beschriftung, breite flache Streifen eine horizontale Beschriftung. Ausschließlich das niedrigste konkrete Fokusziel erhält die grüne Akzentkontur; Fokus-Ahnen behalten ihre normale Kontur. Die Rollen werden weiterhin im Szenenmodell transportiert, damit Layout und Renderer dieselbe Bedeutung verwenden.

Textbreiten, Icons, Innenabstände und Nachfahrenzähler werden vor dem Layout vermessen und als generische Mindestbedarfs- und Prioritätshinweise an die gemeinsame Layout-Engine übergeben. Ohne diese optionalen Hinweise bleiben Live-Ansicht, SVG, PNG und PDF unverändert. Buchstabenweises Umbrechen ist unzulässig. Namen umbrechen ausschließlich an Wörtern, vorhandenen Trennzeichen oder expliziten weichen Trennstellen; andernfalls greift die Ellipse. Ein-Zeichen-Zeilen dürfen nicht durch den Layoutalgorithmus erzeugt werden.

Zu schmale Wertstromsequenzen werden ausschließlich an Segmentgrenzen in mehrere geordnete Bänder umgebrochen. YAML-Flushes bleiben harte Grenzen; automatisch erzeugte weiche Flushes existieren nur in einer abgeleiteten PPTX-Struktur. Reihenfolge und Shape-Typ bleiben erhalten, und jedes Band füllt seine Breite vollständig. Kann nach diesem Reflow keine lesbare Segmentbreite erreicht werden, wird die gesamte Sequenz für diese Folie als Boxen gerendert. Der normalisierte Baum und der Browserzustand werden dabei nicht verändert; zusätzliche Überlauffolien entstehen nicht.

Labelspalten offener horizontaler Gruppen werden aus Schriftgröße, vollständigem Namen und mindestens `0,08` Zoll Innenabstand berechnet. Reicht die Gruppenhöhe nicht für eine vollständige vertikale Beschriftung, wechselt ausschließlich das Label auf einen horizontalen Header; die YAML-Layoutlogik der Gruppeninhalte bleibt unverändert. Verschachtelte Capability-Container und ihre regulären Header bleiben vollständig sichtbar.

#### 17.7.3 Optionale Ausbaustufe – native Lucide-Geometrien

In der ersten PPTX-Version bleiben Lucide-Icons wie vereinbart als eingebettete SVG-Bilder erhalten. PowerPoint behandelt diese als importierte Bilder und fordert beim späteren Gruppieren beziehungsweise Zerlegen gegebenenfalls zur manuellen Konvertierung in ein Microsoft-Office-Zeichenobjekt auf. Diese Einschränkung wird für die erste Version bewusst akzeptiert; der Export darf weder eine installierte PowerPoint-Instanz noch Betriebssystemautomation voraussetzen.

Bei entsprechendem Bedarf kann der PPTX-Adapter später native Office-Zeichenobjekte statt SVG-Bilder erzeugen. Ziel dieser optionalen Ausbaustufe ist, dass ein Icon ohne vorgelagerten Konvertierungsdialog unmittelbar mit Capability-Fläche, Text oder weiteren Objekten gruppiert und in PowerPoint bearbeitet werden kann.

Für diese Ausbaustufe gelten folgende Leitplanken:

- Die Änderung betrifft ausschließlich PPTX. SVG, PNG und PDF verwenden weiterhin die vorhandenen Lucide-Vektorpfade beziehungsweise das kanonische SVG.
- Ein Icon wird bevorzugt als einzelnes natives `p:sp` mit DrawingML-`a:custGeom` ausgegeben. Benötigt seine Geometrie mehrere eigenständige Office-Formen, werden diese als ein gemeinsames `p:grpSp` gekapselt.
- Die Konvertierung erhält die Lucide-`24 × 24`-Koordinaten, Skalierung, Strichstärke, Farbe, Transparenz sowie runde Linienenden und Linienverbindungen.
- Unterstützt werden müssen alle im installierten Lucide-Katalog vorkommenden Grundelemente und SVG-Pfadbefehle. Eine nur auf die Referenzmap oder eine Whitelist zugeschnittene Teilimplementierung ist unzulässig.
- Das Ergebnis darf für Lucide-Icons keine `p:pic`-, `svgBlip`- oder rasterisierte Ersatzdarstellung mehr benötigen. Andere zukünftig erlaubte Bildinhalte bleiben davon unberührt.
- Die Konvertierung erfolgt vollständig im Browser und muss im Standalone-Build ohne externe Dienste, PowerPoint-Installation oder plattformspezifische Office-Automation funktionieren.
- Ist eine katalogweite visuelle und strukturelle Konvertierung nicht robust erreichbar, bleibt der bestehende SVG-Exportpfad aktiv; es erfolgt kein stillschweigender Wechsel auf unvollständige native Geometrien.

Vor einer Freigabe sind mindestens ein katalogweiter Konvertierungs-Smoke-Test, Strukturtests auf native DrawingML-Formen, visuelle Regressionen für einfache, kreisförmige, mehrteilige und komplexe Icons sowie ein manueller Gruppierungs- und Bearbeitungstest in PowerPoint erforderlich. Die Präsentation muss weiterhin ohne Reparaturmeldung geöffnet werden können und darf durch die nativen Icons keine unvertretbare Zunahme von Dateigröße oder Erzeugungsdauer erfahren.

### 17.8 Implementierungsreihenfolge und Freigabegates

Die Umsetzung erfolgt strikt schrittweise:

0. **Export-Fundament:** Szenenmodell, gemeinsame Bounds- und Styleauflösung, Exportzustand sowie Testhilfen; noch kein öffentliches Dateiformat.
1. **SVG:** selbstständigen Vektorexport als kanonische visuelle Ausgabe implementieren, testen und fachlich abnehmen.
2. **PNG:** das freigegebene SVG rasterisieren, testen und fachlich abnehmen.
3. **PDF:** einseitigen vektorbasierten Dokumentexport implementieren, testen und fachlich abnehmen.
4. **PPTX:** editierbaren Präsentationsexport nach separatem Spike und den noch offenen Detailentscheidungen implementieren.

Eine Phase beginnt erst, wenn die vorherige Phase ihre formatbezogenen Abnahmekriterien erfüllt und keine offenen Fehler im gemeinsamen Szenenmodell verdeckt. Implementierungen dürfen intern Vorarbeiten für spätere Formate enthalten, deren UI-Aktionen bleiben jedoch bis zur jeweiligen Freigabe verborgen.

### 17.9 Abnahmekriterien der Export-Erweiterung

Die gesamte Export-Erweiterung gilt als abgeschlossen, wenn:

1. PNG, SVG, PDF und PPTX über dieselbe formatneutrale Szene dieselbe aktuelle fachliche Darstellung ausgeben;
2. Zoom, Pan und UI-Chrome die Exportgrenzen nicht beeinflussen;
3. alle Dateien vollständig lokal und auch im Standalone-Build erzeugt werden;
4. Farben, Icons, Texte, Umbrüche, Gruppen, alle in der Darstellung verwendeten registrierten Capability-Formen und sichtbare Collapse-Strukturen formatgerecht erhalten bleiben;
5. jedes Format seinen korrekten MIME-Typ, Dateinamen und eine nicht leere valide Datei liefert;
6. SVG keine externen Referenzen oder Skripte enthält;
7. PDF die vollständige Darstellung ohne Beschnitt auf der vereinbarten Seite enthält und Text soweit vorgesehen extrahierbar bleibt;
8. PPTX ohne Reparaturmeldung geöffnet werden kann und die vereinbarten Texte und Formen editierbar sind;
9. automatisierte Struktur-, Download- und visuelle Regressionstests für alle vier Formate erfolgreich sind;
10. jede Formatphase separat fachlich abgenommen wurde, bevor das nachfolgende Format öffentlich freigeschaltet wird.
11. PPTX-Gruppen und Capability-Boxen die absoluten Eckenradien des gemeinsamen Szenenmodells unabhängig von ihrem Seitenverhältnis innerhalb der in Abschnitt 17.7.1 festgelegten Toleranzen wiedergeben.

## 18. Ausbaustufen

Priorisierte Weiterentwicklung nach dem MVP:

1. Export-Fundament und SVG gemäß Abschnitt 17;
2. PNG-Export durch Rasterisierung des SVGs;
3. PDF-Export;
4. PPTX-Export als letzte Exportphase;
5. optional native, unmittelbar gruppierbare Lucide-Geometrien im PPTX-Export;
6. zusätzliche integrierte Capability-Formen wie Raute, Hexagon, Pfeil oder Pill einschließlich ihrer Formrestriktionen, sicheren Inhaltsbereiche, Legenden und PPTX-Strategien;
7. Dateiimport und -download, Laden beim Build sowie Laden über URL;
8. Datenmengen deutlich oberhalb der verbindlichen 500-Capability-Referenzmap mit weitergehendem Profiling, Virtualisierung oder alternativen Renderstrategien;
9. visuelle Bearbeitung mit kontrollierter Rückschreibung ins YAML;
10. Backend, Versionierung und Zusammenarbeit;
11. mehrere UI-Sprachen;
12. formale Barrierefreiheit und optimierte Smartphone-Nutzung;
13. alternative Darstellungen wie Baum oder Treemap.

Die noch offenen Exportentscheidungen werden formatbezogen in Abschnitt 17.9 geführt und vor Beginn der jeweiligen Phase bestätigt.

## 19. Architekturquellen

- [React Flow: Sub Flows](https://reactflow.dev/learn/layouting/sub-flows)
- [React Flow: Layouting](https://reactflow.dev/learn/layouting/layouting)
- [React Flow: Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- [React Flow: NodeProps](https://reactflow.dev/api-reference/types/node-props)
- [React Flow: Shapes Example](https://reactflow.dev/examples/nodes/shapes)
- [React Flow: Utility Classes](https://reactflow.dev/learn/customization/utility-classes)
- [React Flow: Accessibility](https://reactflow.dev/learn/advanced-use/accessibility)
- [CodeMirror Documentation](https://codemirror.net/docs/)
- [Vite Features](https://vite.dev/guide/features.html)

## 20. Bestätigte Detailentscheidungen

1. `owner` ist im MVP genau ein optionaler String für die primäre Verantwortung. `responsibilities` bleibt eine optionale String-Liste; weitere Beteiligte können über `metadata` beschrieben werden.
2. Das MVP liefert ausschließlich ein helles Theme aus. Zentrale Design-Tokens bereiten spätere Themes vor.
3. Metadatenfilter entstehen automatisch aus vorhandenen filterbaren Werten; das YAML enthält im MVP keine Filterkonfiguration.
4. Der manuelle Collapse-Zustand wird separat in `localStorage`, niemals im YAML, gespeichert. Fokus, Auswahl, Suche und Filter werden beim Neuladen zurückgesetzt.
5. Gruppen enthalten mindestens eine Capability, bleiben bei Filtern immer strukturell sichtbar und zeigen ihren vollständigen Namen auch im eingeklappten farbigen Platzhalter.
6. Gruppen der zweiten Ebene sind ausschließlich direkt in einer Root-Gruppe zulässig. Gruppen innerhalb von Capability-`children` und eine dritte Gruppenebene sind verboten.
7. Ein `horizontal`-Flush beginnt rechts einen neuen Track; ein `vertical`-Flush beginnt darunter ein neues Band. Jede Elementliste darf beliebig viele Flushes beider Richtungen enthalten und abwechseln. Führende, abschließende und direkt aufeinanderfolgende Flushes sind ungültig.
8. `visualization.shape` referenziert einen integrierten, erweiterbaren Formenkatalog; initial sind `box` und `chevron` zulässig. Der Chevron ist ausschließlich für Blatt-Capabilities zulässig. Vertikale Elemente verwenden einen vollflächigen Rechts-Chevron mit einem einzigen Füll- und Konturpfad; horizontal gestapelte Elemente werden über die katalogisierte Ersatzdarstellung vollständig wie normale Boxen dargestellt.
9. Explizite `trackWeight`- und `layerWeight`-Werte überschreiben die jeweilige automatische Bedarfsableitung. Automatische Gewichte werden relativ zum Median normalisiert und initial auf `0,5` bis `3` begrenzt.
10. Das bisherige `layout.weight` wird durch `layout.layerWeight` ersetzt, nicht als Alias unterstützt und als Validierungsfehler mit Migrationshinweis behandelt.
11. Die komplexe Referenzmap mit circa 500 Capabilities ist zugleich das standardmäßig geladene Startbeispiel und das Ziel von „Auf Beispiel zurücksetzen“.
12. Der Fokusmodus wird ausschließlich per Doppelklick auf eine Capability oder Gruppe aktiviert; sichtbare Fokus-Schaltflächen entfallen. Ein Gruppen-Doppelklick darf nicht zusätzlich den Collapse-Zustand umschalten.
13. Ein- und Ausklappen löst kein automatisches `fitView` aus. Das betätigte Element bleibt als Viewport-Anker stabil; Fokusziele werden beim Eintritt beziehungsweise Wechsel einmalig eingepasst und der ursprüngliche Viewport wird nach Verlassen des Fokusmodus wiederhergestellt.
14. Ohne gespeicherten Ansichtsstatus startet die Map in „Ebene 1“. Manuelle Collapse-Zustände und das Ansichtsprofil werden ausschließlich lokal gespeichert; alte `overview`-Zustände werden auf „Ebene 1“ migriert.
15. Die Referenzmap enthält fünf fachliche Hauptgruppen mit null bis drei Untergruppen und verwendet Chevrons nur für zusammenhängende Wertströme.
16. Jede rekursive Elementliste teilt ihren verfügbaren Inhaltsbereich vollständig unter den aktuell sichtbaren Elementen auf. Verdeckte Ebenen beeinflussen weder automatische Track- noch Layer-Gewichte; kompakte Blattmaße dürfen keine leeren Slot-Restflächen erzeugen.
17. Der Export wird schrittweise als SVG, daraus rasterisiertes PNG, vektorbasiertes PDF und zuletzt PPTX umgesetzt. Jede Formatphase wird separat getestet und abgenommen; PPTX beginnt erst nach einem technischen Editierbarkeits-Spike.
18. SVG, PNG und PDF geben ausschließlich die aktuell erzeugte fachliche Darstellung einschließlich Ansichtsprofil, Filter, Fokus und Collapse-Zustand aus. PPTX bietet zusätzlich einen vollständigen UI-unabhängigen Mehrfolienexport.
19. PNG besitzt in der ersten Version einen weißen Hintergrund und wird mit einem festen Skalierungsfaktor von 2× aus dem SVG rasterisiert. Transparenz und wählbare Auflösungen bleiben mögliche spätere Ausbaustufen.
20. PDF erzeugt zunächst genau eine A3-Seite im Querformat mit 10 mm Rand und proportional eingepasster aktueller Darstellung. Dynamische Seitengrößen, Formatwahl und Mehrseitenaufteilung bleiben mögliche spätere Ausbaustufen.
21. PPTX bietet getrennte Aktionen für die einseitige aktuelle Darstellung und den vollständigen hierarchischen Mehrfolienexport. Beide verwenden feste Titel-, Map-, Legenden- und Fußnotenbereiche; der Mapbereich wird ohne Leerraum, Beschnitt oder Verzerrung vollständig neu gelayoutet.
22. PPTX bildet Gruppenflächen und registrierte Capability-Formen als native editierbare Formen sowie Namen und Zähler als editierbare Texte ab. Ein geometrisch passendes PowerPoint-Preset wird bevorzugt, andernfalls eine einzelne editierbare Freiform aus dem kanonischen Pfad. Icons werden als SVG eingebettet. Capability-Bestandteile werden möglichst als gemeinsam verschiebbare, auflösbare Objekte gruppiert; rekursiv verschachtelte PowerPoint-Gruppen und editierbare Iconpfade sind nicht Teil der ersten Version.
23. Alle Exportformate enthalten den Map-Namen als Titel oberhalb der Darstellung sowie eine Legende und ausgewählte Metadaten, insbesondere den Erstellungszeitpunkt. Diese Inhalte werden im gemeinsamen Export-Frame modelliert und formatspezifisch nicht redundant aufgebaut.
24. Im Export-Frame steht der Map-Name links oben. Rechts oben erscheinen Erstellungszeitpunkt mit Zeitzone und Ansichtsprofil sowie nur bei Bedarf Fokuspfad und aktive Filter. Unterhalb der Map erklärt eine dynamische Legende ausschließlich die tatsächlich vorkommenden Konzepte.
25. Exportdateien verwenden das Muster `<map-id>-<ansichtsprofil>-YYYYMMDD-HHmmss.<endung>` mit lokalem Exportzeitpunkt. Ein konfigurierbarer Dateinamenpräfix bleibt eine mögliche spätere Ausbaustufe.
26. Gerundete Exportflächen besitzen absolute Radien im gemeinsamen Szenenmodell: Gruppen `10`, Capability-Boxen `9` logische Einheiten. PPTX muss diese Radien über einen expliziten nativen OOXML-Anpassungswert oder als nachgewiesenen Fallback über eine einzelne editierbare Freiform wiedergeben; das seitenverhältnisabhängige Standard-`roundRect` ist nicht zulässig.
27. Lucide-Icons bleiben in der ersten PPTX-Version eingebettete SVG-Bilder. Ihre browserbasierte Konvertierung in katalogweit unterstützte native DrawingML-Geometrien wird als optionale Ausbaustufe gemäß Abschnitt 17.7.3 dokumentiert und erst bei ausreichendem fachlichem Bedarf umgesetzt.
28. Der Fokus auf eine Capability öffnet temporär genau deren direkte nächste Capability-Ebene. Der Gruppenfokus öffnet die fokussierte Gruppe und zeigt ihre direkten Inhalte; direkt enthaltene Capabilities werden dabei nicht ihrerseits automatisch geöffnet. Beide Overrides verändern weder manuelle Collapse-Sets noch Ansichtsprofil oder `localStorage`.
29. Die Breadcrumb-Navigation ist immer sichtbar. Ohne Fokus zeigt sie nur die Map-Wurzel; mit Fokus zeigt sie den vollständigen strukturellen Pfad einschließlich Gruppen und Capability-Ahnen und erlaubt die Navigation zu jedem fokussierbaren Ahnen.
30. Fokusziel, Breadcrumb und Exportpfad basieren auf einem gemeinsamen normalisierten Hierarchieindex für Capabilities und Gruppen.
31. Alle Capability-Formen werden innerhalb eines gemeinsamen React-Flow-Custom-Nodes durch eine SVG-Shape-Surface und eine darüberliegende semantische HTML-Inhaltsebene gerendert. Ein neuer React-Flow-Node-Typ pro Form ist nicht vorgesehen.
32. Der formatneutrale Shape-Katalog ist die einzige Quelle für Vektorpfad, sicheren Inhaltsbereich, Konturregeln, Ersatzdarstellung, Legendengeometrie und Exportstrategie. Bildschirm- und Exportadapter dürfen Formpunkte nicht separat nachbauen.
33. Direkt aufeinanderfolgende Rechts-Chevrons überlappen sich nicht, besitzen jeweils eine vollständige gleichmäßige Kontur und werden durch `4` logische Einheiten getrennt. Die Kontur wird niemals durch ineinandergelegte Polygone oder CSS-Clip-Flächen simuliert.
34. Der vollständige PPTX-Export ignoriert den UI-Zustand, erzeugt hierarchisch geordnete Ebene-1- sowie Capability-Fokusfolien und verwendet deckweit eine identische Legende. Jede verzweigende Capability erhält genau eine Folie für ihre direkte nächste Ebene; Geschwister-Unterbäume bleiben dort eingeklappt. Die hierarchisch strikt absteigende Typografieleiter wird einmal für das gesamte Deck aufgelöst; Icons werden je Capability-Tiefe deckweit ausschließlich vollständig oder gar nicht dargestellt. Fokusrollen, textmetrische Mindestbedarfe und weiche Wertstrom-Flushes beeinflussen ausschließlich das abgeleitete PPTX-Layout und verändern weder normalisierte Map noch Browserzustand.
