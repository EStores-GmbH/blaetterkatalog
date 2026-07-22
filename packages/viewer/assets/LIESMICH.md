# Mitgelieferte Hintergründe

Hier liegt das Standard-Hintergrundbild des Viewers.

| Datei | Verwendung |
| --- | --- |
| `hintergrund-holz.jpg` | Voreinstellung für jeden Katalog ohne eigene Angabe |

## Anforderungen

- **Format:** JPEG, PNG, WebP oder AVIF
- **Kachelbar** (nahtlos, unter 600 px Kantenlänge) **oder** großes Foto ab 1600 px.
  Der Viewer erkennt anhand der Bildgröße selbst, ob er kachelt oder füllt —
  Schwelle und Regel stehen in `../src/hintergrund.ts`.
- **Dateigröße:** möglichst unter 300 KB. Das Bild wird bei jedem Katalogaufruf
  geladen und steht im Budget aus `.size-limit.json`.
- **Rechte:** Nur Bilder verwenden, für die eine Nutzungslizenz vorliegt.
  Herkunft und Lizenz bitte unten vermerken.

## Herkunft

| Datei | Quelle | Lizenz |
| --- | --- | --- |
| `hintergrund-holz.jpg` | *(noch einzutragen)* | *(noch einzutragen)* |

## Je Katalog überschreiben

```bash
npm run katalog-build -- katalog.pdf --hintergrund pfad/zu/eigenem-holz.jpg
```

Die Datei wird in den Katalogordner kopiert; die `katalog.json` verweist dann
relativ darauf. Der Katalogordner bleibt damit für sich allein vollständig.
