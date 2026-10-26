# Deviation Report Demo

Abweichungsbericht für eine **fiktive** Verpackungslinie (Northwind Snacks, Linie 3 – Müsliriegel). Deutsche Oberfläche.

> Demo mit erfundenen Daten. Kein echtes System. Alle Firmen, Personen, Aufträge und Chargen sind ausgedacht.

Live: https://deviation-report-demo.vercel.app

## Funktionen

- Formular in 8 Abschnitten: Was ist passiert · Ort/Linie/Maschine · Zeitpunkt · Auftrag/Charge · Auswirkung/Risiko · Sofortmaßnahme · Ursache (vorläufig) · Unterschriften
- 4-Augen-Prinzip: Ersteller/in und Prüfer/in müssen verschiedene Personen sein
- Abschluss nur bei vollständigen Daten (zod), danach schreibgeschützt
- PDF-Import (pdf.js, Textebene) mit Vorschau vor der Übernahme; Beispiel-PDF unter `public/`
- Liste gespeicherter Berichte (localStorage, Schema-Prüfung, Sicherung unlesbarer Daten)
- Druckbare A4-Ansicht

Fiktive Formate: Auftrag `A3-2026-0412`, Charge `NW-261026-L3A`, Bericht `DR-2026-0001`.

## Entwicklung

```bash
npm ci
npm run dev
npm test               # führt vorher den Leak-Guard aus
npm run build          # führt vorher den Leak-Guard aus
npm run guard:history
npm run sample-pdf     # Beispiel-PDF neu erzeugen
```
