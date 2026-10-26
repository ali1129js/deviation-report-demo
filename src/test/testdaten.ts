import { leereDaten, type BerichtDaten } from "../lib/schema";

export const gueltigeDaten = (): BerichtDaten => ({
  ...leereDaten(),
  titel: "Untergewicht an Kontrollwaage",
  beschreibung: "Kontrollwaage sortiert zu viele Packungen aus.",
  linie: "Linie 3",
  bereich: "Bereich A – Schlauchbeutel",
  maschine: "Kontrollwaage",
  datum: "2026-10-26",
  uhrzeit: "09:42",
  auftrag: "A3-2026-0412",
  charge: "NW-261026-L3A",
  risiko: "mittel",
  sofortmassnahme: "Linie gestoppt, Waage neu kalibriert.",
  ursacheKategorie: "Maschine",
  ersteller: { name: "Tilda Morgenstern", zeit: "2026-10-26T09:50:00.000Z" },
  pruefer: { name: "Lasse Brückner", zeit: "2026-10-26T10:05:00.000Z" },
});
